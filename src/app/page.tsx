import React from 'react';
import { getAllTrips } from '@/services/trip.service';
import { getAllRoutes } from '@/services/bus.service';
import { PublicHomeView } from '@/components/home';

export const dynamic = 'force-dynamic';

interface RouteData {
  origin: string;
  destination: string;
  routeName?: string;
}

interface TripData {
  id: string;
  bus?: {
    busName?: string;
    busNumber?: string;
    capacity?: number;
    seatLayout?: { totalSeats: number };
  };
  bookings?: any[];
  route?: RouteData;
  [key: string]: any;
}


export default async function PublicHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const date = resolvedSearchParams.date;

  // Fetch active scheduled trips from FastAPI backend
  const trips = await getAllTrips({
    status: 'SCHEDULED',
    date,
  });

  // Transform trips with inventory statistics
  const tripsWithInventory = (trips || []).map((trip: any) => {
    const totalSeats =
      trip.bus?.seatLayout?.totalSeats || trip.bus?.capacity || 40;
    const bookedCount = trip.bookings?.length || 1;
    const availableCount = Math.max(0, totalSeats - bookedCount);

    return {
      ...trip,
      id: trip.id,
      tripCode: trip.tripCode || trip.trip_code || `TRIP-${trip.id?.slice(0, 6) || 'COACH'}`,
      tripBusType: trip.tripBusType || trip.trip_bus_type || 'MIXED',
      departureDate: trip.departureDate || trip.departure_date || new Date().toISOString(),
      departureTime: trip.departureTime || trip.departure_time || '22:30',
      basePrice: Number(trip.basePrice ?? trip.base_price ?? 550),
      status: trip.status || 'SCHEDULED',
      totalSeats,
      bookedCount,
      availableCount,
      bus: {
        busName: trip.bus?.busName || trip.bus?.bus_name || 'Dhaka Express 01',
        busNumber: trip.bus?.busNumber || trip.bus?.bus_number || 'DHAKA-METRO-BA-11-2024',
        regNumber: trip.bus?.regNumber || trip.bus?.reg_number,
        seatLayout: trip.bus?.seatLayout || { totalSeats: 40 },
      },
      route: {
        origin: trip.route?.origin || 'Dhaka Gabtoli',
        destination: trip.route?.destination || 'Rajshahi University',
        routeName: trip.route?.routeName || trip.route?.route_name || 'Dhaka to Rajshahi University (RU Unit-A)',
      },
    };
  });

  const allRoutes = await getAllRoutes();
  const origins: string[] = Array.from(
    new Set(allRoutes.map((r: RouteData) => (r.origin as string) || 'Dhaka Gabtoli'))
  );
  if (origins.length === 0) origins.push('Dhaka Gabtoli', 'Chittagong GEC', 'Sylhet');

  const destinations: string[] = Array.from(
    new Set(
      allRoutes.map(
        (r: RouteData) => (r.destination as string) || 'Rajshahi University'
      )
    )
  );
  if (destinations.length === 0)
    destinations.push(
      'Rajshahi University',
      'Chittagong University',
      'GST Cluster'
    );

  return (
    <PublicHomeView
      initialTrips={tripsWithInventory}
      origins={origins}
      destinations={destinations}
    />
  );
}
