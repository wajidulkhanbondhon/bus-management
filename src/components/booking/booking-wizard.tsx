'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PhoneInput } from '@/components/ui/phone-input';
import { formatCurrency, formatDate, formatTime, formatDateTime, cleanAndLimitPhoneNumber, isValidBdMobile, generateReceiptNumber } from '@/lib/utils';
import { createBookingAction } from '@/actions/booking.actions';
import { PaymentReceiptModal } from './payment-receipt';
import {
  calculateDynamicAdjacentSeatLocks,
  validateMultiSeatBookingPairRules,
  getAdjacentSeatPair,
  getAdjacentSeatNumber
} from '@/services/rules.service';
import {
  validateAndCalculateCoupon,
  getMarketingCoupons,
  MarketingCoupon
} from '@/services/coupon.service';
import {
  lookupPassengerByPhone,
  recordPassengerInDirectory,
  DirectoryPassenger
} from '@/services/passenger-directory.service';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  BankTransferLogo,
  CashMoneyLogo,
  IslamiBankLogo,
  DbblLogo,
  BracBankLogo,
  CityBankLogo,
  EblLogo,
  SonaliBankLogo,
  MtbLogo,
  VisaMastercardLogo,
  DynamicPaymentLogo
} from './payment-brand-icons';
import { BoardingPointSelector } from './boarding-point-selector';
import Link from 'next/link';
import {
  Bus,
  CheckCircle2,
  AlertCircle,
  Users,
  CreditCard,
  FileText,
  UserCheck,
  Phone,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Check,
  Compass,
  Armchair,
  Palette,
  PlusCircle,
  FolderOpen,
  LayoutGrid,
  Zap,
  Info,
  Layers,
  Shield,
  HeartHandshake,
  X
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface PassengerInput {
  passengerName: string;
  passengerPhone: string;
  phoneType: 'WHATSAPP' | 'NORMAL';
  passengerType: 'STUDENT' | 'GUARDIAN';
  gender: 'MALE' | 'FEMALE';
  seatId: string;
  admissionId?: string;
  institution?: string;
  guardianPhone?: string;
  guardianPhoneType?: 'WHATSAPP' | 'NORMAL';
  guardianRelationship?: 'FATHER' | 'MOTHER' | 'BROTHER' | 'SISTER' | 'SPOUSE' | 'UNCLE' | 'AUNT' | 'OTHER';
}

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
}

