import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

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
  return prisma.bus.findMany({
    include: {
      seatLayout: true,
      trips: {
        where: {
          departureDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        include: { route: true },
        orderBy: { departureDate: 'asc' },
        take: 3
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBusById(id: string) {
  return prisma.bus.findUnique({
    where: { id },
    include: {
      seatLayout: {
        include: {
          seats: {
            include: { fareZone: true }
          }
        }
      },
      trips: {
        include: { route: true },
        orderBy: { departureDate: 'desc' },
        take: 10
      }
    }
  });
}

export async function createBus(input: CreateBusInput, userId?: string) {
  const cleanBusNumber = input.busNumber.toUpperCase().trim();
  
  // Optional BRTA Reg number: if not provided, generate a safe unique internal registration
  let cleanRegNumber = input.regNumber ? input.regNumber.toUpperCase().trim() : '';
  if (!cleanRegNumber) {
    cleanRegNumber = `BRTA-${cleanBusNumber.replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  }

  // Combine target university and route information cleanly into notes / operator
  let enrichedNotes = input.notes || '';
  if (input.targetUniversity) {
    enrichedNotes = enrichedNotes ? `[University: ${input.targetUniversity}] ${enrichedNotes}` : `University: ${input.targetUniversity}`;
  }
  if (input.routeOrigin && input.routeDestination) {
    const routeTag = `Route: ${input.routeOrigin} ➔ ${input.routeDestination}`;
    enrichedNotes = enrichedNotes ? `${routeTag} | ${enrichedNotes}` : routeTag;

    // Also ensure route exists in BusRoute database
    const routeName = `${input.routeOrigin} to ${input.routeDestination}${input.targetUniversity ? ` (${input.targetUniversity})` : ''}`;
    const existingRoute = await prisma.busRoute.findFirst({
      where: { origin: input.routeOrigin, destination: input.routeDestination }
    });
    if (!existingRoute) {
      await prisma.busRoute.create({
        data: {
          routeName,
          origin: input.routeOrigin,
          destination: input.routeDestination
        }
      });
    }
  }

  // Check duplicate busNumber under the same busName / route
  const allBuses = await prisma.bus.findMany({
    select: { busName: true, busNumber: true }
  });
  const duplicate = allBuses.find(b => 
    b.busName.trim().toLowerCase() === input.busName.trim().toLowerCase() &&
    b.busNumber.trim().toUpperCase() === cleanBusNumber
  );
  if (duplicate) {
    throw new Error(`'${input.busName.trim()}' এর অধীনে '${cleanBusNumber}' বাসটি ইতিমধ্যে তৈরি করা আছে! এক বাস নম্বরে একাধিক বাস তৈরি করা যাবে না।`);
  }

  const bus = await prisma.bus.create({
    data: {
      busName: input.busName.trim(),
      busNumber: cleanBusNumber,
      operator: input.operator || (input.targetUniversity ? `${input.targetUniversity} Transit` : 'Central Transport Office'),
      regNumber: cleanRegNumber,
      capacity: input.capacity || 40,
      busType: input.busType || 'MIXED',
      status: input.status || 'ACTIVE',
      notes: enrichedNotes || undefined,
      seatLayoutId: input.seatLayoutId || null
    }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'BUS_CREATED',
      entity: 'Bus',
      entityId: bus.id,
      newValue: { busNumber: bus.busNumber, busName: bus.busName, type: bus.busType }
    });
  }

  return bus;
}

export async function updateBus(id: string, input: Partial<CreateBusInput>, userId?: string) {
  const existing = await prisma.bus.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Bus not found');
  }

  let cleanRegNumber = input.regNumber !== undefined ? input.regNumber.toUpperCase().trim() : undefined;
  if (cleanRegNumber === '') {
    cleanRegNumber = `BRTA-${(input.busNumber || existing.busNumber).replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  }

  let updatedNotes = input.notes !== undefined ? input.notes : existing.notes;
  if (input.targetUniversity || (input.routeOrigin && input.routeDestination)) {
    const uniTag = input.targetUniversity ? `University: ${input.targetUniversity}` : '';
    const routeTag = input.routeOrigin && input.routeDestination ? `Route: ${input.routeOrigin} ➔ ${input.routeDestination}` : '';
    const combinedTags = [uniTag, routeTag].filter(Boolean).join(' | ');
    if (combinedTags) {
      updatedNotes = updatedNotes ? `${combinedTags} | ${updatedNotes.replace(/^(\[.*?\]|Route:.*?\||University:.*?\|)\s*/g, '')}` : combinedTags;
    }
  }

  const updated = await prisma.bus.update({
    where: { id },
    data: {
      busName: input.busName?.trim(),
      busNumber: input.busNumber ? input.busNumber.toUpperCase().trim() : undefined,
      operator: input.operator !== undefined ? input.operator.trim() : undefined,
      regNumber: cleanRegNumber,
      capacity: input.capacity,
      busType: input.busType,
      status: input.status,
      seatLayoutId: input.seatLayoutId,
      notes: updatedNotes
    }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'BUS_UPDATED',
      entity: 'Bus',
      entityId: updated.id,
      previousValue: existing,
      newValue: updated
    });
  }

  return updated;
}

export async function deleteBus(id: string, userId?: string) {
  const existing = await prisma.bus.findUnique({
    where: { id },
    include: { trips: true }
  });

  if (!existing) {
    throw new Error('Bus not found');
  }

  // Delete associated trips or delete bus
  await prisma.trip.deleteMany({
    where: { busId: id }
  });

  await prisma.bus.delete({
    where: { id }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'BUS_DELETED',
      entity: 'Bus',
      entityId: id,
      previousValue: existing
    });
  }

  return { success: true, deletedId: id };
}

export async function getAllRoutes() {
  return prisma.busRoute.findMany({
    include: {
      stops: { orderBy: { sequenceNo: 'asc' } },
      _count: { select: { trips: true } }
    },
    orderBy: { routeName: 'asc' }
  });
}

export async function createRoute(data: {
  routeName: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estDuration?: string;
  stops?: { stopName: string; sequenceNo: number; fareOffset: number }[];
}, userId?: string) {
  const route = await prisma.busRoute.create({
    data: {
      routeName: data.routeName,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.distanceKm,
      estDuration: data.estDuration,
      stops: data.stops ? {
        create: data.stops
      } : undefined
    }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'ROUTE_CREATED',
      entity: 'BusRoute',
      entityId: route.id,
      newValue: { routeName: route.routeName, origin: route.origin, destination: route.destination }
    });
  }

  return route;
}
