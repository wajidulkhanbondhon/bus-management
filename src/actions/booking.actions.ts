'use server';

import { createBooking, cancelBooking, CreateBookingInput } from '@/services/booking.service';
import { requireUser, requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createBookingAction(input: Omit<CreateBookingInput, 'createdById'>) {
  try {
    const user = await requirePermission('booking:create');
    const booking = await createBooking({
      ...input,
      createdById: user.id
    });

    revalidatePath('/dashboard');
    revalidatePath('/bookings');
    revalidatePath('/sales/today');
    revalidatePath(`/trips/${input.tripId}/seat-map`);
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create booking' };
  }
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  try {
    const user = await requirePermission('booking:cancel');
    const booking = await cancelBooking(bookingId, reason, user.id);
    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel booking' };
  }
}
