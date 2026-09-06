'use client';

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  initialBookings: any[];
}

export function SeatShiftClient({ initialBookings }: Props) {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedOldSeat, setSelectedOldSeat] = useState<string>('');
  const [targetSeat, setTargetSeat] = useState<string>('');
  const [shiftReason, setShiftReason] = useState('যাত্রীর অনুরোধ / জানালার পাশের আসন পছন্দ');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available seats for swapping simulation
  const availableSeats = ['A3', 'A4', 'B1', 'B3', 'C2', 'C4', 'D1', 'D3', 'E2', 'F1', 'G3'];

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return initialBookings.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return initialBookings.filter((b) => {
      const bNum = (b.booking_number || b.bookingNumber || '').toLowerCase();
      const name = (b.contact_name || b.contactName || b.passengers?.[0]?.passenger_name || b.passengers?.[0]?.passengerName || '').toLowerCase();
      const phone = (b.contact_phone || b.contactPhone || b.passengers?.[0]?.passenger_phone || b.passengers?.[0]?.passengerPhone || '').toLowerCase();
      return bNum.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [initialBookings, searchQuery]);

  const handleExecuteShift = async () => {
    if (!selectedBooking || !selectedOldSeat || !targetSeat) {
      setStatusMessage({
        type: 'error',
        text: language === 'bn' ? 'দয়া করে বর্তমান আসন এবং নতুন পছন্দসই আসন নির্বাচন করুন।' : 'Please select both current seat and target seat.'
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // Simulate real-time seat swap update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const bNum = selectedBooking.booking_number || selectedBooking.bookingNumber;
      setStatusMessage({
        type: 'success',
        text: language === 'bn'
          ? `সফলভাবে টিকিট #${bNum}-এর আসন [${selectedOldSeat}] থেকে [${targetSeat}]-এ পরিবর্তন করা হয়েছে!`
          : `Seat successfully shifted from [${selectedOldSeat}] to [${targetSeat}] for booking #${bNum}!`
      });

      // Update local state
      setSelectedBooking((prev: any) => {
        if (!prev) return null;
        const updatedSeats = (prev.seats || []).map((s: any) => {
          const sNum = s.seat_number || s.seatNumber || s.seat_id;
          if (sNum === selectedOldSeat) {
            return { ...s, seat_number: targetSeat, seatNumber: targetSeat };
          }
          return s;
        });
        return { ...prev, seats: updatedSeats };
      });

      setSelectedOldSeat('');
      setTargetSeat('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to shift seat.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'সিট শিফট বা আসন পরিবর্তন টুল' : 'Seat Shift & Swap Console'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'টিকিট বাতিল না করে যাত্রীর আসন এক সিট থেকে অন্য সিটে বা বিকল্প বাসে দ্রুত স্থানান্তর করুন'
              : 'Swap or transfer passenger seats directly without cancelling the original booking'}
          </p>
        </div>

        <Link href="/bookings">
          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs">
            {language === 'bn' ? 'সব বুকিং তালিকা' : 'Back to Bookings'}
          </Button>
        </Link>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Select Booking */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                {language === 'bn' ? '১. বুকিং খুঁজুন ও সিলেক্ট করুন' : '1. Search & Select Booking'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'টিকিট নং, মোবাইল বা নাম...' : 'Search by ticket #, mobile or name...'}
                  className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-6">কোনো বুকিং পাওয়া যায়নি।</p>
                ) : (
                  searchResults.map((b) => {
                    const bNum = b.booking_number || b.bookingNumber || 'BK-2026';
                    const name = b.contact_name || b.contactName || b.passengers?.[0]?.passenger_name || 'Passenger';
                    const phone = b.contact_phone || b.contactPhone || '—';
                    const seats = (b.seats || []).map((s: any) => s.seat_number || s.seatNumber || s.seat_id).join(', ');
                    const isSelected = selectedBooking?.id === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b);
                          setSelectedOldSeat((b.seats || [])[0]?.seat_number || (b.seats || [])[0]?.seatNumber || '');
                          setTargetSeat('');
                          setStatusMessage(null);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                            {bNum}
                          </span>
                          <Badge variant="primary" className="text-[10px] font-bold">
                            সিট: {seats || '—'}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{phone}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Swap Action Console */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? '২. আসন পরিবর্তন বা সোয়াপ কনসোল' : '2. Seat Shift & Swap Workbench'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedBooking ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <ArrowLeftRight className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold">
                    {language === 'bn'
                      ? 'বাম পাশের তালিকা থেকে একটি সক্রিয় বুকিং সিলেক্ট করুন'
                      : 'Select an active booking from the left list to begin swapping'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Booking Info */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600">
                        {selectedBooking.booking_number || selectedBooking.bookingNumber}
                      </span>
                      <Badge variant="success" className="text-[10px]">সক্রিয় বুকিং</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">যাত্রী:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedBooking.contact_name || selectedBooking.contactName || 'Student'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">বাস / রুট:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedBooking.trip?.bus?.busName || 'Express Coach'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step A: Select Which Seat to Move */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {language === 'bn' ? 'ক. বর্তমান কোন আসনটি পরিবর্তন করতে চান?' : 'A. Which current seat to shift?'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBooking.seats || []).map((s: any) => {
                        const sNum = s.seat_number || s.seatNumber || s.seat_id;
                        const isCurrent = selectedOldSeat === sNum;
                        return (
                          <button
                            key={sNum}
                            type="button"
                            onClick={() => setSelectedOldSeat(sNum)}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-black border transition-all ${
                              isCurrent
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-rose-400'
                            }`}
                          >
                            সিট {sNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step B: Select Target Available Seat */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {language === 'bn' ? 'খ. নতুন কোন ফাঁকা আসনে নিতে চান?' : 'B. Target available seat to assign:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSeats.map((seat) => {
                        const isTarget = targetSeat === seat;
                        return (
                          <button
                            key={seat}
                            type="button"
                            onClick={() => setTargetSeat(seat)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black border transition-all ${
                              isTarget
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                                : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                            }`}
                          >
                            {seat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step C: Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'bn' ? 'গ. পরিবর্তনের কারণ বা মন্তব্য:' : 'C. Reason / Note:'}
                    </label>
                    <input
                      type="text"
                      value={shiftReason}
                      onChange={(e) => setShiftReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Visual Swap Preview */}
                  {selectedOldSeat && targetSeat && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center justify-center gap-4">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">বর্তমান আসন</span>
                        <Badge variant="danger" className="text-xs font-mono font-black px-3 py-1">
                          {selectedOldSeat}
                        </Badge>
                      </div>
                      <ArrowRight className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 block font-bold">নতুন আসন</span>
                        <Badge variant="success" className="text-xs font-mono font-black px-3 py-1">
                          {targetSeat}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleExecuteShift}
                    disabled={isProcessing || !selectedOldSeat || !targetSeat}
                    className="w-full font-black rounded-2xl shadow-lg shadow-blue-500/20 py-3"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>পরিবর্তন হচ্ছে...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span>আসন স্থানান্তর নিশ্চিত করুন</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
