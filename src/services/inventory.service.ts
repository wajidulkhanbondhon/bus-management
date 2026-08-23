import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

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
    passengerName: string;
    passengerGender: string;
    passengerType: string;
    paymentStatus: string;
    discountAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdBy: string;
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
  // 1. Clean expired holds first
  const now = new Date();
  await prisma.seatHold.deleteMany({
    where: {
      tripId,
      expiresAt: { lte: now }
    }
  });

  // 2. Fetch Trip with Bus Layout, Bookings, Locks, Holds, Fare Rules
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: {
        include: {
          seatLayout: {
            include: {
              seats: {
                include: { fareZone: true },
                orderBy: [{ rowIndex: 'asc' }, { colIndex: 'asc' }]
              }
            }
          }
        }
      },
      route: true,
      fareRules: true,
      bookings: {
        where: {
          bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        include: {
          seats: true,
          passengers: true,
          createdBy: { select: { fullName: true } }
        }
      },
      seatLocks: {
        where: {
          isActive: true,
          OR: [
            { lockedUntil: null },
            { lockedUntil: { gt: now } }
          ]
        }
      },
      seatHolds: {
        where: { expiresAt: { gt: now } }
      }
    }
  });

  if (!trip || !trip.bus.seatLayout) {
    throw new Error('Trip or Bus Seat Layout not found');
  }

  const customFareMap = new Map(trip.fareRules.map(fr => [fr.fareZoneId, fr.customPrice]));

  // Index active bookings by seatId
  const bookedSeatMap = new Map<string, any>();
  for (const b of trip.bookings) {
    for (const bs of b.seats) {
      const passenger = b.passengers.find(p => p.seatNumber === bs.seatId) || b.passengers[0];
      bookedSeatMap.set(bs.seatId, {
        id: b.id,
        bookingNumber: b.bookingNumber,
        passengerName: passenger ? passenger.passengerName : 'Student Passenger',
        passengerGender: passenger ? passenger.gender : 'FEMALE',
        passengerType: passenger ? passenger.passengerType : 'STUDENT',
        paymentStatus: b.paymentStatus,
        discountAmount: b.discountAmount,
        paidAmount: b.paidAmount,
        dueAmount: b.dueAmount,
        createdBy: b.createdBy.fullName
      });
    }
  }

  const lockMap = new Map(trip.seatLocks.map(l => [l.seatId, l]));
  const holdMap = new Map(trip.seatHolds.map(h => [h.seatId, h]));

  let availableCount = 0;
  let bookedCount = 0;
  let heldCount = 0;
  let lockedCount = 0;
  let grossTripSales = 0;

  const seatDetails: SeatStatusDetail[] = trip.bus.seatLayout.seats.map(seat => {
    // Determine exact fare for this seat on this trip
    let effectiveFare = seat.baseFare;
    if (seat.fareZoneId && customFareMap.has(seat.fareZoneId)) {
      effectiveFare = customFareMap.get(seat.fareZoneId)!;
    } else if (seat.fareZone?.defaultFare) {
      effectiveFare = seat.fareZone.defaultFare;
    }

    const bookingInfo = bookedSeatMap.get(seat.id) || null;
    const lockInfo = lockMap.get(seat.id) || null;
    const holdInfo = holdMap.get(seat.id) || null;

    let status: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'LOCKED' | 'MAINTENANCE' = 'AVAILABLE';

    if (bookingInfo) {
      status = 'BOOKED';
      bookedCount++;
      grossTripSales += effectiveFare;
    } else if (lockInfo) {
      status = 'LOCKED';
      lockedCount++;
    } else if (holdInfo) {
      status = 'HELD';
      heldCount++;
    } else if (trip.bus.status === 'MAINTENANCE') {
      status = 'MAINTENANCE';
    } else {
      status = 'AVAILABLE';
      availableCount++;
    }

    return {
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      rowIndex: seat.rowIndex,
      colIndex: seat.colIndex,
      seatType: seat.seatType,
      genderAllowed: seat.genderAllowed,
      fare: effectiveFare,
      fareZoneName: seat.fareZone?.name || null,
      status,
      booking: bookingInfo,
      hold: holdInfo ? {
        holdToken: holdInfo.holdToken,
        staffId: holdInfo.staffId,
        expiresAt: holdInfo.expiresAt,
        isMyHold: holdInfo.staffId === currentStaffId
      } : null,
      lock: lockInfo ? {
        lockType: lockInfo.lockType,
        reason: lockInfo.reason,
        notes: lockInfo.notes,
        lockedUntil: lockInfo.lockedUntil
      } : null
    };
  });

  const totalSeats = trip.bus.seatLayout.seats.length;
  const occupancyPercent = totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0;

  return {
    trip,
    seats: seatDetails,
    summary: {
      totalSeats,
      availableSeats: availableCount,
      bookedSeats: bookedCount,
      heldSeats: heldCount,
      lockedSeats: lockedCount,
      occupancyPercent,
      grossTripSales
    }
  };
}

