'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Sparkles,
  User,
  Shield,
  CreditCard,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  Heart,
  Users,
  Compass,
  Check,
  Palette,
  ArrowRight,
  Phone,
  Key,
  Eye,
  EyeOff,
  Copy,
  Flame,
  CheckCircle2,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SeatStatusDetail } from '@/services/inventory.service';
import { calculateDynamicAdjacentSeatLocks } from '@/services/rules.service';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { lockSeatAction, unlockSeatAction, holdSeatAction, releaseSeatHoldAction } from '@/actions/inventory.actions';
import { createPreBookingAction } from '@/actions/booking.actions';
import {
  savePassengerPin,
  generateWhatsAppPinUrl,
  lookupPassengerByPhone,
  recordPassengerInDirectory,
  DirectoryPassenger
} from '@/services/passenger-directory.service';
import { OfficialWhatsAppIcon } from '@/components/passenger/passenger-portal-client';
import { BoardingPointSelector } from '@/components/booking/boarding-point-selector';
import { useApp } from '@/lib/context';

interface Props {
  trip: any;
  seats: SeatStatusDetail[];
  summary: any;
  currentUserId?: string;
}

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
}

const COLOR_OPTIONS: { id: FareRangeSegment['color']; label: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }[] = [
  { id: 'emerald', label: 'Emerald Green', bgClass: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/70 dark:to-emerald-900/70', borderClass: 'border-emerald-500 dark:border-emerald-400', textClass: 'text-emerald-950 dark:text-emerald-100', dotClass: 'bg-emerald-500' },
  { id: 'blue', label: 'Royal Blue', bgClass: 'from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/70', borderClass: 'border-blue-500 dark:border-blue-400', textClass: 'text-blue-950 dark:text-blue-100', dotClass: 'bg-blue-500' },
  { id: 'purple', label: 'Indigo Purple', bgClass: 'from-purple-50 to-purple-100 dark:from-purple-950/70 dark:to-purple-900/70', borderClass: 'border-purple-500 dark:border-purple-400', textClass: 'text-purple-950 dark:text-purple-100', dotClass: 'bg-purple-500' },
  { id: 'amber', label: 'Sunset Amber', bgClass: 'from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/70', borderClass: 'border-amber-500 dark:border-amber-400', textClass: 'text-amber-950 dark:text-amber-100', dotClass: 'bg-amber-500' },
  { id: 'rose', label: 'Coral Rose', bgClass: 'from-rose-50 to-rose-100 dark:from-rose-950/70 dark:to-rose-900/70', borderClass: 'border-rose-500 dark:border-rose-400', textClass: 'text-rose-950 dark:text-rose-100', dotClass: 'bg-rose-500' },
  { id: 'cyan', label: 'Ocean Cyan', bgClass: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/70 dark:to-cyan-900/70', borderClass: 'border-cyan-500 dark:border-cyan-400', textClass: 'text-cyan-950 dark:text-cyan-100', dotClass: 'bg-cyan-500' }
];

export function InteractiveSeatMap({ trip, seats, summary, currentUserId }: Props) {
  const router = useRouter();
  const { t, language, currentColor } = useApp();
  
  // Seat selection states (supports multi-seat selection for passenger pre-booking)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [activeInspectorSeat, setActiveInspectorSeat] = useState<SeatStatusDetail | null>(null);

  // Passenger pre-booking form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [suggestedPassenger, setSuggestedPassenger] = useState<DirectoryPassenger | null>(null);
  const [passengerGender, setPassengerGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isStudent, setIsStudent] = useState(true);
  const [studentAdmissionId, setStudentAdmissionId] = useState('');
  
  // Journey Direction & Boarding Points state
  const [journeyType, setJourneyType] = useState<'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY' | 'ASYMMETRIC'>('ROUND_TRIP');
  const [boardingPoint, setBoardingPoint] = useState('গাবতলী বাস টার্মিনাল');
  const [droppingPoint, setDroppingPoint] = useState('বিশ্ববিদ্যালয় মেইন গেট');
  const [seatLegs, setSeatLegs] = useState<Record<string, 'ROUND_TRIP' | 'OUTBOUND_ONLY' | 'RETURN_ONLY'>>({});

  const [authPin, setAuthPin] = useState('');
  const [authConfirmPin, setAuthConfirmPin] = useState('');
  const [authPinVisible, setAuthPinVisible] = useState(false);
  const [userNeedsPin, setUserNeedsPin] = useState(false);

  // Submission & Confirmation state
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [whatsappModalData, setWhatsappModalData] = useState<{ name: string; phone: string; pin: string; waUrl: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Staff admin lock modal
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState('VIP');
  const [lockType, setLockType] = useState<'PERMANENT' | 'TEMPORARY'>('TEMPORARY');
  const [lockNotes, setLockNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const rowLetters = 'ABCDEFGHIJKLMN';

  // Auto-populate saved profile info if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('atoms_passenger_phone');
      if (savedPhone) {
        setContactPhone(savedPhone);
        const dir = lookupPassengerByPhone(savedPhone);
        if (dir) {
          if (!contactName) setContactName(dir.name);
          if (dir.gender) setPassengerGender(dir.gender);
          if (dir.admissionId && !studentAdmissionId) setStudentAdmissionId(dir.admissionId);
        }
      }
      // Legacy PIN artifacts are no longer used.
      localStorage.removeItem('atoms_passenger_pin');
      localStorage.removeItem('atoms_passenger_pins');
    }
  }, []);

  // Check PIN requirement whenever phone number changes (server-backed)
  useEffect(() => {
    let cancelled = false;
    if (contactPhone && contactPhone.length === 11) {
      const clean = contactPhone.replace(/\D/g, '');
      fetch('/api/backend/auth/passenger-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, pin: '' }),
      })
        .then((res) => {
          if (cancelled) return;
          // 404 = no PIN registered yet; 401 = wrong pin; both mean "not verified".
          setUserNeedsPin(res.status === 404);
        })
        .catch(() => {
          if (!cancelled) setUserNeedsPin(true);
        });
    } else {
      setUserNeedsPin(true);
    }
    return () => { cancelled = true; };
  }, [contactPhone]);

  // Default Fare Segments
  const defaultSegments: FareRangeSegment[] = [
    { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' },
    { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' },
    { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' },
    { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' }
  ];

  const getSegmentForRow = (rowChar: string): FareRangeSegment | undefined => {
    if (!rowChar || typeof rowChar !== 'string') return undefined;
    return defaultSegments.find(seg => {
      if (!seg?.startRow || !seg?.endRow) return false;
      const startIdx = rowLetters.indexOf(seg.startRow.toUpperCase());
      const endIdx = rowLetters.indexOf(seg.endRow.toUpperCase());
      const curIdx = rowLetters.indexOf(rowChar.toUpperCase());
      return curIdx >= startIdx && curIdx <= endIdx;
    });
  };

  // Group seats into rows
  const maxRow = Math.max(...seats.map(s => s.rowIndex), 10);
  const totalRows = maxRow + 1;

  // Dynamic adjacent seat gender lock calculation
  const dynamicAdjacentLocks = useMemo(() => {
    return calculateDynamicAdjacentSeatLocks(seats);
  }, [seats]);

  const selectedSeats = useMemo(() => {
    return seats.filter(s => selectedSeatIds.includes(s.seatId));
  }, [seats, selectedSeatIds]);

  // Dynamic Fare Calculation taking journey direction / legs into account
  const totalFare = useMemo(() => {
    if (journeyType === 'ROUND_TRIP') {
      return selectedSeats.reduce((sum, s) => sum + s.fare, 0);
    } else if (journeyType === 'OUTBOUND_ONLY' || journeyType === 'RETURN_ONLY') {
      return selectedSeats.reduce((sum, s) => sum + Math.round(s.fare * 0.5), 0);
    } else {
      // ASYMMETRIC / CUSTOM_SPLIT
      return selectedSeats.reduce((sum, s) => {
        const leg = seatLegs[s.seatId] || 'ROUND_TRIP';
        return sum + (leg === 'ROUND_TRIP' ? s.fare : Math.round(s.fare * 0.5));
      }, 0);
    }
  }, [selectedSeats, journeyType, seatLegs]);

  // Handle seat click (Multi-seat toggle for prebooking)
  const handleSeatClick = (seat: SeatStatusDetail) => {
    setActiveInspectorSeat(seat);

    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter(id => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 4) {
        alert(language === 'bn' ? 'অনলাইনে একসাথে সর্বোচ্চ ৪টি সিট বুকিং করা যাবে।' : 'Maximum 4 seats can be requested at once.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
    }
  };

  // Handle pre-booking submission
  const handlePreBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (selectedSeatIds.length === 0) {
      setBookingError(language === 'bn' ? 'অনুগ্রহ করে বাসের সিট ম্যাপ থেকে অন্তত একটি সিট নির্বাচন করুন।' : 'Please select at least one seat from the map.');
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      setBookingError(language === 'bn' ? 'যাত্রীর নাম এবং মোবাইল নম্বর আবশ্যক।' : 'Passenger Name and Phone Number are required.');
      return;
    }

    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      setBookingError(language === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' : 'Enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    // If user needs to set a PIN
    if (userNeedsPin) {
      if (authPin.length !== 4) {
        setBookingError(language === 'bn' ? '৪-সংখ্যার একটি গোপন পিন নির্ধারণ করুন।' : 'Enter a 4-digit secret PIN.');
        return;
      }
      if (authPin !== authConfirmPin) {
        setBookingError(language === 'bn' ? 'দুই ঘরের পিন নম্বর একই হতে হবে।' : 'New PIN and Confirm PIN must match.');
        return;
      }
    }

    setIsBookingSubmitting(true);
    try {
      // 1. If PIN was entered, register it server-side
      if (userNeedsPin && authPin.length === 4) {
        await savePassengerPin(cleanPhone, authPin, contactName.trim());
        const waUrl = generateWhatsAppPinUrl(cleanPhone, authPin, contactName.trim());
        setWhatsappModalData({
          name: contactName.trim(),
          phone: cleanPhone,
          pin: authPin,
          waUrl
        });
      }

      // 2. Dispatch Pre-Booking Action with Journey Type & Boarding Points
      const res = await createPreBookingAction({
        tripId: trip.id,
        seatIds: selectedSeatIds,
        contactName: contactName.trim(),
        contactPhone: cleanPhone,
        passengerGender,
        isStudent,
        studentAdmissionId: studentAdmissionId.trim() || undefined,
        journeyType,
        boardingPoint: boardingPoint || undefined,
        droppingPoint: droppingPoint || undefined,
        passengerLegsJson: journeyType === 'ASYMMETRIC' ? JSON.stringify(seatLegs) : undefined,
        notes: `যাত্রার ধরণ: ${
          journeyType === 'ROUND_TRIP'
            ? 'উভয়মুখী (যাওয়া ও আসা)'
            : journeyType === 'OUTBOUND_ONLY'
            ? 'শুধুমাত্র যাওয়া'
            : journeyType === 'RETURN_ONLY'
            ? 'শুধুমাত্র আসা'
            : 'অভিভাবক সহ স্প্লিট'
        } | বোর্ডিং: ${boardingPoint || 'কাউন্টার'} | ড্রপিং: ${droppingPoint || 'ক্যাম্পাস'}`
      });

      if (res.success && res.booking) {
        // Record in passenger history
        recordPassengerInDirectory({
          phone: cleanPhone,
          name: contactName.trim(),
          gender: passengerGender,
          admissionId: studentAdmissionId.trim() || undefined,
          passengerType: isStudent ? 'STUDENT' : 'GUARDIAN'
        });
        setCreatedBooking(res.booking);
      } else {
        setBookingError(res.error || 'বুকিং অনুরোধ প্রক্রিয়া করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setBookingError(err.message || 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Staff lock/unlock handlers
  const handleLockSubmit = async () => {
    if (!activeInspectorSeat) return;
    setActionLoading(true);
    try {
      const res = await lockSeatAction({
        tripId: trip.id,
        seatId: activeInspectorSeat.seatId,
        lockType,
        reason: lockReason,
        notes: lockNotes
      });
      if (res.success) {
        setIsLockModalOpen(false);
        setActiveInspectorSeat(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to lock seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await unlockSeatAction(trip.id, seatId);
      if (res.success) {
        setActiveInspectorSeat(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to unlock seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await holdSeatAction(trip.id, seatId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to hold seat');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseHold = async (seatId: string) => {
    setActionLoading(true);
    try {
      const res = await releaseSeatHoldAction(trip.id, seatId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to release seat hold');
      }
    } finally {
      setActionLoading(false);
    }
  };

  function renderRealisticSeatButton(seat?: SeatStatusDetail, isMiddleSeat = false, segment?: FareRangeSegment) {
    if (!seat) return <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />;

    const isSelected = selectedSeatIds.includes(seat.seatId);
    const isBooked = seat.status === 'BOOKED';
    const isHeld = seat.status === 'HELD';
    const isLocked = seat.status === 'LOCKED';
    const isAvailable = seat.status === 'AVAILABLE';

    const seatNum = (seat.seatNumber || (seat as any).seat_number || (seat as any).label || '').trim().toUpperCase();
    const dynamicLock = seatNum ? dynamicAdjacentLocks.get(seatNum) : undefined;

    const isFemaleOnly = seat.genderAllowed === 'FEMALE_ONLY' || seat.booking?.passengerGender === 'FEMALE' || dynamicLock?.genderAllowed === 'FEMALE_ONLY';
    const isMaleOnly = seat.genderAllowed === 'MALE_ONLY' || seat.booking?.passengerGender === 'MALE' || dynamicLock?.genderAllowed === 'MALE_ONLY';

    const seatPrice = seat.fare || segment?.fare || trip.basePrice || 550;

    return (
      <motion.button
        whileHover={{ scale: isAvailable ? 1.05 : 1 }}
        whileTap={{ scale: isAvailable ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        key={seat.seatId}
        type="button"
        onClick={() => handleSeatClick(seat)}
        disabled={!isAvailable && !currentUserId}
        title={dynamicLock ? `${dynamicLock.reason} (${dynamicLock.genderAllowed === 'FEMALE_ONLY' ? 'শুধুমাত্র নারী' : 'শুধুমাত্র পুরুষ'})` : `সিট: ${seatNum || 'Seat'} | ভাড়া: ৳${seatPrice}`}
        className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 p-1.5 rounded-2xl flex flex-col items-center justify-between font-black transition-all duration-200 ease-out relative select-none cursor-pointer ${
          isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/70 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-700 opacity-60 shadow-xs cursor-not-allowed'
            : isHeld
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/70 dark:to-amber-900/70 text-amber-950 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 opacity-70 shadow-xs cursor-not-allowed'
            : isLocked
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 opacity-50 cursor-not-allowed'
            : isSelected
            ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white border-2 border-blue-300 dark:border-blue-400 shadow-lg shadow-blue-600/30 scale-105 z-10 ring-4 ring-blue-500/30'
            : isFemaleOnly
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/60 dark:to-pink-900/60 text-pink-950 dark:text-pink-200 border-2 border-pink-400 dark:border-pink-600 hover:border-pink-500 shadow-sm'
            : isMaleOnly
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-xs hover:border-blue-500 hover:shadow-md'
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-xs hover:border-blue-500 hover:shadow-md'
        }`}
      >
        {/* Ergonomic Headrest Cushion */}
        <div
          className={`w-9 h-1.5 rounded-full shadow-inner transition-all ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isHeld
              ? 'bg-amber-400'
              : isLocked
              ? 'bg-slate-500'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Crisp Seat Number */}
        <span className={`text-base sm:text-lg font-black tracking-tight leading-none font-mono ${isSelected ? 'text-white' : ''}`}>
          {seat.seatNumber}
        </span>

        {/* Fare / Status Pill */}
        <div
          className={`w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded-md backdrop-blur-xs transition-colors ${
            isSelected
              ? 'bg-black/30 text-white'
              : 'bg-black/5 dark:bg-white/10'
          }`}
        >
          {isSelected ? (
            <span className="text-[11px] sm:text-xs font-black font-mono leading-none tracking-tight flex items-center gap-0.5 text-white">
              <Check className="w-3 h-3 stroke-[3]" /> ৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 leading-none">
              বুকড
            </span>
          ) : isHeld ? (
            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 leading-none">
              হোল্ড
            </span>
          ) : isLocked ? (
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">
              লক
            </span>
          ) : (
            <span className="text-[11px] sm:text-xs font-black font-mono leading-none tracking-tight">
              ৳{seatPrice}
            </span>
          )}

          {!isSelected && !isBooked && !isHeld && !isLocked && isFemaleOnly && (
            <span className="text-[9px] text-pink-700 dark:text-pink-300 font-black">♀</span>
          )}
          {!isSelected && !isBooked && !isHeld && !isLocked && isMaleOnly && (
            <span className="text-[9px] text-blue-700 dark:text-blue-300 font-black">♂</span>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {trip.tripCode}
            </span>
            <Badge variant={trip.tripBusType === 'FEMALE' ? 'danger' : (trip.tripBusType === 'MALE' ? 'primary' : 'default')}>
              {trip.tripBusType === 'FEMALE' ? '🚺 মহিলা স্পেশাল কোচ' : (trip.tripBusType === 'MALE' ? '🚹 ছাত্র স্পেশাল কোচ' : '🚌 মিক্সড এক্সপ্রেস কোচ')}
            </Badge>
            {trip.has_accommodation && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                আবাসন সহ
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {trip.route?.origin} ➔ {trip.route?.destination} {trip.route?.routeName ? `(${trip.route.routeName})` : ''}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            <span className="flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-blue-500" />
              {trip.bus?.busName || 'Express Coach'} ({trip.bus?.busNumber || 'Special'})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(trip.departureDate)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {formatTime(trip.departureTime)}
            </span>
          </div>
        </div>

        {/* Quick Inventory Metric Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase font-mono">{t.available}</span>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{summary.availableSeats}</span>
          </div>
          <div className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block uppercase font-mono">{t.booked}</span>
            <span className="text-xl font-black text-rose-800 dark:text-rose-300 font-mono">{summary.bookedSeats}</span>
          </div>
          <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block uppercase font-mono">পূর্ণতা</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{summary.occupancyPercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Realistic High-Deck Bus Layout + Right Booking & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7-8 Cols: Realistic Coach Frame */}
        <Card className="lg:col-span-7 xl:col-span-8 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40 flex flex-wrap items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                {language === 'bn' ? 'লাইভ বাস সিট ম্যাপ (Interactive Seat Plan)' : 'Live Interactive Seat Plan'}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn'
                  ? 'আপনার পছন্দের সিটে ক্লিক করে নির্বাচন করুন (সর্বোচ্চ ৪টি সিট)'
                  : 'Click on any available seat to select for pre-booking (Max 4 seats)'}
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300"></span>
                <span>ফাঁকা</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[9px]"><Check className="w-2.5 h-2.5" /></span>
                <span>সিলেক্টেড</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-pink-500"></span>
                <span>নারী</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-500"></span>
                <span>বুকড</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-600"></span>
                <span>লক</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-100/70 dark:bg-slate-950/70 overflow-x-auto min-h-[600px]">
            {/* REALISTIC HIGH-DECK COACH FRAME */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-9 rounded-[3.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl relative">
              {/* Roof Marker & Mirrors */}
              <div className="absolute -top-3.5 left-12 right-12 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-t-2xl opacity-70" />
              <div className="absolute -left-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-l-md shadow-xs" title="Left Mirror" />
              <div className="absolute -right-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-r-md shadow-xs" title="Right Mirror" />

              {/* COCKPIT SECTION: Bonnet Engine Grill + Front Windshield + Driver Cabin + Door Steps */}
              <div className="mb-5 pb-3.5 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                {/* Windshield Glass */}
                <div className="h-6 sm:h-7 bg-blue-100/80 dark:bg-blue-950/60 rounded-t-2xl border-t-2 border-blue-300 dark:border-blue-800 mb-2.5 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 font-mono">
                    {language === 'bn' ? 'সামনের উইন্ডশিল্ড গ্লাস' : 'FRONT WINDSHIELD GLASS'}
                  </span>
                </div>

                {/* Dashboard & Cockpit: Medium-large, comfortable, legible Door, Bonnet, and Driver Cabins */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-white shadow-inner relative overflow-hidden">
                  {/* Left: Passenger Entry Door / Gate */}
                  <div className="flex items-center gap-2.5 bg-emerald-950 border-2 border-emerald-500/80 px-3.5 py-2 rounded-xl shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 leading-tight">
                        {language === 'bn' ? 'বাসের গেট' : 'ENTRY DOOR'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-emerald-300 font-bold leading-none mt-0.5">
                        {language === 'bn' ? 'প্রবেশদ্বার (Entry)' : 'Entry Gate'}
                      </div>
                    </div>
                  </div>

                  {/* Center: Bonnet / Engine Hood */}
                  <div className="text-center px-3.5 py-1.5 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-md">
                    <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wide">
                      {language === 'bn' ? 'বনেট / ইঞ্জিন' : 'ENGINE BONNET'}
                    </div>
                    <div className="text-[9px] text-slate-300 font-bold mt-0.5">Front Chassis</div>
                  </div>

                  {/* Right: Driver Cabin & Steering Wheel */}
                  <div className="flex items-center gap-2.5 bg-blue-950 border-2 border-blue-500/80 px-3.5 py-2 rounded-xl text-right shadow-md">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-blue-400 leading-tight">
                        {language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-blue-300 font-bold leading-none mt-0.5">
                        {language === 'bn' ? 'কন্ট্রোল (Cockpit)' : 'Cockpit'}
                      </div>
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600/50 border-2 border-blue-300 flex items-center justify-center text-xs font-black text-blue-100">
                      ✇
                    </div>
                  </div>
                </div>
              </div>

              {/* REALISTIC SEATING GRID */}
              <div className="space-y-3.5">
                {Array.from({ length: totalRows }).map((_, r) => {
                  const rowCells = seats.filter(c => c.rowIndex === r);
                  const isLastRow = r === totalRows - 1;
                  const rowLabel = rowLetters[r] || `R${r + 1}`;
                  const rowSegment = getSegmentForRow(rowLabel);

                  // Sort row seats deterministically by column index or seat number digit
                  const sortedRowSeats = [...rowCells].sort((a, b) => {
                    const sNumA = (a.seatNumber || (a as any).seat_number || (a as any).label || '').trim();
                    const sNumB = (b.seatNumber || (b as any).seat_number || (b as any).label || '').trim();
                    const colA = typeof a.colIndex === 'number' ? a.colIndex : (parseInt(sNumA.replace(/\D/g, '')) || 0);
                    const colB = typeof b.colIndex === 'number' ? b.colIndex : (parseInt(sNumB.replace(/\D/g, '')) || 0);
                    return colA - colB;
                  });

                  let left1: SeatStatusDetail | undefined;
                  let left2: SeatStatusDetail | undefined;
                  let center: SeatStatusDetail | undefined;
                  let right1: SeatStatusDetail | undefined;
                  let right2: SeatStatusDetail | undefined;

                  if (sortedRowSeats.length >= 5) {
                    left1 = sortedRowSeats[0];
                    left2 = sortedRowSeats[1];
                    center = sortedRowSeats[2];
                    right1 = sortedRowSeats[3];
                    right2 = sortedRowSeats[4];
                  } else if (sortedRowSeats.length === 4) {
                    left1 = sortedRowSeats[0];
                    left2 = sortedRowSeats[1];
                    right1 = sortedRowSeats[2];
                    right2 = sortedRowSeats[3];
                  } else if (sortedRowSeats.length === 3) {
                    left1 = sortedRowSeats[0];
                    left2 = sortedRowSeats[1];
                    right1 = sortedRowSeats[2];
                  } else {
                    left1 = sortedRowSeats[0];
                    left2 = sortedRowSeats[1];
                    right1 = sortedRowSeats[2];
                    right2 = sortedRowSeats[3];
                  }

                  return (
                    <div key={`row-${r}-${rowLabel}`} className="flex items-center justify-between gap-3">
                      {/* Left Seats: Slot 1 & Slot 2 */}
                      <div className="flex items-center gap-2.5">
                        {renderRealisticSeatButton(left1, false, rowSegment)}
                        {renderRealisticSeatButton(left2, false, rowSegment)}
                      </div>

                      {/* Middle Aisle Walkway OR 45-Seat Middle Seat (K3 on Row K) */}
                      <div className="flex-1 text-center font-mono flex items-center justify-center">
                        {center ? (
                          renderRealisticSeatButton(center, true, rowSegment)
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

                      {/* Right Seats: Slot 3 & Slot 4 */}
                      <div className="flex items-center gap-2.5">
                        {renderRealisticSeatButton(right1, false, rowSegment)}
                        {renderRealisticSeatButton(right2, false, rowSegment)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Bus Bumper */}
              <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono font-black">
                {language === 'bn' ? '★ ৪৫ সিট: শেষ সারিতে ৫টি সিট (K1, K2, K3 মাঝে, K4, K5)' : '★ 45-Seat: 5 Seats on Row K with K3 in Center Walkway'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 5-4 Cols: Pre-Booking & Actions Form */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {createdBooking ? (
            /* Booking Success Invoice Card */
            <Card className="border-2 border-emerald-500 shadow-xl bg-white dark:bg-slate-900 p-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <Badge variant="success" className="px-3 py-1 text-xs">
                  প্রি-বুকিং সফলভাবে সম্পন্ন হয়েছে
                </Badge>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  আপনার বুকিং রিকোয়েস্ট গৃহীত হয়েছে!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  আমাদের কল সেন্টার প্রতিনিধি <strong className="text-slate-900 dark:text-white font-mono">{contactPhone}</strong> নম্বরে যোগাযোগ করে আপনার আসন ও পেমেন্ট নিশ্চিত করবেন।
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">বুকিং আইডি:</span>
                  <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">{createdBooking.bookingNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">সিট নম্বর:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {createdBooking.seats?.map((s: any) => s.seat?.seatNumber || 'Seat').join(', ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">মোট ভাড়া:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">{formatCurrency(createdBooking.netAmount)}</span>
                </div>
              </div>

              {/* WhatsApp PIN Backup Button if applicable */}
              {whatsappModalData && (
                <a
                  href={whatsappModalData.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md shadow-[#25D366]/25 transition-all"
                >
                  <OfficialWhatsAppIcon className="w-4 h-4" />
                  <span>📲 WhatsApp-এ পিন ও টিকিট সংরক্ষণ করুন</span>
                </a>
              )}

              <Link
                href={`/track/${createdBooking.bookingNumber}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>লাইভ পেমেন্ট টাইমার ও টিকিট ট্র্যাক করুন</span>
              </Link>
            </Card>
          ) : (
            /* Active Pre-Booking Form */
            <Card className="shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center justify-between">
                  <span>{language === 'bn' ? 'প্রি-বুকিং তথ্য পূরণ করুন' : 'Pre-Booking Details'}</span>
                  <Badge variant="primary" className="text-xs">
                    {selectedSeatIds.length} টি সিট নির্বাচিত
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Selected Seats summary */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">নির্বাচিত সিট:</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {selectedSeats.length > 0 ? (
                        selectedSeats.map(s => (
                          <span
                            key={s.seatId}
                            onClick={() => handleSeatClick(s)}
                            className="px-2 py-0.5 rounded-lg bg-blue-600/20 border border-blue-500/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-red-500/20 hover:border-red-500 hover:text-red-600"
                            title="সিট বাতিল করতে ক্লিক করুন"
                          >
                            {s.seatNumber} <X className="w-3 h-3" />
                          </span>
                        ))
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">বামপাশের বাসের ম্যাপ থেকে সিট নির্বাচন করুন</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">মোট ভাড়া:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base font-mono">
                      {formatCurrency(totalFare)}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    {bookingError}
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handlePreBookingSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      যাত্রীর পূর্ণ নাম (Full Name) *
                    </label>
                    <Input
                      type="text"
                      placeholder="যেমন: তানভীর আহমেদ"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="rounded-xl py-2.5 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <PhoneInput
                      label="মোবাইল নম্বর (ভেরিফিকেশন কল যাবে) *"
                      value={contactPhone}
                      onChange={val => {
                        setContactPhone(val);
                        if (val.length >= 6) {
                          const match = lookupPassengerByPhone(val);
                          setSuggestedPassenger(match);
                        } else {
                          setSuggestedPassenger(null);
                        }
                      }}
                      required
                      showOperatorBadge
                      showCharacterCount
                    />
                  </div>

                  {/* Auto-suggested Record */}
                  {suggestedPassenger && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider font-mono">পূর্বের প্রোফাইল পাওয়া গেছে</div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{suggestedPassenger.name}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContactName(suggestedPassenger.name);
                          if (suggestedPassenger.gender) setPassengerGender(suggestedPassenger.gender);
                          if (suggestedPassenger.admissionId) setStudentAdmissionId(suggestedPassenger.admissionId);
                          setSuggestedPassenger(null);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" /> এই নাম নিন
                      </button>
                    </div>
                  )}

                  {/* Progressive PIN Setup (If not already set) */}
                  {userNeedsPin && (
                    <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-600" />
                          ৪-ডিজিটের গোপন পিন কোড সেট করুন
                        </span>
                        <button
                          type="button"
                          onClick={() => setAuthPinVisible(!authPinVisible)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          {authPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {authPinVisible ? 'লুকান' : 'দেখান'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type={authPinVisible ? 'text' : 'password'}
                            maxLength={4}
                            inputMode="numeric"
                            placeholder="•••• (পিন)"
                            value={authPin}
                            onChange={e => setAuthPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="font-mono font-bold text-center tracking-widest text-xs py-2 bg-white dark:bg-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type={authPinVisible ? 'text' : 'password'}
                            maxLength={4}
                            inputMode="numeric"
                            placeholder="•••• (কনফার্ম)"
                            value={authConfirmPin}
                            onChange={e => setAuthConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="font-mono font-bold text-center tracking-widest text-xs py-2 bg-white dark:bg-slate-900"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        পিন সেট করার পর ব্যাকআপ কপি স্বয়ংক্রিয়ভাবে আপনার WhatsApp-এ চলে যাবে।
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">লিঙ্গ (Gender) *</label>
                      <select
                        value={passengerGender}
                        onChange={e => setPassengerGender(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MALE">ছাত্র / পুরুষ (Male)</option>
                        <option value="FEMALE">ছাত্রী / নারী (Female)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">ক্যাটাগরি *</label>
                      <select
                        value={isStudent ? 'STUDENT' : 'GUEST'}
                        onChange={e => setIsStudent(e.target.value === 'STUDENT')}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="STUDENT">ভর্তি পরীক্ষার্থী (Student)</option>
                        <option value="GUEST">অভিভাবক / সাধারণ যাত্রী</option>
                      </select>
                    </div>
                  </div>

                  {isStudent && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        ভর্তি রোল / ইউনিট আইডি (ঐচ্ছিক)
                      </label>
                      <Input
                        type="text"
                        placeholder="যেমন: RU-Unit-A-10284"
                        value={studentAdmissionId}
                        onChange={e => setStudentAdmissionId(e.target.value)}
                        className="rounded-xl py-2.5 text-xs"
                      />
                    </div>
                  )}

                  {/* 1. Journey Direction Selector */}
                  <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>যাত্রার ধরণ (Journey Direction) *</span>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {journeyType === 'ROUND_TRIP'
                          ? 'ফুল প্যাকেজ'
                          : journeyType === 'ASYMMETRIC'
                          ? 'কাস্টম সিট স্প্লিট'
                          : '৫০% হাফ ভাড়া'}
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setJourneyType('ROUND_TRIP')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                          journeyType === 'ROUND_TRIP'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>🚌</span>
                          <span>উভয়মুখী (যাওয়া+আসা)</span>
                        </div>
                        <span className="text-[10px] block opacity-80 mt-0.5 font-normal">সম্পূর্ণ ট্রিপ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJourneyType('OUTBOUND_ONLY')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                          journeyType === 'OUTBOUND_ONLY'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>➡️</span>
                          <span>শুধুমাত্র যাওয়া</span>
                        </div>
                        <span className="text-[10px] block opacity-80 mt-0.5 font-normal">হাফ টিকিট (৫০% ভাড়া)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJourneyType('RETURN_ONLY')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                          journeyType === 'RETURN_ONLY'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>⬅️</span>
                          <span>শুধুমাত্র আসা</span>
                        </div>
                        <span className="text-[10px] block opacity-80 mt-0.5 font-normal">হাফ টিকিট (৫০% ভাড়া)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJourneyType('ASYMMETRIC')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                          journeyType === 'ASYMMETRIC'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>👥</span>
                          <span>অভিভাবক সহ স্প্লিট</span>
                        </div>
                        <span className="text-[10px] block opacity-80 mt-0.5 font-normal">যাওয়া ২ জন + আসা ১ জন</span>
                      </button>
                    </div>

                    {/* Asymmetric per-seat configuration breakdown */}
                    {journeyType === 'ASYMMETRIC' && selectedSeats.length > 0 && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block">
                          প্রতিটি সিটের জন্য যাওয়ার/আসার ধরণ নির্ধারণ করুন:
                        </span>
                        <div className="space-y-2">
                          {selectedSeats.map((s, idx) => {
                            const curLeg = seatLegs[s.seatId] || (idx === 0 ? 'ROUND_TRIP' : 'OUTBOUND_ONLY');
                            return (
                              <div key={s.seatId} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/70 rounded-lg">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  সিট {s.seatNumber} ({idx === 0 ? 'পরীক্ষার্থী' : 'অভিভাবক'}):
                                </span>
                                <select
                                  value={curLeg}
                                  onChange={(e) => {
                                    setSeatLegs({
                                      ...seatLegs,
                                      [s.seatId]: e.target.value as any
                                    });
                                  }}
                                  className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                  <option value="ROUND_TRIP">উভয়মুখী (যাওয়া ও আসা) - ৳{s.fare}</option>
                                  <option value="OUTBOUND_ONLY">শুধুমাত্র যাওয়া - ৳{Math.round(s.fare * 0.5)}</option>
                                  <option value="RETURN_ONLY">শুধুমাত্র আসা - ৳{Math.round(s.fare * 0.5)}</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Boarding & Dropping Points Selector with Dropdown + Custom Manual Entry */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <BoardingPointSelector
                      boardingPoint={boardingPoint}
                      onBoardingChange={setBoardingPoint}
                      droppingPoint={droppingPoint}
                      onDroppingChange={setDroppingPoint}
                    />
                  </div>

                  {/* Policy Notice */}
                  <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                    🔒 <strong>পেমেন্ট সংক্রান্ত তথ্য:</strong> এখনই কোনো পেমেন্ট লাগবে না। অনুরোধ পাঠানোর পর আমাদের কল সেন্টার প্রতিনিধি আপনার সাথে কথা বলে সিট নিশ্চিত করবেন এবং পেমেন্ট টাইমার উন্মুক্ত করবেন।
                  </p>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={selectedSeatIds.length === 0 || isBookingSubmitting}
                    isLoading={isBookingSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/25 text-xs py-3.5 rounded-xl cursor-pointer"
                  >
                    বুকিং অনুরোধ জমা দিন ({selectedSeatIds.length} টি সিট)
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>

                {/* Staff Admin Extra Controls if currentUserId is present */}
                {currentUserId && activeInspectorSeat && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">অফিস স্টাফ কন্ট্রোল (Seat {activeInspectorSeat.seatNumber})</span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsLockModalOpen(true)}
                        className="w-full text-xs font-bold"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1" />
                        লক করুন
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHold(activeInspectorSeat.seatId)}
                        className="w-full text-xs font-bold"
                      >
                        ১০ মি. হোল্ড
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Staff Lock Seat Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        title={`${t.lockSeat} ${activeInspectorSeat?.seatNumber}`}
        description="এই সিটটি জরুরি বা বিশেষ প্রয়োজনে লক করে রাখুন"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              লক করার কারণ
            </label>
            <select
              value={lockReason}
              onChange={e => setLockReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="EMERGENCY">ইমার্জেন্সি / জরুরি রিজার্ভ</option>
              <option value="VIP">ভিআইপি (বিশ্ববিদ্যালয় প্রতিনিধি / শিক্ষক)</option>
              <option value="STAFF">অফিস স্টাফ / বাস কো-অর্ডিনেটর</option>
              <option value="MAINTENANCE">সিট মেরামত / ড্যামেজ</option>
              <option value="OTHER">অন্যান্য বিশেষ কারণ</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              লকের স্থায়িত্ব
            </label>
            <select
              value={lockType}
              onChange={e => setLockType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="PERMANENT">স্থায়ী (বাস ছাড়া পর্যন্ত লক)</option>
              <option value="TEMPORARY">অস্থায়ী লক</option>
            </select>
          </div>

          <Input
            label="লক নোট / বিবরণ"
            placeholder="e.g. ভর্তি পরীক্ষার টিম কো-অর্ডিনেটরের জন্য সংরক্ষিত"
            value={lockNotes}
            onChange={e => setLockNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLockModalOpen(false)}>
              বাতিল
            </Button>
            <Button variant="danger" size="sm" onClick={handleLockSubmit} isLoading={actionLoading} className="font-bold">
              লক নিশ্চিত করুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
