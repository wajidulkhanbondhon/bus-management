import { describe, it, expect } from 'vitest';
import { validatePassengerRules } from '@/services/rules.service';
import { calculateDiscountAmount } from '@/services/discount.service';

describe('ATOMS Domain Engine & Business Rules', () => {
  describe('Gender & Guardian Validation Engine', () => {
    it('should reject a male student on a female-designated coach', () => {
      const result = validatePassengerRules({
        busType: 'FEMALE',
        seatGenderRule: 'ANY',
        passengerType: 'STUDENT',
        passengerGender: 'MALE'
      });

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FEMALE_BUS_STUDENT_RESTRICTION');
    });

    it('should allow a female student on a female-designated coach', () => {
      const result = validatePassengerRules({
        busType: 'FEMALE',
        seatGenderRule: 'ANY',
        passengerType: 'STUDENT',
        passengerGender: 'FEMALE'
      });

      expect(result.isValid).toBe(true);
    });

    it('should allow a Father as an accompanying guardian on a female-designated coach', () => {
      const result = validatePassengerRules({
        busType: 'FEMALE',
        seatGenderRule: 'ANY',
        passengerType: 'GUARDIAN',
        passengerGender: 'MALE',
        guardianRelationship: 'FATHER'
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject an unrelated male guest on a female-designated coach', () => {
      const result = validatePassengerRules({
        busType: 'FEMALE',
        seatGenderRule: 'ANY',
        passengerType: 'GUARDIAN',
        passengerGender: 'MALE',
        guardianRelationship: 'COUSIN_DISTANT'
      });

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FEMALE_BUS_GUARDIAN_RESTRICTION');
    });

    it('should enforce seat-level female-only rule on a mixed bus', () => {
      const result = validatePassengerRules({
        busType: 'MIXED',
        seatGenderRule: 'FEMALE_ONLY',
        passengerType: 'STUDENT',
        passengerGender: 'MALE'
      });

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('SEAT_FEMALE_ONLY');
    });
  });

  describe('Discount Calculation Engine', () => {
    it('should accurately calculate fixed discount without exceeding gross', () => {
      const gross = 600;
      const discount = calculateDiscountAmount(gross, 'FIXED', 100);
      expect(discount).toBe(100);
    });

    it('should cap fixed discount at gross amount to prevent negative totals', () => {
      const gross = 300;
      const discount = calculateDiscountAmount(gross, 'FIXED', 500);
      expect(discount).toBe(300);
    });

    it('should accurately calculate percentage discount', () => {
      const gross = 1200;
      const discount = calculateDiscountAmount(gross, 'PERCENTAGE', 10);
      expect(discount).toBe(120);
    });
  });

  describe('Phone Number Normalization & Validation', () => {
    it('should normalize international and Bengali format phone numbers to standard 11 digits', async () => {
      const { cleanAndLimitPhoneNumber, isValidBdMobile } = await import('@/lib/utils');
      expect(cleanAndLimitPhoneNumber('+8801712345678')).toBe('01712345678');
      expect(cleanAndLimitPhoneNumber('8801812345678')).toBe('01812345678');
      expect(cleanAndLimitPhoneNumber('008801912345678')).toBe('01912345678');
      expect(cleanAndLimitPhoneNumber('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
      expect(isValidBdMobile('01712345678')).toBe(true);
      expect(isValidBdMobile('01212345678')).toBe(false); // Invalid operator prefix
    });
  });

  describe('Zod Schema Boundary & Discount Capping', () => {
    it('should reject absurdly excessive discount rates in CreateBookingSchema', async () => {
      const { CreateBookingSchema } = await import('@/lib/validations');
      const result = CreateBookingSchema.safeParse({
        tripId: 'trip-1',
        seats: [{ seatId: 'seat-1', fare: 500 }],
        passengers: [{
          passengerName: 'Valid Name',
          passengerPhone: '01712345678',
          passengerType: 'STUDENT',
          gender: 'FEMALE',
          seatId: 'seat-1'
        }],
        paymentMethod: 'HAND_CASH',
        paidAmount: 500,
        discountRate: 999999 // Exceeds max 50000 cap
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Adjacent Pair & Guardian Rules', () => {
    it('should reject two opposite gender students sitting in adjacent seats A1 and A2', async () => {
      const { validateMultiSeatBookingPairRules } = await import('@/services/rules.service');
      const seats = [
        { seatId: 's1', seatNumber: 'A1', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'A2', status: 'AVAILABLE' }
      ];
      const passengers = [
        { seatId: 's1', seatNumber: 'A1', passengerName: 'Girl Student', gender: 'FEMALE', passengerType: 'STUDENT' },
        { seatId: 's2', seatNumber: 'A2', passengerName: 'Boy Student', gender: 'MALE', passengerType: 'STUDENT' }
      ];

      const res = validateMultiSeatBookingPairRules(passengers, seats);
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('OPPOSITE_GENDER_ADJACENT_NO_GUARDIAN');
    });

    it('should allow opposite gender in adjacent seats if one is Student and other is valid Guardian', async () => {
      const { validateMultiSeatBookingPairRules } = await import('@/services/rules.service');
      const seats = [
        { seatId: 's1', seatNumber: 'A1', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'A2', status: 'AVAILABLE' }
      ];
      const passengers = [
        { seatId: 's1', seatNumber: 'A1', passengerName: 'Female Student', gender: 'FEMALE', passengerType: 'STUDENT' },
        { seatId: 's2', seatNumber: 'A2', passengerName: 'Father', gender: 'MALE', passengerType: 'GUARDIAN', guardianRelationship: 'FATHER' }
      ];

      const res = validateMultiSeatBookingPairRules(passengers, seats);
      expect(res.isValid).toBe(true);
    });
  });

  describe('Same Bus Duplicate Phone Detection & Form Precedence', () => {
    it('should give precedence to the completed passenger card so earlier card does not turn red', async () => {
      const { getPassengerPairRuleViolation } = await import('@/components/booking/passenger-details-step');
      const seats = [
        { seatId: 's1', seatNumber: 'A1', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'A2', status: 'AVAILABLE' }
      ];
      const passengers: any[] = [
        { seatId: 's1', passengerName: 'Female Student', passengerPhone: '01711111111', gender: 'FEMALE', passengerType: 'STUDENT' },
        { seatId: 's2', passengerName: '', passengerPhone: '', gender: 'MALE', passengerType: 'STUDENT' }
      ];

      // A1 is completed first, A2 is incomplete and toggled to MALE
      const p1Violation = getPassengerPairRuleViolation(passengers[0], passengers, seats);
      const p2Violation = getPassengerPairRuleViolation(passengers[1], passengers, seats);

      // p1 should NOT have violation because it was completed first
      expect(p1Violation).toBeNull();
      // p2 should indicate the conflict
      expect(p2Violation).not.toBeNull();
      expect(p2Violation).toContain('বিপরীত জেন্ডার');
    });

    it('should detect duplicate phone numbers on the same trip from existing bookings', async () => {
      const { cleanAndLimitPhoneNumber } = await import('@/lib/utils');
      const bookedPhone = '01799999999';
      const allCurrentSeats = [
        { seatId: 's1', seatNumber: 'B1', status: 'BOOKED', passengerPhone: bookedPhone },
        { seatId: 's2', seatNumber: 'C1', status: 'AVAILABLE' }
      ];

      const userEnteredPhone = cleanAndLimitPhoneNumber('01799999999');
      const match = allCurrentSeats.some(
        (s) => (s.status === 'BOOKED' || s.status === 'HELD') && cleanAndLimitPhoneNumber(s.passengerPhone || '') === userEnteredPhone
      );

      expect(match).toBe(true);
    });

    it('should detect duplicate phone across multiple buses created for the same university exam on the same date', async () => {
      const { cleanAndLimitPhoneNumber } = await import('@/lib/utils');
      const { matchTripUniversityCode } = await import('@/components/booking/trip-selection-step');

      // 10 buses for Rajshahi University exam on 2026-09-05
      const examDate = '2026-09-05';
      const allTrips = Array.from({ length: 10 }, (_, i) => ({
        id: `trip-ru-${i + 1}`,
        departureDate: examDate,
        targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
        bus: { busName: `রাজশাহী স্পেশাল কোচ #${i + 1}`, busNumber: `DHAKA-METRO-BA-${1000 + i}` }
      }));

      // Booking already made on Bus 2 (trip-ru-2) with phone 01788888888
      const allBookings = [
        {
          id: 'bk-1',
          trip_id: 'trip-ru-2',
          booking_status: 'CONFIRMED',
          contact_phone: '01788888888',
          passengers: [{ passenger_name: 'Habib', passenger_phone: '01788888888', seat_number: 'B2' }]
        }
      ];

      // User is now on Bus 5 (trip-ru-5) on the same date for the same RU exam
      const selectedTrip = allTrips[4]; // Bus 5
      const enteredPhone = cleanAndLimitPhoneNumber('01788888888');

      const currentUni = matchTripUniversityCode(selectedTrip);
      const sameExamBuses = allTrips.filter(
        (t) => matchTripUniversityCode(t) === currentUni && t.departureDate === examDate
      );

      expect(sameExamBuses.length).toBe(10);

      // Other buses for same exam
      const otherBuses = sameExamBuses.filter((t) => t.id !== selectedTrip.id);
      const otherTripIds = new Set(otherBuses.map((t) => t.id));

      const duplicatesFound: string[] = [];
      allBookings.forEach((b) => {
        if (otherTripIds.has(b.trip_id) && b.booking_status !== 'CANCELLED') {
          const tripObj = otherBuses.find((t) => t.id === b.trip_id);
          const busName = tripObj?.bus?.busName || 'অন্য বাস';
          b.passengers.forEach((p) => {
            if (cleanAndLimitPhoneNumber(p.passenger_phone) === enteredPhone) {
              duplicatesFound.push(`${busName} (সিট ${p.seat_number})`);
            }
          });
        }
      });

      expect(duplicatesFound.length).toBe(1);
      expect(duplicatesFound[0]).toBe('রাজশাহী স্পেশাল কোচ #2 (সিট B2)');
    });

    it('should correctly classify buses as active vs full/completed using isTripBookingFull', async () => {
      const { isTripBookingFull } = await import('@/components/booking/trip-selection-step');

      const activeTrip = {
        id: 't-active',
        status: 'SCHEDULED',
        stats: { totalSeats: 45, bookedCount: 30, availableCount: 15, soldPercentage: 66 }
      };

      const fullTripByCapacity = {
        id: 't-full-cap',
        status: 'SCHEDULED',
        stats: { totalSeats: 45, bookedCount: 45, availableCount: 0, soldPercentage: 100 }
      };

      const fullTripBySoldPct = {
        id: 't-full-pct',
        status: 'SCHEDULED',
        stats: { totalSeats: 40, bookedCount: 40, availableCount: 0, soldPercentage: 100 }
      };

      const completedTrip = {
        id: 't-completed',
        status: 'COMPLETED',
        stats: { totalSeats: 45, bookedCount: 20, availableCount: 25, soldPercentage: 44 }
      };

      expect(isTripBookingFull(activeTrip)).toBe(false);
      expect(isTripBookingFull(fullTripByCapacity)).toBe(true);
      expect(isTripBookingFull(fullTripBySoldPct)).toBe(true);
      expect(isTripBookingFull(completedTrip)).toBe(true);

      const fleet = [activeTrip, fullTripByCapacity, fullTripBySoldPct, completedTrip];
      const activeCoaches = fleet.filter((t) => !isTripBookingFull(t));
      const fullCoaches = fleet.filter((t) => isTripBookingFull(t));

      expect(activeCoaches.length).toBe(1);
      expect(activeCoaches[0].id).toBe('t-active');
      expect(fullCoaches.length).toBe(3);
    });

    it('should resolve pair rule violation for BOTH adjacent cards when one is converted to guardian with relationship', async () => {
      const { getPassengerPairRuleViolation } = await import('@/components/booking/passenger-details-step');
      const seats = [
        { seatId: 's1', seatNumber: 'A1', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'A2', status: 'AVAILABLE' }
      ];

      // Initial state: Both are students of opposite gender
      const passengersOpposite: any[] = [
        { seatId: 's1', passengerName: 'Female Student', passengerPhone: '01711111111', gender: 'FEMALE', passengerType: 'STUDENT' },
        { seatId: 's2', passengerName: 'Male Student', passengerPhone: '01722222222', gender: 'MALE', passengerType: 'STUDENT' }
      ];

      expect(getPassengerPairRuleViolation(passengersOpposite[0], passengersOpposite, seats)).not.toBeNull();
      expect(getPassengerPairRuleViolation(passengersOpposite[1], passengersOpposite, seats)).not.toBeNull();

      // Resolved state: Male passenger is changed to Guardian with valid relationship (Father)
      const passengersResolved: any[] = [
        { seatId: 's1', passengerName: 'Female Student', passengerPhone: '01711111111', gender: 'FEMALE', passengerType: 'STUDENT' },
        { seatId: 's2', passengerName: 'Male Guardian', passengerPhone: '01722222222', gender: 'MALE', passengerType: 'GUARDIAN', guardianRelationship: 'FATHER' }
      ];

      // Both passenger cards must now have ZERO violation!
      const p1Violation = getPassengerPairRuleViolation(passengersResolved[0], passengersResolved, seats);
      const p2Violation = getPassengerPairRuleViolation(passengersResolved[1], passengersResolved, seats);

      expect(p1Violation).toBeNull();
      expect(p2Violation).toBeNull();
    });
  });

  describe('WhatsApp Notification & Ticket Dispatch Integration', () => {
    it('should accept valid WhatsApp enabled passenger input in schema', async () => {
      const { PassengerInputSchema } = await import('@/lib/validations');
      const res = PassengerInputSchema.safeParse({
        passengerName: 'নুসরাত জাহান',
        passengerPhone: '01712345678',
        phoneType: 'WHATSAPP',
        hasWhatsapp: true,
        whatsappNumber: '01712345678',
        passengerType: 'STUDENT',
        gender: 'FEMALE',
        seatId: 'seat-A1'
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phoneType).toBe('WHATSAPP');
        expect(res.data.hasWhatsapp).toBe(true);
      }
    });

    it('should generate properly formatted Bengali WhatsApp ticket dispatch link and text', async () => {
      const { buildWhatsAppTicketMessage } = await import('@/components/booking/payment-receipt');
      const mockBooking = {
        id: 'bk-test-123',
        bookingNumber: 'BK-20260904-TEST-10001',
        contactName: 'নুসরাত জাহান',
        contactPhone: '01712345678',
        boardingPoint: 'গাবতলী',
        droppingPoint: 'রাজশাহী বিশ্ববিদ্যালয়',
        paidAmount: 550,
        paymentStatus: 'PAID',
        passengers: [{
          passengerName: 'নুসরাত জাহান',
          passengerPhone: '01712345678',
          seatNumber: 'A1',
          hasWhatsapp: true
        }],
        trip: {
          route: { routeName: 'ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়' },
          departureDate: '2026-09-10T22:30:00Z',
          departureTime: '2026-09-10T22:30:00Z'
        }
      };

      const waDispatch = buildWhatsAppTicketMessage(mockBooking, mockBooking.passengers[0]);
      expect(waDispatch.phone).toBe('01712345678');
      expect(waDispatch.waUrl).toContain('wa.me/8801712345678');
      expect(waDispatch.message).toContain('BK-20260904-TEST-10001');
      expect(waDispatch.message).toContain('নুসরাত জাহান');
      expect(waDispatch.message).toContain('*সিট নম্বর:* A1');
      expect(waDispatch.message).toContain('ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়');
      expect(waDispatch.message).toContain('৳550');
      expect(waDispatch.message).toContain('পরিশোধিত (PAID)');
    });
  });
});





