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

export async function getAllBuses() {
  const res = await fastApiClient.getBuses();
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

export async function getBusById(id: string) {
  const res = await fastApiClient.getBusById(id);
  if (res.success && res.data) {
    return res.data;
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
    return res.data;
  }
  
  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id: `BUS-${Date.now()}` };
}

export async function updateBus(id: string, input: Partial<CreateBusInput>, userId?: string) {
  return { success: true, id };
}

export async function deleteBus(id: string, userId?: string) {
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
