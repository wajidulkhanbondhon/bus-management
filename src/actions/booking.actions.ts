'use server';

import {
  createBooking,
  cancelBooking,
  createPreBooking,
  verifyAndStartPaymentTimer,
  confirmPreBookingPayment,
  rejectPreBooking,
  shiftBookingSeat,
  swapBookingSeats,
  transferBookingTrip,
  cancelBookingSeat,
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

import { cookies } from 'next/headers';

function formatZodErrors(error: any): string {
  if (error?.issues) {
    return error.issues.map((i: any) => {
      const msg = i.message || '';
      if (msg.includes('Trip ID is required')) return 'ট্রিপ বা বাস নির্বাচন করা আবশ্যক।';
      if (msg.includes('At least one seat must be selected')) return 'অনুগ্রহ করে অন্তত একটি আসন নির্বাচন করুন।';
      if (msg.includes('At least one passenger is required')) return 'কমপক্ষে একজন যাত্রীর তথ্য প্রয়োজন।';
      if (msg.includes('Passenger name is required')) return 'যাত্রীর নাম প্রদান করা আবশ্যক।';
      if (msg.includes('Seat ID is required')) return 'আসন নম্বর নির্বাচন করা আবশ্যক।';
      if (msg.includes('Paid amount cannot exceed')) return 'পরিশোধের পরিমাণ সর্বমোট প্রদেয় ভাড়ার চেয়ে বেশি হতে পারে না।';
      if (msg.includes('Fare must be non-negative')) return 'ভাড়ার পরিমাণ সঠিক নয়।';
      if (msg.includes('Discount is unreasonably large')) return 'ছাড়ের পরিমাণ অত্যধিক বেশি।';
      if (i.path?.includes('passengerPhone') || msg.includes('১১ ডিজিট')) return '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)।';
      return msg;
    }).join('; ');
  }
  return 'প্রদত্ত তথ্যে ভুল রয়েছে। অনুগ্রহ করে তথ্য যাচাই করে পুনরায় চেষ্টা করুন।';
}

async function getAuthOptions(user?: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('fastapi_token')?.value;
  try {
    const { getValidFastApiToken } = await import('@/lib/token');
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || 'SUPER_ADMIN';
    const validToken = getValidFastApiToken(token, user?.id || 'admin-super-001', roleName, user?.tenantId || 'central-transit');
    return validToken ? { headers: { Authorization: `Bearer ${validToken}` } } : undefined;
  } catch {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  }
}

export async function createBookingAction(input: Omit<CreateBookingInput, 'createdById'>) {
  try {
    // Validate input
    const parsed = CreateBookingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodErrors(parsed.error) };
    }

    const user = await requirePermission('booking:create');
    const options = await getAuthOptions(user);
    const booking = await createBooking({
      ...parsed.data,
      createdById: user.id
    } as CreateBookingInput, options);

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
    const options = await getAuthOptions();
    const booking = await cancelBooking(bookingId, reason.trim(), options);
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
      const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
      const perms = Array.isArray(user.role?.permissions) ? user.role.permissions : [];
      if (roleName !== 'SUPER_ADMIN' && !perms.includes('booking:create')) {
        return { success: false, error: 'You do not have permission to create bookings from the counter.' };
      }
    }

    const options = await getAuthOptions();
    const booking = await createPreBooking({
      ...parsed.data,
      createdById: user?.id || undefined,
      source: user ? 'COUNTER' : 'ONLINE'
    }, options);

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
    const options = await getAuthOptions();
    const booking = await verifyAndStartPaymentTimer({
      ...parsed.data,
      staffId: user.id
    }, options);

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
    const options = await getAuthOptions();
    const booking = await confirmPreBookingPayment({
      ...parsed.data,
      staffId: user.id
    }, undefined, options);

    revalidatePath('/bookings/online-requests');
    revalidatePath('/bookings');
    revalidatePath('/payments');
    revalidatePath('/dashboard');
    const tripId = (booking as any)?.tripId || (booking as any)?.trip_id;
    if (tripId) {
      revalidatePath(`/trips/${tripId}/seat-map`);
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
    const options = await getAuthOptions();
    const booking = await rejectPreBooking(bookingId, reason.trim(), options);

    revalidatePath('/bookings/online-requests');
    revalidatePath('/dashboard');
    const tripId = (booking as any)?.tripId || (booking as any)?.trip_id;
    if (tripId) {
      revalidatePath(`/trips/${tripId}/seat-map`);
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

export async function shiftSeatAction(input: {
  bookingId: string;
  currentSeat: string;
  targetSeat: string;
  reason?: string;
}) {
  try {
    if (!input.bookingId || !input.currentSeat || !input.targetSeat) {
      return { success: false, error: 'বুকিং আইডি, বর্তমান আসন ও নতুন আসন নির্বাচন করা বাধ্যতামূলক।' };
    }

    const user = await requirePermission('booking:create');
    const options = await getAuthOptions(user);
    const booking = await shiftBookingSeat(
      {
        bookingId: input.bookingId,
        currentSeat: input.currentSeat,
        targetSeat: input.targetSeat,
        reason: input.reason || 'যাত্রীর অনুরোধ / আসন পরিবর্তন',
      },
      options
    );

    revalidatePath('/bookings');
    revalidatePath('/bookings/shift');
    revalidatePath('/dashboard');
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'আসন পরিবর্তন ব্যর্থ হয়েছে।' };
  }
}

export async function swapSeatsAction(input: {
  bookingId1: string;
  seat1: string;
  bookingId2: string;
  seat2: string;
  reason?: string;
}) {
  try {
    if (!input.bookingId1 || !input.seat1 || !input.bookingId2 || !input.seat2) {
      return { success: false, error: 'উভয় বুকিং ও আসন নির্ধারণ করা আবশ্যক।' };
    }

    const user = await requirePermission('booking:create');
    const options = await getAuthOptions(user);
    const result = await swapBookingSeats(
      {
        bookingId1: input.bookingId1,
        seat1: input.seat1,
        bookingId2: input.bookingId2,
        seat2: input.seat2,
        reason: input.reason || 'যাত্রীদের পারস্পরিক সিট অদলবদল',
      },
      options
    );

    revalidatePath('/bookings');
    revalidatePath('/bookings/shift');
    revalidatePath('/dashboard');
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message || 'সিট অদলবদল ব্যর্থ হয়েছে।' };
  }
}

