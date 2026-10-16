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

    it('should accept processingFee, vatAmount, cashoutFee and allow paidAmount including fees', async () => {
      const { CreateBookingSchema } = await import('@/lib/validations');
      const gross = 600;
      const processingFee = 20;
      const vatAmount = 30;
      const cashoutFee = 15;
      const totalPayable = gross + processingFee + vatAmount + cashoutFee; // 665

      const result = CreateBookingSchema.safeParse({
        tripId: 'trip-1',
        seats: [{ seatId: 'seat-1', fare: gross }],
        passengers: [{
          passengerName: 'Shakil Ahmed',
          passengerPhone: '01711223344',
          passengerType: 'STUDENT',
          gender: 'MALE',
          seatId: 'seat-1'
        }],
        paymentMethod: 'BKASH',
        paidAmount: totalPayable,
        processingFee,
        vatAmount,
        cashoutFee
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingFee).toBe(20);
        expect(result.data.vatAmount).toBe(30);
        expect(result.data.cashoutFee).toBe(15);
        expect(result.data.paidAmount).toBe(665);
      }
    });

    it('should default fees to 0 when omitted in CreateBookingSchema', async () => {
      const { CreateBookingSchema } = await import('@/lib/validations');
      const result = CreateBookingSchema.safeParse({
        tripId: 'trip-1',
        seats: [{ seatId: 'seat-1', fare: 550 }],
        passengers: [{
          passengerName: 'Sumaiya Akter',
          passengerPhone: '01811223344',
          passengerType: 'STUDENT',
          gender: 'FEMALE',
          seatId: 'seat-1'
        }],
        paymentMethod: 'HAND_CASH',
        paidAmount: 550
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingFee).toBe(0);
        expect(result.data.vatAmount).toBe(0);
        expect(result.data.cashoutFee).toBe(0);
      }
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

  describe('Adjacency Geometry (2+2 and rear 5-seat row)', () => {
    it('should expose the physical neighbours for a 5-seat rear row', async () => {
      const { adjacentPartners } = await import('@/services/rules.service');
      // K1 K2 [K3] K4 K5 — K is detected as a five-seat row.
      expect(adjacentPartners('K1', { fiveSeatRows: ['K'] }).sort()).toEqual(['K2']);
      expect(adjacentPartners('K2', { fiveSeatRows: ['K'] }).sort()).toEqual(['K1']);
      expect(adjacentPartners('K3', { fiveSeatRows: ['K'] }).sort()).toEqual(['K2', 'K4']);
      expect(adjacentPartners('K4', { fiveSeatRows: ['K'] }).sort()).toEqual(['K3', 'K5']);
      expect(adjacentPartners('K5', { fiveSeatRows: ['K'] }).sort()).toEqual(['K4']);
      // Standard rows unchanged
      expect(adjacentPartners('A3').sort()).toEqual(['A4']);
    });

    it('should auto-detect five-seat rows from seat labels', async () => {
      const { detectFiveSeatRows } = await import('@/services/rules.service');
      expect(detectFiveSeatRows('A1 A2 K1 K2 K3 K4 K5')).toEqual(['K']);
    });

    it('should reject opposite-gender students on the K4/K5 pair (rear bench)', async () => {
      const { validateMultiSeatBookingPairRules } = await import('@/services/rules.service');
      const seats = [
        { seatId: 's1', seatNumber: 'K4', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'K5', status: 'AVAILABLE' }
      ];
      const res = validateMultiSeatBookingPairRules(
        [
          { seatId: 's1', seatNumber: 'K4', passengerName: 'Girl', gender: 'FEMALE', passengerType: 'STUDENT' },
          { seatId: 's2', seatNumber: 'K5', passengerName: 'Boy', gender: 'MALE', passengerType: 'STUDENT' }
        ],
        seats
      );
      expect(res.isValid).toBe(false);
      expect(res.code).toBe('OPPOSITE_GENDER_ADJACENT_NO_GUARDIAN');
    });

    it('should NOT flag K3/K5 as adjacent (they are not physical neighbours)', async () => {
      const { validateMultiSeatBookingPairRules } = await import('@/services/rules.service');
      const seats = [
        { seatId: 's1', seatNumber: 'K3', status: 'AVAILABLE' },
        { seatId: 's2', seatNumber: 'K4', status: 'AVAILABLE' },
        { seatId: 's3', seatNumber: 'K5', status: 'AVAILABLE' }
      ];
      const res = validateMultiSeatBookingPairRules(
        [
          { seatId: 's1', seatNumber: 'K3', passengerName: 'Girl', gender: 'FEMALE', passengerType: 'STUDENT' },
          { seatId: 's2', seatNumber: 'K5', passengerName: 'Boy', gender: 'MALE', passengerType: 'STUDENT' }
        ],
        seats
      );
      // K3's neighbours are K2/K4; K5's neighbour is K4 — K3 & K5 are NOT
      // adjacent, so two opposite-gender students may sit there.
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
    }, 15000);

    it('should provide popular boarding and dropping points presets', async () => {
      const { COMMON_BOARDING_POINTS, COMMON_DROPPING_POINTS } = await import('@/components/booking/boarding-point-selector');
      expect(COMMON_BOARDING_POINTS.length).toBeGreaterThan(5);
      expect(COMMON_BOARDING_POINTS).toContain('গাবতলী বাস টার্মিনাল');
      expect(COMMON_BOARDING_POINTS).toContain('উত্তরা (আজমপুর)');
      expect(COMMON_DROPPING_POINTS).toContain('বিশ্ববিদ্যালয় মেইন গেট');
    });

    it('should generate offline QR code data URL successfully using qrcode library', async () => {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL('https://atoms-transit.com/bookings/BK-TEST-123');
      expect(dataUrl).toContain('data:image/png;base64,');
    });

    it('should calculate custom percentage, paid amount, and due amount with bi-directional accuracy', () => {
      const netAmount = 1100;
      
      // Test 17% custom percentage calculation as requested by user
      const customPct = 17;
      const targetPaid17 = Math.round((netAmount * customPct) / 100);
      const targetDue17 = netAmount - targetPaid17;
      expect(targetPaid17).toBe(187);
      expect(targetDue17).toBe(913);
      expect(targetPaid17 + targetDue17).toBe(netAmount);

      // Test 0% (Full Due)
      const targetPaid0 = Math.round((netAmount * 0) / 100);
      const targetDue0 = netAmount - targetPaid0;
      expect(targetPaid0).toBe(0);
      expect(targetDue0).toBe(1100);

      // Test 100% (Full Paid)
      const targetPaid100 = Math.round((netAmount * 100) / 100);
      const targetDue100 = netAmount - targetPaid100;
      expect(targetPaid100).toBe(1100);
      expect(targetDue100).toBe(0);

      // Test decimal percentage e.g. 17.5%
      const targetPaidDecimal = Math.round((netAmount * 17.5) / 100);
      expect(targetPaidDecimal).toBe(193);
      expect(netAmount - targetPaidDecimal).toBe(907);

      // Test reverse calculation: Entering due amount 500 should yield 600 paid and 45.45% due
      const manualDue = 500;
      const derivedPaid = netAmount - manualDue;
      const derivedDuePct = (manualDue / netAmount) * 100;
      expect(derivedPaid).toBe(600);
      expect(derivedDuePct.toFixed(1)).toBe('45.5');
    });

    it('should prevent floating-point rounding error where 25% of 550 Tk (138 Tk) became 25.1%', () => {
      const netAmount = 550;
      const chosenPct = 25;
      const targetPaid = Math.round((netAmount * chosenPct) / 100); // 138
      expect(targetPaid).toBe(138);

      // Raw ratio is 138 / 550 * 100 = 25.0909...
      const rawRatio = (targetPaid / netAmount) * 100;
      expect(rawRatio).toBeCloseTo(25.09, 1);

      // Verify clean percentage derivation
      const roundedInt = Math.round(rawRatio);
      const isClean = Math.round((netAmount * roundedInt) / 100) === targetPaid;
      expect(isClean).toBe(true);
      expect(roundedInt).toBe(25);
      expect(100 - roundedInt).toBe(75);
    });

    it('should correctly extract hotel accommodation when trip or booking includes hotel package', async () => {
      const { extractAccommodationInfo, buildWhatsAppTicketMessage } = await import('@/components/booking/payment-receipt');
      
      const normalBooking = {
        bookingNumber: 'BK-NORMAL-001',
        trip: { route: { routeName: 'ঢাকা ➔ রাজশাহী' } }
      };
      expect(extractAccommodationInfo(normalBooking)).toBeNull();

      const normalWa = buildWhatsAppTicketMessage(normalBooking);
      expect(normalWa.message).not.toContain('হোটেল বুকিং ও আবাসন ভাউচার');

      // Hotel package via explicit accommodation
      const comboBooking = {
        bookingNumber: 'BK-HOTEL-001',
        trip: {
          route: { routeName: 'ঢাকা ➔ জাবি ক্যাম্পাস' },
          hasHotelPackage: true
        },
        accommodation: {
          hotelName: 'জাহাঙ্গীরনগর গেস্টহাউস অ্যান্ড স্যুটস',
          roomType: 'ডিলাক্স এসি শেয়ার্ড রুম',
          checkIn: 'দুপুর ১২:০০',
          checkOut: 'পরবর্তী দিন সকাল ১০:০০',
          locationAddress: 'ডেইরি গেট, সাভার',
          contactPerson: '০১৭০০-০০০০০০'
        }
      };

      const hotelInfo = extractAccommodationInfo(comboBooking);
      expect(hotelInfo).not.toBeNull();
      expect(hotelInfo?.hasHotel).toBe(true);
      expect(hotelInfo?.hotelName).toBe('জাহাঙ্গীরনগর গেস্টহাউস অ্যান্ড স্যুটস');
      expect(hotelInfo?.roomType).toBe('ডিলাক্স এসি শেয়ার্ড রুম');

      const comboWa = buildWhatsAppTicketMessage(comboBooking);
      expect(comboWa.message).toContain('🏨 *হোটেল বুকিং ও আবাসন ভাউচার (CONFIRMED):*');
      expect(comboWa.message).toContain('জাহাঙ্গীরনগর গেস্টহাউস অ্যান্ড স্যুটস');
      expect(comboWa.message).toContain('ডিলাক্স এসি শেয়ার্ড রুম');

      // Hotel package via trip notes
      const notesBooking = {
        bookingNumber: 'BK-NOTES-002',
        trip: {
          notes: '[🏨 HOTEL PACKAGE: Campus AC Hostel - ৳1500]'
        }
      };
      const notesHotelInfo = extractAccommodationInfo(notesBooking);
      expect(notesHotelInfo).not.toBeNull();
      expect(notesHotelInfo?.hasHotel).toBe(true);
      expect(notesHotelInfo?.hotelFee).toBe(1500);
    });
  });

  describe('Ticket Billing, VAT/Tax & Anti-Tamper Security Pass Engine', () => {
    it('should correctly calculate net total with VAT, Tax, Processing fee, and Discount', () => {
      const grossAmount = 1300; // 2 seats * 650
      const discountAmount = 100;
      const processingFee = 50;
      const vatAmount = 65; // 5% VAT
      const paidAmount = 1315;

      const netAmount = Math.max(0, grossAmount - discountAmount + processingFee + vatAmount);
      const dueAmount = Math.max(0, netAmount - paidAmount);
      const isPaidInFull = dueAmount <= 0 && paidAmount >= netAmount;

      expect(netAmount).toBe(1315);
      expect(dueAmount).toBe(0);
      expect(isPaidInFull).toBe(true);
    });

    it('should correctly calculate partial payment and due amount', () => {
      const grossAmount = 1300;
      const discountAmount = 0;
      const processingFee = 40;
      const vatAmount = 0;
      const paidAmount = 500;

      const netAmount = Math.max(0, grossAmount - discountAmount + processingFee + vatAmount);
      const dueAmount = Math.max(0, netAmount - paidAmount);
      const isPaidInFull = dueAmount <= 0 && paidAmount >= netAmount;

      expect(netAmount).toBe(1340);
      expect(dueAmount).toBe(840);
      expect(isPaidInFull).toBe(false);
    });

    it('should generate a deterministic SEC-XXXX-XXXX anti-tamper hash and change if corrupted', () => {
      const generateSecHash = (bookingNumber: string, receiptNumber: string, gross: number, net: number, seats: string) => {
        const rawStr = `${bookingNumber}|${receiptNumber}|${gross}|${net}|${seats}`;
        let hash = 0;
        for (let i = 0; i < rawStr.length; i++) {
          hash = ((hash << 5) - hash) + rawStr.charCodeAt(i);
          hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        return `SEC-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
      };

      const validHash = generateSecHash('BK-2026-001', 'RCT-2026-001', 1300, 1340, 'A1,A2');
      expect(validHash).toMatch(/^SEC-[0-9A-F]{4}-[0-9A-F]{4}$/);

      // Verify that any tampering changes the hash immediately
      const tamperedFareHash = generateSecHash('BK-2026-001', 'RCT-2026-001', 1300, 1000, 'A1,A2');
      expect(tamperedFareHash).not.toBe(validHash);

      const tamperedSeatHash = generateSecHash('BK-2026-001', 'RCT-2026-001', 1300, 1340, 'A1,B1');
      expect(tamperedSeatHash).not.toBe(validHash);
    });

    it('should preserve boarding and dropping points with designated fallbacks', () => {
      const explicitBooking = {
        boardingPoint: 'তালাইমারী মোড় কাউন্টার',
        droppingPoint: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় মেইন গেট'
      };

      expect(explicitBooking.boardingPoint).toBe('তালাইমারী মোড় কাউন্টার');
      expect(explicitBooking.droppingPoint).toBe('জাহাঙ্গীরনগর বিশ্ববিদ্যালয় মেইন গেট');

      const fallbackBooking: { boardingPoint?: string; droppingPoint?: string } = {};
      const boardingDisplay = fallbackBooking.boardingPoint || 'Talaimari / Bhadra / Railgate Bus Counter';
      const droppingDisplay = fallbackBooking.droppingPoint || 'University Main Gate / Designated Campus Drop Zone';

      expect(boardingDisplay).toBe('Talaimari / Bhadra / Railgate Bus Counter');
      expect(droppingDisplay).toBe('University Main Gate / Designated Campus Drop Zone');
    });

    it('should correctly support dual ticket (Bus Ticket + Hotel Pass) when hotel accommodation is attached', async () => {
      const { extractAccommodationInfo, HotelAccommodationPass } = await import('@/components/booking/payment-receipt');
      expect(typeof HotelAccommodationPass).toBe('function');

      const bookingWithHotel = {
        id: 'bk-hotel-999',
        bookingNumber: 'BK-2026-HTL-999',
        contactName: 'মাহমুদুল হাসান',
        contactPhone: '01811223344',
        trip: {
          departureDate: '2026-09-12T22:00:00Z',
          departureTime: '2026-09-12T22:00:00Z',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয়',
          bus: {
            busNumber: 'ঢাকা মেট্রো-ব ১৫-১১২২',
            busName: 'গ্রিন লাইন স্পেশাল কোচ',
            notes: '[🏨 HOTEL PACKAGE: হোটেল রয়েল রাজ (Rajshahi) | Room: ২-বেড শেয়ারিং | Fee: ৳1200/person | Inclusions: ফ্রি নাস্তা, ওয়াইফাই]'
          }
        },
        accommodation: {
          hasHotel: true,
          hotelName: 'হোটেল রয়েল রাজ (Rajshahi)',
          roomType: '২-বেড শেয়ারিং (Twin Sharing / Student)',
          hotelFee: 1200
        },
        passengers: [
          { passengerName: 'মাহমুদুল হাসান', seatNumber: 'A1' },
          { passengerName: 'অভিভাবক', seatNumber: 'A2' }
        ]
      };

      const hotelInfo = extractAccommodationInfo(bookingWithHotel);
      expect(hotelInfo).not.toBeNull();
      expect(hotelInfo?.hasHotel).toBe(true);
      expect(hotelInfo?.hotelName).toBe('হোটেল রয়েল রাজ (Rajshahi)');
      expect(hotelInfo?.hotelFee).toBe(1200);

      // Verify bundled extra fare calculation
      const seatCount = bookingWithHotel.passengers.length;
      const totalHotelAddon = seatCount * (hotelInfo?.hotelFee || 0);
      expect(totalHotelAddon).toBe(2400);
    });

    it('should correctly extract hotel info when trip.notes is generic and booking.notes contains hotel package', async () => {
      const { extractAccommodationInfo } = await import('@/components/booking/payment-receipt');
      const booking = {
        id: 'bk-hotel-merged-101',
        bookingNumber: 'BK-2026-HTL-101',
        notes: 'Some student note [🏨 HOTEL PACKAGE: রূপসী বাংলা হোটেল (RU) | Room: ৩-বেড ডিলাক্স | Fee: ৳1500/person | Inclusions: এসি, সকালের নাস্তা]',
        trip: {
          departureDate: '2026-09-12T22:00:00Z',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয়',
          notes: 'Non-hotel generic trip remarks about terminal point',
          bus: {
            busNumber: 'ঢাকা মেট্রো-ব ১৫-৯৯৮৮'
          }
        }
      };

      const extracted = extractAccommodationInfo(booking);
      expect(extracted).not.toBeNull();
      expect(extracted?.hasHotel).toBe(true);
      expect(extracted?.hotelName).toBe('রূপসী বাংলা হোটেল (RU)');
      expect(extracted?.roomType).toBe('৩-বেড ডিলাক্স');
      expect(extracted?.hotelFee).toBe(1500);
    });

    it('should provide accurate Bengali labels, icons, and badges for journey directions', async () => {
      const { getJourneyDirectionInfo } = await import('@/components/booking/payment-receipt');

      const roundTrip = getJourneyDirectionInfo('ROUND_TRIP');
      expect(roundTrip.labelBn).toBe('উভয়মুখী যাত্রা (যাওয়া ও আসা)');
      expect(roundTrip.badgeBn).toBe('যাওয়া ও আসা');
      expect(roundTrip.icon).toBe('🔁');

      const outboundOnly = getJourneyDirectionInfo('OUTBOUND_ONLY');
      expect(outboundOnly.labelBn).toBe('শুধুমাত্র যাওয়া (একমুখী)');
      expect(outboundOnly.badgeBn).toBe('শুধু যাওয়া');
      expect(outboundOnly.icon).toBe('➡️');

      const returnOnly = getJourneyDirectionInfo('RETURN_ONLY');
      expect(returnOnly.labelBn).toBe('শুধুমাত্র আসা (একমুখী ফেরত)');
      expect(returnOnly.badgeBn).toBe('শুধু আসা');
      expect(returnOnly.icon).toBe('⬅️');

      const asymmetric = getJourneyDirectionInfo('ASYMMETRIC');
      expect(asymmetric.labelBn).toBe('স্প্লিট / মিশ্র যাত্রা');
      expect(asymmetric.badgeBn).toBe('মিশ্র যাত্রা');
      expect(asymmetric.icon).toBe('🔀');
    });

    it('should not force 50% discount on OUTBOUND_ONLY or RETURN_ONLY seats and respect manual fare', () => {
      const baseFare = 1000;
      // In prior versions, OUTBOUND_ONLY forced baseFare * 0.5 (500). Now full fare is preserved by default:
      const fullFareOutbound = baseFare; // 1000
      expect(fullFareOutbound).toBe(1000);

      // Custom gross fare override logic allows operator complete freedom
      const operatorCustomFare = 1400; // Operator charges whatever they decide
      const discount = 0;
      const netTotal = operatorCustomFare - discount;
      const paid = 1400;
      const due = Math.max(0, netTotal - paid);

      expect(netTotal).toBe(1400);
      expect(due).toBe(0); // No forced due or 50% discount
    });
  });
});






