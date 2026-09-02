'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency, cleanAndLimitPhoneNumber, generateReceiptNumber } from '@/lib/utils';
import { createBookingAction } from '@/actions/booking.actions';
import { PaymentReceiptModal } from './payment-receipt';
import {
  calculateDynamicAdjacentSeatLocks,
  validateMultiSeatBookingPairRules,
  getAdjacentSeatNumber
} from '@/services/rules.service';
import { validateAndCalculateCoupon } from '@/services/coupon.service';
import { recordPassengerInDirectory, lookupPassengerByPhone } from '@/services/passenger-directory.service';
import { useApp } from '@/lib/context';
import { Armchair, AlertCircle, Shield } from 'lucide-react';
import { StepIndicator, BookingSummaryBar, BOOKING_STEPS } from './step-indicator';
import { TripSelectionStep } from './trip-selection-step';
import { SeatSelectionStep } from './seat-selection-step';
import { PassengerDetailsStep, PassengerInput } from './passenger-details-step';
import { BoardingAndPackageStep, JourneyType } from './boarding-and-package-step';
import { FareAndPaymentStep, PaymentMethod, SenderSourceType, AppliedCoupon, DiscountState } from './fare-and-payment-step';

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
}

interface Props {
  trips: any[];
  currentUser?: any;
  savedLayouts?: any[];
  fareZones?: any[];
}

