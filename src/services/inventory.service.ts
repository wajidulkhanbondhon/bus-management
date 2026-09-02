import { fastApiClient } from '@/lib/api-client';
import { proxyUrl } from '@/lib/config';

export interface SeatStatusDetail {
  seatId: string;
  seatNumber: string;
  rowIndex: number;
  colIndex: number;
  seatType: string;
  genderAllowed: string;
  fare: number;
  fareZoneName: string | null;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'LOCKED' | 'MAINTENANCE';
  booking?: {
    id: string;
    bookingNumber: string;
    bookingStatus: string;
    passengerName: string;
    passengerGender: string;
    passengerType: string;
    paymentStatus: string;
    discountAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdBy: string;
    paymentExpiresAt?: Date | null;
  } | null;
  hold?: {
    holdToken: string;
    staffId: string;
    expiresAt: Date;
    isMyHold: boolean;
  } | null;
  lock?: {
    lockType: string;
    reason: string;
    notes: string | null;
    lockedUntil: Date | null;
  } | null;
}

export async function getTripSeatInventory(tripId: string, currentStaffId?: string): Promise<{
  trip: any;
  seats: SeatStatusDetail[];
  summary: {
    totalSeats: number;
    availableSeats: number;
    bookedSeats: number;
    heldSeats: number;
    lockedSeats: number;
    occupancyPercent: number;
    grossTripSales: number;
  };
}> {
  let rawData: any = null;
  try {
    const res = await fastApiClient.getSeatMap(tripId);
    if (res.success && res.data) {
      rawData = res.data;
    } else {
      // If specific trip ID not found, attempt loading the first active trip
      const tripsRes = await fastApiClient.getTrips();
      if (tripsRes.success && tripsRes.data && tripsRes.data.length > 0) {
        const fallbackTrip = tripsRes.data[0];
        const fbSeatMap = await fastApiClient.getSeatMap(fallbackTrip.id);
        if (fbSeatMap.success && fbSeatMap.data) {
          rawData = fbSeatMap.data;
        }
      }
    }
  } catch {
    rawData = null;
  }

  // 1. If backend returned data, normalize it cleanly
  if (rawData && rawData.seats && Array.isArray(rawData.seats) && rawData.seats.length > 0) {
    const normalizedSeats: SeatStatusDetail[] = rawData.seats.map((s: any, idx: number) => {
      const rawNum = (s.seatNumber || s.seat_number || s.label || s.seatId || s.id || `Seat-${idx + 1}`).toString().trim();
      const seatNumber = rawNum.toUpperCase();
      const rowChar = seatNumber.charAt(0) || 'A';
      const colNum = parseInt(seatNumber.replace(/\D/g, '')) || 1;
      const rowLetters = 'ABCDEFGHIJKLMN';
      const inferredRow = rowLetters.indexOf(rowChar);
      
      const rowIndex = typeof s.rowIndex === 'number' 
        ? s.rowIndex 
        : (typeof s.row_index === 'number' ? s.row_index : (inferredRow >= 0 ? inferredRow : 0));
        
      const colIndex = typeof s.colIndex === 'number' 
        ? s.colIndex 
        : (typeof s.col_index === 'number' ? s.col_index : (colNum <= 2 ? colNum - 1 : colNum));

      return {
        seatId: s.seatId || s.seat_id || `seat-${seatNumber}-${idx}`,
        seatNumber,
        rowIndex: Math.max(0, rowIndex),
        colIndex: Math.max(0, colIndex),
        seatType: s.seatType || s.seat_type || (rowIndex < 2 ? 'VIP' : 'STANDARD'),
        genderAllowed: s.genderAllowed || s.gender_allowed || 'ANY',
        fare: Number(s.fare) || (rowIndex < 4 ? 650 : 550),
        fareZoneName: s.fareZoneName || s.fare_zone_name || (rowIndex < 4 ? 'VIP Front' : 'Standard'),
        status: (s.status || 'AVAILABLE').toUpperCase() as any,
        booking: s.booking || (s.passenger_name ? {
          id: s.booking_number || 'BK-1',
          bookingNumber: s.booking_number || 'BK-1',
          bookingStatus: 'CONFIRMED',
          passengerName: s.passenger_name,
          passengerGender: s.passenger_gender || 'MALE',
          passengerType: s.passenger_type || 'STUDENT',
          paymentStatus: 'PAID',
          discountAmount: 0,
          paidAmount: Number(s.fare) || 550,
          dueAmount: 0,
          createdBy: 'COUNTER',
        } : null),
        hold: s.hold || null,
        lock: s.lock || null,
      };
    });

    const totalSeats = rawData.totalSeats || rawData.total_seats || normalizedSeats.length;
    const bookedSeats = rawData.bookedSeats || rawData.booked_seats || normalizedSeats.filter(s => s.status === 'BOOKED').length;
    const heldSeats = rawData.heldSeats || rawData.held_seats || normalizedSeats.filter(s => s.status === 'HELD').length;
    const lockedSeats = rawData.lockedSeats || rawData.locked_seats || normalizedSeats.filter(s => s.status === 'LOCKED').length;
    const availableSeats = rawData.availableSeats || rawData.available_seats || (totalSeats - bookedSeats - heldSeats - lockedSeats);
    const occupancyPercent = rawData.occupancyPercent || rawData.occupancy_percent || (totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0);

    return {
      trip: {
        id: tripId,
        tripCode: rawData.tripCode || rawData.trip_code || '',
        bus: {
          busName: rawData.busName || rawData.bus_name || '',
          busNumber: rawData.busNumber || rawData.bus_number || ''
        },
        route: rawData.route || null,
        departureDate: rawData.departureDate || rawData.departure_date || '',
        departureTime: rawData.departureTime || rawData.departure_time || '',
        basePrice: rawData.basePrice || rawData.base_price || 0,
        tripBusType: rawData.tripBusType || rawData.trip_bus_type || 'MIXED',
        has_accommodation: rawData.has_accommodation || false
      },
      seats: normalizedSeats,
      summary: {
        totalSeats,
        availableSeats,
        bookedSeats,
        heldSeats,
        lockedSeats,
        occupancyPercent,
        grossTripSales: rawData.grossTripSales || rawData.gross_trip_sales || (bookedSeats * 550)
      }
    };
  }

  // No backend data — do NOT fabricate a phantom coach. Callers must surface
  // an explicit "unavailable" state instead of selling against fake seats.
  throw new Error('Seat inventory unavailable: backend returned no seat data for this trip.');
}

