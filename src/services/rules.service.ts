export interface ValidationContext {
  busType: 'MALE' | 'FEMALE' | 'MIXED' | string;
  tripBusType?: 'MALE' | 'FEMALE' | 'MIXED' | string | null;
  seatGenderRule: 'MALE_ONLY' | 'FEMALE_ONLY' | 'ANY' | string;
  passengerType: 'STUDENT' | 'GUARDIAN' | 'GUEST' | string;
  passengerGender: 'MALE' | 'FEMALE' | string;
  guardianRelationship?: 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'UNCLE' | 'AUNT' | 'OTHER' | string | null;
}

export interface RuleValidationResult {
  isValid: boolean;
  code?: string;
  message?: string;
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
      const allowedFemaleBusGuardians = ['FATHER', 'BROTHER', 'MOTHER', 'SISTER', 'HUSBAND', 'UNCLE'];
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
      const allowedMaleBusGuardians = ['MOTHER', 'SISTER', 'FATHER', 'BROTHER', 'WIFE', 'AUNT'];
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
