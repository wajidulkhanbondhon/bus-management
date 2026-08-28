import { NextRequest, NextResponse } from 'next/server';
import { getAllTrips } from '@/services/trip.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const busId = searchParams.get('busId') || undefined;

    const trips = await getAllTrips({ date, status, busId });

    return NextResponse.json({
      success: true,
      count: trips.length,
      data: (trips || []).map((t: any) => ({
        id: t.id,
        tripCode: t.tripCode || t.trip_code,
        bus: {
          id: t.bus?.id || 'bus-1',
          name: t.bus?.busName || t.bus?.bus_name || 'Dhaka Express 01',
          number: t.bus?.busNumber || t.bus?.bus_number || 'DHAKA-METRO-BA-11-2024',
          type: t.tripBusType || t.trip_bus_type || t.bus?.busType || 'MIXED',
          capacity: t.bus?.capacity || 40
        },
        route: {
          id: t.route?.id || 'route-1',
          name: t.route?.routeName || t.route?.route_name || 'Dhaka to Rajshahi',
          origin: t.route?.origin || 'Dhaka Gabtoli',
          destination: t.route?.destination || 'Rajshahi University'
        },
        departureDate: t.departureDate || t.departure_date,
        departureTime: t.departureTime || t.departure_time,
        basePrice: t.basePrice || t.base_fare || 550,
        status: t.status
      }))
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
