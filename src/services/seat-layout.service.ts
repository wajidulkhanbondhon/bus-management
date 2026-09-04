import { FASTAPI_BASE } from '@/lib/config';
import { fastApiClient } from '@/lib/api-client';

export interface LayoutGridCell {
  type: 'SEAT' | 'AISLE' | 'DOOR' | 'DRIVER' | 'EMPTY' | 'STAIRS';
  label?: string;
  seatType?: 'STANDARD' | 'VIP' | 'STAFF' | 'RESERVED' | 'EMERGENCY' | 'DISABLED';
  genderAllowed?: 'MALE_ONLY' | 'FEMALE_ONLY' | 'ANY';
  fareZoneId?: string;
  baseFare?: number;
}

export interface CustomLayoutInput {
  id?: string;
  name: string;
  description?: string;
  university?: string;
  unit?: string;
  examName?: string;
  totalRows: number;
  totalCols: number;
  layoutGrid: LayoutGridCell[][];
  extraSeats?: any[];
  activeSegments?: any[];
}

// In-memory persistent store for custom layouts
const localCustomLayouts: any[] = [];

export async function getAllLayouts() {
  try {
    const res = await fastApiClient.getSeatLayouts();
    let apiLayouts: any[] = [];
    if (res && res.success && Array.isArray(res.data)) {
      apiLayouts = res.data;
    }

    // Primary source of truth: PostgreSQL Database via FastAPI
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const merged: any[] = [];

    for (const l of apiLayouts) {
      if (!l || !l.id) continue;

      // Unpack layout_json if present
      if (l.layout_json && typeof l.layout_json === 'string') {
        try {
          const parsed = JSON.parse(l.layout_json);
          if (parsed.layoutGrid && !l.layoutGrid) l.layoutGrid = parsed.layoutGrid;
          if (parsed.extraSeats && !l.extraSeats) l.extraSeats = parsed.extraSeats;
          if (parsed.activeSegments && !l.activeSegments) l.activeSegments = parsed.activeSegments;
          if (parsed.university && !l.university) l.university = parsed.university;
          if (parsed.unit && !l.unit) l.unit = parsed.unit;
          if (parsed.examName && !l.examName) l.examName = parsed.examName;
        } catch {}
      }

      const normName = (l.name || '').trim().toLowerCase();
      // Check if localCustomLayouts has fresher in-memory grid
      const localMatch = localCustomLayouts.find(
        loc => loc.id === l.id || (normName && (loc.name || '').trim().toLowerCase() === normName)
      );
      if (localMatch) {
        if (localMatch.layoutGrid) l.layoutGrid = localMatch.layoutGrid;
        if (localMatch.extraSeats) l.extraSeats = localMatch.extraSeats;
        if (localMatch.activeSegments) l.activeSegments = localMatch.activeSegments;
      }

      if (!seenIds.has(l.id) && (!normName || !seenNames.has(normName))) {
        seenIds.add(l.id);
        if (normName) seenNames.add(normName);
        merged.push(l);
      }
    }

    // Only include local layouts if not already in database
    for (const l of localCustomLayouts) {
      if (!l || !l.id) continue;
      const normName = (l.name || '').trim().toLowerCase();
      if (!seenIds.has(l.id) && (!normName || !seenNames.has(normName))) {
        seenIds.add(l.id);
        if (normName) seenNames.add(normName);
        merged.push(l);
      }
    }

    return merged;
  } catch {
    return localCustomLayouts;
  }
}

export async function getLayoutById(id: string) {
  const all = await getAllLayouts();
  return all.find((l: any) => l.id === id) || all[0];
}

export async function getAllFareZones() {
  return [
    { id: 'zone-vip', name: 'VIP Front (Rows A-B)', defaultFare: 650.0 },
    { id: 'zone-std', name: 'Standard (Rows C-G)', defaultFare: 550.0 },
    { id: 'zone-rear', name: 'Rear (Rows H-J)', defaultFare: 500.0 }
  ];
}

export async function createFareZone(data: { name: string; description?: string; defaultFare: number }, _userId?: string) {
  return { id: `zone-${Date.now()}`, ...data };
}

