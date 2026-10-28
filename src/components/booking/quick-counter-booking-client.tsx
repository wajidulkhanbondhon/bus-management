'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  Zap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Ticket,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Tag,
  AlertCircle,
  X,
  Armchair,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingSummarySidebar, SelectedSeatItem } from './booking-summary-sidebar';
import { createBookingAction } from '@/actions/booking.actions';
import { formatCurrency, formatDate, formatTime, cleanAndLimitPhoneNumber, isValidBdMobile } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  trips: any[];
  initialTripId?: string;
  currentUser?: any;
}

export function QuickCounterBookingClient({ trips, initialTripId, currentUser }: Props) {
  const router = useRouter();
  const { language } = useApp();
  const { success: toastSuccess, error: toastError } = useToast();

  // Trip selection state
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (initialTripId && trips.some((t) => t.id === initialTripId)) {
      return initialTripId;
    }
    return trips[0]?.id || '';
  });

  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState<string>('ALL');
  const [isBusSelectorExpanded, setIsBusSelectorExpanded] = useState(false);

  // Seat selection states
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Form states
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerGender, setPassengerGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isStudent, setIsStudent] = useState(true);
  const [studentAdmissionId, setStudentAdmissionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('HAND_CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing & Organization Defaults
  const [processingFee, setProcessingFee] = useState<number>(0);
  const [vatTaxAmount, setVatTaxAmount] = useState<number>(0);
  const [cashoutCharge, setCashoutCharge] = useState<number>(0);

  // Confirmed booking modal/alert data
  const [confirmedBookingData, setConfirmedBookingData] = useState<any | null>(null);

  // Load fee settings from organization defaults
  useEffect(() => {
    try {
      const orgSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('atoms_organization_settings') || '{}') : {};
      if (orgSettings?.finance) {
        if (orgSettings.finance.defaultProcessingFee !== undefined) {
          setProcessingFee(Number(orgSettings.finance.defaultProcessingFee) || 0);
        }
        if (orgSettings.finance.taxCalculationType === 'FIXED' && orgSettings.finance.taxFixedAmount !== undefined) {
          setVatTaxAmount(Number(orgSettings.finance.taxFixedAmount) || 0);
        }
        if (orgSettings.finance.autoApplyMfsCashout) {
          if (orgSettings.finance.mfsCashoutCalculationType === 'FIXED' && orgSettings.finance.defaultMfsCashoutFixed !== undefined) {
            setCashoutCharge(Number(orgSettings.finance.defaultMfsCashoutFixed) || 0);
          }
        }
      }
    } catch {}
  }, []);

  // Current active trip
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  // Extract human-readable details from active trip
  const activeBusInfo = useMemo(() => {
    if (!activeTrip) return null;
    const bus = activeTrip.bus || {};
    const route = activeTrip.route || {};
    const busNumber = bus.busNumber || bus.bus_number || 'COACH';
    const busName = bus.busName || bus.bus_name || `বাস ${busNumber}`;
    const targetUni = activeTrip.targetUniversity || bus.targetUniversity || route.destination || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
    const examUnit = activeTrip.examUnit || bus.examUnit || 'A Unit';
    const uniqueCode = activeTrip.uniqueCode || bus.uniqueCode || 'ATOMS-BUS';
    const origin = route.origin || 'ঢাকা';
    const destination = route.destination || targetUni;
    const routeName = route.routeName || route.route_name || `${origin} ➔ ${destination}`;
    const depDate = activeTrip.departureDate || activeTrip.departure_date || new Date().toISOString();
    const depTime = activeTrip.departureTime || activeTrip.departure_time || '22:30';
    const basePrice = Number(activeTrip.basePrice ?? activeTrip.base_price ?? 550);
    const capacity = Number(bus.capacity) || 45;
    const busType = activeTrip.tripBusType || activeTrip.trip_bus_type || bus.busType || bus.bus_type || 'MIXED';

    return {
      busNumber,
      busName,
      targetUni,
      examUnit,
      uniqueCode,
      origin,
      destination,
      routeName,
      depDate,
      depTime,
      basePrice,
      capacity,
      busType,
    };
  }, [activeTrip]);

  // Helper to generate fallback 45 seats if backend is offline or empty
  const generateFallbackSeats = useCallback((tId: string) => {
    const defaultCapacity = activeBusInfo?.capacity || 45;
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const seats: any[] = [];
    let count = 0;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const rowChar = rows[rIdx];
      const isLastRow = (rIdx === rows.length - 1) && defaultCapacity >= 45;
      const cols = isLastRow ? 5 : 4;

      for (let c = 1; c <= cols; c++) {
        if (count >= defaultCapacity) break;
        const seatNum = `${rowChar}${c}`;
        seats.push({
          seatId: `seat-${tId}-${seatNum}`,
          seat_id: `seat-${tId}-${seatNum}`,
          seatNumber: seatNum,
          seat_number: seatNum,
          rowIndex: rIdx,
          colIndex: c - 1,
          seatType: rIdx < 2 ? 'VIP' : 'STANDARD',
          genderAllowed: 'ANY',
          fare: activeTrip?.basePrice || (rIdx < 2 ? 650 : 550),
          status: 'AVAILABLE',
          passengerName: '',
          passengerPhone: ''
        });
        count++;
      }
    }
    setTripSeats(seats);
  }, [activeBusInfo?.capacity, activeTrip?.basePrice]);

  // Fetch live seat inventory when selected trip changes
  const fetchLiveSeats = useCallback(async (tId: string) => {
    if (!tId) return;
    setIsLoadingSeats(true);
    setSelectedSeatIds([]);
    try {
      const res = await fetch(`/api/backend/inventory/${tId}/seat-map`);
      if (res.ok) {
        const data = await res.json();
        const rawSeats = data.seats || [];
        if (Array.isArray(rawSeats) && rawSeats.length > 0) {
          const normalized = rawSeats.map((s: any, idx: number) => {
            const rawNum = (s.seat_number || s.seatNumber || s.label || s.seatId || `S${idx + 1}`).toString().trim().toUpperCase();
            return {
              seatId: s.seat_id || s.seatId || `seat-${tId}-${rawNum}`,
              seat_id: s.seat_id || s.seatId || `seat-${tId}-${rawNum}`,
              seatNumber: rawNum,
              seat_number: rawNum,
              rowIndex: typeof s.row_index === 'number' ? s.row_index : (typeof s.rowIndex === 'number' ? s.rowIndex : 0),
              colIndex: typeof s.col_index === 'number' ? s.col_index : (typeof s.colIndex === 'number' ? s.colIndex : 0),
              seatType: s.seat_type || s.seatType || 'STANDARD',
              genderAllowed: s.gender_allowed || s.genderAllowed || 'ANY',
              fare: Number(s.fare) || activeTrip?.basePrice || 550,
              status: (s.status || 'AVAILABLE').toUpperCase(),
              passengerName: s.passenger_name || s.passengerName || '',
              passengerPhone: s.passenger_phone || s.passengerPhone || '',
              bookingNumber: s.booking_number || s.bookingNumber || '',
              holdInfo: s.hold_info || s.holdInfo,
              lockInfo: s.lock_info || s.lockInfo,
            };
          });
          setTripSeats(normalized);
        } else {
          generateFallbackSeats(tId);
        }
      } else {
        generateFallbackSeats(tId);
      }
    } catch {
      generateFallbackSeats(tId);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [activeTrip?.basePrice, generateFallbackSeats]);

  useEffect(() => {
    if (activeTrip?.id) {
      fetchLiveSeats(activeTrip.id);
    }
  }, [activeTrip?.id, fetchLiveSeats]);

  // Filtered trips list for bus selector
  const filteredTrips = useMemo(() => {
    let list = trips;

    // Filter by university tab
    if (universityFilter !== 'ALL') {
      list = list.filter((t) => {
        const uText = `${t.targetUniversity || ''} ${t.bus?.notes || ''} ${t.route?.destination || ''} ${t.bus?.busName || ''}`.toUpperCase();
        if (universityFilter === 'RU') return uText.includes('RU') || uText.includes('RAJSHAHI') || uText.includes('রাজশাহী');
        if (universityFilter === 'DU') return uText.includes('DU') || uText.includes('DHAKA') || uText.includes('ঢাকা');
        if (universityFilter === 'JU') return uText.includes('JU') || uText.includes('JAHANGIR') || uText.includes('জাহাঙ্গীরনগর');
        if (universityFilter === 'CU') return uText.includes('CU') || uText.includes('CHITTAGONG') || uText.includes('চট্টগ্রাম');
        if (universityFilter === 'GST') return uText.includes('GST') || uText.includes('গুচ্ছ');
        return uText.includes(universityFilter.toUpperCase());
      });
    }

    // Filter by text search query
    if (busSearchQuery.trim()) {
      const q = busSearchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const bNum = (t.bus?.busNumber || t.bus?.bus_number || '').toLowerCase();
        const bName = (t.bus?.busName || t.bus?.bus_name || '').toLowerCase();
        const route = (t.route?.routeName || t.route?.route_name || '').toLowerCase();
        const dest = (t.targetUniversity || t.route?.destination || '').toLowerCase();
        const unit = (t.examUnit || t.bus?.examUnit || '').toLowerCase();
        const code = (t.uniqueCode || t.bus?.uniqueCode || '').toLowerCase();
        return (
          bNum.includes(q) ||
          bName.includes(q) ||
          route.includes(q) ||
          dest.includes(q) ||
          unit.includes(q) ||
          code.includes(q)
        );
      });
    }

    return list;
  }, [trips, universityFilter, busSearchQuery]);

  // Seat toggle logic
  const handleToggleSeat = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= 6) {
        alert(language === 'bn' ? 'একসাথে সর্বোচ্চ ৬টি সিট বুক করা যাবে।' : 'Maximum 6 seats per booking.');
        return prev;
      }
      return [...prev, seatId];
    });
  };

  // Build selected seat items for sidebar
  const selectedSeatItems: SelectedSeatItem[] = useMemo(() => {
    return selectedSeatIds.map((id) => {
      const found = tripSeats.find((s) => s.seatId === id || s.seat_id === id);
      const sNum = found?.seatNumber || found?.seat_number || id.split('-').pop() || 'Seat';
      const fare = Number(found?.fare) || activeBusInfo?.basePrice || 550;
      return {
        seatId: id,
        seatNumber: sNum,
        fare,
        genderAllowed: found?.genderAllowed || found?.gender_allowed || 'ANY'
      };
    });
  }, [selectedSeatIds, tripSeats, activeBusInfo?.basePrice]);

  const grossAmount = useMemo(() => {
    return selectedSeatItems.reduce((acc, s) => acc + s.fare, 0);
  }, [selectedSeatItems]);

  const netAmount = grossAmount + processingFee + vatTaxAmount + cashoutCharge;

  useEffect(() => {
    setPaidAmount(netAmount);
  }, [netAmount]);

  // Handle MFS payment cashout auto-calculation
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === 'BKASH' || method === 'NAGAD' || method === 'ROCKET') {
      try {
        const orgSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('atoms_organization_settings') || '{}') : {};
        const autoApply = orgSettings.finance?.autoApplyMfsCashout ?? true;
        if (autoApply && cashoutCharge === 0 && grossAmount > 0) {
          if (orgSettings.finance?.mfsCashoutCalculationType === 'FIXED') {
            setCashoutCharge(orgSettings.finance?.defaultMfsCashoutFixed ?? 0);
          } else {
            const pct = orgSettings.finance?.defaultMfsCashoutPercent ?? 1.5;
            setCashoutCharge(Math.round(grossAmount * (pct / 100)));
          }
        }
      } catch {
        if (cashoutCharge === 0 && grossAmount > 0) {
          setCashoutCharge(Math.round(grossAmount * 0.015));
        }
      }
    } else if (method === 'HAND_CASH') {
      setCashoutCharge(0);
    }
  };

  // Confirm booking handler
  const handleConfirmBooking = async () => {
    if (selectedSeatIds.length === 0) {
      toastError(language === 'bn' ? 'অনুগ্রহ করে অন্তত একটি আসন নির্বাচন করুন।' : 'Please select at least one seat.');
      return;
    }
    const cleanPhone = cleanAndLimitPhoneNumber(passengerPhone);
    if (!cleanPhone || !isValidBdMobile(cleanPhone)) {
      toastError(language === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please enter valid 11-digit mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tripId: activeTrip.id,
        seats: selectedSeatItems.map((s) => ({
          seatId: s.seatId,
          fare: Number(s.fare) || activeBusInfo?.basePrice || 550,
        })),
        passengers: selectedSeatItems.map((s, idx) => ({
          passengerName: passengerName.trim() || `কাউন্টার যাত্রী ${idx + 1}`,
          passengerPhone: cleanPhone,
          passengerType: isStudent ? 'STUDENT' : 'GUEST',
          gender: passengerGender,
          seatId: s.seatId,
          admissionId: (isStudent && studentAdmissionId.trim()) ? studentAdmissionId.trim() : undefined,
        })),
        contactName: passengerName.trim() || 'কাউন্টার যাত্রী',
        contactPhone: cleanPhone,
        journeyType: 'ROUND_TRIP',
        paymentMethod: paymentMethod,
        paidAmount: Number(paidAmount) || 0,
        processingFee: Number(processingFee) || 0,
        vatAmount: Number(vatTaxAmount) || 0,
        cashoutFee: Number(cashoutCharge) || 0,
        notes: `কুইক কাউন্টার বুকিং - বাস: ${activeBusInfo?.busNumber} | অপারেটর: ${currentUser?.name || 'কাউন্টার স্টাফ'}`
      };

      const result = await createBookingAction(payload as any);
      if (result.success && result.booking) {
        const bNumber = result.booking.bookingNumber || result.booking.booking_number || 'BK-SUCCESS';
        toastSuccess(
          language === 'bn'
            ? `🎉 টিকিট বুকিং সফল হয়েছে! ট্র্যাকিং নম্বর: ${bNumber}`
            : `🎉 Booking confirmed successfully! Tracking: ${bNumber}`
        );
        setConfirmedBookingData(result.booking);
        if (autoPrintTicket) {
          router.push(`/bookings/${result.booking.id}?success=true&autoPrint=true`);
        } else {
          // Stay on counter page and refresh seats immediately
          fetchLiveSeats(activeTrip.id);
          setSelectedSeatIds([]);
        }
      } else {
        toastError(result.error || (language === 'bn' ? 'বুকিং সম্পন্ন করতে ব্যর্থ হয়েছে।' : 'Failed to confirm booking.'));
        fetchLiveSeats(activeTrip.id);
      }
    } catch (e: any) {
      toastError(e.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seat counts computation
  const totalSeatsCount = tripSeats.length || activeBusInfo?.capacity || 45;
  const bookedSeatsCount = tripSeats.filter((s) => s.status === 'BOOKED').length;
  const heldSeatsCount = tripSeats.filter((s) => s.status === 'HELD').length;
  const lockedSeatsCount = tripSeats.filter((s) => s.status === 'LOCKED' || s.status === 'MAINTENANCE').length;
  const availableSeatsCount = Math.max(0, totalSeatsCount - bookedSeatsCount - heldSeatsCount - lockedSeatsCount);

  // Extra seats (e.g. EX-1, EX-2)
  const extraSeats = useMemo(() => {
    return tripSeats.filter((s) => {
      const sNum = (s.seatNumber || '').toUpperCase();
      return sNum.startsWith('EX') || sNum.includes('EXTRA');
    });
  }, [tripSeats]);

  // Render individual seat button
  const renderSeatButton = (sNum: string, isWindow: boolean) => {
    const seatObj = tripSeats.find((s) => (s.seatNumber || s.seat_number) === sNum);
    const seatId = seatObj?.seatId || seatObj?.seat_id || `seat-${activeTrip?.id}-${sNum}`;
    const status = (seatObj?.status || 'AVAILABLE').toUpperCase();
    const isBooked = status === 'BOOKED';
    const isHeld = status === 'HELD';
    const isLocked = status === 'LOCKED' || status === 'MAINTENANCE';
    const isDisabled = isBooked || isHeld || isLocked;
    const isSelected = selectedSeatIds.includes(seatId);
    const seatPrice = Number(seatObj?.fare) || activeBusInfo?.basePrice || 550;
    const isFemaleOnly = seatObj?.genderAllowed === 'FEMALE_ONLY' || seatObj?.gender_allowed === 'FEMALE_ONLY';
    const isMaleOnly = seatObj?.genderAllowed === 'MALE_ONLY' || seatObj?.gender_allowed === 'MALE_ONLY';

    let tooltip = `সিট: ${sNum} ${isWindow ? '• জানালা (Window)' : ''} | ভাড়া: ৳${seatPrice}`;
    if (isBooked) tooltip += ` | বুকড (${seatObj?.passengerName || 'যাত্রী'})`;
    if (isHeld) tooltip += ' | সাময়িকভাবে হোল্ড করা';
    if (isLocked) tooltip += ' | সংরক্ষিত / লকড';

    return (
      <button
        key={sNum}
        type="button"
        disabled={isDisabled}
        onClick={() => handleToggleSeat(seatId, status)}
        title={tooltip}
        className={`w-11 h-12 xs:w-12 xs:h-13 sm:w-14 sm:h-15 shrink-0 p-0.5 xs:p-1 rounded-lg xs:rounded-xl sm:rounded-2xl flex flex-col items-center justify-between font-black transition-all duration-150 select-none cursor-pointer relative border xs:border-2 ${
          isSelected
            ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105 z-10 ring-2 sm:ring-4 ring-blue-500/30'
            : isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/70 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700 opacity-70 cursor-not-allowed'
            : isHeld
            ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/70 dark:to-amber-900/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 opacity-75 cursor-not-allowed'
            : isLocked
            ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-500 border-slate-400 dark:border-slate-700 opacity-60 cursor-not-allowed'
            : isFemaleOnly
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/60 dark:to-pink-900/60 text-pink-950 dark:text-pink-200 border-pink-400 dark:border-pink-600 hover:border-pink-500 shadow-xs'
            : isMaleOnly
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-blue-400 dark:border-blue-500 shadow-xs hover:border-blue-500'
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 shadow-xs hover:border-blue-500 hover:shadow-md'
        }`}
      >
        {/* Headrest Cushion */}
        <div
          className={`w-6 xs:w-8 h-1 rounded-full shadow-inner transition-all ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isHeld
              ? 'bg-amber-400'
              : isLocked
              ? 'bg-slate-400'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Seat Number & Window Indicator */}
        <div className="flex items-center justify-center gap-0.5 my-auto">
          <span className={`text-xs xs:text-sm font-black tracking-tight leading-none font-mono ${isSelected ? 'text-white' : ''}`}>
            {sNum}
          </span>
          {isWindow && (
            <span className="text-[8px] opacity-75 select-none" title="জানালা (Window)">
              🪟
            </span>
          )}
        </div>

        {/* Fare / Status Pill */}
        <div
          className={`w-full flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded backdrop-blur-xs transition-colors ${
            isSelected
              ? 'bg-black/30 text-white'
              : 'bg-black/5 dark:bg-white/10'
          }`}
        >
          {isSelected ? (
            <span className="text-[9px] xs:text-xs font-black font-mono leading-none tracking-tight flex items-center gap-0.5 text-white">
              ✓ ৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[8px] xs:text-[9px] font-black text-rose-700 dark:text-rose-300 leading-none">
              বুকড
            </span>
          ) : isHeld ? (
            <span className="text-[8px] xs:text-[9px] font-black text-amber-700 dark:text-amber-300 leading-none">
              হোল্ড
            </span>
          ) : isLocked ? (
            <span className="text-[8px] xs:text-[9px] font-black text-slate-600 dark:text-slate-400 leading-none">
              লকড
            </span>
          ) : (
            <span className="text-[9px] xs:text-xs font-black font-mono leading-none tracking-tight">
              ৳{seatPrice}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div suppressHydrationWarning className="space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black shadow-inner">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-md">
                Fast Counter Mode
              </span>
              <Badge variant="default" className="bg-amber-400 text-slate-950 font-black text-xs">
                {language === 'bn' ? '৩০ সেকেন্ড কুইক বুকিং' : '30-Sec Fast Booking'}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'কুইক কাউন্টার টিকিট বুকিং' : 'Rapid Counter Seat Booking'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBusSelectorExpanded((prev) => !prev)}
            className="bg-white/15 hover:bg-white/25 text-white border-white/40 rounded-xl font-bold text-xs"
          >
            <Bus className="w-3.5 h-3.5 mr-1" />
            {language === 'bn' ? 'বাস পরিবর্তন করুন' : 'Change Bus'}
            {isBusSelectorExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveSeats(activeTrip?.id)}
            className="bg-white/15 hover:bg-white/25 text-white border-white/40 rounded-xl font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
          <Link href="/bookings/new">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold text-xs">
              {language === 'bn' ? 'উইজার্ড মোড ➔' : 'Full Wizard ➔'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Active Bus Identifier Banner */}
      {activeBusInfo && (
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-blue-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30 shadow-md rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-mono font-black text-xs px-2.5 py-0.5">
                    {activeBusInfo.busNumber}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {activeBusInfo.uniqueCode}
                  </span>
                  <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    {activeBusInfo.targetUni}
                  </Badge>
                  <Badge variant="outline" className="border-purple-400 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    <Tag className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    {activeBusInfo.examUnit}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {activeBusInfo.busName}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeBusInfo.routeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(activeBusInfo.depDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime(activeBusInfo.depTime)}
                  </span>
                </div>
              </div>

              {/* Live Seat Stats & Quick Switch */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'খালি' : 'Avail'}</div>
                    <div className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {availableSeatsCount}
                    </div>
                  </div>
                  <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'বুকড' : 'Booked'}</div>
                    <div className="font-mono text-base font-black text-rose-600 dark:text-rose-400">
                      {bookedSeatsCount}
                    </div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'ভাড়া' : 'Fare'}</div>
                    <div className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                      ৳{activeBusInfo.basePrice}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsBusSelectorExpanded((prev) => !prev)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <Bus className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'বাস তালিকা' : 'Bus List'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bus / Trip Selector (Drawer or Quick Switcher) */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 space-y-3.5">
          {/* Top Controls: Direct Dropdown + Search Input + Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Direct Select Dropdown */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                {language === 'bn' ? '🚌 সরাসরি বাস নির্বাচন করুন:' : '🚌 Select Bus Directly:'}
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {trips.map((t) => {
                  const bNum = t.bus?.busNumber || t.bus?.bus_number || 'COACH';
                  const bName = t.bus?.busName || t.bus?.bus_name || `বাস ${bNum}`;
                  const uni = t.targetUniversity || t.route?.destination || 'Campus';
                  const unit = t.examUnit || t.bus?.examUnit || '';
                  const dep = t.departureDate || t.departure_date || '';
                  const depStr = dep ? formatDate(dep) : '';
                  const fare = t.basePrice || t.base_price || 550;
                  return (
                    <option key={t.id} value={t.id}>
                      [{bNum}] {bName} • {uni} {unit ? `(${unit})` : ''} • {depStr} • ৳{fare}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Input */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                {language === 'bn' ? '🔍 বাস নম্বর বা রুট খুঁজুন:' : '🔍 Search Bus or Route:'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'বাস নম্বর, রাবি, ঢাবি, রুট...' : 'Bus number, university, route...'}
                  value={busSearchQuery}
                  onChange={(e) => setBusSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* University Quick Tabs */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                {language === 'bn' ? 'ফিল্টার:' : 'Filter:'}
              </label>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(['ALL', 'RU', 'DU', 'JU', 'CU', 'GST'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUniversityFilter(tab)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      universityFilter === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'ALL' ? (language === 'bn' ? 'সকল' : 'All') : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bus Cards Horizontal Scroll / Carousel */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{filteredTrips.length} {language === 'bn' ? 'টি বাস পাওয়া গেছে (ক্লিক করে নির্বাচন করুন):' : 'Buses Available (Click to select):'}</span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                {language === 'bn' ? 'নির্বাচিত বাস হাইলাইট করা আছে' : 'Active Bus Highlighted'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {filteredTrips.map((t) => {
                const isSelected = t.id === selectedTripId;
                const busNum = t.bus?.busNumber || t.bus?.bus_number || 'COACH';
                const busName = t.bus?.busName || t.bus?.bus_name || `বাস ${busNum}`;
                const uniName = t.targetUniversity || t.route?.destination || 'Campus';
                const unitName = t.examUnit || t.bus?.examUnit || '';
                const fare = t.basePrice || t.base_price || 550;
                const depDate = t.departureDate || t.departure_date;
                const depStr = depDate ? formatDate(depDate) : '';

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTripId(t.id)}
                    className={`p-3 rounded-2xl text-left shrink-0 transition-all border-2 flex flex-col gap-1.5 cursor-pointer min-w-[200px] max-w-[240px] relative ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-xs shadow-xs">
                        ✓
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                      }`}>
                        <Bus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-xs leading-none block">{busNum}</span>
                        <span className="text-[10px] opacity-80 font-mono">৳{fare}</span>
                      </div>
                    </div>

                    <div className="text-xs font-bold truncate leading-tight mt-0.5">
                      {busName}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] opacity-90 truncate">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span className="truncate">{uniName} {unitName ? `• ${unitName}` : ''}</span>
                    </div>

                    {depStr && (
                      <div className="text-[10px] opacity-80 flex items-center gap-1 font-mono pt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{depStr}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Coach Seat Map (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Coach Top Bar Info */}
            <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-amber-400 bg-white/10 px-2 py-0.5 rounded">
                    {activeBusInfo?.busNumber || activeTrip?.tripCode}
                  </span>
                  <span className="font-bold text-sm text-white">{activeBusInfo?.busName}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeBusInfo?.routeName} • {activeBusInfo?.targetUni} {activeBusInfo?.examUnit ? `(${activeBusInfo.examUnit})` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">{availableSeatsCount} খালি</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400 font-bold">{bookedSeatsCount} বুকড</span>
                {heldSeatsCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-bold">{heldSeatsCount} হোল্ড</span>
                  </>
                )}
                {lockedSeatsCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-bold">{lockedSeatsCount} লকড</span>
                  </>
                )}
              </div>
            </div>

            {/* Seat Map Legend */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border-2 border-slate-300"></span>
                <span>খালি আসন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-400"></span>
                <span className="font-bold text-blue-600 dark:text-blue-400">নির্বাচিত সিট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400">বুকড (বিক্রিত)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-400"></span>
                <span className="text-amber-600 dark:text-amber-400">হোল্ড</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <span>🪟 জানালা (Window)</span>
              </div>
            </div>

            {/* Seat Grid Frame */}
            <CardContent className="p-2 sm:p-6 bg-slate-100/60 dark:bg-slate-950/60 flex flex-col items-center justify-center min-h-[460px] overflow-x-auto">
              {isLoadingSeats ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>সিট ম্যাপ ও রানিং ইনভেন্টরি লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-4 border-slate-300 dark:border-slate-700 shadow-xl w-full max-w-md mx-auto">
                  {/* Cockpit / Driver Cabin Header */}
                  <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1 gap-1.5">
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black shadow-xs">
                      <span>🚪</span>
                      <span>{language === 'bn' ? 'গেট (DOOR)' : 'DOOR'}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black shadow-xs">
                      <span>✇</span>
                      <span>{language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}</span>
                    </div>
                  </div>

                  {/* Seat Rows Matrix */}
                  <div className="space-y-2 xs:space-y-2.5 sm:space-y-3">
                    {Array.from({ length: 11 }).map((_, r) => {
                      const rowChar = 'ABCDEFGHIJKLMN'[r] || `R${r + 1}`;
                      const isLastRow = r === 10;
                      return (
                        <div key={r} className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
                          {/* Left Seats: 1, 2 */}
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                            {renderSeatButton(`${rowChar}1`, true)}
                            {renderSeatButton(`${rowChar}2`, false)}
                          </div>

                          {/* Center Walkway / Aisle */}
                          <div className="w-6 xs:w-7 sm:w-8 text-center font-mono text-[10px] sm:text-[11px] font-black text-slate-400 flex items-center justify-center">
                            {isLastRow ? (
                              renderSeatButton(`${rowChar}3`, false)
                            ) : (
                              <span className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] xs:text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
                                {rowChar}
                              </span>
                            )}
                          </div>

                          {/* Right Seats: 3, 4 (or 4, 5 on last row) */}
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                            {renderSeatButton(`${rowChar}${isLastRow ? 4 : 3}`, false)}
                            {renderSeatButton(`${rowChar}${isLastRow ? 5 : 4}`, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Extra Seats Section (if any present in bus layout) */}
                  {extraSeats.length > 0 && (
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                        <span>{language === 'bn' ? 'অতিরিক্ত আসন (Extra Seats):' : 'Extra Seats:'}</span>
                        <span className="text-[10px] font-mono">{extraSeats.length} টি উপলব্ধ</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extraSeats.map((es) => renderSeatButton(es.seatNumber, false))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <BookingSummarySidebar
            selectedSeats={selectedSeatItems}
            onRemoveSeat={(id) => setSelectedSeatIds((prev) => prev.filter((sId) => sId !== id))}
            grossAmount={grossAmount}
            netAmount={netAmount}
            paidAmount={paidAmount}
            onPaidAmountChange={(amt) => setPaidAmount(amt)}
            processingFee={processingFee}
            onProcessingFeeChange={(fee) => setProcessingFee(fee)}
            vatTaxAmount={vatTaxAmount}
            onVatTaxAmountChange={(tax) => setVatTaxAmount(tax)}
            cashoutCharge={cashoutCharge}
            onCashoutChargeChange={(charge) => setCashoutCharge(charge)}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            passengerName={passengerName}
            onPassengerNameChange={(val) => setPassengerName(val)}
            passengerPhone={passengerPhone}
            onPassengerPhoneChange={(val) => setPassengerPhone(val)}
            passengerGender={passengerGender}
            onPassengerGenderChange={(g) => setPassengerGender(g)}
            isStudent={isStudent}
            onIsStudentChange={(val) => setIsStudent(val)}
            studentAdmissionId={studentAdmissionId}
            onStudentAdmissionIdChange={(id) => setStudentAdmissionId(id)}
            autoPrintTicket={autoPrintTicket}
            onAutoPrintTicketChange={(val) => setAutoPrintTicket(val)}
            onConfirmBooking={handleConfirmBooking}
            isSubmitting={isSubmitting}
            trip={activeTrip}
          />
        </div>
      </div>
    </div>
  );
}
