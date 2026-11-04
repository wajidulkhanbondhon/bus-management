'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Bus,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Check,
  Armchair,
  Info,
  X,
  ChevronRight,
  Filter,
  Compass,
  FileText,
  UserCheck,
  Users,
  Repeat,
  ShieldAlert,
  GraduationCap,
  Printer,
  SlidersHorizontal,
  Bookmark,
  Ban,
  DollarSign,
  Wallet,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';
import {
  shiftSeatAction,
  swapSeatsAction,
  transferBusAction,
  cancelSeatAction
} from '@/actions/booking.actions';
import { adjacentPartners } from '@/services/rules.service';
import { PaymentReceiptModal } from '@/components/booking/payment-receipt';

interface Props {
  initialBookings: any[];
  initialTrips?: any[];
}

export interface SeatItemData {
  seatId: string;
  seatNumber: string;
  rowLetter: string;
  colNum: number;
  fare: number;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'LOCKED' | 'CURRENT_BOOKING';
  gender?: 'MALE' | 'FEMALE';
  passengerName?: string;
  passengerPhone?: string;
  bookingId?: string;
  bookingNumber?: string;
}

// Seat Pricing Zones and Rule Specifications
export type SeatZoneType = 'VIP' | 'STANDARD' | 'ECONOMY';

export interface SeatZoneInfo {
  zone: SeatZoneType;
  label: string;
  shortLabel: string;
  rowRange: string;
  fare: number;
  badgeClass: string;
  accentClass: string;
  desc: string;
}

export function getSeatZoneInfo(seatNumber: string): SeatZoneInfo {
  const row = (seatNumber || '').charAt(0).toUpperCase();
  if (row === 'A' || row === 'B') {
    return {
      zone: 'VIP',
      label: 'সামনের ভিআইপি আসন (Front VIP)',
      shortLabel: 'VIP জোন',
      rowRange: 'সারি A - B',
      fare: 650,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
      accentClass: 'text-amber-600 dark:text-amber-400',
      desc: 'মসৃণ আরামদায়ক যাত্রা ও প্রশস্ত লেগরুম'
    };
  }
  if (row === 'I' || row === 'J') {
    return {
      zone: 'ECONOMY',
      label: 'পেছনের সাশ্রয়ী আসন (Rear Economy)',
      shortLabel: 'ইকোনমি জোন',
      rowRange: 'সারি I - J',
      fare: 500,
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700',
      accentClass: 'text-emerald-600 dark:text-emerald-400',
      desc: 'শিক্ষার্থী সাশ্রয়ী বাজেট বান্ধব আসন'
    };
  }
  return {
    zone: 'STANDARD',
    label: 'মাঝের রেগুলার আসন (Middle Standard)',
    shortLabel: 'রেগুলার জোন',
    rowRange: 'সারি C - H',
    fare: 550,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700',
    accentClass: 'text-blue-600 dark:text-blue-400',
    desc: 'ব্যালেন্সড আরামদায়ক উইন্ডো/আইল জার্নি'
  };
}

export function calculateFareComparison(oldSeat: string, newSeat: string) {
  const oldInfo = getSeatZoneInfo(oldSeat);
  const newInfo = getSeatZoneInfo(newSeat);
  const diff = newInfo.fare - oldInfo.fare;

  if (diff > 0) {
    return {
      status: 'UPGRADE' as const,
      diffAmount: diff,
      oldFare: oldInfo.fare,
      newFare: newInfo.fare,
      oldZone: oldInfo.shortLabel,
      newZone: newInfo.shortLabel,
      titleBn: 'আপগ্রেড: অতিরিক্ত ভাড়া প্রদেয়',
      summaryBn: `যাত্রী ${oldInfo.shortLabel} (৳${oldInfo.fare}) থেকে ${newInfo.shortLabel} (৳${newInfo.fare})-এ আপগ্রেড হচ্ছেন।`,
      amountText: `+৳${diff}`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
    };
  } else if (diff < 0) {
    const refund = Math.abs(diff);
    return {
      status: 'DOWNGRADE' as const,
      diffAmount: refund,
      oldFare: oldInfo.fare,
      newFare: newInfo.fare,
      oldZone: oldInfo.shortLabel,
      newZone: newInfo.shortLabel,
      titleBn: 'ডাউনগ্রেড: ভাড়া রিফান্ড ফেরতযোগ্য',
      summaryBn: `যাত্রী ${oldInfo.shortLabel} (৳${oldInfo.fare}) থেকে ${newInfo.shortLabel} (৳${newInfo.fare})-এ ডাউনগ্রেড হচ্ছেন।`,
      amountText: `-৳${refund}`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
    };
  }
  return {
    status: 'EQUAL' as const,
    diffAmount: 0,
    oldFare: oldInfo.fare,
    newFare: newInfo.fare,
    oldZone: oldInfo.shortLabel,
    newZone: newInfo.shortLabel,
    titleBn: 'সমমূল্যের আসন: কোনো ভাড়া পরিবর্তন নেই',
    summaryBn: `উভয় আসন ${oldInfo.shortLabel} শ্রেণিভুক্ত (৳${oldInfo.fare})। কোনো আর্থিক লেনদেন প্রয়োজন নেই।`,
    amountText: '৳০ সমমূল্য',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
  };
}

// Target Universities for filtering
export const TARGET_UNIVERSITIES = [
  { id: 'ALL', name: 'সকল বিশ্ববিদ্যালয়' },
  { id: 'RU', name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)' },
  { id: 'DU', name: 'ঢাকা বিশ্ববিদ্যালয় (DU)' },
  { id: 'CU', name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)' },
  { id: 'JU', name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)' },
  { id: 'GST', name: 'জিএসটি গুচ্ছ (GST Cluster)' }
];

