import React from 'react';
import { getAllBuses, getAllRoutes } from '@/services/bus.service';
import { getAllFareZones } from '@/services/seat-layout.service';
import { TripCreateForm } from '@/components/trip/trip-create-form';

export const revalidate = 0;

export default async function CreateTripPage() {
  const [buses, routes, fareZones] = await Promise.all([
    getAllBuses(),
    getAllRoutes(),
    getAllFareZones()
  ]);

  return <TripCreateForm buses={buses} routes={routes} fareZones={fareZones} />;
}
