import React, { Suspense } from 'react';
import { getAllBuses } from '@/services/bus.service';
import { getAllLayouts } from '@/services/seat-layout.service';
import { BusListView } from '@/components/bus/bus-list-view';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function BusesPage() {
  const [buses, layouts] = await Promise.all([
    getAllBuses(),
    getAllLayouts()
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading fleet roster...</div>}>
      <BusListView buses={buses} layouts={layouts} />
    </Suspense>
  );
}
