import { prisma } from '@/lib/db';

export interface ReportFilterParams {
  startDate?: string | Date;
  endDate?: string | Date;
  busId?: string;
  tripId?: string;
  routeId?: string;
  paymentMethod?: string;
  staffId?: string;
}

export async function getSalesReport(filters?: ReportFilterParams) {
  const whereBooking: any = {
    bookingStatus: { in: ['CONFIRMED', 'COMPLETED', 'PARTIALLY_REFUNDED'] }
  };

  if (filters?.startDate || filters?.endDate) {
    whereBooking.createdAt = {};
    if (filters.startDate) whereBooking.createdAt.gte = new Date(new Date(filters.startDate).setHours(0, 0, 0, 0));
    if (filters.endDate) whereBooking.createdAt.lte = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
  }

  if (filters?.tripId) whereBooking.tripId = filters.tripId;
  if (filters?.staffId) whereBooking.createdById = filters.staffId;
  if (filters?.busId) whereBooking.trip = { busId: filters.busId };

  const bookings = await prisma.booking.findMany({
    where: whereBooking,
    include: {
      trip: {
        include: {
          bus: true,
          route: true
        }
      },
      seats: { include: { seat: true } },
      passengers: true,
      payments: true,
      discounts: true,
      createdBy: { select: { fullName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalGross = bookings.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalDiscount = bookings.reduce((sum, b) => sum + b.discountAmount, 0);
  const totalNet = bookings.reduce((sum, b) => sum + b.netAmount, 0);
  const totalPaid = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = bookings.reduce((sum, b) => sum + b.dueAmount, 0);
  const totalSeats = bookings.reduce((sum, b) => sum + b.seats.length, 0);

  return {
    summary: {
      totalBookings: bookings.length,
      totalSeats,
      totalGross,
      totalDiscount,
      totalNet,
      totalPaid,
      totalDue
    },
    bookings: bookings.map(b => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      tripCode: b.trip.tripCode,
      busNumber: b.trip.bus.busNumber,
      routeName: b.trip.route.routeName,
      passengerName: b.passengers[0]?.passengerName || 'N/A',
      passengerPhone: b.passengers[0]?.passengerPhone || 'N/A',
      seats: b.seats.map(s => s.seat.seatNumber).join(', '),
      grossAmount: b.grossAmount,
      discountAmount: b.discountAmount,
      netAmount: b.netAmount,
      paidAmount: b.paidAmount,
      dueAmount: b.dueAmount,
      paymentStatus: b.paymentStatus,
      createdBy: b.createdBy.fullName,
      createdAt: b.createdAt
    }))
  };
}

export async function getBusWiseSalesReport(filters?: ReportFilterParams) {
  const sales = await getSalesReport(filters);
  const busMap = new Map<string, {
    busNumber: string;
    busName: string;
    bookingsCount: number;
    seatsSold: number;
    grossSales: number;
    discount: number;
    netSales: number;
    collected: number;
    due: number;
  }>();

  for (const b of sales.bookings) {
    const existing = busMap.get(b.busNumber) || {
      busNumber: b.busNumber,
      busName: '',
      bookingsCount: 0,
      seatsSold: 0,
      grossSales: 0,
      discount: 0,
      netSales: 0,
      collected: 0,
      due: 0
    };

    existing.bookingsCount += 1;
    existing.seatsSold += b.seats.split(',').length;
    existing.grossSales += b.grossAmount;
    existing.discount += b.discountAmount;
    existing.netSales += b.netAmount;
    existing.collected += b.paidAmount;
    existing.due += b.dueAmount;

    busMap.set(b.busNumber, existing);
  }

  return Array.from(busMap.values());
}
