'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  Phone,
  UserCheck,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  User,
  HeartHandshake,
  GraduationCap,
  Check,
  Pencil
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { WhatsAppLogo } from './payment-brand-icons';
import { useApp } from '@/lib/context';
import { cn, isValidBdMobile, cleanAndLimitPhoneNumber, formatCurrency } from '@/lib/utils';
import {
  validateMultiSeatBookingPairRules,
  getAdjacentSeatNumber,
  getAdjacentSeatPair,
  STRICT_ALLOWED_GUARDIAN_RELATIONSHIPS
} from '@/services/rules.service';
import {
  lookupPassengerByPhone,
  DirectoryPassenger
} from '@/services/passenger-directory.service';
import { matchTripUniversityCode } from './trip-selection-step';

export interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  phoneType: 'WHATSAPP' | 'NORMAL';
  hasWhatsapp?: boolean;
  whatsappNumber?: string;
  passengerType: 'STUDENT' | 'GUARDIAN';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  guardianPhone?: string;
  guardianPhoneType?: 'WHATSAPP' | 'NORMAL';
  guardianHasWhatsapp?: boolean;
  guardianWhatsappNumber?: string;
  guardianRelationship?:
    | 'FATHER'
    | 'MOTHER'
    | 'BROTHER'
    | 'SISTER'
    | 'PATERNAL_GRANDFATHER'
    | 'MATERNAL_GRANDFATHER'
    | 'PATERNAL_GRANDMOTHER'
    | 'MATERNAL_GRANDMOTHER'
    | 'SPOUSE'
    | 'UNCLE'
    | 'AUNT'
    | 'OTHER';
}

export interface PassengerStepProps {
  passengers: PassengerInput[];
  allCurrentSeats: any[];
  targetUniversity: string;
  selectedTrip?: any;
  allTrips?: any[];
  allBookings?: any[];
  suggestedPassengerMap: Record<string, DirectoryPassenger>;
  errorMessage?: string | null;
  onUpdatePassenger: (seatId: string, updates: Partial<PassengerInput>) => void;
  onSetErrorMessage: (msg: string | null) => void;
  onGoBack: () => void;
  onContinue: () => void;
}

export const RELATIONSHIP_OPTIONS: { value: PassengerInput['guardianRelationship']; labelBn: string; labelEn: string }[] = [
  { value: 'FATHER', labelBn: 'বাপ / বাবা (Father)', labelEn: 'Father' },
  { value: 'MOTHER', labelBn: 'মা (Mother)', labelEn: 'Mother' },
  { value: 'BROTHER', labelBn: 'আপন ভাই (Brother)', labelEn: 'Brother' },
  { value: 'SISTER', labelBn: 'আপন বোন (Sister)', labelEn: 'Sister' },
  { value: 'PATERNAL_GRANDFATHER', labelBn: 'দাদা (Paternal Grandfather)', labelEn: 'Paternal Grandfather' },
  { value: 'MATERNAL_GRANDFATHER', labelBn: 'নানা (Maternal Grandfather)', labelEn: 'Maternal Grandfather' },
  { value: 'PATERNAL_GRANDMOTHER', labelBn: 'দাদি (Paternal Grandmother)', labelEn: 'Paternal Grandmother' },
  { value: 'MATERNAL_GRANDMOTHER', labelBn: 'নানি (Maternal Grandmother)', labelEn: 'Maternal Grandmother' },
  { value: 'SPOUSE', labelBn: 'স্বামী / স্ত্রী (Spouse)', labelEn: 'Spouse' }
];

function isPassengerBasicInfoComplete(pass: PassengerInput): boolean {
  const hasName = !!pass.passengerName?.trim();
  const cleanPhone = (pass.passengerPhone || '').replace(/[\s-]/g, '');
  const hasPhone = /^01[3-9]\d{8}$/.test(cleanPhone);
  return hasName && hasPhone;
}

export function getPassengerPairRuleViolation(
  p: PassengerInput,
  passengers: PassengerInput[],
  allTripSeats: any[]
): string | null {
  const sObj = allTripSeats.find((s) => s.seatId === p.seatId);
  const seatNum = (sObj?.seatNumber || (sObj as any)?.seat_number || (sObj as any)?.label || '').trim().toUpperCase();
  if (!seatNum) return null;

  const pair = getAdjacentSeatPair(seatNum);
  const adjacentSeatNum = pair.find((num) => num !== seatNum);
  if (!adjacentSeatNum) return null;

  // 1. Check if adjacent seat is in THIS same booking
  const coPassenger = passengers.find((cp) => {
    const cpObj = allTripSeats.find((s) => s.seatId === cp.seatId);
    const cpSeatNum = (cpObj?.seatNumber || (cpObj as any)?.seat_number || (cpObj as any)?.label || '').trim().toUpperCase();
    return cpSeatNum === adjacentSeatNum;
  });

  if (coPassenger) {
    const isOppositeGender = p.gender.toUpperCase() !== coPassenger.gender.toUpperCase();
    if (isOppositeGender) {
      const pIsStudent = p.passengerType === 'STUDENT';
      const cpIsStudent = coPassenger.passengerType === 'STUDENT';
      const pIsGuardian = p.passengerType === 'GUARDIAN';
      const cpIsGuardian = coPassenger.passengerType === 'GUARDIAN';

      // If this passenger is the guardian, validate their relationship
      if (pIsGuardian) {
        const rel = p.guardianRelationship?.toUpperCase();
        if (!rel || !STRICT_ALLOWED_GUARDIAN_RELATIONSHIPS.includes(rel)) {
          return `শিক্ষার্থীর সাথে রক্তীয় অনুমোদিত সম্পর্ক নির্বাচন করুন।`;
        }
      }

      // If co-passenger is the guardian, relationship error belongs to coPassenger, NOT p!
      if (cpIsGuardian) {
        return null;
      }

      // Both are students of opposite gender
      if (pIsStudent && cpIsStudent) {
        const pComplete = isPassengerBasicInfoComplete(p);
        const cpComplete = isPassengerBasicInfoComplete(coPassenger);
        const pIndex = passengers.findIndex((item) => item.seatId === p.seatId);
        const cpIndex = passengers.findIndex((item) => item.seatId === coPassenger.seatId);

        // Rule: The passenger that was completed/filled first does NOT show an error; the conflicting subsequent one does!
        if (pComplete && !cpComplete) {
          // p is already completed first, so p gets NO error!
          return null;
        }

        if (!pComplete && cpComplete) {
          // coPassenger was completed first, so p gets the violation!
          return `সিট ${seatNum} (${p.gender === 'MALE' ? 'পুরুষ' : 'নারী'} শিক্ষার্থী) সংলগ্ন সিট ${adjacentSeatNum}-এর সাথে বিপরীত জেন্ডার। রক্তীয় অভিভাবক (Guardian) আবশ্যক।`;
        }

        // If both are completely filled with names and valid phones, BUT both are opposite gender students:
        if (pComplete && cpComplete) {
          return `সিট ${seatNum} এবং ${adjacentSeatNum} বিপরীত জেন্ডারের সাধারণ শিক্ষার্থী। সাথে রক্তীয় অভিভাবক (বাপ, মা, ভাই, বোন, দাদা, নানা, দাদি, নানি, স্বামী/স্ত্রী) থাকলে যাত্রীর ধরন "অভিভাবক" (Guardian) নির্বাচন করুন।`;
        }

        // If neither is complete: earlier index stays clean, later index shows conflict hint
        if (pIndex < cpIndex) {
          return null;
        }

        return `সিট ${seatNum} এবং ${adjacentSeatNum} বিপরীত জেন্ডারের শিক্ষার্থী। রক্তীয় অভিভাবক ছাড়া একসাথে বসা যাবে না।`;
      }
    }
  } else {
    // 2. Adjacent seat is already booked on the bus by another passenger
    const adjacentExistingSeat = allTripSeats.find((s) => {
      const num = (s?.seatNumber || (s as any)?.seat_number || (s as any)?.label || '').trim().toUpperCase();
      return num === adjacentSeatNum;
    });

    if (
      adjacentExistingSeat &&
      (adjacentExistingSeat.status === 'BOOKED' || adjacentExistingSeat.status === 'HELD')
    ) {
      const existingGender = adjacentExistingSeat.booking?.passengerGender?.toUpperCase();
      if (existingGender && existingGender !== p.gender.toUpperCase()) {
        return `সিট ${seatNum}-এর পাশের সিট (${adjacentSeatNum}) একজন ${
          existingGender === 'FEMALE' ? 'নারী' : 'পুরুষ'
        } যাত্রী বুক করেছেন। এই সিটটি শুধুমাত্র ${
          existingGender === 'FEMALE' ? 'নারী' : 'পুরুষ'
        } যাত্রীদের জন্য প্রযোজ্য।`;
      }
    }
  }

  return null;
}

