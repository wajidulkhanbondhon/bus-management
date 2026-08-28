'use server';

import {
  createBooking,
  cancelBooking,
  createPreBooking,
  verifyAndStartPaymentTimer,
  confirmPreBookingPayment,
  rejectPreBooking,
  getOnlinePreBookings,
  getBookingByTrackingNumber,
  CreateBookingInput,
  CreatePreBookingInput
} from '@/services/booking.service';
import { getCurrentUser, requireUser, requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  CreateBookingSchema,
  CreatePreBookingSchema,
  VerifyTimerSchema,
  ConfirmPreBookingPaymentSchema,
  TrackBookingSchema
} from '@/lib/validations';

function formatZodErrors(error: any): string {
  if (error?.issues) {
    return error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ');
  }
  return 'Invalid input data';
}

export async function createBookingAction(input: Omit<CreateBookingInput, 'createdById'>) {
  try {
    // Validate input
    const parsed = CreateBookingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodErrors(parsed.error) };
    }

    const user = await requirePermission('booking:create');
    const booking = await createBooking({
      ...parsed.data,
      createdById: user.id
    } as CreateBookingInput);

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
    if (!bookingId || !reason || reason.trim().length === 0) {
      return { success: false, error: 'Booking ID and cancellation reason are required' };
    }

    const user = await requirePermission('booking:cancel');
    const booking = await cancelBooking(bookingId, reason.trim(), user.id);
    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel booking' };
  }
}

export async function createPreBookingAction(input: CreatePreBookingInput) {
  try {
    // Validate input
    const parsed = CreatePreBookingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodErrors(parsed.error) };
    }

    const user = await getCurrentUser();

    // RBAC: If authenticated (counter staff), require booking:create permission
    // If not authenticated, allow as public online pre-booking
    if (user) {
      if (user.role.name !== 'SUPER_ADMIN' && !user.role.permissions.includes('booking:create')) {
        return { success: false, error: 'You do not have permission to create bookings from the counter.' };
      }
    }

    const booking = await createPreBooking({
      ...parsed.data,
      createdById: user?.id || undefined,
      source: user ? 'COUNTER' : 'ONLINE'
    });

    revalidatePath('/bookings/online-requests');
    revalidatePath('/dashboard');
    revalidatePath(`/trips/${input.tripId}/seat-map`);
    revalidatePath('/');
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create pre-booking' };
  }
}

export async function verifyAndStartTimerAction(params: {
  bookingId: string;
  durationMinutes?: number;
  passengerGender?: 'MALE' | 'FEMALE';
  isStudent?: boolean;
  studentAdmissionId?: string;
  notes?: string;
}) {
  try {
    // Validate input
    const parsed = VerifyTimerSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: formatZodErrors(parsed.error) };
    }

    const user = await requireUser();
    const booking = await verifyAndStartPaymentTimer({
      ...parsed.data,
      staffId: user.id
    });

    revalidatePath('/bookings/online-requests');
    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    if (booking.tripId) {
      revalidatePath(`/trips/${booking.tripId}/seat-map`);
    }
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify booking and start timer' };
  }
}

export async function confirmPreBookingPaymentAction(params: {
  bookingId: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  paidAmount?: number;
  transactionId?: string;
  senderReference?: string;
  notes?: string;
}) {
  try {
    // Validate input
    const parsed = ConfirmPreBookingPaymentSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: formatZodErrors(parsed.error) };
    }

    const user = await requireUser();
    const booking = await confirmPreBookingPayment({
      ...parsed.data,
      staffId: user.id
    });

    revalidatePath('/bookings/online-requests');
    revalidatePath('/bookings');
    revalidatePath('/payments');
    revalidatePath('/dashboard');
    if (booking.tripId) {
      revalidatePath(`/trips/${booking.tripId}/seat-map`);
    }
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to confirm payment' };
  }
}

export async function rejectPreBookingAction(bookingId: string, reason: string) {
  try {
    if (!bookingId || !reason || reason.trim().length === 0) {
      return { success: false, error: 'Booking ID and rejection reason are required' };
    }

    const user = await requireUser();
    const booking = await rejectPreBooking({
      bookingId,
      staffId: user.id,
      reason: reason.trim()
    });

    revalidatePath('/bookings/online-requests');
    revalidatePath('/dashboard');
    if (booking.tripId) {
      revalidatePath(`/trips/${booking.tripId}/seat-map`);
    }
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject pre-booking' };
  }
}

export async function getOnlinePreBookingsAction(filters?: { status?: string; search?: string }) {
  try {
    await requireUser();
    const bookings = await getOnlinePreBookings(filters);
    return { success: true, bookings };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load pre-bookings', bookings: [] };
  }
}

export async function trackBookingAction(query: string) {
  try {
    const parsed = TrackBookingSchema.safeParse({ query });
    if (!parsed.success) {
      return { success: false, error: 'অনুগ্রহ করে একটি বৈধ বুকিং নম্বর বা ফোন নম্বর দিন।' };
    }

    const booking = await getBookingByTrackingNumber(parsed.data.query);
    if (!booking) {
      return { success: false, error: 'কোনো বুকিং রেকর্ড পাওয়া যায়নি। নম্বরটি আবার চেক করুন।' };
    }
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'বুকিং ট্র্যাক করতে সমস্যা হয়েছে।' };
  }
}