const COLOR_OPTIONS: {
  id: FareRangeSegment['color'];
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}[] = [
  { id: 'emerald', label: 'Emerald Green', bgClass: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/70 dark:to-emerald-900/70', borderClass: 'border-emerald-500 dark:border-emerald-400', textClass: 'text-emerald-950 dark:text-emerald-100', dotClass: 'bg-emerald-500' },
  { id: 'blue', label: 'Royal Blue', bgClass: 'from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/70', borderClass: 'border-blue-500 dark:border-blue-400', textClass: 'text-blue-950 dark:text-blue-100', dotClass: 'bg-blue-500' },
  { id: 'purple', label: 'Indigo Purple', bgClass: 'from-purple-50 to-purple-100 dark:from-purple-950/70 dark:to-purple-900/70', borderClass: 'border-purple-500 dark:border-purple-400', textClass: 'text-purple-950 dark:text-purple-100', dotClass: 'bg-purple-500' },
  { id: 'amber', label: 'Sunset Amber', bgClass: 'from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/70', borderClass: 'border-amber-500 dark:border-amber-400', textClass: 'text-amber-950 dark:text-amber-100', dotClass: 'bg-amber-500' },
  { id: 'rose', label: 'Coral Rose', bgClass: 'from-rose-50 to-rose-100 dark:from-rose-950/70 dark:to-rose-900/70', borderClass: 'border-rose-500 dark:border-rose-400', textClass: 'text-rose-950 dark:text-rose-100', dotClass: 'bg-rose-500' },
  { id: 'cyan', label: 'Ocean Cyan', bgClass: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/70 dark:to-cyan-900/70', borderClass: 'border-cyan-500 dark:border-cyan-400', textClass: 'text-cyan-950 dark:text-cyan-100', dotClass: 'bg-cyan-500' }
];

interface Props {
  trips: any[];
  currentUser?: any;
  savedLayouts?: any[];
  fareZones?: any[];
}

export function BookingWizard({ trips: initialTrips, currentUser, savedLayouts = [], fareZones = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, currentColor, customLogos } = useApp();

  const rowLetters = 'ABCDEFGHIJKLMN';

  // Standard Capacity Options (Matching Custom Seat Builder)
  const capacityOptions = [
    {
      capacity: 45,
      titleBn: '৪৫ সিট (ডিফল্ট / সবচেয়ে জনপ্রিয়)',
      titleEn: '45 Seats (Most Popular)',
      rowsDesc: '১১ সারি (১০ সারি × ৪ = ৪০ + শেষ সারিতে ৫টি সিট)',
      isDefault: true
    },
    {
      capacity: 40,
      titleBn: '৪০ সিট (স্ট্যান্ডার্ড কোচ)',
      titleEn: '40 Seats (Standard Coach)',
      rowsDesc: '১০ সারি (১০ সারি × ৪ = ৪০ সিট, ২+২ লেআউট)',
      isDefault: false
    },
    {
      capacity: 36,
      titleBn: '৩৬ সিট (৯ সারি)',
      titleEn: '36 Seats (9 Rows)',
      rowsDesc: '৯ সারি × ৪ = ৩৬ সিট',
      isDefault: false
    },
    {
      capacity: 32,
      titleBn: '৩২ সিট (৮ সারি)',
      titleEn: '32 Seats (8 Rows)',
      rowsDesc: '৮ সারি × ৪ = ৩২ সিট',
      isDefault: false
    },
    {
      capacity: 28,
      titleBn: '২৮ সিট (৭ সারি)',
      titleEn: '28 Seats (7 Rows)',
      rowsDesc: '৭ সারি × ৪ = ২৮ সিট',
      isDefault: false
    },
    {
      capacity: 42,
      titleBn: '৪২ সিট (১০ সারি + স্পেশাল)',
      titleEn: '42 Seats (10 Rows + Extra)',
      rowsDesc: '১০ সারি (৪০) + লাস্ট রো স্পেশাল ২ সিট',
      isDefault: false
    }
  ];

  // University Presets (Matching Custom Seat Builder)
  const universityPresets = [
    {
      id: 'RU',
      name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
      defaultLayoutName: 'রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' as const },
        { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' as const }
      ]
    },
    {
      id: 'CU',
      name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
      defaultLayoutName: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU) নাইট কোচ - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 600, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 550, color: 'purple' as const }
      ]
    },
    {
      id: 'DU',
      name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
      defaultLayoutName: 'ঢাকা বিশ্ববিদ্যালয় (DU) ডে এক্সপ্রেস - ৪০ সিট (৳৫০০)',
      capacity: 40,
      segments: [
        { id: 'seg-1', name: 'Front Seats (A–D)', startRow: 'A', endRow: 'D', fare: 500, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (E–J)', startRow: 'E', endRow: 'J', fare: 450, color: 'blue' as const }
      ]
    },
    {
      id: 'GST',
      name: 'জিএসটি গুচ্ছ (GST Cluster)',
      defaultLayoutName: 'জিএসটি গুচ্ছ (GST) স্পেশাল - ৪৫ সিট (৳৬০০/৳৫০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 600, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 500, color: 'blue' as const }
      ]
    },
    {
      id: 'JU',
      name: 'জাহাঙ্গীরনগর (JU)',
      defaultLayoutName: 'জাহাঙ্গীরনগর (JU) শাটল বাস - ৩৬ সিট (৳৩৫০)',
      capacity: 36,
      segments: [
        { id: 'seg-1', name: 'All Seats (A–I)', startRow: 'A', endRow: 'I', fare: 350, color: 'blue' as const }
      ]
    },
    {
      id: 'KUET',
      name: 'কুয়েট খুলনা (KUET)',
      defaultLayoutName: 'কুয়েট এক্সপ্রেস (KUET) - ৪৫ সিট (৳৬৫০/৳৫৫০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
      ]
    },
    {
      id: 'SUST',
      name: 'সাস্ট সিলেট (SUST)',
      defaultLayoutName: 'সাস্ট সিলেট (SUST) এক্সপ্রেস - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 600, color: 'blue' as const }
      ]
    }
  ];

  // Active University and Segments State
  const [targetUniversity, setTargetUniversity] = useState<string>('রাজশাহী বিশ্ববিদ্যালয় (RU)');
  const [activeCapacity, setActiveCapacity] = useState<number>(45);
  const [activeSegments, setActiveSegments] = useState<FareRangeSegment[]>(universityPresets[0].segments);
  const [extraSeats, setExtraSeats] = useState<any[]>([]);

  // Fallback demo trips if trips is empty
  const trips = initialTrips && initialTrips.length > 0 ? initialTrips : [
    {
      id: 'trip-demo-01',
      tripCode: 'DH-RU-0800',
      basePrice: 550,
      departureDate: new Date().toISOString(),
      departureTime: '08:00 AM',
      tripBusType: 'MIXED',
      bus: {
        busName: 'Desh Travels Scania VIP (45 Seats)',
        busNumber: 'DHK-METRO-11-2045',
        busType: 'MIXED',
        capacity: 45,
        targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)'
      },
      route: {
        routeName: 'Dhaka (Kalyanpur) ➔ Rajshahi University (RU)',
        origin: 'Dhaka (Kalyanpur)',
        destination: 'Rajshahi University (RU)'
      }
    },
    {
      id: 'trip-demo-02',
      tripCode: 'DH-CU-0930',
      basePrice: 600,
      departureDate: new Date().toISOString(),
      departureTime: '09:30 AM',
      tripBusType: 'MIXED',
      bus: {
        busName: 'Green Line Executive Coach (45 Seats)',
        busNumber: 'DHK-METRO-14-8890',
        busType: 'MIXED',
        capacity: 45,
        targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)'
      },
      route: {
        routeName: 'Dhaka (Sayedabad) ➔ Chittagong University (CU)',
        origin: 'Dhaka (Sayedabad)',
        destination: 'Chittagong University (CU)'
      }
    },
    {
      id: 'trip-demo-03',
      tripCode: 'DH-DU-0700',
      basePrice: 500,
      departureDate: new Date().toISOString(),
      departureTime: '07:00 AM',
      tripBusType: 'FEMALE',
      bus: {
        busName: 'Hanif Enterprise (40 Seats)',
        busNumber: 'DHK-METRO-15-4421',
        busType: 'FEMALE',
        capacity: 40,
        targetUniversity: 'ঢাকা বিশ্ববিদ্যালয় (DU)'
      },
      route: {
        routeName: 'Dhaka (Farmgate) ➔ Dhaka University (DU - Female Special)',
        origin: 'Dhaka (Farmgate)',
        destination: 'Dhaka University (DU)'
      }
    }
  ];

  const initialTripId = searchParams.get('tripId') || trips[0]?.id || '';
  const initialSeatId = searchParams.get('seatId') || '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialTripId && initialSeatId ? 2 : 1);
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeatId ? [initialSeatId] : []);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Helper to find segment matching row
  const getSegmentForRow = (rowChar: string, currentSegments = activeSegments): FareRangeSegment | undefined => {
    return currentSegments.find(seg => {
      const startIdx = rowLetters.indexOf(seg.startRow.toUpperCase());
      const endIdx = rowLetters.indexOf(seg.endRow.toUpperCase());
      const curIdx = rowLetters.indexOf(rowChar.toUpperCase());
      return curIdx >= startIdx && curIdx <= endIdx;
    });
  };

  // Robust seat position parser
  const parseSeatPosition = (seat: any, totalRowsCount: number) => {
    const numStr = (seat.seatNumber || seat.seat_number || seat.label || '').trim().toUpperCase();

    if (numStr.startsWith('EX') || seat.isExtra || seat.seatType === 'EXTRA') {
      return {
        rowIndex: 999,
        colIndex: seat.colIndex ?? 0,
        isExtra: true
      };
    }

    const match = numStr.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const rowChar = match[1];
      const colDigit = parseInt(match[2], 10);
      const rIdx = rowLetters.indexOf(rowChar);

      if (rIdx >= 0) {
        // Last row with 5 seats (Row K in 45-seat or 42-seat layout)
        if (rIdx === totalRowsCount - 1 && (totalRowsCount === 11 || activeCapacity === 45 || activeCapacity === 42)) {
          if (colDigit >= 1 && colDigit <= 5) {
            return {
              rowIndex: rIdx,
              colIndex: colDigit - 1, // K1->0, K2->1, K3->2, K4->3, K5->4
              isExtra: false
            };
          }
        }

        // Standard 4-seat rows (1, 2 on left -> cols 0, 1; 3, 4 on right -> cols 3, 4)
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
  };

  // Helper to generate dynamic layout matching custom seat builder
  const generateDynamicSeats = (capacity: number, segmentsToUse = activeSegments, trip?: any) => {
    const seats: any[] = [];
    const tripId = trip?.id || selectedTripId || 'trip';

    if (capacity === 45) {
      const rows = 11;
      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const isLastRow = r === rows - 1; // Row K
        const matchingSeg = getSegmentForRow(rowChar, segmentsToUse);
        const fare = matchingSeg?.fare || (r < 5 ? 650 : r < 8 ? 550 : 500);

        if (isLastRow) {
          // Row K 5 seats: K1 (0), K2 (1), K3 (2 Center Aisle), K4 (3), K5 (4)
          for (let c = 0; c < 5; c++) {
            const seatNum = `${rowChar}${c + 1}`;
            seats.push({
              seatId: `seat-${tripId}-${seatNum}`,
              seatNumber: seatNum,
              rowIndex: r,
              colIndex: c,
              seatType: 'STANDARD',
              genderAllowed: 'ANY',
              fare: matchingSeg?.fare || 450,
              fareZoneName: matchingSeg?.name || 'Last Row Bench',
              status: 'AVAILABLE'
            });
          }
        } else {
          // Standard Rows: Left (Col 0: Seat 1, Col 1: Seat 2), Right (Col 3: Seat 3, Col 4: Seat 4)
          for (let c = 0; c < 5; c++) {
            if (c === 2) continue; // Walkway Aisle
            const seatDigit = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
            const seatNum = `${rowChar}${seatDigit}`;
            seats.push({
              seatId: `seat-${tripId}-${seatNum}`,
              seatNumber: seatNum,
              rowIndex: r,
              colIndex: c,
              seatType: r < 5 ? 'VIP' : 'STANDARD',
              genderAllowed: r < 3 && (c === 0 || c === 1) ? 'FEMALE_ONLY' : 'ANY',
              fare: fare,
              fareZoneName: matchingSeg?.name || (r < 5 ? 'Front VIP' : 'Standard Middle'),
              status: 'AVAILABLE'
            });
          }
        }
      }
    } else if (capacity === 40) {
      const rows = 10;
      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const matchingSeg = getSegmentForRow(rowChar, segmentsToUse);
        const fare = matchingSeg?.fare || (r < 4 ? 500 : 450);

        for (let c = 0; c < 5; c++) {
          if (c === 2) continue;
          const seatDigit = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
          const seatNum = `${rowChar}${seatDigit}`;
          seats.push({
            seatId: `seat-${tripId}-${seatNum}`,
            seatNumber: seatNum,
            rowIndex: r,
            colIndex: c,
            seatType: r < 4 ? 'FRONT' : 'STANDARD',
            genderAllowed: r < 3 && (c === 0 || c === 1) ? 'FEMALE_ONLY' : 'ANY',
            fare: fare,
            fareZoneName: matchingSeg?.name || (r < 4 ? 'Front Seats' : 'Standard Seats'),
            status: 'AVAILABLE'
          });
        }
      }
    } else {
      let rows = Math.ceil(capacity / 4);
      if (rows < 5) rows = 5;
      let seatCounter = 0;

      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const matchingSeg = getSegmentForRow(rowChar, segmentsToUse);
        const fare = matchingSeg?.fare || 500;

        for (let c = 0; c < 5; c++) {
          if (c === 2) continue;
          if (seatCounter < capacity) {
            seatCounter++;
            const seatDigit = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
            const seatNum = `${rowChar}${seatDigit}`;
            seats.push({
              seatId: `seat-${tripId}-${seatNum}`,
              seatNumber: seatNum,
              rowIndex: r,
              colIndex: c,
              seatType: 'STANDARD',
              genderAllowed: r < 3 && (c === 0 || c === 1) ? 'FEMALE_ONLY' : 'ANY',
              fare: fare,
              fareZoneName: matchingSeg?.name || 'Standard Seats',
              status: 'AVAILABLE'
            });
          }
        }
      }
    }

    return seats;
  };

  // Step 2: Passenger details for each selected seat
  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [suggestedPassengerMap, setSuggestedPassengerMap] = useState<Record<string, DirectoryPassenger>>({});

  // Journey Direction & Boarding Points State
  const [journeyType, setJourneyType] = useState<'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY' | 'ASYMMETRIC'>('ROUND_TRIP');
  const [boardingPoint, setBoardingPoint] = useState<string>('গাবতলী বাস টার্মিনাল');
  const [droppingPoint, setDroppingPoint] = useState<string>('বিশ্ববিদ্যালয় মেইন গেট');
  const [seatLegs, setSeatLegs] = useState<Record<string, 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY'>>({});

  // Step 3: Discount calculation (টিকিটের দাম Less / ছাড় ও রেফারেন্স)
  const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [discountReference, setDiscountReference] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');

  // Coupon Code State & Staff Modal
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: 'FIXED' | 'PERCENTAGE'; rate: number; label: string } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isStaffCouponModalOpen, setIsStaffCouponModalOpen] = useState(false);

  const authorizerPresets = [
    'কেন্দ্রীয় প্রশাসন / ডিরেক্টর (Central Admin / Director)',
    'ব্রাঞ্চ ইনচার্জ / শাখা প্রধান (Branch In-charge)',
    'অপারেশন ম্যানেজার (Operations Manager)',
    'কাউন্টার ম্যানেজার / ইনচার্জ (Counter In-charge)',
    'অধ্যাপক / ডিন স্পেশাল রেফারেন্স (Faculty / Dean Reference)',
    'কোচ কো-অর্ডিনেটর (Coach Coordinator)'
  ];

  const handleApplyCoupon = () => {
    setCouponMessage(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage(language === 'bn' ? 'অনুগ্রহ করে কুপন কোড লিখুন।' : 'Please enter a coupon code.');
      return;
    }

    const result = validateAndCalculateCoupon(code, grossAmount, targetUniversity);
    if (result.isValid) {
      setIsDiscountApplied(true);
      setDiscountType(result.discountType);
      setDiscountRate(result.discountRate);
      setDiscountReference(`Coupon: ${code}`);
      setAppliedCoupon({
        code,
        discountType: result.discountType,
        rate: result.discountRate,
        label: result.discountType === 'FIXED' ? `৳${result.discountRate} ছাড়` : `${result.discountRate}% ছাড়`
      });
      setCouponMessage(result.message);
    } else {
      setCouponMessage(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
    setIsDiscountApplied(false);
    setDiscountRate(0);
    setDiscountReference('');
  };

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER'>('BKASH');
  const [senderSourceType, setSenderSourceType] = useState<'MFS_WALLET' | 'BANK_TO_MFS' | 'CASH_RECEIPT'>('MFS_WALLET');
  const [selectedBankName, setSelectedBankName] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderRef, setSenderRef] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [confirmedBookingForReceipt, setConfirmedBookingForReceipt] = useState<any | null>(null);

  // Immediate Gender Violation Warning Modal State
  const [genderWarningModal, setGenderWarningModal] = useState<{
    isOpen: boolean;
    seatNumber: string;
    adjacentSeatNumber?: string;
    title: string;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // Auto-detect and sync university layout from trip details
  useEffect(() => {
    if (!selectedTrip) return;
    const dest = (selectedTrip.route?.destination || selectedTrip.route?.routeName || selectedTrip.bus?.busName || selectedTrip.bus?.targetUniversity || '').toLowerCase();

    let matchedPreset = universityPresets[0]; // RU default
    if (dest.includes('rajshahi') || dest.includes('ru')) {
      matchedPreset = universityPresets.find(u => u.id === 'RU') || universityPresets[0];
    } else if (dest.includes('chittagong') || dest.includes('cu')) {
      matchedPreset = universityPresets.find(u => u.id === 'CU') || universityPresets[1];
    } else if (dest.includes('dhaka') || dest.includes('du')) {
      matchedPreset = universityPresets.find(u => u.id === 'DU') || universityPresets[2];
    } else if (dest.includes('gst') || dest.includes('cluster') || dest.includes('গুচ্ছ')) {
      matchedPreset = universityPresets.find(u => u.id === 'GST') || universityPresets[3];
    } else if (dest.includes('jahangirnagar') || dest.includes('ju')) {
      matchedPreset = universityPresets.find(u => u.id === 'JU') || universityPresets[4];
    } else if (dest.includes('kuet') || dest.includes('khulna')) {
      matchedPreset = universityPresets.find(u => u.id === 'KUET') || universityPresets[5];
    } else if (dest.includes('sust') || dest.includes('sylhet')) {
      matchedPreset = universityPresets.find(u => u.id === 'SUST') || universityPresets[6];
    }

    setTargetUniversity(matchedPreset.name);
    setActiveCapacity(matchedPreset.capacity);
    setActiveSegments(matchedPreset.segments);
  }, [selectedTripId]);

  // Load seats when selectedTripId or layout config changes
  useEffect(() => {
    if (!selectedTripId) {
      setTripSeats(generateDynamicSeats(activeCapacity, activeSegments, selectedTrip));
      return;
    }

    const expectedRows = activeCapacity === 45 ? 11 : activeCapacity === 40 ? 10 : Math.ceil(activeCapacity / 4);

    setIsLoadingSeats(true);
    fetch(`/api/v1/trips/${selectedTripId}/seats`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.seats && data.data.seats.length > 0) {
          const normalized = data.data.seats.map((s: any) => {
            const pos = parseSeatPosition(s, expectedRows);
            const rowChar = rowLetters[pos.rowIndex] || 'A';
            const matchingSeg = getSegmentForRow(rowChar);
            return {
              ...s,
              seatId: s.seatId || `seat-${selectedTripId}-${s.seatNumber}`,
              rowIndex: pos.rowIndex,
              colIndex: pos.colIndex,
              fare: s.fare || matchingSeg?.fare || (pos.rowIndex < 5 ? 650 : pos.rowIndex < 8 ? 550 : 500),
              isExtra: pos.isExtra
            };
          });
          setTripSeats(normalized);
        } else {
          setTripSeats(generateDynamicSeats(activeCapacity, activeSegments, selectedTrip));
        }
      })
      .catch(() => {
        setTripSeats(generateDynamicSeats(activeCapacity, activeSegments, selectedTrip));
      })
      .finally(() => setIsLoadingSeats(false));
  }, [selectedTripId, activeCapacity, activeSegments]);

  // Switch University Layout Preset Manually
  const handleSelectUniversityPreset = (uni: typeof universityPresets[0]) => {
    setTargetUniversity(uni.name);
    setActiveCapacity(uni.capacity);
    setActiveSegments(uni.segments);
    setSelectedSeatIds([]);
    setTripSeats(generateDynamicSeats(uni.capacity, uni.segments, selectedTrip));
  };

  // Switch Capacity Manually
  const handleSelectCapacity = (cap: number) => {
    setActiveCapacity(cap);
    setSelectedSeatIds([]);
    setTripSeats(generateDynamicSeats(cap, activeSegments, selectedTrip));
  };

  // Add Extra Seat (বনেট সিট / ওভারলোড সিট)
  const handleAddExtraSeat = () => {
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
    setExtraSeats(prev => [...prev, newExtra]);
  };

  const handleRemoveExtraSeat = (seatId: string) => {
    setExtraSeats(prev => prev.filter(s => s.seatId !== seatId));
    setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
  };

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

  // Sync passenger forms with selected seats
  useEffect(() => {
    const allAvailable = [...tripSeats, ...extraSeats];
    const newPassengerList: PassengerInput[] = selectedSeatIds.map((seatId) => {
      const existing = passengers.find(p => p.seatId === seatId);
      if (existing) return existing;

      return {
        passengerName: '',
        passengerPhone: '',
        phoneType: 'WHATSAPP',
        passengerType: 'STUDENT', // Default all to STUDENT
        gender: 'FEMALE',
        seatId: seatId,
        admissionId: '',
        institution: `${targetUniversity} (Admission Candidate)`,
        guardianPhone: '',
        guardianPhoneType: 'WHATSAPP',
        guardianRelationship: undefined
      };
    });
    setPassengers(newPassengerList);
  }, [selectedSeatIds, targetUniversity]);

  // Financial Calculations
  const allCurrentSeats = [...tripSeats, ...extraSeats];

  // Dynamic Adjacent Seat Locks Calculation (Live)
  const dynamicAdjacentLocks = useMemo(() => {
    return calculateDynamicAdjacentSeatLocks(allCurrentSeats);
  }, [allCurrentSeats]);

  const grossAmount = selectedSeatIds.reduce((sum, sId) => {
    const seatObj = allCurrentSeats.find(s => s.seatId === sId);
    const baseFare = seatObj?.fare || selectedTrip?.basePrice || 550;
    if (journeyType === 'ROUND_TRIP') return sum + baseFare;
    if (journeyType === 'OUTBOUND_ONLY' || journeyType === 'RETURN_ONLY') return sum + Math.round(baseFare * 0.5);
    // ASYMMETRIC / CUSTOM_SPLIT
    const leg = seatLegs[sId] || 'ROUND_TRIP';
    return sum + (leg === 'ROUND_TRIP' ? baseFare : Math.round(baseFare * 0.5));
  }, 0);

  const discountAmount = isDiscountApplied
    ? (discountType === 'PERCENTAGE'
        ? Math.round((grossAmount * discountRate) / 100)
        : Math.min(discountRate, grossAmount))
    : 0;

  const netAmount = Math.max(0, grossAmount - discountAmount);
  const dueAmount = Math.max(0, netAmount - paidAmount);

  // Default paid amount to netAmount when reaching step 4
  useEffect(() => {
    if (step === 4 && paidAmount === 0) {
      setPaidAmount(netAmount);
    }
  }, [step, netAmount]);

  const toggleSeatSelection = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    setErrorMessage(null);

    const sObj = allCurrentSeats.find(s => s.seatId === seatId);
    const seatNum = sObj?.seatNumber?.toUpperCase();
    const dynamicLock = seatNum ? dynamicAdjacentLocks.get(seatNum) : undefined;

    if (dynamicLock) {
      if (dynamicLock.genderAllowed === 'FEMALE_ONLY') {
        setErrorMessage(language === 'bn' 
          ? `ℹ️ সতর্কতা: সিট ${seatNum} নারী সংরক্ষিত (সংলগ্ন সিটটি একজন নারী শিক্ষার্থী বুক করেছেন)।`
          : `Notice: Seat ${seatNum} is female-protected due to adjacent female passenger.`);
      } else if (dynamicLock.genderAllowed === 'MALE_ONLY') {
        setErrorMessage(language === 'bn'
          ? `ℹ️ সতর্কতা: সিট ${seatNum} পুরুষ সংরক্ষিত (সংলগ্ন সিটটি একজন পুরুষ যাত্রী বুক করেছেন)।`
          : `Notice: Seat ${seatNum} is male-protected due to adjacent male passenger.`);
      }
    }

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
    } else {
      setSelectedSeatIds(prev => [...prev, seatId]);
    }
  };

  const handleUpdatePassenger = (seatId: string, updates: Partial<PassengerInput>) => {
    setErrorMessage(null);

    const seatObj = allCurrentSeats.find(s => s.seatId === seatId);
    const seatNum = seatObj?.seatNumber?.toUpperCase();
    const targetPassenger = passengers.find(p => p.seatId === seatId);
    const effectiveType = updates.passengerType ?? targetPassenger?.passengerType ?? 'STUDENT';
    const effectiveGender = updates.gender ?? targetPassenger?.gender ?? 'FEMALE';
    const isFemaleDesignated = seatObj?.genderAllowed === 'FEMALE_ONLY';

    // 1. Strict validation if user tries to set MALE for a seat
    if (updates.gender === 'MALE' && seatNum) {
      const dynamicLock = dynamicAdjacentLocks.get(seatNum);
      const adjacentNum = getAdjacentSeatNumber(seatNum);

      // Check if adjacent seat in THIS booking session has a Female
      const adjacentCoPassenger = adjacentNum ? passengers.find(p => {
        const pObj = allCurrentSeats.find(s => s.seatId === p.seatId);
        const pSeatNum = pObj?.seatNumber?.toUpperCase() || (p.seatId === p.seatId ? seatNum : '');
        return pSeatNum === adjacentNum;
      }) : null;

      const isFemaleBus = selectedTrip?.tripBusType === 'FEMALE' || selectedTrip?.bus?.busType === 'FEMALE';

      // Female Bus check
      if (isFemaleBus && effectiveType === 'STUDENT') {
        const warning = {
          isOpen: true,
          seatNumber: seatNum,
          adjacentSeatNumber: adjacentNum || '',
          title: language === 'bn' ? '⚠️ নারী বিশেষ বাসে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Female Bus Restriction',
          message: language === 'bn'
            ? `এই বাসটি (${selectedTrip?.bus?.busName || 'ফিমেল স্পেশাল'}) শুধুমাত্র নারী শিক্ষার্থীদের জন্য নির্ধারিত। কোনো পুরুষ শিক্ষার্থী এই বাসে সিট নিতে পারবেন না!`
            : `This is a female-only bus. Male students are strictly prohibited!`
        };
        setGenderWarningModal(warning);
        setErrorMessage(warning.message);
        updates.gender = 'FEMALE';
      }
      // Case A: Adjacent co-passenger is Female and neither is marked as Guardian
      else if (adjacentCoPassenger && (adjacentCoPassenger.gender === 'FEMALE' || !adjacentCoPassenger.gender) && effectiveType === 'STUDENT' && (adjacentCoPassenger.passengerType === 'STUDENT' || !adjacentCoPassenger.passengerType)) {
        const warning = {
          isOpen: true,
          seatNumber: seatNum,
          adjacentSeatNumber: adjacentNum || '',
          title: language === 'bn' ? '⚠️ নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Student Gender Restriction',
          message: language === 'bn'
            ? `সিট ${seatNum} এবং ${adjacentNum} উভয়ই সাধারণ শিক্ষার্থী। কোনো নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী বসতে পারবে না। সাথে অভিভাবক (বাবা/ভাই/মা/স্বামী) থাকলে যাত্রীর ধরন "অভিভাবক" (Guardian) নির্বাচন করুন।`
            : `Seats ${seatNum} and ${adjacentNum} are both students. A male student cannot sit next to a female student unless travelling as a legal guardian!`
        };
        setGenderWarningModal(warning);
        setErrorMessage(warning.message);
        updates.gender = 'FEMALE';
      }
      // Case B: Seat is female-designated
      else if (isFemaleDesignated && effectiveType === 'STUDENT') {
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
      }
      // Case C: Adjacent seat was previously booked by a stranger female on the bus
      else if (dynamicLock?.genderAllowed === 'FEMALE_ONLY') {
        const isPairInSameCart = passengers.some(p => {
          const pObj = allCurrentSeats.find(s => s.seatId === p.seatId);
          return pObj?.seatNumber?.toUpperCase() === dynamicLock.adjacentBookedSeat;
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
        const adjacentCoPassenger = passengers.find(p => {
          const pObj = allCurrentSeats.find(s => s.seatId === p.seatId);
          return pObj?.seatNumber?.toUpperCase() === adjacentNum;
        });

        if (adjacentCoPassenger && (adjacentCoPassenger.gender === 'FEMALE' || !adjacentCoPassenger.gender)) {
          const warning = {
            isOpen: true,
            seatNumber: seatNum,
            adjacentSeatNumber: adjacentNum,
            title: language === 'bn' ? '⚠️ নারী শিক্ষার্থীর পাশে পুরুষ শিক্ষার্থী নিষিদ্ধ!' : 'Student Gender Restriction',
            message: language === 'bn'
              ? `সিট ${seatNum} এবং ${adjacentNum} উভয়ই সাধারণ শিক্ষার্থী। নারী শিক্ষার্থীর পাশে কোনো পুরুষ শিক্ষার্থী বসতে পারবে না।`
              : `Both seats are students. A male student cannot sit next to a female student!`
          };
          setGenderWarningModal(warning);
          setErrorMessage(warning.message);
          updates.passengerType = 'GUARDIAN';
        }
      }
    }

    // Automatic Name & Profile Suggestion Lookup when Phone Number is entered
    if (updates.passengerPhone !== undefined) {
      updates.passengerPhone = cleanAndLimitPhoneNumber(updates.passengerPhone);
      const cleanPhone = updates.passengerPhone;
      if (cleanPhone.length >= 6) {
        const found = lookupPassengerByPhone(cleanPhone);
        if (found && (!targetPassenger?.passengerName || targetPassenger.passengerName !== found.name)) {
          setSuggestedPassengerMap(prev => ({ ...prev, [seatId]: found }));
        } else {
          setSuggestedPassengerMap(prev => {
            const next = { ...prev };
            delete next[seatId];
            return next;
          });
        }
      } else {
        setSuggestedPassengerMap(prev => {
          const next = { ...prev };
          delete next[seatId];
          return next;
        });
      }
    }

    if (updates.guardianPhone !== undefined) {
      updates.guardianPhone = cleanAndLimitPhoneNumber(updates.guardianPhone);
    }

    setPassengers(prev => {
      const updatedList = prev.map(p => (p.seatId === seatId ? { ...p, ...updates } : p));
      
      // Real-time multi-passenger pair validation
      if (updates.gender || updates.passengerType || updates.guardianRelationship) {
        const pairCheck = validateMultiSeatBookingPairRules(updatedList, allCurrentSeats);
        if (!pairCheck.isValid) {
          setErrorMessage(pairCheck.message || 'Gender rule violation.');
        }
      }
      return updatedList;
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validate passengers basic inputs and 11-digit Bangladeshi mobile format
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const sLabel = allCurrentSeats.find(s => s.seatId === p.seatId)?.seatNumber || `সিট #${i + 1}`;

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
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর (${p.passengerPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।` : `Invalid 11-digit Bangladeshi mobile number for Seat ${sLabel}.`);
        setIsSubmitting(false);
        return;
      }

      if (p.guardianPhone && p.guardianPhone.trim()) {
        const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
        if (!bdPhoneRegex.test(cleanGPhone)) {
          setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর অভিভাবকের মোবাইল নম্বর (${p.guardianPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক নম্বর লিখুন।` : `Invalid 11-digit guardian phone number for Seat ${sLabel}.`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    // Validate adjacent seat gender & guardian exemption rules
    const pairValidation = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
    if (!pairValidation.isValid) {
      setErrorMessage(pairValidation.message || 'Gender or Guardian validation failed.');
      setIsSubmitting(false);
      return;
    }

    // Validate discount reference if discount applied
    if (isDiscountApplied && discountAmount > 0 && !discountReference.trim()) {
      setErrorMessage(language === 'bn' ? 'টিকিটের মূল্য ছাড় দেওয়ার জন্য রেফারেন্স বা অনুমোদনকারীর নাম আবশ্যক।' : 'Reference or authorizer name is required when applying a discount.');
      setIsSubmitting(false);
      return;
    }

    // Validate Sender Reference (MANDATORY AS REQUESTED)
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

    // Validate 11-digit BD mobile format if sender source is MFS Wallet
    if (senderSourceType === 'MFS_WALLET') {
      const cleanSender = senderRef.replace(/[\s-]/g, '');
      if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
        setErrorMessage(language === 'bn' ? `প্রেরক মোবাইল নম্বর (${senderRef}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী নম্বর (যেমন: 017XXXXXXXX) লিখুন।` : 'Invalid 11-digit sender mobile number.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const seatsPayload = selectedSeatIds.map(sId => {
        const sObj = allCurrentSeats.find(s => s.seatId === sId);
        const base = sObj?.fare || selectedTrip?.basePrice || 550;
        let seatFare = base;
        if (journeyType === 'OUTBOUND_ONLY' || journeyType === 'RETURN_ONLY') {
          seatFare = Math.round(base * 0.5);
        } else if (journeyType === 'ASYMMETRIC') {
          const leg = seatLegs[sId] || 'ROUND_TRIP';
          seatFare = leg === 'ROUND_TRIP' ? base : Math.round(base * 0.5);
        }
        return {
          seatId: sId,
          fare: seatFare
        };
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
        isDiscountApplied,
        discountType: isDiscountApplied && discountAmount > 0 ? discountType : undefined,
        discountRate: isDiscountApplied && discountAmount > 0 ? discountRate : undefined,
        discountReason: isDiscountApplied && discountAmount > 0 ? discountReason : undefined,
        discountReference: isDiscountApplied && discountAmount > 0 ? discountReference : undefined,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        transactionId: transactionId.trim() || undefined,
        senderReference: finalSenderRef,
        notes: bookingNotes || `যাত্রার ধরণ: ${
          journeyType === 'ROUND_TRIP'
            ? 'উভয়মুখী (যাওয়া ও আসা)'
            : journeyType === 'OUTBOUND_ONLY'
            ? 'শুধুমাত্র যাওয়া'
            : journeyType === 'RETURN_ONLY'
            ? 'শুধুমাত্র আসা'
            : 'অভিভাবক সহ স্প্লিট'
        } | বোর্ডিং: ${boardingPoint} | ড্রপিং: ${droppingPoint}`
      });

      if (res.success && res.booking) {
        passengers.forEach(p => {
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
          passengers: passengers.map(p => ({
            ...p,
            seatNumber: allCurrentSeats.find(s => s.seatId === p.seatId)?.seatNumber || p.seatId,
            fareSnapshot: (p as any).fareSnapshot || allCurrentSeats.find(s => s.seatId === p.seatId)?.fare || selectedTrip?.basePrice || 550
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
          paymentStatus: paidAmount >= netAmount ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID')
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

  // Determine total rows in layout
  const totalRows = Math.max(
    activeCapacity === 45 ? 11 : activeCapacity === 40 ? 10 : Math.ceil(activeCapacity / 4),
    Math.max(1, ...tripSeats.map(s => (s.rowIndex ?? 0) + 1))
  );

  // Realistic Coach Seat Renderer with 3D Depth, Tactile Lift, and Alive States
  function renderRealisticCoachSeat(seatObj?: any, isMiddleSeat = false, segment?: FareRangeSegment) {
    if (!seatObj) return <div className="w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0" />;

    const isSelected = selectedSeatIds.includes(seatObj.seatId);
    const isBooked = seatObj.status === 'BOOKED';
    const isHeld = seatObj.status === 'HELD';
    const isAvailable = seatObj.status === 'AVAILABLE' || (!isBooked && !isHeld);

    // Dynamic Adjacent Seat Lock Detection
    const seatNum = seatObj.seatNumber?.toUpperCase();
    const dynamicLock = dynamicAdjacentLocks.get(seatNum);

    const isFemaleOnly = seatObj.genderAllowed === 'FEMALE_ONLY' || dynamicLock?.genderAllowed === 'FEMALE_ONLY';
    const isMaleOnly = seatObj.genderAllowed === 'MALE_ONLY' || dynamicLock?.genderAllowed === 'MALE_ONLY';

    const segColorCfg = segment ? COLOR_OPTIONS.find(c => c.id === segment.color) : undefined;
    const seatPrice = seatObj.fare || segment?.fare || 550;

    return (
      <button
        key={seatObj.seatId}
        type="button"
        disabled={!isAvailable}
        onClick={() => toggleSeatSelection(seatObj.seatId, seatObj.status)}
        title={dynamicLock ? `${dynamicLock.reason} (${dynamicLock.genderAllowed === 'FEMALE_ONLY' ? 'শুধুমাত্র নারী' : 'শুধুমাত্র পুরুষ'})` : `সিট: ${seatObj.seatNumber}`}
        className={`w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0 p-1.5 rounded-2xl flex flex-col items-center justify-between text-base font-black transition-all duration-200 ease-out relative select-none cursor-pointer ${
          isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/70 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-700 opacity-60 shadow-xs cursor-not-allowed'
            : isHeld
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/70 dark:to-amber-900/70 text-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 opacity-75 shadow-xs cursor-not-allowed'
            : isSelected
            ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border-2 border-blue-300 shadow-xl shadow-blue-500/40 ring-4 ring-blue-400/40 -translate-y-1 z-10'
            : seatObj.isExtra
            ? 'bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/80 dark:to-purple-900/80 text-purple-950 dark:text-purple-100 border-2 border-purple-400 dark:border-purple-500 shadow-sm hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isFemaleOnly
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/80 dark:to-pink-900/80 text-pink-950 dark:text-pink-100 border-2 border-pink-400 dark:border-pink-500 shadow-sm shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/30 hover:border-pink-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isMaleOnly
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 hover:border-blue-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : isMiddleSeat
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/80 dark:to-amber-900/80 text-amber-950 dark:text-amber-100 border-2 border-amber-400 dark:border-amber-500 shadow-sm hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
            : segColorCfg
            ? `bg-gradient-to-b ${segColorCfg.bgClass} ${segColorCfg.textClass} border-2 ${segColorCfg.borderClass} shadow-sm hover:shadow-lg hover:-translate-y-1 active:translate-y-0.5 active:scale-95`
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
        }`}
      >
        {/* Ergonomic Headrest Cushion Detail */}
        <div
          className={`w-10 h-1.5 rounded-full shadow-inner transition-all ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isHeld
              ? 'bg-amber-400'
              : seatObj.isExtra
              ? 'bg-purple-500'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : isMiddleSeat
              ? 'bg-amber-500'
              : segColorCfg
              ? segColorCfg.dotClass
              : 'bg-slate-400'
          }`}
        />

        {/* EXTRA LARGE CRISP SEAT NUMBER */}
        <span className={`text-base sm:text-lg font-black tracking-tight leading-none font-mono drop-shadow-xs ${isSelected ? 'text-white' : ''}`}>
          {seatObj.seatNumber}
        </span>

        {/* PROMINENT HIGH-CONTRAST AMOUNT BADGE */}
        <div
          className={`w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg overflow-hidden backdrop-blur-xs transition-colors ${
            isSelected
              ? 'bg-black/25 text-white border border-white/20'
              : 'bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5'
          }`}
        >
          {isSelected ? (
            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight flex items-center gap-1 text-white">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> ৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[10px] sm:text-xs font-black tracking-tight text-rose-800 dark:text-rose-200 leading-none">
              বুকড
            </span>
          ) : isHeld ? (
            <span className="text-[10px] sm:text-xs font-black tracking-tight text-amber-800 dark:text-amber-200 leading-none">
              হোল্ড
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight truncate">
              ৳{seatPrice}
            </span>
          )}

          {!isSelected && !isBooked && !isHeld && isFemaleOnly && (
            <span className="text-[9px] text-pink-800 dark:text-pink-300 font-black leading-none" title={dynamicLock?.reason || 'নারী সংরক্ষিত'}>
              {dynamicLock ? '♀ Lock' : '♀'}
            </span>
          )}
          {!isSelected && !isBooked && !isHeld && isMaleOnly && (
            <span className="text-[9px] text-blue-800 dark:text-blue-300 font-black leading-none" title={dynamicLock?.reason || 'পুরুষ সংরক্ষিত'}>
              {dynamicLock ? '♂ Lock' : '♂'}
            </span>
          )}
          {!isSelected && !isBooked && !isHeld && isMiddleSeat && (
            <span className="text-[8px] text-amber-800 dark:text-amber-200 font-black leading-none">MID</span>
          )}
        </div>
      </button>
    );
  }

  // Guaranteed Seat Slot Renderer (Never leaves any side blank!)
  function renderSeatSlot(rowCells: any[], r: number, c: number, isMiddle = false, segment?: FareRangeSegment) {
    let seatObj = rowCells.find(cell => cell.colIndex === c);

    if (!seatObj && (!isMiddle || (r === totalRows - 1 && (activeCapacity === 45 || activeCapacity === 42)))) {
      const rowChar = rowLetters[r] || `R${r + 1}`;
      let seatNum = '';
      if (r === totalRows - 1 && (activeCapacity === 45 || activeCapacity === 42)) {
        seatNum = `${rowChar}${c + 1}`;
      } else {
        const colDigit = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
        seatNum = `${rowChar}${colDigit}`;
      }

      seatObj = {
        seatId: `seat-${selectedTripId || 'trip'}-${seatNum}`,
        seatNumber: seatNum,
        rowIndex: r,
        colIndex: c,
        seatType: r < 5 ? 'VIP' : 'STANDARD',
        genderAllowed: r < 3 && (c === 0 || c === 1) ? 'FEMALE_ONLY' : 'ANY',
        fare: segment?.fare || (r < 5 ? 650 : r < 8 ? 550 : 500),
        fareZoneName: segment?.name || 'Standard',
        status: 'AVAILABLE'
      };
    }

    return renderRealisticCoachSeat(seatObj, isMiddle, segment);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Steps Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              ? 'কাস্টম সিট বিল্ডার ফরম্যাটে যে বিশ্ববিদ্যালয়ের জন্য যেমন সিট প্ল্যান ও ভাড়া কনফিগার করা হয়েছে, ঠিক সেভাবে বুকিং করুন।'
              : 'Select your university admission trip and pick seats matching the exact custom seat builder configuration.'}
          </p>
        </div>

        {/* Step Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {[
            { s: 1, label: language === 'bn' ? '১. ট্রিপ ও সিট' : '1. Seats' },
            { s: 2, label: language === 'bn' ? '২. যাত্রী তথ্য' : '2. Students' },
            { s: 3, label: language === 'bn' ? '৩. ছাড়' : '3. Discount' },
            { s: 4, label: language === 'bn' ? '৪. পেমেন্ট' : '4. Payment' }
          ].map((item) => (
            <button
              key={item.s}
              type="button"
              suppressHydrationWarning
              onClick={() => (step > item.s ? setStep(item.s as any) : null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                step === item.s
                  ? 'text-white shadow-xs'
                  : step > item.s
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
              style={step === item.s ? { backgroundColor: currentColor?.primaryHex || 'var(--primary-color)' } : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATIC FARE & SEAT SUMMARY BAR (FIXED IN PLACE, NON-FLOATING) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'bn' ? 'নির্বাচিত সিট ও গন্তব্য:' : 'Selected Seats & Route:'}
            </div>
            <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <span className="text-blue-600 dark:text-blue-400 font-mono">
                {selectedSeatIds.length > 0
                  ? `${selectedSeatIds.length}টি সিট (${selectedSeatIds.map(id => allCurrentSeats.find(s=>s.seatId===id)?.seatNumber).filter(Boolean).join(', ')})`
                  : (language === 'bn' ? 'কোনো সিট সিলেক্ট করা হয়নি' : 'No seat selected')}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{targetUniversity}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Discount Tag */}
          {isDiscountApplied && discountAmount > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider text-rose-500 font-black block">
                {language === 'bn' ? 'অনুমোদিত ছাড় (Less)' : 'Discount'}
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                - {formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* Gross & Final Net Amount Display */}
          <div className="text-right bg-blue-50 dark:bg-blue-950/80 px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-2xs">
            <span className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 font-black block">
              {language === 'bn' ? 'সর্বমোট প্রদেয় ভাড়া' : 'Total Net Fare'}
            </span>
            <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(netAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: SELECT TRIP, UNIVERSITY PRESET & SEATS */}
      {step === 1 && (
        <div className="space-y-6">
          {/* 1. Trip Selector (Large & Prominent) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-slate-50 to-transparent dark:from-slate-800/60 dark:via-slate-900 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Bus className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'bn' ? '১. শিডিউল ট্রিপ নির্বাচন করুন (Scheduled Trips)' : '1. Select Scheduled Admission Trip'}
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-9.5 font-medium">
                  {language === 'bn'
                    ? 'ভর্তি পরীক্ষার জন্য নির্ধারিত ট্রিপ বাছাই করুন — ট্রিপ সিলেক্ট করলে বাসের আসন বিন্যাস ও সিট ম্যাপ নিচে লোড হবে'
                    : 'Choose your scheduled trip to automatically load the verified bus layout and live seat availability.'}
                </p>
              </div>
              <Badge variant="primary" className="font-mono text-xs font-bold px-3 py-1.5 shadow-2xs">
                {trips.length} {language === 'bn' ? 'টি ট্রিপ প্রস্তুত' : 'Trips Available'}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((t) => {
                  const busType = t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED';
                  const busName = t.bus?.busName || t.bus?.bus_name || 'Express Coach';
                  const busNumber = t.bus?.busNumber || t.bus?.bus_number || '';
                  const routeName = t.route?.routeName || t.route?.route_name || 'Admission Route';
                  const capacity = t.bus?.capacity || activeCapacity || 40;
                  const isSelected = selectedTripId === t.id;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTripId(t.id);
                        setSelectedSeatIds([]);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 relative group cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-indigo-50/70 dark:from-blue-950/80 dark:via-slate-900 dark:to-indigo-950/50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md'
                      }`}
                    >
                      {/* Top Header inside Card */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80 w-full">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {t.tripCode || t.trip_code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'}
                            className="text-[11px] font-bold"
                          >
                            {busType === 'FEMALE' ? 'মহিলা স্পেশাল' : busType === 'MALE' ? 'ছাত্র স্পেশাল' : 'মিক্সড বাস'}
                          </Badge>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {language === 'bn' ? 'নির্বাচিত' : 'Selected'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Route Title */}
                      <div className="py-3 space-y-1">
                        <div className="text-base font-black text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{routeName}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 pl-5.5">
                          <Bus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{busName} {busNumber ? `(${busNumber})` : ''}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[11px] text-slate-500">{capacity} সিট</span>
                        </div>
                      </div>

                      {/* Footer: Departure & Fare */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs w-full">
                        <div className="space-y-0.5">
                          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">যাত্রা শুরুর সময়</div>
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{formatDate(t.departureDate)} • {formatTime(t.departureTime)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">ভাড়া</div>
                          <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(t.basePrice || 550)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 4. FARE RANGE COLOR CODE CARDS (Identical to Custom Seat Builder Canvas) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm sm:text-base font-black">
                  {language === 'bn' ? 'সারি ভিত্তিক ভাড়া সেগমেন্টেশন ও কালার কোডিং' : 'Fare Range & Color Segmentation'}
                </CardTitle>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {activeSegments.length} {language === 'bn' ? 'ভাড়া স্তর' : 'Fare Zones'}
              </span>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activeSegments.map((seg) => {
                  const colorCfg = COLOR_OPTIONS.find(c => c.id === seg.color) || COLOR_OPTIONS[0];
                  return (
                    <div
                      key={seg.id}
                      className={`p-3.5 rounded-2xl border-2 ${colorCfg.borderClass} bg-gradient-to-br ${colorCfg.bgClass} flex flex-col justify-between shadow-2xs`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.dotClass}`} />
                        <span className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                          {seg.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/10 dark:border-white/10">
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                          {seg.startRow}–{seg.endRow}
                        </span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          ৳{seg.fare}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 5. REALISTIC HIGH-DECK COACH FRAME (Both sides fully populated, identical to Custom Seat Builder) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-black">
                  <Armchair className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? 'বাসের লাইভ সিট নির্বাচন (Live Bus Seat Map)' : 'Select Passenger Seat(s)'}</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'বাসের খালি সিটে ক্লিক করে নির্বাচন করুন — উভয় পাশের (২+২) সব সিট থেকে পছন্দমতো বাছাই করুন'
                    : 'Click any available seat to select for this booking session (2+2 layout fully interactive)'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddExtraSeat}
                  className="text-xs font-bold border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 rounded-xl"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? '+ অতিরিক্ত সিট' : '+ Extra Seat'}
                </Button>
              </div>
            </CardHeader>

            {/* Status Legend Bar with Dynamic Gender Protection Info */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600"></span>
                  <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'খালি' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-400"></span>
                  <span className="text-slate-900 dark:text-white font-bold">{language === 'bn' ? 'নির্বাচিত' : 'Selected'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-pink-100 dark:bg-pink-950/80 border-2 border-pink-400"></span>
                  <span className="text-pink-700 dark:text-pink-300 font-bold">{language === 'bn' ? '♀ নারী সংরক্ষিত / সংলগ্ন লক' : 'Female Protected'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-blue-100 dark:bg-blue-950/80 border-2 border-blue-400"></span>
                  <span className="text-blue-700 dark:text-blue-300 font-bold">{language === 'bn' ? '♂ পুরুষ সংরক্ষিত / সংলগ্ন লক' : 'Male Protected'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-rose-500"></span>
                  <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'বুকড' : 'Booked'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500"></span>
                  <span className="text-slate-600 dark:text-slate-300">{language === 'bn' ? 'হোল্ড' : 'Held'}</span>
                </div>
              </div>

              <div className="font-mono text-xs font-bold text-blue-600">
                {selectedSeatIds.length} {language === 'bn' ? 'সিট সিলেক্টেড' : 'Seats Selected'}
              </div>
            </div>

            <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-100/70 dark:bg-slate-950/70 overflow-x-auto min-h-[600px]">
              {isLoadingSeats ? (
                <div className="py-20 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>লাইভ সিট ম্যাপ লোড হচ্ছে...</span>
                </div>
              ) : (
                /* REALISTIC HIGH-DECK COACH FRAME */
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-9 rounded-[3.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl relative">
                  {/* Bus Exterior Roof Marker & Mirrors */}
                  <div className="absolute -top-3.5 left-12 right-12 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-t-2xl opacity-70" />
                  <div className="absolute -left-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-l-md shadow-xs" title="Left Mirror" />
                  <div className="absolute -right-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-r-md shadow-xs" title="Right Mirror" />

                  {/* COCKPIT SECTION: Bonnet Engine Grill + Front Windshield + Driver Cabin + Door Steps */}
                  <div className="mb-6 pb-4 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                    {/* Windshield Glass */}
                    <div className="h-6 bg-blue-100/80 dark:bg-blue-950/60 rounded-t-2xl border-t-2 border-blue-300 dark:border-blue-800 mb-2.5 flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 font-mono">
                        {language === 'bn' ? 'সামনের উইন্ডশিল্ড গ্লাস' : 'FRONT WINDSHIELD GLASS'}
                      </span>
                    </div>

                    {/* Dashboard & Cockpit: Larger Door, Bonnet, and Driver Cabins */}
                    <div className="h-20 bg-slate-900 dark:bg-slate-950 rounded-2xl p-3 sm:p-4 flex items-center justify-between text-white shadow-inner relative overflow-hidden">
                      {/* Left: Passenger Entry Door / Gate */}
                      <div className="flex items-center gap-2.5 bg-emerald-950 border-2 border-emerald-500 px-4 py-2 rounded-2xl shadow-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm font-black text-emerald-400 leading-tight">
                            {language === 'bn' ? 'বাসের গেট' : 'ENTRY DOOR'}
                          </div>
                          <div className="text-[10px] text-emerald-200 font-bold leading-none mt-0.5">
                            {language === 'bn' ? 'প্রবেশদ্বার' : 'Entry'}
                          </div>
                        </div>
                      </div>

                      {/* Center: Bonnet / Engine Hood */}
                      <div className="text-center px-4 py-1.5 bg-slate-800 rounded-2xl border-2 border-slate-600 shadow-md">
                        <div className="text-xs font-black text-amber-400 font-mono tracking-wider">
                          {language === 'bn' ? 'বনেট / ইঞ্জিন' : 'ENGINE BONNET'}
                        </div>
                        <div className="text-[9px] text-slate-300 font-bold mt-0.5">Front Chassis</div>
                      </div>

                      {/* Right: Driver Cabin & Steering Wheel */}
                      <div className="flex items-center gap-2.5 bg-blue-950 border-2 border-blue-500 px-4 py-2 rounded-2xl text-right shadow-md">
                        <div>
                          <div className="text-xs sm:text-sm font-black text-blue-400 leading-tight">
                            {language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}
                          </div>
                          <div className="text-[10px] text-blue-200 font-bold leading-none mt-0.5">
                            {language === 'bn' ? 'কন্ট্রোল' : 'Cockpit'}
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-blue-600/50 border-2 border-blue-300 flex items-center justify-center text-xs font-black text-blue-100">
                          ✇
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REALISTIC SEATING GRID WITH EXTRA LARGE SEAT BOXES & ENLARGED MIDDLE AISLE BADGES (100% Exact match with Custom Seat Builder Canvas) */}
                  <div className="space-y-3.5">
                    {Array.from({ length: totalRows }).map((_, r) => {
                      const rowCells = tripSeats.filter(c => c.rowIndex === r);
                      const isLastRow = r === totalRows - 1;
                      const rowLabel = rowLetters[r] || `R${r + 1}`;
                      const rowSegment = getSegmentForRow(rowLabel);

                      return (
                        <div key={r} className="flex items-center justify-between gap-3">
                          {/* Left Seats: Col 0 & Col 1 */}
                          <div className="flex items-center gap-2.5">
                            {renderSeatSlot(rowCells, r, 0, false, rowSegment)}
                            {renderSeatSlot(rowCells, r, 1, false, rowSegment)}
                          </div>

                          {/* Middle Aisle Walkway OR 45-Seat Middle Seat (K3 on Row K) - ENLARGED & CLEAR */}
                          <div className="flex-1 text-center font-mono flex items-center justify-center">
                            {isLastRow && (activeCapacity === 45 || activeCapacity === 42) ? (
                              renderSeatSlot(rowCells, r, 2, true, rowSegment)
                            ) : (
                              <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[3.75rem]">
                                <span className="text-sm sm:text-base font-black tracking-wider text-slate-800 dark:text-slate-100 leading-none">
                                  {rowLabel}
                                </span>
                                {rowSegment && (
                                  <span className="text-[11px] font-black font-mono text-blue-600 dark:text-blue-400 mt-1 leading-none">
                                    ৳{rowSegment.fare}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Seats: Col 3 & Col 4 */}
                          <div className="flex items-center gap-2.5">
                            {renderSeatSlot(rowCells, r, 3, false, rowSegment)}
                            {renderSeatSlot(rowCells, r, 4, false, rowSegment)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rear Passenger Bench Notice */}
                  <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono font-black">
                    {activeCapacity === 45
                      ? (language === 'bn' ? '★ ৪৫ সিট: শেষ সারিতে ৫টি সিট (K1, K2, K3 মাঝে, K4, K5)' : '★ 45-Seat: 5 Seats on Row K with K3 in Center Walkway')
                      : activeCapacity === 40
                      ? (language === 'bn' ? '★ ৪০ সিট: ১০ সারি × ৪ সিট (২+২ স্ট্যান্ডার্ড কোচ)' : '★ 40-Seat: 10 Rows of 4 (2+2 Standard Coach)')
                      : `${activeCapacity} Seats Layout`}
                  </div>

                  {/* Extra / Overload Seats Section */}
                  {extraSeats.length > 0 && (
                    <div className="mt-5 pt-4 border-t-2 border-purple-300 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/40 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-black text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span>{language === 'bn' ? 'অতিরিক্ত / কনসেশন সিট' : 'Extra / Overload Seats'} ({extraSeats.length})</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono font-bold">
                          {language === 'bn' ? 'সিটে ক্লিক করে সিলেক্ট করুন' : 'Click to select'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {extraSeats.map((ex) => (
                          <div key={ex.seatId} className="relative group">
                            {renderRealisticCoachSeat(ex)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveExtraSeat(ex.seatId);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-md hover:bg-rose-700 transition-all z-30"
                              title="Remove extra seat"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                {language === 'bn' ? 'মোট নির্বাচিত সিট ও আনুমানিক ভাড়া:' : 'Selected Seats & Estimated Fare:'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(grossAmount)}
                </span>
                <Badge variant="primary" className="font-mono font-bold text-xs px-2.5 py-1">
                  {selectedSeatIds.length} {language === 'bn' ? 'সিট সিলেক্টেড' : 'Seats'}
                </Badge>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={selectedSeatIds.length === 0}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto font-black shadow-lg shadow-blue-500/25 rounded-2xl px-8 text-sm sm:text-base py-3"
            >
              {language === 'bn'
                ? `যাত্রী তথ্যে এগিয়ে যান (${selectedSeatIds.length} সিট)`
                : `Continue to Passenger Details (${selectedSeatIds.length} Seats)`}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: PASSENGER DETAILS */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">
                    {language === 'bn'
                      ? `যাত্রী ও শিক্ষার্থী তথ্য (${passengers.length} জন যাত্রী)`
                      : `Passenger Details (${passengers.length} Passengers)`}
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'bn'
                      ? 'প্রতিটি নির্বাচিত সিটের জন্য শিক্ষার্থী বা অভিভাবকের নাম ও মোবাইল নম্বর লিখুন'
                      : 'Enter student and guardian contact details for each allocated seat'}
                  </p>
                </div>
                <Badge variant="primary" className="font-bold">
                  {targetUniversity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6">
              {/* 1. Journey Direction & Multi-Leg Config Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bus className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? 'যাত্রার ধরণ নির্ধারণ করুন (Journey Direction)' : 'Journey Direction'}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                    {journeyType === 'ROUND_TRIP' ? 'উভয়মুখী (ফুল ভাড়া)' : journeyType === 'ASYMMETRIC' ? 'গার্ডিয়ান স্প্লিট' : 'হাফ টিকিট (৫০% ভাড়া)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setJourneyType('ROUND_TRIP')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      journeyType === 'ROUND_TRIP'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>🚌</span>
                      <span>উভয়মুখী</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5 font-normal">যাওয়া + আসা</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJourneyType('OUTBOUND_ONLY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      journeyType === 'OUTBOUND_ONLY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>➡️</span>
                      <span>শুধু যাওয়া</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5 font-normal">৫০% হাফ ভাড়া</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJourneyType('RETURN_ONLY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      journeyType === 'RETURN_ONLY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>⬅️</span>
                      <span>শুধু আসা</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5 font-normal">৫০% হাফ ভাড়া</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJourneyType('ASYMMETRIC')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      journeyType === 'ASYMMETRIC'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span>গার্ডিয়ান স্প্লিট</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5 font-normal">যাওয়া ২ জন, আসা ১ জন</span>
                  </button>
                </div>

                {/* Per-seat leg config if ASYMMETRIC */}
                {journeyType === 'ASYMMETRIC' && selectedSeatIds.length > 0 && (
                  <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block">
                      প্রতিটি সিটের জন্য যাওয়ার/আসার ধরণ নির্বাচন করুন:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedSeatIds.map((sId, idx) => {
                        const sObj = allCurrentSeats.find(s => s.seatId === sId);
                        const sLabel = sObj?.seatNumber || `Seat ${idx + 1}`;
                        const baseFare = sObj?.fare || 550;
                        const curLeg = seatLegs[sId] || (idx === 0 ? 'ROUND_TRIP' : 'OUTBOUND_ONLY');
                        return (
                          <div key={sId} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/70 rounded-lg">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                              সিট {sLabel} ({idx === 0 ? 'শিক্ষার্থী' : 'অভিভাবক'}):
                            </span>
                            <select
                              value={curLeg}
                              onChange={(e) => {
                                setSeatLegs({
                                  ...seatLegs,
                                  [sId]: e.target.value as any
                                });
                              }}
                              className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              <option value="ROUND_TRIP">উভয়মুখী - ৳{baseFare}</option>
                              <option value="OUTBOUND_ONLY">শুধু যাওয়া - ৳{Math.round(baseFare * 0.5)}</option>
                              <option value="RETURN_ONLY">শুধু আসা - ৳{Math.round(baseFare * 0.5)}</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Boarding & Dropping Points Selector */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BoardingPointSelector
                  boardingPoint={boardingPoint}
                  onBoardingChange={setBoardingPoint}
                  droppingPoint={droppingPoint}
                  onDroppingChange={setDroppingPoint}
                />
              </div>

              {/* Smart Gender-Adjacent & Guardian Protection Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200 shadow-2xs">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-blue-900 dark:text-blue-300">
                    {language === 'bn' ? '🛡️ সংলগ্ন সিট জেন্ডার প্রোটেকশন ও অভিভাবক সুবিধা' : 'Gender-Adjacent Seat Protection & Guardian Exemption'}
                  </div>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {language === 'bn'
                      ? 'যদি কোনো নারী বা পুরুষ একা সিট কাটেন, তবে তার পাশের সংলগ্ন সিটটি একই জেন্ডারের জন্য স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে। তবে শিক্ষার্থী ও তার বৈধ অভিভাবক (বাবা, মা, ভাই, বোন, স্বামী/স্ত্রী) একসাথে উভয় সিট বুক করতে পারবেন।'
                      : 'When a single seat is booked, the adjacent seat is automatically gender-protected. Students accompanied by legal guardians (Father, Mother, Brother, Sister, Spouse) may book adjacent seats together.'}
                  </p>
                </div>
              </div>

              {passengers.map((p, idx) => {
                const seatObj = allCurrentSeats.find(s => s.seatId === p.seatId);
                const seatLabel = seatObj?.seatNumber || `Seat #${idx + 1}`;

                return (
                  <div key={p.seatId} className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span
                          suppressHydrationWarning
                          className="w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: currentColor?.primaryHex || 'var(--primary-color)' }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-black text-base text-slate-900 dark:text-white">
                            {language === 'bn' ? `সিট নম্বর ${seatLabel}` : `Seat ${seatLabel}`}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-mono font-black">
                            ৳{seatObj?.fare || selectedTrip?.basePrice || 550}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={p.passengerType}
                          onChange={(e) => handleUpdatePassenger(p.seatId, { passengerType: e.target.value as any })}
                          className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          <option value="STUDENT">{language === 'bn' ? 'ভর্তি পরীক্ষার্থী' : 'Admission Student'}</option>
                          <option value="GUARDIAN">{language === 'bn' ? 'অভিভাবক' : 'Guardian'}</option>
                        </select>

                        <select
                          value={p.gender}
                          onChange={(e) => handleUpdatePassenger(p.seatId, { gender: e.target.value as any })}
                          className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          <option value="FEMALE">{language === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                          <option value="MALE">{language === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Dedicated In-Card Gender Warning Alert */}
                    {genderWarningModal && genderWarningModal.seatNumber === seatLabel && (
                      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-200 text-xs font-bold animate-pulse shadow-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div className="flex-1">
                          <span className="block font-black text-xs text-rose-900 dark:text-rose-100">{genderWarningModal.title}</span>
                          <span className="font-medium text-[11px] opacity-95">{genderWarningModal.message}</span>
                        </div>
                      </div>
                    )}

                    {/* Auto-suggested Passenger Name from Previous Records */}
                    {suggestedPassengerMap[p.seatId] && (
                      <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/70 dark:via-indigo-950/60 dark:to-blue-950/70 border-2 border-blue-400 dark:border-blue-600 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm shadow-blue-500/30">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider font-mono">
                                💡 এই নম্বরে পূর্বের রেকর্ড পাওয়া গেছে
                              </span>
                              {suggestedPassengerMap[p.seatId].passengerType === 'STUDENT' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold border border-blue-300 dark:border-blue-700">
                                  ভর্তি পরীক্ষার্থী
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold border border-purple-300 dark:border-purple-700">
                                  অভিভাবক
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="text-blue-950 dark:text-blue-100">{suggestedPassengerMap[p.seatId].name}</span>
                              <span className="text-xs text-slate-500 font-medium font-mono">({suggestedPassengerMap[p.seatId].phone})</span>
                              {suggestedPassengerMap[p.seatId].institution && (
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                  • {suggestedPassengerMap[p.seatId].institution}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              const sug = suggestedPassengerMap[p.seatId];
                              handleUpdatePassenger(p.seatId, {
                                passengerName: sug.name,
                                gender: sug.gender || p.gender,
                                passengerType: sug.passengerType || p.passengerType,
                                admissionId: sug.admissionId || p.admissionId,
                                institution: sug.institution || p.institution,
                                guardianPhone: sug.guardianPhone || p.guardianPhone,
                                guardianRelationship: (sug.guardianRelationship as any) || p.guardianRelationship
                              });
                              setSuggestedPassengerMap(prev => {
                                const next = { ...prev };
                                delete next[p.seatId];
                                return next;
                              });
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/30 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            এই নাম ব্যবহার করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSuggestedPassengerMap(prev => {
                                const next = { ...prev };
                                delete next[p.seatId];
                                return next;
                              });
                            }}
                            className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            title="সাজেশন বাতিল"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                      {/* 1. Passenger Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {language === 'bn' ? 'যাত্রীর পূর্ণ নাম (Full Name) *' : 'Passenger Full Name *'}
                        </label>
                        <input
                          type="text"
                          placeholder={language === 'bn' ? 'যেমন: সুমাইয়া আক্তার' : 'e.g. Sumaiya Akter'}
                          value={p.passengerName}
                          onChange={(e) => handleUpdatePassenger(p.seatId, { passengerName: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>

                      {/* 2. Passenger Phone + Large WhatsApp / Normal Buttons */}
                      <div className="space-y-1.5">
                        <PhoneInput
                          label={language === 'bn' ? 'যাত্রীর মোবাইল নম্বর (১১ ডিজিট)' : 'Passenger Mobile Number'}
                          value={p.passengerPhone}
                          onChange={(val) => handleUpdatePassenger(p.seatId, { passengerPhone: val })}
                          required
                          showOperatorBadge
                          showCharacterCount
                        />
                        {/* BIG WhatsApp & Normal Call Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePassenger(p.seatId, { phoneType: 'NORMAL' })}
                            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              p.phoneType === 'NORMAL'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <Phone className={`w-4 h-4 shrink-0 ${p.phoneType === 'NORMAL' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                            <span>সাধারণ কল (Call)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePassenger(p.seatId, { phoneType: 'WHATSAPP' })}
                            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              p.phoneType === 'WHATSAPP' || !p.phoneType
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <WhatsAppIcon className={`w-4 h-4 shrink-0 ${p.phoneType === 'WHATSAPP' || !p.phoneType ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            <span>WhatsApp (ডিফল্ট)</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Guardian Emergency Phone + Large Buttons */}
                      <div className="space-y-1.5">
                        <PhoneInput
                          label={language === 'bn' ? 'অভিভাবকের নম্বর (ঐচ্ছিক)' : 'Guardian Phone (Optional)'}
                          value={p.guardianPhone || ''}
                          onChange={(val) => handleUpdatePassenger(p.seatId, { guardianPhone: val })}
                          placeholder="01XXXXXXXXX"
                          showOperatorBadge
                          showCharacterCount
                        />
                        {/* BIG WhatsApp & Normal Call Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePassenger(p.seatId, { guardianPhoneType: 'NORMAL' })}
                            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              p.guardianPhoneType === 'NORMAL'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <Phone className={`w-4 h-4 shrink-0 ${p.guardianPhoneType === 'NORMAL' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                            <span>সাধারণ কল (Call)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePassenger(p.seatId, { guardianPhoneType: 'WHATSAPP' })}
                            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              p.guardianPhoneType === 'WHATSAPP' || !p.guardianPhoneType
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <WhatsAppIcon className={`w-4 h-4 shrink-0 ${p.guardianPhoneType === 'WHATSAPP' || !p.guardianPhoneType ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            <span>WhatsApp (ডিফল্ট)</span>
                          </button>
                        </div>
                      </div>

                      {/* 4. Admission Roll / Guardian Relationship */}
                      {p.passengerType === 'STUDENT' ? (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'bn' ? 'ভর্তি পরীক্ষার রোল / আইডি (ঐচ্ছিক)' : 'Admission Roll / ID (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="RU-2026-A-10892 (ঐচ্ছিক)"
                            value={p.admissionId || ''}
                            onChange={(e) => handleUpdatePassenger(p.seatId, { admissionId: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                            {language === 'bn' ? 'এডমিট কার্ড না পেয়ে থাকলে ফাঁকা রাখুন' : 'Leave blank if admit card is not yet issued'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'bn' ? 'শিক্ষার্থীর সাথে সম্পর্ক (Guardian Relationship) *' : 'Relationship with Student *'}
                          </label>
                          <select
                            value={p.guardianRelationship || 'FATHER'}
                            onChange={(e) => handleUpdatePassenger(p.seatId, { guardianRelationship: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="FATHER">{language === 'bn' ? 'বাবা (Father)' : 'Father'}</option>
                            <option value="MOTHER">{language === 'bn' ? 'মা (Mother)' : 'Mother'}</option>
                            <option value="BROTHER">{language === 'bn' ? 'আপন ভাই (Brother)' : 'Brother'}</option>
                            <option value="SISTER">{language === 'bn' ? 'আপন বোন (Sister)' : 'Sister'}</option>
                            <option value="SPOUSE">{language === 'bn' ? 'স্বামী / স্ত্রী (Spouse)' : 'Spouse'}</option>
                            <option value="UNCLE">{language === 'bn' ? 'চাচা / মামা / খালু (Uncle)' : 'Uncle'}</option>
                            <option value="AUNT">{language === 'bn' ? 'খালা / ফুফু / চাচি (Aunt)' : 'Aunt'}</option>
                            <option value="OTHER">{language === 'bn' ? 'অন্যান্য বৈধ অভিভাবক (Other)' : 'Other'}</option>
                          </select>
                        </div>
                      )}

                      {/* 5. Target University & Unit - FULL WIDTH */}
                      {p.passengerType === 'STUDENT' && (
                        <div className="sm:col-span-2 space-y-1.5 pt-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয় ও ইউনিট (ট্রিপ নির্ধারিত - অপরিবর্তনযোগ্য)' : 'Target University & Unit (Pre-locked from Trip)'}
                          </label>
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 cursor-not-allowed select-none">
                            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{targetUniversity} (Admission Candidate)</span>
                            <span className="ml-auto text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                              🔒 {language === 'bn' ? 'অপরিবর্তনযোগ্য' : 'Locked'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-2xl px-5 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'পেছনে যান (সিট ম্যাপ)' : 'Back to Seat Map'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setErrorMessage(null);
                const bdPhoneRegex = /^01[3-9]\d{8}$/;
                for (let i = 0; i < passengers.length; i++) {
                  const p = passengers[i];
                  const sLabel = allCurrentSeats.find(s => s.seatId === p.seatId)?.seatNumber || `সিট #${i + 1}`;
                  if (!p.passengerName.trim()) {
                    setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর যাত্রীর নাম আবশ্যক।` : `Passenger name for Seat ${sLabel} is required.`);
                    return;
                  }
                  const cleanPhone = p.passengerPhone.replace(/[\s-]/g, '');
                  if (!cleanPhone) {
                    setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর আবশ্যক।` : `Passenger mobile for Seat ${sLabel} is required.`);
                    return;
                  }
                  if (!bdPhoneRegex.test(cleanPhone)) {
                    setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর (${p.passengerPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী নম্বর (যেমন: 017XXXXXXXX) দিন।` : `Invalid 11-digit BD mobile number.`);
                    return;
                  }
                  if (p.guardianPhone && p.guardianPhone.trim()) {
                    const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
                    if (!bdPhoneRegex.test(cleanGPhone)) {
                      setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর অভিভাবকের মোবাইল নম্বর (${p.guardianPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক নম্বর দিন।` : `Invalid 11-digit guardian phone number.`);
                      return;
                    }
                  }
                }
                const pairValidation = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
                if (!pairValidation.isValid) {
                  setErrorMessage(pairValidation.message || 'Gender or Guardian validation failed.');
                  return;
                }
                setStep(3);
              }}
              className="font-bold rounded-2xl shadow-md px-6"
            >
              {language === 'bn' ? 'ছাড় ও কনসেশন ধাপে যান' : 'Continue to Discount'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: CONCESSIONS & DISCOUNTS */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-black">
                {language === 'bn' ? 'টিকিটের দাম Less / বিশেষ ছাড় ও কুপন' : 'Ticket Fare Discount, Coupon & Reference'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6">
              {/* Coupon Code Section (Hidden Publicly, Staff/Campaign Input Only) */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-black text-sm">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'bn' ? 'মার্কেটিং প্রমো / কুপন কোড (Marketing Promo Code)' : 'Marketing Promo / Coupon Code'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {appliedCoupon && (
                      <Badge variant="primary" className="bg-emerald-600 text-white font-bold text-xs">
                        {language === 'bn' ? 'কুপন কার্যকর' : 'Applied'}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsStaffCouponModalOpen(true)}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'অফিস কুপন ভিউ (স্টাফ)' : 'Staff Coupon View'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'মার্কেটিং থেকে প্রাপ্ত কোডটি লিখুন...' : 'Enter customer promo code...'}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl uppercase font-mono font-bold tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {appliedCoupon ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveCoupon}
                      className="rounded-xl font-bold border-rose-300 text-rose-600 hover:bg-rose-50"
                    >
                      {language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleApplyCoupon}
                      className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-md shadow-emerald-600/25"
                    >
                      {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
                    </Button>
                  )}
                </div>

                {couponMessage && (
                  <p className={`text-xs font-bold ${appliedCoupon ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {couponMessage}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>{language === 'bn' ? '💡 ক্যাম্পেইন বা সোশ্যাল মিডিয়া বিজ্ঞাপন দেখে আসা শিক্ষার্থীদের কোডটি এখানে দিন।' : 'Enter the code student received from marketing campaign.'}</span>
                  <Link href="/marketing/coupons" target="_blank" className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <span>{language === 'bn' ? 'কুপন ম্যানেজার ↗' : 'Coupon Manager ↗'}</span>
                  </Link>
                </div>
              </div>

              {/* Discount Activation Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5 cursor-pointer" onClick={() => setIsDiscountApplied(!isDiscountApplied)}>
                  <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === 'bn' ? 'টিকিটের মূল্য ম্যানুয়ালি ছাড় / কম রাখা হয়েছে কি? (Manual Less / Discount)' : 'Is Ticket Fare Discounted / Less?'}</span>
                    {isDiscountApplied && (
                      <Badge variant="primary" className="text-[10px] font-bold">
                        {language === 'bn' ? 'ছাড় সক্রিয়' : 'Active'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn' ? 'বিশেষ কনসেশন, শিক্ষক/কর্মকর্তা রেফারেন্স বা দরিদ্র তহবিল ছাড় প্রযোজ্য হলে চালু করুন' : 'Enable if special concession, faculty reference or financial subsidy applies'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDiscountApplied(!isDiscountApplied)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    isDiscountApplied ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isDiscountApplied ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {isDiscountApplied && (
                <div className="p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-950/30 rounded-3xl border border-blue-200 dark:border-blue-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'ছাড়ের ধরণ (Discount Type)' : 'Discount Type'}
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={discountType === 'FIXED' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setDiscountType('FIXED')}
                          className="flex-1 rounded-xl font-bold"
                        >
                          {language === 'bn' ? 'নির্দিষ্ট টাকা (Fixed ৳)' : 'Fixed ৳'}
                        </Button>
                        <Button
                          type="button"
                          variant={discountType === 'PERCENTAGE' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setDiscountType('PERCENTAGE')}
                          className="flex-1 rounded-xl font-bold"
                        >
                          {language === 'bn' ? 'শতাংশ (Percentage %)' : 'Percentage %'}
                        </Button>
                      </div>
                    </div>

                    <Input
                      label={language === 'bn' ? (discountType === 'FIXED' ? 'ছাড়ের পরিমাণ (টাকা) *' : 'ছাড়ের হার (%) *') : (discountType === 'FIXED' ? 'Discount Amount (৳) *' : 'Discount Rate (%) *')}
                      type="number"
                      min="0"
                      value={discountRate || ''}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                      placeholder="0"
                      required
                    />

                    {/* Authorized Reference Field with Dropdown Presets & Manual Input */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'অনুমোদনকারী রেফারেন্স (কার নির্দেশে ছাড় দেওয়া হলো) *' : 'Authorized Reference (Who Approved the Discount) *'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={authorizerPresets.includes(discountReference) ? discountReference : (discountReference ? 'CUSTOM' : '')}
                          onChange={(e) => {
                            if (e.target.value !== 'CUSTOM') {
                              setDiscountReference(e.target.value);
                            }
                          }}
                          className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">{language === 'bn' ? '-- পদবী নির্বাচন করুন --' : '-- Select Authorizer Role --'}</option>
                          {authorizerPresets.map((preset) => (
                            <option key={preset} value={preset}>{preset}</option>
                          ))}
                          <option value="CUSTOM">{language === 'bn' ? '✍️ অন্যান্য (ম্যানুয়ালি লিখুন / Custom)' : '✍️ Custom / Type Manually'}</option>
                        </select>

                        <input
                          type="text"
                          placeholder={language === 'bn' ? 'অনুমোদনকারীর নাম বা রেফারেন্স লিখুন *' : 'Enter Authorizer Name or Reference *'}
                          value={discountReference}
                          onChange={(e) => setDiscountReference(e.target.value)}
                          className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'bn' ? 'ড্রপডাউন থেকে দ্রুত পদবী বাছাই করতে পারেন অথবা যেকোনো নাম/রেফারেন্স টাইপ করতে পারেন।' : 'Select a preset role or write custom reference details.'}
                      </p>
                    </div>

                    {/* Discount Reason (Optional / Unrequired) */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'ছাড়ের কারণ / বিবরণ (ঐচ্ছিক)' : 'Discount Reason / Details (Optional)'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'যেমন: দরিদ্র ও মেধাবী শিক্ষার্থী সহায়তা, ভাই-বোন একসাথে বুকিং ছাড় (ঐচ্ছিক)' : 'e.g. Financial Subsidy, Sibling Bundle (Optional)'}
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Discount Summary Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>{language === 'bn' ? 'মোট টিকিট মূল্য (Gross Fare):' : 'Gross Fare:'}</span>
                  <span className="font-mono font-bold">{formatCurrency(grossAmount)}</span>
                </div>
                {isDiscountApplied && discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <span>{language === 'bn' ? `অনুমোদিত ছাড় (Less Amount${discountReference ? ` - রেফ: ${discountReference}` : ''}):` : 'Total Discount:'}</span>
                    <span className="font-mono font-bold">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>{language === 'bn' ? 'চূড়ান্ত প্রদেয় নেট ভাড়া (Net Amount):' : 'Final Net Amount:'}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(netAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-2xl px-5 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'পেছনে যান' : 'Back'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setErrorMessage(null);
                if (isDiscountApplied && discountAmount > 0 && !discountReference.trim()) {
                  setErrorMessage(language === 'bn' ? 'টিকিটের মূল্য ছাড় দেওয়ার জন্য রেফারেন্স বা অনুমোদনকারীর নাম আবশ্যক।' : 'Reference or authorizer name is required when applying a discount.');
                  return;
                }
                setStep(4);
              }}
              className="font-bold rounded-2xl shadow-md px-6"
            >
              {language === 'bn' ? 'পেমেন্ট ও কনফার্মেশনে যান' : 'Continue to Payment'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT & CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-black">
                {language === 'bn' ? 'পেমেন্ট কালেকশন ও চালান তৈরি' : 'Payment Collection & Ticket Generation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6">
              {/* Payment Channel Selectors with Authentic Brand Logos & Colors */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {language === 'bn' ? 'পেমেন্ট মেথড নির্বাচন করুন *' : 'Select Payment Method *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: 'BKASH',
                      name: 'bKash',
                      sub: 'বিকাশ',
                      Logo: BkashLogo,
                      activeBorder: 'border-[#E2136E]',
                      activeBg: 'bg-[#E2136E]/10 dark:bg-[#E2136E]/20',
                      activeRing: 'ring-[#E2136E]/50',
                      activeText: 'text-[#E2136E]'
                    },
                    {
                      id: 'NAGAD',
                      name: 'Nagad',
                      sub: 'নগদ',
                      Logo: NagadLogo,
                      activeBorder: 'border-[#F7941D]',
                      activeBg: 'bg-[#F7941D]/10 dark:bg-[#F7941D]/20',
                      activeRing: 'ring-[#F7941D]/50',
                      activeText: 'text-[#E35205]'
                    },
                    {
                      id: 'ROCKET',
                      name: 'Rocket',
                      sub: 'রকেট',
                      Logo: RocketLogo,
                      activeBorder: 'border-[#8C3494]',
                      activeBg: 'bg-[#8C3494]/10 dark:bg-[#8C3494]/20',
                      activeRing: 'ring-[#8C3494]/50',
                      activeText: 'text-[#8C3494]'
                    },
                    {
                      id: 'BANK_TRANSFER',
                      name: 'Bank',
                      sub: 'ব্যাংক',
                      Logo: BankTransferLogo,
                      activeBorder: 'border-[#003366]',
                      activeBg: 'bg-[#003366]/10 dark:bg-[#003366]/20',
                      activeRing: 'ring-[#003366]/50',
                      activeText: 'text-[#003366] dark:text-blue-300'
                    },
                    {
                      id: 'HAND_CASH',
                      name: 'Cash',
                      sub: 'কাউন্টার ক্যাশ',
                      Logo: CashMoneyLogo,
                      activeBorder: 'border-[#059669]',
                      activeBg: 'bg-[#059669]/10 dark:bg-[#059669]/20',
                      activeRing: 'ring-[#059669]/50',
                      activeText: 'text-[#059669]'
                    }
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    const LogoComp = m.Logo;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as any);
                          if (m.id === 'BANK_TRANSFER') {
                            setSenderSourceType('BANK_TO_MFS');
                          } else if (m.id === 'HAND_CASH') {
                            setSenderSourceType('CASH_RECEIPT');
                          } else {
                            setSenderSourceType('MFS_WALLET');
                          }
                        }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? `${m.activeBorder} ${m.activeBg} ring-2 ${m.activeRing} shadow-sm font-black`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <DynamicPaymentLogo
                          method={m.id}
                          customUrl={customLogos?.[m.id]}
                          className="w-8 h-8 shrink-0 drop-shadow-xs"
                        />
                        <div className="text-center leading-tight">
                          <span className={`block text-xs font-black ${isSelected ? m.activeText : ''}`}>
                            {m.name}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {m.sub}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Due Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={language === 'bn' ? 'জমা দেওয়া টাকার পরিমাণ (Paid Amount) *' : 'Paid Amount (৳) *'}
                  type="number"
                  min="0"
                  max={netAmount}
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  required
                />

                <Input
                  label={language === 'bn' ? 'বকেয়া টাকা (Due Amount)' : 'Remaining Due (৳)'}
                  value={formatCurrency(dueAmount)}
                  disabled
                />
              </div>

              {/* Sender Reference & Bank to bKash Support (MANDATORY & VALIDATED) */}
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-5">
                {/* Source Type Selector with Large Relative Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {language === 'bn' ? 'প্রেরকের পেমেন্ট মাধ্যম / চ্যানেল নির্বাচন করুন *' : 'Sender Payment Source / Channel *'}
                    </label>
                    <Badge variant="primary" className="text-[10px] font-bold">
                      {language === 'bn' ? 'বাধ্যতামূলক' : 'Required'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Dynamic Wallet Card - Morphs to Selected Payment Method */}
                    <div
                      onClick={() => setSenderSourceType('MFS_WALLET')}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                        senderSourceType === 'MFS_WALLET'
                          ? paymentMethod === 'BKASH'
                            ? 'bg-[#E2136E]/10 border-[#E2136E] shadow-md shadow-[#E2136E]/15 ring-2 ring-[#E2136E]/40'
                            : paymentMethod === 'NAGAD'
                            ? 'bg-[#F7941D]/10 border-[#F7941D] shadow-md shadow-[#F7941D]/15 ring-2 ring-[#F7941D]/40'
                            : paymentMethod === 'ROCKET'
                            ? 'bg-[#8C3494]/10 border-[#8C3494] shadow-md shadow-[#8C3494]/15 ring-2 ring-[#8C3494]/40'
                            : paymentMethod === 'HAND_CASH'
                            ? 'bg-[#059669]/10 border-[#059669] shadow-md shadow-[#059669]/15 ring-2 ring-[#059669]/40'
                            : 'bg-[#003366]/10 border-[#003366] shadow-md shadow-[#003366]/15 ring-2 ring-[#003366]/40'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Dynamic Official Logo for the Selected Wallet */}
                      <div className="shrink-0">
                        {paymentMethod === 'BKASH' ? (
                          <BkashLogo className="w-11 h-11 drop-shadow-md" />
                        ) : paymentMethod === 'NAGAD' ? (
                          <NagadLogo className="w-11 h-11 drop-shadow-md" />
                        ) : paymentMethod === 'ROCKET' ? (
                          <RocketLogo className="w-11 h-11 drop-shadow-md" />
                        ) : paymentMethod === 'HAND_CASH' ? (
                          <CashMoneyLogo className="w-11 h-11 drop-shadow-md" />
                        ) : (
                          <BankTransferLogo className="w-11 h-11 drop-shadow-md" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {paymentMethod === 'BKASH'
                              ? (language === 'bn' ? 'বিকাশ ওয়ালেট নম্বর' : 'bKash Wallet Number')
                              : paymentMethod === 'NAGAD'
                              ? (language === 'bn' ? 'নগদ ওয়ালেট নম্বর' : 'Nagad Wallet Number')
                              : paymentMethod === 'ROCKET'
                              ? (language === 'bn' ? 'রকেট ওয়ালেট নম্বর' : 'Rocket Wallet Number')
                              : paymentMethod === 'HAND_CASH'
                              ? (language === 'bn' ? 'কাউন্টার ক্যাশ রিসিট' : 'Counter Cash Receipt')
                              : (language === 'bn' ? 'সরাসরি ব্যাংক অ্যাকাউন্ট ডিপোজিট' : 'Direct Bank Deposit')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {paymentMethod === 'BKASH'
                            ? (language === 'bn' ? 'গ্রাহকের বিকাশ পার্সোনাল / এজেন্ট নম্বর' : 'Personal or agent bKash number')
                            : paymentMethod === 'NAGAD'
                            ? (language === 'bn' ? 'গ্রাহকের নগদ পার্সোনাল / উদ্যোক্তা নম্বর' : 'Personal or Uddokta Nagad number')
                            : paymentMethod === 'ROCKET'
                            ? (language === 'bn' ? 'গ্রাহকের ১২ ডিজিট রকেট অ্যাকাউন্ট নম্বর' : '12-digit Rocket account number')
                            : paymentMethod === 'HAND_CASH'
                            ? (language === 'bn' ? 'কাউন্টার মানি রিসিট নম্বর বা পেয়ার নাম' : 'Money receipt no or payer name')
                            : (language === 'bn' ? 'ব্যাংক একাউন্ট বা এনপিএসবি রেফারেন্স' : 'Bank A/C or NPSB transfer')}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        senderSourceType === 'MFS_WALLET'
                          ? paymentMethod === 'BKASH'
                            ? 'border-[#E2136E] bg-[#E2136E] text-white'
                            : paymentMethod === 'NAGAD'
                            ? 'border-[#F7941D] bg-[#F7941D] text-white'
                            : paymentMethod === 'ROCKET'
                            ? 'border-[#8C3494] bg-[#8C3494] text-white'
                            : 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300'
                      }`}>
                        {senderSourceType === 'MFS_WALLET' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* 2. Bank to bKash / Bank Transfer Card */}
                    <div
                      onClick={() => setSenderSourceType('BANK_TO_MFS')}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                        senderSourceType === 'BANK_TO_MFS'
                          ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/40'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Big Relative Bank & Card Brand Logos Badge */}
                      <div className="flex items-center -space-x-2 shrink-0">
                        <IslamiBankLogo className="w-10 h-10 drop-shadow-sm z-30" />
                        <DbblLogo className="w-10 h-10 drop-shadow-sm z-20" />
                        <VisaMastercardLogo className="w-10 h-10 drop-shadow-sm z-10" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {language === 'bn'
                              ? `ব্যাংক থেকে ${paymentMethod === 'NAGAD' ? 'নগদ' : paymentMethod === 'ROCKET' ? 'রকেট' : 'বিকাশ'} / ব্যাংক`
                              : `Bank to ${paymentMethod === 'NAGAD' ? 'Nagad' : paymentMethod === 'ROCKET' ? 'Rocket' : 'bKash'} / Bank`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {language === 'bn' ? 'CellFin, NexusPay, Astha, Citytouch বা কার্ড' : 'Internet banking or debit/credit card'}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${senderSourceType === 'BANK_TO_MFS' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                        {senderSourceType === 'BANK_TO_MFS' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. MFS WALLET INPUT SECTION */}
                {senderSourceType === 'MFS_WALLET' && (
                  <div className="space-y-2 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {paymentMethod === 'BKASH'
                          ? (language === 'bn' ? 'প্রেরকের বিকাশ মোবাইল নম্বর (১১ ডিজিট) *' : 'Sender bKash Mobile Number (11-digit) *')
                          : paymentMethod === 'NAGAD'
                          ? (language === 'bn' ? 'প্রেরকের নগদ মোবাইল নম্বর (১১ ডিজিট) *' : 'Sender Nagad Mobile Number (11-digit) *')
                          : paymentMethod === 'ROCKET'
                          ? (language === 'bn' ? 'প্রেরকের রকেট অ্যাকাউন্ট নম্বর (১১/১২ ডিজিট) *' : 'Sender Rocket Account Number *')
                          : (language === 'bn' ? 'প্রেরক নম্বর / রেফারেন্স *' : 'Sender Phone / Reference *')}
                      </label>
                      {senderRef && !/^01[3-9]\d{8}$/.test(senderRef.replace(/[\s-]/g, '')) ? (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                          ⚠️ {language === 'bn' ? 'সঠিক ১১ ডিজিট নম্বর লিখুন' : 'Invalid 11-digit BD Mobile'}
                        </span>
                      ) : senderRef && /^01[3-9]\d{8}$/.test(senderRef.replace(/[\s-]/g, '')) ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          ✅ {language === 'bn' ? 'নম্বর সঠিক' : 'Valid Number'}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold pointer-events-none select-none z-10">
                          {paymentMethod === 'BKASH' ? (
                            <BkashLogo className="w-4 h-4" />
                          ) : paymentMethod === 'NAGAD' ? (
                            <NagadLogo className="w-4 h-4" />
                          ) : paymentMethod === 'ROCKET' ? (
                            <RocketLogo className="w-4 h-4" />
                          ) : paymentMethod === 'HAND_CASH' ? (
                            <CashMoneyLogo className="w-4 h-4" />
                          ) : (
                            <BankTransferLogo className="w-4 h-4" />
                          )}
                          <span className="text-blue-600 dark:text-blue-400">+880</span>
                          <span className="text-[10px] text-slate-400 font-normal">(০৮৮)</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={11}
                          placeholder="017XXXXXXXX"
                          value={senderRef}
                          onKeyDown={(e) => {
                            const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                            if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
                            if (!/^[\d০-৯]$/.test(e.key)) {
                              e.preventDefault();
                              return;
                            }
                            const target = e.target as HTMLInputElement;
                            const hasSelection = target.selectionStart !== target.selectionEnd;
                            if (senderRef.length >= 11 && !hasSelection) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => setSenderRef(cleanAndLimitPhoneNumber(e.target.value).slice(0, 11))}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text');
                            setSenderRef(cleanAndLimitPhoneNumber(pasted).slice(0, 11));
                          }}
                          onInput={(e) => {
                            const el = e.target as HTMLInputElement;
                            if (el.value.length > 11) {
                              el.value = el.value.slice(0, 11);
                            }
                          }}
                          className={`w-full pl-36 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold border rounded-xl shadow-2xs focus:ring-2 focus:outline-none ${
                            senderRef && !isValidBdMobile(senderRef)
                              ? 'border-rose-400 focus:ring-rose-400'
                              : 'border-slate-300 dark:border-slate-700/80 focus:ring-blue-500'
                          }`}
                          required
                        />
                      </div>

                      {passengers[0]?.passengerPhone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSenderRef(cleanAndLimitPhoneNumber(passengers[0].passengerPhone))}
                          className="rounded-xl text-xs font-bold shrink-0 bg-blue-50/50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          {language === 'bn' ? 'যাত্রীর নম্বর কপি' : 'Use Passenger Phone'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. BANK TO MFS / BANK TRANSFER SECTION WITH OFFICIAL LOGOS & BRAND COLORS */}
                {senderSourceType === 'BANK_TO_MFS' && (
                  <div className="space-y-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'জনপ্রিয় ব্যাংক নির্বাচন করুন (অফিসিয়াল লোগোতে ক্লিক করুন) *' : 'Select Bank (Click Official Logo) *'}
                      </label>

                      {/* Interactive Visual Bank Grid with Authentic Brand Logos & Colors */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: 'Islami Bank (CellFin)',
                            name: 'ইসলামী ব্যাংক',
                            app: 'CellFin',
                            Logo: IslamiBankLogo,
                            activeStyle: 'border-[#00843D] bg-[#00843D]/10 ring-2 ring-[#00843D]',
                            badgeColor: 'bg-[#00843D] text-white'
                          },
                          {
                            id: 'DBBL (NexusPay / Rocket)',
                            name: 'ডাচ-বাংলা ব্যাংক',
                            app: 'NexusPay',
                            Logo: DbblLogo,
                            activeStyle: 'border-[#006838] bg-[#006838]/10 ring-2 ring-[#006838]',
                            badgeColor: 'bg-[#006838] text-white'
                          },
                          {
                            id: 'BRAC Bank (Astha)',
                            name: 'ব্র্যাক ব্যাংক',
                            app: 'Astha App',
                            Logo: BracBankLogo,
                            activeStyle: 'border-[#003366] bg-[#003366]/10 ring-2 ring-[#003366]',
                            badgeColor: 'bg-[#003366] text-[#FFB81C]'
                          },
                          {
                            id: 'City Bank (Citytouch)',
                            name: 'সিটি ব্যাংক',
                            app: 'Citytouch',
                            Logo: CityBankLogo,
                            activeStyle: 'border-[#E30613] bg-[#E30613]/10 ring-2 ring-[#E30613]',
                            badgeColor: 'bg-[#E30613] text-white'
                          },
                          {
                            id: 'Eastern Bank (Skybanking)',
                            name: 'ইস্টার্ন ব্যাংক',
                            app: 'Skybanking',
                            Logo: EblLogo,
                            activeStyle: 'border-[#003865] bg-[#003865]/10 ring-2 ring-[#003865]',
                            badgeColor: 'bg-[#003865] text-white'
                          },
                          {
                            id: 'Sonali Bank (e-Sheba)',
                            name: 'সোনালী ব্যাংক',
                            app: 'e-Sheba',
                            Logo: SonaliBankLogo,
                            activeStyle: 'border-[#006837] bg-[#006837]/10 ring-2 ring-[#006837]',
                            badgeColor: 'bg-[#006837] text-white'
                          },
                          {
                            id: 'MTB (Smart Banking)',
                            name: 'মিউচুয়াল ট্রাস্ট ব্যাংক',
                            app: 'MTB Smart',
                            Logo: MtbLogo,
                            activeStyle: 'border-[#0054A6] bg-[#0054A6]/10 ring-2 ring-[#0054A6]',
                            badgeColor: 'bg-[#0054A6] text-white'
                          },
                          {
                            id: 'Other Bank / Debit-Credit Card',
                            name: 'ভিসা / মাস্টারকার্ড',
                            app: 'Card to bKash',
                            Logo: VisaMastercardLogo,
                            activeStyle: 'border-[#0A1E40] bg-[#0A1E40]/10 ring-2 ring-[#0A1E40]',
                            badgeColor: 'bg-[#0A1E40] text-white'
                          }
                        ].map((b) => {
                          const isSelected = selectedBankName === b.id;
                          const BankLogoComp = b.Logo;

                          return (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBankName(b.id)}
                              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                isSelected
                                  ? `${b.activeStyle} shadow-sm font-black`
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 hover:border-slate-300'
                              }`}
                            >
                              <BankLogoComp className="w-10 h-10 shrink-0 drop-shadow-xs" />
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight">
                                  {b.name}
                                </span>
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 font-mono ${b.badgeColor}`}>
                                  {b.app}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'প্রেরক অ্যাকাউন্ট / কার্ড নম্বর / ডিপোজিটর নাম *' : 'Sender Bank Account / Card Number / Depositor Name *'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'যেমন: 2050XXXXXXXX বা প্রেরক অ্যাকাউন্ট নাম *' : 'e.g. 2050XXXXXXXX or Depositor Name *'}
                        value={senderRef}
                        onChange={(e) => setSenderRef(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'bn'
                          ? '💡 ব্যাংক অ্যাপ (যেমন: CellFin, NexusPay, Astha, Citytouch) বা ডেবিট/ক্রেডিট কার্ড থেকে বিকাশ/অ্যাকাউন্টে টাকা পাঠালে প্রেরকের অ্যাকাউন্ট/রেফারেন্স লিখুন।'
                          : 'Enter bank name and account reference when paid directly via Internet/Bank Banking to bKash.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. CASH RECEIPT SECTION */}
                {senderSourceType === 'CASH_RECEIPT' && (
                  <div className="space-y-1.5 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'কাউন্টার ক্যাশ রিসিট নম্বর / প্রদানকারীর নাম *' : 'Counter Cash Receipt / Payer Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: MR-2026-0812 বা প্রদানকারীর নাম *"
                      value={senderRef}
                      onChange={(e) => setSenderRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                )}

                {/* TrxID (STRICTLY OPTIONAL / UNREQUIRED) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'ট্রানজেকশন আইডি / TrxID (ঐচ্ছিক)' : 'Gateway Transaction ID (TrxID) (Optional)'}
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {language === 'bn' ? 'ঐচ্ছিক - না থাকলে ফাঁকা রাখুন' : 'Optional - Leave blank if not available'}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: BKASH9928X (ঐচ্ছিক)' : 'e.g. BKASH9928X (Optional)'}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Final Summary Card */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>{language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয়:' : 'Target University:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{targetUniversity}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>{language === 'bn' ? 'যাত্রী ও সিট তালিকা:' : 'Passengers & Seats:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {passengers.map(p => `${p.passengerName || 'Unnamed'} (${allCurrentSeats.find(s=>s.seatId===p.seatId)?.seatNumber}) [${p.phoneType === 'WHATSAPP' ? '💬 WA' : '📱 Call'}]`).join(', ')}
                  </span>
                </div>
                {isDiscountApplied && discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <span>{language === 'bn' ? 'অনুমোদিত ছাড় (Less):' : 'Discount / Less:'}</span>
                    <span className="font-bold font-mono">
                      - {formatCurrency(discountAmount)} {discountReference ? `(রেফ: ${discountReference})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>{language === 'bn' ? 'মোট নেট প্রদেয় বিল:' : 'Total Net Amount:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(netAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>{language === 'bn' ? 'জমা কালেকশন:' : 'Collected Cash/Digital:'}</span>
                  <span className="font-bold font-mono">{formatCurrency(paidAmount)}</span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
                    <span>{language === 'bn' ? 'বকেয়া থাকবে (Due):' : 'Remaining Due:'}</span>
                    <span className="font-mono">{formatCurrency(dueAmount)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(3)} className="rounded-2xl px-5 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'পেছনে যান' : 'Back'}
            </Button>
            <Button
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
              className="font-black shadow-lg shadow-blue-500/25 px-8 rounded-2xl text-sm sm:text-base py-3"
            >
              <Check className="w-5 h-5 mr-2" />
              {language === 'bn' ? 'বুকিং নিশ্চিত করুন ও টিকিট প্রিন্ট নিন' : 'Confirm Booking & Print Invoice'}
            </Button>
          </div>
        </div>
      )}

      {/* Immediate Gender Violation Warning Modal */}
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
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {genderWarningModal.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                {genderWarningModal.message}
              </p>
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
              {language === 'bn' ? 'বুঝেছি / নিয়ম মেনে নিচ্ছি' : 'Understood / Accept Rule'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Internal Staff Coupon Lookup Modal (Staff/Admin Only) */}
      <Modal
        isOpen={isStaffCouponModalOpen}
        onClose={() => setIsStaffCouponModalOpen(false)}
        title={language === 'bn' ? '🔒 অফিস স্টাফ কুপন তালিকা (Internal Staff Reference)' : 'Active Marketing Coupons (Staff View)'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
            {language === 'bn'
              ? '💡 এই তালিকাটি শুধুমাত্র কাউন্টার অপারেটর ও স্টাফদের জন্য। গ্রাহক মুখে কোড বললে যাচাই করে এখানে ক্লিক করে সরাসরি প্রয়োগ করতে পারেন।'
              : 'This list is for internal counter staff reference only. Select a coupon to apply it directly.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {getMarketingCoupons().filter(c => c.isActive).map((c) => (
              <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:border-blue-400 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                      {c.code}
                    </span>
                    <Badge variant="primary" className="text-[10px] font-mono font-bold">
                      {c.discountType === 'FIXED' ? formatCurrency(c.discountValue) : `${c.discountValue}%`} OFF
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {c.title}
                  </h4>
                  {c.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ব্যবহার: {c.usageCount}/{c.maxUsageLimit}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setCouponCode(c.code);
                      setIsStaffCouponModalOpen(false);
                      setTimeout(() => {
                        const res = validateAndCalculateCoupon(c.code, grossAmount, targetUniversity);
                        if (res.isValid) {
                          setIsDiscountApplied(true);
                          setDiscountType(res.discountType);
                          setDiscountRate(res.discountRate);
                          setDiscountReference(`Coupon: ${c.code}`);
                          setAppliedCoupon({
                            code: c.code,
                            discountType: res.discountType,
                            rate: res.discountRate,
                            label: res.discountType === 'FIXED' ? `৳${res.discountRate} ছাড়` : `${res.discountRate}% ছাড়`
                          });
                          setCouponMessage(res.message);
                        }
                      }, 100);
                    }}
                    className="rounded-xl text-xs font-bold py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {language === 'bn' ? 'ব্যবহার করুন' : 'Apply'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Link href="/marketing/coupons" target="_blank">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                {language === 'bn' ? '⚙️ নতুন কুপন তৈরি বা ম্যানেজ করুন' : 'Manage All Coupons'}
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStaffCouponModalOpen(false)}
              className="rounded-xl text-xs font-bold px-4"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Official Payment Receipt Modal on Payment Success */}
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
