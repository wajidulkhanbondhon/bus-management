'use server';

import { holdSeat, releaseSeatHold, lockSeat, unlockSeat } from '@/services/inventory.service';
import { requireUser, requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function holdSeatAction(tripId: string, seatId: string) {
  try {
    const user = await requireUser();
    const hold = await holdSeat(tripId, seatId, user.id);
    revalidatePath(`/trips/${tripId}/seat-map`);
    revalidatePath('/bookings/new');
    return { success: true, hold };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to hold seat' };
  }
}

export async function releaseSeatHoldAction(tripId: string, seatId: string) {
  try {
    const user = await requireUser();
    await releaseSeatHold(tripId, seatId, user.id);
    revalidatePath(`/trips/${tripId}/seat-map`);
    revalidatePath('/bookings/new');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to release seat hold' };
  }
}

export async function lockSeatAction(data: {
  tripId: string;
  seatId: string;
  lockType: 'PERMANENT' | 'TEMPORARY';
  reason: string;
  notes?: string;
  lockedUntil?: string | null;
}) {
  try {
    const user = await requirePermission('seat:lock_unlock');
    const lock = await lockSeat({
      ...data,
      lockedBy: user.id
    });
    revalidatePath(`/trips/${data.tripId}/seat-map`);
    return { success: true, lock };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to lock seat' };
  }
}

export async function unlockSeatAction(tripId: string, seatId: string) {
  try {
    const user = await requirePermission('seat:lock_unlock');
    await unlockSeat(tripId, seatId, user.id);
    revalidatePath(`/trips/${tripId}/seat-map`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unlock seat' };
  }
}
