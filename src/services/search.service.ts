import { prisma } from '@/lib/db';

export interface GlobalSearchResult {
  buses: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    url: string;
  }>;
  bookings: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    url: string;
  }>;
  trips: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    url: string;
  }>;
  students: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    url: string;
  }>;
  payments: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    url: string;
  }>;
}

export async function searchGlobal(query: string): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 1) {
    return {
      buses: [],
      bookings: [],
      trips: [],
      students: [],
      payments: []
    };
  }

  // 1. Search Buses
  const buses = await prisma.bus.findMany({
    where: {
      OR: [
        { busName: { contains: trimmed } },
        { busNumber: { contains: trimmed } },
        { regNumber: { contains: trimmed } },
        { operator: { contains: trimmed } },
        { notes: { contains: trimmed } }
      ]
    },
    take: 5
  });

  // 2. Search Bookings
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { bookingNumber: { contains: trimmed } },
        { notes: { contains: trimmed } },
        {
          passengers: {
            some: {
              OR: [
                { passengerName: { contains: trimmed } },
                { passengerPhone: { contains: trimmed } },
                { seatNumber: { contains: trimmed } }
              ]
            }
          }
        }
      ]
    },
    include: {
      passengers: true,
      trip: { include: { route: true, bus: true } }
    },
    take: 5
  });

  // 3. Search Trips
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { tripCode: { contains: trimmed } },
        { tripBusType: { contains: trimmed } },
        { notes: { contains: trimmed } },
        { bus: { busName: { contains: trimmed } } },
        { route: { routeName: { contains: trimmed } } },
        { route: { origin: { contains: trimmed } } },
        { route: { destination: { contains: trimmed } } }
      ]
    },
    include: {
      bus: true,
      route: true
    },
    take: 5
  });

  // 4. Search Students
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { fullName: { contains: trimmed } },
        { phone: { contains: trimmed } },
        { admissionId: { contains: trimmed } },
        { institution: { contains: trimmed } }
      ]
    },
    take: 5
  });

  // 5. Search Payments
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { receiptNumber: { contains: trimmed } },
        { method: { contains: trimmed } },
        { booking: { bookingNumber: { contains: trimmed } } },
        {
          transactions: {
            some: {
              transactionId: { contains: trimmed }
            }
          }
        }
      ]
    },
    include: {
      booking: true,
      transactions: true
    },
    take: 5
  });

  return {
    buses: buses.map(b => ({
      id: b.id,
      title: b.busName,
      subtitle: `${b.busNumber} • ${b.capacity} Seats • ${b.busType}`,
      badge: b.status,
      url: `/buses`
    })),
    bookings: bookings.map(b => {
      const pName = b.passengers[0]?.passengerName || 'Student';
      const pPhone = b.passengers[0]?.passengerPhone || '';
      return {
        id: b.id,
        title: `${b.bookingNumber} - ${pName}`,
        subtitle: `${pPhone} • ${b.trip.route.routeName} • ৳${b.netAmount}`,
        badge: b.bookingStatus,
        url: `/bookings/${b.id}`
      };
    }),
    trips: trips.map(t => ({
      id: t.id,
      title: `${t.tripCode} (${t.bus.busName})`,
      subtitle: `${t.route.routeName} • Base: ৳${t.basePrice}`,
      badge: t.status,
      url: `/trips/${t.id}/seat-map`
    })),
    students: students.map(s => ({
      id: s.id,
      title: s.fullName,
      subtitle: `${s.phone} • ${s.admissionId || 'No ID'} • ${s.institution || 'Admission'}`,
      badge: s.gender,
      url: `/bookings/new`
    })),
    payments: payments.map(p => ({
      id: p.id,
      title: `${p.receiptNumber} (৳${p.amount})`,
      subtitle: `${p.method} • For ${p.booking.bookingNumber}`,
      badge: p.method,
      url: `/payments`
    }))
  };
}
