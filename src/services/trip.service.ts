import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

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
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.busId) where.busId = filters.busId;
  if (filters?.routeId) where.routeId = filters.routeId;
  
  if (filters?.date) {
    const d = new Date(filters.date);
    const startOfDay = new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = new Date(d.setHours(23, 59, 59, 999));
    where.departureDate = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  return prisma.trip.findMany({
    where,
    include: {
      bus: {
        include: { seatLayout: true }
      },
      route: true,
      fareRules: { include: { fareZone: true } },
      bookings: {
        where: { bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] } },
        include: { seats: true, payments: true }
      },
      seatLocks: { where: { isActive: true } },
      seatHolds: {
        where: { expiresAt: { gt: new Date() } }
      }
    },
    orderBy: [{ departureDate: 'asc' }, { departureTime: 'asc' }]
  });
}

export async function getTodayTrips() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.trip.findMany({
    where: {
      departureDate: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      bus: { include: { seatLayout: true } },
      route: true,
      bookings: {
        where: { bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] } },
        include: { seats: true, payments: true }
      },
      seatLocks: { where: { isActive: true } }
    },
    orderBy: { departureTime: 'asc' }
  });
}

export async function getTripById(id: string) {
  return prisma.trip.findUnique({
    where: { id },
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
      route: {
        include: { stops: { orderBy: { sequenceNo: 'asc' } } }
      },
      fareRules: { include: { fareZone: true } },
      bookings: {
        include: {
          seats: true,
          passengers: true,
          payments: true,
          discounts: true,
          createdBy: { select: { fullName: true } }
        }
      },
      seatLocks: {
        where: { isActive: true }
      },
      seatHolds: {
        where: { expiresAt: { gt: new Date() } }
      }
    }
  });
}

export async function createTrip(input: CreateTripInput, userId?: string) {
  const dateObj = new Date(input.departureDate);
  const timeObj = new Date(input.departureTime);

  // Generate Trip Code TRIP-YYYYMMDD-XXX
  const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.trip.count({
    where: {
      departureDate: {
        gte: new Date(new Date(input.departureDate).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(input.departureDate).setHours(23, 59, 59, 999)),
      }
    }
  });
  const tripCode = `TRIP-${dateStr}-${String(count + 1).padStart(3, '0')}`;

  const trip = await prisma.trip.create({
    data: {
      tripCode,
      busId: input.busId,
      routeId: input.routeId,
      departureDate: dateObj,
      departureTime: timeObj,
      arrivalEst: input.arrivalEst ? new Date(input.arrivalEst) : null,
      tripBusType: input.tripBusType || null,
      basePrice: input.basePrice,
      notes: input.notes,
      fareRules: input.fareZoneOverrides ? {
        create: input.fareZoneOverrides.map(f => ({
          fareZoneId: f.fareZoneId,
          customPrice: f.customPrice
        }))
      } : undefined
    },
    include: { bus: true, route: true }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'TRIP_CREATED',
      entity: 'Trip',
      entityId: trip.id,
      newValue: { tripCode: trip.tripCode, date: trip.departureDate, bus: trip.bus.busNumber }
    });
  }

  return trip;
}
