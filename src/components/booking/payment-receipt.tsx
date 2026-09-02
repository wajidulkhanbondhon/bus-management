'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer,
  CheckCircle2,
  Bus,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  ShieldCheck,
  X,
  BadgeCheck,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/lib/utils';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  BankTransferLogo,
  CashMoneyLogo
} from './payment-brand-icons';

export interface PaymentReceiptProps {
  booking: any;
  onClose?: () => void;
  onNewBooking?: () => void;
  showModalControls?: boolean;
}

export function PaymentReceiptCard({ booking }: { booking: any }) {
  if (!booking) return null;

  const passengers = booking.passengers || [];
  const primaryPassenger = passengers[0] || {
    passengerName: booking.contactName || 'সম্মানিত যাত্রী',
    passengerPhone: booking.contactPhone || '—',
    passengerType: booking.isStudent ? 'STUDENT' : 'GUEST',
    gender: booking.passengerGender || 'MALE'
  };

  const trip = booking.trip || {};
  const bus = trip.bus || {};
  const route = trip.route || {};
  const payments = booking.payments || [];
  const primaryPayment = payments[0] || {};
  const transactions = primaryPayment.transactions || [];
  const primaryTx = transactions[0] || {};

  const grossAmount = booking.grossAmount || booking.gross_amount || (passengers.length * (trip.basePrice || 550));
  const discountAmount = booking.discountAmount || booking.discount_amount || 0;
  const netAmount = booking.netAmount || booking.net_amount || (grossAmount - discountAmount);
  const paidAmount = booking.paidAmount !== undefined ? booking.paidAmount : (booking.paid_amount !== undefined ? booking.paid_amount : netAmount);
  const dueAmount = booking.dueAmount !== undefined ? booking.dueAmount : (booking.due_amount !== undefined ? booking.due_amount : Math.max(0, netAmount - paidAmount));
  const isPaidInFull = dueAmount <= 0;

  const receiptNumber = primaryPayment.receiptNumber || primaryPayment.receipt_number || `RCT-${booking.bookingNumber ? booking.bookingNumber.replace('BK-', '') : '20260828-001'}`;
  const bookingNumber = booking.bookingNumber || booking.booking_number || 'BK-20260828-XXXX';
  const paymentMethod = primaryPayment.method || booking.paymentMethod || 'BKASH';
  const trxId = primaryTx.transactionId || primaryTx.transaction_id || primaryPayment.transactionId || booking.transactionId || booking.senderReference || 'OFFICE-CASH-VERIFIED';

  const busType = trip.tripBusType || bus.busType || bus.bus_type || 'MIXED';

  return (
    <div
      id="printable-payment-receipt"
      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:bg-white print:text-black"
    >
      {/* Top Ornamental Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 relative overflow-hidden print:bg-slate-900 print:text-white">
        {/* Background Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Bus className="w-64 h-64 text-white -rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Brand & Organization Title */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block font-mono">
                  ভর্তি পরীক্ষা বিশেষ পরিবহন সেবা • ২০২৬
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  অফিসিয়াল পেমেন্ট রসিদ ও টিকিট ইনভয়েস
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-medium pl-11">
              Central University Admission Express Transit Services Desk
            </p>
          </div>

          {/* Receipt Number Badge & Verification */}
          <div className="sm:text-right font-mono bg-white/10 dark:bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
            <div className="text-[10px] text-blue-300 uppercase tracking-wider font-bold">
              মানি রিসিট নং (Receipt No)
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-wider">
              {receiptNumber}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center sm:justify-end gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span suppressHydrationWarning>{formatDateTime(booking.createdAt || new Date())}</span>
            </div>
          </div>
        </div>

        {/* Status Bar inside Header */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400">বুকিং রেফারেন্স:</span>
            <span className="font-bold text-white bg-blue-600/60 px-2.5 py-0.5 rounded-lg border border-blue-400/40">
              {bookingNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm ${
                isPaidInFull
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              <BadgeCheck className="w-4 h-4" />
              {isPaidInFull ? '✓ পরিশোধিত (PAID IN FULL)' : '⚠️ আংশিক পরিশোধিত (PARTIAL)'}
            </span>
          </div>
        </div>
      </div>

      {/* Perforated Divider Ticket Notch */}
      <div className="relative h-6 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between px-4 border-y border-dashed border-slate-300 dark:border-slate-700 print:bg-slate-100">
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-950 -ml-6" />
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          ✂ OFFICIAL PASSENGER TRANSIT MONEY RECEIPT ✂
        </span>
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-950 -mr-6" />
      </div>

      {/* Main Receipt Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* 1. Trip & Schedule Highlight Card */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                যাত্রার রুট ও গন্তব্য (Route)
              </span>
              <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{route.routeName || 'ঢাকা ➔ বিশ্ববিদ্যালয় রুট'}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 pl-5.5 block">
                {route.origin || 'ঢাকা কাউন্টার'} ➔ {route.destination || 'টার্গেট বিশ্ববিদ্যালয় মেইন গেট'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                যাত্রা শুরুর সময় (Departure Schedule)
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{formatDate(trip.departureDate)}</span>
              </div>
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pl-5.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(trip.departureTime)} (বাংলাদেশ সময়)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                বাস ও কোচের বিবরণ (Bus Details)
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{bus.busName || trip.busName || 'Express Coach'}</span>
              </div>
              <div className="flex items-center gap-2 pl-5.5">
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">
                  {bus.busNumber || 'কোচ নং'}
                </span>
                <Badge
                  variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'}
                  className="text-[10px] font-bold"
                >
                  {busType === 'FEMALE' ? 'মহিলা স্পেশাল' : busType === 'MALE' ? 'ছাত্র স্পেশাল' : 'মিক্সড বাস'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Boarding Point, Dropping Point & Journey Direction Strip */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-base">🚌</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">যাত্রার ধরণ:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.journeyType === 'OUTBOUND_ONLY' || booking.journey_type === 'OUTBOUND_ONLY'
                    ? '➡️ শুধুমাত্র যাওয়া (One-way Going)'
                    : booking.journeyType === 'RETURN_ONLY' || booking.journey_type === 'RETURN_ONLY'
                    ? '⬅️ শুধুমাত্র আসা (One-way Return)'
                    : booking.journeyType === 'ASYMMETRIC' || booking.journey_type === 'ASYMMETRIC'
                    ? '👥 অভিভাবক সহ স্প্লিট'
                    : '🚌 উভয়মুখী (যাওয়া ও আসা)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-base">📍</span>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">ওঠার স্থান (Boarding):</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 truncate block">
                  {booking.boardingPoint || booking.boarding_point || 'কাউন্টার নির্ধারিত'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-base">🎯</span>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">নামার স্থান (Dropping):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                  {booking.droppingPoint || booking.dropping_point || 'বিশ্ববিদ্যালয় মেইন গেট'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Passenger & Seat Allocation Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>যাত্রীদের তালিকা ও বরাদ্দকৃত আসন (Passenger & Seat Allotment)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-md">
              মোট {passengers.length || 1} টি সিট
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">সিট নম্বর</th>
                  <th className="px-4 py-3">যাত্রীর নাম</th>
                  <th className="px-4 py-3">মোবাইল নম্বর</th>
                  <th className="px-4 py-3">ক্যাটাগরি ও লিঙ্গ</th>
                  <th className="px-4 py-3">ভর্তি রোল / আইডি</th>
                  <th className="px-4 py-3 text-right">ভাড়ার হার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {passengers.map((p: any, idx: number) => {
                  const sLabel = p.seatNumber || p.seat?.seatNumber || `Seat ${idx + 1}`;
                  const sFare = p.fareSnapshot || booking.seats?.[idx]?.fareSnapshot || trip.basePrice || 550;
                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          {sLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {p.passengerName || booking.contactName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-bold">
                        {p.passengerPhone || booking.contactPhone}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="primary" className="text-[10px]">
                            {p.passengerType === 'STUDENT' ? 'শিক্ষার্থী' : p.passengerType === 'GUARDIAN' ? 'অভিভাবক' : 'যাত্রী'}
                          </Badge>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            ({p.gender === 'FEMALE' ? 'নারী' : 'পুরুষ'})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {p.admissionId || p.student?.admissionId || booking.studentAdmissionId || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(sFare)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Financial Settlement & Payment Channel Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Payment Method & Transaction Verification */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              পেমেন্ট চ্যানেল ও ট্রানজেকশন বিবরণ (Payment Verification)
            </span>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {paymentMethod === 'BKASH' ? (
                  <BkashLogo className="w-8 h-8" />
                ) : paymentMethod === 'NAGAD' ? (
                  <NagadLogo className="w-8 h-8" />
                ) : paymentMethod === 'ROCKET' ? (
                  <RocketLogo className="w-8 h-8" />
                ) : paymentMethod === 'HAND_CASH' ? (
                  <CashMoneyLogo className="w-8 h-8" />
                ) : (
                  <BankTransferLogo className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {paymentMethod === 'BKASH'
                    ? 'বিকাশ মোবাইল ব্যাংকিং (bKash)'
                    : paymentMethod === 'NAGAD'
                    ? 'নগদ ডিজিটাল পেমেন্ট (Nagad)'
                    : paymentMethod === 'ROCKET'
                    ? 'রকেট ডিবিবিএল (Rocket DBBL)'
                    : paymentMethod === 'HAND_CASH'
                    ? 'কাউন্টার সরাসরি নগদ ক্যাশ (Hand Cash)'
                    : 'ব্যাংক ট্রান্সফার / কার্ড (Bank Deposit)'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  স্ট্যাটাস: <strong className="text-emerald-600 dark:text-emerald-400">ভেরিফাইড ও নিশ্চিত</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">ট্রানজেকশন আইডি (TrxID):</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">বুকিং ইস্যু কাউন্টার:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">সেন্ট্রাল অ্যাডমিশন হেল্পডেস্ক</span>
              </div>
              {primaryPassenger.passengerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">কনফার্মেশন এসএমএস প্রাপক:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{primaryPassenger.passengerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Money Breakdown Summary */}
          <div className="p-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-slate-800 dark:to-slate-850 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 font-mono block">
              ভাড়ার বিস্তারিত হিসাব (Fare Computation)
            </span>

            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>মোট সিট ভাড়া ({passengers.length}টি আসন):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(grossAmount)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>অনুমোদিত ছাড় / কুপন:</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold pt-1.5 border-t border-blue-200 dark:border-slate-700">
                <span>সর্বমোট প্রদেয় ভাড়া (Net Total):</span>
                <span className="font-mono font-black text-sm">{formatCurrency(netAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold pt-1 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  পরিশোধিত টাকা (Paid Amount):
                </span>
                <span className="font-mono font-black text-base">{formatCurrency(paidAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-bold pt-0.5">
                <span>অবশিষ্ট বকেয়া (Due Balance):</span>
                <span className={`font-mono ${dueAmount > 0 ? 'text-rose-600 font-black text-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                  {formatCurrency(dueAmount)} {dueAmount <= 0 ? '(সম্পূর্ণ পরিশোধিত)' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Terms, Passenger Guidelines & Official Stamp */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          {/* Passenger Notice */}
          <div className="space-y-1 max-w-lg text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            <p>
              🔒 <strong>যাত্রীদের জন্য গুরুত্বপূর্ণ নির্দেশনা:</strong>
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>বাস ছাড়ার অন্তত ৩০ মিনিট পূর্বে নির্ধারিত কাউন্টার/বোর্ডিং পয়েন্টে উপস্থিত থাকতে হবে।</li>
              <li>যাত্রাকালে এই ডিজিটাল রিসিট অথবা এসএমএস কন্ডাক্টর/সুপারভাইজারকে প্রদর্শন করুন।</li>
              <li>জরুরি যেকোনো সহায়তার জন্য হেল্পলাইন নম্বরে যোগাযোগ করুন।</li>
            </ul>
          </div>

          {/* Official Verification Seal Mockup */}
          <div className="shrink-0 text-center p-3 rounded-2xl border-2 border-dashed border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-mono space-y-0.5 select-none rotate-1">
            <div className="flex items-center justify-center gap-1 font-black text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OFFICIALLY VERIFIED</span>
            </div>
            <div className="text-[10px] font-bold tracking-wider">CENTRAL DESK SEAL</div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
              SEATS LOCKED & CONFIRMED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentReceiptModal({
  booking,
  isOpen,
  onClose,
  onNewBooking
}: {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onNewBooking?: () => void;
}) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Top Floating Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                পেমেন্ট সফল ও সিট বুকিং নিশ্চিত হয়েছে!
              </h2>
              <p className="text-[11px] text-slate-400">
                আপনার অফিসিয়াল পেমেন্ট রসিদ তৈরি হয়েছে। নিচে প্রিন্ট বা সেভ করতে পারেন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 font-black text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              রসিদ প্রিন্ট করুন
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
          <PaymentReceiptCard booking={booking} />
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              বুকিং ট্র্যাকিং: <strong>{booking.bookingNumber || booking.booking_number}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNewBooking ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewBooking}
                className="font-bold text-xs rounded-xl cursor-pointer"
              >
                + নতুন বুকিং করুন
              </Button>
            ) : (
              <Link href="/bookings/new">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs rounded-xl cursor-pointer"
                >
                  + নতুন বুকিং করুন
                </Button>
              </Link>
            )}

            <Link href={`/bookings/${booking.id}`}>
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                বুকিং বিস্তারিত দেখুন ➔
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
