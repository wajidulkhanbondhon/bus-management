import React from 'react';
import { SeatBuilderCanvas } from '@/components/bus/seat-builder-canvas';
import { getAllFareZones, getAllLayouts } from '@/services/seat-layout.service';

export const revalidate = 0;

export default async function SeatBuilderPage() {
  const [fareZones, savedLayouts] = await Promise.all([
    getAllFareZones(),
    getAllLayouts()
  ]);

  return <SeatBuilderCanvas fareZones={fareZones} savedLayouts={savedLayouts} />;
}