export async function holdSeat(tripId: string, seatId: string, staffId: string, durationMinutes = 10) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const holdToken = `HOLD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Clean expired
  await prisma.seatHold.deleteMany({
    where: {
      tripId,
      expiresAt: { lte: now }
    }
  });

  // Check if seat is already booked or locked
  const existingBooking = await prisma.bookingSeat.findFirst({
    where: {
      seatId,
      booking: {
        tripId,
        bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    }
  });
  if (existingBooking) {
    throw new Error('Seat is already booked by another passenger');
  }

  const existingLock = await prisma.seatLock.findFirst({
    where: {
      tripId,
      seatId,
      isActive: true,
      OR: [{ lockedUntil: null }, { lockedUntil: { gt: now } }]
    }
  });
  if (existingLock) {
    throw new Error(`Seat is currently locked: ${existingLock.reason}`);
  }

  const existingHold = await prisma.seatHold.findFirst({
    where: {
      tripId,
      seatId,
      expiresAt: { gt: now }
    }
  });
  if (existingHold) {
    if (existingHold.staffId === staffId) {
      // Refresh current staff's hold
      return prisma.seatHold.update({
        where: { id: existingHold.id },
        data: { expiresAt }
      });
    }
    throw new Error('Seat is currently held by another office staff member');
  }

  // Create hold
  return prisma.seatHold.create({
    data: {
      tripId,
      seatId,
      staffId,
      holdToken,
      expiresAt
    }
  });
}

export async function releaseSeatHold(tripId: string, seatId: string, staffId: string) {
  return prisma.seatHold.deleteMany({
    where: {
      tripId,
      seatId,
      staffId
    }
  });
}

export async function lockSeat(params: {
  tripId: string;
  seatId: string;
  lockType: 'PERMANENT' | 'TEMPORARY';
  reason: string;
  notes?: string;
  lockedBy: string;
  lockedUntil?: Date | string | null;
}) {
  const lock = await prisma.seatLock.create({
    data: {
      tripId: params.tripId,
      seatId: params.seatId,
      lockType: params.lockType,
      reason: params.reason,
      notes: params.notes,
      lockedBy: params.lockedBy,
      lockedUntil: params.lockedUntil ? new Date(params.lockedUntil) : null,
      isActive: true
    }
  });

  // Release any active hold
  await prisma.seatHold.deleteMany({
    where: { tripId: params.tripId, seatId: params.seatId }
  });

  await logAudit({
    userId: params.lockedBy,
    action: 'SEAT_LOCKED',
    entity: 'SeatLock',
    entityId: lock.id,
    newValue: { tripId: params.tripId, seatId: params.seatId, reason: params.reason }
  });

  return lock;
}

export async function unlockSeat(tripId: string, seatId: string, userId: string) {
  const updated = await prisma.seatLock.updateMany({
    where: { tripId, seatId, isActive: true },
    data: { isActive: false }
  });

  await logAudit({
    userId,
    action: 'SEAT_UNLOCKED',
    entity: 'SeatLock',
    entityId: `${tripId}:${seatId}`,
    newValue: { tripId, seatId, status: 'UNLOCKED' }
  });

  return updated;
}
