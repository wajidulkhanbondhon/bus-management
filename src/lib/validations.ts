import { z } from 'zod';

// --- Common Validators ---

const PaymentMethodSchema = z.enum(['BKASH', 'NAGAD', 'ROCKET', 'HAND_CASH', 'BANK_TRANSFER', 'OTHER']);
const GenderSchema = z.enum(['MALE', 'FEMALE']);
const PassengerTypeSchema = z.enum(['STUDENT', 'GUARDIAN', 'GUEST']);

import { cleanAndLimitPhoneNumber } from '@/lib/utils';

export const BdPhoneNumberSchema = z
  .string()
  .transform((val) => cleanAndLimitPhoneNumber(val))
  .refine((val) => /^01[3-9]\d{8}$/.test(val), {
    message: '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)'
  });

export const OptionalBdPhoneNumberSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? cleanAndLimitPhoneNumber(val) : val))
  .refine((val) => !val || /^01[3-9]\d{8}$/.test(val), {
    message: '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)'
  });

// --- Booking Schemas ---

export const PassengerInputSchema = z.object({
  passengerName: z.string().min(1, 'Passenger name is required').max(200),
  passengerPhone: BdPhoneNumberSchema,
  phoneType: z.enum(['WHATSAPP', 'NORMAL']).optional().default('NORMAL'),
  passengerType: PassengerTypeSchema,
  gender: GenderSchema,
  seatId: z.string().min(1, 'Seat ID is required'),
  admissionId: z.string().max(50).optional().nullable(),
  institution: z.string().max(200).optional().nullable(),
  groupCategory: z.string().max(100).optional().nullable(),
  guardianPhone: OptionalBdPhoneNumberSchema,
  guardianPhoneType: z.enum(['WHATSAPP', 'NORMAL']).optional().default('NORMAL'),
  address: z.string().max(500).optional().nullable(),
  guardianRelationship: z.string().max(50).optional().nullable(),
});

export const CreateBookingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  seats: z.array(z.object({
    seatId: z.string().min(1),
    fare: z.number().min(0, 'Fare must be non-negative'),
  })).min(1, 'At least one seat must be selected'),
  passengers: z.array(PassengerInputSchema).min(1, 'At least one passenger is required'),
  isDiscountApplied: z.boolean().optional(),
  discountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  discountRate: z.number().min(0).optional(),
  discountReason: z.string().max(500).optional(),
  discountReference: z.string().max(200).optional(),
  paymentMethod: PaymentMethodSchema,
  paidAmount: z.number().min(0, 'Paid amount must be non-negative'),
  transactionId: z.string().max(100).optional(),
  senderReference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const CreatePreBookingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  seatIds: z.array(z.string().min(1)).min(1, 'At least one seat must be selected'),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactPhone: BdPhoneNumberSchema,
  passengerGender: GenderSchema,
  isStudent: z.boolean().optional(),
  studentAdmissionId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(['ONLINE', 'COUNTER']).optional(),
  createdById: z.string().optional(),
});

export const VerifyTimerSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  durationMinutes: z.number().min(1).max(120).optional(),
  passengerGender: GenderSchema.optional(),
  isStudent: z.boolean().optional(),
  studentAdmissionId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const ConfirmPreBookingPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentMethod: PaymentMethodSchema,
  paidAmount: z.number().min(0).optional(),
  transactionId: z.string().max(100).optional(),
  senderReference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const CancelBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export const RejectPreBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const TrackBookingSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
});

// --- Payment Schemas ---

export const RecordPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  method: PaymentMethodSchema,
  transactionId: z.string().max(100).optional(),
  senderReference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const ProcessRefundSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentId: z.string().optional(),
  amount: z.number().positive('Refund amount must be positive'),
  method: PaymentMethodSchema,
  reason: z.string().min(1, 'Refund reason is required').max(500),
});

// --- Bus & Trip Schemas ---

export const CreateBusSchema = z.object({
  busName: z.string().min(1, 'Bus name is required').max(100),
  busNumber: z.string().min(1, 'Bus number is required').max(50),
  regNumber: z.string().min(1, 'Registration number is required').max(50),
  capacity: z.number().int().min(1).max(100),
  busType: z.enum(['MALE', 'FEMALE', 'MIXED']).default('MIXED'),
  operator: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  seatLayoutId: z.string().optional(),
});

export const ScheduleTripSchema = z.object({
  busId: z.string().min(1, 'Bus is required'),
  routeId: z.string().min(1, 'Route is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  arrivalEst: z.string().optional(),
  tripBusType: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  notes: z.string().max(1000).optional(),
});

// --- Day Closing Schemas ---

export const MethodActualSchema = z.object({
  method: PaymentMethodSchema,
  actualAmount: z.number().min(0),
});

export const SubmitDayClosingSchema = z.object({
  closingDate: z.string().min(1, 'Closing date is required'),
  actualTotalCash: z.number().min(0),
  methodActuals: z.array(MethodActualSchema).min(1, 'At least one payment method actual is required'),
  notes: z.string().max(1000).optional(),
});

// --- Inventory Schemas ---

export const HoldSeatSchema = z.object({
  tripId: z.string().min(1),
  seatId: z.string().min(1),
  durationMinutes: z.number().min(1).max(60).optional(),
});

export const LockSeatSchema = z.object({
  tripId: z.string().min(1),
  seatId: z.string().min(1),
  lockType: z.enum(['PERMANENT', 'TEMPORARY']),
  reason: z.string().min(1, 'Lock reason is required').max(200),
  notes: z.string().max(500).optional(),
  lockedUntil: z.string().optional().nullable(),
});
