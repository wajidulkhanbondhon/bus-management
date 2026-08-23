import React from 'react';
import { notFound } from 'next/navigation';
import { InteractiveSeatMap } from '@/components/trip/interactive-seat-map';
import { getTripSeatInventory } from '@/services/inventory.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export default async function TripSeatMapPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    const inventory = await getTripSeatInventory(id, user?.id);

    return (
      <InteractiveSeatMap
        trip={inventory.trip}
        seats={inventory.seats}
        summary={inventory.summary}
        currentUserId={user?.id}
      />
    );
  } catch (error) {
    notFound();
  }
}
