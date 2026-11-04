import { fastApiClient } from '@/lib/api-client';
import { proxyUrl } from '@/lib/config';

export interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  email?: string | null;
  phoneType?: 'WHATSAPP' | 'NORMAL';
  hasWhatsapp?: boolean;
  whatsappNumber?: string;
  passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  groupCategory?: string;
  guardianPhone?: string;
  guardianPhoneType?: 'WHATSAPP' | 'NORMAL';
  guardianHasWhatsapp?: boolean;
  guardianWhatsappNumber?: string;
  address?: string;
  guardianRelationship?: string;
}

export interface CreateBookingInput {
  tripId: string;
  seats: { seatId: string; fare: number }[];
  passengers: PassengerInput[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string | null;
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
  dueAmount?: number;
  duePromiseDate?: string | null;
  dueNote?: string | null;
  isPayOnBus?: boolean;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CONFIRMED';
  processingFee?: number;
  vatAmount?: number;
  cashoutFee?: number;
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
  contactEmail?: string | null;
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

export async function getAllBookings(filters?: { status?: string; payment_status?: string; paymentStatus?: string; has_due?: boolean; search?: string }) {
  const params = {
    status: filters?.status,
    payment_status: filters?.payment_status || filters?.paymentStatus,
    has_due: filters?.has_due,
    search: filters?.search
  };
  const res = await fastApiClient.getBookings(params);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  const fallback = await fetch(proxyUrl('/bookings/'), { cache: 'no-store' }).catch(() => null);
  if (fallback && fallback.ok) {
    return fallback.json();
  }
  return [];
}

export async function getOnlinePreBookings(filterOrStatus?: string | { status?: string; search?: string }) {
  const status = typeof filterOrStatus === 'string' ? filterOrStatus : filterOrStatus?.status;
  const res = await fastApiClient.getOnlineRequests(status);
  if (res.success && Array.isArray(res.data)) {
    return res.data;
  }
  const all = await getAllBookings();
  return all.filter((b: any) => b.booking_status === 'PRE_BOOKED' || b.booking_status === 'PAYMENT_TIMER_ACTIVE' || b.source === 'ONLINE');
}

export function normalizeBooking(b: any) {
  if (!b) return b;
  const totalAmount = Number(b.totalAmount ?? b.total_amount ?? b.grossAmount ?? b.gross_amount ?? 0);
  const discountAmount = Number(b.discountAmount ?? b.discount_amount ?? 0);
  const processingFee = Number(b.processingFee ?? b.processing_fee ?? 0);
  const vatAmount = Number(b.vatAmount ?? b.vat_amount ?? 0);
  const cashoutFee = Number(b.cashoutFee ?? b.cashout_fee ?? 0);
  const netAmount = Math.max(0, totalAmount - discountAmount + processingFee + vatAmount + cashoutFee);

  const rawPaymentStatus = (b.paymentStatus || b.payment_status || '').toUpperCase();
  const rawPaidAmount = b.paidAmount ?? b.paid_amount;
  const paidAmount = Number(
    rawPaidAmount !== undefined && rawPaidAmount !== null
      ? rawPaidAmount
      : (rawPaymentStatus === 'PAID' ? netAmount : 0)
  );
  const dueAmount = Math.max(0, netAmount - paidAmount);
  const paymentStatus = (dueAmount <= 0 || rawPaymentStatus === 'PAID') ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID');

  return {
    ...b,
    id: b.id,
    bookingNumber: b.bookingNumber || b.booking_number,
    booking_number: b.bookingNumber || b.booking_number,
    totalAmount,
    total_amount: totalAmount,
    grossAmount: totalAmount,
    gross_amount: totalAmount,
    discountAmount,
    discount_amount: discountAmount,
    processingFee,
    processing_fee: processingFee,
    vatAmount,
    vat_amount: vatAmount,
    cashoutFee,
    cashout_fee: cashoutFee,
    netAmount,
    net_amount: netAmount,
    paidAmount,
    paid_amount: paidAmount,
    dueAmount,
    due_amount: dueAmount,
    paymentStatus,
    payment_status: paymentStatus,
    contactName: b.contactName || b.contact_name,
    contact_name: b.contactName || b.contact_name,
    contactPhone: b.contactPhone || b.contact_phone,
    contact_phone: b.contactPhone || b.contact_phone,
    duePromiseDate: b.duePromiseDate || b.due_promise_date,
    due_promise_date: b.duePromiseDate || b.due_promise_date,
    dueNote: b.dueNote || b.due_note,
    due_note: b.dueNote || b.due_note
  };
}

export async function getBookingById(id: string, options?: RequestInit) {
  if (!id) return null;
  const res = await fastApiClient.getBookingById(id, options);
  if (res.success && res.data) {
    return normalizeBooking(res.data);
  }
  const all = await getAllBookings();
  const found = all.find((b: any) => b.id === id);
  return found ? normalizeBooking(found) : null;
}

export async function getBookingByTrackingNumber(trackingNumber: string) {
  if (!trackingNumber) return null;
  const res = await fastApiClient.trackBooking(trackingNumber);
  if (res.success && res.data) {
    return normalizeBooking(res.data);
  }
  const all = await getAllBookings();
  const found = all.find((b: any) => b.booking_number === trackingNumber || b.contact_phone === trackingNumber);
  return found ? normalizeBooking(found) : null;
}

export async function createBooking(input: CreateBookingInput, options?: RequestInit) {
  const res = await fastApiClient.createCounterBooking({
    trip_id: input.tripId,
    seats: input.seats.map(s => ({ seat_id: s.seatId, fare: s.fare })),
    contact_name: input.passengers?.[0]?.passengerName,
    contact_phone: input.passengers?.[0]?.passengerPhone,
    contact_email: input.contactEmail || input.passengers?.[0]?.email || undefined,
    passengers: input.passengers.map(p => {
      let sNum = (p as any).seatNumber || (p as any).seat_number;
      if (!sNum && p.seatId) {
        const idUpper = p.seatId.toUpperCase();
        if (idUpper.includes('EX-') || idUpper.includes('EXTRA-')) {
          const exMatch = idUpper.match(/EX(?:TRA)?[-_]?\d+/i);
          if (exMatch) {
            const dig = exMatch[0].match(/\d+/);
            sNum = dig ? `EX-${dig[0]}` : exMatch[0];
          }
        }
        if (!sNum) {
          const parts = p.seatId.split('-');
          if (parts.length >= 2 && parts[parts.length - 2].toUpperCase() === 'EX') {
            sNum = `EX-${parts[parts.length - 1]}`;
          } else {
            sNum = parts[parts.length - 1];
          }
        }
      }
      return {
        passenger_name: p.passengerName,
        passenger_phone: p.passengerPhone,
        passenger_email: p.email || undefined,
        email: p.email || undefined,
        passenger_type: p.passengerType,
        gender: p.gender,
        seat_id: p.seatId,
        seat_number: sNum,
        student_admission_id: p.admissionId,
        admission_id: p.admissionId,
        guardian_phone: p.guardianPhone,
        guardian_relationship: p.guardianRelationship,
        phone_type: p.phoneType || (p.hasWhatsapp !== false ? 'WHATSAPP' : 'NORMAL'),
        has_whatsapp: p.hasWhatsapp ?? (p.phoneType === 'WHATSAPP'),
        whatsapp_number: p.whatsappNumber || (p.phoneType === 'WHATSAPP' ? p.passengerPhone : undefined)
      };
    }),
    journey_type: input.journeyType || 'ROUND_TRIP',
    boarding_point: input.boardingPoint,
    dropping_point: input.droppingPoint,
    passenger_legs_json: input.passengerLegsJson,
    discount_type: input.discountType || 'FIXED',
    discount_rate: input.discountRate || 0,
    discount_reason: input.discountReason || input.discountReference,
    payment_method: input.paymentMethod,
    paid_amount: input.paidAmount,
    due_amount: input.dueAmount,
    due_promise_date: input.duePromiseDate,
    due_note: input.dueNote,
    payment_status: input.paymentStatus || ((input.dueAmount === 0 || input.paidAmount >= input.seats.reduce((s, x) => s + x.fare, 0)) ? 'PAID' : (input.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')),
    processing_fee: input.processingFee || 0,
    vat_amount: input.vatAmount || 0,
    cashout_fee: input.cashoutFee || 0,
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
    contact_email: input.contactEmail || undefined,
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

export interface ShiftBookingSeatInput {
  bookingId: string;
  currentSeat: string;
  targetSeat: string;
  reason?: string;
}

export async function shiftBookingSeat(input: ShiftBookingSeatInput, options?: RequestInit) {
  const res = await fastApiClient.shiftBookingSeat({
    booking_id: input.bookingId,
    current_seat: input.currentSeat,
    target_seat: input.targetSeat,
    reason: input.reason || 'Customer Request',
  }, options);

  if (!res.success) {
    throw new Error(res.error || 'Failed to shift seat');
  }
  return res.data;
}

export interface SwapBookingSeatsInput {
  bookingId1: string;
  seat1: string;
  bookingId2: string;
  seat2: string;
  reason?: string;
}

export async function swapBookingSeats(input: SwapBookingSeatsInput, options?: RequestInit) {
  const res = await fastApiClient.swapBookingSeats({
    booking_id_1: input.bookingId1,
    seat_1: input.seat1,
    booking_id_2: input.bookingId2,
    seat_2: input.seat2,
    reason: input.reason || 'যাত্রীদের পারস্পরিক সিট অদলবদল',
  }, options);

  if (!res.success) {
    throw new Error(res.error || 'Failed to swap seats');
  }
  return res.data;
}

export interface TransferBookingTripInput {
  bookingId: string;
  currentSeat: string;
  targetTripId: string;
  targetSeat: string;
  reason?: string;
}

export async function transferBookingTrip(input: TransferBookingTripInput, options?: RequestInit) {
  const res = await fastApiClient.transferBookingTrip({
    booking_id: input.bookingId,
    current_seat: input.currentSeat,
    target_trip_id: input.targetTripId,
    target_seat: input.targetSeat,
    reason: input.reason || 'বিকল্প বাসে আসন স্থানান্তর',
  }, options);

  if (!res.success) {
    throw new Error(res.error || 'Failed to transfer bus/trip');
  }
  return res.data;
}

export interface CancelBookingSeatInput {
  bookingId: string;
  seatNumber?: string;
  reason?: string;
  refundAmount?: number;
  cancellationFee?: number;
}

export async function cancelBookingSeat(input: CancelBookingSeatInput, options?: RequestInit) {
  const res = await fastApiClient.cancelBookingSeat({
    booking_id: input.bookingId,
    seat_number: input.seatNumber,
    reason: input.reason || 'Customer Request / আসন বাতিল',
    refund_amount: input.refundAmount || 0,
    cancellation_fee: input.cancellationFee || 0,
  }, options);

  if (!res.success) {
    throw new Error(res.error || 'Failed to cancel seat');
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

