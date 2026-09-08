'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
} from '@/services/rules.service';
import { validateAndCalculateCoupon } from '@/services/coupon.service';
import { recordPassengerInDirectory, lookupPassengerByPhone } from '@/services/passenger-directory.service';
import {
  isNetworkOnline,
  enqueueOfflineBooking,
  getPendingOfflineCount,
  syncOfflineBookingsToServer,
  initAutoOfflineSync
} from '@/services/offline-sync.service';
import { useApp } from '@/lib/context';
import { Armchair, AlertCircle, Shield, ArrowLeft, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
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
  allBookings?: any[];
  initialParams?: {
    tripId?: string;
    busId?: string;
    seatId?: string;
  };
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

export function BookingWizard({ trips: initialTrips, currentUser, savedLayouts = [], fareZones = [], allBookings = [], initialParams }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, currentColor, customLogos } = useApp();

  const rowLetters = 'ABCDEFGHIJKLMN';
  const trips = initialTrips && initialTrips.length > 0 ? initialTrips : [];

  const rawParamId =
    initialParams?.tripId ||
    initialParams?.busId ||
    searchParams.get('tripId') ||
    searchParams.get('busId') ||
    '';
  const matchedTrip = trips.find(
    (t) => t.id === rawParamId || t.busId === rawParamId || t.bus?.id === rawParamId || t.tripCode === rawParamId || t.bus?.busNumber === rawParamId
  );
  const initialTripId = matchedTrip ? matchedTrip.id : (rawParamId || trips[0]?.id || '');
  const initialSeatId = initialParams?.seatId || searchParams.get('seatId') || '';

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
  // Bumped to force a fresh seat-map fetch (e.g. when re-entering the seat
  // step) so availability shown matches the server.
  const [seatRefreshNonce, setSeatRefreshNonce] = useState(0);

  // Refresh the seat map whenever the user lands back on the seat step.
  useEffect(() => {
    if (step === 2) setSeatRefreshNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('HAND_CASH');
  const [senderSourceType, setSenderSourceType] = useState<SenderSourceType>('CASH_RECEIPT');
  const [selectedBankName, setSelectedBankName] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [senderRef, setSenderRef] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [duePromiseDate, setDuePromiseDate] = useState<string>('যাত্রার দিন বোর্ডিং কাউন্টারে');
  const [dueNote, setDueNote] = useState<string>('');
  const [confirmedBookingForReceipt, setConfirmedBookingForReceipt] = useState<any | null>(null);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  // Sync default due date with trip departure date
  useEffect(() => {
    if (selectedTrip?.departureDate) {
      setDuePromiseDate(selectedTrip.departureDate);
    }
  }, [selectedTrip?.departureDate]);

  // Pre-fill passenger phone for cash payments
  useEffect(() => {
    if (paymentMethod === 'HAND_CASH') {
      const pPhone = passengers[0]?.passengerPhone?.trim();
      if (pPhone && (!senderRef || senderRef === 'কাউন্টার নগদ ক্যাশ' || senderRef === 'CASH-COUNTER' || senderRef === 'CASH-COUNTER-OFFICE')) {
        setSenderRef(pPhone);
      }
    }
  }, [paymentMethod, passengers, senderRef]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Offline Booking & Auto-Sync State ──────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [offlineSyncMessage, setOfflineSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setPendingOfflineCount(getPendingOfflineCount());

      const handleOnline = () => {
        setIsOnline(true);
        setPendingOfflineCount(getPendingOfflineCount());
      };
      const handleOffline = () => {
        setIsOnline(false);
        setPendingOfflineCount(getPendingOfflineCount());
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const cleanup = initAutoOfflineSync((res) => {
        setPendingOfflineCount(getPendingOfflineCount());
        if (res.syncedCount > 0) {
          setOfflineSyncMessage(`${res.syncedCount}টি অফলাইন বুকিং স্বয়ংক্রিয়ভাবে সার্ভারে সিঙ্ক হয়েছে!`);
          setTimeout(() => setOfflineSyncMessage(null), 5000);
        }
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (cleanup) cleanup();
      };
    }
  }, []);

  const handleManualSync = async () => {
    if (isSyncingOffline) return;
    setIsSyncingOffline(true);
    try {
      const res = await syncOfflineBookingsToServer();
      setPendingOfflineCount(getPendingOfflineCount());
      if (res.syncedCount > 0) {
        setOfflineSyncMessage(`সফলভাবে ${res.syncedCount}টি বুকিং সিঙ্ক সম্পন্ন হয়েছে!`);
      } else if (res.conflictCount > 0) {
        setOfflineSyncMessage(`${res.conflictCount}টি বুকিংয়ে সিট কনফ্লিক্ট হয়েছে।`);
      } else {
        setOfflineSyncMessage('কোনো নতুন অফলাইন রেকর্ড সিঙ্কের বাকি নেই।');
      }
      setTimeout(() => setOfflineSyncMessage(null), 5000);
    } catch (e: any) {
      setOfflineSyncMessage('সিঙ্ক করতে সমস্যা হয়েছে।');
      setTimeout(() => setOfflineSyncMessage(null), 5000);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  const [liveLayouts, setLiveLayouts] = useState<any[]>(savedLayouts || []);

  useEffect(() => {
    fetch('/api/v1/seat-layouts', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setLiveLayouts(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const resolveLayout = useCallback(
    (trip: any, layouts: any[]) => {
      if (!trip) return null;
      const busLayoutId = trip.bus?.seatLayoutId || trip.bus?.seat_layout_id || trip.seatLayoutId || trip.seat_layout_id;
      let matched: any = null;
      if (busLayoutId && Array.isArray(layouts)) {
        const norm = String(busLayoutId).trim().toLowerCase();
        matched = layouts.find(
          (l: any) =>
            (l.id && String(l.id).trim().toLowerCase() === norm) ||
            (l.name && String(l.name).trim().toLowerCase() === norm)
        );
      }
      if (!matched) {
        matched = trip.seatLayout?.layout || trip.bus?.seatLayout?.layout || trip.seatLayout || trip.bus?.seatLayout;
      }
      if (!matched && Array.isArray(layouts)) {
        const bUni = (trip.bus?.targetUniversity || trip.targetUniversity || '').trim().toLowerCase();
        const bUnit = (trip.bus?.examUnit || trip.examUnit || '').trim().toLowerCase();
        matched = layouts.find((l: any) => {
          const lUni = (l.university || '').trim().toLowerCase();
          const lUnit = (l.unit || l.examName || '').trim().toLowerCase();
          return (bUni && lUni && bUni.includes(lUni)) || (bUnit && lUnit && bUnit === lUnit);
        });
      }
      if (!matched && Array.isArray(layouts) && layouts.length === 1) {
        matched = layouts[0];
      }
      return matched;
    },
    []
  );

  // ── Layout auto-detection from trip (100% Dynamic) ─────────────────────────
  useEffect(() => {
    if (!selectedTrip) return;
    const matchedLayout = resolveLayout(selectedTrip, liveLayouts);

    if (matchedLayout) {
      let parsedJson: any = null;
      if (matchedLayout.layout_json && typeof matchedLayout.layout_json === 'string') {
        try { parsedJson = JSON.parse(matchedLayout.layout_json); } catch (e) {}
      }
      const layoutGrid = matchedLayout.layoutGrid || parsedJson?.layoutGrid;
      const layoutExtraSeats = matchedLayout.extraSeats || parsedJson?.extraSeats || [];
      const layoutSegments = matchedLayout.activeSegments || parsedJson?.activeSegments;
      const layoutUni = matchedLayout.university || parsedJson?.university || selectedTrip.targetUniversity || selectedTrip.bus?.targetUniversity || '';
      const layoutCapacity = matchedLayout.totalSeats || matchedLayout.seatCount || matchedLayout.capacity || (Array.isArray(layoutGrid) ? layoutGrid.flat().filter((c: any) => c && (c.type === 'SEAT' || c.seatType === 'SEAT')).length + layoutExtraSeats.length : undefined) || selectedTrip.bus?.capacity || 45;

      if (layoutUni) setTargetUniversity(layoutUni);
      if (layoutCapacity) setActiveCapacity(layoutCapacity);
      if (layoutSegments && Array.isArray(layoutSegments) && layoutSegments.length > 0) {
        setActiveSegments(layoutSegments);
        return;
      }
    }

    // Dynamic resolution for trips without pre-configured custom segment records
    const targetUni = selectedTrip.targetUniversity || selectedTrip.bus?.targetUniversity || selectedTrip.route?.destination || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
    const tripCap = Number(selectedTrip.bus?.capacity) || 45;
    const baseFare = Number(selectedTrip.basePrice) || 550;
    const maxFare = Number(selectedTrip.maxPrice) || (baseFare >= 600 ? baseFare + 100 : baseFare + 50);

    // Build dynamic segments tailored to the trip's actual pricing and fleet capacity
    const dynamicSegments: FareRangeSegment[] = [
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: maxFare, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: baseFare, color: 'blue' },
      { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: Math.max(300, baseFare - 50), color: 'purple' },
      ...(tripCap === 45 || tripCap === 42 ? [{ id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: Math.max(300, baseFare - 100), color: 'amber' as const }] : [])
    ];

    setTargetUniversity(targetUni);
    setActiveCapacity(tripCap);
    setActiveSegments(dynamicSegments);
  }, [selectedTripId, selectedTrip, liveLayouts, resolveLayout]);

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
    [activeSegments, rowLetters]
  );

  const parseSeatPosition = useCallback(
    (seat: any): { rowIndex: number; colIndex: number; isExtra: boolean } => {
      const numStr = (seat?.seatNumber || seat?.seat_number || seat?.label || '').toString().trim().toUpperCase();
      const totalRowsCount = activeCapacity === 40 ? 10 : 11;

      if (numStr.startsWith('EX') || seat?.isExtra || seat?.seatType === 'EXTRA') {
        return { rowIndex: 999, colIndex: seat?.colIndex ?? 0, isExtra: true };
      }

      const match = numStr.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const rowChar = match[1];
        const colDigit = parseInt(match[2], 10);
        const rIdx = rowLetters.indexOf(rowChar);
        if (rIdx >= 0) {
          if (rIdx === totalRowsCount - 1 && (activeCapacity === 45 || activeCapacity === 42)) {
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
      setExtraSeats([]);
      return;
    }

    const currentTrip = trips.find((t) => t.id === selectedTripId);
    const matchedLayout = resolveLayout(currentTrip, liveLayouts);

    let parsedJson: any = null;
    if (matchedLayout && matchedLayout.layout_json && typeof matchedLayout.layout_json === 'string') {
      try { parsedJson = JSON.parse(matchedLayout.layout_json); } catch (e) {}
    }
    const layoutGrid = matchedLayout?.layoutGrid || parsedJson?.layoutGrid;
    const layoutExtraSeats = matchedLayout?.extraSeats || parsedJson?.extraSeats || [];
    const layoutSegments = (matchedLayout?.activeSegments || parsedJson?.activeSegments || activeSegments) as FareRangeSegment[];

    const hasCustomLayoutGrid = Array.isArray(layoutGrid) && layoutGrid.length > 0;
    const busCap = currentTrip?.bus?.capacity || (hasCustomLayoutGrid ? layoutGrid.flat().filter((c: any) => c && (c.type === 'SEAT' || c.seatType === 'SEAT')).length + layoutExtraSeats.length : activeCapacity) || 45;
    const expectedRows = hasCustomLayoutGrid
      ? layoutGrid.length
      : busCap === 45 ? 11 : busCap === 40 ? 10 : Math.ceil(busCap / 4);

    const generateFromLayout = () => {
      const generatedSeats: any[] = [];
      layoutGrid.forEach((row: any[], r: number) => {
        if (!Array.isArray(row)) return;
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const matchingSeg = getSegmentForRow(rowChar, layoutSegments);
        row.forEach((cell: any, c: number) => {
          if (!cell) return;
          if (cell.type === 'EMPTY' || cell.type === 'AISLE') {
            generatedSeats.push({
              seatId: `cell-${r}-${c}`,
              seatNumber: '',
              type: cell.type,
              rowIndex: r,
              colIndex: c,
              status: 'EMPTY',
              isExtra: false
            });
            return;
          }
          const sNum = (cell.label || cell.seatNumber || `${rowChar}${c + 1}`).toString().trim().toUpperCase();
          const colIndex = cell.colIndex !== undefined ? cell.colIndex : c;
          generatedSeats.push({
            seatId: `seat-${selectedTripId}-${sNum}`,
            seatNumber: sNum,
            type: 'SEAT',
            rowIndex: cell.rowIndex !== undefined ? cell.rowIndex : r,
            colIndex: colIndex,
            seatType: r < 2 ? 'VIP' : 'STANDARD',
            genderAllowed: cell.genderAllowed || cell.genderRule || 'ANY',
            fare: Number(cell.baseFare) || matchingSeg?.fare || (r < 4 ? 650 : r < 7 ? 550 : 500),
            fareZoneName: cell.fareZoneId || matchingSeg?.name || 'Standard',
            status: 'AVAILABLE',
            isExtra: false
          });
        });
      });

      const extras = (layoutExtraSeats || []).map((ex: any, exIdx: number) => {
        const sNum = (ex.seatNumber || ex.label || `EX-${exIdx + 1}`).toString().trim().toUpperCase();
        return {
          seatId: `seat-${selectedTripId}-${sNum}`,
          seatNumber: sNum,
          type: 'SEAT',
          rowIndex: 999,
          colIndex: ex.colIndex !== undefined ? ex.colIndex : exIdx,
          seatType: 'EXTRA',
          genderAllowed: ex.genderRule || ex.genderAllowed || 'ANY',
          fare: Number(ex.baseFare) || 500,
          fareZoneName: 'Extra Seat',
          status: 'AVAILABLE',
          isExtra: true
        };
      });

      return { seats: generatedSeats, extras };
    };

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
          const colIndex = isLast5 ? c : (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 3 : 4);
          generatedSeats.push({
            seatId: `seat-${selectedTripId}-${seatNum}`,
            seatNumber: seatNum,
            type: 'SEAT',
            rowIndex: r,
            colIndex: colIndex,
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
      return { seats: generatedSeats, extras: [] };
    };

    setIsLoadingSeats(true);
    fetch(`/api/backend/inventory/${selectedTripId}/seat-map`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const baseInventory = hasCustomLayoutGrid ? generateFromLayout() : generateFallbackSeats();
        let finalSeats = baseInventory.seats;
        let finalExtras = baseInventory.extras;

        // Extract active booked seats from allBookings as a fail-safe against stale inventory caches
        const activeTripBookings = (allBookings || []).filter((b: any) => {
          const bTripId = b.tripId || b.trip_id;
          const status = (b.bookingStatus || b.booking_status || b.status || '').toUpperCase();
          const isTrip = bTripId === selectedTripId;
          const isActive = ['CONFIRMED', 'COMPLETED', 'PAYMENT_TIMER_ACTIVE', 'PRE_BOOKED', 'HELD'].includes(status);
          return isTrip && isActive;
        });

        const bookedSeatsFromBookings = new Map<string, any>();
        activeTripBookings.forEach((b: any) => {
          const pName = b.contactName || b.contact_name || b.passengerName || b.passenger_name;
          const pPhone = b.contactPhone || b.contact_phone || b.passengerPhone || b.passenger_phone;
          const pGender = b.passengerGender || b.passenger_gender || b.gender;
          const dataObj = { booking: b, passengerName: pName, passengerPhone: pPhone, passengerGender: pGender };

          if (Array.isArray(b.seats)) {
            b.seats.forEach((st: any) => {
              const num = (st.seatNumber || st.seat_number || '').toString().trim().toUpperCase();
              const sId = (st.seatId || st.seat_id || '').toString().trim().toUpperCase();
              const sSuffix = sId ? (sId.includes('-EX-') ? `EX-${sId.split('-').pop()}` : (sId.split('-').pop() || '')) : '';
              if (num) bookedSeatsFromBookings.set(num, dataObj);
              if (sId) bookedSeatsFromBookings.set(sId, dataObj);
              if (sSuffix) bookedSeatsFromBookings.set(sSuffix, dataObj);
            });
          }
          if (Array.isArray(b.passengers)) {
            b.passengers.forEach((ps: any) => {
              const num = (ps.seatNumber || ps.seat_number || '').toString().trim().toUpperCase();
              const sId = (ps.seatId || ps.seat_id || '').toString().trim().toUpperCase();
              const sSuffix = sId ? (sId.includes('-EX-') ? `EX-${sId.split('-').pop()}` : (sId.split('-').pop() || '')) : '';
              const pObj = {
                booking: b,
                passengerName: ps.passengerName || ps.passenger_name || pName,
                passengerPhone: ps.passengerPhone || ps.passenger_phone || pPhone,
                passengerGender: ps.gender || pGender
              };
              if (num) bookedSeatsFromBookings.set(num, pObj);
              if (sId) bookedSeatsFromBookings.set(sId, pObj);
              if (sSuffix) bookedSeatsFromBookings.set(sSuffix, pObj);
            });
          }
        });

        const seatDataMap = new Map<string, any>();
        if (data && data.seats && Array.isArray(data.seats) && data.seats.length > 0) {
          data.seats.forEach((s: any) => {
            const num = (s.seatNumber || s.seat_number || s.label || '').toString().trim().toUpperCase();
            const sId = (s.seatId || s.seat_id || s.id || '').toString().trim().toUpperCase();
            const sSuffix = sId ? (sId.includes('-EX-') ? `EX-${sId.split('-').pop()}` : (sId.split('-').pop() || '')) : '';
            if (num) seatDataMap.set(num, s);
            if (sId) seatDataMap.set(sId, s);
            if (sSuffix) seatDataMap.set(sSuffix, s);
          });
        }

        finalSeats = finalSeats.map((s: any) => {
          const sNum = (s.seatNumber || s.seat_number || '').toString().trim().toUpperCase();
          const sId = (s.seatId || s.seat_id || s.id || '').toString().trim().toUpperCase();
          const sSuffix = sId ? (sId.includes('-EX-') ? `EX-${sId.split('-').pop()}` : (sId.split('-').pop() || '')) : '';

          const bSeat = (sNum ? seatDataMap.get(sNum) : null)
            || (sId ? seatDataMap.get(sId) : null)
            || (sSuffix ? seatDataMap.get(sSuffix) : null);

          const bProp = (sNum ? bookedSeatsFromBookings.get(sNum) : null)
            || (sId ? bookedSeatsFromBookings.get(sId) : null)
            || (sSuffix ? bookedSeatsFromBookings.get(sSuffix) : null);

          if (!bSeat && !bProp) return s;

          const phone = bSeat?.passenger_phone || bSeat?.contact_phone || bSeat?.passengerPhone || bSeat?.booking?.contactPhone || bSeat?.booking?.passengerPhone || bProp?.passengerPhone;
          const gender = bSeat?.gender || bSeat?.passengerGender || bSeat?.booking?.passengerGender || bProp?.passengerGender;
          const name = bSeat?.passenger_name || bSeat?.contact_name || bSeat?.passengerName || bSeat?.booking?.contactName || bProp?.passengerName;

          let finalStatus = (bSeat?.status || (bProp ? 'BOOKED' : 'AVAILABLE')).toUpperCase();
          if (bProp && finalStatus === 'AVAILABLE') {
            finalStatus = 'BOOKED';
          }

          return {
            ...s,
            status: finalStatus,
            passengerName: name,
            passenger_name: name,
            passengerPhone: phone,
            passenger_phone: phone,
            passengerGender: gender,
            booking: {
              ...(s.booking || {}),
              ...(bSeat?.booking || bProp?.booking || {}),
              passengerName: name,
              passengerPhone: phone,
              contactPhone: phone,
              passengerGender: gender
            }
          };
        });

        finalExtras = finalExtras.map((s: any) => {
          const sNum = (s.seatNumber || s.seat_number || '').toString().trim().toUpperCase();
          const sId = (s.seatId || s.seat_id || s.id || '').toString().trim().toUpperCase();
          const sSuffix = sId ? (sId.includes('-EX-') ? `EX-${sId.split('-').pop()}` : (sId.split('-').pop() || '')) : '';

          const bSeat = (sNum ? seatDataMap.get(sNum) : null)
            || (sId ? seatDataMap.get(sId) : null)
            || (sSuffix ? seatDataMap.get(sSuffix) : null);

          const bProp = (sNum ? bookedSeatsFromBookings.get(sNum) : null)
            || (sId ? bookedSeatsFromBookings.get(sId) : null)
            || (sSuffix ? bookedSeatsFromBookings.get(sSuffix) : null);

          if (!bSeat && !bProp) return s;

          const phone = bSeat?.passenger_phone || bSeat?.contact_phone || bSeat?.passengerPhone || bSeat?.booking?.contactPhone || bSeat?.booking?.passengerPhone || bProp?.passengerPhone;
          const gender = bSeat?.gender || bSeat?.passengerGender || bSeat?.booking?.passengerGender || bProp?.passengerGender;
          const name = bSeat?.passenger_name || bSeat?.contact_name || bSeat?.passengerName || bSeat?.booking?.contactName || bProp?.passengerName;

          let finalStatus = (bSeat?.status || (bProp ? 'BOOKED' : 'AVAILABLE')).toUpperCase();
          if (bProp && finalStatus === 'AVAILABLE') {
            finalStatus = 'BOOKED';
          }

          return {
            ...s,
            status: finalStatus,
            passengerName: name,
            passenger_name: name,
            passengerPhone: phone,
            passenger_phone: phone,
            passengerGender: gender,
            booking: {
              ...(s.booking || {}),
              ...(bSeat?.booking || bProp?.booking || {}),
              passengerName: name,
              passengerPhone: phone,
              contactPhone: phone,
              passengerGender: gender
            }
          };
        });

        setTripSeats(finalSeats);
        setExtraSeats(finalExtras);

        // Filter out any already-booked or held seats from current selection
        const allLoaded = [...finalSeats, ...finalExtras];
        setSelectedSeatIds((prev) => {
          return prev.filter((id) => {
            const st = allLoaded.find((s: any) => s.seatId === id);
            return st && st.status === 'AVAILABLE';
          });
        });

        // Normalize and resolve any initial seat tokens from URL / modal
        const rawInitialSeat = initialParams?.seatId || searchParams.get('seatId') || '';
        if (rawInitialSeat) {
          const tokens = rawInitialSeat.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
          const matchedSeats = allLoaded.filter((s: any) => {
            const sNum = (s.seatNumber || s.label || '').toUpperCase();
            const sId = (s.seatId || '').toUpperCase();
            return tokens.includes(sNum) || tokens.includes(sId);
          });

          const availableMatched = matchedSeats
            .filter((s: any) => s.status === 'AVAILABLE')
            .map((s: any) => s.seatId);

          const alreadyBooked = matchedSeats.filter((s: any) => s.status !== 'AVAILABLE');
          if (alreadyBooked.length > 0) {
            const bookedNames = alreadyBooked.map((s: any) => s.seatNumber || s.seatId).join(', ');
            setErrorMessage(`⚠️ সিট ${bookedNames} ইতিমধ্যে বুকড বা সংরক্ষিত রয়েছে। অনুগ্রহ করে অন্য কোনো খালি আসন নির্বাচন করুন।`);
          }

          if (availableMatched.length > 0) {
            setSelectedSeatIds((prev) => Array.from(new Set([...prev, ...availableMatched])).slice(0, 6));
          }
        }
      })
      .catch(() => {
        const baseInventory = hasCustomLayoutGrid ? generateFromLayout() : generateFallbackSeats();
        setTripSeats(baseInventory.seats);
        setExtraSeats(baseInventory.extras);

        const rawInitialSeat = initialParams?.seatId || searchParams.get('seatId') || '';
        if (rawInitialSeat) {
          const tokens = rawInitialSeat.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
          const allLoaded = [...baseInventory.seats, ...baseInventory.extras];
          const matchedSeats = allLoaded.filter((s: any) => {
            const sNum = (s.seatNumber || s.label || '').toUpperCase();
            const sId = (s.seatId || '').toUpperCase();
            return tokens.includes(sNum) || tokens.includes(sId);
          });
          const availableMatched = matchedSeats.filter((s: any) => s.status === 'AVAILABLE').map((s: any) => s.seatId);
          if (availableMatched.length > 0) {
            setSelectedSeatIds((prev) => Array.from(new Set([...prev, ...availableMatched])).slice(0, 6));
          }
        }
      })
      .finally(() => setIsLoadingSeats(false));
  }, [selectedTripId, activeCapacity, activeSegments, getSegmentForRow, parseSeatPosition, trips, rowLetters, liveLayouts, resolveLayout, allBookings, initialParams?.seatId, searchParams, seatRefreshNonce]);

  // ── Passenger list sync with selected seats ────────────────
  useEffect(() => {
    setPassengers((prev) => {
      const existingMap = new Map(prev.map((p) => [p.seatId, p]));
      return selectedSeatIds.map((seatId) => {
        const existing = existingMap.get(seatId);
        if (existing) return existing;
        return {
          passengerName: '',
          passengerPhone: '',
          phoneType: 'WHATSAPP',
          hasWhatsapp: true,
          whatsappNumber: '',
          passengerType: 'STUDENT',
          gender: 'FEMALE',
          seatId,
          admissionId: '',
          institution: `${targetUniversity} (Admission Candidate)`,
          guardianPhone: '',
          guardianPhoneType: 'WHATSAPP',
          guardianHasWhatsapp: true,
          guardianWhatsappNumber: '',
          guardianRelationship: undefined
        };
      });
    });
  }, [selectedSeatIds, targetUniversity]);

  const allCurrentSeats = useMemo(() => [
    ...tripSeats.filter((s) => s.type !== 'EMPTY' && s.type !== 'AISLE'),
    ...extraSeats
  ], [tripSeats, extraSeats]);

  const dynamicAdjacentLocks = useMemo(() => calculateDynamicAdjacentSeatLocks(allCurrentSeats), [allCurrentSeats]);

  // Drop any selection whose seat is no longer AVAILABLE (e.g. it became
  // booked/held after a seat-map refresh) so the user can't continue on a
  // seat that is gone. Skips runs where the map is still loading/empty so a
  // URL-preselected seat is not dropped before seats arrive.
  const removedSeatCountRef = useRef(0);
  useEffect(() => {
    if (isLoadingSeats) return;
    if (allCurrentSeats.length === 0) return;
    const unavailable = new Set(
      allCurrentSeats
        .filter((s) => (s.status || '').toUpperCase() !== 'AVAILABLE')
        .map((s) => s.seatId)
    );
    const stillSelected = selectedSeatIds.filter((id) => !unavailable.has(id));
    if (stillSelected.length !== selectedSeatIds.length) {
      removedSeatCountRef.current += selectedSeatIds.length - stillSelected.length;
      setSelectedSeatIds(stillSelected);
      setErrorMessage(
        language === 'bn'
          ? `আপনার নির্বাচিত ${removedSeatCountRef.current}টি সিট এইমাত্র অন্য কারো বুকিং/হোল্ড হয়ে গেছে। অনুগ্রহ করে নতুন সিট নির্বাচন করুন।`
          : `${removedSeatCountRef.current} of your selected seat(s) were just booked/held. Please choose again.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripSeats, extraSeats, isLoadingSeats]);

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

  const hasInitializedPaidStep5 = useRef(false);
  useEffect(() => {
    if (step === 5) {
      if (!hasInitializedPaidStep5.current) {
        setPaidAmount(netAmount);
        hasInitializedPaidStep5.current = true;
      }
    } else {
      hasInitializedPaidStep5.current = false;
    }
  }, [step, netAmount]);

  // ── Seat selection toggle with Optimistic Live Hold ─────────────────────────
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
        // Release live hold on server
        if (selectedTripId && seatNum && isOnline) {
          fetch(`/api/backend/inventory/${selectedTripId}/seat-hold`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds: [seatNum] })
          }).catch(() => {});
        }
      } else {
        if (selectedSeatIds.length >= 6) {
          setErrorMessage(
            language === 'bn'
              ? '⚠️ এক সাথে সর্বোচ্চ ৬টির বেশি টিকিট বুকিং করা যাবে না (A4 সিঙ্গেল-পেজ প্রিন্ট নীতি অনুযায়ী)।'
              : 'Maximum 6 seats per booking allowed to ensure single-page A4 ticket fit.'
          );
          return;
        }

        setSelectedSeatIds((prev) => [...prev, seatId]);
        // Acquire live hold on server for 10 minutes
        if (selectedTripId && seatNum && isOnline) {
          fetch(`/api/backend/inventory/${selectedTripId}/seat-hold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds: [seatNum], durationSeconds: 600 })
          }).catch(() => {});
        }
      }
    },
    [allCurrentSeats, dynamicAdjacentLocks, language, selectedSeatIds, selectedTripId, isOnline]
  );

  const handleAddExtraSeat = useCallback(() => {
    if (selectedSeatIds.length >= 6) {
      setErrorMessage(
        language === 'bn'
          ? '⚠️ এক সাথে সর্বোচ্চ ৬টির বেশি টিকিট বুকিং করা যাবে না (A4 সিঙ্গেল-পেজ প্রিন্ট নীতি অনুযায়ী)।'
          : 'Maximum 6 seats per booking allowed.'
      );
      return;
    }
    const nextIdx = extraSeats.length + 1;
    const newExtra = {
      seatId: `seat-${selectedTrip?.id || 'trip'}-EX-${nextIdx}`,
      seatNumber: `EX-${nextIdx}`,
      rowIndex: 999,
      colIndex: nextIdx,
      seatType: 'EXTRA',
      genderAllowed: 'ANY',
      fare: selectedTrip?.basePrice || 450,
      fareZoneName: 'Extra Seat',
      status: 'AVAILABLE',
      isExtra: true
    };
    setExtraSeats((prev) => [...prev, newExtra]);
    setSelectedSeatIds((prev) => (prev.includes(newExtra.seatId) ? prev : [...prev, newExtra.seatId]));
  }, [extraSeats.length, selectedTrip?.id, selectedTrip?.basePrice]);

  const handleRemoveExtraSeat = useCallback((seatId: string) => {
    setExtraSeats((prev) => prev.filter((s) => s.seatId !== seatId));
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
  }, []);

  // ── Passenger update ────────────────────────────────────────
  const handleUpdatePassenger = useCallback(
    (seatId: string, updates: Partial<PassengerInput>) => {
      setErrorMessage(null);

      const targetPassenger = passengers.find((p) => p.seatId === seatId);

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

      setPassengers((prev) =>
        prev.map((p) => (p.seatId === seatId ? { ...p, ...updates } : p))
      );
    },
    [passengers]
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

    // Revalidate that every still-selected seat is currently AVAILABLE on the
    // latest seat map before allowing the server call (guards against a seat
    // being taken while the wizard sat on a later step).
    const staleIds = selectedSeatIds.filter((sId) => {
      const s = allCurrentSeats.find((c) => c.seatId === sId);
      if (!s) return true; // no longer on the map
      return (s.status || '').toUpperCase() !== 'AVAILABLE';
    });
    if (staleIds.length > 0) {
      const staleLabels = staleIds
        .map((id) => allCurrentSeats.find((c) => c.seatId === id)?.seatNumber || id)
        .join(', ');
      setSelectedSeatIds((prev) => prev.filter((id) => !staleIds.includes(id)));
      setErrorMessage(
        language === 'bn'
          ? `সিট ${staleLabels} এইমাত্র অন্য কারো বুকিং/হোল্ড হয়ে গেছে। অনুগ্রহ করে অন্য সিট নির্বাচন করুন।`
          : `Seat(s) ${staleLabels} were just booked/held by someone else. Please pick another seat.`
      );
      setIsSubmitting(false);
      setStep(2);
      return;
    }

    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const sLabel = allCurrentSeats.find((s) => s.seatId === p.seatId)?.seatNumber || `সিট #${i + 1}`;

      if (!p.passengerName.trim()) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর যাত্রীর পূর্ণ নাম আবশ্যক।` : `Passenger name for Seat ${sLabel} is required.`);
        setIsSubmitting(false);
        setStep(3);
        return;
      }

      const cleanPhone = p.passengerPhone.replace(/[\s-]/g, '');
      if (!cleanPhone) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর আবশ্যক।` : `Passenger mobile for Seat ${sLabel} is required.`);
        setIsSubmitting(false);
        setStep(3);
        return;
      }

      if (!bdPhoneRegex.test(cleanPhone)) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর মোবাইল নম্বর (${p.passengerPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।` : `Invalid 11-digit Bangladeshi mobile number for Seat ${sLabel}.`);
        setIsSubmitting(false);
        setStep(3);
        return;
      }

      if (p.guardianPhone && p.guardianPhone.trim()) {
        const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
        if (!bdPhoneRegex.test(cleanGPhone)) {
          setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর অভিভাবকের মোবাইল নম্বর (${p.guardianPhone}) সঠিক নয়! ১১ ডিজিটের সঠিক নম্বর লিখুন।` : `Invalid 11-digit guardian phone number for Seat ${sLabel}.`);
          setIsSubmitting(false);
          setStep(3);
          return;
        }
      }

      if (p.passengerType === 'GUARDIAN' && !p.guardianRelationship) {
        setErrorMessage(language === 'bn' ? `সিট ${sLabel}-এর অভিভাবকের সাথে সম্পর্ক নির্বাচন আবশ্যক।` : `Guardian relationship required for Seat ${sLabel}.`);
        setIsSubmitting(false);
        setStep(3);
        return;
      }
    }

    const pairValidation = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
    if (!pairValidation.isValid) {
      setErrorMessage(pairValidation.message || 'Gender or Guardian validation failed.');
      setIsSubmitting(false);
      setStep(3);
      return;
    }

    if (discountState.isDiscountApplied && discountAmount > 0 && !discountState.discountReference.trim()) {
      setErrorMessage(language === 'bn' ? 'টিকিটের মূল্য ছাড় দেওয়ার জন্য রেফারেন্স বা অনুমোদনকারীর নাম আবশ্যক।' : 'Reference or authorizer name is required when applying a discount.');
      setIsSubmitting(false);
      return;
    }

    let effectiveSenderRef = senderRef.trim();
    if (!effectiveSenderRef && paymentMethod === 'HAND_CASH') {
      effectiveSenderRef = passengers[0]?.passengerPhone || 'CASH-COUNTER-OFFICE';
    }

    if (!effectiveSenderRef) {
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
      const cleanSender = effectiveSenderRef.replace(/[\s-]/g, '');
      if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
        setErrorMessage(language === 'bn' ? `প্রেরক মোবাইল নম্বর (${effectiveSenderRef}) সঠিক নয়! ১১ ডিজিটের সঠিক বাংলাদেশী নম্বর (যেমন: 017XXXXXXXX) লিখুন।` : 'Invalid 11-digit sender mobile number.');
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
        ? `${selectedBankName} [${effectiveSenderRef}]`
        : effectiveSenderRef;

      const calcDue = Math.max(0, netAmount - paidAmount);
      const effectiveDueDate = duePromiseDate || selectedTrip?.departureDate || 'যাত্রার দিন কাউন্টারে';
      const dueNoteStr = calcDue > 0
        ? ` | বকেয়া: ৳${calcDue} (পরিশোধের শেষ সময়: ${effectiveDueDate}${dueNote ? `, নোট: ${dueNote}` : ''})`
        : '';

      const generatedNotes = bookingNotes || `যাত্রার ধরণ: ${
        journeyType === 'ROUND_TRIP'
          ? 'উভয়মুখী (যাওয়া ও আসা)'
          : journeyType === 'OUTBOUND_ONLY'
          ? 'শুধুমাত্র যাওয়া'
          : journeyType === 'RETURN_ONLY'
          ? 'শুধুমাত্র আসা'
          : 'অভিভাবক সহ স্প্লিট'
      } | বোর্ডিং: ${boardingPoint} | ড্রপিং: ${droppingPoint}`;

      const finalNotes = `${generatedNotes}${dueNoteStr}`;

      let isOffline = !isNetworkOnline();
      let res: any = null;

      if (!isOffline) {
        try {
          const enrichedPassengers = passengers.map((p) => {
            const sObj = allCurrentSeats.find((s) => s.seatId === p.seatId);
            const rawNum = sObj?.seatNumber || (p as any).seatNumber;
            const exMatch = p.seatId?.match(/EX(?:TRA)?[-_]?\d+/i);
            const resolvedNum = rawNum || (exMatch ? (exMatch[0].match(/\d+/) ? `EX-${exMatch[0].match(/\d+/)?.[0]}` : exMatch[0].toUpperCase()) : p.seatId);
            return {
              ...p,
              seatNumber: resolvedNum
            };
          });

          res = await createBookingAction({
            tripId: selectedTripId,
            seats: seatsPayload,
            passengers: enrichedPassengers,
            contactName: passengers[0]?.passengerName || undefined,
            contactPhone: passengers[0]?.passengerPhone || undefined,
            contactEmail: passengers[0]?.email || undefined,
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
            notes: finalNotes
          });
        } catch (netErr: any) {
          isOffline = true;
        }
      }

      // Offline Fallback: Seamlessly save booking locally when network drops
      if (
        isOffline ||
        (res &&
          !res.success &&
          typeof res.error === 'string' &&
          (res.error.toLowerCase().includes('fetch failed') ||
            res.error.toLowerCase().includes('network') ||
            res.error.toLowerCase().includes('failed to fetch') ||
            res.error.toLowerCase().includes('offline')))
      ) {
        const offlineRecord = enqueueOfflineBooking({
          tripId: selectedTripId,
          tripCode: selectedTrip?.tripCode,
          busNumber: selectedTrip?.bus?.busNumber,
          seats: seatsPayload.map((s) => ({
            seat_id: s.seatId,
            seat_number: allCurrentSeats.find((cs) => cs.seatId === s.seatId)?.seatNumber || s.seatId,
            fare: s.fare
          })),
          passengers: passengers.map((p) => ({
            passenger_name: p.passengerName,
            passenger_phone: p.passengerPhone,
            seat_id: p.seatId,
            seat_number: allCurrentSeats.find((cs) => cs.seatId === p.seatId)?.seatNumber || p.seatId,
            gender: p.gender,
            passenger_type: p.passengerType,
            admission_id: p.admissionId,
            guardian_phone: p.guardianPhone,
            guardian_relationship: p.guardianRelationship,
            has_whatsapp: p.hasWhatsapp
          })),
          journey_type: journeyType,
          boarding_point: boardingPoint,
          dropping_point: droppingPoint,
          payment_method: paymentMethod,
          paid_amount: paidAmount,
          due_amount: Math.max(0, netAmount - paidAmount),
          notes: finalNotes
        });

        setPendingOfflineCount(getPendingOfflineCount());

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
          id: offlineRecord.localId,
          bookingNumber: offlineRecord.localId,
          isOffline: true,
          offlineRefId: offlineRecord.localId,
          syncStatus: 'PENDING',
          trip: selectedTrip,
          duePromiseDate: effectiveDueDate,
          dueNote: dueNote,
          notes: `[অফলাইন মোড] ${finalNotes}`,
          passengers: passengers.map((p) => ({
            ...p,
            seatNumber: allCurrentSeats.find((s) => s.seatId === p.seatId)?.seatNumber || p.seatId,
            fareSnapshot: allCurrentSeats.find((s) => s.seatId === p.seatId)?.fare || selectedTrip?.basePrice || 550
          })),
          payments: [
            {
              id: 'pmt-receipt-offline',
              receiptNumber: generateReceiptNumber(Math.floor(Math.random() * 9000) + 1000),
              amount: paidAmount,
              method: paymentMethod,
              createdAt: new Date(),
              transactions: [
                {
                  transactionId: transactionId.trim() || finalSenderRef || 'OFFLINE-CASH-RECEIPT',
                  verificationStatus: 'OFFLINE_SAVED'
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
        return;
      }

      if (res && res.success && res.booking) {
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
          duePromiseDate: effectiveDueDate,
          dueNote: dueNote,
          notes: finalNotes,
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
        setErrorMessage(res?.error || 'Failed to create booking.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation helpers ──────────────────────────────────────
  const isTripSelected = !!selectedTripId;
  const isSeatSelected = selectedSeatIds.length > 0;

  const isPassengersStepValid = useMemo(() => {
    if (!isSeatSelected || passengers.length === 0) return false;
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.passengerName || !p.passengerName.trim()) return false;
      const cleanPhone = (p.passengerPhone || '').replace(/[\s-]/g, '');
      if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) return false;
      if (p.guardianPhone && p.guardianPhone.trim()) {
        const cleanGPhone = p.guardianPhone.replace(/[\s-]/g, '');
        if (!bdPhoneRegex.test(cleanGPhone)) return false;
      }
      if (p.passengerType === 'GUARDIAN' && !p.guardianRelationship) return false;
    }
    const pairRes = validateMultiSeatBookingPairRules(passengers, allCurrentSeats);
    return pairRes.isValid;
  }, [isSeatSelected, passengers, allCurrentSeats]);

  const isBoardingStepValid = useMemo(() => {
    return isPassengersStepValid && !!boardingPoint?.trim() && !!droppingPoint?.trim();
  }, [isPassengersStepValid, boardingPoint, droppingPoint]);

  const maxReachableStep = useMemo(() => {
    if (!isTripSelected) return 1;
    if (!isSeatSelected) return 2;
    if (!isPassengersStepValid) return 3;
    if (!isBoardingStepValid) return 4;
    return 5;
  }, [isTripSelected, isSeatSelected, isPassengersStepValid, isBoardingStepValid]);

  const handleNavigate = (target: number) => {
    if (target <= step) {
      setErrorMessage(null);
      setStep(target);
      return;
    }

    if (target > maxReachableStep) {
      if (maxReachableStep === 1) {
        setErrorMessage(language === 'bn' ? 'প্রথমে একটি বাস বা ট্রিপ নির্বাচন করুন।' : 'Please select a bus trip first.');
      } else if (maxReachableStep === 2) {
        setErrorMessage(language === 'bn' ? 'যাত্রী তথ্যে যাওয়ার আগে অন্তত একটি সিট নির্বাচন করুন।' : 'Please select at least one seat first.');
      } else if (maxReachableStep === 3) {
        setErrorMessage(language === 'bn' ? 'পরবর্তী ধাপে যাওয়ার আগে সব যাত্রীর নাম ও ১১ ডিজিটের মোবাইল নম্বর পূরণ করুন।' : 'Please complete all passenger names and mobile numbers first.');
      } else if (maxReachableStep === 4) {
        setErrorMessage(language === 'bn' ? 'বোর্ডিং ও ড্রপিং পয়েন্ট নির্বাচন করুন।' : 'Please select boarding and dropping points.');
      }
      return;
    }

    setErrorMessage(null);
    setStep(target);
  };

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setSelectedSeatIds([]);
    setExtraSeats([]);
    setStep(2);
  };

  // ── Keyboard shortcuts for high-speed counter operators ──────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && (e.key === 'n' || e.key === 'N'))) {
        e.preventDefault();
        if (step === 1 && selectedTripId) setStep(2);
        else if (step === 2 && selectedSeatIds.length > 0) setStep(3);
        else if (step === 3 && isPassengersStepValid) setStep(4);
        else if (step === 4 && isBoardingStepValid) setStep(5);
        else if (step === 5 && !isSubmitting) handleFinalSubmit();
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (step > 1) setStep((s) => s - 1);
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (selectedTripId) setStep(2);
      } else if (e.key === 'Escape') {
        if (confirmedBookingForReceipt) {
          setConfirmedBookingForReceipt(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedTripId, selectedSeatIds, isPassengersStepValid, isBoardingStepValid, isSubmitting, confirmedBookingForReceipt]);

  const stepLabel = BOOKING_STEPS.find((s) => s.id === step);
  const seatLabels = selectedSeatIds
    .map((id) => allCurrentSeats.find((s) => s.seatId === id)?.seatNumber)
    .filter(Boolean);

  return (
    <div suppressHydrationWarning className="w-full space-y-5 pb-44 sm:pb-52">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4" suppressHydrationWarning>
        <div className="flex items-center gap-3 sm:gap-4" suppressHydrationWarning>
          <Button
            type="button"
            variant="outline"
            size="sm"
            suppressHydrationWarning
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                router.push('/bookings');
              }
            }}
            className="rounded-2xl px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-all hover:-translate-x-0.5"
            title={step > 1 ? (language === 'bn' ? 'পূর্ববর্তী ধাপে ফিরে যান' : 'Back to previous step') : (language === 'bn' ? 'বুকিং তালিকায় ফিরে যান' : 'Back to bookings list')}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="font-bold">{step > 1 ? (language === 'bn' ? 'পূর্ববর্তী ধাপ' : 'Back') : (language === 'bn' ? 'বুকিং তালিকা' : 'Back')}</span>
          </Button>

          <div suppressHydrationWarning>
            <div className="flex items-center gap-2 flex-wrap" suppressHydrationWarning>
              <Badge variant="primary" suppressHydrationWarning className="text-xs px-3 py-1 font-bold">
                {targetUniversity}
              </Badge>
              <span suppressHydrationWarning className="text-xs font-mono font-bold text-slate-500">
                {activeCapacity} {language === 'bn' ? 'সিট কোচ' : 'Seat Coach'}
              </span>

              {!isOnline && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800 animate-pulse">
                  <WifiOff className="w-3 h-3 text-rose-600" />
                  <span>{language === 'bn' ? 'অফলাইন মোড (লোকাল সেভ)' : 'Offline Mode (Local Save)'}</span>
                </span>
              )}

              {isOnline && pendingOfflineCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-700">
                  <RefreshCw className={`w-3 h-3 text-amber-700 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                  <span>{pendingOfflineCount} {language === 'bn' ? 'সিঙ্ক বাকি' : 'Pending Sync'}</span>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncingOffline}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {isSyncingOffline ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক'}
                  </button>
                </div>
              )}
            </div>
            <h1 suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
              <Armchair suppressHydrationWarning className="w-7 h-7" style={{ color: currentColor?.primaryHex || 'var(--primary-color)' }} />
              {language === 'bn' ? 'নতুন সিট বুকিং ও টিকিট ইস্যু' : 'New Seat Booking & Ticket Issue'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'bn'
                ? 'কাস্টম সিট বিল্ডার ফরম্যাটে যে বিশ্ববিদ্যালয়ের জন্য যেমন সিট প্ল্যান ও ভাড়া কনফিগার করা হয়েছে, ঠিক সেভাবে বুকিং করুন।'
                : 'Select your university admission trip and pick seats matching the exact custom seat builder configuration.'}
            </p>
          </div>
        </div>

        <StepIndicator currentStep={step} maxReachableStep={maxReachableStep} onNavigate={handleNavigate} />
      </div>

      {/* Offline Sync Banner Notification */}
      {offlineSyncMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>✓ {offlineSyncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setOfflineSyncMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-black text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sticky summary bar */}
      <BookingSummaryBar
        selectedSeatCount={selectedSeatIds.length}
        seatLabels={seatLabels}
        destinationLabel={targetUniversity}
        netAmount={netAmount}
        discountAmount={discountAmount}
        paidAmount={paidAmount}
        stepLabel={stepLabel ? (language === 'bn' ? stepLabel.labelBn : stepLabel.labelEn) : ''}
        busNumber={selectedTrip?.bus?.busNumber || selectedTrip?.bus?.bus_number}
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
          onBack={() => router.push('/bookings')}
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
          onContinue={() => {
            if (selectedSeatIds.length === 0) {
              setErrorMessage('অনুগ্রহ করে অন্তত একটি খালি আসন নির্বাচন করুন।');
              return;
            }
            const nonAvailable = selectedSeatIds.filter((id) => {
              const sObj = allCurrentSeats.find((s) => s.seatId === id);
              return !sObj || sObj.status !== 'AVAILABLE';
            });
            if (nonAvailable.length > 0) {
              setErrorMessage('⚠️ আপনার নির্বাচিত কিছু আসন ইতিমধ্যে বুকড হয়ে গেছে। অনুগ্রহ করে খালি আসন নির্বাচন করুন।');
              return;
            }
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <PassengerDetailsStep
          passengers={passengers}
          allCurrentSeats={allCurrentSeats}
          targetUniversity={targetUniversity}
          selectedTrip={selectedTrip}
          allTrips={trips}
          allBookings={allBookings}
          suggestedPassengerMap={suggestedPassengerMap}
          errorMessage={errorMessage}
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
          errorMessage={errorMessage}
          onSetErrorMessage={setErrorMessage}
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
          duePromiseDate={duePromiseDate}
          dueNote={dueNote}
          onDuePromiseDateChange={setDuePromiseDate}
          onDueNoteChange={setDueNote}
          onGoBack={() => setStep(4)}
          onGoToStep={(target) => setStep(target)}
          onConfirm={handleFinalSubmit}
        />
      )}

      {/* Floating Bottom Error Notification - Always visible regardless of scroll position, cleared from bottom-right AI tab */}
      {errorMessage && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-36 sm:max-w-xl z-50 bg-rose-600 dark:bg-rose-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-rose-300 dark:border-rose-500 flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wider text-rose-200">
                {language === 'bn' ? '⚠️ ত্রুটি / মনোযোগ দিন:' : 'Attention Required:'}
              </span>
              <span className="text-sm font-bold mt-0.5 block text-white">{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-sm flex items-center justify-center shrink-0 cursor-pointer"
            title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            ✕
          </button>
        </div>
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
