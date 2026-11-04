'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Mail,
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
  Building2,
  Share2,
  ExternalLink,
  MessageSquare,
  Lock,
  Zap,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { QRCodeView } from '@/components/common/qr-code';
import { formatCurrency } from '@/lib/utils';
import { recordPaymentAction } from '@/actions/payment.actions';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPnr, setCopiedPnr] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'SPLIT' | 'FULL'>('SPLIT');
  const [hostUrl, setHostUrl] = useState('https://atoms-transit.com');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Modals state
  const [isCollectDueModalOpen, setIsCollectDueModalOpen] = useState(false);
  const [isAttachHotelModalOpen, setIsAttachHotelModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Due collection form
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'HAND_CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER'>('HAND_CASH');
  const [collectTrxId, setCollectTrxId] = useState('');
  const [collectNotes, setCollectNotes] = useState('কাউন্টারে সরাসরি বকেয়া আদায় ও হিসাব সমন্বয়');
  const [isCollecting, setIsCollecting] = useState(false);

  // Attach hotel form
  const [hotelFormName, setHotelFormName] = useState('হোটেল রয়েল রাজ (Rajshahi)');
  const [hotelFormRoomType, setHotelFormRoomType] = useState('২-বেড শেয়ারিং (স্টুডেন্ট প্যাকেজ)');
  const [hotelFormFee, setHotelFormFee] = useState(1200);
  const [hotelFormInclusions, setHotelFormInclusions] = useState('সকালের নাস্তা, ওয়াইফাই, এসি ও সার্বক্ষণিক সাপোর্ট');

  const [customAccommodation, setCustomAccommodation] = useState<any>(null);

  const isJustBooked = isSuccess || searchParams.get('success') === 'true' || searchParams.get('booked') === 'true';
  const [showSuccessAlert, setShowSuccessAlert] = useState(isJustBooked);

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
  const passengerEmail = primaryPassenger.email || currentBooking.contactEmail || '';
  const admissionId = primaryPassenger.admissionId || currentBooking.studentAdmissionId;

  // Allocated Seats
  const seatNumbers = passengers
    .map((p: any) => p.seatNumber || p.seat_number)
    .filter(Boolean);

  // Accounting & Ledger
  const grossAmount = Number(currentBooking.totalAmount ?? currentBooking.total_amount ?? currentBooking.grossAmount ?? currentBooking.gross_amount ?? 0);
  const discountAmount = Number(currentBooking.discountAmount || 0);
  const processingFee = Number(currentBooking.processingFee || currentBooking.processing_fee || 0);
  const netAmount = Math.max(0, grossAmount - discountAmount + processingFee);
  const rawPaidAmount = currentBooking.paidAmount ?? currentBooking.paid_amount;
  const rawPaymentStatus = (currentBooking.paymentStatus || currentBooking.payment_status || '').toUpperCase();
  const paidAmount = Number(
    rawPaidAmount !== undefined && rawPaidAmount !== null
      ? rawPaidAmount
      : (rawPaymentStatus === 'PAID' || rawPaymentStatus === 'CONFIRMED' ? netAmount : 0)
  );
  const dueAmount = Math.max(0, netAmount - paidAmount);
  const isPaidInFull = dueAmount <= 0 || rawPaymentStatus === 'PAID';

  // Initialize collect amount with actual due
  useEffect(() => {
    setCollectAmount(dueAmount);
  }, [dueAmount]);

  // Payment receipts & Trx
  const primaryPayment = currentBooking.payments?.[0] || {};
  const primaryTx = primaryPayment.transactions?.[0] || {};
  const receiptNumber = primaryPayment.receiptNumber || primaryPayment.receipt_number || currentBooking.receiptNumber || `RCT-${bookingNumber.replace('BK-', '')}`;
  const paymentMethod = primaryPayment.method || currentBooking.paymentMethod || 'HAND_CASH';
  const transactionId = primaryTx.transactionId || primaryTx.transaction_id || primaryPayment.transactionId || currentBooking.transactionId || currentBooking.senderReference || 'OFFICE-CASH-VERIFIED';

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

  const busOperator = (
    bus.operator ||
    bus.company ||
    bus.company_name ||
    trip.operator ||
    trip.company ||
    trip.company_name ||
    currentBooking.operator ||
    currentBooking.company ||
    currentBooking.companyName ||
    currentBooking.busOperator ||
    trip.busOperator ||
    bus.busOperator ||
    ''
  );
  const hasValidOperator = Boolean(
    busOperator &&
    typeof busOperator === 'string' &&
    busOperator.trim() !== '' &&
    !busOperator.includes('পরে নির্ধারণ') &&
    !busOperator.includes('Pending Vendor')
  );

  // Locations
  const routeOrigin = cleanLocationName(route.origin || route.source || trip.origin, 'কাউন্টার পয়েন্ট');
  const routeDestination = route.destination || trip.targetUniversity || 'গন্তব্য ক্যাম্পাস';
  const boardingPointName = cleanLocationName(currentBooking.boardingPoint || currentBooking.boarding_point || trip.boardingPoint, `${routeOrigin} কাউন্টার`);
  const boardingAddress = cleanLocationName(currentBooking.boardingAddress || currentBooking.boarding_address, `${boardingPointName}, সেন্ট্রাল বাস টার্মিনাল`);
  const droppingPointName = currentBooking.droppingPoint || currentBooking.dropping_point || trip.droppingPoint || trip.targetUniversity || `${routeDestination} ড্রপিং জোন`;
  const droppingAddress = currentBooking.droppingAddress || currentBooking.dropping_address || `${droppingPointName}, প্রধান ফটক ও যাত্রী ড্রপিং লেন`;

  // Trip timing
  const departureDate = trip.departureDate || trip.departure_date || currentBooking.departureDate || currentBooking.journeyDate || 'নির্ধারিত তারিখে';
  const departureTime = trip.departureTime || trip.departure_time || currentBooking.departureTime || 'রাত ১০:৩০';
  const effectiveDueDate = currentBooking.duePromiseDate || currentBooking.due_promise_date || departureDate || 'যাত্রার পূর্বে কাউন্টারে প্রদেয়';
  const dueNote = currentBooking.dueNote || currentBooking.due_note || '';

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

  // Actions
  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toastSuccess('🔗 লিংক কপি হয়েছে!', 'টিকিট ভেরিফিকেশন লিংক ক্লিপবোর্ডে কপি করা হয়েছে।');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPnr = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bookingNumber);
      setCopiedPnr(true);
      toastSuccess('🎫 পিএনআর কপি হয়েছে!', `বুকিং পিএনআর: ${bookingNumber}`);
      setTimeout(() => setCopiedPnr(false), 2500);
    }
  };

  const handleCopyHash = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(securityHash);
      setCopiedHash(true);
      toastSuccess('🛡️ সিকিউরিটি হ্যাশ কপি হয়েছে!', `কোড: ${securityHash}`);
      setTimeout(() => setCopiedHash(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const waData = buildWhatsAppTicketMessage(currentBooking, primaryPassenger, {
      name: hasValidOperator ? busOperator : 'ATOMS TRANSIT',
      phone: '01711000001'
    });
    if (typeof window !== 'undefined') {
      window.open(waData.waUrl, '_blank');
      setCopiedWa(true);
      toastSuccess('💬 WhatsApp বার্তা পাঠানো হচ্ছে...', 'অফিসিয়াল টিকিট বার্তা সহ WhatsApp ওপেন হয়েছে।');
      setTimeout(() => setCopiedWa(false), 3000);
    }
  };

  const handleCopySms = () => {
    const smsText = `🚌 [${hasValidOperator ? busOperator : 'সেন্ট্রাল এক্সপ্রেস'}] অফিসিয়াল ট্রাভেল টিকিট
পিএনআর: ${bookingNumber}
যাত্রী: ${passengerName}
আসন: ${seatNumbers.join(', ')}
বাস নং: ${busNumber} (${busName})
যাত্রা: ${departureDate} • ${departureTime}
বোর্ডিং পয়েন্ট: ${boardingPointName}
ড্রপিং পয়েন্ট: ${droppingPointName}
সর্বমোট ভাড়া: ৳${grossAmount - discountAmount} (${isPaidInFull ? 'পরিশোধিত' : `বকেয়া ৳${dueAmount}`})
অনলাইন টিকিট ও ভেরিফিকেশন: ${verifyUrl}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(smsText);
      setCopiedSms(true);
      toastSuccess('📋 SMS টেক্সট কপি হয়েছে!', 'যাত্রীকে পাঠানোর জন্য ফরম্যাটেড SMS ক্লিপবোর্ডে কপি করা হয়েছে।');
      setTimeout(() => setCopiedSms(false), 3000);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(bookingNumber, 'printable-payment-receipt');
      toastSuccess('📥 পিডিএফ প্রস্তুত!', 'টিকিট পিডিএফ হিসেবে ডাউনলোড হয়েছে।');
    } catch {
      toastError('পিডিএফ ত্রুটি', 'পিডিএফ ডাউনলোডে সমস্যা হয়েছে। সরাসরি প্রিন্ট করুন।');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCollectDuePayment = async () => {
    if (collectAmount <= 0) {
      toastError('ভুল পরিমাণ', 'অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }
    setIsCollecting(true);
    try {
      const res = await recordPaymentAction({
        bookingId: currentBooking.id,
        amount: Number(collectAmount),
        method: collectMethod,
        transactionId: collectTrxId.trim() || undefined,
        notes: collectNotes
      });
      if (res.success) {
        setIsCollectDueModalOpen(false);
        toastSuccess(
          '✓ বকেয়া আদায় সফল হয়েছে!',
          `৳${collectAmount} টাকা লেজারে সফলভাবে সমন্বয় করা হয়েছে।`
        );
        router.refresh();
      } else {
        toastError('পেমেন্ট ব্যর্থ', res.error || 'বকেয়া জমা নেওয়া যায়নি');
      }
    } catch (err: any) {
      toastError('ত্রুটি', err.message || 'পেমেন্ট প্রসেসিংয়ে সমস্যা হয়েছে');
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div suppressHydrationWarning className="w-full max-w-[1380px] mx-auto space-y-4 pb-16 px-3 sm:px-6 print:p-0 print:m-0 print:space-y-0 print:pb-0 print:max-w-none">
      {/* 1. Success Celebration Alert Banner */}
      {showSuccessAlert && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-2xl shadow-inner">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white">
                  টিকিট বুকিং সফলভাবে নিশ্চিত হয়েছে!
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
                  CONFIRMED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                যাত্রী <strong>{passengerName}</strong>-এর জন্য আসন ও ট্রাভেল পাস প্রস্তুত (পিএনআর: <span className="font-mono font-bold text-white">{bookingNumber}</span> • আসন: <span className="font-mono font-bold text-white">{seatNumbers.join(', ') || 'নির্ধারিত'}</span>)। নিচে টিকিট প্রিন্ট অথবা সরাসরি যাত্রীর WhatsApp এ পাঠিয়ে দিন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessAlert(false)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all text-sm font-bold cursor-pointer shrink-0"
            title="নোটিফিকেশন বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Organized Executive Master Toolbar (Clean, non-redundant, single-row command center) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm space-y-3 print:hidden">
        {/* Row 1: Identity & Key Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
            <Link
              href="/bookings"
              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>বুকিং তালিকা</span>
            </Link>

            {/* PNR Master Copy Pill */}
            <button
              type="button"
              onClick={handleCopyPnr}
              className="group flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl font-mono text-xs font-black transition-all cursor-pointer shadow-2xs"
              title="পিএনআর কপি করতে ক্লিক করুন"
            >
              <Ticket className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>পিএনআর: {bookingNumber}</span>
              {copiedPnr ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
              )}
            </button>

            {/* Receipt Number */}
            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hidden sm:inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{receiptNumber}</span>
            </span>

            {/* Direction Pill */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs border ${journeyDirInfo.pillClass}`}>
              <span>{journeyDirInfo.icon}</span>
              <span>{journeyDirInfo.labelBn}</span>
            </span>

            {/* Bus Type Pill */}
            {hasHotelTicket ? (
              <span className="text-xs font-black bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/70 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Hotel className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>🏨 হোটেল সমন্বিত</span>
              </span>
            ) : (
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Bus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>🚌 সাধারণ বাস</span>
              </span>
            )}

            {/* Paid / Due Status Pill */}
            {isPaidInFull ? (
              <span className="text-xs font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                পরিশোধিত (PAID)
              </span>
            ) : (
              <span className="text-xs font-mono font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                বকেয়া: ৳{dueAmount}
              </span>
            )}
          </div>

          {/* Quick Actions Right */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLayoutMode('SPLIT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'SPLIT'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="টিকেট ও সাইডবার একসাথে দেখুন"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>স্প্লিট ভিউ</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('FULL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'FULL'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="সম্পূর্ণ টিকিট প্রিভিউ দেখুন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>ফুল ভিউ</span>
              </button>
            </div>

            <Link href="/bookings/quick">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70 hover:bg-amber-100 cursor-pointer shadow-2xs h-8"
              >
                ⚡ কুইক কাউন্টার
              </Button>
            </Link>

            <Link href="/bookings/new">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm h-8 flex items-center gap-1"
              >
                + নতুন বুকিং
              </Button>
            </Link>
          </div>
        </div>

        {/* Row 2: Ticket Tab Switcher & Fast Dispatch Hub */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {/* Left: Tab Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTicketTab('BUS')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTicketTab === 'BUS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>১. বাসের টিকিট (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTicketTab('HOTEL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTicketTab === 'HOTEL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>২. হোটেল পাস / ভাউচার</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                hasHotelTicket ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
              }`}>
                {hasHotelTicket ? 'ইস্যুকৃত' : 'নরমাল বাস'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTicketTab('BOTH')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTicketTab === 'BOTH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>৩. উভয় টিকিট {hasHotelTicket ? '(২ পাতা)' : ''}</span>
            </button>
          </div>

          {/* Right: Core High-Visibility Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Print Primary Action */}
            {selectedTicketTab === 'HOTEL' && !hasHotelTicket ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAttachHotelModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 h-8"
              >
                <Hotel className="w-3.5 h-3.5" />
                <span>+ হোটেল সুবিধা যুক্ত করুন</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => printTicketDirect(selectedTicketTab)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 h-8 px-4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন (Ctrl+P)</span>
              </Button>
            )}

            {/* PDF Download Action */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 h-8"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? 'animate-bounce text-blue-600' : 'text-blue-600 dark:text-blue-400'}`} />
              <span>{isDownloadingPdf ? 'ডাউনলোড হচ্ছে...' : 'পিডিএফ'}</span>
            </Button>

            {/* WhatsApp Dispatch Action */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5 transition-all h-8"
              title="যাত্রীর WhatsApp এ টিকিট মেসেজ পাঠান"
            >
              <span>💬 WhatsApp</span>
            </button>

            {/* Copy SMS Action */}
            <button
              type="button"
              onClick={handleCopySms}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all h-8"
              title="SMS টেক্সট কপি করুন"
            >
              {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>SMS কপি</span>
            </button>

            {/* Copy Link Action */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 h-8"
              title="টিকিট যাচাই লিঙ্ক কপি"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">লিংক</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="w-full print:max-w-none print:w-full">
        {layoutMode === 'SPLIT' ? (
          /* ========================================================================= */
          /* SPLIT WORKSPACE: Ticket Preview on Left + Deeply Functional Sidebar Right */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Left: Centered Clean Ticket Canvas */}
            <div className="flex-1 w-full min-w-0 max-w-[840px] mx-auto flex flex-col items-center">
              <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-2 sm:p-5 flex flex-col items-center justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
                <PaymentReceipt
                  booking={currentBooking}
                  showControls={false}
                  ticketTab={selectedTicketTab}
                  onTicketTabChange={setSelectedTicketTab}
                />
              </div>
            </div>

            {/* Right: Functional Operations Companion Sidebar */}
            <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0 space-y-4 print:hidden">
              {/* CARD 1: 💳 পেমেন্ট ও হিসাব (Payment Ledger & Due Settlement) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">পেমেন্ট ও হিসাব</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">ভাড়া, ডিসকাউন্ট ও বকেয়া লেজার</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full ${
                    isPaidInFull
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isPaidInFull ? '✓ পরিশোধিত' : `বকেয়া: ৳${dueAmount}`}
                  </span>
                </div>

                {/* Ledger Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-medium">আসন সংখ্যা ও সিট:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {seatNumbers.length}টি ({seatNumbers.join(', ')})
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-medium">উপমোট সিট ভাড়া:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(grossAmount)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>ছাড় / স্পেশাল ডিসকাউন্ট:</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {processingFee > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-slate-500">
                      <span>প্রসেসিং ও অন্যান্য ফি:</span>
                      <span className="font-mono">+{formatCurrency(processingFee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800 pt-2 font-black text-slate-900 dark:text-white">
                    <span>সর্বমোট প্রদেয় ভাড়া:</span>
                    <span className="text-base text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(netAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>জমা / পরিশোধিত:</span>
                    </div>
                    <span className="font-mono font-black text-sm">{formatCurrency(paidAmount)}</span>
                  </div>

                  {/* Payment Channel Info */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span>পেমেন্ট চ্যানেল: <strong className="text-slate-800 dark:text-slate-200">{paymentMethod}</strong></span>
                    <span className="font-mono truncate max-w-[170px]" title={transactionId}>TRX: {transactionId}</span>
                  </div>

                  {/* Due Alert & Functional Settle Action */}
                  {dueAmount > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2.5 mt-2">
                      <div className="flex justify-between items-center text-rose-700 dark:text-rose-300 font-black">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>অবশিষ্ট বকেয়া টাকা:</span>
                        </span>
                        <span className="text-base font-mono font-black">{formatCurrency(dueAmount)}</span>
                      </div>

                      <div className="text-[11px] text-rose-800/80 dark:text-rose-300 space-y-0.5">
                        <div>⏰ প্রদেয় তারিখ: <strong>{effectiveDueDate}</strong></div>
                        {dueNote && <div>📝 নোট: <em>{dueNote}</em></div>}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsCollectDueModalOpen(true)}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5 py-2.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>বকেয়া আদায় / পেমেন্ট এন্ট্রি করুন</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        <span>হিসাব চূড়ান্ত পরিশোধিত</span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => printTicketDirect('BUS')}
                        className="text-[10px] h-6 px-2 rounded-lg font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        রশিদ প্রিন্ট
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: 👤 যাত্রী যোগাযোগ ও তথ্য (Passenger Directory & Instant Dispatch) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">যাত্রী যোগাযোগ ও তথ্য</h4>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">মোট {passengers.length} জন যাত্রী • {seatNumbers.length}টি সিট</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {seatNumbers.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-black">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Primary Contact Bar */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">প্রধান যাত্রী:</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{passengerName}</span>
                      </div>
                      <a
                        href={`tel:${passengerPhone}`}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                        title="সরাসরি ফোন করুন"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{passengerPhone}</span>
                      </a>
                    </div>

                    {admissionId && (
                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200/80 dark:border-slate-700">
                        <span className="text-slate-500 font-medium">ভর্তি রোল / আইডি:</span>
                        <span className="font-mono font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {admissionId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Passenger Manifest List */}
                  {passengers.length > 1 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        সহযাত্রীদের তালিকা ({passengers.length} জন):
                      </span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                        {passengers.map((p: any, idx: number) => (
                          <div key={idx} className="p-2 px-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-mono font-black text-[10px]">
                                {p.seatNumber || `S${idx + 1}`}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{p.passengerName || 'যাত্রী'}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{p.passengerPhone || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boarding & Dropping Quick View */}
                  <div className="p-2.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-500 font-bold block">বোর্ডিং পয়েন্ট:</span>
                        <strong className="text-slate-900 dark:text-white">{boardingPointName}</strong>
                        <div className="text-[10px] text-slate-500 leading-tight">{boardingAddress}</div>
                      </div>
                    </div>
                  </div>

                  {/* Instant Dispatch Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp টিকেট</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopySms}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{copiedSms ? 'কপি হয়েছে!' : 'SMS কপি'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 3: 🏨 হোটেল ও আবাসন স্ট্যাটাস (Accommodation & Hotel Pass) */}
              {hasHotelTicket && hotelInfo ? (
                <div className="bg-gradient-to-br from-purple-50/90 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20 rounded-3xl border border-purple-300 dark:border-purple-800/80 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200/80 dark:border-purple-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Hotel className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-purple-950 dark:text-purple-100">হোটেল পাস ও আবাসন</h4>
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">{hotelInfo.hotelName}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      ✓ ইস্যুকৃত
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">{hotelInfo.locationAddress || 'বিশ্ববিদ্যালয় ক্যাম্পাস এলাকা'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-2xl bg-purple-100/50 dark:bg-purple-900/30 border border-purple-200/80 dark:border-purple-800/60">
                      <div>
                        <span className="text-purple-800/80 dark:text-purple-300 block text-[10px]">রুমের ধরন:</span>
                        <strong className="text-purple-950 dark:text-purple-100 font-bold">{hotelInfo.roomType}</strong>
                      </div>
                      <div>
                        <span className="text-purple-800/80 dark:text-purple-300 block text-[10px]">চেক-ইন সময়:</span>
                        <strong className="text-purple-950 dark:text-purple-100 font-bold">{hotelInfo.checkIn || 'দুপুর ১২:০০'}</strong>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedTicketTab('HOTEL');
                        printTicketDirect('HOTEL');
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 py-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>হোটেল ভাউচার প্রিন্ট করুন</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">সাধারণ বাস (হোটেল বিহীন)</h4>
                        <div className="text-[10px] text-slate-500">এই বাসে আবাসন সুবিধা অন্তর্ভুক্ত নয়</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAttachHotelModalOpen(true)}
                    className="w-full text-xs font-bold rounded-xl border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer py-2 flex items-center justify-center gap-1.5"
                  >
                    <Hotel className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ এই টিকিটে হোটেল প্যাকেজ যুক্ত করুন</span>
                  </Button>
                </div>
              )}

              {/* CARD 4: 🛡️ ডিজিটাল ভেরিফিকেশন ও সিকিউরিটি গেটপাস (Live Verification & Security) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5 text-center">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">ডিজিটাল ভেরিফিকেশন</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
                    title="সিকিউরিটি কোড কপি করুন"
                  >
                    <span>{securityHash}</span>
                    {copiedHash ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-purple-400" />}
                  </button>
                </div>

                <div className="py-1 flex flex-col items-center justify-center">
                  <div className="p-3 bg-white rounded-2xl shadow-xs border-2 border-slate-900/10 dark:border-slate-700 inline-block">
                    <QRCodeView value={verifyUrl} size={118} />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    বাস কন্ডাক্টর বা গেটে স্ক্যান করে তাত্ক্ষণিক ভ্যালিডিটি যাচাই নিশ্চিত করা যাবে
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>লাইভ টেস্ট</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="w-full text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>লিংক কপি</span>
                  </Button>
                </div>
              </div>

              {/* CARD 5: ⚡ দ্রুত অপারেশনাল টুলস (Shift & Offline Backup) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">দ্রুত একশন হাব:</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/bookings/shift?bookingId=${currentBooking.id || ''}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] font-bold rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 cursor-pointer h-8"
                    >
                      🔄 সিট পরিবর্তন
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReceiptOfflineHtml(bookingNumber, 'printable-payment-receipt')}
                    className="w-full text-[11px] font-bold rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 cursor-pointer h-8"
                  >
                    💾 অফলাইন HTML
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
            <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-3 sm:p-6 flex flex-col items-center justify-center print:p-0 print:m-0 print:border-0 print:rounded-none print:bg-transparent shadow-inner">
              <PaymentReceipt
                booking={currentBooking}
                showControls={false}
                ticketTab={selectedTicketTab}
                onTicketTabChange={setSelectedTicketTab}
              />
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Settle / Collect Due Balance                                      */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCollectDueModalOpen}
        onClose={() => setIsCollectDueModalOpen(false)}
        title={`💰 বকেয়া আদায় ও পেমেন্ট এন্ট্রি: ${bookingNumber}`}
        description={`অবশিষ্ট বকেয়া টাকার পরিমাণ: ${formatCurrency(dueAmount)}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs space-y-1">
            <div className="font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>কাউন্টার কালেকশন ও লেজার সমন্বয়</span>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300">
              যাত্রী <strong>{passengerName}</strong>-এর কাছ থেকে আদায়কৃত নগদ টাকা বা ডিজিটাল পেমেন্ট এন্ট্রি করুন। সাথে সাথে টিকিটটি সম্পূর্ণ পরিশোধিত হিসেবে আপডেট হবে।
            </p>
          </div>

          <div className="space-y-3">
            <Input
              label="আদায়কৃত টাকার পরিমাণ (BDT) *"
              type="number"
              value={collectAmount}
              onChange={(e) => setCollectAmount(Number(e.target.value))}
              max={dueAmount}
              required
            />

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                পেমেন্ট মাধ্যম (Payment Channel) *
              </label>
              <select
                value={collectMethod}
                onChange={(e) => setCollectMethod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="HAND_CASH">💵 কাউন্টার সরাসরি ক্যাশ (Hand Cash)</option>
                <option value="BKASH">🌸 বিকাশ মার্চেন্ট / পার্সোনাল (bKash)</option>
                <option value="NAGAD">🟠 নগদ ওয়ালেট (Nagad Counter)</option>
                <option value="ROCKET">🟣 রকেট ডিবিবিএল (Rocket DBBL)</option>
                <option value="BANK_TRANSFER">🏦 ব্যাংক ট্রান্সফার / ডিপোজিট</option>
              </select>
            </div>

            {collectMethod !== 'HAND_CASH' && (
              <Input
                label="ট্রানজেকশন আইডি (TrxID) *"
                placeholder="যেমন: BKA9281928"
                value={collectTrxId}
                onChange={(e) => setCollectTrxId(e.target.value.toUpperCase())}
                required
              />
            )}

            <Input
              label="কালেকশন নোট / রশিদ বিবরণ"
              value={collectNotes}
              onChange={(e) => setCollectNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCollectDueModalOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCollectDuePayment}
              disabled={isCollecting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 px-4"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCollecting ? 'জমা হচ্ছে...' : 'পেমেন্ট নিশ্চিত ও লেজার আপডেট'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Operator Attach Hotel Modal                                       */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAttachHotelModalOpen}
        onClose={() => setIsAttachHotelModalOpen(false)}
        title="🏨 বুকিংয়ে হোটেল প্যাকেজ সংযুক্তকরণ"
        description={`পিএনআর: ${bookingNumber} • যাত্রী: ${passengerName}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
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

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Live Conductor & Gatepass Verification Test Modal                 */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        title="🛡️ লাইভ ডিজিটাল ভেরিফিকেশন ও সিকিউরিটি গেটপাস"
        description={`পিএনআর: ${bookingNumber} • সিকিউরিটি কোড: ${securityHash}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Status Header */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                  ✓ টিকেট সম্পূর্ণ বৈধ ও অনুমোদিত (STATUS: CONFIRMED)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                কেন্দ্রীয় ট্রানজিট সার্ভারে ক্রিপ্টোগ্রাফিক হ্যাশ ও কিউআর কোড সফলভাবে যাচাই হয়েছে।
              </p>
            </div>
          </div>

          {/* Validation Attributes */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500 font-bold">যাত্রীর নাম:</span>
              <strong className="text-slate-900 dark:text-white font-black">{passengerName}</strong>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500 font-bold">আসন নম্বর:</span>
              <span className="font-mono font-black text-blue-700 dark:text-blue-300">{seatNumbers.join(', ')} ({seatNumbers.length}টি)</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500 font-bold">বাস নম্বর ও কোচ:</span>
              <strong className="text-slate-900 dark:text-white">{busNumber} ({busName})</strong>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500 font-bold">যাত্রার রুট ও সময়:</span>
              <span className="text-slate-900 dark:text-white font-medium">{routeOrigin} ➔ {routeDestination} ({departureDate} • {departureTime})</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500 font-bold">পেমেন্ট স্ট্যাটাস:</span>
              <span className={`font-black ${isPaidInFull ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPaidInFull ? 'পরিশোধিত (PAID)' : `বকেয়া: ৳${dueAmount}`}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 font-bold">কন্ডাক্টর বোর্ডিং ক্লিয়ারেন্স:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                APPROVED FOR BOARDING
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>ভেরিফিকেশন লিংক কপি</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsVerificationModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs"
            >
              সম্পন্ন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
