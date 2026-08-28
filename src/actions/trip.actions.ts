'use server';

import { createTrip, CreateTripInput } from '@/services/trip.service';
import { requirePermission } from '@/lib/auth';
import { logAudit } from '@/services/audit.service';
import { revalidatePath } from 'next/cache';

export async function createTripAction(input: CreateTripInput) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const trip = await createTrip(input, user.id);
    revalidatePath('/');
    revalidatePath('/trips');
    revalidatePath('/dashboard');
    revalidatePath('/passenger');
    revalidatePath('/buses');
    return { success: true, trip };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create trip' };
  }
}

export async function updateTripStatusAction(tripId: string, status: string) {
  try {
    const user = await requirePermission('bus_trip:manage');
    await logAudit({
      userId: user.id,
      action: 'TRIP_STATUS_UPDATED',
      entity: 'Trip',
      entityId: tripId,
      newValue: { status }
    });

    revalidatePath('/trips');
    revalidatePath(`/trips/${tripId}/seat-map`);
    return { success: true, trip: { id: tripId, status } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update trip status' };
  }
}
