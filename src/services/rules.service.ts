export interface ValidationContext {
  busType: 'MALE' | 'FEMALE' | 'MIXED' | string;
  tripBusType?: 'MALE' | 'FEMALE' | 'MIXED' | string | null;
  seatGenderRule: 'MALE_ONLY' | 'FEMALE_ONLY' | 'ANY' | string;
  passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST' | string;
  passengerGender: 'MALE' | 'FEMALE' | string;
  guardianRelationship?: 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'SPOUSE' | 'HUSBAND' | 'WIFE' | 'UNCLE' | 'AUNT' | 'OTHER' | string | null;
}

export interface RuleValidationResult {
  isValid: boolean;
  code?: string;
  message?: string;
}

/**
 * Returns the adjacent seat partner in standard 2+2 luxury coach configuration
 * e.g. A1 <-> A2, A3 <-> A4, K1 <-> K2, K4 <-> K5, K3 <-> K2/K4
 */
export function getAdjacentSeatNumber(seatNumber: string): string | null {
  if (!seatNumber) return null;
  const match = seatNumber.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const row = match[1];
  const num = parseInt(match[2], 10);

  // Row K or 5-seat rear row
  if (num === 5) return `${row}4`;
  if (num === 4) return `${row}3` || `${row}5`;
  if (num === 3) return `${row}4` || `${row}2`;
  if (num === 2) return `${row}1`;
  if (num === 1) return `${row}2`;

  return null;
}

/**
 * Returns all adjacent seat numbers in a 2+2 coach row
 */
export function getAdjacentSeatPair(seatNumber: string): string[] {
  if (!seatNumber) return [];
  const match = seatNumber.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return [];

  const row = match[1];
  const num = parseInt(match[2], 10);

  if (num === 1 || num === 2) return [`${row}1`, `${row}2`];
  if (num === 3 || num === 4) return [`${row}3`, `${row}4`];
  if (num === 5) return [`${row}4`, `${row}5`];

  return [];
}

/**
 * Calculates dynamic gender lock protection for all seats on a trip
 * If a female books A1 (without booking A2), A2 becomes dynamically FEMALE_ONLY (Pink).
 * If a male books A3 (without booking A4), A4 becomes dynamically MALE_ONLY (Blue).
 * If both A1 and A2 are booked together with a valid guardian relationship, exemption applies.
 */
export function calculateDynamicAdjacentSeatLocks(
  seats: Array<{
    seatId?: string;
    seatNumber: string;
    status: string;
    genderAllowed?: string;
    booking?: {
      id?: string;
      passengerGender?: string;
      passengerType?: string;
      guardianRelationship?: string;
    } | null;
  }>
): Map<string, { genderAllowed: 'FEMALE_ONLY' | 'MALE_ONLY' | 'ANY'; reason: string; adjacentBookedSeat: string }> {
  const lockMap = new Map<string, { genderAllowed: 'FEMALE_ONLY' | 'MALE_ONLY' | 'ANY'; reason: string; adjacentBookedSeat: string }>();

  // Map of booked seats and their genders
  const bookedSeatInfo = new Map<string, { gender: string; bookingId?: string }>();
  (seats || []).forEach(s => {
    const isBooked = s.status === 'BOOKED' || s.status === 'HELD';
    const sNum = (s?.seatNumber || (s as any)?.seat_number || (s as any)?.label || (s as any)?.seatId || '').trim().toUpperCase();
    if (isBooked && s?.booking?.passengerGender && sNum) {
      bookedSeatInfo.set(sNum, {
        gender: s.booking.passengerGender.toUpperCase(),
        bookingId: s.booking.id
      });
    }
  });

  // Check each available seat for adjacent booked seats
  (seats || []).forEach(seat => {
    if (seat?.status !== 'AVAILABLE') return;

    const seatNum = (seat?.seatNumber || (seat as any)?.seat_number || (seat as any)?.label || (seat as any)?.seatId || '').trim().toUpperCase();
    if (!seatNum) return;

    const pair = getAdjacentSeatPair(seatNum);
    const adjacentSeatNum = pair.find(num => num !== seatNum);

    if (adjacentSeatNum && bookedSeatInfo.has(adjacentSeatNum)) {
      const adjacentInfo = bookedSeatInfo.get(adjacentSeatNum)!;
      if (adjacentInfo.gender === 'FEMALE') {
        lockMap.set(seatNum, {
          genderAllowed: 'FEMALE_ONLY',
          reason: `সংলগ্ন সিট (${adjacentSeatNum}) একজন নারী শিক্ষার্থী/যাত্রী বুক করেছেন।`,
          adjacentBookedSeat: adjacentSeatNum
        });
      } else if (adjacentInfo.gender === 'MALE') {
        lockMap.set(seatNum, {
          genderAllowed: 'MALE_ONLY',
          reason: `সংলগ্ন সিট (${adjacentSeatNum}) একজন পুরুষ যাত্রী বুক করেছেন।`,
          adjacentBookedSeat: adjacentSeatNum
        });
      }
    }
  });

  return lockMap;
}

