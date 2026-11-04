import React from 'react';
import { GroupBookingClient } from '@/components/booking/group-booking-client';
import { getAllTrips } from '@/services/trip.service';
import { getAllBuses } from '@/services/bus.service';

export const revalidate = 0;

export default async function GroupBookingPage() {
  const [tripsData, busesData] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getAllBuses().catch(() => [])
  ]);

  const rawTrips = Array.isArray(tripsData) ? tripsData : [];
  const rawBuses = Array.isArray(busesData) ? busesData : [];

  return <GroupBookingClient initialTrips={rawTrips} initialBuses={rawBuses} />;
}
