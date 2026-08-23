import React from 'react';
import { getAllLayouts } from '@/services/seat-layout.service';
import { getAllBuses } from '@/services/bus.service';
import { BusCreateForm } from '@/components/bus/bus-create-form';

export const revalidate = 0;

export default async function CreateBusPage() {
  const [layouts, existingBuses] = await Promise.all([
    getAllLayouts(),
    getAllBuses()
  ]);

  return <BusCreateForm layouts={layouts} existingBuses={existingBuses} />;
}
