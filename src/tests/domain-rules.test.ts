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
});

