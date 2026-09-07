'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingSummarySidebar, SelectedSeatItem } from './booking-summary-sidebar';
import { PaymentReceiptModal } from './payment-receipt';
import { createBookingAction } from '@/actions/booking.actions';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  trips: any[];
  currentUser?: any;
}

export function QuickCounterBookingClient({ trips, currentUser }: Props) {
  const { language } = useApp();
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [tripSeats, setTripSeats] = useState<any[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Form states
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerGender, setPassengerGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [paymentMethod, setPaymentMethod] = useState('HAND_CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success modal
  const [confirmedBookingData, setConfirmedBookingData] = useState<any | null>(null);
  const [processingFee, setProcessingFee] = useState<number>(0);
  const [vatTaxAmount, setVatTaxAmount] = useState<number>(0);
  const { success: toastSuccess, error: toastError } = useToast();

  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || trips[0];
  }, [trips, selectedTripId]);

  // Fetch live seat inventory when selected trip changes
  const fetchLiveSeats = useCallback(async (tId: string) => {
    if (!tId) return;
    setIsLoadingSeats(true);
    setSelectedSeatIds([]);
    try {
      const res = await fetch(`/api/backend/inventory/${tId}/seat-map`);
      if (res.ok) {
        const data = await res.json();
        setTripSeats(data.seats || []);
      } else {
        setTripSeats([]);
      }
    } catch {
      setTripSeats([]);
    } finally {
      setIsLoadingSeats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTrip?.id) {
      fetchLiveSeats(activeTrip.id);
    }
  }, [activeTrip?.id, fetchLiveSeats]);

  const filteredTrips = useMemo(() => {
    if (!busSearchQuery) return trips;
    const q = busSearchQuery.toLowerCase();
    return trips.filter((t) => {
      const bNum = (t.bus?.busNumber || t.bus?.bus_number || '').toLowerCase();
      const bName = (t.bus?.busName || t.bus?.bus_name || '').toLowerCase();
      const route = (t.route?.routeName || t.route?.route_name || '').toLowerCase();
      const dest = (t.targetUniversity || t.route?.destination || '').toLowerCase();
      return bNum.includes(q) || bName.includes(q) || route.includes(q) || dest.includes(q);
    });
  }, [trips, busSearchQuery]);

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

  const selectedSeatItems: SelectedSeatItem[] = useMemo(() => {
    return selectedSeatIds.map((id) => {
      const found = tripSeats.find((s) => s.seat_id === id || s.seatId === id);
      const sNum = found?.seat_number || found?.seatNumber || id.split('-').pop() || 'Seat';
      const fare = found?.fare || activeTrip?.basePrice || 550;
      return {
        seatId: id,
        seatNumber: sNum,
        fare,
        genderAllowed: found?.gender_allowed || found?.genderAllowed || 'ANY'
      };
    });
  }, [selectedSeatIds, tripSeats, activeTrip]);

  const grossAmount = useMemo(() => {
    return selectedSeatItems.reduce((acc, s) => acc + s.fare, 0);
  }, [selectedSeatItems]);

  const netAmount = grossAmount + processingFee + vatTaxAmount;

  useEffect(() => {
    setPaidAmount(netAmount);
  }, [netAmount]);

  const handleConfirmBooking = async () => {
    if (selectedSeatIds.length === 0) return;
    if (!passengerPhone || passengerPhone.length < 11) {
      alert(language === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter valid 11-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tripId: activeTrip.id,
        seats: selectedSeatItems.map((s) => ({
          seat_id: s.seatId,
          seatId: s.seatId,
          fare: s.fare,
          seat_number: s.seatNumber
        })),
        passengers: selectedSeatItems.map((s) => ({
          passenger_name: passengerName || 'Counter Passenger',
          passengerName: passengerName || 'Counter Passenger',
          passenger_phone: passengerPhone,
          passengerPhone: passengerPhone,
          seat_id: s.seatId,
          seatId: s.seatId,
          seat_number: s.seatNumber,
          gender: passengerGender,
          passenger_type: 'STUDENT',
          is_student: true
        })),
        contact_name: passengerName || 'Counter Passenger',
        contact_phone: passengerPhone,
        journey_type: 'ROUND_TRIP',
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        processing_fee: processingFee,
        vat_amount: vatTaxAmount,
        notes: `Quick Counter Booking by ${currentUser?.name || 'Staff'}`
      };

      const result = await createBookingAction(payload as any);
      if (result.success && result.booking) {
        toastSuccess(
          language === 'bn'
            ? `🎉 টিকিট বুকিং সফল হয়েছে! ট্র্যাকিং কোড: ${result.booking.bookingNumber}`
            : `🎉 Booking confirmed successfully! Code: ${result.booking.bookingNumber}`
        );
        setConfirmedBookingData({
          ...result.booking,
          processingFee,
          vatAmount: vatTaxAmount,
          netAmount
        });
        fetchLiveSeats(activeTrip.id);
        setSelectedSeatIds([]);
        setPassengerName('');
        setPassengerPhone('');
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

  const totalSeatsCount = tripSeats.length || 45;
  const bookedSeatsCount = tripSeats.filter((s) => s.status === 'BOOKED').length;
  const availableSeatsCount = Math.max(0, totalSeatsCount - bookedSeatsCount);

  // Helper to render ergonomic seat button matching interactive-seat-map
  const renderSeatButton = (sNum: string, isWindow: boolean) => {
    const seatObj = tripSeats.find((s) => (s.seat_number || s.seatNumber) === sNum);
    const isBooked = seatObj?.status === 'BOOKED';
    const isSelected = selectedSeatIds.includes(seatObj?.seat_id || seatObj?.seatId || sNum);
    const seatPrice = seatObj?.fare || activeTrip?.basePrice || 550;
    const isFemaleOnly = seatObj?.gender_allowed === 'FEMALE_ONLY' || seatObj?.genderAllowed === 'FEMALE_ONLY';
    const isMaleOnly = seatObj?.gender_allowed === 'MALE_ONLY' || seatObj?.genderAllowed === 'MALE_ONLY';

    return (
      <button
        key={sNum}
        type="button"
        disabled={isBooked}
        onClick={() => handleToggleSeat(seatObj?.seat_id || seatObj?.seatId || sNum, seatObj?.status || 'AVAILABLE')}
        title={`সিট: ${sNum} ${isWindow ? '• জানালা (Window)' : ''} | ভাড়া: ৳${seatPrice}`}
        className={`w-12 h-14 sm:w-14 sm:h-15 shrink-0 p-1 rounded-2xl flex flex-col items-center justify-between font-black transition-all duration-150 select-none cursor-pointer relative ${
          isSelected
            ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white border-2 border-blue-400 shadow-lg shadow-blue-600/30 scale-105 z-10 ring-4 ring-blue-500/30'
            : isBooked
            ? 'bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 dark:from-rose-950/70 dark:to-rose-900/70 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-700 opacity-70 cursor-not-allowed'
            : isFemaleOnly
            ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/60 dark:to-pink-900/60 text-pink-950 dark:text-pink-200 border-2 border-pink-400 dark:border-pink-600 hover:border-pink-500 shadow-xs'
            : isMaleOnly
            ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-xs hover:border-blue-500'
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-xs hover:border-blue-500 hover:shadow-md'
        }`}
      >
        {/* Ergonomic Headrest Cushion */}
        <div
          className={`w-8 h-1 rounded-full shadow-inner transition-all ${
            isSelected
              ? 'bg-white/95 shadow-white/40'
              : isBooked
              ? 'bg-rose-400'
              : isFemaleOnly
              ? 'bg-pink-500'
              : isMaleOnly
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Crisp Seat Number & Window Indicator */}
        <div className="flex items-center justify-center gap-0.5 my-auto">
          <span className={`text-xs sm:text-sm font-black tracking-tight leading-none font-mono ${isSelected ? 'text-white' : ''}`}>
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
          className={`w-full flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded-md backdrop-blur-xs transition-colors ${
            isSelected
              ? 'bg-black/30 text-white'
              : 'bg-black/5 dark:bg-white/10'
          }`}
        >
          {isSelected ? (
            <span className="text-[9px] font-black font-mono leading-none tracking-tight flex items-center gap-0.5 text-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> ৳{seatPrice}
            </span>
          ) : isBooked ? (
            <span className="text-[8px] font-black text-rose-700 dark:text-rose-300 leading-none">
              বুকড
            </span>
          ) : (
            <span className="text-[9px] font-black font-mono leading-none tracking-tight">
              ৳{seatPrice}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div suppressHydrationWarning className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-md">
                Fast Counter Mode
              </span>
              <Badge variant="default" className="bg-amber-400 text-slate-950 font-black text-xs">
                {language === 'bn' ? '৩০ সেকেন্ড কুইক বুকিং' : '30-Sec Booking'}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'কুইক কাউন্টার টিকিট বুকিং' : 'Rapid Counter Seat Booking'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/bookings/new">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold text-xs">
              {language === 'bn' ? 'উইজার্ড মোড ➔' : 'Full Wizard ➔'}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveSeats(activeTrip?.id)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Success Notification Alert Banner if booking confirmed */}
      {confirmedBookingData && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base">
                {language === 'bn' ? '🎉 বুকিং সফলভাবে নিশ্চিত হয়েছে!' : '🎉 Booking Confirmed Successfully!'}
              </div>
              <div className="text-xs text-emerald-100 font-mono">
                {language === 'bn' ? 'বুকিং নম্বর:' : 'Booking Number:'} <strong>{confirmedBookingData.bookingNumber}</strong>
                {confirmedBookingData.passengers && confirmedBookingData.passengers.length > 0 && (
                  <span> • {language === 'bn' ? 'সিট:' : 'Seats:'} {confirmedBookingData.passengers.map((p: any) => p.seatNumber).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setConfirmedBookingData(confirmedBookingData)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-xs"
            >
              <Ticket className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? 'টিকিট ও চালান দেখুন' : 'View Ticket & Invoice'}
            </Button>
          </div>
        </div>
      )}

      {/* Trip / Bus Selector Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'বাস নম্বর, ক্যাম্পাস বা রুট খুঁজুন...' : 'Search bus, destination, route...'}
                value={busSearchQuery}
                onChange={(e) => setBusSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {filteredTrips.length} {language === 'bn' ? 'টি অ্যাক্টিভ বাস উপলব্ধ' : 'Active Buses Available'}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {filteredTrips.map((t) => {
              const isSelected = t.id === selectedTripId;
              const busNum = t.bus?.busNumber || t.bus?.bus_number || 'COACH';
              const uniName = t.targetUniversity || t.route?.destination || 'Campus';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTripId(t.id)}
                  className={`px-4 py-2.5 rounded-2xl text-left shrink-0 transition-all border-2 flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
                      : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                  }`}>
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs">{busNum}</span>
                      <span className="text-[10px] opacity-75">• ৳{t.basePrice || 550}</span>
                    </div>
                    <div className="text-[11px] font-bold truncate max-w-[140px] opacity-90">{uniName}</div>
                  </div>
                </button>
              );
            })}
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
              <div>
                <span className="text-xs font-mono font-black text-amber-400 bg-white/10 px-2 py-0.5 rounded">
                  {activeTrip?.bus?.busNumber || activeTrip?.tripCode}
                </span>
                <span className="font-bold text-sm ml-2 text-white">{activeTrip?.bus?.busName}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeTrip?.route?.routeName || `${activeTrip?.route?.origin} ➔ ${activeTrip?.route?.destination}`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">{availableSeatsCount} খালি</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400 font-bold">{bookedSeatsCount} বুকড</span>
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
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <span>🪟 জানালা (Window)</span>
              </div>
            </div>

            {/* Seat Grid Frame */}
            <CardContent className="p-6 bg-slate-100/60 dark:bg-slate-950/60 flex flex-col items-center justify-center min-h-[500px]">
              {isLoadingSeats ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>সিট ম্যাপ লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-xl w-full max-w-md">
                  {/* Cockpit / Driver Cabin Header */}
                  <div className="mb-4 pb-3 border-b-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-black shadow-xs">
                      <span>🚪</span>
                      <span>প্রবেশদ্বার (DOOR)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-black shadow-xs">
                      <span>✇</span>
                      <span>ড্রাইভার কেবিন (DRIVER)</span>
                    </div>
                  </div>

                  {/* Seat Rows Matrix */}
                  <div className="space-y-3">
                    {Array.from({ length: 11 }).map((_, r) => {
                      const rowChar = 'ABCDEFGHIJKLMN'[r] || `R${r + 1}`;
                      const isLastRow = r === 10;
                      return (
                        <div key={r} className="flex items-center justify-between gap-2">
                          {/* Left Seats: 1, 2 */}
                          <div className="flex items-center gap-2">
                            {renderSeatButton(`${rowChar}1`, true)}
                            {renderSeatButton(`${rowChar}2`, false)}
                          </div>

                          {/* Center Walkway / Aisle */}
                          <div className="w-8 text-center font-mono text-[11px] font-black text-slate-400 flex items-center justify-center">
                            {isLastRow ? (
                              renderSeatButton(`${rowChar}3`, false)
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
                                {rowChar}
                              </span>
                            )}
                          </div>

                          {/* Right Seats: 3, 4 (or 4, 5 on last row) */}
                          <div className="flex items-center gap-2">
                            {renderSeatButton(`${rowChar}${isLastRow ? 4 : 3}`, false)}
                            {renderSeatButton(`${rowChar}${isLastRow ? 5 : 4}`, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
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
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(m) => setPaymentMethod(m)}
            passengerName={passengerName}
            onPassengerNameChange={(val) => setPassengerName(val)}
            passengerPhone={passengerPhone}
            onPassengerPhoneChange={(val) => setPassengerPhone(val)}
            passengerGender={passengerGender}
            onPassengerGenderChange={(g) => setPassengerGender(g)}
            autoPrintTicket={autoPrintTicket}
            onAutoPrintTicketChange={(val) => setAutoPrintTicket(val)}
            onConfirmBooking={handleConfirmBooking}
            isSubmitting={isSubmitting}
            trip={activeTrip}
          />
        </div>
      </div>

      {/* Confirmation & Print Modal */}
      {confirmedBookingData && (
        <PaymentReceiptModal
          isOpen={true}
          onClose={() => setConfirmedBookingData(null)}
          booking={confirmedBookingData}
          autoPrint={autoPrintTicket}
        />
      )}
    </div>
  );
}
