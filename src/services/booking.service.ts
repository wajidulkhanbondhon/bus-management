import { fastApiClient } from '@/lib/api-client';

export interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  phoneType?: 'WHATSAPP' | 'NORMAL';
  passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  groupCategory?: string;
  guardianPhone?: string;
  guardianPhoneType?: 'WHATSAPP' | 'NORMAL';
  address?: string;
  guardianRelationship?: string;
}

export interface CreateBookingInput {
  tripId: string;
  seats: { seatId: string; fare: number }[];
  passengers: PassengerInput[];
  journeyType?: 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY' | 'ASYMMETRIC';
  boardingPoint?: string | null;
  droppingPoint?: string | null;
  passengerLegsJson?: string | null;
  isDiscountApplied?: boolean;
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountRate?: number;
  discountReason?: string;
  discountReference?: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  paidAmount: number;
  transactionId?: string;
  senderReference?: string;
  notes?: string;
  createdById: string;
}

export interface CreatePreBookingInput {
  tripId: string;
  seatIds: string[];
  contactName: string;
  contactPhone: string;
  passengerGender: 'MALE' | 'FEMALE';
  isStudent?: boolean;
  studentAdmissionId?: string;
  journeyType?: 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY' | 'ASYMMETRIC';
  boardingPoint?: string | null;
  droppingPoint?: string | null;
  passengerLegsJson?: string | null;
  source?: 'ONLINE' | 'PHONE' | 'AGENT' | 'COUNTER';
  createdById?: string;
  notes?: string;
}

export interface VerifyAndStartTimerInput {
  bookingId: string;
  staffId: string;
  durationMinutes?: number;
  studentAdmissionId?: string;
  passengerGender?: 'MALE' | 'FEMALE';
  isStudent?: boolean;
  notes?: string;
}

export interface ConfirmPreBookingPaymentInput {
  bookingId: string;
  staffId: string;
  paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
  senderReference?: string;
  paidAmount?: number;
  notes?: string;
}

export async function getAllBookings(filters?: any) {
  const res = await fetch('http://localhost:8000/api/v1/bookings/').catch(() => null);
  if (res && res.ok) {
    return res.json();
  }
  return [];
}

export async function getOnlinePreBookings(filters?: any) {
  const all = await getAllBookings();
  return all.filter((b: any) => b.booking_status === 'PRE_BOOKED' || b.booking_status === 'PAYMENT_TIMER_ACTIVE' || b.source === 'ONLINE');
}

export async function getBookingById(id: string) {
  const all = await getAllBookings();
  return all.find((b: any) => b.id === id) || null;
}

export async function getBookingByTrackingNumber(trackingNumber: string) {
  const res = await fastApiClient.trackBooking(trackingNumber);
  if (res.success && res.data) {
    return res.data;
  }
  const all = await getAllBookings();
  return all.find((b: any) => b.booking_number === trackingNumber || b.contact_phone === trackingNumber) || null;
}

export async function createBooking(input: CreateBookingInput, options?: RequestInit) {
  const res = await fastApiClient.createCounterBooking({
    trip_id: input.tripId,
    seats: input.seats.map(s => ({ seat_id: s.seatId, fare: s.fare })),
    passengers: input.passengers.map(p => ({
      passenger_name: p.passengerName,
      passenger_phone: p.passengerPhone,
      passenger_type: p.passengerType,
      gender: p.gender,
      seat_id: p.seatId,
      student_admission_id: p.admissionId
    })),
    journey_type: input.journeyType || 'ROUND_TRIP',
    boarding_point: input.boardingPoint,
    dropping_point: input.droppingPoint,
    passenger_legs_json: input.passengerLegsJson,
    discount_type: input.discountType || 'FIXED',
    discount_rate: input.discountRate || 0,
    discount_reason: input.discountReason || input.discountReference,
    payment_method: input.paymentMethod,
    paid_amount: input.paidAmount,
    transaction_id: input.transactionId,
    sender_reference: input.senderReference,
    notes: input.notes
  }, options);

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error || 'Failed to create booking');
}

export async function createPreBooking(input: CreatePreBookingInput, options?: RequestInit) {
  const res = await fastApiClient.createPreBooking({
    trip_id: input.tripId,
    seat_ids: input.seatIds,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    passenger_gender: input.passengerGender,
    is_student: input.isStudent,
    student_admission_id: input.studentAdmissionId,
    journey_type: input.journeyType || 'ROUND_TRIP',
    boarding_point: input.boardingPoint,
    dropping_point: input.droppingPoint,
    passenger_legs_json: input.passengerLegsJson,
    source: input.source || 'ONLINE',
    notes: input.notes
  }, options);

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error || 'Failed to create pre-booking');
}

export async function verifyAndStartPaymentTimer(input: VerifyAndStartTimerInput, options?: RequestInit) {
  const res = await fastApiClient.verifyTimer({
    booking_id: input.bookingId,
    duration_minutes: input.durationMinutes || 15,
    passenger_gender: input.passengerGender,
    is_student: input.isStudent,
    student_admission_id: input.studentAdmissionId,
    notes: input.notes
  }, options);

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error || 'Failed to verify booking');
}

export async function confirmPreBookingPayment(input: ConfirmPreBookingPaymentInput, idempotencyKey?: string, options?: RequestInit) {
  const res = await fastApiClient.confirmPayment({
    booking_id: input.bookingId,
    payment_method: input.paymentMethod,
    paid_amount: input.paidAmount,
    transaction_id: input.transactionId,
    sender_reference: input.senderReference,
    notes: input.notes
  }, idempotencyKey, options);

  if (res.success && res.data) {
    return res.data;
  }
  throw new Error(res.error || 'Failed to confirm payment');
}

export async function cancelBooking(bookingIdOrInput: any, reason?: string, options?: RequestInit) {
  const bookingId = typeof bookingIdOrInput === 'string' ? bookingIdOrInput : bookingIdOrInput?.bookingId;
  const cancellationReason = reason || (typeof bookingIdOrInput === 'object' ? bookingIdOrInput?.reason : 'Customer Request') || 'Customer Request';
  const res = await fastApiClient.cancelBooking(bookingId, cancellationReason, options);
  if (!res.success) {
    throw new Error(res.error || 'Failed to cancel booking');
  }
  return res.data;
}

export async function rejectPreBooking(bookingIdOrInput: any, reason?: string, options?: RequestInit) {
  const bookingId = typeof bookingIdOrInput === 'string' ? bookingIdOrInput : bookingIdOrInput?.bookingId;
  const rejectionReason = reason || (typeof bookingIdOrInput === 'object' ? bookingIdOrInput?.reason : 'Verification Failed') || 'Verification Failed';
  const res = await fastApiClient.rejectPreBooking(bookingId, rejectionReason, options);
  if (!res.success) {
    throw new Error(res.error || 'Failed to reject pre-booking');
  }
  return res.data;
}


export async function cleanExpiredBookings() {
  const cronSecret = process.env.CRON_SECRET || 'atoms-cleanup-token';
  const res = await fastApiClient.cleanupExpired(cronSecret);
  if (res.success && res.data?.stats) {
    return {
      expiredCount: (res.data.stats.expired_holds || 0) + (res.data.stats.expired_bookings || 0),
      stats: res.data.stats
    };
  }
  return { expiredCount: 0 };
}