export function PassengerDetailsStep({
  passengers,
  allCurrentSeats,
  targetUniversity,
  selectedTrip,
  allTrips = [],
  allBookings = [],
  suggestedPassengerMap,
  errorMessage,
  onUpdatePassenger,
  onSetErrorMessage,
  onGoBack,
  onContinue
}: PassengerStepProps) {
  const { language, currentColor } = useApp();
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, boolean>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [phoneLookupMatches, setPhoneLookupMatches] = useState<Record<string, DirectoryPassenger>>({});
  const [remoteDuplicateMatches, setRemoteDuplicateMatches] = useState<
    Record<string, { busName: string; seatNumber?: string }[]>
  >({});

  // Dynamic phone lookup whenever passengers list changes
  React.useEffect(() => {
    const matches: Record<string, DirectoryPassenger> = {};
    passengers.forEach((p) => {
      const clean = cleanAndLimitPhoneNumber(p.passengerPhone);
      if (clean.length >= 6) {
        const found = lookupPassengerByPhone(clean);
        if (found) {
          matches[p.seatId] = found;
        }
      }
    });
    setPhoneLookupMatches(matches);
  }, [passengers]);

  // Field level validation errors per seatId
  const [fieldErrors, setFieldErrors] = useState<
    Record<
      string,
      {
        passengerName?: string;
        passengerPhone?: string;
        duplicatePhone?: string;
        guardianPhone?: string;
        guardianRelationship?: string;
        pairRuleViolation?: string;
      }
    >
  >({});

  // Map of seatId -> confirmedCleanPhone (when user chooses to keep a duplicate number on same bus/exam)
  const [confirmedKeepMap, setConfirmedKeepMap] = useState<Record<string, string>>({});

  const currentTripDate = useMemo(() => {
    const raw = selectedTrip?.departureDate || selectedTrip?.departure_date || selectedTrip?.examDate || '';
    return raw ? String(raw).split('T')[0].trim() : '';
  }, [selectedTrip]);

  const currentUniCode = useMemo(() => {
    return selectedTrip ? matchTripUniversityCode(selectedTrip) : matchTripUniversityCode({ targetUniversity });
  }, [selectedTrip, targetUniversity]);

  // All buses scheduled for the same university exam on the same travel/exam date
  const sameExamBuses = useMemo(() => {
    if (!allTrips || allTrips.length === 0) return [];
    return allTrips.filter((t) => {
      const tUni = matchTripUniversityCode(t);
      const tDate = (t.departureDate || t.departure_date || t.examDate || '').toString().split('T')[0].trim();
      const isSameUni = tUni === currentUniCode;
      const isSameDate = !currentTripDate || !tDate || tDate === currentTripDate;
      return isSameUni && isSameDate;
    });
  }, [allTrips, currentUniCode, currentTripDate]);

  // Real-time remote check for duplicate bookings across all buses for this exam date
  React.useEffect(() => {
    passengers.forEach((p) => {
      const clean = cleanAndLimitPhoneNumber(p.passengerPhone);
      if (clean.length === 11 && isValidBdMobile(clean)) {
        const tripId = selectedTrip?.id || '';
        fetch(`/api/backend/inventory/check-exam-duplicate-phone?phone=${clean}&trip_id=${tripId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.has_duplicate && Array.isArray(data.matches)) {
              const matches = data.matches.map((m: any) => ({
                busName: m.bus_name || 'অন্য বাস',
                seatNumber: m.seat_number || ''
              }));
              setRemoteDuplicateMatches((prev) => ({ ...prev, [p.seatId]: matches }));
            } else {
              setRemoteDuplicateMatches((prev) => {
                if (!prev[p.seatId]) return prev;
                const next = { ...prev };
                delete next[p.seatId];
                return next;
              });
            }
          })
          .catch(() => {});
      } else {
        setRemoteDuplicateMatches((prev) => {
          if (!prev[p.seatId]) return prev;
          const next = { ...prev };
          delete next[p.seatId];
          return next;
        });
      }
    });
  }, [passengers, selectedTrip?.id]);

  // Check if phone number is used in multiple tickets across ANY bus for the same exam date
  const getDuplicateSeatsForPhone = useCallback(
    (seatId: string, phone: string): string[] => {
      const clean = cleanAndLimitPhoneNumber(phone);
      if (clean.length !== 11) return [];

      const duplicateDescriptions: string[] = [];

      // 1. Check other seats in current passenger list on this form
      passengers.forEach((cp) => {
        if (cp.seatId !== seatId) {
          const otherClean = cleanAndLimitPhoneNumber(cp.passengerPhone);
          if (otherClean === clean) {
            const seatObj = allCurrentSeats.find((s) => s.seatId === cp.seatId);
            const label = (seatObj?.seatNumber || (seatObj as any)?.label || cp.seatId).trim().toUpperCase();
            const desc = language === 'bn' ? `এই বাস (সিট ${label})` : `This Bus (Seat ${label})`;
            if (!duplicateDescriptions.includes(desc)) {
              duplicateDescriptions.push(desc);
            }
          }
        }
      });

      // 2. Check already booked/held seats on this current bus trip
      allCurrentSeats.forEach((s) => {
        if (s.seatId !== seatId && (s.status === 'BOOKED' || s.status === 'HELD')) {
          const sPhone = cleanAndLimitPhoneNumber(
            s.passengerPhone ||
              s.passenger_phone ||
              s.contact_phone ||
              s.booking?.passengerPhone ||
              s.booking?.contactPhone ||
              ''
          );
          if (sPhone === clean) {
            const label = (s.seatNumber || (s as any)?.label || s.seatId).trim().toUpperCase();
            const desc = language === 'bn' ? `এই বাস (সিট ${label})` : `This Bus (Seat ${label})`;
            if (!duplicateDescriptions.includes(desc)) {
              duplicateDescriptions.push(desc);
            }
          }
        }
      });

      // 3. Check all other buses created for this same university exam on this date
      if (allBookings && allBookings.length > 0) {
        const otherExamTrips = sameExamBuses.filter(
          (t) => (t.id || t.tripId) !== (selectedTrip?.id || selectedTrip?.tripId)
        );
        const otherTripIds = new Set(otherExamTrips.map((t) => t.id || t.tripId));

        allBookings.forEach((b: any) => {
          const bTripId = b.trip_id || b.tripId || b.trip?.id;
          const isStatusActive = b.booking_status !== 'CANCELLED' && b.bookingStatus !== 'CANCELLED';
          if (!isStatusActive) return;

          if (otherTripIds.has(bTripId)) {
            const tripObj = otherExamTrips.find((t) => (t.id || t.tripId) === bTripId);
            const busName =
              tripObj?.bus?.busName ||
              tripObj?.bus?.bus_name ||
              tripObj?.bus?.busNumber ||
              tripObj?.tripCode ||
              (language === 'bn' ? 'অন্য বাস' : 'Other Bus');

            // Check contact phone of the booking
            const bPhone = cleanAndLimitPhoneNumber(b.contact_phone || b.contactPhone || '');
            if (bPhone === clean) {
              const desc = `${busName}`;
              if (!duplicateDescriptions.some((d) => d.startsWith(busName))) {
                duplicateDescriptions.push(desc);
              }
            }

            // Check individual passengers of the booking
            const bPassengers = Array.isArray(b.passengers) ? b.passengers : [];
            bPassengers.forEach((bp: any) => {
              const bpPhone = cleanAndLimitPhoneNumber(bp.passenger_phone || bp.passengerPhone || '');
              if (bpPhone === clean) {
                const sNum = bp.seat_number || bp.seatNumber || '';
                const desc = sNum
                  ? `${busName} (${language === 'bn' ? 'সিট' : 'Seat'} ${sNum})`
                  : busName;
                if (!duplicateDescriptions.includes(desc)) {
                  duplicateDescriptions.push(desc);
                }
              }
            });
          }
        });
      }

      // 4. Merge remote database matches across all exam buses if found
      const remoteMatches = remoteDuplicateMatches[seatId] || [];
      remoteMatches.forEach((rm) => {
        const desc = rm.seatNumber && rm.seatNumber !== 'বুকিং'
          ? `${rm.busName} (${language === 'bn' ? 'সিট' : 'Seat'} ${rm.seatNumber})`
          : rm.busName;
        if (!duplicateDescriptions.includes(desc)) {
          duplicateDescriptions.push(desc);
        }
      });

      return duplicateDescriptions;
    },
    [passengers, allCurrentSeats, allBookings, sameExamBuses, selectedTrip, remoteDuplicateMatches, language]
  );

  const handleConfirmKeepNumber = (seatId: string, phone: string) => {
    const clean = cleanAndLimitPhoneNumber(phone);
    setConfirmedKeepMap((prev) => ({ ...prev, [seatId]: clean }));
    setFieldErrors((prev) => {
      if (!prev[seatId]) return prev;
      const next = { ...prev };
      const updatedSeat = { ...next[seatId] };
      delete updatedSeat.duplicatePhone;
      const hasRemaining = Object.values(updatedSeat).some(
        (v) => typeof v === 'string' && v.trim().length > 0
      );
      if (!hasRemaining) {
        delete next[seatId];
      } else {
        next[seatId] = updatedSeat;
      }
      return next;
    });
    setStepError(null);
    onSetErrorMessage(null);
  };

  const handleChangeNumber = (seatId: string) => {
    onUpdatePassenger(seatId, { passengerPhone: '' });
    setConfirmedKeepMap((prev) => {
      const next = { ...prev };
      delete next[seatId];
      return next;
    });
    setPhoneLookupMatches((prev) => {
      const next = { ...prev };
      delete next[seatId];
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[seatId]) return prev;
      const next = { ...prev };
      const updatedSeat = { ...next[seatId] };
      delete updatedSeat.duplicatePhone;
      delete updatedSeat.passengerPhone;
      const hasRemaining = Object.values(updatedSeat).some(
        (v) => typeof v === 'string' && v.trim().length > 0
      );
      if (!hasRemaining) {
        delete next[seatId];
      } else {
        next[seatId] = updatedSeat;
      }
      return next;
    });
    setTimeout(() => {
      const inputEl = document.getElementById(`input-phone-${seatId}`) as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
      }
    }, 100);
  };

  // Real-time passenger pair rules checking
  const pairCheckResult = useMemo(() => {
    return validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
  }, [passengers, allCurrentSeats]);

  // Reactively prune any stale errors across all passenger cards whenever passengers, confirmedKeepMap, or allCurrentSeats change
  React.useEffect(() => {
    setFieldErrors((prev) => {
      let changed = false;
      const next = { ...prev };

      passengers.forEach((p) => {
        const sErrors = next[p.seatId];
        if (!sErrors) return;

        let seatChanged = false;
        const updated = { ...sErrors };

        // 1. Prune pairRuleViolation if current pair violation is now null
        if (updated.pairRuleViolation) {
          const activeViolation = getPassengerPairRuleViolation(p, passengers, allCurrentSeats);
          if (!activeViolation) {
            delete updated.pairRuleViolation;
            seatChanged = true;
          }
        }

        // 2. Prune duplicatePhone if no duplicates exist or user confirmed keeping the number
        if (updated.duplicatePhone) {
          const cleanPhone = cleanAndLimitPhoneNumber(p.passengerPhone);
          const dupSeats = getDuplicateSeatsForPhone(p.seatId, p.passengerPhone);
          if (dupSeats.length === 0 || confirmedKeepMap[p.seatId] === cleanPhone) {
            delete updated.duplicatePhone;
            seatChanged = true;
          }
        }

        // 3. Prune passengerName if name is valid
        if (updated.passengerName && p.passengerName?.trim()) {
          delete updated.passengerName;
          seatChanged = true;
        }

        // 4. Prune passengerPhone if phone is valid
        if (updated.passengerPhone) {
          const cleanPhone = (p.passengerPhone || '').replace(/[\s-]/g, '');
          if (/^01[3-9]\d{8}$/.test(cleanPhone)) {
            delete updated.passengerPhone;
            seatChanged = true;
          }
        }

        // 5. Prune guardianRelationship if student or relationship selected
        if (updated.guardianRelationship) {
          if (p.passengerType === 'STUDENT' || (p.passengerType === 'GUARDIAN' && !!p.guardianRelationship)) {
            delete updated.guardianRelationship;
            seatChanged = true;
          }
        }

        // 6. Prune guardianPhone if valid or empty
        if (updated.guardianPhone) {
          const cleanG = (p.guardianPhone || '').replace(/[\s-]/g, '');
          if (!cleanG || /^01[3-9]\d{8}$/.test(cleanG)) {
            delete updated.guardianPhone;
            seatChanged = true;
          }
        }

        if (seatChanged) {
          changed = true;
          const hasRemaining = Object.values(updated).some(
            (v) => typeof v === 'string' && v.trim().length > 0
          );
          if (!hasRemaining) {
            delete next[p.seatId];
          } else {
            next[p.seatId] = updated;
          }
        }
      });

      if (changed && Object.keys(next).length === 0) {
        setStepError(null);
        onSetErrorMessage(null);
      }

      return changed ? next : prev;
    });
  }, [passengers, allCurrentSeats, confirmedKeepMap, getDuplicateSeatsForPhone, onSetErrorMessage]);

  // Per-passenger validation function
  const validateSinglePassenger = useCallback(
    (p: PassengerInput, seatNum: string) => {
      const errors: {
        passengerName?: string;
        passengerPhone?: string;
        duplicatePhone?: string;
        guardianPhone?: string;
        guardianRelationship?: string;
        pairRuleViolation?: string;
      } = {};

      if (!p.passengerName || !p.passengerName.trim()) {
        errors.passengerName =
          language === 'bn'
            ? `সিট ${seatNum}-এর যাত্রীর পুরো নাম আবশ্যক`
            : `Full name required for Seat ${seatNum}`;
      }

      const cleanPhone = (p.passengerPhone || '').replace(/[\s-]/g, '');
      if (!cleanPhone) {
        errors.passengerPhone =
          language === 'bn'
            ? `সিট ${seatNum}-এর ১১ ডিজিটের মোবাইল নম্বর দিন`
            : `11-digit mobile required for Seat ${seatNum}`;
      } else if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
        errors.passengerPhone =
          language === 'bn'
            ? `১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল লিখুন (যেমন: 017XXXXXXXX)`
            : `Invalid 11-digit mobile number`;
      }

      if (p.guardianPhone && p.guardianPhone.trim()) {
        const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
        if (!/^01[3-9]\d{8}$/.test(cleanGPhone)) {
          errors.guardianPhone =
            language === 'bn'
              ? `সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন`
              : `Invalid 11-digit phone number`;
        }
      }

      if (p.passengerType === 'GUARDIAN' && !p.guardianRelationship) {
        errors.guardianRelationship =
          language === 'bn'
            ? `শিক্ষার্থীর সাথে রক্তের সম্পর্ক নির্বাচন করুন`
            : `Please select guardian relationship`;
      }

      return errors;
    },
    [language]
  );

  const applySuggestion = (seatId: string, found: DirectoryPassenger) => {
    onUpdatePassenger(seatId, {
      passengerName: found.name,
      passengerPhone: found.phone,
      gender: found.gender,
      passengerType: found.passengerType,
      admissionId: found.admissionId || '',
      institution: found.institution || `${targetUniversity} (Admission Candidate)`,
      guardianPhone: found.guardianPhone || '',
      guardianRelationship: (found.guardianRelationship as any) || undefined
    });
    setDismissedSuggestions((prev) => ({ ...prev, [seatId]: true }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[seatId];
      return next;
    });
    setStepError(null);
    onSetErrorMessage(null);
  };

  const handleCopyFirstPhoneToAll = () => {
    if (!passengers[0]?.passengerPhone) return;
    const firstP = passengers[0];
    const phoneToCopy = cleanAndLimitPhoneNumber(firstP.passengerPhone);
    passengers.forEach((p, idx) => {
      if (idx > 0) {
        onUpdatePassenger(p.seatId, {
          passengerPhone: phoneToCopy,
          phoneType: firstP.phoneType || 'WHATSAPP',
          hasWhatsapp: firstP.hasWhatsapp !== false,
          whatsappNumber: firstP.whatsappNumber || (firstP.phoneType === 'WHATSAPP' ? phoneToCopy : '')
        });
      }
    });

    // Clear phone errors and record confirmation on copied passengers if phone is valid
    if (isValidBdMobile(phoneToCopy)) {
      setConfirmedKeepMap((prev) => {
        const updated = { ...prev };
        passengers.forEach((p) => {
          updated[p.seatId] = phoneToCopy;
        });
        return updated;
      });

      setFieldErrors((prev) => {
        const updated = { ...prev };
        passengers.forEach((p, idx) => {
          if (idx > 0 && updated[p.seatId]) {
            const nextSeat = { ...updated[p.seatId] };
            delete nextSeat.passengerPhone;
            delete nextSeat.duplicatePhone;
            if (!Object.values(nextSeat).some((v) => typeof v === 'string' && v.trim().length > 0)) {
              delete updated[p.seatId];
            } else {
              updated[p.seatId] = nextSeat;
            }
          }
        });
        return updated;
      });
    }

    setCopiedNotification(language === 'bn' ? '১ম যাত্রীর নম্বর সবার জন্য যুক্ত হয়েছে' : 'Copied 1st phone to all');
    setTimeout(() => setCopiedNotification(null), 3000);
    setStepError(null);
    onSetErrorMessage(null);
  };

  const handleFieldChange = (seatId: string, field: keyof PassengerInput, value: any) => {
    onUpdatePassenger(seatId, { [field]: value });

    // Dynamic phone number lookup for autofill
    if (field === 'passengerPhone') {
      const clean = cleanAndLimitPhoneNumber(value);
      setConfirmedKeepMap((prev) => {
        if (prev[seatId] && prev[seatId] !== clean) {
          const next = { ...prev };
          delete next[seatId];
          return next;
        }
        return prev;
      });

      if (clean.length >= 6) {
        const found = lookupPassengerByPhone(clean);
        if (found) {
          setPhoneLookupMatches((prev) => ({ ...prev, [seatId]: found }));
        } else {
          setPhoneLookupMatches((prev) => {
            const next = { ...prev };
            delete next[seatId];
            return next;
          });
        }
      } else {
        setPhoneLookupMatches((prev) => {
          const next = { ...prev };
          delete next[seatId];
          return next;
        });
      }
    }

    // Clear field-specific error in real time as user corrects it
    setFieldErrors((prev) => {
      const next = { ...prev };

      // 1. Clear field on the edited seat
      if (next[seatId]) {
        const updatedSeat = { ...next[seatId] };
        delete updatedSeat[field as keyof typeof updatedSeat];
        if (field === 'passengerPhone') {
          delete updatedSeat.passengerPhone;
          delete updatedSeat.duplicatePhone;
        }
        if (field === 'gender' || field === 'passengerType' || field === 'guardianRelationship') {
          delete updatedSeat.pairRuleViolation;
        }
        const hasRemaining = Object.values(updatedSeat).some(
          (v) => typeof v === 'string' && v.trim().length > 0
        );
        if (!hasRemaining) {
          delete next[seatId];
        } else {
          next[seatId] = updatedSeat;
        }
      }

      // 2. Reactively clear pairRuleViolation on ALL passengers if the violation no longer exists
      // (e.g. changing one seat to GUARDIAN, picking relationship, or matching gender fixes the pair for both seats)
      if (field === 'gender' || field === 'passengerType' || field === 'guardianRelationship') {
        const simulatedPassengers = passengers.map((p) =>
          p.seatId === seatId ? { ...p, [field]: value } : p
        );

        simulatedPassengers.forEach((p) => {
          if (next[p.seatId]?.pairRuleViolation) {
            const violation = getPassengerPairRuleViolation(p, simulatedPassengers, allCurrentSeats);
            if (!violation) {
              const updated = { ...next[p.seatId] };
              delete updated.pairRuleViolation;
              const hasRemaining = Object.values(updated).some(
                (v) => typeof v === 'string' && v.trim().length > 0
              );
              if (!hasRemaining) {
                delete next[p.seatId];
              } else {
                next[p.seatId] = updated;
              }
            }
          }
        });
      }

      return next;
    });

    setStepError(null);
    onSetErrorMessage(null);
  };

  const handleValidateAndContinue = () => {
    setHasAttemptedSubmit(true);
    setStepError(null);
    onSetErrorMessage(null);

    const newFieldErrors: typeof fieldErrors = {};
    let firstInvalidSeatId: string | null = null;
    let firstErrorMessage: string | null = null;

    // Validate each passenger individually - only the form with mistakes will receive errors
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const sObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
      const sLabel = sObj?.seatNumber || `সিট #${i + 1}`;

      const pErrors = validateSinglePassenger(p, sLabel);

      // Check specific pair rule violation for this passenger only
      const pairViolation = getPassengerPairRuleViolation(p, passengers, allCurrentSeats);
      if (pairViolation) {
        pErrors.pairRuleViolation = pairViolation;
      }

      // Check for unconfirmed duplicate phone number across all exam buses
      const cleanPhone = cleanAndLimitPhoneNumber(p.passengerPhone);
      const dupSeats = getDuplicateSeatsForPhone(p.seatId, p.passengerPhone);
      if (dupSeats.length > 0 && confirmedKeepMap[p.seatId] !== cleanPhone) {
        pErrors.duplicatePhone =
          language === 'bn'
            ? `সিট ${sLabel}-এ ব্যবহৃত নম্বরটি (${cleanPhone}) ইতিমধ্যে এই তারিখে ${targetUniversity} পরীক্ষার জন্য [${dupSeats.join(', ')}]-এ রয়েছে। নম্বরটি বহাল রাখবেন নাকি পরিবর্তন করবেন তা নির্বাচন করুন।`
            : `Number already used on exam bus (${dupSeats.join(', ')}). Please confirm to keep or change.`;
      }

      if (Object.keys(pErrors).length > 0) {
        newFieldErrors[p.seatId] = pErrors;
        if (!firstInvalidSeatId) {
          firstInvalidSeatId = p.seatId;
          firstErrorMessage =
            pErrors.passengerName ||
            pErrors.passengerPhone ||
            pErrors.duplicatePhone ||
            pErrors.guardianRelationship ||
            pErrors.pairRuleViolation ||
            pErrors.guardianPhone ||
            null;
        }
      }
    }

    setFieldErrors(newFieldErrors);

    if (firstErrorMessage || Object.keys(newFieldErrors).length > 0) {
      setStepError(firstErrorMessage || (language === 'bn' ? 'অনুগ্রহ করে লাল চিহ্নিত ভুল তথ্য সঠিকভাবে পূরণ করুন।' : 'Please fix highlighted errors.'));
      onSetErrorMessage(firstErrorMessage || (language === 'bn' ? 'অনুগ্রহ করে লাল চিহ্নিত ভুল তথ্য সঠিকভাবে পূরণ করুন।' : 'Please fix highlighted errors.'));

      // Smooth scroll to the first error card and focus on the input
      if (firstInvalidSeatId) {
        setTimeout(() => {
          const cardEl = document.getElementById(`passenger-card-${firstInvalidSeatId}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const firstInput = cardEl.querySelector('input') as HTMLInputElement | null;
            if (firstInput) firstInput.focus();
          }
        }, 100);
      }
      return;
    }

    onContinue();
  };

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Friendly Guide & Quick Actions Card */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-blue-200 dark:border-blue-800/80 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGoBack}
              className="rounded-2xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs border-slate-200 dark:border-slate-700 shrink-0 transition-all hover:-translate-x-0.5"
              title={language === 'bn' ? 'সিট নির্বাচনে ফিরে যান' : 'Back to Seat Selection'}
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{language === 'bn' ? 'পেছনে যান (সিট পরিবর্তন)' : 'Back to Seats'}</span>
            </Button>
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white hidden md:flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'যাত্রীদের তথ্য ও নিয়মাবলী' : 'Passenger Verification & Details'}</span>
                <Badge variant="primary" className="text-[11px] font-bold font-mono px-2 py-0.5">
                  {passengers.length} {language === 'bn' ? 'সিট' : 'Seats'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {language === 'bn'
                  ? 'প্রতিটি সিটের জন্য সঠিক নাম ও ১১ ডিজিটের মোবাইল নম্বর দিন। রক্তীয় অভিভাবক ছাড়া বিপরীত জেন্ডার একসাথে বসা নিষিদ্ধ।'
                  : 'Enter valid names & 11-digit mobile numbers for each seat. Opposite genders cannot sit adjacent without guardian.'}
              </p>
            </div>
          </div>

          {passengers.length > 1 && passengers[0]?.passengerPhone && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyFirstPhoneToAll}
                className="text-xs font-black bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 hover:bg-indigo-50 rounded-xl shadow-xs py-2 px-3 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {language === 'bn' ? '১ম যাত্রীর নম্বর বাকিদের দিন' : 'Copy 1st Phone to All'}
              </Button>
              {copiedNotification && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in">
                  ✓ {copiedNotification}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3 Step Micro-guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
            <span>{language === 'bn' ? 'পূর্ণ নাম ও ১১ ডিজিট মোবাইল' : 'Name & 11-digit Mobile'}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
            <span>{language === 'bn' ? 'শিক্ষার্থী / অভিভাবক নির্ধারণ' : 'Student / Guardian'}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
            <span>{language === 'bn' ? 'সংলগ্ন সিট জেন্ডার রক্ষা' : 'Adjacent Gender Guard'}</span>
          </div>
        </div>
      </div>

      {/* Pair Rule Violation Alert Banner */}
      {hasAttemptedSubmit && !pairCheckResult.isValid && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-500 rounded-3xl flex items-start gap-3 text-rose-900 dark:text-rose-100 text-sm shadow-md animate-pulse">
          <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="block font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
              {language === 'bn' ? '⚠️ সংলগ্ন সিট জেন্ডার নিয়ম লঙ্ঘন:' : 'Gender Rule Violation:'}
            </span>
            <span className="font-bold text-sm block">{pairCheckResult.message}</span>
            <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
              {language === 'bn'
                ? 'পরামর্শ: বিপরীত জেন্ডারের ক্ষেত্রে সাথে রক্তীয় অভিভাবক (বাবা, মা, ভাই, বোন, দাদা, নানা, দাদি, নানি বা স্বামী/স্ত্রী) থাকলে যাত্রীর ধরন "অভিভাবক" (Guardian) নির্বাচন করে সম্পর্ক নিশ্চিত করুন।'
                : 'Tip: For opposite-gender adjacent seating, change one passenger type to Guardian and select an authorized relationship.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Passenger List Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {language === 'bn'
                  ? `যাত্রীদের তথ্য বিবরণী (${passengers.length} জন যাত্রী)`
                  : `Passenger Details (${passengers.length} Passengers)`}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {language === 'bn'
                  ? 'নিচের প্রতিটি সিটের লাল তারকা (*) চিহ্নিত তথ্য নির্ভুলভাবে প্রদান করুন'
                  : 'Provide accurate information for each allocated seat'}
              </p>
            </div>
            <Badge variant="primary" className="font-bold px-3 py-1 text-xs">
              {targetUniversity}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-4 sm:p-6">
          {passengers.map((p, idx) => {
            const seatObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
            const seatLabel = seatObj?.seatNumber || `Seat #${idx + 1}`;
            const suggestion =
              (phoneLookupMatches[p.seatId] || suggestedPassengerMap[p.seatId]) && !dismissedSuggestions[p.seatId]
                ? (phoneLookupMatches[p.seatId] || suggestedPassengerMap[p.seatId])
                : undefined;

            const isNameValid = !!p.passengerName.trim();
            const cleanPhone = (p.passengerPhone || '').replace(/[\s-]/g, '');
            const isPhoneValid = /^01[3-9]\d{8}$/.test(cleanPhone);
            const isGuardianValid =
              p.passengerType === 'STUDENT' || (p.passengerType === 'GUARDIAN' && !!p.guardianRelationship);
            const duplicateSeats = getDuplicateSeatsForPhone(p.seatId, p.passengerPhone);
            const hasDuplicateUnconfirmed =
              cleanPhone.length === 11 && duplicateSeats.length > 0 && confirmedKeepMap[p.seatId] !== cleanPhone;
            const currentPairViolation = getPassengerPairRuleViolation(p, passengers, allCurrentSeats);
            const seatErrors = fieldErrors[p.seatId];

            // Only consider errors that are CURRENTLY valid based on active passenger data
            const hasActiveSeatError =
              hasDuplicateUnconfirmed ||
              (!isNameValid && !!seatErrors?.passengerName) ||
              (!isPhoneValid && !!seatErrors?.passengerPhone) ||
              (!isGuardianValid && !!seatErrors?.guardianRelationship) ||
              (!!p.guardianPhone?.trim() && !isValidBdMobile(p.guardianPhone) && !!seatErrors?.guardianPhone) ||
              (!!currentPairViolation && (!!seatErrors?.pairRuleViolation || hasAttemptedSubmit));

            const isFullyComplete =
              isNameValid &&
              isPhoneValid &&
              isGuardianValid &&
              !hasDuplicateUnconfirmed &&
              !currentPairViolation &&
              !hasActiveSeatError;

            return (
              <div
                key={p.seatId}
                id={`passenger-card-${p.seatId}`}
                suppressHydrationWarning
                className={cn(
                  'p-5 sm:p-6 rounded-3xl border-2 space-y-4 transition-all shadow-sm',
                  hasActiveSeatError
                    ? 'border-rose-400 dark:border-rose-600/80 bg-rose-50/20 dark:bg-rose-950/20 shadow-rose-500/10 ring-2 ring-rose-300 dark:ring-rose-800'
                    : isFullyComplete
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60'
                )}
              >
                {/* Header of each passenger box */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span
                      suppressHydrationWarning
                      className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: currentColor?.primaryHex || 'var(--primary-color)' }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-mono">
                          {language === 'bn' ? `সিট ${seatLabel}` : `Seat ${seatLabel}`}
                        </span>

                        {/* Real-time Status Badge */}
                        {isFullyComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? 'তথ্য সম্পন্ন' : 'Completed'}
                          </span>
                        ) : hasActiveSeatError ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {hasDuplicateUnconfirmed || seatErrors?.duplicatePhone
                              ? (language === 'bn' ? 'নম্বর বহাল/পরিবর্তন নির্ধারণ করুন' : 'Confirm Keep or Change')
                              : !isNameValid && seatErrors?.passengerName
                              ? (language === 'bn' ? 'নাম আবশ্যক' : 'Name Required')
                              : !isPhoneValid && seatErrors?.passengerPhone
                              ? (language === 'bn' ? '১১ ডিজিট মোবাইল ভুল/বাকি' : '11-digit Mobile')
                              : !isGuardianValid && seatErrors?.guardianRelationship
                              ? (language === 'bn' ? 'সম্পর্ক আবশ্যক' : 'Select Relationship')
                              : currentPairViolation
                              ? (language === 'bn' ? 'নিয়ম সংশোধন করুন' : 'Rule Violation')
                              : (language === 'bn' ? 'তথ্য সংশোধন করুন' : 'Fix Information')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {language === 'bn' ? 'তথ্য বাকি' : 'Pending Details'}
                          </span>
                        )}
                      </div>

                      <span className="block text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">
                        {seatObj?.fareZoneName ? `${seatObj.fareZoneName} • ` : ''}
                        {seatObj?.fare ? formatCurrency(seatObj.fare) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Passenger Type & Gender Selectors */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(p.seatId, 'passengerType', 'STUDENT')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                          p.passengerType === 'STUDENT'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'শিক্ষার্থী' : 'Student'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(p.seatId, 'passengerType', 'GUARDIAN')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                          p.passengerType === 'GUARDIAN'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'অভিভাবক' : 'Guardian'}
                      </button>
                    </div>

                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(p.seatId, 'gender', 'FEMALE')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                          p.gender === 'FEMALE'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        ♀ {language === 'bn' ? 'মহিলা' : 'Female'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(p.seatId, 'gender', 'MALE')}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                          p.gender === 'MALE'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        ♂ {language === 'bn' ? 'পুরুষ' : 'Male'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Phone Lookup Match Card */}
                {suggestion && !dismissedSuggestions[p.seatId] && p.passengerName !== suggestion.name && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50 border-2 border-emerald-400/80 dark:border-emerald-700 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 flex-wrap">
                          <span>{language === 'bn' ? '⚡ এই নম্বরে পূর্বের নিবন্ধিত যাত্রী পাওয়া গেছে:' : 'Found saved passenger for this number:'}</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold underline">{suggestion.name}</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">
                          {suggestion.gender === 'FEMALE' ? '♀ মহিলা' : '♂ পুরুষ'} • {suggestion.passengerType === 'GUARDIAN' ? 'অভিভাবক' : 'শিক্ষার্থী'}
                          {suggestion.institution ? ` • ${suggestion.institution}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <Button
                        type="button"
                        size="sm"
                        variant="success"
                        onClick={() => applySuggestion(p.seatId, suggestion)}
                        className="rounded-xl text-xs font-black py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {language === 'bn' ? 'অটোফিল করুন' : 'Autofill Info'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDismissedSuggestions((prev) => ({ ...prev, [p.seatId]: true }))}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={language === 'bn' ? 'বাদ দিন' : 'Dismiss'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Passenger Full Name */}
                  <div className="space-y-1.5">
                    <Input
                      id={`input-name-${p.seatId}`}
                      label={
                        language === 'bn'
                          ? p.passengerType === 'STUDENT'
                            ? 'শিক্ষার্থীর পুরো নাম *'
                            : 'অভিভাবকের পুরো নাম *'
                          : 'Full Name *'
                      }
                      value={p.passengerName}
                      error={!isNameValid ? fieldErrors[p.seatId]?.passengerName : undefined}
                      onChange={(e) => handleFieldChange(p.seatId, 'passengerName', e.target.value)}
                      placeholder={p.passengerType === 'STUDENT' ? 'যেমন: নুসরাত জাহান' : 'যেমন: মোঃ রফিকুল ইসলাম'}
                      required
                      aria-required="true"
                    />
                  </div>

                  {/* Passenger Mobile */}
                  <div className="space-y-1.5">
                    <PhoneInput
                      id={`input-phone-${p.seatId}`}
                      label={language === 'bn' ? 'যাত্রীর মোবাইল নম্বর (১১ ডিজিট) *' : 'Passenger Mobile Number (11-digit) *'}
                      value={p.passengerPhone}
                      error={
                        (!isPhoneValid ? fieldErrors[p.seatId]?.passengerPhone : undefined) ||
                        (hasDuplicateUnconfirmed ? fieldErrors[p.seatId]?.duplicatePhone : undefined)
                      }
                      onChange={(val) => handleFieldChange(p.seatId, 'passengerPhone', val)}
                      required
                      showOperatorBadge
                      showCharacterCount
                    />

                    {/* Real-time Same Exam & Date Multi-Bus Duplicate Phone Validation & Prompt */}
                    {cleanPhone.length === 11 && duplicateSeats.length > 0 && (
                      confirmedKeepMap[p.seatId] === cleanPhone ? (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/70 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-2xs">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {language === 'bn'
                                ? `✓ নম্বর বহাল রাখা হয়েছে (${duplicateSeats.join(', ')})`
                                : `✓ Number retained (${duplicateSeats.join(', ')})`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleChangeNumber(p.seatId)}
                            className="text-xs font-black underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer ml-2 shrink-0"
                          >
                            {language === 'bn' ? 'পরিবর্তন করবেন?' : 'Change?'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/50 border-2 border-amber-400 dark:border-amber-600 rounded-2xl space-y-2.5 shadow-sm animate-fade-in">
                          <div className="flex items-start gap-2.5 text-amber-950 dark:text-amber-100 text-xs sm:text-sm font-bold">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-black text-amber-900 dark:text-amber-200">
                                {language === 'bn'
                                  ? `⚠️ এই তারিখে ${targetUniversity} পরীক্ষার জন্য [${duplicateSeats.join(', ')}]-এ ইতিমধ্যে এই নম্বরে টিকিট রয়েছে!`
                                  : `⚠️ Number already used for [${duplicateSeats.join(', ')}] on this exam date!`}
                              </span>
                              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-0.5 block">
                                {language === 'bn'
                                  ? 'আপনি কি এই নাম্বার বহাল রাখতে নাকি পরিবর্তন করতে চান?'
                                  : 'Do you want to keep this number or change it?'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 pt-0.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleConfirmKeepNumber(p.seatId, cleanPhone)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {language === 'bn' ? 'নম্বর বহাল রাখুন' : 'Keep Number'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeNumber(p.seatId)}
                              className="border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold text-xs py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 bg-white/80 dark:bg-slate-900"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {language === 'bn' ? 'পরিবর্তন করুন' : 'Change Number'}
                            </Button>
                          </div>
                        </div>
                      )
                    )}

                    {/* WhatsApp Status Selector & Instant Notification Indicator */}
                    <div className="pt-1.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
                        <label
                          htmlFor={`wa-toggle-${p.seatId}`}
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            id={`wa-toggle-${p.seatId}`}
                            checked={p.hasWhatsapp !== false && p.phoneType !== 'NORMAL'}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              onUpdatePassenger(p.seatId, {
                                hasWhatsapp: isChecked,
                                phoneType: isChecked ? 'WHATSAPP' : 'NORMAL',
                                whatsappNumber: isChecked ? p.passengerPhone : (p.whatsappNumber || '')
                              });
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-emerald-600"
                          />
                          <div className="flex items-center gap-2">
                            <WhatsAppLogo className="w-5 h-5 shrink-0 shadow-2xs" />
                            <span className="font-extrabold text-xs">
                              {language === 'bn' ? 'এই নম্বরে WhatsApp আছে' : 'This is a WhatsApp number'}
                            </span>
                          </div>
                        </label>

                        {p.hasWhatsapp !== false && p.phoneType !== 'NORMAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-fade-in shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {language === 'bn' ? 'টিকিট WhatsApp এ যাবে' : 'Ticket via WhatsApp'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                            {language === 'bn' ? 'সাধারণ কল নম্বর' : 'Call / SMS only'}
                          </span>
                        )}
                      </div>

                      {/* Optional Alternate WhatsApp Number if main phone does not have WhatsApp */}
                      {(p.hasWhatsapp === false || p.phoneType === 'NORMAL') && (
                        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5 animate-fade-in">
                          <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200">
                            {language === 'bn'
                              ? 'বিকল্প WhatsApp নম্বর (টিকিট ও নোটিফিকেশন পাঠানোর জন্য ঐচ্ছিক):'
                              : 'Alternate WhatsApp Number for Ticket (Optional):'}
                          </label>
                          <PhoneInput
                            id={`input-alt-wa-${p.seatId}`}
                            label=""
                            placeholder="01XXXXXXXXX"
                            value={p.whatsappNumber || ''}
                            onChange={(val) => onUpdatePassenger(p.seatId, { whatsappNumber: val })}
                            showOperatorBadge={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency / Guardian Phone */}
                  <div className="space-y-1.5">
                    <PhoneInput
                      id={`input-emergency-phone-${p.seatId}`}
                      label={language === 'bn' ? 'জরুরি যোগাযোগ নম্বর (ঐচ্ছিক)' : 'Emergency Contact Phone (Optional)'}
                      value={p.guardianPhone || ''}
                      error={
                        p.guardianPhone?.trim() && !isValidBdMobile(p.guardianPhone)
                          ? fieldErrors[p.seatId]?.guardianPhone
                          : undefined
                      }
                      onChange={(val) => handleFieldChange(p.seatId, 'guardianPhone', val)}
                      placeholder="01XXXXXXXXX"
                      showOperatorBadge
                      showCharacterCount
                    />

                    {p.guardianPhone && p.guardianPhone.trim().length >= 10 && (
                      <div className="pt-1">
                        <label
                          htmlFor={`wa-toggle-guardian-${p.seatId}`}
                          className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
                        >
                          <input
                            type="checkbox"
                            id={`wa-toggle-guardian-${p.seatId}`}
                            checked={p.guardianHasWhatsapp !== false && p.guardianPhoneType !== 'NORMAL'}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              onUpdatePassenger(p.seatId, {
                                guardianHasWhatsapp: isChecked,
                                guardianPhoneType: isChecked ? 'WHATSAPP' : 'NORMAL'
                              });
                            }}
                            className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-emerald-600"
                          />
                          <span>
                            {language === 'bn' ? 'অভিভাবকের এই নম্বরেও WhatsApp আছে' : 'Guardian also has WhatsApp on this number'}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Guardian Relationship Dropdown */}
                  {p.passengerType === 'GUARDIAN' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`select-rel-${p.seatId}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {language === 'bn' ? 'শিক্ষার্থীর সাথে রক্তের সম্পর্ক *' : 'Relationship with Student *'}
                        </label>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          {language === 'bn' ? 'অনুমোদিত পরিবারভুক্ত' : 'Authorized Family'}
                        </span>
                      </div>
                      <select
                        id={`select-rel-${p.seatId}`}
                        value={p.guardianRelationship || ''}
                        onChange={(e) => handleFieldChange(p.seatId, 'guardianRelationship', e.target.value as any)}
                        className={cn(
                          'w-full px-3.5 py-2 text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white border rounded-xl shadow-2xs focus:ring-2 focus:outline-none cursor-pointer transition-colors',
                          !isGuardianValid && fieldErrors[p.seatId]?.guardianRelationship
                            ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500 text-rose-700 dark:text-rose-300'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                        )}
                        required
                      >
                        <option value="">{language === 'bn' ? '-- সম্পর্ক নির্বাচন করুন * --' : '-- Select Relationship * --'}</option>
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {language === 'bn' ? r.labelBn : r.labelEn}
                          </option>
                        ))}
                      </select>
                      {!isGuardianValid && fieldErrors[p.seatId]?.guardianRelationship && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          {fieldErrors[p.seatId]?.guardianRelationship}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'টার্গেট প্রতিষ্ঠান / ইউনিট (ঐচ্ছিক)' : 'Target Institution / Unit (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={p.institution || ''}
                        onChange={(e) => handleFieldChange(p.seatId, 'institution', e.target.value)}
                        placeholder={`${targetUniversity} (ভর্তি পরীক্ষার্থী)`}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Per-seat Pair Rule Warning Indicator */}
                {currentPairViolation && (fieldErrors[p.seatId]?.pairRuleViolation || hasAttemptedSubmit) && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold">
                    <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{fieldErrors[p.seatId]?.pairRuleViolation || currentPairViolation}</span>
                  </div>
                )}
              </div>
            );
          })}

          {passengers.length === 0 && (
            <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {language === 'bn' ? 'কোনো সিট নির্বাচন করা হয়নি — আগের ধাপে ফিরে সিট বেছে নিন।' : 'No seats selected — go back and pick seats first.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prominent Inline Step Error Alert (Always right above Continue button) */}
      {(stepError || errorMessage) && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-400 dark:border-rose-600 rounded-2xl flex items-start justify-between gap-3 text-rose-900 dark:text-rose-100 text-sm shadow-md animate-pulse">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                {language === 'bn' ? '⚠️ তথ্য অসম্পূর্ণ বা ত্রুটি রয়েছে:' : 'Validation Error:'}
              </span>
              <span className="font-bold text-sm mt-0.5 block">{stepError || errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              onSetErrorMessage(null);
            }}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 font-black text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Buttons - Cleanly Spaced */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-14 mr-0 sm:mr-32">
        <Button variant="outline" onClick={onGoBack} className="w-full sm:w-auto rounded-2xl px-6 py-3 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'পেছনে যান (সিট নির্বাচন)' : 'Back to Seat Selection'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={passengers.length === 0}
          onClick={handleValidateAndContinue}
          className="w-full sm:w-auto font-black rounded-2xl shadow-lg shadow-blue-500/25 px-8 text-sm sm:text-base py-3.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        >
          {language === 'bn' ? 'বোর্ডিং ও প্যাকেজ ধাপে যান' : 'Continue to Boarding & Hotel'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