export function validatePassengerRules(context: ValidationContext): RuleValidationResult {
  const effectiveBusType = context.tripBusType || context.busType;
  const pGender = context.passengerGender.toUpperCase();
  const pType = context.passengerType.toUpperCase();
  const rel = context.guardianRelationship ? context.guardianRelationship.toUpperCase() : null;

  // 1. Bus Type Governance
  if (effectiveBusType === 'FEMALE') {
    if (pType === 'STUDENT') {
      if (pGender !== 'FEMALE') {
        return {
          isValid: false,
          code: 'FEMALE_BUS_STUDENT_RESTRICTION',
          message: 'Female-designated buses only accommodate female admission students.'
        };
      }
    } else if (pType === 'GUARDIAN') {
      // Allowed guardian relationships on female bus
      const allowedFemaleBusGuardians = ['FATHER', 'BROTHER', 'MOTHER', 'SISTER', 'SPOUSE', 'HUSBAND', 'UNCLE', 'AUNT'];
      if (rel && !allowedFemaleBusGuardians.includes(rel)) {
        return {
          isValid: false,
          code: 'FEMALE_BUS_GUARDIAN_RESTRICTION',
          message: `Guardian relationship '${rel}' is not permitted on female-designated transit.`
        };
      }
    }
  }

  if (effectiveBusType === 'MALE') {
    if (pType === 'STUDENT') {
      if (pGender !== 'MALE') {
        return {
          isValid: false,
          code: 'MALE_BUS_STUDENT_RESTRICTION',
          message: 'Male-designated buses only accommodate male admission students.'
        };
      }
    } else if (pType === 'GUARDIAN') {
      const allowedMaleBusGuardians = ['MOTHER', 'SISTER', 'FATHER', 'BROTHER', 'SPOUSE', 'WIFE', 'AUNT', 'UNCLE'];
      if (rel && !allowedMaleBusGuardians.includes(rel)) {
        return {
          isValid: false,
          code: 'MALE_BUS_GUARDIAN_RESTRICTION',
          message: `Guardian relationship '${rel}' is not permitted on male-designated transit.`
        };
      }
    }
  }

  // 2. Seat-Level Specific Gender Rule
  if (context.seatGenderRule === 'FEMALE_ONLY') {
    if (pGender !== 'FEMALE') {
      return {
        isValid: false,
        code: 'SEAT_FEMALE_ONLY',
        message: 'This seat is strictly reserved for female passengers.'
      };
    }
  }

  if (context.seatGenderRule === 'MALE_ONLY') {
    if (pGender !== 'MALE') {
      return {
        isValid: false,
        code: 'SEAT_MALE_ONLY',
        message: 'This seat is strictly reserved for male passengers.'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates a multi-passenger booking for adjacent seats and guardian relationships
 */
export function validateMultiSeatBookingPairRules(
  passengers: Array<{
    seatId: string;
    seatNumber?: string;
    passengerName: string;
    gender: 'MALE' | 'FEMALE' | string;
    passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST' | string;
    guardianRelationship?: string;
  }>,
  allTripSeats: Array<{ seatId: string; seatNumber: string; status: string; booking?: any }>
): RuleValidationResult {
  const allowedGuardianRelationships = ['FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE', 'HUSBAND', 'WIFE', 'UNCLE', 'AUNT', 'OTHER'];

  for (const p of passengers) {
    const sObj = allTripSeats.find(s => s.seatId === p.seatId);
    const seatNum = p.seatNumber || sObj?.seatNumber;
    if (!seatNum) continue;

    const pair = getAdjacentSeatPair(seatNum);
    const adjacentSeatNum = pair.find(num => num !== seatNum);
    if (!adjacentSeatNum) continue;

    // Check if adjacent seat is booked in THIS same transaction
    const coPassenger = passengers.find(cp => {
      const cpObj = allTripSeats.find(s => s.seatId === cp.seatId);
      const cpSeatNum = cp.seatNumber || cpObj?.seatNumber;
      return cpSeatNum === adjacentSeatNum;
    });

    if (coPassenger) {
      // Both seats are booked together
      const isOppositeGender = p.gender.toUpperCase() !== coPassenger.gender.toUpperCase();
      if (isOppositeGender) {
        // Must be Student + Guardian with valid relationship
        const hasStudent = p.passengerType === 'STUDENT' || coPassenger.passengerType === 'STUDENT';
        const guardian = p.passengerType === 'GUARDIAN' ? p : (coPassenger.passengerType === 'GUARDIAN' ? coPassenger : null);

        if (!hasStudent || !guardian) {
          return {
            isValid: false,
            code: 'OPPOSITE_GENDER_ADJACENT_NO_GUARDIAN',
            message: `সিট ${seatNum} এবং ${adjacentSeatNum} বিপরীত জেন্ডারের জন্য শুধুমাত্র শিক্ষার্থী ও অভিভাবক (বাবা, মা, ভাই, বোন, স্বামী/স্ত্রী) একসাথে বুক করতে পারবেন।`
          };
        }

        const rel = guardian.guardianRelationship?.toUpperCase();
        if (!rel || !allowedGuardianRelationships.includes(rel)) {
          return {
            isValid: false,
            code: 'INVALID_GUARDIAN_RELATIONSHIP',
            message: `অভিভাবকের সাথে বৈধ সম্পর্ক (বাবা, মা, ভাই, বোন বা স্পাউস) নির্বাচন করা আবশ্যক।`
          };
        }
      }
    } else {
      // Adjacent seat is already booked on the bus
      const adjacentExistingSeat = allTripSeats.find(s => s.seatNumber === adjacentSeatNum);
      if (adjacentExistingSeat && (adjacentExistingSeat.status === 'BOOKED' || adjacentExistingSeat.status === 'HELD')) {
        const existingGender = adjacentExistingSeat.booking?.passengerGender?.toUpperCase();
        if (existingGender && existingGender !== p.gender.toUpperCase()) {
          return {
            isValid: false,
            code: 'ADJACENT_GENDER_MISMATCH',
            message: `সিট ${seatNum}-এর সংলগ্ন সিট (${adjacentSeatNum}) একজন ${existingGender === 'FEMALE' ? 'নারী' : 'পুরুষ'} যাত্রী বুক করেছেন। এই সিটটি শুধুমাত্র ${existingGender === 'FEMALE' ? 'নারী' : 'পুরুষ'} যাত্রীদের জন্য প্রযোজ্য।`
          };
        }
      }
    }
  }

  return { isValid: true };
}
