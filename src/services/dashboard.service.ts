import { fastApiClient } from '@/lib/api-client';

export interface ProgressiveSalesSlot {
  slotLabel: string;
  targetTime: string;
  time: string;
  bookings: number;
  sales: number;
  collected: number;
  cumulativeSales: number;
  cumulativeTickets: number;
  intervalSales: number;
  intervalTickets: number;
}

export interface HourlySalesPoint {
  hour: string;
  sales: number;
  tickets: number;
}

export async function getLiveDashboardData(dateInput?: string | Date) {
  let kpisData: any = null;
  let bookingsData: any[] = [];
  let paymentsData: any[] = [];
  let tripsData: any[] = [];

  try {
    const [kpiRes, bookRes, payRes, tripRes] = await Promise.all([
      fastApiClient.getDashboardKpi(),
      fastApiClient.get('/bookings/'),
      fastApiClient.getPayments(),
      fastApiClient.getTrips()
    ]);

    if (kpiRes.success && kpiRes.data) kpisData = kpiRes.data;
    if (bookRes.success && Array.isArray(bookRes.data)) bookingsData = bookRes.data;
    if (payRes.success && Array.isArray(payRes.data)) paymentsData = payRes.data;
    if (tripRes.success && Array.isArray(tripRes.data)) tripsData = tripRes.data;
  } catch (e) {
    console.warn('Dashboard live data fetch warning:', e);
  }

  const todaySales = kpisData?.today_sales ?? bookingsData.reduce((sum, b) => sum + (Number(b.net_amount) || 0), 0);
  const todayTickets = kpisData?.today_tickets ?? bookingsData.reduce((sum, b) => sum + (b.seats?.length || 1), 0);
  const todayCollected = kpisData?.today_collected ?? paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const todayDue = kpisData?.today_due ?? Math.max(0, todaySales - todayCollected);
  const activeBuses = kpisData?.active_buses ?? tripsData.length;
  const activeTrips = kpisData?.active_trips ?? tripsData.filter((t: any) => t.status === 'SCHEDULED' || t.status === 'BOARDING').length;

  // Real payment method breakdown
  const methodTotals: Record<string, { total: number; count: number }> = {
    BKASH: { total: 0, count: 0 },
    NAGAD: { total: 0, count: 0 },
    ROCKET: { total: 0, count: 0 },
    HAND_CASH: { total: 0, count: 0 },
    BANK_TRANSFER: { total: 0, count: 0 }
  };
  paymentsData.forEach((p: any) => {
    const m = (p.method || 'HAND_CASH').toUpperCase();
    if (!methodTotals[m]) methodTotals[m] = { total: 0, count: 0 };
    methodTotals[m].total += Number(p.amount) || 0;
    methodTotals[m].count += 1;
  });

  // Real today bookings
  const todayBookings = bookingsData.slice(0, 10).map((b: any) => ({
    id: b.id,
    bookingNumber: b.booking_number || b.bookingNumber || 'BK-CONF',
    busNumber: b.trip?.bus?.bus_number || b.bus_number || 'DHAKA-BUS',
    tripCode: b.trip?.trip_code || b.trip_code || 'TRIP-01',
    passengerName: b.contact_name || b.passengers?.[0]?.passenger_name || 'Passenger',
    passengerPhone: b.contact_phone || b.passengers?.[0]?.passenger_phone || '—',
    seats: (b.seats || []).map((s: any) => ({ seat: { seatNumber: s.seat?.seat_number || s.seat_id || 'A1' } })),
    grossAmount: Number(b.gross_amount) || Number(b.net_amount) || 0,
    discountAmount: Number(b.discount_amount) || 0,
    netAmount: Number(b.net_amount) || 0,
    paymentStatus: b.payment_status || 'PAID',
    createdAt: b.created_at ? new Date(b.created_at) : new Date()
  }));

  // Real bus performance
  const busPerformance = tripsData.map((t: any) => {
    const totalSeats = t.bus?.seatLayout?.totalSeats || t.bus?.capacity || 40;
    const bookedSeats = t.bookings?.length || 0;
    const occupancyPercent = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
    const totalRevenue = (t.bookings || []).reduce((sum: number, b: any) => sum + (Number(b.net_amount) || 0), 0);

    return {
      tripId: t.id,
      busId: t.bus_id || t.bus?.id || 'bus-1',
      tripCode: t.trip_code || 'TRIP-001',
      busName: t.bus?.bus_name || t.bus?.busName || 'Express Bus',
      busNumber: t.bus?.bus_number || t.bus?.busNumber || 'METRO-01',
      busType: t.bus_type || t.bus?.bus_type || 'MIXED',
      routeName: t.route?.route_name || t.route?.routeName || 'Admission Route',
      tripCount: 1,
      totalSeats,
      bookedSeats,
      soldSeats: bookedSeats,
      occupancyPercent,
      occupancyRate: occupancyPercent,
      netSales: totalRevenue,
      totalRevenue,
      status: t.status || 'ACTIVE'
    };
  });

  // Real recent transactions
  const recentTransactions = paymentsData.slice(0, 10).map((p: any) => ({
    id: p.id,
    trxId: p.notes?.replace('TrxID: ', '') || p.transaction_id || p.id,
    method: p.method || 'HAND_CASH',
    amount: Number(p.amount) || 0,
    bookingNumber: p.booking?.booking_number || 'BK-CONF',
    passengerName: p.booking?.contact_name || p.booking?.passengers?.[0]?.passenger_name || 'Passenger',
    timestamp: p.created_at ? new Date(p.created_at) : new Date()
  }));

  // Real activity feed
  const activityFeed = paymentsData.slice(0, 5).map((p: any) => ({
    id: `act-${p.id}`,
    action: 'PAYMENT_RECEIVED',
    entity: 'Payment',
    entityId: p.id,
    description: `${p.method} পেমেন্ট সংগ্রহ ৳${p.amount} (${p.booking?.booking_number || 'Booking'})`,
    user: { fullName: p.received_by?.full_name || 'Staff' },
    createdAt: p.created_at ? new Date(p.created_at) : new Date()
  }));

  return {
    kpis: {
      todaySales,
      todayTickets,
      todayCollected,
      todayDue,
      occupancyRate: tripsData.length > 0
        ? Math.round(tripsData.reduce((sum, t) => {
            const totalSeats = t.bus?.seatLayout?.totalSeats || t.bus?.capacity || 0;
            const bookedSeats = t.bookings?.length || 0;
            return totalSeats > 0 ? sum + (bookedSeats / totalSeats) : sum;
          }, 0) / tripsData.length * 100)
        : 0,
      activeBuses,
      activeTrips,
      shortExcess: 0
    },
    todayTrips: tripsData,
    todayBookings,
    recentPayments: paymentsData,
    methodBreakdown: methodTotals,
    hourlySales: [] as HourlySalesPoint[],
    progressiveSales: [] as ProgressiveSalesSlot[],
    busPerformance,
    paymentBreakdown: {
      BKASH: methodTotals.BKASH.total,
      NAGAD: methodTotals.NAGAD.total,
      ROCKET: methodTotals.ROCKET.total,
      HAND_CASH: methodTotals.HAND_CASH.total,
      BANK_TRANSFER: methodTotals.BANK_TRANSFER.total,
      OTHER: 0
    },
    routeBreakdown: tripsData.map((t: any) => ({
      routeName: t.route?.route_name || 'Admission Express Route',
      ticketsSold: t.bookings?.length || 0,
      revenue: (t.bookings || []).reduce((sum: number, b: any) => sum + (Number(b.net_amount) || 0), 0)
    })),
    passengerDemographics: {
      male: bookingsData.filter((b: any) => b.passenger_gender === 'MALE').length,
      female: bookingsData.filter((b: any) => b.passenger_gender === 'FEMALE').length,
      students: bookingsData.filter((b: any) => b.is_student).length,
      guardians: bookingsData.filter((b: any) => !b.is_student).length
    },
    recentTransactions,
    activityFeed,
    tripOccupancyList: tripsData.map((t: any) => {
      const totalSeats = t.bus?.seatLayout?.totalSeats || t.bus?.capacity || 40;
      const soldSeats = t.bookings?.length || 0;
      return {
        tripCode: t.trip_code || 'TRIP-01',
        busName: t.bus?.bus_name || 'Express Bus',
        route: t.route?.route_name || 'Route',
        departureTime: t.departure_time || '20:30',
        totalSeats,
        soldSeats,
        lockedSeats: 0,
        availableSeats: Math.max(0, totalSeats - soldSeats),
        occupancyPercent: totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0,
        totalSales: (t.bookings || []).reduce((sum: number, b: any) => sum + (Number(b.net_amount) || 0), 0)
      };
    })
  };
}
