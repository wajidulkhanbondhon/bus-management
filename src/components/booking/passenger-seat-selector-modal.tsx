'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  User,
  GraduationCap,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Flame,
  Check,
  Info,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { createPreBookingAction } from '@/actions/booking.actions';
import { SeatStatusDetail } from '@/services/inventory.service';
import { calculateDynamicAdjacentSeatLocks } from '@/services/rules.service';
import {
  lookupPassengerByPhone,
  recordPassengerInDirectory,
  DirectoryPassenger
} from '@/services/passenger-directory.service';

interface Props {
  trip: any;
  seats: SeatStatusDetail[];
  isOpen: boolean;
  onClose: () => void;
}

export function PassengerSeatSelectorModal({ isOpen, onClose, trip, seats }: Props) {
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [suggestedPassenger, setSuggestedPassenger] = useState<DirectoryPassenger | null>(null);
  const [passengerGender, setPassengerGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isStudent, setIsStudent] = useState(true);
  const [studentAdmissionId, setStudentAdmissionId] = useState('');
  const [boardingPoint, setBoardingPoint] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  // Auto-populate saved profile info if available
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('atoms_passenger_phone');
      if (savedPhone) {
        if (!contactPhone) setContactPhone(savedPhone);
        const dir = lookupPassengerByPhone(savedPhone);
        if (dir) {
          if (!contactName) setContactName(dir.name);
          if (dir.gender) setPassengerGender(dir.gender);
          if (dir.admissionId && !studentAdmissionId) setStudentAdmissionId(dir.admissionId);
        }
      }
    }
  }, [isOpen]);

  // Robust Row Grouping (A1..A4, B1..B4, ..., K1..K5)
  const organizedRows = useMemo(() => {
    if (!seats || seats.length === 0) return [];

    const rowMap = new Map<string, SeatStatusDetail[]>();

    seats.forEach(s => {
      let rowKey = 'A';
      const sNum = (s?.seatNumber || (s as any)?.seat_number || (s as any)?.label || '').trim();
      if (sNum && /^[A-Za-z]/.test(sNum)) {
        rowKey = sNum.charAt(0).toUpperCase();
      } else if (typeof s.rowIndex === 'number') {
        rowKey = String.fromCharCode(65 + s.rowIndex);
      }
      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, []);
      }
      rowMap.get(rowKey)!.push(s);
    });

    const sortedRowKeys = Array.from(rowMap.keys()).sort();

    return sortedRowKeys.map(rowKey => {
      const rowSeats = rowMap.get(rowKey)!.sort((a, b) => {
        const sNumA = (a?.seatNumber || (a as any)?.seat_number || (a as any)?.label || '').trim();
        const sNumB = (b?.seatNumber || (b as any)?.seat_number || (b as any)?.label || '').trim();
        const numA = parseInt(sNumA.replace(/\D/g, '')) || (a.colIndex ?? 0);
        const numB = parseInt(sNumB.replace(/\D/g, '')) || (b.colIndex ?? 0);
        return numA - numB;
      });

      if (rowSeats.length === 5) {
        return {
          rowKey,
          leftSeats: rowSeats.slice(0, 2),
          rightSeats: rowSeats.slice(2, 5),
          isRearBench: true,
          allSeats: rowSeats
        };
      }

      return {
        rowKey,
        leftSeats: rowSeats.slice(0, 2),
        rightSeats: rowSeats.slice(2, 4),
        isRearBench: false,
        allSeats: rowSeats
      };
    });
  }, [seats]);

  const selectedSeats = useMemo(() => {
    return seats.filter(s => selectedSeatIds.includes(s.seatId));
  }, [seats, selectedSeatIds]);

  const totalFare = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.fare, 0);
  }, [selectedSeats]);

  const dynamicLocks = useMemo(() => {
    return calculateDynamicAdjacentSeatLocks(seats);
  }, [seats]);

  const handleSeatClick = (seat: SeatStatusDetail) => {
    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter(id => id !== seat.seatId));
    } else {
      // Max 4 seats per online request
      if (selectedSeatIds.length >= 4) {
        alert('অনলাইনে একসাথে সর্বোচ্চ ৪টি সিট রিকোয়েস্ট করা যাবে।');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedSeatIds.length === 0) {
      setErrorMessage('অনুগ্রহ করে বাসের সিট ম্যাপ থেকে অন্তত একটি সিট নির্বাচন করুন।');
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMessage('যাত্রীর নাম এবং মোবাইল নম্বর আবশ্যক।');
      return;
    }

    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPreBookingAction({
        tripId: trip.id,
        seatIds: selectedSeatIds,
        contactName: contactName.trim(),
        contactPhone: cleanPhone,
        passengerGender,
        isStudent,
        studentAdmissionId: studentAdmissionId.trim() || undefined,
        notes: boardingPoint ? `বোর্ডিং পয়েন্ট: ${boardingPoint}` : undefined
      });

      if (res.success && res.booking) {
        // Record in local passenger directory
        recordPassengerInDirectory({
          phone: cleanPhone,
          name: contactName.trim(),
          gender: passengerGender,
          admissionId: studentAdmissionId.trim() || undefined,
          passengerType: isStudent ? 'STUDENT' : 'GUARDIAN'
        });
        setCreatedBooking(res.booking);
      } else {
        setErrorMessage(res.error || 'বুকিং অনুরোধ প্রক্রিয়া করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedBooking(null);
    setSelectedSeatIds([]);
    setErrorMessage(null);
    onClose();
  };

  // Helper renderer for a single seat button
  const renderSeatButton = (seat: SeatStatusDetail) => {
    const isSelected = selectedSeatIds.includes(seat.seatId);
    const isAvailable = seat.status === 'AVAILABLE';
    const isBooked = seat.status === 'BOOKED';
    const isHeld = seat.status === 'HELD' || seat.status === 'LOCKED';

    const seatNum = (seat.seatNumber || (seat as any).seat_number || (seat as any).label || '').trim().toUpperCase();
    const dynamicLock = seatNum ? dynamicLocks.get(seatNum) : undefined;
    const isFemaleLock = dynamicLock?.genderAllowed === 'FEMALE_ONLY';
    const isMaleLock = dynamicLock?.genderAllowed === 'MALE_ONLY';

    return (
      <button
        key={seat.seatId}
        type="button"
        onClick={() => handleSeatClick(seat)}
        disabled={!isAvailable}
        title={dynamicLock ? `${dynamicLock.reason} (${dynamicLock.genderAllowed === 'FEMALE_ONLY' ? 'শুধুমাত্র নারী' : 'শুধুমাত্র পুরুষ'})` : `সিট: ${seatNum || 'Seat'} | ভাড়া: ৳${seat.fare}`}
        className={`w-13 h-14 sm:w-14 sm:h-15 shrink-0 rounded-2xl font-black text-xs transition-all relative flex flex-col items-center justify-between p-1.5 select-none ${
          isSelected
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-2 border-blue-300 shadow-lg shadow-blue-600/40 ring-4 ring-blue-400/40 -translate-y-1 scale-105 z-10 cursor-pointer'
            : isBooked
            ? 'bg-rose-950/40 border border-rose-900/60 text-rose-300 opacity-60 cursor-not-allowed'
            : isHeld
            ? 'bg-amber-950/40 border border-amber-900/60 text-amber-300 opacity-70 cursor-not-allowed'
            : isFemaleLock
            ? 'bg-pink-950/60 border-2 border-pink-500/80 text-pink-200 hover:border-pink-400 hover:shadow-md hover:shadow-pink-500/20 hover:-translate-y-0.5 cursor-pointer'
            : isMaleLock
            ? 'bg-blue-950/60 border-2 border-blue-500/80 text-blue-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer'
            : 'bg-slate-900/90 border-2 border-slate-700 hover:border-emerald-400 text-slate-100 hover:bg-slate-800 hover:shadow-md hover:shadow-emerald-500/15 hover:-translate-y-0.5 active:scale-95 cursor-pointer'
        }`}
      >
        {/* Ergonomic Headrest Cushion */}
        <div
          className={`w-8 h-1.5 rounded-full transition-colors ${
            isSelected
              ? 'bg-white/95'
              : isBooked
              ? 'bg-rose-500'
              : isHeld
              ? 'bg-amber-500'
              : isFemaleLock
              ? 'bg-pink-500'
              : isMaleLock
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Crisp Seat Number */}
        <span className={`font-mono text-sm sm:text-base font-black tracking-tight leading-none ${isSelected ? 'text-white' : ''}`}>
          {seat.seatNumber}
        </span>

        {/* Fare / Status Badge */}
        <div
          className={`w-full text-center py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold leading-none ${
            isSelected
              ? 'bg-black/30 text-white flex items-center justify-center gap-0.5'
              : isBooked
              ? 'text-rose-400 font-sans'
              : isHeld
              ? 'text-amber-400 font-sans'
              : isFemaleLock
              ? 'text-pink-300'
              : isMaleLock
              ? 'text-blue-300'
              : 'text-emerald-400'
          }`}
        >
          {isSelected ? (
            <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5 stroke-[3]" /> ৳{seat.fare}</span>
          ) : isBooked ? (
            'বুকড'
          ) : isHeld ? (
            'লক'
          ) : isFemaleLock ? (
            '♀ Lock'
          ) : isMaleLock ? (
            '♂ Lock'
          ) : (
            `৳${seat.fare}`
          )}
        </div>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} size="xl" title="">
      {createdBooking ? (
        /* Success Screen */
        <div className="py-6 px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" className="px-3 py-1 text-xs">
              অনুরোধ সফলভাবে গ্রহণ করা হয়েছে
            </Badge>
            <h3 className="text-xl font-bold text-white">
              আপনার প্রি-বুকিং রিকোয়েস্ট জমা হয়েছে!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              আমাদের অফিস প্রতিনিধি <span className="text-white font-mono font-bold">{contactPhone}</span> নম্বরে কল করে আপনার তথ্য ও সিট ভেরিফাই করবেন।
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 max-w-md mx-auto text-xs shadow-md">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-slate-400">বুকিং রেফারেন্স নম্বর:</span>
              <span className="font-mono font-black text-base text-blue-400">{createdBooking.bookingNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">নির্বাচিত সিট:</span>
              <span className="font-bold text-white font-mono">
                {createdBooking.seats?.map((s: any) => s.seat?.seatNumber || 'Seat').join(', ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">মোট ভাড়া:</span>
              <span className="font-black text-emerald-400 text-sm font-mono">{formatCurrency(createdBooking.netAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">রুট ও সময়:</span>
              <span className="font-medium text-slate-200 text-right">
                {trip?.route?.origin} ➔ {trip?.route?.destination}<br />
                <span className="text-slate-400 font-mono text-[11px]">{formatDate(trip?.departureDate)} ({formatTime(trip?.departureTime)})</span>
              </span>
            </div>
          </div>

          {/* Important Instruction Notice */}
          <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-2xl text-left text-xs text-blue-200 space-y-1.5 max-w-md mx-auto">
            <div className="flex items-center gap-1.5 font-bold text-blue-300">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              পরবর্তী করণীয় (Next Steps):
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ১. কল সেন্টারের প্রতিনিধি আপনাকে কল করে শিক্ষার্থী/অভিভাবক আইডি এবং তথ্য যাচাই করবেন।<br />
              ২. ভেরিফিকেশনের পর আপনার জন্য <strong>পেমেন্ট টাইমার (১০-১৫ মিনিট)</strong> উন্মুক্ত হবে।<br />
              ৩. টাইমার শেষ হওয়ার আগে পেমেন্ট সম্পন্ন করলে ডিজিটাল কনফার্ম টিকিট পাবেন।
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-xs border-slate-700 bg-slate-800 text-slate-300"
            >
              বন্ধ করুন
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                router.push(`/track/${createdBooking.bookingNumber}`);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              লাইভ স্ট্যাটাস ও টাইমার দেখুন
            </Button>
          </div>
        </div>
      ) : (
        /* Seat Selection & Booking Form Screen */
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                  ONLINE LIVE SEAT SELECTION
                </span>
                <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                  <Bus className="w-5 h-5 text-blue-400" />
                  {trip?.bus?.busName}
                  {trip?.tripCode && <span className="font-mono text-xs text-slate-400">({trip.tripCode})</span>}
                </h2>
              </div>
              <Badge variant={trip?.tripBusType === 'FEMALE' ? 'purple' : (trip?.tripBusType === 'MALE' ? 'primary' : 'default')} className="text-xs">
                {trip?.tripBusType === 'FEMALE' ? '🚺 মহিলা স্পেশাল বাস' : (trip?.tripBusType === 'MALE' ? '🚹 ছাত্র স্পেশাল বাস' : '🚌 মিক্সড বাস')}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2 font-medium">
              <div>📅 যাত্রা: <span className="text-white font-semibold">{formatDate(trip?.departureDate)}</span></div>
              <div>⏰ সময়: <span className="text-white font-semibold font-mono">{formatTime(trip?.departureTime)}</span></div>
              <div>📍 রুট: <span className="text-blue-300 font-semibold">{trip?.route?.origin} ➔ {trip?.route?.destination}</span></div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Authentic 2x2 Coach Frame */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col items-center shadow-lg">
              {/* Legend */}
              <div className="w-full flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-400 mb-3 pb-2.5 border-b border-slate-800 gap-2">
                <span>বাসের সিট ম্যাপ (Seat Matrix)</span>
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-700 border border-emerald-400"></span> ফাঁকা</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> সিলেক্টেড</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-700"></span> বুকড</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-pink-600"></span> ♀ নারী</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> ♂ পুরুষ</span>
                </div>
              </div>

              {/* Realistic Luxury Coach Outline */}
              <div className="w-full max-w-sm bg-slate-950 border-2 border-slate-800 rounded-3xl p-3.5 shadow-2xl space-y-3">
                {/* Windshield & Cabin */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-3 flex justify-between items-center text-xs text-white border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    🚪 প্রবেশদ্বার (Door)
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    FRONT CABIN
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                    ✇ চালক কেবিন
                  </div>
                </div>

                {/* Seats Grid */}
                <div className="space-y-2.5 py-1 max-h-[400px] overflow-y-auto pr-1">
                  {organizedRows.map(row => (
                    <div key={row.rowKey} className="flex justify-between items-center gap-2">
                      {/* Left Pair */}
                      <div className="flex gap-2">
                        {row.leftSeats.map(seat => renderSeatButton(seat))}
                        {row.leftSeats.length === 1 && <div className="w-13 h-14 sm:w-14 sm:h-15" />}
                      </div>

                      {/* Center Aisle with Row Letter */}
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-black text-slate-400 shadow-inner shrink-0">
                        {row.rowKey}
                      </div>

                      {/* Right Pair */}
                      <div className="flex gap-2">
                        {row.rightSeats.map(seat => renderSeatButton(seat))}
                        {row.rightSeats.length === 1 && <div className="w-13 h-14 sm:w-14 sm:h-15" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Back of bus indicator */}
                <div className="text-center pt-1 border-t border-slate-900">
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    REAR CABIN
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Booking Details & Passenger Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-6 space-y-4">
              {/* Selected Seats Summary Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">নির্বাচিত সিট:</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map(s => (
                        <span
                          key={s.seatId}
                          onClick={() => handleSeatClick(s)}
                          className="px-2 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/60 text-blue-300 font-mono font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-red-500/30 hover:border-red-500 hover:text-red-300 transition-colors"
                          title="সিট বাতিল করতে ক্লিক করুন"
                        >
                          {s.seatNumber} <X className="w-3 h-3" />
                        </span>
                      ))
                    ) : (
                      <span className="text-amber-400 text-xs font-medium">বাম থেকে সিট নির্বাচন করুন</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold">মোট প্রাক্কলিত ভাড়া:</span>
                  <span className="font-black text-emerald-400 text-base font-mono">
                    {formatCurrency(totalFare)}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    যাত্রীর পূর্ণ নাম (Full Name) *
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: মোঃ তানভীর আহমেদ"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white text-xs placeholder:text-slate-500 rounded-xl py-2.5"
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

                {/* Auto-suggested Name Card */}
                {suggestedPassenger && (
                  <div className="p-3 bg-blue-950/80 border border-blue-600/80 rounded-xl flex items-center justify-between gap-2 text-xs shadow-md animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider font-mono">
                          পূর্বের রেকর্ড পাওয়া গেছে
                        </div>
                        <div className="font-bold text-white text-xs mt-0.5">
                          {suggestedPassenger.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setContactName(suggestedPassenger.name);
                          if (suggestedPassenger.gender) setPassengerGender(suggestedPassenger.gender);
                          if (suggestedPassenger.admissionId) setStudentAdmissionId(suggestedPassenger.admissionId);
                          setSuggestedPassenger(null);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[3]" /> এই নাম নিন
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestedPassenger(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="বাতিল"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">লিঙ্গ (Gender) *</label>
                    <select
                      value={passengerGender}
                      onChange={e => setPassengerGender(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="MALE">ছাত্র / পুরুষ (Male)</option>
                      <option value="FEMALE">ছাত্রী / নারী (Female)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">ক্যাটাগরি *</label>
                    <select
                      value={isStudent ? 'STUDENT' : 'GUEST'}
                      onChange={e => setIsStudent(e.target.value === 'STUDENT')}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="STUDENT">ভর্তি পরীক্ষার্থী (Student)</option>
                      <option value="GUEST">অভিভাবক / সাধারণ যাত্রী</option>
                    </select>
                  </div>
                </div>

                {isStudent && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      ভর্তি রোল / ইউনিট আইডি (ঐচ্ছিক)
                    </label>
                    <Input
                      type="text"
                      placeholder="যেমন: RU-Unit-A-10284"
                      value={studentAdmissionId}
                      onChange={e => setStudentAdmissionId(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white text-xs placeholder:text-slate-500 rounded-xl py-2.5"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    কোথায় উঠবেন / বোর্ডিং পয়েন্ট (ঐচ্ছিক)
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: গাবতলী কাউন্টার / সাভার ওভারব্রিজ"
                    value={boardingPoint}
                    onChange={e => setBoardingPoint(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white text-xs placeholder:text-slate-500 rounded-xl py-2.5"
                  />
                </div>
              </div>

              {/* Policy note */}
              <p className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                🔒 <strong>পেমেন্ট সংক্রান্ত তথ্য:</strong> প্রি-বুকিং রিকোয়েস্ট জমা দেওয়ার পর আমাদের কল সেন্টার প্রতিনিধি আপনার সাথে যোগাযোগ করে সিট ও ভেরিফিকেশন নিশ্চিত করবেন এবং আপনার জন্য পেমেন্ট টাইমার উন্মুক্ত হবে।
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={selectedSeatIds.length === 0 || isSubmitting}
                isLoading={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 text-xs py-3.5 rounded-xl cursor-pointer"
              >
                বুকিং অনুরোধ জমা দিন ({selectedSeatIds.length} টি সিট)
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}
