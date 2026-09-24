'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Bus,
  User,
  CreditCard,
  Printer,
  Download,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Maximize2,
  Columns2,
  AlertTriangle,
  CheckCircle2,
  BadgeCheck,
  FileDown,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeView } from '@/components/common/qr-code';
import { formatCurrency } from '@/lib/utils';
import {
  PaymentReceipt,
  printReceiptElement,
  downloadReceiptAsPdf,
  downloadReceiptOfflineHtml,
  buildWhatsAppTicketMessage,
  cleanLocationName
} from './payment-receipt';

interface Props {
  booking: any;
  autoPrint?: boolean;
}

export function BookingDetailView({ booking, autoPrint = false }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPnr, setCopiedPnr] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'SPLIT' | 'FULL'>('SPLIT');
  const [hostUrl, setHostUrl] = useState('https://atoms-transit.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        printReceiptElement('printable-payment-receipt');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  if (!booking) return null;

  const bookingNumber = booking.bookingNumber || booking.booking_number || 'BK-TICKET';
  const trip = booking.trip || {};
  const bus = trip.bus || {};
  const route = trip.route || {};
  const rawPassengers = booking.passengers || [];

  const passengers = rawPassengers.length > 0 ? rawPassengers : (
    (booking.seats && booking.seats.length > 0)
      ? booking.seats.map((st: any, sIdx: number) => ({
          passengerName: booking.contactName || 'সম্মানিত যাত্রী',
          passengerPhone: booking.contactPhone || '—',
          seatNumber: st.seatNumber || st.seat_number || `S${sIdx + 1}`,
          fareSnapshot: st.fareSnapshot || st.fare_snapshot,
          passengerType: 'STUDENT',
          admissionId: booking.studentAdmissionId || '',
          passengerGender: 'MALE'
        }))
      : [{
          passengerName: booking.contactName || 'সম্মানিত যাত্রী',
          passengerPhone: booking.contactPhone || '—',
          seatNumber: booking.seats?.[0]?.seatNumber || booking.seatNumber || booking.seat_number || 'নির্ধারিত',
          fareSnapshot: booking.totalAmount || 0,
          passengerType: 'GENERAL',
          admissionId: booking.studentAdmissionId || '',
          passengerGender: 'MALE'
        }]
  );

  const primaryPassenger = passengers[0] || {};
  const passengerName = primaryPassenger.passengerName || booking.contactName || 'সম্মানিত যাত্রী';
  const passengerPhone = primaryPassenger.passengerPhone || booking.contactPhone || '—';
  const admissionId = primaryPassenger.admissionId || booking.studentAdmissionId;

  // Seats
  const seatNumbers = passengers
    .map((p: any) => p.seatNumber || p.seat_number)
    .filter(Boolean);

  // Accounting
  const grossAmount = Number(booking.totalAmount || booking.grossAmount || 0);
  const discountAmount = Number(booking.discountAmount || 0);
  const paidAmount = Number(booking.paidAmount || (booking.paymentStatus === 'PAID' ? grossAmount : 0));
  const dueAmount = Math.max(0, grossAmount - discountAmount - paidAmount);
  const isPaidInFull = dueAmount <= 0;

  const busNumber = (
    bus.busNumber ||
    bus.bus_number ||
    trip.busNumber ||
    trip.bus_number ||
    booking.busNumber ||
    booking.bus_number ||
    trip.bus?.busNumber ||
    trip.bus?.bus_number ||
    trip.tripCode ||
    trip.trip_code ||
    (bus.id ? `BUS-${bus.id.slice(0, 6).toUpperCase()}` : '') ||
    'ঢাকা মেট্রো-ব ১৪-৯৯৮৮'
  );

  const busName = (
    bus.busName ||
    bus.bus_name ||
    trip.busName ||
    trip.bus_name ||
    booking.busName ||
    booking.bus_name ||
    trip.bus?.busName ||
    trip.bus?.bus_name ||
    'সেন্ট্রাল এক্সপ্রেস কোচ'
  );

  // Locations
  const routeOrigin = cleanLocationName(route.origin || route.source || trip.origin, 'কাউন্টার পয়েন্ট');
  const routeDestination = route.destination || trip.targetUniversity || 'গন্তব্য ক্যাম্পাস';
  const boardingPointName = cleanLocationName(booking.boardingPoint || booking.boarding_point || trip.boardingPoint, `${routeOrigin} কাউন্টার`);
  const boardingAddress = cleanLocationName(booking.boardingAddress || booking.boarding_address, `${boardingPointName}, সেন্ট্রাল বাস টার্মিনাল`);
  const droppingPointName = booking.droppingPoint || booking.dropping_point || trip.droppingPoint || trip.targetUniversity || `${routeDestination} ড্রপিং জোন`;
  const droppingAddress = booking.droppingAddress || booking.dropping_address || `${droppingPointName}, প্রধান ফটক ও যাত্রী ড্রপিং লেন`;

  // Trip timing
  const departureDate = trip.departureDate || trip.departure_date || booking.departureDate || booking.journeyDate;
  const departureTime = trip.departureTime || trip.departure_time || booking.departureTime;

  // Security Hash
  const securityHash = React.useMemo(() => {
    const rawStr = `${bookingNumber}|${grossAmount}|${paidAmount}|${seatNumbers.join(',')}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      hash = ((hash << 5) - hash) + rawStr.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `SEC-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }, [bookingNumber, grossAmount, paidAmount, seatNumbers]);

  const verifyUrl = `${hostUrl}/bookings/${booking.id || ''}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPnr = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bookingNumber);
      setCopiedPnr(true);
      setTimeout(() => setCopiedPnr(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const waData = buildWhatsAppTicketMessage(booking, primaryPassenger, {
      name: 'ATOMS TRANSIT',
      phone: '01711000001'
    });
    if (typeof window !== 'undefined') {
      window.open(waData.waUrl, '_blank');
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 3000);
    }
  };

  return (
    <div suppressHydrationWarning className="w-full max-w-[1720px] mx-auto space-y-4 pb-16 px-2 sm:px-4 lg:px-6 print:p-0 print:m-0 print:space-y-0 print:pb-0 print:max-w-none">
      {/* 1. Executive Top Header & Layout Controls (Screen only) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Left Navigation and Ticket Status Badges */}
        <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>বুকিং তালিকা</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={handleCopyPnr}
            className="group flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="PNR কপি করতে ক্লিক করুন"
          >
            <span className="text-slate-500 font-normal">PNR:</span>
            <span>{bookingNumber}</span>
            {copiedPnr ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
            )}
          </button>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>ডিজিটাল ট্রাভেল পাস</span>
          </span>

          {isPaidInFull ? (
            <span className="text-[11px] font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              পরিশোধিত (PAID)
            </span>
          ) : (
            <span className="text-[11px] font-mono font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              বকেয়া: ৳{dueAmount}
            </span>
          )}
        </div>

        {/* Right Layout Switcher & Fast Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Mode Selector (Utilizes the full desktop screen space) */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('SPLIT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'SPLIT'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="টিকেট ও অপারেশনাল সাইডবার একসাথে দেখুন (ডেক্সটপ স্প্লিট ভিউ)"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>স্প্লিট ভিউ</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('FULL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'FULL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="সম্পূর্ণ স্ক্রিন জুড়ে বড় আকারে টিকেট প্রিভিউ দেখুন"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>ফুল ভিউ</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="টিকিটের লিঙ্ক কপি করুন"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>লিঙ্ক কপি</span>
              </>
            )}
          </Button>

          <Link href="/bookings/quick">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer shadow-2xs"
            >
              ⚡ কুইক কাউন্টার
            </Button>
          </Link>

          <Link href="/bookings/new">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm"
            >
              + নতুন বুকিং
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Responsive Workspace (Spacious, Zero-Waste Screen Real Estate) */}
      <div className="w-full print:max-w-none print:w-full">
        {layoutMode === 'SPLIT' ? (
          /* ========================================================================= */
          /* SPLIT WORKSPACE: Ticket Preview on Left + Operations Sidebar on Right       */
          /* Fully utilizing desktop wide-screen space with zero empty margins          */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Main Center Area: Executive Ticket Canvas */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2.5 print:hidden px-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>এ৪ ট্রাভেল পাস প্রিভিউ — স্ক্রিন, প্রিন্ট ও পিডিএফ অভিন্ন অনুপাত</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg px-2 py-0.5">
                    ✓ ভেরিফাইড ডকুমেন্ট
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5">
                    A4 • ১ পৃষ্ঠা
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/70 p-2 sm:p-5 flex justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
                <PaymentReceipt booking={booking} showControls={true} />
              </div>
            </div>

            {/* Desktop Operations Companion Sidebar (390px - 440px wide on desktop) */}
            <div className="w-full lg:w-[390px] xl:w-[440px] shrink-0 space-y-4 print:hidden">
              {/* Card 1: 👤 Passenger & Allocated Seats Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">যাত্রী ও আসন বিবরণ</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">বোর্ডিং পাস ও যাত্রী পরিচয়</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {seatNumbers.length}টি আসন
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 font-medium">যাত্রীর নাম:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{passengerName}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 font-medium">মোবাইল নম্বর:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${passengerPhone}`}
                        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{passengerPhone}</span>
                      </a>
                    </div>
                  </div>

                  {admissionId && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/60">
                      <span className="text-slate-500 font-medium">ভর্তি রোল / আইডি:</span>
                      <span className="font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                        {admissionId}
                      </span>
                    </div>
                  )}

                  <div className="pt-1">
                    <div className="text-slate-500 text-[11px] font-medium mb-1.5">বরাদ্দকৃত আসনসমূহ:</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {seatNumbers.map((seat: string) => (
                        <span
                          key={seat}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-black text-xs shadow-2xs flex items-center gap-1"
                        >
                          <BadgeCheck className="w-3 h-3 text-sky-200" />
                          <span>{seat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: 🚌 Trip & Bus Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">ট্রিপ ও বাস রুট তথ্য</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">সময়সূচী ও স্টপেজ পয়েন্ট</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {busNumber}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Dedicated High-Visibility Bus Number Strip */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        🚌
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                          বাস নম্বর (BUS NUMBER)
                        </span>
                        <span className="font-mono font-black text-[#032b69] dark:text-sky-300 text-xs block">
                          {busNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {busName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 font-medium">রুট:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {routeOrigin} ➔ {routeDestination}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800/60" suppressHydrationWarning>
                    <span className="text-slate-500 font-medium">যাত্রার সময়সূচী:</span>
                    <span suppressHydrationWarning className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span suppressHydrationWarning>{departureDate || 'নির্ধারিত'}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      <span suppressHydrationWarning>{departureTime || 'নির্ধারিত সময়'}</span>
                    </span>
                  </div>

                  {/* Highlighted Boarding Point */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 dark:text-amber-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>বোর্ডিং পয়েন্ট: {boardingPointName}</span>
                    </div>
                    <div className="text-[11px] text-amber-800/90 dark:text-amber-400/90 pl-4 leading-relaxed">
                      {boardingAddress}
                    </div>
                  </div>

                  {/* Dropping Point */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>ড্রপিং জোন: {droppingPointName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-4 leading-relaxed">
                      {droppingAddress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: 💳 Payment & Accounts Ledger */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">হিসাব ও পেমেন্ট বিবরণী</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">ভাড়া ব্রেকডাউন ও ক্যাশ রসিদ</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${
                    isPaidInFull
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isPaidInFull ? 'পরিশোধিত' : `বকেয়া: ৳${dueAmount}`}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">মোট সিট ভাড়া:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(grossAmount)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-emerald-600">
                      <span>ছাড় / ডিসকাউন্ট:</span>
                      <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold text-slate-900 dark:text-white">
                    <span>সর্বমোট প্রদেয়:</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">{formatCurrency(grossAmount - discountAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>পরিশোধিত টাকা:</span>
                    <span>{formatCurrency(paidAmount)}</span>
                  </div>

                  {dueAmount > 0 && (
                    <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-black">
                      <span>অবশিষ্ট বকেয়া:</span>
                      <span>{formatCurrency(dueAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: 🛡️ Live Conductor QR & Digital Verification */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 text-center">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">লাইভ ভেরিফিকেশন কিউআর</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">কন্ডাক্টর স্ক্যান ও অথেনটিকেশন</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {securityHash}
                  </span>
                </div>

                <div className="py-2 flex flex-col items-center justify-center">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                    <QRCodeView value={verifyUrl} size={135} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    মোবাইলের ক্যামেরা বা কন্ডাক্টর স্ক্যানার দিয়ে স্ক্যান করলে তৎক্ষণাৎ ডিজিটাল তথ্য দেখা যাবে
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="w-full text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>ভেরিফিকেশন লিঙ্ক কপি</span>
                </Button>
              </div>

              {/* Card 5: ⚡ Fast Operations Hub */}
              <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 shadow-md space-y-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">কুইক অ্যাকশন হাব</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => printReceiptElement('printable-payment-receipt')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট করুন</span>
                  </Button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>💬 WhatsApp</span>
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReceiptAsPdf(bookingNumber, 'printable-payment-receipt')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>পিডিএফ</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReceiptOfflineHtml(bookingNumber, 'printable-payment-receipt')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>অফলাইন কপি</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FULL FOCUS VIEW: Maximized Ticket Preview with Full Responsive Canvas     */
          /* ========================================================================= */
          <div className="w-full max-w-[1280px] mx-auto">
            <div className="flex items-center justify-between gap-3 mb-2.5 print:hidden px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>ম্যাক্সিমাইজড এ৪ ভিউ — বড় স্ক্রিনে টিকিট সম্পূর্ণ ফোকাসে প্রদর্শিত</span>
              </div>
              <button
                type="button"
                onClick={() => setLayoutMode('SPLIT')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>স্প্লিট সাইডবার চালু করুন</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/70 p-3 sm:p-6 flex justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
              <PaymentReceipt booking={booking} showControls={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
