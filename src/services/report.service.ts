export async function getSalesReport(filters?: any) {
  return {
    summary: {
      totalGross: 650,
      totalDiscount: 0,
      totalNet: 650,
      totalPaid: 650,
      totalDue: 0,
      totalSeats: 1,
      totalBookings: 1,
      grossSales: 650,
      netSales: 650,
      totalCollected: 650,
      totalTickets: 1
    },
    bookings: [
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
    ]
  };
}

export async function getBusWiseSalesReport(filters?: any) {
  return [
    {
      busId: 'bus-1',
      busName: 'Dhaka Express 01 (Admission Special)',
      busNumber: 'DHAKA-METRO-BA-11-2024',
      totalTrips: 1,
      totalTickets: 1,
      bookingsCount: 1,
      seatsSold: 1,
      grossSales: 650,
      discount: 0,
      netSales: 650,
      collected: 650,
      netRevenue: 650,
      due: 0,
      occupancyRate: 2.5
    }
  ];
}
