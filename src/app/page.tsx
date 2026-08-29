import React from 'react';
import { getAllTrips } from '@/services/trip.service';
import { getAllRoutes } from '@/services/bus.service';
import { PublicHomeView } from '@/components/home';

export const dynamic = 'force-dynamic';

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
      totalSeats,
      bookedCount,
      availableCount,
      bus: trip.bus || {
        busName: 'Dhaka Express 01',
        busNumber: 'DHAKA-METRO-BA-11-2024',
        seatLayout: { totalSeats: 40 },
      },
      route: trip.route || {
        origin: 'Dhaka Gabtoli',
        destination: 'Rajshahi University',
        routeName: 'Dhaka to Rajshahi University (RU Unit-A)',
      },
    };
  });

  const allRoutes = await getAllRoutes();
  const origins: string[] = Array.from(
    new Set(allRoutes.map((r: any) => (r.origin as string) || 'Dhaka Gabtoli'))
  );
  if (origins.length === 0) origins.push('Dhaka Gabtoli', 'Chittagong GEC', 'Sylhet');

  const destinations: string[] = Array.from(
    new Set(
      allRoutes.map(
        (r: any) => (r.destination as string) || 'Rajshahi University'
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