export function SeatShiftClient({ initialBookings, initialTrips = [] }: Props) {
  const { language } = useApp();

  // Seed sample realistic bookings if sparse
  const seededBookings = useMemo(() => {
    const list = Array.isArray(initialBookings) && initialBookings.length >= 6 ? initialBookings : [
      ...(initialBookings || []),
      {
        id: 'bk-sample-ru-101',
        booking_number: 'BK-2026-RU-101',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'সুমাইয়া আক্তার',
        contact_phone: '01711-234567',
        passenger_gender: 'FEMALE',
        seats: [{ seat_number: 'A1', fare: 650 }],
        passengers: [{ passenger_name: 'সুমাইয়া আক্তার', passenger_phone: '01711-234567', gender: 'FEMALE', seat_number: 'A1' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        },
        shift_request: 'যাত্রীর অনুরোধ: জানালার পাশের আসন প্রয়োজন'
      },
      {
        id: 'bk-sample-ru-102',
        booking_number: 'BK-2026-RU-102',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'ফাতেমা জাহান',
        contact_phone: '01812-345678',
        passenger_gender: 'FEMALE',
        seats: [{ seat_number: 'A2', fare: 650 }],
        passengers: [{ passenger_name: 'ফাতেমা জাহান', passenger_phone: '01812-345678', gender: 'FEMALE', seat_number: 'A2' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        }
      },
      {
        id: 'bk-sample-ru-103',
        booking_number: 'BK-2026-RU-103',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'সাকিব আল হাসান',
        contact_phone: '01913-456789',
        passenger_gender: 'MALE',
        seats: [{ seat_number: 'B3', fare: 650 }],
        passengers: [{ passenger_name: 'সাকিব আল হাসান', passenger_phone: '01913-456789', gender: 'MALE', seat_number: 'B3' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        },
        shift_request: 'যাত্রীর অনুরোধ: বন্ধুদের সাথে পাশাপাশি বসতে চান'
      },
      {
        id: 'bk-sample-ru-104',
        booking_number: 'BK-2026-RU-104',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'তানভীর আহমেদ',
        contact_phone: '01614-567890',
        passenger_gender: 'MALE',
        seats: [{ seat_number: 'B4', fare: 650 }],
        passengers: [{ passenger_name: 'তানভীর আহমেদ', passenger_phone: '01614-567890', gender: 'MALE', seat_number: 'B4' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        }
      },
      {
        id: 'bk-sample-ru-105',
        booking_number: 'BK-2026-RU-105',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'মাহমুদুর রহমান',
        contact_phone: '01715-678901',
        passenger_gender: 'MALE',
        seats: [{ seat_number: 'C1', fare: 550 }],
        passengers: [{ passenger_name: 'মাহমুদুর রহমান', passenger_phone: '01715-678901', gender: 'MALE', seat_number: 'C1' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        },
        shift_request: 'অসুস্থতা: মোশন সিকনেস থাকায় সামনের VIP সিটে যেতে চান'
      },
      {
        id: 'bk-sample-ru-106',
        booking_number: 'BK-2026-RU-106',
        trip_id: 'trip-ru-01',
        booking_status: 'CONFIRMED',
        contact_name: 'আব্দুল্লাহ আল মামুন',
        contact_phone: '01515-998877',
        passenger_gender: 'MALE',
        seats: [{ seat_number: 'I1', fare: 500 }],
        passengers: [{ passenger_name: 'আব্দুল্লাহ আল মামুন', passenger_phone: '01515-998877', gender: 'MALE', seat_number: 'I1' }],
        trip: {
          id: 'trip-ru-01',
          trip_code: 'TRIP-RU-01',
          targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
          bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
          departure_date: '2026-09-05T22:30:00Z',
          departure_time: 'রাত ১০:৩০'
        },
        shift_request: 'অনুরোধ: পেছনের সিট থেকে সামনে যেতে চান'
      },
      {
        id: 'bk-sample-du-201',
        booking_number: 'BK-2026-DU-201',
        trip_id: 'trip-du-01',
        booking_status: 'CONFIRMED',
        contact_name: 'আরিফুল ইসলাম',
        contact_phone: '01816-789012',
        passenger_gender: 'MALE',
        seats: [{ seat_number: 'A3', fare: 650 }],
        passengers: [{ passenger_name: 'আরিফুল ইসলাম', passenger_phone: '01816-789012', gender: 'MALE', seat_number: 'A3' }],
        trip: {
          id: 'trip-du-01',
          trip_code: 'TRIP-DU-01',
          targetUniversity: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
          bus: { busName: 'কোচ-০৩ (ডিলাক্স)', busNumber: 'ঢাকা মেট্রো-ব ১৫-৩৩১৫' },
          departure_date: '2026-09-12T07:15:00Z',
          departure_time: 'সকাল ০৭:১৫'
        },
        shift_request: 'অনুরোধ: জানালার পাশের সিট পছন্দ'
      },
      {
        id: 'bk-sample-cu-301',
        booking_number: 'BK-2026-CU-301',
        trip_id: 'trip-cu-01',
        booking_status: 'CONFIRMED',
        contact_name: 'তাসনিম সুলতানা',
        contact_phone: '01917-890123',
        passenger_gender: 'FEMALE',
        seats: [{ seat_number: 'B1', fare: 650 }],
        passengers: [{ passenger_name: 'তাসনিম সুলতানা', passenger_phone: '01917-890123', gender: 'FEMALE', seat_number: 'B1' }],
        trip: {
          id: 'trip-cu-01',
          trip_code: 'TRIP-CU-01',
          targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
          bus: { busName: 'কোচ-০৪ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-৪৪২০' },
          departure_date: '2026-09-18T22:45:00Z',
          departure_time: 'রাত ১০:৪৫'
        }
      }
    ];
    return list;
  }, [initialBookings]);

  // Seed sample trips for alternate bus selection
  const seededTrips = useMemo(() => {
    if (Array.isArray(initialTrips) && initialTrips.length >= 3) return initialTrips;
    return [
      ...(initialTrips || []),
      {
        id: 'trip-ru-01',
        tripCode: 'TRIP-RU-01',
        targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
        bus: { busName: 'কোচ-০১ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-১১০১' },
        departure_date: '2026-09-05T22:30:00Z',
        departureTime: 'রাত ১০:৩০'
      },
      {
        id: 'trip-ru-02',
        tripCode: 'TRIP-RU-02',
        targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
        bus: { busName: 'কোচ-০২ (এসি এক্সপ্রেস)', busNumber: 'ঢাকা মেট্রো-ব ১৫-২২০২' },
        departure_date: '2026-09-05T23:00:00Z',
        departureTime: 'রাত ১১:০০'
      },
      {
        id: 'trip-du-01',
        tripCode: 'TRIP-DU-01',
        targetUniversity: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        bus: { busName: 'কোচ-০৩ (ডিলাক্স)', busNumber: 'ঢাকা মেট্রো-ব ১৫-৩৩১৫' },
        departure_date: '2026-09-12T07:15:00Z',
        departureTime: 'সকাল ০৭:১৫'
      },
      {
        id: 'trip-cu-01',
        tripCode: 'TRIP-CU-01',
        targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
        bus: { busName: 'কোচ-০৪ (স্পেশাল)', busNumber: 'ঢাকা মেট্রো-ব ১৫-৪৪২০' },
        departure_date: '2026-09-18T22:45:00Z',
        departureTime: 'রাত ১০:৪৫'
      },
      {
        id: 'trip-gst-01',
        tripCode: 'TRIP-GST-01',
        targetUniversity: 'জিএসটি গুচ্ছ (GST Cluster)',
        bus: { busName: 'কোচ-০৫ (সুপার)', busNumber: 'ঢাকা মেট্রো-ব ১৫-৫৫৫০' },
        departure_date: '2026-09-25T23:15:00Z',
        departureTime: 'রাত ১১:১৫'
      }
    ];
  }, [initialTrips]);

  const [bookingsList, setBookingsList] = useState<any[]>(seededBookings);
  const [tripsList, setTripsList] = useState<any[]>(seededTrips);

  // ──────────────── Left Filter Bar States ────────────────
  const [viewTab, setViewTab] = useState<'ALL' | 'REQUESTS'>('REQUESTS');
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState<string>('ALL');
  const [selectedBusFilter, setSelectedBusFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'ALL' | 'VIP' | 'STANDARD' | 'ECONOMY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ──────────────── Active Booking & Passenger ────────────────
  const [selectedBooking, setSelectedBooking] = useState<any | null>(seededBookings[0] || null);
  const [selectedOldSeat, setSelectedOldSeat] = useState<string>(
    (seededBookings[0]?.seats || [])[0]?.seat_number || 'A1'
  );

  // ──────────────── 4 Distinct Operational Workbenches ────────────────
  // 1. RELOCATE: Shift to Vacant Seat
  // 2. SWAP: Mutual Seat Exchange between Two Passengers
  // 3. TRANSFER_BUS: Switch to another Bus targeting the same/other University
  // 4. CANCEL_SEAT: Cancel seat & refund immediately
  const [activeTab, setActiveTab] = useState<'RELOCATE' | 'SWAP' | 'TRANSFER_BUS' | 'CANCEL_SEAT'>('RELOCATE');

  // Mode 1 (Relocate): Selected Vacant Seat on Current Bus
  const [targetVacantSeat, setTargetVacantSeat] = useState<string>('');

  // Mode 2 (Swap): Selected Occupied Seat / Passenger 2
  const [targetSwapSeat, setTargetSwapSeat] = useState<SeatItemData | null>(null);

  // Mode 3 (Transfer Bus): Selected Alternate Trip & Seat
  const [targetOtherTripId, setTargetOtherTripId] = useState<string>('');
  const [targetOtherBusSeat, setTargetOtherBusSeat] = useState<string>('');
  const [otherBusSeats, setOtherBusSeats] = useState<SeatItemData[]>([]);

  // Mode 4 (Cancel Seat): Cancellation Fee & Reason
  const [cancellationFee, setCancellationFee] = useState<number>(50);
  const [cancellationReason, setCancellationReason] = useState<string>('যাত্রীর ব্যক্তিগত অনুরোধ / যাত্রা বাতিল');

  // Shared Operation States
  const [shiftReason, setShiftReason] = useState('জানালার পাশের আসন পছন্দ / সিট শিফট');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; actionType?: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Live Seats of Current Bus
  const [tripSeats, setTripSeats] = useState<SeatItemData[]>([]);

  // Common Presets
  const presetReasons = [
    'জানালার পাশের আসন পছন্দ',
    'পরিবারের সাথে পাশাপাশি বসা',
    'শারীরিক অসুস্থতা / সামনের VIP সিট প্রয়োজন',
    'এসি ভেন্টিলেশন / ঠাণ্ডা বেশি হওয়ায় পরিবর্তন',
    'কাউন্টার অ্যাডমিন সমন্বয় / অফিসিয়াল সিট শিফট'
  ];

  const cancelReasons = [
    'যাত্রীর ব্যক্তিগত অনুরোধ / যাত্রা বাতিল',
    'শারীরিক অসুস্থতা বা জরুরি পারিবারিক কাজ',
    'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার তারিখ পরিবর্তন',
    'ভুলবশত বুকিং বা টিকিট বাতিল'
  ];

  // Helper to extract University name
  const getBookingUniversity = (b: any): string => {
    return (
      b.trip?.targetUniversity ||
      b.trip?.target_university ||
      b.target_university ||
      b.targetUniversity ||
      'অন্যান্য বিশ্ববিদ্যালয়'
    );
  };

  // Helper to extract Bus Name
  const getBookingBusName = (b: any): string => {
    return (
      b.trip?.bus?.busName ||
      b.trip?.bus?.bus_name ||
      b.trip?.bus?.busNumber ||
      'কোচ'
    );
  };

  // Extract unique bus list for filter dropdown
  const availableBusNames = useMemo(() => {
    const set = new Set<string>();
    bookingsList.forEach((b) => {
      const name = getBookingBusName(b);
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [bookingsList]);

  // Active Passenger Data
  const activePassenger = useMemo(() => {
    if (!selectedBooking) return null;
    const passengers = selectedBooking.passengers || [];
    const matched = passengers.find(
      (p: any) => (p.seat_number || p.seatNumber || '').toUpperCase() === selectedOldSeat.toUpperCase()
    );
    if (matched) return matched;
    return {
      passenger_name: selectedBooking.contact_name || selectedBooking.contactName || 'Passenger',
      gender: selectedBooking.passenger_gender || selectedBooking.passengerGender || 'MALE',
      seat_number: selectedOldSeat
    };
  }, [selectedBooking, selectedOldSeat]);

  const activeGender: 'MALE' | 'FEMALE' = useMemo(() => {
    const g = (activePassenger?.gender || selectedBooking?.passenger_gender || 'MALE').toUpperCase();
    return g === 'FEMALE' ? 'FEMALE' : 'MALE';
  }, [activePassenger, selectedBooking]);

  // Pending Requests Count
  const pendingRequestsCount = useMemo(() => {
    return bookingsList.filter((b) => Boolean(b.shift_request)).length;
  }, [bookingsList]);

  // Filtered Bookings List based on all 5 filters
  const filteredBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      // 1. Tab Filter: Requests vs All
      if (viewTab === 'REQUESTS' && !b.shift_request) {
        return false;
      }

      // 2. University Filter
      if (selectedUniversityFilter !== 'ALL') {
        const uni = getBookingUniversity(b);
        if (!uni.toLowerCase().includes(selectedUniversityFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Bus Filter
      if (selectedBusFilter !== 'ALL') {
        const bus = getBookingBusName(b);
        if (bus !== selectedBusFilter) {
          return false;
        }
      }

      // 4. Gender Filter
      if (selectedGenderFilter !== 'ALL') {
        const bGender = (b.passenger_gender || b.passengers?.[0]?.gender || 'MALE').toUpperCase();
        if (bGender !== selectedGenderFilter) {
          return false;
        }
      }

      // 5. Zone Filter
      if (selectedZoneFilter !== 'ALL') {
        const primarySeat = (b.seats || [])[0]?.seat_number || 'A1';
        const zInfo = getSeatZoneInfo(primarySeat);
        if (zInfo.zone !== selectedZoneFilter) {
          return false;
        }
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const bNum = (b.booking_number || b.bookingNumber || '').toLowerCase();
        const name = (b.contact_name || b.contactName || '').toLowerCase();
        const phone = (b.contact_phone || b.contactPhone || '').toLowerCase();
        const seats = (b.seats || []).map((s: any) => s.seat_number || s.seatNumber || '').join(' ').toLowerCase();
        return bNum.includes(q) || name.includes(q) || phone.includes(q) || seats.includes(q);
      }

      return true;
    });
  }, [bookingsList, viewTab, selectedUniversityFilter, selectedBusFilter, selectedGenderFilter, selectedZoneFilter, searchQuery]);

  // Build realistic coach map
  const generateRealisticCoachSeats = (tripId: string, currentBookingSeats: string[], allBookings: any[]) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seats: SeatItemData[] = [];

    const bookedSeatMap = new Map<string, { gender: 'MALE' | 'FEMALE'; name: string; phone: string; bId: string; bNum: string }>();

    allBookings.forEach((b) => {
      const bTrip = b.trip_id || b.tripId || b.trip?.id;
      if (bTrip === tripId && b.id !== selectedBooking?.id) {
        (b.passengers || []).forEach((p: any) => {
          const sNum = (p.seat_number || p.seatNumber || '').toUpperCase();
          if (sNum) {
            bookedSeatMap.set(sNum, {
              gender: (p.gender || 'MALE').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              name: p.passenger_name || p.passengerName || 'যাত্রী',
              phone: p.passenger_phone || p.passengerPhone || '—',
              bId: b.id,
              bNum: b.booking_number || b.bookingNumber || b.id
            });
          }
        });
        (b.seats || []).forEach((s: any) => {
          const sNum = (s.seat_number || s.seatNumber || s.seat_id || '').toUpperCase();
          if (sNum && !bookedSeatMap.has(sNum)) {
            bookedSeatMap.set(sNum, {
              gender: (b.passenger_gender || 'MALE').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              name: b.contact_name || b.contactName || 'যাত্রী',
              phone: b.contact_phone || b.contactPhone || '—',
              bId: b.id,
              bNum: b.booking_number || b.bookingNumber || b.id
            });
          }
        });
      }
    });

    // Ensure realistic occupancy so the map is never blank!
    if (bookedSeatMap.size < 4) {
      const baseline = [
        { seat: 'B3', gender: 'MALE' as const, name: 'সাকিব আল হাসান', phone: '01913-456789', bId: 'bk-sample-ru-103', bNum: 'BK-2026-RU-103' },
        { seat: 'B4', gender: 'MALE' as const, name: 'তানভীর আহমেদ', phone: '01614-567890', bId: 'bk-sample-ru-104', bNum: 'BK-2026-RU-104' },
        { seat: 'C1', gender: 'MALE' as const, name: 'মাহমুদুর রহমান', phone: '01715-678901', bId: 'bk-sample-ru-105', bNum: 'BK-2026-RU-105' },
        { seat: 'E1', gender: 'FEMALE' as const, name: 'মারিয়া আক্তার', phone: '01611-000555', bId: 'bk-e1', bNum: 'BK-OCC-05' },
        { seat: 'E2', gender: 'FEMALE' as const, name: 'নুসরাত জাহান', phone: '01711-000333', bId: 'bk-e2', bNum: 'BK-OCC-03' },
        { seat: 'F4', gender: 'MALE' as const, name: 'আসিফ মাহমুদ', phone: '01511-000666', bId: 'bk-f4', bNum: 'BK-OCC-06' },
        { seat: 'I1', gender: 'MALE' as const, name: 'আব্দুল্লাহ আল মামুন', phone: '01515-998877', bId: 'bk-sample-ru-106', bNum: 'BK-2026-RU-106' }
      ];
      baseline.forEach((base) => {
        if (!currentBookingSeats.includes(base.seat) && !bookedSeatMap.has(base.seat)) {
          bookedSeatMap.set(base.seat, base);
        }
      });
    }

    rows.forEach((rowLetter) => {
      const isRearBench = rowLetter === 'J';
      const colCount = isRearBench ? 5 : 4;
      const zInfo = getSeatZoneInfo(`${rowLetter}1`);

      for (let col = 1; col <= colCount; col++) {
        const sNum = `${rowLetter}${col}`;
        const isCurrentMine = currentBookingSeats.some((cs) => cs.toUpperCase() === sNum);
        const booked = bookedSeatMap.get(sNum);

        let status: SeatItemData['status'] = 'AVAILABLE';
        if (isCurrentMine) {
          status = 'CURRENT_BOOKING';
        } else if (booked) {
          status = 'BOOKED';
        }

        seats.push({
          seatId: `${tripId}-${sNum}`,
          seatNumber: sNum,
          rowLetter,
          colNum: col,
          fare: zInfo.fare,
          status,
          gender: isCurrentMine ? activeGender : booked?.gender,
          passengerName: isCurrentMine ? (activePassenger?.passenger_name || 'Passenger') : booked?.name,
          passengerPhone: booked?.phone,
          bookingId: booked?.bId,
          bookingNumber: booked?.bNum
        });
      }
    });

    return seats;
  };

  // Load Current Bus Seats
  useEffect(() => {
    if (!selectedBooking) {
      setTripSeats([]);
      setSelectedOldSeat('');
      setTargetVacantSeat('');
      setTargetSwapSeat(null);
      return;
    }

    const currentSeats = (selectedBooking.seats || []).map(
      (s: any) => (s.seat_number || s.seatNumber || s.seat_id || '').toUpperCase()
    );

    // Auto-select the passenger's current seat!
    if (currentSeats.length > 0) {
      if (!selectedOldSeat || !currentSeats.includes(selectedOldSeat.toUpperCase())) {
        setSelectedOldSeat(currentSeats[0]);
      }
    }

    setTargetVacantSeat('');
    setTargetSwapSeat(null);
    setStatusMessage(null);

    const tripId = selectedBooking.trip_id || selectedBooking.tripId || selectedBooking.trip?.id || 'trip-ru-01';
    setTripSeats(generateRealisticCoachSeats(tripId, currentSeats, bookingsList));
  }, [selectedBooking, bookingsList]);

  // Load Other Bus Seats when switching trips
  useEffect(() => {
    if (activeTab !== 'TRANSFER_BUS' || !targetOtherTripId) {
      setOtherBusSeats([]);
      setTargetOtherBusSeat('');
      return;
    }

    setOtherBusSeats(generateRealisticCoachSeats(targetOtherTripId, [], bookingsList));
  }, [activeTab, targetOtherTripId, bookingsList]);

  // Calculate Dynamic Adjacent Gender Locks
  const calculateLocks = (seats: SeatItemData[]) => {
    const lockMap = new Map<string, { genderAllowed: 'MALE_ONLY' | 'FEMALE_ONLY'; adjacentSeat: string }>();
    const bookedGenderMap = new Map<string, 'MALE' | 'FEMALE'> ();

    seats.forEach((s) => {
      if (s.status === 'BOOKED' && s.gender) {
        bookedGenderMap.set(s.seatNumber, s.gender);
      }
    });

    seats.forEach((s) => {
      if (s.status === 'AVAILABLE') {
        const partners = adjacentPartners(s.seatNumber, { fiveSeatRows: ['J'] });
        for (const partner of partners) {
          const pGender = bookedGenderMap.get(partner);
          if (pGender) {
            lockMap.set(s.seatNumber, {
              genderAllowed: pGender === 'FEMALE' ? 'FEMALE_ONLY' : 'MALE_ONLY',
              adjacentSeat: partner
            });
            break;
          }
        }
      }
    });

    return lockMap;
  };

  const currentBusLocks = useMemo(() => calculateLocks(tripSeats), [tripSeats]);
  const otherBusLocks = useMemo(() => calculateLocks(otherBusSeats), [otherBusSeats]);

  // Gender Rule Validator
  const validateGenderRule = (seatNum: string, locks: Map<string, any>, testGender = activeGender) => {
    const lock = locks.get(seatNum);
    if (!lock) return { allowed: true };

    if (lock.genderAllowed === 'FEMALE_ONLY' && testGender === 'MALE') {
      return {
        allowed: false,
        reason: `জেন্ডার রুলস ব্লক: আসন ${seatNum}-এর সংলগ্ন আসন (${lock.adjacentSeat}) একজন নারী শিক্ষার্থী বুক করেছেন। "ছেলের পাশে ছেলে, মেয়ের পাশে মেয়ে" নীতি অনুযায়ী পুরুষ যাত্রী বসতে পারবেন না।`
      };
    }

    if (lock.genderAllowed === 'MALE_ONLY' && testGender === 'FEMALE') {
      return {
        allowed: false,
        reason: `জেন্ডার রুলস ব্লক: আসন ${seatNum}-এর সংলগ্ন আসন (${lock.adjacentSeat}) একজন পুরুষ শিক্ষার্থী বুক করেছেন। "ছেলের পাশে ছেলে, মেয়ের পাশে মেয়ে" নীতি অনুযায়ী নারী যাত্রী বসতে পারবেন না।`
      };
    }

    return { allowed: true };
  };

  // Group seats by 2+2 rows
  const groupRows = (seats: SeatItemData[]) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return letters.map((letter) => {
      const rowSeats = seats.filter((s) => s.rowLetter === letter);
      const isRear = letter === 'J';
      if (isRear) {
        return {
          rowLetter: letter,
          isRear: true,
          left: rowSeats.filter((s) => s.colNum <= 2),
          middle: rowSeats.find((s) => s.colNum === 3),
          right: rowSeats.filter((s) => s.colNum >= 4)
        };
      }
      return {
        rowLetter: letter,
        isRear: false,
        left: rowSeats.filter((s) => s.colNum <= 2),
        middle: null,
        right: rowSeats.filter((s) => s.colNum >= 3)
      };
    });
  };

  const currentRows = useMemo(() => groupRows(tripSeats), [tripSeats]);
  const otherRows = useMemo(() => groupRows(otherBusSeats), [otherBusSeats]);

  // Alternate Trips Filtered (matching the same target university if possible)
  const alternateTrips = useMemo(() => {
    if (!selectedBooking) return tripsList;
    const currentTripId = selectedBooking.trip_id || selectedBooking.tripId || selectedBooking.trip?.id;
    return tripsList.filter((t) => t.id !== currentTripId);
  }, [tripsList, selectedBooking]);

  useEffect(() => {
    if (alternateTrips.length > 0 && !targetOtherTripId) {
      setTargetOtherTripId(alternateTrips[0].id);
    }
  }, [alternateTrips, targetOtherTripId]);

  // Current Seat Zone and Fare Info
  const currentSeatZone = useMemo(() => {
    return getSeatZoneInfo(selectedOldSeat);
  }, [selectedOldSeat]);

  // Fare Comparison for Relocate Mode
  const relocateFareComp = useMemo(() => {
    if (!targetVacantSeat) return null;
    return calculateFareComparison(selectedOldSeat, targetVacantSeat);
  }, [selectedOldSeat, targetVacantSeat]);

  // Fare Comparison for Transfer Bus Mode
  const transferBusFareComp = useMemo(() => {
    if (!targetOtherBusSeat) return null;
    return calculateFareComparison(selectedOldSeat, targetOtherBusSeat);
  }, [selectedOldSeat, targetOtherBusSeat]);

  // Handle Seat Click on Current Bus
  const handleSeatClick = (seat: SeatItemData) => {
    setStatusMessage(null);

    // 1. If clicking current seat, switch active seat if multi-seat booking
    if (seat.status === 'CURRENT_BOOKING') {
      setSelectedOldSeat(seat.seatNumber);
      setTargetVacantSeat('');
      setTargetSwapSeat(null);
      return;
    }

    // 2. If clicking an AVAILABLE empty seat
    if (seat.status === 'AVAILABLE') {
      const check = validateGenderRule(seat.seatNumber, currentBusLocks, activeGender);
      if (!check.allowed) {
        setStatusMessage({ type: 'error', text: check.reason || 'জেন্ডার রুলস লঙ্ঘন হয়েছে' });
        return;
      }
      setTargetVacantSeat(seat.seatNumber);
      setTargetSwapSeat(null);
      // Auto-activate relocate tab if currently on swap
      if (activeTab === 'SWAP') {
        setActiveTab('RELOCATE');
      }
      return;
    }

    // 3. If clicking an OCCUPIED booked seat -> Mutual Swap
    if (seat.status === 'BOOKED') {
      setTargetSwapSeat(seat);
      setTargetVacantSeat('');
      setActiveTab('SWAP');
    }
  };

  // Reset Filters Function
  const handleResetFilters = () => {
    setViewTab('ALL');
    setSelectedUniversityFilter('ALL');
    setSelectedBusFilter('ALL');
    setSelectedGenderFilter('ALL');
    setSelectedZoneFilter('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      viewTab !== 'ALL' ||
      selectedUniversityFilter !== 'ALL' ||
      selectedBusFilter !== 'ALL' ||
      selectedGenderFilter !== 'ALL' ||
      selectedZoneFilter !== 'ALL' ||
      searchQuery.trim().length > 0
    );
  }, [viewTab, selectedUniversityFilter, selectedBusFilter, selectedGenderFilter, selectedZoneFilter, searchQuery]);

  // ──────────────── Execute Operations ────────────────
  const handleExecuteOperation = async () => {
    if (!selectedBooking || !selectedOldSeat) return;
    setIsProcessing(true);
    setStatusMessage(null);
    setShowConfirmModal(false);

    try {
      // ──────────────── OPTION 1: RELOCATE TO VACANT SEAT ────────────────
      if (activeTab === 'RELOCATE') {
        if (!targetVacantSeat) throw new Error('অনুগ্রহ করে বাসের ম্যাপ থেকে একটি ফাঁকা আসন পছন্দ করুন।');

        const res = await shiftSeatAction({
          bookingId: selectedBooking.id,
          currentSeat: selectedOldSeat,
          targetSeat: targetVacantSeat,
          reason: shiftReason
        });
        if (!res.success) throw new Error(res.error || 'আসন স্থানান্তর করা যায়নি।');

        const oldSeatNum = selectedOldSeat.toUpperCase();
        const newSeatNum = targetVacantSeat.toUpperCase();
        const newZone = getSeatZoneInfo(newSeatNum);

        // Immediately update seat map: free old seat, take new seat!
        setTripSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber.toUpperCase() === oldSeatNum) {
              return { ...s, status: 'AVAILABLE', passengerName: undefined, gender: undefined };
            }
            if (s.seatNumber.toUpperCase() === newSeatNum) {
              return { ...s, status: 'CURRENT_BOOKING', passengerName: activePassenger?.passenger_name, gender: activeGender, fare: newZone.fare };
            }
            return s;
          })
        );

        // Update local booking
        const updatedBooking = {
          ...selectedBooking,
          shift_request: undefined,
          seats: [{ seat_number: newSeatNum, fare: newZone.fare }],
          passengers: [{ ...(selectedBooking.passengers?.[0] || {}), seat_number: newSeatNum }]
        };
        setSelectedBooking(updatedBooking);
        setBookingsList((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));

        setSelectedOldSeat(newSeatNum);
        setTargetVacantSeat('');

        const comp = calculateFareComparison(oldSeatNum, newSeatNum);
        setStatusMessage({
          type: 'success',
          text: `আসন স্থানান্তর সফল হয়েছে! পূর্বের সিট [${oldSeatNum}] খালি করে নতুন সিট [${newSeatNum}] বরাদ্দ করা হয়েছে। (${comp.amountText})`,
          actionType: 'SHIFT'
        });
      }

      // ──────────────── OPTION 2: MUTUAL SEAT SWAP ────────────────
      else if (activeTab === 'SWAP') {
        if (!targetSwapSeat) throw new Error('অনুগ্রহ করে সিট সোয়াপ করার জন্য অপর কোনো যাত্রীর আসন নির্বাচন করুন।');

        // Mutual Gender Safety Verification
        const p1CanSitInSeat2 = validateGenderRule(targetSwapSeat.seatNumber, currentBusLocks, activeGender);
        if (!p1CanSitInSeat2.allowed) {
          throw new Error(`সোয়াপ বাতিল: ${activePassenger?.passenger_name} সিট ${targetSwapSeat.seatNumber}-এ বসলে জেন্ডার রুলস ভঙ্গ হবে (${p1CanSitInSeat2.reason})`);
        }

        const p2Gender = targetSwapSeat.gender || 'MALE';
        const p2CanSitInSeat1 = validateGenderRule(selectedOldSeat, currentBusLocks, p2Gender);
        if (!p2CanSitInSeat1.allowed) {
          throw new Error(`সোয়াপ বাতিল: অপর যাত্রী (${targetSwapSeat.passengerName}) আপনার সিট ${selectedOldSeat}-এ বসলে জেন্ডার রুলস ভঙ্গ হবে (${p2CanSitInSeat1.reason})`);
        }

        const res = await swapSeatsAction({
          bookingId1: selectedBooking.id,
          seat1: selectedOldSeat,
          bookingId2: targetSwapSeat.bookingId || 'bk-swap',
          seat2: targetSwapSeat.seatNumber,
          reason: shiftReason
        });
        if (!res.success) throw new Error(res.error || 'সিট অদলবদল ব্যর্থ হয়েছে।');

        const s1 = selectedOldSeat.toUpperCase();
        const s2 = targetSwapSeat.seatNumber.toUpperCase();

        setTripSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber.toUpperCase() === s1) {
              return { ...s, status: 'BOOKED', passengerName: targetSwapSeat.passengerName, gender: targetSwapSeat.gender };
            }
            if (s.seatNumber.toUpperCase() === s2) {
              return { ...s, status: 'CURRENT_BOOKING', passengerName: activePassenger?.passenger_name, gender: activeGender };
            }
            return s;
          })
        );

        const updatedBooking = {
          ...selectedBooking,
          shift_request: undefined,
          seats: [{ seat_number: s2, fare: getSeatZoneInfo(s2).fare }],
          passengers: [{ ...(selectedBooking.passengers?.[0] || {}), seat_number: s2 }]
        };
        setSelectedBooking(updatedBooking);
        setBookingsList((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));

        setSelectedOldSeat(s2);
        setTargetSwapSeat(null);
        setActiveTab('RELOCATE');

        setStatusMessage({
          type: 'success',
          text: `সিট অদলবদল (Swap) সফল হয়েছে! আপনার আসন [${s2}] এবং ${targetSwapSeat.passengerName}-এর আসন [${s1}] সফলভাবে ইন্টারচেঞ্জ করা হয়েছে!`,
          actionType: 'SWAP'
        });
      }

      // ──────────────── OPTION 3: TRANSFER TO ALTERNATIVE BUS ────────────────
      else if (activeTab === 'TRANSFER_BUS') {
        if (!targetOtherTripId || !targetOtherBusSeat) {
          throw new Error('বিকল্প বাস ও নতুন খালি আসন নির্বাচন করুন।');
        }

        const res = await transferBusAction({
          bookingId: selectedBooking.id,
          currentSeat: selectedOldSeat,
          targetTripId: targetOtherTripId,
          targetSeat: targetOtherBusSeat,
          reason: shiftReason
        });
        if (!res.success) throw new Error(res.error || 'বাস স্থানান্তর ব্যর্থ হয়েছে।');

        const targetTrip = alternateTrips.find((t) => t.id === targetOtherTripId);
        const newBusName = targetTrip?.bus?.busName || targetTrip?.bus?.bus_number || 'নতুন বাস';

        // Free seat on old bus
        const oldSeatNum = selectedOldSeat.toUpperCase();
        setTripSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber.toUpperCase() === oldSeatNum) {
              return { ...s, status: 'AVAILABLE', passengerName: undefined, gender: undefined };
            }
            return s;
          })
        );

        const updatedBooking = {
          ...selectedBooking,
          trip_id: targetOtherTripId,
          trip: targetTrip,
          shift_request: undefined,
          seats: [{ seat_number: targetOtherBusSeat, fare: getSeatZoneInfo(targetOtherBusSeat).fare }],
          passengers: [{ ...(selectedBooking.passengers?.[0] || {}), seat_number: targetOtherBusSeat }]
        };
        setSelectedBooking(updatedBooking);
        setBookingsList((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));

        setSelectedOldSeat(targetOtherBusSeat);
        setTargetOtherBusSeat('');
        setActiveTab('RELOCATE');

        setStatusMessage({
          type: 'success',
          text: `সফলভাবে ${newBusName}-এ সিট [${targetOtherBusSeat}]-এ টিকিট স্থানান্তর সম্পন্ন হয়েছে!`,
          actionType: 'TRANSFER'
        });
      }

      // ──────────────── OPTION 4: CANCEL SEAT & REFUND ────────────────
      else if (activeTab === 'CANCEL_SEAT') {
        const fare = currentSeatZone.fare;
        const refundAmt = Math.max(0, fare - cancellationFee);

        const res = await cancelSeatAction({
          bookingId: selectedBooking.id,
          seatNumber: selectedOldSeat,
          reason: cancellationReason,
          cancellationFee: cancellationFee,
          refundAmount: refundAmt
        });
        if (!res.success) throw new Error(res.error || 'সিট বাতিল করা যায়নি।');

        // Instantly free the seat on the bus map so anyone can book/shift into it!
        const freedSeatNum = selectedOldSeat.toUpperCase();
        setTripSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber.toUpperCase() === freedSeatNum) {
              return { ...s, status: 'AVAILABLE', passengerName: undefined, gender: undefined };
            }
            return s;
          })
        );

        // Update booking status in list
        const updatedBooking = {
          ...selectedBooking,
          booking_status: 'CANCELLED',
          shift_request: undefined,
          cancellation_fee: cancellationFee,
          refund_amount: refundAmt
        };
        setSelectedBooking(updatedBooking);
        setBookingsList((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));

        setStatusMessage({
          type: 'success',
          text: `আসন [${freedSeatNum}] সফলভাবে বাতিল ও মুক্ত করা হয়েছে! রিফান্ড: ৳${refundAmt} (ফি: ৳${cancellationFee})। সিটটি এখন যে কারও জন্য উন্মুক্ত।`,
          actionType: 'CANCEL'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'অপারেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render a Single Seat Cell
  const renderSeatCell = (seat: SeatItemData, isOtherBus = false, locks: Map<string, any>) => {
    const isCurrentMine = !isOtherBus && seat.seatNumber.toUpperCase() === selectedOldSeat.toUpperCase();
    const isTargetVacant = !isOtherBus && targetVacantSeat.toUpperCase() === seat.seatNumber.toUpperCase();
    const isTargetSwap = !isOtherBus && targetSwapSeat?.seatNumber.toUpperCase() === seat.seatNumber.toUpperCase();
    const isTargetOther = isOtherBus && targetOtherBusSeat.toUpperCase() === seat.seatNumber.toUpperCase();

    const isAvailable = seat.status === 'AVAILABLE';
    const isBooked = seat.status === 'BOOKED';

    const lock = locks.get(seat.seatNumber);
    const isFemaleLocked = lock?.genderAllowed === 'FEMALE_ONLY';
    const isMaleLocked = lock?.genderAllowed === 'MALE_ONLY';

    const genderBlocked = isAvailable && (
      (isFemaleLocked && activeGender === 'MALE') ||
      (isMaleLocked && activeGender === 'FEMALE')
    );

    const zInfo = getSeatZoneInfo(seat.seatNumber);

    return (
      <button
        key={seat.seatNumber}
        type="button"
        disabled={genderBlocked}
        onClick={() => {
          if (isOtherBus) {
            if (isAvailable && !genderBlocked) {
              setTargetOtherBusSeat(seat.seatNumber);
            }
          } else {
            handleSeatClick(seat);
          }
        }}
        title={
          isCurrentMine
            ? `যাত্রীর বর্তমান আসন ${seat.seatNumber} (${zInfo.shortLabel} • ৳${zInfo.fare})`
            : isTargetVacant || isTargetOther
            ? `নতুন নির্বাচিত খালি আসন ${seat.seatNumber} (${zInfo.shortLabel} • ৳${zInfo.fare})`
            : isTargetSwap
            ? `সোয়াপ করার জন্য নির্বাচিত আসন ${seat.seatNumber} (${seat.passengerName})`
            : genderBlocked
            ? `জেন্ডার রুলস ব্লক: সংলগ্ন আসনে (${lock?.adjacentSeat}) বিপরীত জেন্ডার বুক করেছেন`
            : isBooked
            ? `বুক করা আসন: ${seat.passengerName || 'যাত্রী'} (${seat.gender === 'FEMALE' ? 'নারী' : 'পুরুষ'}) - সিট সোয়াপ করতে ক্লিক করুন`
            : isFemaleLocked
            ? `নারী সংরক্ষিত (পাশে নারী যাত্রী) • ${zInfo.shortLabel} • ৳${zInfo.fare}`
            : isMaleLocked
            ? `পুরুষ সংরক্ষিত (পাশে পুরুষ যাত্রী) • ${zInfo.shortLabel} • ৳${zInfo.fare}`
            : `খালি আসন ${seat.seatNumber} (${zInfo.shortLabel} • ৳${zInfo.fare}) - সিলেক্ট করতে ক্লিক করুন`
        }
        className={`w-12 h-14 sm:w-13 sm:h-15 rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all relative font-mono font-black select-none ${
          isCurrentMine
            ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-lg ring-4 ring-blue-400/50 scale-105 z-20 cursor-pointer'
            : isTargetVacant || isTargetOther
            ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg ring-4 ring-emerald-400/50 scale-105 animate-pulse z-20'
            : isTargetSwap
            ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-lg ring-4 ring-amber-400/50 scale-105 z-20'
            : genderBlocked
            ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-300 border border-dashed border-rose-300 dark:border-rose-900 cursor-not-allowed opacity-50'
            : isFemaleLocked
            ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-2 border-pink-400/70 hover:border-pink-500 hover:scale-105 shadow-xs'
            : isMaleLocked
            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400/70 hover:border-blue-500 hover:scale-105 shadow-xs'
            : isAvailable
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-105 shadow-xs'
            : isBooked
            ? 'bg-slate-200/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-amber-400 hover:scale-105 shadow-xs cursor-pointer'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-400 opacity-60 cursor-not-allowed'
        }`}
      >
        <div
          className={`w-8 h-1 rounded-full transition-colors ${
            isCurrentMine
              ? 'bg-sky-200'
              : isTargetVacant || isTargetOther
              ? 'bg-emerald-200'
              : isTargetSwap
              ? 'bg-amber-200'
              : isBooked
              ? seat.gender === 'FEMALE' ? 'bg-pink-500' : 'bg-blue-500'
              : isFemaleLocked
              ? 'bg-pink-400'
              : isMaleLocked
              ? 'bg-blue-400'
              : 'bg-emerald-400'
          }`}
        />

        <span className="text-xs sm:text-sm tracking-tight leading-none mt-0.5">
          {seat.seatNumber}
        </span>

        <div className="w-full text-center text-[9px] font-sans font-bold leading-none py-0.5">
          {isCurrentMine ? (
            <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded-sm">বর্তমান</span>
          ) : isTargetVacant || isTargetOther ? (
            <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded-sm">নতুন</span>
          ) : isTargetSwap ? (
            <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded-sm">সোয়াপ</span>
          ) : isBooked ? (
            <span className={seat.gender === 'FEMALE' ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}>
              {seat.gender === 'FEMALE' ? '👩 নারী' : '👨 পুরুষ'}
            </span>
          ) : isFemaleLocked ? (
            <span className="text-pink-600 dark:text-pink-400 text-[8px]">নারী</span>
          ) : isMaleLocked ? (
            <span className="text-blue-600 dark:text-blue-400 text-[8px]">পুরুষ</span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-300 text-[8px] font-mono">৳{zInfo.fare}</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-20">
      {/* ──────────────── Top Navigation & Header ──────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                <ArrowLeftRight className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>আসন পরিবর্তন, সোয়াপ ও বাতিল কনসোল</span>
                  <Badge variant="primary" className="bg-blue-500/30 text-blue-200 border-blue-400/40 text-[10px]">
                    স্মার্ট এডিশন
                  </Badge>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  একই বাসে খালি সিটে স্থানান্তর, পারস্পরিক সিট অদলবদল (Swap), বিকল্প বাসে স্থানান্তর এবং আসন বাতিল ও ইনস্ট্যান্ট রিফান্ড ম্যানেজমেন্ট।
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>{showGuide ? 'সহায়িকা লুকান' : 'রুলস সহায়িকা'}</span>
            </button>
            <Link href="/bookings">
              <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl font-bold text-xs">
                সকল বুকিং তালিকা
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Zone Pricing Banner */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
              <div>
                <span className="font-black text-amber-200 block text-xs">ভিআইপি জোন (সারি A-B)</span>
                <span className="text-[10px] text-amber-300/80">সামনের স্পেশাল লেগরুম</span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-amber-300">৳৬৫০</span>
          </div>

          <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-400/30" />
              <div>
                <span className="font-black text-blue-200 block text-xs">রেগুলার জোন (সারি C-H)</span>
                <span className="text-[10px] text-blue-300/80">মাঝের স্ট্যান্ডার্ড আসন</span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-blue-300">৳৫৫০</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
              <div>
                <span className="font-black text-emerald-200 block text-xs">ইকোনমি জোন (সারি I-J)</span>
                <span className="text-[10px] text-emerald-300/80">পেছনের সাশ্রয়ী আসন</span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-emerald-300">৳৫০০</span>
          </div>
        </div>

        {/* Collapsible Rules Guide */}
        {showGuide && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <span className="font-black text-emerald-300 block">১. খালি সিটে শিফট</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  বাসের খালি সিটে স্থানান্তর করলে পূর্বের আসন তাৎক্ষণিক সবার জন্য খালি হয়ে যাবে। সামনের জোনে গেলে অতিরিক্ত ভাড়া প্রদেয়, পেছনে গেলে রিফান্ড ফেরত।
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <span className="font-black text-amber-300 block">২. সিট অদলবদল (Swap)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  উভয় যাত্রীর জেন্ডার রুলস চেক করে পারস্পরিক সিট এক্সচেঞ্জ করা হয়। দুই জোনের মূল্যের ব্যবধান অটোমেটিক সমন্বয় হয়।
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <span className="font-black text-sky-300 block">৩. বিকল্প বাস (Transfer)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  টার্গেট বিশ্ববিদ্যালয়ের অন্য কোনো শিডিউলড বাসে টিকিট স্থানান্তর করে সাথে সাথে নতুন প্রিন্টযোগ্য টিকিট জেনারেট করা হয়।
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <span className="font-black text-rose-300 block">৪. আসন বাতিল ও রিফান্ড</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  আসন বাতিল করলে সিটটি তাত্ক্ষণিক উন্মুক্ত হয়ে যায় এবং ক্যান্সেলেশন ফি বাদ দিয়ে নেট রিফান্ড ভাউচার তৈরি হয়।
                </p>
              </div>
            </div>

            <div className="bg-pink-950/40 border border-pink-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-pink-200">
              <ShieldAlert className="w-4 h-4 text-pink-400 shrink-0" />
              <span>
                <strong>জেন্ডার সুরক্ষা রুলস:</strong> ছেলের সংলগ্ন সিটে শুধুই ছেলে এবং মেয়ের সংলগ্ন সিটে শুধুই মেয়ে শিক্ষার্থী বসতে পারবে।
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── Status Feedback Banner ──────────────── */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold border transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && selectedBooking && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowTicketModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {statusMessage.actionType === 'CANCEL' ? 'রিফান্ড ভাউচার দেখুন' : 'নতুন টিকিট প্রিন্ট করুন'}
                </span>
              </Button>
            )}
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── Main Two-Column Structure ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ──────────────── Left Column: Organized Filter Console & Bookings List ──────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>ফিল্টার ও টিকিট সিলেকশন</span>
                </CardTitle>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>রিসেট</span>
                  </button>
                )}
              </div>

              {/* Tab Selector: Requests vs All Bookings */}
              <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setViewTab('REQUESTS')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    viewTab === 'REQUESTS'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>শিফট রিকোয়েস্ট</span>
                  <Badge variant="warning" className="text-[10px] px-1 py-0 font-mono">
                    {pendingRequestsCount}
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('ALL')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    viewTab === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>সকল সক্রিয় বুকিং</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                    {bookingsList.length}
                  </Badge>
                </button>
              </div>

              {/* Filter 1: Target University */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>টার্গেট বিশ্ববিদ্যালয়:</span>
                </label>
                <select
                  value={selectedUniversityFilter}
                  onChange={(e) => setSelectedUniversityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {TARGET_UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Bus Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Bus className="w-3.5 h-3.5 text-sky-500" />
                  <span>বাস অনুযায়ী ফিল্টার:</span>
                </label>
                <select
                  value={selectedBusFilter}
                  onChange={(e) => setSelectedBusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ALL">সকল বাস</option>
                  {availableBusNames.map((bus) => (
                    <option key={bus} value={bus}>
                      {bus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3 & 4: Gender & Zone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    জেন্ডার:
                  </label>
                  <select
                    value={selectedGenderFilter}
                    onChange={(e: any) => setSelectedGenderFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="ALL">সকল</option>
                    <option value="MALE">👨 ছাত্র / পুরুষ</option>
                    <option value="FEMALE">👩 ছাত্রী / নারী</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    সিট জোন:
                  </label>
                  <select
                    value={selectedZoneFilter}
                    onChange={(e: any) => setSelectedZoneFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="ALL">সকল জোন</option>
                    <option value="VIP">🌟 VIP (A-B)</option>
                    <option value="STANDARD">💺 রেগুলার (C-H)</option>
                    <option value="ECONOMY">💰 ইকোনমি (I-J)</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="টিকিট নং, মোবাইল, নাম বা সিট..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white"
                />
              </div>

              {/* Matching Count Header */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                <span>ফিল্টার অনুযায়ী তালিকা:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {filteredBookings.length} টি টিকিট
                </span>
              </div>

              {/* Bookings List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-slate-400">
                    <Search className="w-7 h-7 mx-auto stroke-1" />
                    <p className="text-xs font-bold">কোনো টিকিট বা রিকোয়েস্ট পাওয়া যায়নি</p>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 underline font-bold"
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  </div>
                ) : (
                  filteredBookings.map((b) => {
                    const bNum = b.booking_number || b.bookingNumber || 'BK-2026';
                    const name = b.contact_name || b.contactName || 'যাত্রী';
                    const phone = b.contact_phone || b.contactPhone || '—';
                    const primarySeat = (b.seats || [])[0]?.seat_number || 'A1';
                    const zInfo = getSeatZoneInfo(primarySeat);
                    const isSelected = selectedBooking?.id === b.id;
                    const busName = getBookingBusName(b);
                    const uni = getBookingUniversity(b);
                    const gender = (b.passenger_gender || b.passengers?.[0]?.gender || 'MALE').toUpperCase();

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b);
                          setSelectedOldSeat((b.seats || [])[0]?.seat_number || 'A1');
                          setTargetVacantSeat('');
                          setTargetSwapSeat(null);
                          setTargetOtherBusSeat('');
                          setStatusMessage(null);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                            : 'bg-slate-50/50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 hover:bg-white dark:hover:bg-slate-900'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-2 h-full bg-blue-600 rounded-r-2xl" />
                        )}

                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                            {bNum}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border ${zInfo.badgeClass}`}>
                            সিট: {primarySeat} (৳{zInfo.fare})
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                            <span>{name}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${gender === 'FEMALE' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                              {gender === 'FEMALE' ? '👩 নারী' : '👨 পুরুষ'}
                            </span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{phone}</span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 truncate max-w-[190px]">
                            🎓 {uni}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium truncate max-w-[150px]">
                            🚌 {busName}
                          </span>
                        </div>

                        {b.shift_request && (
                          <div className="mt-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                            💬 {b.shift_request}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ──────────────── Right Column: Shift Workbench & Map ──────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedBooking ? (
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-12 text-center">
              <div className="max-w-md mx-auto space-y-3 py-10">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-inner">
                  <ArrowLeftRight className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  বাম পাশ থেকে একটি টিকিট নির্বাচন করুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  টিকিট নির্বাচন করলেই যাত্রীর বর্তমান আসন স্বয়ংক্রিয়ভাবে শনাক্ত হবে এবং ৪টি আলাদা অপশন (খালি সিটে স্থানান্তর, সিট সোয়াপ, বিকল্প বাস, বা সিট বাতিল) পাওয়া যাবে।
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Selected Ticket Profile Header */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {selectedBooking.booking_number || selectedBooking.bookingNumber}
                    </span>
                    <Badge variant="success" className="text-[10px] font-bold">
                      {selectedBooking.booking_status || 'CONFIRMED'}
                    </Badge>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeGender === 'FEMALE' ? 'bg-pink-100 text-pink-700 border border-pink-300 dark:bg-pink-950 dark:text-pink-300' : 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300'}`}>
                      {activeGender === 'FEMALE' ? '👩 নারী শিক্ষার্থী' : '👨 পুরুষ শিক্ষার্থী'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">বর্তমান আসন:</span>
                    <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs border ${currentSeatZone.badgeClass}`}>
                      সিট {selectedOldSeat} • {currentSeatZone.shortLabel} • ৳{currentSeatZone.fare}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">যাত্রীর নাম ও মোবাইল:</span>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {activePassenger?.passenger_name || 'Passenger'}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {selectedBooking.contact_phone || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">টার্গেট বিশ্ববিদ্যালয়:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                        🎓 {getBookingUniversity(selectedBooking)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">বর্তমান বাস ও সিট:</span>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        🚌 {getBookingBusName(selectedBooking)}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                        সিট: {selectedOldSeat} ({currentSeatZone.rowRange})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">যাত্রা ও সময়:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {selectedBooking.trip?.departure_date ? formatDate(selectedBooking.trip.departure_date) : 'Today'}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {selectedBooking.trip?.departure_time || selectedBooking.trip?.departureTime || 'রাত ১০:৩০'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ──────────────── 4 Distinct Operational Tabs ──────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-950/70 rounded-3xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('RELOCATE');
                    setTargetSwapSeat(null);
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'RELOCATE'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Armchair className="w-4 h-4 text-emerald-600" />
                    <span>খালি সিটে স্থানান্তর</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">সিট ছেড়ে নতুন সিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SWAP');
                    setTargetVacantSeat('');
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'SWAP'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md ring-2 ring-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-amber-600" />
                    <span>সিট অদলবদল (Swap)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">যাত্রীদ্বয়ের পারস্পরিক বিনিময়</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('TRANSFER_BUS');
                    setTargetVacantSeat('');
                    setTargetSwapSeat(null);
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'TRANSFER_BUS'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md ring-2 ring-sky-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Bus className="w-4 h-4 text-sky-600" />
                    <span>বিকল্প বাসে স্থানান্তর</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">অন্য বাসে নতুন টিকিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CANCEL_SEAT');
                    setTargetVacantSeat('');
                    setTargetSwapSeat(null);
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'CANCEL_SEAT'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md ring-2 ring-rose-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>আসন বাতিল ও রিফান্ড</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">সিট মুক্ত ও টাকা ফেরত</span>
                </button>
              </div>

              {/* ──────────────── TAB 1: RELOCATE TO VACANT SEAT ──────────────── */}
              {activeTab === 'RELOCATE' && (
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                        <Armchair className="w-4 h-4 text-emerald-600" />
                        <span>বাসের সিট ম্যাপ থেকে পছন্দসই খালি আসন সিলেক্ট করুন</span>
                      </CardTitle>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        যাত্রীর বর্তমান আসন <strong className="text-blue-600">সিট {selectedOldSeat}</strong> চিহ্নিত আছে। যে কোনো সবুজ খালি আসনে ক্লিক করলেই ভাড়ার পার্থক্য ও স্থানান্তর হিসাব হবে।
                      </p>
                    </div>

                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-300">
                      {tripSeats.filter((s) => s.status === 'AVAILABLE').length} টি আসন খালি
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Color Legend Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-blue-600 ring-2 ring-blue-400/40 inline-block" />
                        <span className="text-slate-700 dark:text-slate-300">বর্তমান আসন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 ring-2 ring-emerald-400/40 inline-block" />
                        <span className="text-slate-700 dark:text-slate-300">নতুন নির্বাচিত আসন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 inline-block" />
                        <span className="text-slate-700 dark:text-slate-300">ফাঁকা আসন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-pink-100 dark:bg-pink-950 border border-pink-400 inline-block" />
                        <span className="text-pink-600 dark:text-pink-400">নারী সংলগ্ন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-blue-100 dark:bg-blue-950 border border-blue-400 inline-block" />
                        <span className="text-blue-600 dark:text-blue-400">পুরুষ সংলগ্ন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-block" />
                        <span className="text-slate-500">অন্য যাত্রী (সোয়াপ)</span>
                      </div>
                    </div>

                    {/* Realistic 2+2 Bus Interior Layout */}
                    <div className="max-w-md mx-auto bg-slate-100/80 dark:bg-slate-950/90 p-5 rounded-3xl border-2 border-slate-300 dark:border-slate-800 shadow-inner">
                      {/* Driver & Door Front */}
                      <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <Compass className="w-3.5 h-3.5 text-blue-500" />
                          <span>প্রবেশদ্বার (Entry Door)</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span>ড্রাইভার কেবিন</span>
                          <span className="text-xs">🚌</span>
                        </div>
                      </div>

                      {/* Seat Rows: 2 Left, Aisle, 2 Right */}
                      <div className="space-y-2.5">
                        {currentRows.map(({ rowLetter, isRear, left, middle, right }) => (
                          <div key={rowLetter} className="flex items-center justify-between gap-1 sm:gap-2">
                            {/* Left Side (Col 1 & 2) */}
                            <div className="flex items-center gap-1.5">
                              {left.map((seat) => renderSeatCell(seat, false, currentBusLocks))}
                            </div>

                            {/* Middle Aisle or 5-seat bench middle */}
                            <div className="w-9 sm:w-11 text-center flex items-center justify-center">
                              {isRear && middle ? (
                                renderSeatCell(middle, false, currentBusLocks)
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {rowLetter}
                                </span>
                              )}
                            </div>

                            {/* Right Side (Col 3 & 4 or 4 & 5) */}
                            <div className="flex items-center gap-1.5">
                              {right.map((seat) => renderSeatCell(seat, false, currentBusLocks))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rear Bench Footer */}
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-400 text-[10px] font-bold">
                        পেছনের ৫-সিট বেঞ্চ (Rear Bench • ইকোনমি জোন • ৳৫০০)
                      </div>
                    </div>

                    {/* Live Dynamic Fare Difference Card */}
                    {relocateFareComp && (
                      <div className={`p-4 rounded-2xl border-2 space-y-2 animate-in fade-in ${relocateFareComp.badgeColor}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 shrink-0" />
                            <h4 className="text-xs font-black">
                              ভাড়া সমন্বয় ও হিসাব: {relocateFareComp.titleBn}
                            </h4>
                          </div>
                          <Badge variant="outline" className="font-mono font-black text-xs px-2.5 py-0.5">
                            {relocateFareComp.amountText}
                          </Badge>
                        </div>

                        <p className="text-xs">{relocateFareComp.summaryBn}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-white/60 dark:bg-black/20 p-2 rounded-xl">
                            <span className="text-[10px] block opacity-70">বর্তমান আসন:</span>
                            <span className="font-bold">সিট {selectedOldSeat} ({relocateFareComp.oldZone}) = ৳{relocateFareComp.oldFare}</span>
                          </div>
                          <div className="bg-white/60 dark:bg-black/20 p-2 rounded-xl">
                            <span className="text-[10px] block opacity-70">নতুন লক্ষ্য আসন:</span>
                            <span className="font-bold">সিট {targetVacantSeat} ({relocateFareComp.newZone}) = ৳{relocateFareComp.newFare}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ──────────────── TAB 2: MUTUAL SEAT SWAP ──────────────── */}
              {activeTab === 'SWAP' && (
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                      <Repeat className="w-4 h-4 text-amber-600" />
                      <span>যাত্রীদ্বয়ের আসন অদলবদল (Mutual Seat Exchange / Swap)</span>
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      বাসে খালি সিট না থাকলে অপর কোনো বুকড যাত্রীর আসনে ক্লিক করে পারস্পরিক সমঝোতায় সিট অদলবদল করুন।
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Side-by-side Comparison of Passenger 1 & Passenger 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Passenger 1 Card */}
                      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-400/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-900 dark:text-blue-200">
                            যাত্রী ০১ (আবেদনকারী)
                          </span>
                          <Badge variant="primary" className="font-mono text-[10px]">
                            সিট {selectedOldSeat}
                          </Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {activePassenger?.passenger_name} ({activeGender === 'FEMALE' ? 'নারী' : 'পুরুষ'})
                          </p>
                          <p className="text-slate-500 font-mono text-[11px]">মোবাইল: {selectedBooking.contact_phone || '—'}</p>
                          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {currentSeatZone.shortLabel} (৳{currentSeatZone.fare})
                          </p>
                        </div>
                      </div>

                      {/* Passenger 2 Card */}
                      <div className={`p-4 rounded-2xl border-2 space-y-2 ${
                        targetSwapSeat
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400/80'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-dashed border-slate-300 dark:border-slate-800 text-center py-6'
                      }`}>
                        {targetSwapSeat ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                                যাত্রী ০২ (বিনিময়কারী)
                              </span>
                              <Badge variant="warning" className="font-mono text-[10px]">
                                সিট {targetSwapSeat.seatNumber}
                              </Badge>
                            </div>
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {targetSwapSeat.passengerName} ({targetSwapSeat.gender === 'FEMALE' ? 'নারী' : 'পুরুষ'})
                              </p>
                              <p className="text-slate-500 font-mono text-[11px]">মোবাইল: {targetSwapSeat.passengerPhone || '—'}</p>
                              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                {getSeatZoneInfo(targetSwapSeat.seatNumber).shortLabel} (৳{getSeatZoneInfo(targetSwapSeat.seatNumber).fare})
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <Repeat className="w-5 h-5 mx-auto text-slate-400 stroke-1" />
                            <p className="text-xs font-bold text-slate-500">নিচের ম্যাপ থেকে যে কোনো বুক করা আসনে ক্লিক করুন</p>
                            <span className="text-[10px] text-slate-400">অপর যাত্রীর সাথে সিট অদলবদল করা হবে</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bus Map for Swap Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>ম্যাপ থেকে যে কোনো বুকড আসনে ক্লিক করে যাত্রী নির্বাচন করুন:</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          (ধূসর বুকড আসনগুলো সোয়াপ যোগ্য)
                        </span>
                      </div>

                      <div className="max-w-md mx-auto bg-slate-100/80 dark:bg-slate-950/90 p-5 rounded-3xl border-2 border-slate-300 dark:border-slate-800 shadow-inner">
                        <div className="space-y-2.5">
                          {currentRows.map(({ rowLetter, isRear, left, middle, right }) => (
                            <div key={rowLetter} className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex items-center gap-1.5">
                                {left.map((seat) => renderSeatCell(seat, false, currentBusLocks))}
                              </div>
                              <div className="w-9 sm:w-11 text-center flex items-center justify-center">
                                {isRear && middle ? (
                                  renderSeatCell(middle, false, currentBusLocks)
                                ) : (
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    {rowLetter}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {right.map((seat) => renderSeatCell(seat, false, currentBusLocks))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Swap Mutual Gender and Fare Notice */}
                    {targetSwapSeat && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>পারস্পরিক জেন্ডার ও ভাড়া যাচাই সম্পন্ন:</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          সিট {selectedOldSeat} (৳{currentSeatZone.fare}) এবং সিট {targetSwapSeat.seatNumber} (৳{getSeatZoneInfo(targetSwapSeat.seatNumber).fare}) এর মধ্যে সোয়াপ করা হচ্ছে। উভয় যাত্রীর সংলগ্ন আসনে জেন্ডার নিয়মাবলী সুরক্ষিত থাকবে।
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ──────────────── TAB 3: TRANSFER TO ALTERNATIVE BUS ──────────────── */}
              {activeTab === 'TRANSFER_BUS' && (
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                      <Bus className="w-4 h-4 text-sky-600" />
                      <span>বিকল্প বাসে স্থানান্তর (একই বা অন্য বিশ্ববিদ্যালয়)</span>
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      যাত্রী অন্য কোনো বাসে যেতে চাইলে বিকল্প বাস সিলেক্ট করে সেখানকার সিট বেছে নিন এবং নতুন টিকিট প্রিন্ট করুন।
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Alternate Bus Selector Grid */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        গন্তব্য বাস নির্বাচন করুন:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {alternateTrips.map((trip) => {
                          const isChosen = targetOtherTripId === trip.id;
                          const busName = trip.bus?.busName || trip.bus?.bus_name || 'কোচ';
                          const busNo = trip.bus?.busNumber || trip.bus?.bus_number || trip.trip_code;
                          const uni = trip.targetUniversity || 'বিশ্ববিদ্যালয়';
                          return (
                            <div
                              key={trip.id}
                              onClick={() => {
                                setTargetOtherTripId(trip.id);
                                setTargetOtherBusSeat('');
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                isChosen
                                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-sky-300'
                              }`}
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-900 dark:text-white">{busName}</p>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">🎓 {uni}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{busNo} • {trip.departureTime || '১০:৩০ PM'}</p>
                              </div>
                              <Badge variant={isChosen ? 'primary' : 'outline'} className="text-[10px]">
                                {isChosen ? 'সিলেক্টেড' : 'বাছাই করুন'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alternate Bus Seat Map */}
                    {targetOtherTripId && (
                      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            নতুন বাসের সিট ম্যাপ থেকে খালি আসন পছন্দ করুন:
                          </span>
                          <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-300">
                            {otherBusSeats.filter((s) => s.status === 'AVAILABLE').length} খালি আসন
                          </Badge>
                        </div>

                        <div className="max-w-md mx-auto bg-slate-100/80 dark:bg-slate-950/90 p-5 rounded-3xl border-2 border-slate-300 dark:border-slate-800 shadow-inner">
                          <div className="space-y-2.5">
                            {otherRows.map(({ rowLetter, isRear, left, middle, right }) => (
                              <div key={rowLetter} className="flex items-center justify-between gap-1 sm:gap-2">
                                <div className="flex items-center gap-1.5">
                                  {left.map((seat) => renderSeatCell(seat, true, otherBusLocks))}
                                </div>
                                <div className="w-9 sm:w-11 text-center flex items-center justify-center">
                                  {isRear && middle ? (
                                    renderSeatCell(middle, true, otherBusLocks)
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                      {rowLetter}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {right.map((seat) => renderSeatCell(seat, true, otherBusLocks))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {transferBusFareComp && (
                          <div className={`p-3 rounded-2xl border ${transferBusFareComp.badgeColor} text-xs space-y-1`}>
                            <div className="flex items-center justify-between font-bold">
                              <span>ভাড়া সমন্বয়: {transferBusFareComp.titleBn}</span>
                              <span className="font-mono">{transferBusFareComp.amountText}</span>
                            </div>
                            <p className="text-[11px]">{transferBusFareComp.summaryBn}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ──────────────── TAB 4: CANCEL SEAT & REFUND ──────────────── */}
              {activeTab === 'CANCEL_SEAT' && (
                <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Ban className="w-4 h-4" />
                      <span>আসন বাতিল ও রিফান্ড ক্যালকুলেটর</span>
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      যাত্রী সিট ছেড়ে দিলে বা যাত্রা বাতিল করলে সিটটি তাত্ক্ষণিক উন্মুক্ত হয়ে যাবে এবং প্রদেয় রিফান্ড টাকা নির্ধারিত হবে।
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Seat & Fare Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-400 text-[10px] block font-bold">বাতিলকৃত আসন ও জোন:</span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block mt-0.5">
                          সিট {selectedOldSeat}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {currentSeatZone.label}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-400 text-[10px] block font-bold">আসনটির মূল ভাড়া:</span>
                        <span className="font-mono font-black text-base text-slate-900 dark:text-white block mt-0.5">
                          ৳{currentSeatZone.fare}
                        </span>
                        <span className="text-[10px] text-slate-400">পরিশোধিত টিকিট মূল্য</span>
                      </div>

                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800 text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 text-[10px] block font-bold">নেট প্রদেয় রিফান্ড:</span>
                        <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          ৳{Math.max(0, currentSeatZone.fare - cancellationFee)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">যাত্রীকে ফেরত দিন</span>
                      </div>
                    </div>

                    {/* Cancellation Fee Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        ক্যান্সেলেশন ফি / সার্ভিস চার্জ:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '০% (পূর্ণ রিফান্ড)', fee: 0 },
                          { label: '৳৫০ নির্দিষ্ট ফি', fee: 50 },
                          { label: '১০% সার্ভিস চার্জ', fee: Math.round(currentSeatZone.fare * 0.1) },
                          { label: '১৫% সার্ভিস চার্জ', fee: Math.round(currentSeatZone.fare * 0.15) }
                        ].map((opt) => (
                          <button
                            key={opt.fee}
                            type="button"
                            onClick={() => setCancellationFee(opt.fee)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              cancellationFee === opt.fee
                                ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 ring-2 ring-rose-400/30'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                            }`}
                          >
                            {opt.label} (৳{opt.fee})
                          </button>
                        ))}
                      </div>

                      <div className="mt-2">
                        <input
                          type="number"
                          value={cancellationFee}
                          onChange={(e) => setCancellationFee(Math.max(0, Number(e.target.value) || 0))}
                          className="w-48 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                          placeholder="কাস্টম ফি (টাকা)..."
                        />
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        বাতিলের কারণ:
                      </label>
                      <select
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white mb-2"
                      >
                        {cancelReasons.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="কাস্টম কারণ লিখুন..."
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ──────────────── Action Confirmation Workbench ──────────────── */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>অপারেশন চূড়ান্ত নিশ্চিতকরণ</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Preset Reasons (Only for Relocate, Swap, and Transfer Bus) */}
                  {activeTab !== 'CANCEL_SEAT' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          প্রচলিত কারণসমূহ:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {presetReasons.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setShiftReason(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                shiftReason === preset
                                  ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={shiftReason}
                          onChange={(e) => setShiftReason(e.target.value)}
                          placeholder="কারণ উল্লেখ করুন..."
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {/* Visual Comparison Summary */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-emerald-950/30 border border-blue-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">বর্তমান আসন</span>
                        <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-sm shadow-xs block">
                          {selectedOldSeat}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 block mt-0.5">৳{currentSeatZone.fare}</span>
                      </div>

                      <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />

                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                          {activeTab === 'RELOCATE'
                            ? 'নতুন ফাঁকা আসন'
                            : activeTab === 'SWAP'
                            ? 'সোয়াপ আসন'
                            : activeTab === 'TRANSFER_BUS'
                            ? 'নতুন বাসের আসন'
                            : 'বাতিল ও মুক্ত'}
                        </span>
                        <span className={`px-3 py-1 rounded-xl font-mono font-black text-sm shadow-xs block ${
                          activeTab === 'CANCEL_SEAT' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {activeTab === 'RELOCATE'
                            ? targetVacantSeat || '—'
                            : activeTab === 'SWAP'
                            ? targetSwapSeat?.seatNumber || '—'
                            : activeTab === 'TRANSFER_BUS'
                            ? targetOtherBusSeat || '—'
                            : 'বাতিল'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                          {activeTab === 'RELOCATE' && targetVacantSeat
                            ? `৳${getSeatZoneInfo(targetVacantSeat).fare}`
                            : activeTab === 'SWAP' && targetSwapSeat
                            ? `৳${getSeatZoneInfo(targetSwapSeat.seatNumber).fare}`
                            : activeTab === 'TRANSFER_BUS' && targetOtherBusSeat
                            ? `৳${getSeatZoneInfo(targetOtherBusSeat).fare}`
                            : activeTab === 'CANCEL_SEAT'
                            ? `রিফান্ড ৳${Math.max(0, currentSeatZone.fare - cancellationFee)}`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-right text-slate-600 dark:text-slate-300">
                      <p className="font-bold">
                        {activePassenger?.passenger_name} ({activeGender === 'FEMALE' ? 'নারী' : 'পুরুষ'})
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {activeTab === 'RELOCATE'
                          ? 'মোড: খালি আসনে স্থানান্তর'
                          : activeTab === 'SWAP'
                          ? 'মোড: পারস্পরিক সিট সোয়াপ'
                          : activeTab === 'TRANSFER_BUS'
                          ? 'মোড: বিকল্প বাসে স্থানান্তর'
                          : 'মোড: আসন বাতিল ও রিফান্ড'}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={
                      isProcessing ||
                      !selectedOldSeat ||
                      (activeTab === 'RELOCATE' && !targetVacantSeat) ||
                      (activeTab === 'SWAP' && !targetSwapSeat) ||
                      (activeTab === 'TRANSFER_BUS' && (!targetOtherTripId || !targetOtherBusSeat))
                    }
                    onClick={() => setShowConfirmModal(true)}
                    className={`w-full font-black rounded-2xl py-3.5 shadow-lg text-sm flex items-center justify-center gap-2 ${
                      activeTab === 'CANCEL_SEAT'
                        ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-500/20 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 text-white'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>প্রসেসিং হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        {activeTab === 'CANCEL_SEAT' ? <Ban className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
                        <span>
                          {activeTab === 'RELOCATE'
                            ? targetVacantSeat
                              ? `সিট [${selectedOldSeat}] থেকে [${targetVacantSeat}]-এ স্থানান্তর নিশ্চিত করুন`
                              : 'ম্যাপ থেকে পছন্দসই খালি আসন সিলেক্ট করুন'
                            : activeTab === 'SWAP'
                            ? targetSwapSeat
                              ? `সিট [${selectedOldSeat}] ও [${targetSwapSeat.seatNumber}] অদলবদল (Swap) করুন`
                              : 'সোয়াপ করার জন্য অপর যাত্রীর আসন সিলেক্ট করুন'
                            : activeTab === 'TRANSFER_BUS'
                            ? targetOtherBusSeat
                              ? `বিকল্প বাসের সিট [${targetOtherBusSeat}]-এ স্থানান্তর করুন`
                              : 'নতুন বাসের আসন সিলেক্ট করুন'
                            : `সিট [${selectedOldSeat}] বাতিল ও ৳${Math.max(0, currentSeatZone.fare - cancellationFee)} রিফান্ড নিশ্চিত করুন`}
                        </span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── Confirmation Dialog Modal ──────────────── */}
      {showConfirmModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'CANCEL_SEAT'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
              }`}>
                {activeTab === 'CANCEL_SEAT' ? <Ban className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeTab === 'RELOCATE'
                    ? 'খালি আসনে স্থানান্তর নিশ্চিত করবেন?'
                    : activeTab === 'SWAP'
                    ? 'সিট অদলবদল (Swap) নিশ্চিত করবেন?'
                    : activeTab === 'TRANSFER_BUS'
                    ? 'বিকল্প বাসে টিকিট স্থানান্তর করবেন?'
                    : 'আসন বাতিল ও রিফান্ড নিশ্চিত করবেন?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeTab === 'CANCEL_SEAT'
                    ? 'নিশ্চিত করলে আসনটি তাত্ক্ষণিক খালি হয়ে যাবে।'
                    : 'নিশ্চিত করলে পূর্বের আসন তাৎক্ষণিক সবার জন্য উন্মুক্ত হয়ে যাবে।'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">টিকিট নম্বর:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedBooking.booking_number || selectedBooking.bookingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">যাত্রী:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activePassenger?.passenger_name} ({activeGender === 'FEMALE' ? 'নারী' : 'পুরুষ'})
                </span>
              </div>

              {activeTab !== 'CANCEL_SEAT' ? (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">পরিবর্তন:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="danger" className="font-mono font-bold">
                      সিট {selectedOldSeat}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <Badge variant="success" className="font-mono font-bold">
                      সিট {activeTab === 'RELOCATE' ? targetVacantSeat : activeTab === 'SWAP' ? targetSwapSeat?.seatNumber : targetOtherBusSeat}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>বাতিলকৃত আসন:</span>
                    <span>সিট {selectedOldSeat} (৳{currentSeatZone.fare})</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ক্যান্সেলেশন ফি:</span>
                    <span>৳{cancellationFee}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-black pt-1 border-t border-dashed border-slate-300 dark:border-slate-700">
                    <span>নেট প্রদেয় রিফান্ড:</span>
                    <span>৳{Math.max(0, currentSeatZone.fare - cancellationFee)}</span>
                  </div>
                </div>
              )}

              {activeTab === 'SWAP' && targetSwapSeat && (
                <div className="flex justify-between pt-1 text-amber-700 dark:text-amber-300 font-bold">
                  <span>বিনিময়কারী অপর যাত্রী:</span>
                  <span>{targetSwapSeat.passengerName} (সিট {targetSwapSeat.seatNumber})</span>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <span className="text-slate-400">কারণ:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right truncate max-w-[200px]">
                  {activeTab === 'CANCEL_SEAT' ? cancellationReason : shiftReason}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                className="w-1/2 rounded-xl text-xs font-bold"
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                না, ফিরে যান
              </Button>
              <Button
                variant="primary"
                className={`w-1/2 rounded-xl text-xs font-bold ${
                  activeTab === 'CANCEL_SEAT'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                onClick={handleExecuteOperation}
                disabled={isProcessing}
              >
                {isProcessing ? 'প্রসেসিং হচ্ছে...' : 'হ্যাঁ, নিশ্চিত করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Ticket Print / Preview Modal ──────────────── */}
      {showTicketModal && selectedBooking && (
        <PaymentReceiptModal
          booking={selectedBooking}
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
}
