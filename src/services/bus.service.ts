import { fastApiClient } from '@/lib/api-client';

export interface CreateBusInput {
  busName: string;
  busNumber: string;
  operator?: string;
  regNumber?: string;
  capacity: number;
  busType: 'MALE' | 'FEMALE' | 'MIXED';
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  notes?: string;
  seatLayoutId?: string;
  routeOrigin?: string;
  routeDestination?: string;
  targetUniversity?: string;
}

export function normalizeBus(b: any) {
  if (!b) return b;
  return {
    ...b,
    id: b.id,
    busName: b.busName || b.bus_name || '',
    bus_name: b.bus_name || b.busName || '',
    busNumber: b.busNumber || b.bus_number || '',
    bus_number: b.bus_number || b.busNumber || '',
    operator: b.operator || 'Central Transport Office',
    regNumber: b.regNumber || b.reg_number || '',
    reg_number: b.reg_number || b.regNumber || '',
    capacity: b.capacity ?? 40,
    busType: b.busType || b.bus_type || 'MIXED',
    bus_type: b.bus_type || b.busType || 'MIXED',
    status: b.status || 'ACTIVE',
    notes: b.notes || '',
    seatLayoutId: b.seatLayoutId || b.seat_layout_id || null,
    seat_layout_id: b.seat_layout_id || b.seatLayoutId || null,
    seatLayout: b.seatLayout || b.seat_layout || null,
  };
}

export async function getAllBuses() {
  const res = await fastApiClient.getBuses();
  if (res.success && res.data && Array.isArray(res.data)) {
    return res.data.map(normalizeBus);
  }
  return [];
}

export async function getBusById(id: string) {
  const res = await fastApiClient.getBusById(id);
  if (res.success && res.data) {
    return normalizeBus(res.data);
  }
  const all = await getAllBuses();
  return all.find((b: any) => b.id === id) || null;
}

export async function createBus(input: CreateBusInput, userId?: string) {
  const generatedReg = input.regNumber || `DHAKA-METRO-BA-${Date.now().toString().slice(-4)}`;
  const res = await fastApiClient.createBus({
    bus_name: input.busName,
    bus_number: input.busNumber,
    operator: input.operator || 'Central Transport Office',
    reg_number: generatedReg,
    capacity: input.capacity,
    bus_type: input.busType || 'MIXED',
    status: input.status || 'ACTIVE',
    notes: input.notes,
    seat_layout_id: input.seatLayoutId || undefined
  });

  if (res.success && res.data) {
    return normalizeBus(res.data);
  }
  
  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id: `BUS-${Date.now()}` };
}

export async function updateBus(id: string, input: Partial<CreateBusInput>, userId?: string) {
  const payload: any = {};
  if (input.busName !== undefined) payload.bus_name = input.busName;
  if (input.busNumber !== undefined) payload.bus_number = input.busNumber;
  if (input.operator !== undefined) payload.operator = input.operator;
  if (input.regNumber !== undefined) payload.reg_number = input.regNumber;
  if (input.capacity !== undefined) payload.capacity = Number(input.capacity);
  if (input.busType !== undefined) payload.bus_type = input.busType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.seatLayoutId !== undefined) payload.seat_layout_id = input.seatLayoutId || null;

  const res = await fastApiClient.updateBus(id, payload);
  if (res.success && res.data) {
    return res.data;
  }
  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id };
}

export async function deleteBus(id: string, userId?: string) {
  const res = await fastApiClient.deleteBus(id);
  if (res.success) {
    return res.data || { success: true, id };
  }
  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id };
}

export async function getAllRoutes() {
  const res = await fastApiClient.getRoutes();
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

export async function createRoute(input: {
  routeName: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estDuration?: string;
  stops?: any[];
}, userId?: string) {
  const res = await fastApiClient.createRoute({
    route_name: input.routeName,
    origin: input.origin,
    destination: input.destination,
    distance_km: input.distanceKm || 250.0,
    est_duration: input.estDuration || '5h 30m',
    stops: input.stops || []
  });

  if (res.success && res.data) {
    return res.data;
  }
  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id: `ROUTE-${Date.now()}` };
}
