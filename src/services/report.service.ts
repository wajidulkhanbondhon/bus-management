import { fastApiClient } from '@/lib/api-client';

export async function getSalesReport(filters?: any) {
  let bookings: any[] = [];
  let kpis: any = null;

  try {
    const [bookRes, kpiRes] = await Promise.all([
      fastApiClient.get('/bookings/'),
      fastApiClient.getDashboardKpi()
    ]);
    if (bookRes.success && Array.isArray(bookRes.data)) bookings = bookRes.data;
    if (kpiRes.success && kpiRes.data) kpis = kpiRes.data;
  } catch (err) {
    console.warn('Sales report API warning:', err);
  }

  const mappedBookings = bookings.map((b: any) => ({
    id: b.id,
    bookingNumber: b.booking_number || b.bookingNumber || 'BK-000',
    busNumber: b.trip?.bus?.bus_number || b.bus_number || 'DHAKA-METRO',
    tripCode: b.trip?.trip_code || b.trip_code || 'TRIP-01',
    passengerName: b.contact_name || b.passengers?.[0]?.passenger_name || 'Student',
    passengerPhone: b.contact_phone || b.passengers?.[0]?.passenger_phone || '—',
    seats: (b.seats || []).map((s: any) => ({ seat: { seatNumber: s.seat?.seat_number || s.seat_id || 'A1' } })),
    grossAmount: Number(b.gross_amount) || Number(b.net_amount) || 0,
    discountAmount: Number(b.discount_amount) || 0,
    netAmount: Number(b.net_amount) || 0,
    paymentStatus: b.payment_status || 'PAID',
    createdAt: b.created_at ? new Date(b.created_at) : new Date()
  }));

  const totalGross = mappedBookings.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalDiscount = mappedBookings.reduce((sum, b) => sum + b.discountAmount, 0);
  const totalNet = mappedBookings.reduce((sum, b) => sum + b.netAmount, 0);
  const totalPaid = kpis?.today_collected ?? totalNet;
  const totalDue = kpis?.today_due ?? Math.max(0, totalNet - totalPaid);
  const totalSeats = mappedBookings.reduce((sum, b) => sum + b.seats.length, 0);

  return {
    summary: {
      totalGross: totalGross || kpis?.today_sales || 0,
      totalDiscount,
      totalNet: totalNet || kpis?.today_sales || 0,
      totalPaid,
      totalDue,
      totalSeats: totalSeats || kpis?.today_tickets || 0,
      totalBookings: mappedBookings.length,
      grossSales: totalGross || kpis?.today_sales || 0,
      netSales: totalNet || kpis?.today_sales || 0,
      totalCollected: totalPaid,
      totalTickets: totalSeats || kpis?.today_tickets || 0
    },
    bookings: mappedBookings
  };
}

export async function getBusWiseSalesReport(filters?: any) {
  let trips: any[] = [];
  try {
    const res = await fastApiClient.getTrips();
    if (res.success && Array.isArray(res.data)) trips = res.data;
  } catch {}

  return trips.map((t: any) => {
    const seatsSold = t.bookings?.length || 0;
    const totalSeats = t.bus?.seatLayout?.totalSeats || t.bus?.capacity || 40;
    const grossSales = (t.bookings || []).reduce((sum: number, b: any) => sum + (Number(b.net_amount) || 0), 0);
    const occupancyRate = totalSeats > 0 ? (seatsSold / totalSeats) * 100 : 0;

    return {
      busId: t.bus_id || t.bus?.id || 'bus-1',
      busName: t.bus?.bus_name || t.bus?.busName || 'Express Coach',
      busNumber: t.bus?.bus_number || t.bus?.busNumber || 'METRO-01',
      totalTrips: 1,
      totalTickets: seatsSold,
      bookingsCount: seatsSold,
      seatsSold,
      grossSales,
      discount: 0,
      netSales: grossSales,
      collected: grossSales,
      netRevenue: grossSales,
      due: 0,
      occupancyRate
    };
  });
}