export async function holdSeat(tripId: string, seatId: string, staffId: string, durationMinutes: number = 10) {
  const res = await fetch(proxyUrl(`/inventory/${tripId}/hold-seat?seat_id=${seatId}&duration_minutes=${durationMinutes}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  }).catch(() => null);
  return res && res.ok ? { success: true } : { success: false };
}

export async function releaseSeatHold(tripId: string, seatId: string, staffId: string) {
  const res = await fetch(proxyUrl(`/inventory/${tripId}/unlock-seat?seat_id=${seatId}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  }).catch(() => null);
  return res && res.ok ? { success: true } : { success: false };
}

export async function lockSeat(data: {
  tripId: string;
  seatId: string;
  lockType: 'PERMANENT' | 'TEMPORARY';
  reason: string;
  notes?: string;
  lockedUntil?: string | null;
  lockedBy: string;
}) {
  const res = await fastApiClient.lockSeat(data.tripId, data);
  if (!res.success) {
    throw new Error(res.error || 'Failed to lock seat');
  }
  return { success: true, ...data };
}

export async function unlockSeat(tripId: string, seatId: string, staffId?: string) {
  const res = await fastApiClient.unlockSeat(tripId, seatId);
  if (!res.success) {
    throw new Error(res.error || 'Failed to unlock seat');
  }
  return { success: true };
}


