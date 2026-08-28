'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Bus,
  PhoneCall,
  MapPin,
  Calendar,
  CreditCard,
  Printer,
  Flame,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { trackBookingAction } from '@/actions/booking.actions';
import { PrintTicketButton } from './print-ticket-button';
import { PaymentReceiptModal } from './payment-receipt';

interface Props {
  initialBooking: any;
}

export function LiveBookingTrackerClient({ initialBooking }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(initialBooking);
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Poll / Refresh status periodically
  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await trackBookingAction(booking.bookingNumber);
      if (res.success && res.booking) {
        setBooking(res.booking);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Timer calculation
  useEffect(() => {
    if (booking.bookingStatus !== 'PAYMENT_TIMER_ACTIVE' || !booking.paymentExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const expiry = new Date(booking.paymentExpiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        setIsExpired(true);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [booking.bookingStatus, booking.paymentExpiresAt]);

  // Periodic polling every 8 seconds if pending or timer active
  useEffect(() => {
    if (['PRE_BOOKED', 'PAYMENT_TIMER_ACTIVE'].includes(booking.bookingStatus)) {
      const interval = setInterval(refreshStatus, 8000);
      return () => clearInterval(interval);
    }
  }, [booking.bookingStatus]);

  const isConfirmed = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED';
  const isTimerActive = booking.bookingStatus === 'PAYMENT_TIMER_ACTIVE' && !isExpired;
  const isPendingCall = booking.bookingStatus === 'PRE_BOOKED';
  const isFailed = booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'EXPIRED' || (isExpired && !isConfirmed);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-blue-400 font-mono uppercase tracking-wider block">
            LIVE BOOKING TELEMETRY & STATUS
          </span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            বুকিং ট্র্যাকিং
            <span className="font-mono text-blue-400 font-bold">#{booking.bookingNumber}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            isLoading={isRefreshing}
            className="text-xs border-slate-700 bg-slate-800 text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            রিফ্রেশ
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs border-slate-700 bg-slate-800 text-slate-300">
              হোমে যান
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <Card className={`border shadow-2xl transition-all ${
        isConfirmed
          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
          : isTimerActive
          ? 'bg-amber-950/40 border-amber-800/80 text-amber-100'
          : isPendingCall
          ? 'bg-blue-950/40 border-blue-800/80 text-blue-100'
          : 'bg-rose-950/40 border-rose-800/80 text-rose-100'
      }`}>
        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          {/* Status Badge & Icon */}
          <div>
            {isConfirmed ? (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <Badge variant="success" className="text-xs px-3 py-1 font-bold">
                  বুকিং সফলভাবে কনফার্ম হয়েছে (CONFIRMED)
                </Badge>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  আপনার পেমেন্ট ভেরিফাই হয়েছে এবং আসন নিশ্চিত করা হয়েছে। যাত্রা শুরুর পূর্বে ডিজিটাল টিকিটটি সাথে রাখুন।
                </p>
              </div>
            ) : isTimerActive ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
                  <Flame className="w-8 h-8 animate-pulse" />
                </div>
                <Badge variant="warning" className="text-xs px-3 py-1 font-bold">
                  ভেরিফাইড - সিট লক ও পেমেন্ট টাইমার সক্রিয়
                </Badge>

                {/* Live Countdown Display */}
                <div className="py-2">
                  <span className="text-xs text-slate-400 block font-semibold">পেমেন্ট করার বাকি সময়:</span>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-wider flex items-center justify-center gap-2 mt-1">
                    <span>{String(timeLeft?.minutes || 0).padStart(2, '0')}</span>
                    <span className="animate-pulse">:</span>
                    <span>{String(timeLeft?.seconds || 0).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
                    🔒 এই সময়ের মধ্যে সিটটি শুধুমাত্র আপনার জন্য এক্সক্লুসিভ লক থাকবে।
                  </span>
                </div>
              </div>
            ) : isPendingCall ? (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto ring-8 ring-blue-500/10 animate-pulse">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <Badge variant="info" className="text-xs px-3 py-1 font-bold">
                  অফিস ভেরিফিকেশন কলের অপেক্ষায় (PENDING CALL)
                </Badge>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  আমাদের প্রতিনিধি কিছুক্ষণের মধ্যে <span className="font-bold text-white font-mono">{booking.contactPhone}</span> নম্বরে ফোন করে আপনার তথ্য ও সিট যাচাই করবেন। কল গ্রহণের পর আপনার জন্য পেমেন্ট টাইমার চালু হবে।
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-500/10">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <Badge variant="danger" className="text-xs px-3 py-1 font-bold">
                  বুকিং বাতিল / সময়সীমা উত্তীর্ণ (EXPIRED / CANCELLED)
                </Badge>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  নির্ধারিত সময়ের মধ্যে পেমেন্ট সম্পন্ন না হওয়ায় অথবা ভেরিফিকেশন বাতিল হওয়ায় সিটটি পুনরায় উন্মুক্ত করা হয়েছে।
                </p>
              </div>
            )}
          </div>

          {/* Action Trigger in Status Card */}
          {isConfirmed && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsReceiptModalOpen(true)}
                className="font-bold text-xs bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                অফিসিয়াল পেমেন্ট রসিদ দেখুন ও প্রিন্ট করুন
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions Box (When Timer is Active) */}
      {isTimerActive && (
        <Card className="bg-slate-900 border-amber-700/60 shadow-xl">
          <CardHeader className="pb-2 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              পেমেন্ট নির্দেশিকা (Payment Instructions)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  বিকাশ মার্চেন্ট / পার্সোনাল
                </span>
                <div className="space-y-1 text-slate-300 font-mono text-[13px]">
                  <div>নম্বর: <strong className="text-white">01711000001</strong></div>
                  <div>অ্যামাউন্ট: <strong className="text-emerald-400">{formatCurrency(booking.netAmount)}</strong></div>
                  <div>রেফারেন্স: <strong className="text-blue-400">{booking.bookingNumber.slice(-5)}</strong></div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  নগদ / রকেট
                </span>
                <div className="space-y-1 text-slate-300 font-mono text-[13px]">
                  <div>নম্বর: <strong className="text-white">01811000002</strong></div>
                  <div>অ্যামাউন্ট: <strong className="text-emerald-400">{formatCurrency(booking.netAmount)}</strong></div>
                  <div>রেফারেন্স: <strong className="text-blue-400">{booking.bookingNumber.slice(-5)}</strong></div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              💡 <strong>পরামর্শ:</strong> টাকা পাঠানোর পর আপনার ট্রানজেকশন আইডি (TrxID) কল সেন্টারের প্রতিনিধিকে জানান অথবা সরাসরি কাউন্টারে ক্যাশ প্রদান করে কনফার্ম করুন।
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Bus className="w-4 h-4 text-blue-400" />
            বুকিং ও যাত্রীর তথ্যাদি (Passenger & Trip Details)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">যাত্রীর নাম:</span>
                <span className="font-bold text-white">{booking.contactName || booking.passengers?.[0]?.passengerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">মোবাইল নম্বর:</span>
                <span className="font-mono font-bold text-white">{booking.contactPhone || booking.passengers?.[0]?.passengerPhone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">লিঙ্গ / ক্যাটাগরি:</span>
                <span className="font-medium text-slate-200">
                  {booking.passengerGender === 'MALE' ? 'ছাত্র / পুরুষ' : 'ছাত্রী / মহিলা'} ({booking.isStudent ? 'ভর্তি শিক্ষার্থী' : 'সাধারণ যাত্রী'})
                </span>
              </div>
              {booking.studentAdmissionId && (
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">ভর্তি রোল:</span>
                  <span className="font-mono text-blue-400 font-bold">{booking.studentAdmissionId}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">বাস ও ট্রিপ:</span>
                <span className="font-bold text-white">{booking.trip?.bus?.busName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">রুট:</span>
                <span className="font-medium text-slate-200">{booking.trip?.route?.origin} ➔ {booking.trip?.route?.destination}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">তারিখ ও সময়:</span>
                <span className="font-medium text-slate-200">{formatDate(booking.trip?.departureDate)} - {formatTime(booking.trip?.departureTime)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">নির্বাচিত আসন (Seats):</span>
                <span className="font-mono font-black text-blue-400">
                  {booking.seats?.map((s: any) => s.seat?.seatNumber || 'Seat').join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-300">মোট প্রদেয় ভাড়া:</span>
            <span className="font-mono font-black text-emerald-400 text-base">
              {formatCurrency(booking.netAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Official Payment Receipt Modal */}
      {isReceiptModalOpen && (
        <PaymentReceiptModal
          isOpen={isReceiptModalOpen}
          booking={booking}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
