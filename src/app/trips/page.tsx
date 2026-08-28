import React from 'react';
import { getAllTrips } from '@/services/trip.service';
import { TripsRosterClient } from '@/components/trip/trips-roster-client';

export const revalidate = 0;

export default async function TripsPage() {
  const trips = await getAllTrips();

  return <TripsRosterClient initialTrips={trips || []} />;
}

