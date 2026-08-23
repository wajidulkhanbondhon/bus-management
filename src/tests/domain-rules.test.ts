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
});
