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
  totalRows: number;
  totalCols: number;
  layoutGrid: LayoutGridCell[][];
  extraSeats?: any[];
}

export async function getAllLayouts() {
  const res = await fetch('http://localhost:8000/api/v1/buses/seat-layouts').catch(() => null);
  if (res && res.ok) {
    return res.json();
  }
  return [
    {
      id: 'layout-hino-40',
      name: 'Standard 40-Seat Hino 1J',
      totalSeats: 40,
      totalRows: 11,
      totalCols: 5,
      seats: []
    }
  ];
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

export async function createFareZone(data: { name: string; description?: string; defaultFare: number }, userId?: string) {
  return { id: `ZONE-${Date.now()}`, ...data };
}

export async function updateFareZone(id: string, data: { name?: string; description?: string; defaultFare?: number }, userId?: string) {
  return { id, ...data };
}

export async function deleteFareZone(id: string, userId?: string) {
  return { success: true };
}

export async function deleteLayout(id: string, userId?: string) {
  return { success: true };
}

export async function deleteSeatLayout(id: string, userId?: string) {
  return deleteLayout(id, userId);
}

export async function saveCustomLayout(input: CustomLayoutInput, userId?: string) {
  return { success: true, id: input.id || `LAYOUT-${Date.now()}` };
}

export async function createCustomLayout(input: CustomLayoutInput, userId?: string) {
  return saveCustomLayout(input, userId);
}