export async function transferBusAction(input: {
  bookingId: string;
  currentSeat: string;
  targetTripId: string;
  targetSeat: string;
  reason?: string;
}) {
  try {
    if (!input.bookingId || !input.currentSeat || !input.targetTripId || !input.targetSeat) {
      return { success: false, error: 'বুকিং, বর্তমান আসন, নতুন বাস ও নতুন আসন নির্বাচন করুন।' };
    }

    const user = await requirePermission('booking:create');
    const options = await getAuthOptions(user);
    const booking = await transferBookingTrip(
      {
        bookingId: input.bookingId,
        currentSeat: input.currentSeat,
        targetTripId: input.targetTripId,
        targetSeat: input.targetSeat,
        reason: input.reason || 'বিকল্প বাসে আসন স্থানান্তর',
      },
      options
    );

    revalidatePath('/bookings');
    revalidatePath('/bookings/shift');
    revalidatePath('/dashboard');
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || 'বাস স্থানান্তর ব্যর্থ হয়েছে।' };
  }
}

export async function cancelSeatAction(input: {
  bookingId: string;
  seatNumber?: string;
  reason?: string;
  refundAmount?: number;
  cancellationFee?: number;
}) {
  try {
    if (!input.bookingId) {
      return { success: false, error: 'বুকিং আইডি নির্বাচন করা আবশ্যক।' };
    }

    let user;
    try {
      user = await requirePermission('booking:cancel');
    } catch {
      user = await requirePermission('booking:create');
    }

    const options = await getAuthOptions(user);
    const result = await cancelBookingSeat(
      {
        bookingId: input.bookingId,
        seatNumber: input.seatNumber,
        reason: input.reason || 'আসন বাতিল ও রিফান্ড',
        refundAmount: input.refundAmount || 0,
        cancellationFee: input.cancellationFee || 0,
      },
      options
    );

    revalidatePath('/bookings');
    revalidatePath('/bookings/shift');
    revalidatePath('/dashboard');
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message || 'সিট বাতিল ব্যর্থ হয়েছে।' };
  }
}



