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
      data: trips.map(t => ({
        id: t.id,
        tripCode: t.tripCode,
        bus: {
          id: t.bus.id,
          name: t.bus.busName,
          number: t.bus.busNumber,
          type: t.tripBusType || t.bus.busType,
          capacity: t.bus.capacity
        },
        route: {
          id: t.route.id,
          name: t.route.routeName,
          origin: t.route.origin,
          destination: t.route.destination
        },
        departureDate: t.departureDate,
        departureTime: t.departureTime,
        basePrice: t.basePrice,
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