const universityPresets: { id: string; name: string; defaultLayoutName: string; capacity: number; segments: FareRangeSegment[] }[] = [
  {
    id: 'RU',
    name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    defaultLayoutName: 'রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)',
    capacity: 45,
    segments: [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' },
      { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' },
      { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' }
    ]
  },
  {
    id: 'CU',
    name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
    defaultLayoutName: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU) নাইট কোচ - ৪৫ সিট (৳৭০০/৳৬০০)',
    capacity: 45,
    segments: [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 600, color: 'blue' },
      { id: 'seg-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 550, color: 'purple' }
    ]
  },
  {
    id: 'DU',
    name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
    defaultLayoutName: 'ঢাকা বিশ্ববিদ্যালয় (DU) ডে এক্সপ্রেস - ৪০ সিট (৳৫০০)',
    capacity: 40,
    segments: [
      { id: 'seg-1', name: 'Front Seats (A–D)', startRow: 'A', endRow: 'D', fare: 500, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Seats (E–J)', startRow: 'E', endRow: 'J', fare: 450, color: 'blue' }
    ]
  },
  {
    id: 'GST',
    name: 'জিএসটি গুচ্ছ (GST Cluster)',
    defaultLayoutName: 'জিএসটি গুচ্ছ (GST) স্পেশাল - ৪৫ সিট (৳৬০০/৳৫০০)',
    capacity: 45,
    segments: [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 600, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 500, color: 'blue' }
    ]
  },
  {
    id: 'JU',
    name: 'জাহাঙ্গীরনগর (JU)',
    defaultLayoutName: 'জাহাঙ্গীরনগর (JU) শাটল বাস - ৩৬ সিট (৳৩৫০)',
    capacity: 36,
    segments: [
      { id: 'seg-1', name: 'All Seats (A–I)', startRow: 'A', endRow: 'I', fare: 350, color: 'blue' }
    ]
  },
  {
    id: 'KUET',
    name: 'কুয়েট খুলনা (KUET)',
    defaultLayoutName: 'কুয়েট এক্সপ্রেস (KUET) - ৪৫ সিট (৳৬৫০/৳৫৫০)',
    capacity: 45,
    segments: [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' }
    ]
  },
  {
    id: 'SUST',
    name: 'সাস্ট সিলেট (SUST)',
    defaultLayoutName: 'সাস্ট সিলেট (SUST) এক্সপ্রেস - ৪৫ সিট (৳৭০০/৳৬০০)',
    capacity: 45,
    segments: [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' },
      { id: 'seg-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 600, color: 'blue' }
    ]
  }
];

export function BookingWizard({ trips: initialTrips, currentUser, savedLayouts = [], fareZones = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, currentColor, customLogos } = useApp();

  const rowLetters = 'ABCDEFGHIJKLMN';
  const trips = initialTrips && initialTrips.length > 0 ? initialTrips : [];

  const initialTripId = searchParams.get('tripId') || trips[0]?.id || '';
  const initialSeatId = searchParams.get('seatId') || '';

  // ── Step state ──────────────────────────────────────────────
  const [step, setStep] = useState<number>(initialTripId && initialSeatId ? 2 : 1);
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId);
  const [targetUniversity, setTargetUniversity] = useState<string>(universityPresets[0].name);
  const [activeCapacity, setActiveCapacity] = useState<number>(45);
  const [activeSegments, setActiveSegments] = useState<FareRangeSegment[]>(universityPresets[0].segments);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [extraSeats, setExtraSeats] = useState<any[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeatId ? [initialSeatId] : []);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [suggestedPassengerMap, setSuggestedPassengerMap] = useState<Record<string, any>>({});

  const [journeyType, setJourneyType] = useState<JourneyType>('ROUND_TRIP');
  const [boardingPoint, setBoardingPoint] = useState<string>('গাবতলী বাস টার্মিনাল');
  const [droppingPoint, setDroppingPoint] = useState<string>('বিশ্ববিদ্যালয় মেইন গেট');
  const [seatLegs, setSeatLegs] = useState<Record<string, 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY'>>({});

  const [discountState, setDiscountState] = useState<DiscountState>({
    isDiscountApplied: false,
    discountType: 'FIXED',
    discountRate: 0,
    discountReference: '',
    discountReason: ''
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [isStaffCouponModalOpen, setIsStaffCouponModalOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [senderSourceType, setSenderSourceType] = useState<SenderSourceType>('MFS_WALLET');
  const [selectedBankName, setSelectedBankName] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderRef, setSenderRef] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [confirmedBookingForReceipt, setConfirmedBookingForReceipt] = useState<any | null>(null);

  const [genderWarningModal, setGenderWarningModal] = useState<{ isOpen: boolean; seatNumber: string; adjacentSeatNumber?: string; title: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  // ── Layout auto-detection from trip ─────────────────────────
  useEffect(() => {
    if (!selectedTrip) return;
    const dest = (selectedTrip.route?.destination || selectedTrip.route?.routeName || selectedTrip.bus?.busName || selectedTrip.bus?.targetUniversity || '').toLowerCase();

    let matchedPreset = universityPresets[0];
    if (dest.includes('rajshahi') || dest.includes('ru')) matchedPreset = universityPresets.find((u) => u.id === 'RU') || universityPresets[0];
    else if (dest.includes('chittagong') || dest.includes('cu')) matchedPreset = universityPresets.find((u) => u.id === 'CU') || universityPresets[1];
    else if (dest.includes('dhaka') || dest.includes('du')) matchedPreset = universityPresets.find((u) => u.id === 'DU') || universityPresets[2];
    else if (dest.includes('gst') || dest.includes('cluster') || dest.includes('গুচ্ছ')) matchedPreset = universityPresets.find((u) => u.id === 'GST') || universityPresets[3];
    else if (dest.includes('jahangirnagar') || dest.includes('ju')) matchedPreset = universityPresets.find((u) => u.id === 'JU') || universityPresets[4];
    else if (dest.includes('kuet') || dest.includes('khulna')) matchedPreset = universityPresets.find((u) => u.id === 'KUET') || universityPresets[5];
    else if (dest.includes('sust') || dest.includes('sylhet')) matchedPreset = universityPresets.find((u) => u.id === 'SUST') || universityPresets[6];

    setTargetUniversity(matchedPreset.name);
    setActiveCapacity(matchedPreset.capacity);
    setActiveSegments(matchedPreset.segments);
  }, [selectedTripId]);

  // ── Seat inventory fetch ────────────────────────────────────
  const getSegmentForRow = useCallback(
    (rowChar: string, currentSegments = activeSegments): FareRangeSegment | undefined => {
      if (!rowChar || typeof rowChar !== 'string') return undefined;
      return currentSegments.find((seg) => {
        if (!seg?.startRow || !seg?.endRow) return false;
        const startIdx = rowLetters.indexOf(seg.startRow.toUpperCase());
        const endIdx = rowLetters.indexOf(seg.endRow.toUpperCase());
        const curIdx = rowLetters.indexOf(rowChar.toUpperCase());
        return curIdx >= startIdx && curIdx <= endIdx;
      });
    },
    [activeSegments]
  );

  const parseSeatPosition = useCallback(
    (seat: any, totalRowsCount: number) => {
      if (!seat) return { rowIndex: 0, colIndex: 0, isExtra: false };
      const numStr = (seat?.seatNumber || seat?.seat_number || seat?.label || seat?.seatId || seat?.id || '').toString().trim().toUpperCase();

      if (numStr.startsWith('EX') || seat?.isExtra || seat?.seatType === 'EXTRA') {
        return { rowIndex: 999, colIndex: seat?.colIndex ?? 0, isExtra: true };
      }

      const match = numStr.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const rowChar = match[1];
        const colDigit = parseInt(match[2], 10);
        const rIdx = rowLetters.indexOf(rowChar);
        if (rIdx >= 0) {
          if (rIdx === totalRowsCount - 1 && (totalRowsCount === 11 || activeCapacity === 45 || activeCapacity === 42)) {
            if (colDigit >= 1 && colDigit <= 5) return { rowIndex: rIdx, colIndex: colDigit - 1, isExtra: false };
          }
          if (colDigit === 1) return { rowIndex: rIdx, colIndex: 0, isExtra: false };
          if (colDigit === 2) return { rowIndex: rIdx, colIndex: 1, isExtra: false };
          if (colDigit === 3) return { rowIndex: rIdx, colIndex: 3, isExtra: false };
          if (colDigit === 4) return { rowIndex: rIdx, colIndex: 4, isExtra: false };
          if (colDigit === 5) return { rowIndex: rIdx, colIndex: 4, isExtra: false };
        }
      }
      let r = seat.rowIndex ?? seat.row ?? 0;
      const c = seat.colIndex ?? seat.col ?? 0;
      if (r >= 1 && seat.rowIndex === undefined) r = r - 1;
      return { rowIndex: r, colIndex: c, isExtra: false };
    },
    [activeCapacity, rowLetters]
  );

  useEffect(() => {
    if (!selectedTripId) {
      setTripSeats([]);
      return;
    }

    const currentTrip = trips.find((t) => t.id === selectedTripId);
    const busCap = currentTrip?.bus?.capacity || activeCapacity || 45;
    const expectedRows = busCap === 45 ? 11 : busCap === 40 ? 10 : Math.ceil(busCap / 4);

    const generateFallbackSeats = () => {
      const generatedSeats: any[] = [];
      let counter = 0;
      for (let r = 0; r < expectedRows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const isLast5 = (busCap === 45 || busCap === 42) && r === expectedRows - 1;
        const rowCols = isLast5 ? 5 : 4;
        const matchingSeg = getSegmentForRow(rowChar);
        const seatFare = matchingSeg?.fare || (r < 4 ? 650 : r < 7 ? 550 : 500);
        for (let c = 0; c < rowCols; c++) {
          if (counter >= busCap) break;
          const seatNum = `${rowChar}${c + 1}`;
          generatedSeats.push({
            seatId: `seat-${selectedTripId}-${seatNum}`,
            seatNumber: seatNum,
            rowIndex: r,
            colIndex: c,
            seatType: r < 2 ? 'VIP' : 'STANDARD',
            genderAllowed: 'ANY',
            fare: seatFare,
            fareZoneName: matchingSeg?.name || (r < 4 ? 'VIP Front' : 'Standard'),
            status: 'AVAILABLE',
            isExtra: false
          });
          counter++;
        }
      }
      return generatedSeats;
    };

    setIsLoadingSeats(true);
    fetch(`/api/backend/inventory/${selectedTripId}/seat-map`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.seats && Array.isArray(data.seats) && data.seats.length > 0) {
          const normalized = data.seats.map((s: any, idx: number) => {
            const rawNumber = (s.seatNumber || s.seat_number || s.label || s.seatId || `S${idx + 1}`).toString().trim();
            const cleanSeatNumber = rawNumber.toUpperCase();
            const pos = parseSeatPosition({ ...s, seatNumber: cleanSeatNumber }, expectedRows);
            const rowChar = rowLetters[pos.rowIndex] || 'A';
            const matchingSeg = getSegmentForRow(rowChar);
            const finalSeatId = s.seatId || s.seat_id || s.id || `seat-${selectedTripId}-${cleanSeatNumber}-${idx}`;
            return {
              ...s,
              seatId: finalSeatId,
              seatNumber: cleanSeatNumber,
              rowIndex: pos.rowIndex,
              colIndex: pos.colIndex,
              fare: Number(s.fare) || matchingSeg?.fare || (pos.rowIndex < 5 ? 650 : pos.rowIndex < 8 ? 550 : 500),
              isExtra: pos.isExtra,
              status: (s.status || 'AVAILABLE').toUpperCase()
            };
          });
          setTripSeats(normalized);
        } else {
          setTripSeats(generateFallbackSeats());
        }
      })
      .catch(() => {
        setTripSeats(generateFallbackSeats());
      })
      .finally(() => setIsLoadingSeats(false));
  }, [selectedTripId, activeCapacity, activeSegments, getSegmentForRow, parseSeatPosition, trips, rowLetters]);

  // ── Passenger list sync with selected seats ────────────────
  useEffect(() => {
    const newPassengerList: PassengerInput[] = selectedSeatIds.map((seatId) => {
      const existing = passengers.find((p) => p.seatId === seatId);
      if (existing) return existing;
      return {
        passengerName: '',
        passengerPhone: '',
        phoneType: 'WHATSAPP',
        passengerType: 'STUDENT',
        gender: 'FEMALE',
        seatId,
        admissionId: '',
        institution: `${targetUniversity} (Admission Candidate)`,
        guardianPhone: '',
        guardianPhoneType: 'WHATSAPP',
        guardianRelationship: undefined
      };
    });
    setPassengers(newPassengerList);
  }, [selectedSeatIds, targetUniversity]);

  const allCurrentSeats = useMemo(() => [...tripSeats, ...extraSeats], [tripSeats, extraSeats]);

  const dynamicAdjacentLocks = useMemo(() => calculateDynamicAdjacentSeatLocks(allCurrentSeats), [allCurrentSeats]);

  // ── Financial calculations ──────────────────────────────────
  const hasHotelPackageOption = useMemo(() => {
    const notes = selectedTrip?.bus?.notes || selectedTrip?.notes || '';
    return !!selectedTrip?.hotelPackage || notes.includes('HOTEL PACKAGE:');
  }, [selectedTrip]);

  const [includeHotelPackage, setIncludeHotelPackage] = useState<boolean>(true);
  const [hotelFeePerPerson, setHotelFeePerPerson] = useState<number>(1200);
  const [hotelPackageDetails, setHotelPackageDetails] = useState<string>('হোটেল রয়েল রাজ (রাজশাহী - ২ দিন ১ রাত)');

  const calculatedBaseGross = selectedSeatIds.reduce((sum, sId) => {
    const seatObj = allCurrentSeats.find((s) => s.seatId === sId);
    const baseFare = seatObj?.fare || selectedTrip?.basePrice || 550;
    if (journeyType === 'ROUND_TRIP') return sum + baseFare;
    if (journeyType === 'OUTBOUND_ONLY' || journeyType === 'RETURN_ONLY') return sum + Math.round(baseFare * 0.5);
    const leg = seatLegs[sId] || 'ROUND_TRIP';
    return sum + (leg === 'ROUND_TRIP' ? baseFare : Math.round(baseFare * 0.5));
  }, 0);

  const hotelTotalAddon = hasHotelPackageOption && includeHotelPackage ? selectedSeatIds.length * hotelFeePerPerson : 0;
  const grossAmount = calculatedBaseGross + hotelTotalAddon;

  const discountAmount = discountState.isDiscountApplied
    ? discountState.discountType === 'PERCENTAGE'
      ? Math.round((grossAmount * discountState.discountRate) / 100)
      : Math.min(discountState.discountRate, grossAmount)
    : 0;

  const netAmount = Math.max(0, grossAmount - discountAmount);
  const dueAmount = Math.max(0, netAmount - paidAmount);

  useEffect(() => {
    if (step === 5 && paidAmount === 0) {
      setPaidAmount(netAmount);
    }
  }, [step, netAmount, paidAmount]);

  // ── Seat selection toggle ───────────────────────────────────
  const toggleSeatSelection = useCallback(
    (seatId: string, status: string) => {
      if (status !== 'AVAILABLE') return;
      setErrorMessage(null);

      const sObj = allCurrentSeats.find((s) => s.seatId === seatId);
      const seatNum = (sObj?.seatNumber || (sObj as any)?.seat_number || (sObj as any)?.label || '').trim().toUpperCase();
      const dynamicLock = seatNum ? dynamicAdjacentLocks.get(seatNum) : undefined;

      if (dynamicLock) {
        if (dynamicLock.genderAllowed === 'FEMALE_ONLY') {
          setErrorMessage(language === 'bn' ? `ℹ️ সতর্কতা: সিট ${seatNum} নারী সংরক্ষিত (সংলগ্ন সিটটি একজন নারী শিক্ষার্থী বুক করেছেন)।` : `Notice: Seat ${seatNum} is female-protected due to adjacent female passenger.`);
        } else if (dynamicLock.genderAllowed === 'MALE_ONLY') {
          setErrorMessage(language === 'bn' ? `ℹ️ সতর্কতা: সিট ${seatNum} পুরুষ সংরক্ষিত (সংলগ্ন সিটটি একজন পুরুষ যাত্রী বুক করেছেন)।` : `Notice: Seat ${seatNum} is male-protected due to adjacent male passenger.`);
        }
      }

      if (selectedSeatIds.includes(seatId)) {
        setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
      } else {
        setSelectedSeatIds((prev) => [...prev, seatId]);
      }
    },
    [allCurrentSeats, dynamicAdjacentLocks, language, selectedSeatIds]
  );

  const handleAddExtraSeat = useCallback(() => {
    const nextIdx = extraSeats.length + 1;
    const newExtra = {
      seatId: `seat-${selectedTrip?.id || 'trip'}-EX-${nextIdx}`,
      seatNumber: `EX-${nextIdx}`,
      rowIndex: 999,
      colIndex: nextIdx,
      seatType: 'EXTRA',
      genderAllowed: 'ANY',
      fare: 450,
      fareZoneName: 'Extra Seat',
      status: 'AVAILABLE',
      isExtra: true
    };
    setExtraSeats((prev) => [...prev, newExtra]);
  }, [extraSeats.length, selectedTrip?.id]);

  const handleRemoveExtraSeat = useCallback((seatId: string) => {
    setExtraSeats((prev) => prev.filter((s) => s.seatId !== seatId));
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
  }, []);

  // ── Passenger update with gender rules ──────────────────────
  const handleUpdatePassenger = useCallback(
    (seatId: string, updates: Partial<PassengerInput>) => {
      setErrorMessage(null);

      const seatObj = allCurrentSeats.find((s) => s.seatId === seatId);
      const seatNum = (seatObj?.seatNumber || (seatObj as any)?.seat_number || (seatObj as any)?.label || '').trim().toUpperCase();
      const targetPassenger = passengers.find((p) => p.seatId === seatId);
      const effectiveType = updates.passengerType ?? targetPassenger?.passengerType ?? 'STUDENT';
      const effectiveGender = updates.gender ?? targetPassenger?.gender ?? 'FEMALE';
      const isFemaleDesignated = seatObj?.genderAllowed === 'FEMALE_ONLY';

      // 1. Strict validation if user tries to set MALE for a seat
      if (updates.gender === 'MALE' && seatNum) {
        const dynamicLock = dynamicAdjacentLocks.get(seatNum);
        const adjacentNum = getAdjacentSeatNumber(seatNum);

        const adjacentCoPassenger = adjacentNum
          ? passengers.find((p) => {
              const pObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
              const pSeatNum = (pObj?.seatNumber || (pObj as any)?.seat_number || (pObj as any)?.label || '').trim().toUpperCase();
              return pSeatNum === adjacentNum;
            })
          : null;

        const isFemaleBus = selectedTrip?.tripBusType === 'FEMALE' || selectedTrip?.bus?.busType === 'FEMALE';

        if (isFemaleBus && effectiveType === 'STUDENT') {
          const warning = {
            isOpen: true,
            seatNumber: seatNum,
            adjacentSeatNumber: adjacentNum || '',
            title: language === 'bn' ? '⚠️ নারী বিশেষ বাসে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Female Bus Restriction',
            message: language === 'bn'
              ? `এই বাসটি (${selectedTrip?.bus?.busName || 'ফিমেল স্পেশাল'}) শুধুমাত্র নারী শিক্ষার্থীদের জন্য নির্ধারিত। কোনো পুরুষ শিক্ষার্থী এই বাসে সিট নিতে পারবেন না!`
              : 'This is a female-only bus. Male students are strictly prohibited!'
          };
          setGenderWarningModal(warning);
          setErrorMessage(warning.message);
          updates.gender = 'FEMALE';
        } else if (adjacentCoPassenger && (adjacentCoPassenger.gender === 'FEMALE' || !adjacentCoPassenger.gender) && effectiveType === 'STUDENT' && (adjacentCoPassenger.passengerType === 'STUDENT' || !adjacentCoPassenger.passengerType)) {
          const warning = {
            isOpen: true,
            seatNumber: seatNum,
            adjacentSeatNumber: adjacentNum || '',
            title: language === 'bn' ? '⚠️ নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Student Gender Restriction',
            message: language === 'bn'
              ? `সিট ${seatNum} এবং ${adjacentNum} উভয়ই সাধারণ শিক্ষার্থী। কোনো নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী বসতে পারবে না। সাথে অভিভাবক (বাবা/ভাই/মা/স্বামী) থাকলে যাত্রীর ধরন "অভিভাবক" (Guardian) নির্বাচন করুন।`
              : `Seats ${seatNum} and ${adjacentNum} are both students. A male student cannot sit next to a female student unless travelling as a legal guardian!`
          };
          setGenderWarningModal(warning);
          setErrorMessage(warning.message);
          updates.gender = 'FEMALE';
        } else if (isFemaleDesignated && effectiveType === 'STUDENT') {
          const warning = {
            isOpen: true,
            seatNumber: seatNum,
            adjacentSeatNumber: adjacentNum || '',
            title: language === 'bn' ? '⚠️ নারী সংরক্ষিত সিটে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Female Reserved Seat Restriction',
            message: language === 'bn'
              ? `সিট ${seatNum} শুধুমাত্র নারী শিক্ষার্থীদের জন্য সংরক্ষিত। সাধারণ শিক্ষার্থীদের ক্ষেত্রে কোনো পুরুষ শিক্ষার্থী এখানে সিট নিতে পারবেন না!`
              : `Seat ${seatNum} is strictly reserved for female students. Male students cannot select this seat!`
          };
          setGenderWarningModal(warning);
          setErrorMessage(warning.message);
          updates.gender = 'FEMALE';
        } else if (dynamicLock?.genderAllowed === 'FEMALE_ONLY') {
          const isPairInSameCart = passengers.some((p) => {
            const pObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
            return (pObj?.seatNumber || (pObj as any)?.seat_number || '').trim().toUpperCase() === dynamicLock.adjacentBookedSeat;
          });
          if (!isPairInSameCart) {
            const warning = {
              isOpen: true,
              seatNumber: seatNum,
              adjacentSeatNumber: dynamicLock.adjacentBookedSeat,
              title: language === 'bn' ? '⚠️ নারী সংরক্ষিত সিটে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Female Protected Seat Restriction',
              message: language === 'bn'
                ? `সিট ${seatNum}-এর পাশের সিটটি (${dynamicLock.adjacentBookedSeat}) একজন নারী শিক্ষার্থী আগে থেকেই বুক করে রেখেছেন। অন্য কোনো পুরুষ শিক্ষার্থী এই সিট নিতে পারবেন না!`
                : `Seat ${seatNum} is adjacent to an already booked female student (${dynamicLock.adjacentBookedSeat}). Male students cannot select this seat!`
            };
            setGenderWarningModal(warning);
            setErrorMessage(warning.message);
            updates.gender = 'FEMALE';
          }
        }
      }

      // 2. Strict validation if passengerType is changed back to STUDENT while sitting next to female student
      if (updates.passengerType === 'STUDENT' && effectiveGender === 'MALE' && seatNum) {
        const adjacentNum = getAdjacentSeatNumber(seatNum);
        if (adjacentNum) {
          const adjacentCoPassenger = passengers.find((p) => {
            const pObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
            return (pObj?.seatNumber || (pObj as any)?.seat_number || '').trim().toUpperCase() === adjacentNum;
          });
          if (adjacentCoPassenger && (adjacentCoPassenger.gender === 'FEMALE' || !adjacentCoPassenger.gender)) {
            const warning = {
              isOpen: true,
              seatNumber: seatNum,
              adjacentSeatNumber: adjacentNum,
              title: language === 'bn' ? '⚠️ নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Student Gender Restriction',
              message: language === 'bn'
                ? `সিট ${seatNum} এবং ${adjacentNum} উভয়ই সাধারণ শিক্ষার্থী। নারী শিক্ষার্থীর পাশে কোনো পুরুষ শিক্ষার্থী বসতে পারবে না।`
                : `Both seats are students. A male student cannot sit next to a female student!`
            };
            setGenderWarningModal(warning);
            setErrorMessage(warning.message);
            updates.passengerType = 'GUARDIAN';
          }
        }
      }

      // Phone suggestion lookup
      if (updates.passengerPhone !== undefined) {
        updates.passengerPhone = cleanAndLimitPhoneNumber(updates.passengerPhone);
        const cleanPhone = updates.passengerPhone;
        if (cleanPhone.length >= 6) {
          const found = lookupPassengerByPhone(cleanPhone);
          if (found && (!targetPassenger?.passengerName || targetPassenger.passengerName !== found.name)) {
            setSuggestedPassengerMap((prev) => ({ ...prev, [seatId]: found }));
          } else {
            setSuggestedPassengerMap((prev) => {
              const next = { ...prev };
              delete next[seatId];
              return next;
            });
          }
        } else {
          setSuggestedPassengerMap((prev) => {
            const next = { ...prev };
            delete next[seatId];
            return next;
          });
        }
      }

      if (updates.guardianPhone !== undefined) {
        updates.guardianPhone = cleanAndLimitPhoneNumber(updates.guardianPhone);
      }

      setPassengers((prev) => {
        const updatedList = prev.map((p) => (p.seatId === seatId ? { ...p, ...updates } : p));

        if (updates.gender || updates.passengerType || updates.guardianRelationship) {
          const pairCheck = validateMultiSeatBookingPairRules(updatedList, allCurrentSeats);
          if (!pairCheck.isValid) {
            setErrorMessage(pairCheck.message || 'Gender rule violation.');
          }
        }
        return updatedList;
      });
    },
    [allCurrentSeats, dynamicAdjacentLocks, language, passengers, selectedTrip]
  );

  // ── Coupon handlers ─────────────────────────────────────────
  const handleApplyCoupon = async (code: string) => {
    setCouponMessage(null);
    setCouponApplying(true);
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setCouponMessage(language === 'bn' ? 'অনুগ্রহ করে কুপন কোড লিখুন।' : 'Please enter a coupon code.');
      setCouponApplying(false);
      return;
    }

    const result = await validateAndCalculateCoupon(cleanCode, grossAmount, targetUniversity);
    if (result.isValid) {
      setDiscountState((prev) => ({ ...prev, isDiscountApplied: true, discountType: result.discountType, discountRate: result.discountRate, discountReference: `Coupon: ${cleanCode}` }));
      setAppliedCoupon({ code: cleanCode, discountType: result.discountType, rate: result.discountRate, label: result.discountType === 'FIXED' ? `৳${result.discountRate} ছাড়` : `${result.discountRate}% ছাড়` });
      setCouponMessage(result.message);
    } else {
      setCouponMessage(result.message);
    }
    setCouponApplying(false);
  };

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponMessage(null);
    setDiscountState((prev) => ({ ...prev, isDiscountApplied: false, discountRate: 0, discountReference: '' }));
  }, []);

  const handleStaffCouponApply = async (code: string) => {
    setCouponMessage(null);
    setCouponApplying(true);
    const res = await validateAndCalculateCoupon(code, grossAmount, targetUniversity);
    if (res.isValid) {
      setDiscountState((prev) => ({ ...prev, isDiscountApplied: true, discountType: res.discountType, discountRate: res.discountRate, discountReference: `Coupon: ${code}` }));
      setAppliedCoupon({ code, discountType: res.discountType, rate: res.discountRate, label: res.discountType === 'FIXED' ? `৳${res.discountRate} ছাড়` : `${res.discountRate}% ছাড়` });
    }
    setCouponMessage(res.message);
    setCouponApplying(false);
  };

  // ── Final submit ────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const sLabel = allCurrentSeats.find((s) => s.seatId === p.seatId)?.seatNumber || `সিট #${i + 1}`;

      if (!p.passengerName.trim()) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর যাত্রীর পূর্ণ নাম আবশ্যক।` : `Passenger name for Seat ${sLabel} is required.`);
        setIsSubmitting(false);
        return;
      }

      const cleanPhone = p.passengerPhone.replace(/[\s-]/g, '');
      if (!cleanPhone) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর আবশ্যক।` : `Passenger mobile for Seat ${sLabel} is required.`);
        setIsSubmitting(false);
        return;
      }

      if (!bdPhoneRegex.test(cleanPhone)) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর (${p.passengerPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।` : `Invalid 11-digit Bangladeshi mobile number for Seat ${sLabel}.`);
        setIsSubmitting(false);
        return;
      }

      if (p.guardianPhone && p.guardianPhone.trim()) {
        const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
        if (!bdPhoneRegex.test(cleanGPhone)) {
          setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর অভিভাবকের মোবাইল নম্বর (${p.guardianPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক নম্বর লিখুন।` : `Invalid 11-digit guardian phone number for Seat ${sLabel}.`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    const pairValidation = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
    if (!pairValidation.isValid) {
      setErrorMessage(pairValidation.message || 'Gender or Guardian validation failed.');
      setIsSubmitting(false);
      return;
    }

    if (discountState.isDiscountApplied && discountAmount > 0 && !discountState.discountReference.trim()) {
      setErrorMessage(language === 'bn' ? 'টিকিটের মূল্য ছাড় দেওয়ার জন্য রেফারেন্স বা অনুমোদনকারীর নাম আবশ্যক।' : 'Reference or authorizer name is required when applying a discount.');
      setIsSubmitting(false);
      return;
    }

    if (!senderRef.trim()) {
      if (senderSourceType === 'MFS_WALLET') {
        setErrorMessage(language === 'bn' ? 'প্রেরক বিকাশ/নগদ মোবাইল নম্বর (১১ ডিজিট) আবশ্যক।' : 'Sender mobile number is required.');
      } else if (senderSourceType === 'BANK_TO_MFS') {
        setErrorMessage(language === 'bn' ? 'ব্যাংক থেকে বিকাশ বা ব্যাংক ট্রান্সফারের ক্ষেত্রে ব্যাংক ও অ্যাকাউন্ট/রেফারেন্স নম্বর আবশ্যক।' : 'Bank sender account or reference is required.');
      } else {
        setErrorMessage(language === 'bn' ? 'প্রেরক রেফারেন্স বা মানি রিসিট নম্বর আবশ্যক।' : 'Sender reference or receipt number is required.');
      }
      setIsSubmitting(false);
      return;
    }

    if (senderSourceType === 'MFS_WALLET') {
      const cleanSender = senderRef.replace(/[\s-]/g, '');
      if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
        setErrorMessage(language === 'bn' ? `প্রেরক মোবাইল নম্বর (${senderRef}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী নম্বর (যেমন: 017XXXXXXXX) লিখুন।` : 'Invalid 11-digit sender mobile number.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const seatsPayload = selectedSeatIds.map((sId) => {
        const sObj = allCurrentSeats.find((s) => s.seatId === sId);
        const base = sObj?.fare || selectedTrip?.basePrice || 550;
        let seatFare = base;
        if (journeyType === 'OUTBOUND_ONLY' || journeyType === 'RETURN_ONLY') {
          seatFare = Math.round(base * 0.5);
        } else if (journeyType === 'ASYMMETRIC') {
          const leg = seatLegs[sId] || 'ROUND_TRIP';
          seatFare = leg === 'ROUND_TRIP' ? base : Math.round(base * 0.5);
        }
        return { seatId: sId, fare: seatFare };
      });

      const finalSenderRef = selectedBankName && senderSourceType === 'BANK_TO_MFS'
        ? `${selectedBankName} [${senderRef.trim()}]`
        : senderRef.trim();

      const res = await createBookingAction({
        tripId: selectedTripId,
        seats: seatsPayload,
        passengers,
        journeyType,
        boardingPoint: boardingPoint || undefined,
        droppingPoint: droppingPoint || undefined,
        passengerLegsJson: journeyType === 'ASYMMETRIC' ? JSON.stringify(seatLegs) : undefined,
        isDiscountApplied: discountState.isDiscountApplied,
        discountType: discountState.isDiscountApplied && discountAmount > 0 ? discountState.discountType : undefined,
        discountRate: discountState.isDiscountApplied && discountAmount > 0 ? discountState.discountRate : undefined,
        discountReason: discountState.isDiscountApplied && discountAmount > 0 ? discountState.discountReason : undefined,
        discountReference: discountState.isDiscountApplied && discountAmount > 0 ? discountState.discountReference : undefined,
        paymentMethod,
        paidAmount,
        transactionId: transactionId.trim() || undefined,
        senderReference: finalSenderRef,
        notes: bookingNotes || `যাত্রার ধরণ: ${
          journeyType === 'ROUND_TRIP'
            ? 'উভয়মুখী (যাওয়া ও আসা)'
            : journeyType === 'OUTBOUND_ONLY'
            ? 'শুধুমাত্র যাওয়া'
            : journeyType === 'RETURN_ONLY'
            ? 'শুধুমাত্র আসা'
            : 'অভিভাবক সহ স্প্লিট'
        } | বোর্ডিং: ${boardingPoint} | ড্রপিং: ${droppingPoint}`
      });

      if (res.success && res.booking) {
        passengers.forEach((p) => {
          if (p.passengerName && p.passengerPhone) {
            recordPassengerInDirectory({
              name: p.passengerName.trim(),
              phone: p.passengerPhone.trim(),
              gender: p.gender,
              passengerType: p.passengerType,
              admissionId: p.admissionId,
              institution: p.institution,
              guardianPhone: p.guardianPhone,
              guardianRelationship: p.guardianRelationship
            });
          }
        });
        const fullBookingData = {
          ...res.booking,
          trip: selectedTrip,
          passengers: passengers.map((p) => ({
            ...p,
            seatNumber: allCurrentSeats.find((s) => s.seatId === p.seatId)?.seatNumber || p.seatId,
            fareSnapshot: allCurrentSeats.find((s) => s.seatId === p.seatId)?.fare || selectedTrip?.basePrice || 550
          })),
          payments: [
            {
              id: 'pmt-receipt-new',
              receiptNumber: generateReceiptNumber(Math.floor(Math.random() * 9000) + 1000),
              amount: paidAmount,
              method: paymentMethod,
              createdAt: new Date(),
              transactions: [
                {
                  transactionId: transactionId.trim() || finalSenderRef || 'OFFICE-CASH-VERIFIED',
                  verificationStatus: 'VERIFIED'
                }
              ]
            }
          ],
          grossAmount,
          discountAmount,
          netAmount,
          paidAmount,
          dueAmount: Math.max(0, netAmount - paidAmount),
          paymentStatus: paidAmount >= netAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'
        };
        setConfirmedBookingForReceipt(fullBookingData);
      } else {
        setErrorMessage(res.error || 'Failed to create booking.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation helpers ──────────────────────────────────────
  const maxReachableStep = useMemo(() => {
    if (!selectedTripId) return 1;
    if (selectedSeatIds.length === 0) return 2;
    return 5;
  }, [selectedTripId, selectedSeatIds.length]);

  const handleNavigate = (target: number) => {
    if (target > maxReachableStep) return;
    setStep(target);
  };

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setSelectedSeatIds([]);
    setExtraSeats([]);
    setStep(2);
  };

  const stepLabel = BOOKING_STEPS.find((s) => s.id === step);
  const seatLabels = selectedSeatIds
    .map((id) => allCurrentSeats.find((s) => s.seatId === id)?.seatNumber)
    .filter(Boolean);

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-xs px-3 py-1 font-bold">
              {targetUniversity}
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-500">
              {activeCapacity} {language === 'bn' ? 'সিট কোচ' : 'Seat Coach'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Armchair suppressHydrationWarning className="w-7 h-7" style={{ color: currentColor?.primaryHex || 'var(--primary-color)' }} />
            {language === 'bn' ? 'নতুন সিট বুকিং ও টিকিট ইস্যু' : 'New Seat Booking & Ticket Issue'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'কাস্টম সিট বিল্ডার ফরম্যাটে যে বিশ্ববিদ্যালয়ের জন্য যেমন সিট প্ল্যান ও ভাড়া কনফিগার করা হয়েছে, ঠিক সেভাবে বুকিং করুন।'
              : 'Select your university admission trip and pick seats matching the exact custom seat builder configuration.'}
          </p>
        </div>

        <StepIndicator currentStep={step} maxReachableStep={maxReachableStep} onNavigate={handleNavigate} />
      </div>

      {/* Sticky summary bar */}
      <BookingSummaryBar
        selectedSeatCount={selectedSeatIds.length}
        seatLabels={seatLabels}
        destinationLabel={targetUniversity}
        netAmount={netAmount}
        discountAmount={discountAmount}
        paidAmount={paidAmount}
        stepLabel={stepLabel ? (language === 'bn' ? stepLabel.labelBn : stepLabel.labelEn) : ''}
      />

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step bodies */}
      {step === 1 && (
        <TripSelectionStep
          trips={trips}
          activeCapacity={activeCapacity}
          targetUniversity={targetUniversity}
          activeSegments={activeSegments}
          currentUser={currentUser}
          onSelectTrip={handleSelectTrip}
        />
      )}

      {step === 2 && selectedTrip && (
        <SeatSelectionStep
          trip={selectedTrip}
          activeCapacity={activeCapacity}
          activeSegments={activeSegments}
          tripSeats={tripSeats}
          extraSeats={extraSeats}
          selectedSeatIds={selectedSeatIds}
          isLoadingSeats={isLoadingSeats}
          dynamicAdjacentLocks={dynamicAdjacentLocks}
          onToggleSeat={toggleSeatSelection}
          onAddExtraSeat={handleAddExtraSeat}
          onRemoveExtraSeat={handleRemoveExtraSeat}
          onGoBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <PassengerDetailsStep
          passengers={passengers}
          allCurrentSeats={allCurrentSeats}
          targetUniversity={targetUniversity}
          suggestedPassengerMap={suggestedPassengerMap}
          onUpdatePassenger={handleUpdatePassenger}
          onSetErrorMessage={setErrorMessage}
          onGoBack={() => setStep(2)}
          onContinue={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <BoardingAndPackageStep
          trip={selectedTrip}
          selectedSeatCount={selectedSeatIds.length}
          journeyType={journeyType}
          boardingPoint={boardingPoint}
          droppingPoint={droppingPoint}
          hasHotelPackageOption={hasHotelPackageOption}
          includeHotelPackage={includeHotelPackage}
          hotelFeePerPerson={hotelFeePerPerson}
          hotelPackageDetails={hotelPackageDetails}
          estimatedNet={grossAmount}
          onJourneyTypeChange={(type) => {
            setJourneyType(type);
            if (type !== 'ASYMMETRIC') setSeatLegs({});
          }}
          onBoardingChange={setBoardingPoint}
          onDroppingChange={setDroppingPoint}
          onHotelToggle={setIncludeHotelPackage}
          onHotelFeeChange={setHotelFeePerPerson}
          onGoBack={() => setStep(3)}
          onContinue={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <FareAndPaymentStep
          passengers={passengers}
          allCurrentSeats={allCurrentSeats}
          targetUniversity={targetUniversity}
          grossAmount={grossAmount}
          discountState={discountState}
          appliedCoupon={appliedCoupon}
          couponMessage={couponMessage}
          couponApplying={couponApplying}
          netAmount={netAmount}
          dueAmount={dueAmount}
          paymentMethod={paymentMethod}
          senderSourceType={senderSourceType}
          selectedBankName={selectedBankName}
          paidAmount={paidAmount}
          transactionId={transactionId}
          senderRef={senderRef}
          isSubmitting={isSubmitting}
          isStaffCouponModalOpen={isStaffCouponModalOpen}
          customLogos={customLogos}
          onDiscountChange={(partial) => setDiscountState((prev) => ({ ...prev, ...partial }))}
          onCouponApply={handleApplyCoupon}
          onCouponRemove={handleRemoveCoupon}
          onStaffCouponApply={handleStaffCouponApply}
          onSetStaffCouponModalOpen={setIsStaffCouponModalOpen}
          onPaymentMethodChange={setPaymentMethod}
          onSenderSourceTypeChange={setSenderSourceType}
          onSelectedBankChange={setSelectedBankName}
          onPaidAmountChange={setPaidAmount}
          onTransactionIdChange={setTransactionId}
          onSenderRefChange={setSenderRef}
          onGoBack={() => setStep(4)}
          onConfirm={handleFinalSubmit}
        />
      )}

      {/* Gender violation modal */}
      {genderWarningModal && (
        <Modal
          isOpen={genderWarningModal.isOpen}
          onClose={() => setGenderWarningModal(null)}
          size="md"
        >
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner border-2 border-rose-300 dark:border-rose-700">
              <Shield className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{genderWarningModal.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">{genderWarningModal.message}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-bold">
              {language === 'bn'
                ? '💡 পরামর্শ: পুরুষ অভিভাবক হিসেবে সাথে যেতে চাইলে "যাত্রীর ধরন" ড্রপডাউন থেকে "অভিভাবক" (Guardian) এবং সম্পর্ক নির্বাচন করুন।'
                : 'Tip: If accompanying as a male guardian, select Passenger Type as "Guardian" and specify the relationship.'}
            </div>
            <Button
              variant="primary"
              onClick={() => setGenderWarningModal(null)}
              className="w-full rounded-xl font-black py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
            >
              {language === 'bn' ? 'বুঝেছি / নিয়ম মেনে নিচ্ছি' : 'Understood / Accept Rule'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Receipt modal */}
      {confirmedBookingForReceipt && (
        <PaymentReceiptModal
          isOpen={!!confirmedBookingForReceipt}
          booking={confirmedBookingForReceipt}
          onClose={() => {
            router.push(`/bookings/${confirmedBookingForReceipt.id}`);
          }}
          onNewBooking={() => {
            setConfirmedBookingForReceipt(null);
            setSelectedSeatIds([]);
            setStep(1);
            router.push('/bookings/new');
          }}
        />
      )}
    </div>
  );
}
