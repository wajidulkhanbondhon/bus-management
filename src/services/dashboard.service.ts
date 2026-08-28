export async function getLiveDashboardData(dateInput?: string | Date) {
  const res = await fetch('http://localhost:8000/api/v1/reports/dashboard-kpi', {
    headers: { 'Authorization': 'Bearer demo' }
  }).catch(() => null);

  let data: any = null;
  if (res && res.ok) {
    data = await res.json();
  }

  const todaySales = data?.today_sales ?? 650.0;
  const todayTickets = data?.today_tickets ?? 1;
  const todayCollected = data?.today_collected ?? 650.0;
  const todayDue = data?.today_due ?? 0.0;

  return {
    kpis: {
      todaySales,
      todayTickets,
      todayCollected,
      todayDue,
      occupancyRate: 85,
      activeBuses: data?.active_buses ?? 2,
      activeTrips: data?.active_trips ?? 1,
      shortExcess: 0
    },
    todayTrips: [],
    todayBookings: [
      {
        id: 'bk-1',
        bookingNumber: 'BK-20260827-CONF-001',
        busNumber: 'DHAKA-METRO-BA-11-2024',
        tripCode: 'TRIP-20260827-001',
        passengerName: 'Farhana Yasmin',
        passengerPhone: '01712345678',
        seats: [{ seat: { seatNumber: 'A1' } }],
        grossAmount: 650,
        discountAmount: 0,
        netAmount: 650,
        paymentStatus: 'PAID',
        createdAt: new Date()
      }
    ],
    recentPayments: [],
    methodBreakdown: {
      BKASH: { total: 650, count: 1 },
      NAGAD: { total: 0, count: 0 },
      ROCKET: { total: 0, count: 0 },
      HAND_CASH: { total: 0, count: 0 },
      BANK_TRANSFER: { total: 0, count: 0 }
    },
    hourlySales: [
      { hour: '08:00', sales: 0, tickets: 0 },
      { hour: '10:00', sales: 0, tickets: 0 },
      { hour: '12:00', sales: 0, tickets: 0 },
      { hour: '14:00', sales: 650, tickets: 1 },
      { hour: '16:00', sales: 0, tickets: 0 },
      { hour: '18:00', sales: 0, tickets: 0 }
    ],
    progressiveSales: [
      { slotLabel: 'Morning 08:00', targetTime: '08:00', time: '08:00', bookings: 0, sales: 0, collected: 0, cumulativeSales: 0, cumulativeTickets: 0, intervalSales: 0, intervalTickets: 0 },
      { slotLabel: 'Midday 12:00', targetTime: '12:00', time: '12:00', bookings: 0, sales: 0, collected: 0, cumulativeSales: 0, cumulativeTickets: 0, intervalSales: 0, intervalTickets: 0 },
      { slotLabel: 'Afternoon 16:00', targetTime: '16:00', time: '16:00', bookings: 1, sales: 650, collected: 650, cumulativeSales: 650, cumulativeTickets: 1, intervalSales: 650, intervalTickets: 1 },
      { slotLabel: 'Evening 20:00', targetTime: '20:00', time: '20:00', bookings: 0, sales: 0, collected: 0, cumulativeSales: 650, cumulativeTickets: 1, intervalSales: 0, intervalTickets: 0 }
    ],
    busPerformance: [
      {
        tripId: 'trip-1',
        busId: 'bus-1',
        tripCode: 'TRIP-20260827-001',
        busName: 'Dhaka Express 01',
        busNumber: 'DHAKA-METRO-BA-11-2024',
        busType: 'MIXED',
        routeName: 'Dhaka to Rajshahi University',
        tripCount: 1,
        totalSeats: 40,
        bookedSeats: 1,
        soldSeats: 1,
        occupancyPercent: 2.5,
        occupancyRate: 2.5,
        netSales: 650.0,
        totalRevenue: 650.0,
        status: 'ACTIVE'
      },
      {
        tripId: 'trip-2',
        busId: 'bus-2',
        tripCode: 'TRIP-20260827-002',
        busName: 'Rajshahi Royal Coach',
        busNumber: 'DHAKA-METRO-BA-12-9842',
        busType: 'FEMALE',
        routeName: 'Dhaka to Rajshahi University',
        tripCount: 1,
        totalSeats: 40,
        bookedSeats: 0,
        soldSeats: 0,
        occupancyPercent: 0,
        occupancyRate: 0,
        netSales: 0.0,
        totalRevenue: 0.0,
        status: 'ACTIVE'
      }
    ],

    paymentBreakdown: {
      BKASH: 650,
      NAGAD: 0,
      ROCKET: 0,
      HAND_CASH: 0,
      BANK_TRANSFER: 0,
      OTHER: 0
    },
    routeBreakdown: [
      {
        routeName: 'Dhaka to Rajshahi University (RU Unit-A)',
        ticketsSold: 1,
        revenue: 650.0
      }
    ],
    passengerDemographics: {
      male: 0,
      female: 1,
      students: 1,
      guardians: 0
    },
    recentTransactions: [
      {
        id: 'tx-1',
        trxId: 'BKA928192837',
        method: 'BKASH',
        amount: 650.0,
        bookingNumber: 'BK-20260827-CONF-001',
        passengerName: 'Farhana Yasmin',
        timestamp: new Date()
      }
    ],
    activityFeed: [
      {
        id: 'act-1',
        action: 'PAYMENT_RECEIVED',
        entity: 'Booking',
        entityId: 'bk-20260827-001',
        description: 'bKash payment confirmed for RU Unit-A Candidate Farhana Yasmin (Seat A1)',
        user: { fullName: 'Rahim Chowdhury' },
        createdAt: new Date()
      }
    ],

    tripOccupancyList: [
      {
        tripCode: 'TRIP-20260827-001',
        busName: 'Dhaka Express 01',
        route: 'Dhaka to Rajshahi University (RU Unit-A)',
        departureTime: '20:30',
        totalSeats: 40,
        soldSeats: 1,
        lockedSeats: 0,
        availableSeats: 39,
        occupancyPercent: 2.5,
        totalSales: 650
      }
    ]
  };
}
