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

export function normalizeTrip(t: any) {
  if (!t) return null;
  const bus = t.bus || {};
  const route = t.route || {};
  const notes = bus.notes || t.notes || '';

  // Extract University info
  let targetUniversity = t.targetUniversity || t.target_university || '';
  if (!targetUniversity && notes) {
    const uniMatch = notes.match(/\[🎯\s*UNI:\s*([^\]]+)\]/i);
    if (uniMatch) targetUniversity = uniMatch[1].trim();
  }
  if (!targetUniversity) {
    targetUniversity = route.destination || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
  }

  // Extract Exam Unit
  let examUnit = t.examUnit || t.exam_unit || bus.examUnit || bus.exam_unit || '';
  if (!examUnit && notes) {
    const unitMatch = notes.match(/UNIT:\s*([^;|\]]+)/i);
    if (unitMatch) examUnit = unitMatch[1].trim();
  }

  // Extract unique code (e.g. ATOMS-101)
  let uniqueCode = bus.uniqueCode || '';
  if (!uniqueCode && notes) {
    const codeMatch = notes.match(/\[🏷️?\s*CODE:\s*([^\]]+)\]/i);
    if (codeMatch) uniqueCode = codeMatch[1].trim();
  }
  if (!uniqueCode && (bus.busNumber || bus.bus_number || t.bus_id)) {
    const sum = (t.bus_id || bus.id || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const num = (sum % 900) + 101;
    uniqueCode = `ATOMS-${num}`;
  }

  const busNumber = bus.busNumber || bus.bus_number || 'COACH';
  const busName = bus.busName || bus.bus_name || (busNumber ? `কোচ ${busNumber}` : 'স্পেশাল কোচ');
  const routeOrigin = route.origin || 'ঢাকা';
  const routeDestination = route.destination || targetUniversity || 'ক্যাম্পাস';
  const routeName = route.routeName || route.route_name || `${routeOrigin} ➔ ${routeDestination}`;
  const basePrice = Number(t.basePrice ?? t.base_price ?? 550);
  const tripCode = t.tripCode || t.trip_code || `TRIP-${busNumber}`;
  const departureDate = t.departureDate || t.departure_date || new Date().toISOString();
  const departureTime = t.departureTime || t.departure_time || '22:30';
  const tripBusType = t.tripBusType || t.trip_bus_type || bus.busType || bus.bus_type || 'MIXED';

  return {
    ...t,
    id: t.id,
    tripCode,
    trip_code: tripCode,
    basePrice,
    base_price: basePrice,
    departureDate,
    departure_date: departureDate,
    departureTime,
    departure_time: departureTime,
    tripBusType,
    trip_bus_type: tripBusType,
    targetUniversity,
    examUnit,
    uniqueCode,
    status: t.status || 'SCHEDULED',
    route: {
      ...route,
      id: route.id,
      origin: routeOrigin,
      destination: routeDestination,
      routeName,
      route_name: routeName,
      distanceKm: route.distanceKm || route.distance_km,
      estDuration: route.estDuration || route.est_duration,
    },
    bus: {
      ...bus,
      id: bus.id || t.bus_id,
      busNumber,
      bus_number: busNumber,
      busName,
      bus_name: busName,
      operator: bus.operator || 'পরে নির্ধারণ করা হবে',
      regNumber: bus.regNumber || bus.reg_number || '',
      reg_number: bus.regNumber || bus.reg_number || '',
      capacity: Number(bus.capacity) || 45,
      busType: tripBusType,
      bus_type: tripBusType,
      notes,
      uniqueCode,
      examUnit,
      targetUniversity,
    }
  };
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
  if (res.success && res.data && Array.isArray(res.data)) {
    return res.data.map(normalizeTrip);
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
    return normalizeTrip(res.data);
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
