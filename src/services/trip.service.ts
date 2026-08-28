import { fastApiClient } from '@/lib/api-client';

export interface CreateTripInput {
  busId: string;
  routeId: string;
  departureDate: string | Date;
  departureTime: string | Date;
  arrivalEst?: string | Date;
  tripBusType?: 'MALE' | 'FEMALE' | 'MIXED';
  basePrice: number;
  notes?: string;
  fareZoneOverrides?: { fareZoneId: string; customPrice: number }[];
}

export async function getAllTrips(filters?: {
  date?: string | Date;
  status?: string;
  busId?: string;
  routeId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.busId) queryParams.append('bus_id', filters.busId);
  if (filters?.routeId) queryParams.append('route_id', filters.routeId);
  if (filters?.date) queryParams.append('date', new Date(filters.date).toISOString());

  const res = await fastApiClient.getTrips(queryParams.toString());
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

export async function getTodayTrips() {
  const today = new Date();
  return getAllTrips({ date: today });
}

export async function getTripById(id: string) {
  const res = await fastApiClient.getTripById(id);
  if (res.success && res.data) {
    return res.data;
  }
  const all = await getAllTrips();
  return all.find((t: any) => t.id === id) || null;
}

export async function createTrip(input: CreateTripInput, staffId?: string) {
  const depDate = new Date(input.departureDate);
  const depTime = new Date(input.departureTime);
  const tripCode = `TRIP-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

  const res = await fastApiClient.createTrip({
    trip_code: tripCode,
    bus_id: input.busId,
    route_id: input.routeId,
    departure_date: depDate.toISOString(),
    departure_time: depTime.toISOString(),
    arrival_est: input.arrivalEst ? new Date(input.arrivalEst).toISOString() : null,
    trip_bus_type: input.tripBusType || 'MIXED',
    status: 'SCHEDULED',
    base_price: Number(input.basePrice),
    notes: input.notes
  });

  if (res.success && res.data) {
    return res.data;
  }

  if (res.error) {
    throw new Error(res.error);
  }
  return { success: true, id: tripCode };
}