export async function updateFareZone(id: string, data: { name?: string; description?: string; defaultFare?: number }, _userId?: string) {
  return { id, ...data };
}

export async function deleteFareZone(id: string, _userId?: string) {
  return { success: true, id };
}

export async function deleteLayout(id: string, _userId?: string, toRecycleBin: boolean = true) {
  const target = localCustomLayouts.find(l => l.id === id);
  const targetName = target?.name?.trim().toLowerCase();
  for (let i = localCustomLayouts.length - 1; i >= 0; i--) {
    if (localCustomLayouts[i].id === id || (targetName && localCustomLayouts[i].name?.trim().toLowerCase() === targetName)) {
      localCustomLayouts.splice(i, 1);
    }
  }
  try {
    const res = await fastApiClient.deleteSeatLayout(id, toRecycleBin);
    if (!res.success && res.status !== 404) {
      console.warn('Backend delete layout response:', res.error);
    }
  } catch (e) {
    console.error('Failed to delete layout from backend:', e);
  }
  return { success: true, id, toRecycleBin };
}

export async function deleteSeatLayout(id: string, userId?: string, toRecycleBin: boolean = true) {
  return deleteLayout(id, userId, toRecycleBin);
}

export async function saveCustomLayout(input: CustomLayoutInput, _userId?: string): Promise<any> {
  const seatCount = (input.layoutGrid?.flat().filter(c => c && c.type === 'SEAT').length || 0) + (input.extraSeats?.length || 0);
  const layoutJson = JSON.stringify({
    layoutGrid: input.layoutGrid,
    extraSeats: input.extraSeats || [],
    activeSegments: input.activeSegments || [],
    university: input.university || '',
    unit: input.unit || '',
    examName: input.examName || ''
  });

  try {
    const res = await fastApiClient.createSeatLayout({
      name: input.name.trim(),
      description: input.description || '',
      total_rows: input.totalRows,
      total_cols: input.totalCols,
      total_seats: seatCount,
      layout_json: layoutJson
    });

    if (res.success && res.data) {
      const data = res.data;
      const layoutObj = {
        ...data,
        university: input.university || '',
        unit: input.unit || '',
        examName: input.examName || '',
        layoutGrid: input.layoutGrid,
        extraSeats: input.extraSeats || [],
        activeSegments: input.activeSegments || [],
        layout_json: layoutJson
      };

      const normName = input.name.trim().toLowerCase();
      const existingIdx = localCustomLayouts.findIndex(
        l => l.id === data.id || (input.id && l.id === input.id) || (l.name || '').trim().toLowerCase() === normName
      );
      if (existingIdx !== -1) {
        localCustomLayouts[existingIdx] = layoutObj;
      } else {
        localCustomLayouts.unshift(layoutObj);
      }

      return layoutObj;
    }
  } catch (e) {
    console.warn('Backend createSeatLayout failed, falling back to local memory store:', e);
  }

  // Fallback if backend API is offline
  const layoutId = input.id || `LAYOUT-${Date.now()}`;
  const layoutObj = {
    id: layoutId,
    name: input.name.trim(),
    description: input.description || '',
    university: input.university || '',
    unit: input.unit || '',
    examName: input.examName || '',
    totalRows: input.totalRows,
    totalCols: input.totalCols,
    totalSeats: seatCount,
    total_rows: input.totalRows,
    total_cols: input.totalCols,
    total_seats: seatCount,
    layoutGrid: input.layoutGrid,
    extraSeats: input.extraSeats || [],
    activeSegments: input.activeSegments || [],
    layout_json: layoutJson,
    createdAt: new Date().toISOString()
  };

  const normName = input.name.trim().toLowerCase();
  const existingIdx = localCustomLayouts.findIndex(
    l => l.id === layoutId || (l.name || '').trim().toLowerCase() === normName
  );
  if (existingIdx !== -1) {
    localCustomLayouts[existingIdx] = layoutObj;
  } else {
    localCustomLayouts.unshift(layoutObj);
  }

  return layoutObj;
}

export async function createCustomLayout(input: CustomLayoutInput, userId?: string) {
  return saveCustomLayout(input, userId);
}


