'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
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
  Ticket,
  Hotel,
  Layers,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { QRCodeView } from '@/components/common/qr-code';
import { formatCurrency } from '@/lib/utils';
import {
  PaymentReceipt,
  printReceiptElement,
  printTicketDirect,
  downloadReceiptAsPdf,
  downloadReceiptOfflineHtml,
  buildWhatsAppTicketMessage,
  cleanLocationName,
  extractAccommodationInfo,
  getJourneyDirectionInfo
} from './payment-receipt';

interface Props {
  booking: any;
  autoPrint?: boolean;
  isSuccess?: boolean;
}

export function BookingDetailView({ booking, autoPrint = false, isSuccess = false }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPnr, setCopiedPnr] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'SPLIT' | 'FULL'>('SPLIT');
  const [hostUrl, setHostUrl] = useState('https://atoms-transit.com');

  const searchParams = useSearchParams();
  const isJustBooked = isSuccess || searchParams.get('success') === 'true' || searchParams.get('booked') === 'true';
  const [showSuccessAlert, setShowSuccessAlert] = useState(isJustBooked);
  const { success: toastSuccess } = useToast();

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

  useEffect(() => {
    if (isJustBooked) {
      setShowSuccessAlert(true);
      const bNum = booking?.bookingNumber || booking?.booking_number || 'BK-SUCCESS';
      const sNum = (booking?.passengers || [])
        .map((p: any) => p.seatNumber || p.seat_number)
        .filter(Boolean)
        .join(', ');
      toastSuccess(
        '🎉 টিকিট বুকিং সফল হয়েছে!',
        `পিএনআর: ${bNum} • আসন: ${sNum || 'নির্ধারিত'}`
      );
    }
  }, [isJustBooked]);

  if (!booking) return null;

  const [customAccommodation, setCustomAccommodation] = useState<any>(null);
  const [isAttachHotelModalOpen, setIsAttachHotelModalOpen] = useState(false);
  const [hotelFormName, setHotelFormName] = useState('হোটেল রয়েল রাজ (Rajshahi)');
  const [hotelFormRoomType, setHotelFormRoomType] = useState('২-বেড শেয়ারিং (স্টুডেন্ট প্যাকেজ)');
  const [hotelFormFee, setHotelFormFee] = useState(1200);
  const [hotelFormInclusions, setHotelFormInclusions] = useState('সকালের নাস্তা, ওয়াইফাই, এসি ও সার্বক্ষণিক সাপোর্ট');

  const currentBooking = React.useMemo(() => {
    if (!customAccommodation) return booking;
    return {
      ...booking,
      accommodation: customAccommodation,
      hasHotelPackage: true
    };
  }, [booking, customAccommodation]);

  const bookingNumber = currentBooking.bookingNumber || currentBooking.booking_number || 'BK-TICKET';
  const trip = currentBooking.trip || {};
  const bus = trip.bus || {};
  const route = trip.route || {};
  const rawPassengers = currentBooking.passengers || [];

  const passengers = rawPassengers.length > 0 ? rawPassengers : (
    (currentBooking.seats && currentBooking.seats.length > 0)
      ? currentBooking.seats.map((st: any, sIdx: number) => ({
          passengerName: currentBooking.contactName || 'সম্মানিত যাত্রী',
          passengerPhone: currentBooking.contactPhone || '—',
          seatNumber: st.seatNumber || st.seat_number || `S${sIdx + 1}`,
          fareSnapshot: st.fareSnapshot || st.fare_snapshot,
          passengerType: 'STUDENT',
          admissionId: currentBooking.studentAdmissionId || '',
          passengerGender: 'MALE'
        }))
      : [{
          passengerName: currentBooking.contactName || 'সম্মানিত যাত্রী',
          passengerPhone: currentBooking.contactPhone || '—',
          seatNumber: currentBooking.seats?.[0]?.seatNumber || currentBooking.seatNumber || currentBooking.seat_number || 'নির্ধারিত',
          fareSnapshot: currentBooking.totalAmount || 0,
          passengerType: 'GENERAL',
          admissionId: currentBooking.studentAdmissionId || '',
          passengerGender: 'MALE'
        }]
  );

  const primaryPassenger = passengers[0] || {};
  const passengerName = primaryPassenger.passengerName || currentBooking.contactName || 'সম্মানিত যাত্রী';
  const passengerPhone = primaryPassenger.passengerPhone || currentBooking.contactPhone || '—';
  const admissionId = primaryPassenger.admissionId || currentBooking.studentAdmissionId;

  // Seats
  const seatNumbers = passengers
    .map((p: any) => p.seatNumber || p.seat_number)
    .filter(Boolean);

  // Accommodation & Hotel Detection
  const hotelInfo = React.useMemo(() => extractAccommodationInfo(currentBooking), [currentBooking]);
  const hasHotelTicket = !!hotelInfo && hotelInfo.hasHotel;
  const [selectedTicketTab, setSelectedTicketTab] = useState<'BUS' | 'HOTEL' | 'BOTH'>('BUS');

  // Journey Direction Resolution
  const rawJourneyType = (
    currentBooking.journeyType ||
    currentBooking.journey_type ||
    trip.journeyType ||
    trip.journey_type ||
    (currentBooking.notes?.includes('শুধুমাত্র যাওয়া') || currentBooking.notes?.includes('শুধুমাত্র যাওয়া') ? 'OUTBOUND_ONLY' :
     currentBooking.notes?.includes('শুধুমাত্র আসা') ? 'RETURN_ONLY' :
     currentBooking.notes?.includes('স্প্লিট') || currentBooking.notes?.includes('মিশ্র') ? 'ASYMMETRIC' : 'ROUND_TRIP')
  );
  const journeyDirInfo = React.useMemo(() => getJourneyDirectionInfo(rawJourneyType), [rawJourneyType]);

  // Accounting
  const grossAmount = Number(currentBooking.totalAmount || currentBooking.grossAmount || 0);
  const discountAmount = Number(currentBooking.discountAmount || 0);
  const paidAmount = Number(currentBooking.paidAmount || (currentBooking.paymentStatus === 'PAID' ? grossAmount : 0));
  const dueAmount = Math.max(0, grossAmount - discountAmount - paidAmount);
  const isPaidInFull = dueAmount <= 0;

  const busNumber = (
    bus.busNumber ||
    bus.bus_number ||
    trip.busNumber ||
    trip.bus_number ||
    currentBooking.busNumber ||
    currentBooking.bus_number ||
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
    currentBooking.busName ||
    currentBooking.bus_name ||
    trip.bus?.busName ||
    trip.bus?.bus_name ||
    'সেন্ট্রাল এক্সপ্রেস কোচ'
  );

  // Locations
  const routeOrigin = cleanLocationName(route.origin || route.source || trip.origin, 'কাউন্টার পয়েন্ট');
  const routeDestination = route.destination || trip.targetUniversity || 'গন্তব্য ক্যাম্পাস';
  const boardingPointName = cleanLocationName(currentBooking.boardingPoint || currentBooking.boarding_point || trip.boardingPoint, `${routeOrigin} কাউন্টার`);
  const boardingAddress = cleanLocationName(currentBooking.boardingAddress || currentBooking.boarding_address, `${boardingPointName}, সেন্ট্রাল বাস টার্মিনাল`);
  const droppingPointName = currentBooking.droppingPoint || currentBooking.dropping_point || trip.droppingPoint || trip.targetUniversity || `${routeDestination} ড্রপিং জোন`;
  const droppingAddress = currentBooking.droppingAddress || currentBooking.dropping_address || `${droppingPointName}, প্রধান ফটক ও যাত্রী ড্রপিং লেন`;

  // Trip timing
  const departureDate = trip.departureDate || trip.departure_date || currentBooking.departureDate || currentBooking.journeyDate;
  const departureTime = trip.departureTime || trip.departure_time || currentBooking.departureTime;

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
    <div suppressHydrationWarning className="w-full max-w-[1360px] mx-auto space-y-4 pb-16 px-3 sm:px-6 print:p-0 print:m-0 print:space-y-0 print:pb-0 print:max-w-none">
      {/* Success Celebration Alert Banner */}
      {showSuccessAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-2xl shadow-inner">
              🎉
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                টিকিট বুকিং সফলভাবে সম্পন্ন হয়েছে!
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
                  CONFIRMED
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                অভিনন্দন! আপনার আসন ও ট্রাভেল পাস নিশ্চিত হয়েছে (পিএনআর: <span className="font-mono font-bold text-white">{bookingNumber}</span> • আসন: <span className="font-mono font-bold text-white">{seatNumbers.join(', ') || 'নির্ধারিত'}</span>)। নিচে টিকিট প্রিন্ট অথবা PDF সংরক্ষণ করতে পারেন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessAlert(false)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all text-sm font-bold cursor-pointer shrink-0"
            title="বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      )}

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

          {/* Journey Direction Indicator */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs border ${journeyDirInfo.pillClass}`}>
            <span>{journeyDirInfo.icon}</span>
            <span>{journeyDirInfo.labelBn}</span>
          </span>

          {hasHotelTicket ? (
            <span className="text-xs font-black bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/70 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Hotel className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>🏨 হোটেল প্যাকেজ সমন্বিত বাস</span>
            </span>
          ) : (
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Bus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>🚌 সাধারণ / নরমাল বাস</span>
            </span>
          )}

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
          {/* Direct Print Buttons (Dedicated for Bus, Hotel and Both) */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedTicketTab('BUS');
              printTicketDirect('BUS');
            }}
            className="text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
            title="বাসের টিকিট প্রিন্ট করুন"
          >
            <Bus className="w-3.5 h-3.5" />
            <span>বাস টিকিট প্রিন্ট</span>
          </Button>

          {hasHotelTicket ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedTicketTab('HOTEL');
                printTicketDirect('HOTEL');
              }}
              className="text-xs font-black rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs flex items-center gap-1.5 border border-purple-500"
              title="হোটেলের টিকিট প্রিন্ট করুন"
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>🏨 হোটেল টিকিট প্রিন্ট</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTicketTab('HOTEL');
              }}
              className="text-xs font-bold rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="হোটেল টিকিট স্ট্যাটাস দেখুন"
            >
              <Hotel className="w-3.5 h-3.5 text-purple-600" />
              <span>🏨 হোটেল টিকিট (নরমাল বাস)</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSelectedTicketTab('BOTH');
              if (hasHotelTicket) {
                printTicketDirect('BOTH');
              } else {
                printTicketDirect('BUS');
              }
            }}
            className={`text-xs font-black rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 ${
              hasHotelTicket
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={hasHotelTicket ? "বাস ও হোটেল উভয় টিকিট একত্রে প্রিন্ট করুন (২ পাতা)" : "উভয় টিকিট মোড (নরমাল বাসে শুধু বাস টিকিট)"}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>উভয় টিকিট {hasHotelTicket ? '(২ পাতা)' : ''}</span>
          </Button>

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
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Main Center Area: Executive Ticket Canvas */}
            <div className="flex-1 w-full min-w-0 max-w-[840px] mx-auto flex flex-col items-center">
              <div className="w-full flex items-center justify-between gap-3 mb-2.5 print:hidden px-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>এ৪ ট্রাভেল পাস প্রিভিউ — স্ক্রিন, প্রিন্ট ও পিডিএফ নিখুঁত অনুপাত</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg px-2 py-0.5">
                    ✓ ভেরিফাইড ডকুমেন্ট
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5">
                    A4 • {hasHotelTicket && selectedTicketTab === 'BOTH' ? '২ পৃষ্ঠা' : '১ পৃষ্ঠা'}
                  </span>
                </div>
              </div>

              {/* Interactive Ticket Switcher Bar (Screen Only - Always Visible for Both Hotel and Normal Bus) */}
              <div className="w-full flex items-center justify-between gap-3 p-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/30 print:hidden mb-3 shadow-md flex-wrap">
                <div className="flex items-center gap-2 px-1">
                  {hasHotelTicket ? (
                    <Hotel className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Bus className="w-4 h-4 text-sky-400" />
                  )}
                  <span className="text-xs font-black text-slate-200">টিকিট নির্বাচন করুন:</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    hasHotelTicket
                      ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                      : 'bg-blue-500/20 text-sky-200 border-sky-400/30'
                  }`}>
                    {hasHotelTicket ? '🏨 হোটেল সমন্বিত বাস' : '🚌 সাধারণ / নরমাল বাস'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketTab('BUS')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedTicketTab === 'BUS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>১. বাসের টিকিট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTicketTab('HOTEL')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedTicketTab === 'HOTEL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>২. হোটেল টিকিট</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      hasHotelTicket ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {hasHotelTicket ? 'ইস্যুকৃত' : 'নরমাল বাস'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTicketTab('BOTH')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedTicketTab === 'BOTH' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>৩. উভয় টিকিট {hasHotelTicket ? '(২ পাতা)' : ''}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicketTab === 'HOTEL' && !hasHotelTicket ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAttachHotelModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>+ হোটেল সুবিধা যুক্ত করুন</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (selectedTicketTab === 'HOTEL' && !hasHotelTicket) {
                          setIsAttachHotelModalOpen(true);
                        } else {
                          printTicketDirect(selectedTicketTab);
                        }
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>নির্বাচিত টিকিট প্রিন্ট</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-2 sm:p-5 flex flex-col items-center justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
                <PaymentReceipt
                  booking={currentBooking}
                  showControls={true}
                  ticketTab={selectedTicketTab}
                  onTicketTabChange={setSelectedTicketTab}
                />
              </div>
            </div>

            {/* Desktop Operations Companion Sidebar (380px - 420px wide on desktop) */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 space-y-4 print:hidden">
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

              {/* Card 2.5: 🏨 Hotel & Accommodation Details (Active on Hotel Bus or Explanatory on Normal Bus) */}
              {hasHotelTicket && hotelInfo ? (
                <div className="bg-gradient-to-br from-purple-50/90 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20 rounded-2xl border-2 border-purple-300 dark:border-purple-800/80 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200/80 dark:border-purple-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-purple-950 dark:text-purple-100">হোটেল ও আবাসন ভাউচার</h4>
                        <div className="text-[10px] text-purple-700 dark:text-purple-300">ক্যাম্পাস রেসিডেন্সিয়াল অ্যাকোমোডেশন</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ✓ কনফার্মড
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-purple-200 dark:border-purple-800 space-y-1">
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">হোটেল ও অবস্থান:</div>
                      <div className="font-black text-slate-900 dark:text-white text-sm">{hotelInfo.hotelName}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>{hotelInfo.locationAddress || 'বিশ্ববিদ্যালয় ক্যাম্পাস সংলগ্ন আবাসিক জোন'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950/80 border border-purple-100 dark:border-purple-900">
                        <span className="text-[10px] text-slate-500 font-bold block">রুম ক্যাটাগরি:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">{hotelInfo.roomType}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950/80 border border-purple-100 dark:border-purple-900">
                        <span className="text-[10px] text-slate-500 font-bold block">হেল্পডেস্ক / যোগাযোগ:</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-xs block truncate">{hotelInfo.contactPerson || '০১৭০০-০০০০০০'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-purple-100/60 dark:bg-purple-950/50 text-[11px] font-medium text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                      <span>⏰ চেক-ইন: <strong>{hotelInfo.checkIn || 'দুপুর ১২:০০'}</strong></span>
                      <span>⏰ চেক-আউট: <strong>{hotelInfo.checkOut || 'সকাল ১০:০০'}</strong></span>
                    </div>

                    <div className="pt-1">
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedTicketTab('HOTEL');
                          printTicketDirect('HOTEL');
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer py-2.5 transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        <span>🏨 হোটেল টিকিট প্রিন্ট করুন</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">হোটেল ও আবাসন স্ট্যাটাস</h4>
                        <div className="text-[10px] text-slate-500">রেগুলার বাস ট্রিপ</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      সাধারণ বাস
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      এই বাসটির সাথে কোনো হোটেল প্যাকেজ অন্তর্ভুক্ত নেই। হোটেল টিকিট শুধুমাত্র <strong>হোটেল প্যাকেজ সমন্বিত বাসে</strong> ইস্যু হয়।
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAttachHotelModalOpen(true)}
                      className="w-full text-xs font-bold rounded-xl border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5 py-2"
                    >
                      <Hotel className="w-3.5 h-3.5 text-purple-600" />
                      <span>+ হোটেল প্যাকেজ সংযুক্ত করুন</span>
                    </Button>
                  </div>
                </div>
              )}

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
                    onClick={() => {
                      setSelectedTicketTab('BUS');
                      printTicketDirect('BUS');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>বাস টিকিট প্রিন্ট</span>
                  </Button>

                  {hasHotelTicket ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedTicketTab('HOTEL');
                        printTicketDirect('HOTEL');
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>হোটেল টিকিট</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicketTab('HOTEL');
                      }}
                      className="w-full border-purple-400 text-purple-300 hover:bg-purple-950/50 font-bold rounded-xl cursor-pointer shadow-2xs flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Hotel className="w-3.5 h-3.5 text-purple-400" />
                      <span>হোটেল (নরমাল)</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSelectedTicketTab('BOTH');
                      if (hasHotelTicket) {
                        printTicketDirect('BOTH');
                      } else {
                        printTicketDirect('BUS');
                      }
                    }}
                    className={`col-span-2 w-full font-black rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5 py-2 ${
                      hasHotelTicket
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>উভয় টিকিট একত্রে প্রিন্ট {hasHotelTicket ? '(২ পাতা)' : ''}</span>
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
                    className="col-span-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>অফলাইন ফাইল ডাউনলোড</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FULL FOCUS VIEW: Maximized Ticket Preview with Full Responsive Canvas     */
          /* ========================================================================= */
          <div className="w-full max-w-[850px] mx-auto flex flex-col items-center">
            <div className="w-full flex items-center justify-between gap-3 mb-2.5 print:hidden px-1">
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

            {/* Interactive Ticket Switcher Bar in Full View */}
            <div className="w-full flex items-center justify-between gap-3 p-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/30 print:hidden mb-3 shadow-md flex-wrap">
              <div className="flex items-center gap-2 px-1">
                {hasHotelTicket ? (
                  <Hotel className="w-4 h-4 text-purple-400" />
                ) : (
                  <Bus className="w-4 h-4 text-sky-400" />
                )}
                <span className="text-xs font-black text-slate-200">টিকিট নির্বাচন করুন:</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  hasHotelTicket
                    ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                    : 'bg-blue-500/20 text-sky-200 border-sky-400/30'
                }`}>
                  {hasHotelTicket ? '🏨 হোটেল সমন্বিত বাস' : '🚌 সাধারণ / নরমাল বাস'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTicketTab('BUS')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTicketTab === 'BUS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>১. বাসের টিকিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTicketTab('HOTEL')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTicketTab === 'HOTEL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span>২. হোটেল টিকিট</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    hasHotelTicket ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {hasHotelTicket ? 'ইস্যুকৃত' : 'নরমাল বাস'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTicketTab('BOTH')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTicketTab === 'BOTH' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>৩. উভয় টিকিট {hasHotelTicket ? '(২ পাতা)' : ''}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicketTab === 'HOTEL' && !hasHotelTicket ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAttachHotelModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>+ হোটেল সুবিধা যুক্ত করুন</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (selectedTicketTab === 'HOTEL' && !hasHotelTicket) {
                        setIsAttachHotelModalOpen(true);
                      } else {
                        printTicketDirect(selectedTicketTab);
                      }
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>প্রিন্ট করুন</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-3 sm:p-6 flex flex-col items-center justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
              <PaymentReceipt
                booking={currentBooking}
                showControls={true}
                ticketTab={selectedTicketTab}
                onTicketTabChange={setSelectedTicketTab}
              />
            </div>
          </div>
        )}
      </div>

      {/* Operator Attach Hotel Modal */}
      <Modal
        isOpen={isAttachHotelModalOpen}
        onClose={() => setIsAttachHotelModalOpen(false)}
        title="🏨 বুকিংয়ে হোটেল প্যাকেজ সংযুক্তকরণ"
        description={`পিএনআর: ${bookingNumber} • যাত্রী: ${passengerName}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
            <div className="font-black flex items-center gap-1.5">
              <Hotel className="w-4 h-4 text-purple-600" />
              <span>পৃথক হোটেল অ্যাকোমোডেশন ভাউচার প্রস্তুত হবে</span>
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300">
              হোটেল প্যাকেজ যুক্ত করার পর এই বুকিংয়ের জন্য আলাদা একটি অফিসিয়াল হোটেল টিকিট তৈরি হবে, যা পৃথক পাতা হিসেবে প্রিন্ট করা যাবে।
            </p>
          </div>

          <div className="space-y-3">
            <Input
              label="হোটেল ও অবস্থান নাম *"
              value={hotelFormName}
              onChange={(e) => setHotelFormName(e.target.value)}
              placeholder="যেমন: হোটেল রয়েল রাজ (Rajshahi)"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="রুম ক্যাটাগরি *"
                value={hotelFormRoomType}
                onChange={(e) => setHotelFormRoomType(e.target.value)}
                placeholder="যেমন: ২-বেড শেয়ারিং"
                required
              />

              <Input
                label="হোটেল প্যাকেজ ফি (প্রতি ব্যক্তি BDT) *"
                type="number"
                value={hotelFormFee}
                onChange={(e) => setHotelFormFee(Number(e.target.value))}
                required
              />
            </div>

            <Input
              label="ইনক্লুশন ও সুবিধাসমূহ"
              value={hotelFormInclusions}
              onChange={(e) => setHotelFormInclusions(e.target.value)}
              placeholder="যেমন: ফ্রি সকালের নাস্তা, হাইস্পিড ওয়াইফাই, এসি"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAttachHotelModalOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const newAcc = {
                  hasHotel: true,
                  hotelName: hotelFormName.trim() || 'হোটেল রয়েল রাজ (Rajshahi)',
                  roomType: hotelFormRoomType.trim() || '২-বেড শেয়ারিং',
                  hotelFee: Number(hotelFormFee) || 1200,
                  checkIn: 'দুপুর ১২:০০',
                  checkOut: 'পরবর্তী দিন সকাল ১০:০০',
                  locationAddress: `${currentBooking.trip?.targetUniversity || 'বিশ্ববিদ্যালয় ক্যাম্পাস'} সংলগ্ন আবাসিক এলাকা`,
                  contactPerson: '০১৭০০-০০০০০০ (হোটেল হেল্পডেস্ক)',
                  inclusions: hotelFormInclusions
                };
                setCustomAccommodation(newAcc);
                setSelectedTicketTab('HOTEL');
                setIsAttachHotelModalOpen(false);
                toastSuccess('🏨 হোটেল টিকিট সফলভাবে সংযুক্ত ও ইস্যু করা হয়েছে!', `হোটেল: ${newAcc.hotelName}`);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5"
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>হোটেল নিশ্চিত ও টিকিট ইস্যু করুন</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
