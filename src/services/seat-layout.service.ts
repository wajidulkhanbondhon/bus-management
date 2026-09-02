import { FASTAPI_BASE } from '@/lib/config';

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
}

// In-memory persistent store for custom layouts
const localCustomLayouts: any[] = [];

export async function getAllLayouts() {
  try {
    const res = await fetch(`${FASTAPI_BASE}/buses/seat-layouts`, { cache: 'no-store' }).catch(() => null);
    let apiLayouts: any[] = [];
    if (res && res.ok) {
      apiLayouts = await res.json();
    }
    const merged = [...localCustomLayouts];
    for (const l of apiLayouts) {
      if (!merged.some(item => item.id === l.id)) {
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

export async function deleteLayout(id: string, _userId?: string) {
  const idx = localCustomLayouts.findIndex(l => l.id === id);
  if (idx !== -1) {
    localCustomLayouts.splice(idx, 1);
  }
  try {
    await fetch(`${FASTAPI_BASE}/buses/seat-layouts/${id}`, { method: 'DELETE', cache: 'no-store' }).catch(() => null);
  } catch {}
  return { success: true, id };
}

export async function deleteSeatLayout(id: string, userId?: string) {
  return deleteLayout(id, userId);
}

export async function saveCustomLayout(input: CustomLayoutInput, _userId?: string): Promise<any> {
  const seatCount = (input.layoutGrid?.flat().filter(c => c && c.type === 'SEAT').length || 0) + (input.extraSeats?.length || 0);
  const layoutId = input.id || `LAYOUT-${Date.now()}`;
  const layoutObj = {
    id: layoutId,
    name: input.name,
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
    layout_json: JSON.stringify({
      layoutGrid: input.layoutGrid,
      extraSeats: input.extraSeats || [],
      university: input.university || '',
      unit: input.unit || '',
      examName: input.examName || ''
    }),
    createdAt: new Date().toISOString()
  };

  const existingIdx = localCustomLayouts.findIndex(l => l.id === layoutId);
  if (existingIdx !== -1) {
    localCustomLayouts[existingIdx] = layoutObj;
  } else {
    localCustomLayouts.unshift(layoutObj);
  }

  try {
    const res = await fetch(`${FASTAPI_BASE}/buses/seat-layouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        description: input.description || '',
        total_rows: input.totalRows,
        total_cols: input.totalCols,
        total_seats: seatCount,
        layout_json: layoutObj.layout_json
      }),
      cache: 'no-store'
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      return { ...layoutObj, id: data.id || layoutObj.id };
    }
  } catch {}

  return layoutObj;
}

export async function createCustomLayout(input: CustomLayoutInput, userId?: string) {
  return saveCustomLayout(input, userId);
}


