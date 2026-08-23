import React from 'react';
import { getAllBuses } from '@/services/bus.service';
import { getAllLayouts } from '@/services/seat-layout.service';
import { BusListView } from '@/components/bus/bus-list-view';

export const revalidate = 0;

export default async function BusesPage() {
  const [buses, layouts] = await Promise.all([
    getAllBuses(),
    getAllLayouts()
  ]);

  return <BusListView buses={buses} layouts={layouts} />;
}
