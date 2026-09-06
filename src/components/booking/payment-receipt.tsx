'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Users,
  Copy,
  Check,
  ExternalLink,
  Ticket,
  FileText,
  CreditCard,
  Phone,
  ArrowRight,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/lib/utils';
import { QRCodeView } from '@/components/common/qr-code';
import { recordPaymentAction } from '@/actions/payment.actions';
import {
  getStoredOrganizationSettings,
  fetchOrganizationSettingsFromBackend
} from '@/services/settings-storage.service';
import {
  BkashLogo,
  NagadLogo,
  RocketLogo,
  BankTransferLogo,
  CashMoneyLogo,
  WhatsAppLogo
} from './payment-brand-icons';

export function buildWhatsAppTicketMessage(booking: any, passenger?: any, branding?: any): { phone: string; message: string; waUrl: string } {
  const bNumber = booking?.bookingNumber || booking?.booking_number || 'N/A';
  const rawPhone = passenger?.whatsappNumber || passenger?.passengerPhone || passenger?.passenger_phone || booking?.contactPhone || booking?.contact_phone || '';
  const cleanPhone = (rawPhone || '').replace(/\D/g, '');
  const bdPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : cleanPhone
    ? `880${cleanPhone}`
    : '';

  const pName = passenger?.passengerName || passenger?.passenger_name || booking?.contactName || booking?.contact_name || 'সম্মানিত যাত্রী';

  const allSeats = booking?.passengers?.map((p: any) => p.seatNumber || p.seat_number || p.seatId).filter(Boolean) || [];
  const passengerSeat = passenger?.seatNumber || passenger?.seat_number;
  const seatsStr = passengerSeat ? passengerSeat : (allSeats.length > 0 ? allSeats.join(', ') : 'বরাদ্দকৃত সিট');

  const tripObj = booking?.trip || {};
  const routeName = tripObj.route?.routeName || tripObj.route?.route_name || tripObj.route_name || `${booking?.boardingPoint || 'ঢাকা'} ➔ ${booking?.droppingPoint || 'ভর্তি কেন্দ্র'}`;
  const depDate = tripObj.departureDate || tripObj.departure_date ? formatDate(tripObj.departureDate || tripObj.departure_date) : 'নির্ধারিত তারিখ';
  const depTime = tripObj.departureTime || tripObj.departure_time ? formatTime(tripObj.departureTime || tripObj.departure_time) : 'নির্ধারিত সময়';
  const boardingStr = booking?.boardingPoint || booking?.boarding_point || 'কাউন্টার পয়েন্ট';
  const droppingStr = booking?.droppingPoint || booking?.dropping_point || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';

  const paidAmt = booking?.paidAmount ?? booking?.paid_amount ?? booking?.grossAmount ?? booking?.gross_amount ?? 0;
  const dueAmt = booking?.dueAmount ?? booking?.due_amount ?? 0;
  const pmtStatus = (booking?.paymentStatus || booking?.payment_status) === 'PAID' || dueAmt === 0 ? 'পরিশোধিত (PAID)' : `বকেয়া ৳${dueAmt}`;

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://atoms-transit.com';
  const verifyUrl = `${hostUrl}/bookings/${booking?.id || ''}`;

  const orgName = branding?.name || 'ATOMS Transit Management';
  const helpline = branding?.phone || '01711000001';

  const message = `🚌 *${orgName} — টিকিট ও পেমেন্ট রসিদ*
━━━━━━━━━━━━━━━━━━━━
📋 *বুকিং ট্র্যাকিং নম্বর:* ${bNumber}
👤 *যাত্রীর নাম:* ${pName}
💺 *সিট নম্বর:* ${seatsStr}
📍 *রুট:* ${routeName}
📅 *যাত্রার সময়:* ${depDate} (${depTime})
🏢 *বোর্ডিং পয়েন্ট:* ${boardingStr}
🏁 *গন্তব্য:* ${droppingStr}
💳 *ভাড়া স্ট্যাটাস:* ৳${paidAmt} [${pmtStatus}]
━━━━━━━━━━━━━━━━━━━━
🔗 *ডিজিটাল টিকিট ও কিউআর কোড (QR Code) লিঙ্ক:*
${verifyUrl}

*(বাসে ওঠার সময় এই লিঙ্কের ডিজিটাল টিকিট ও কিউআর কোডটি প্রদর্শন করুন)*

📞 হেল্পলাইন: ${helpline}
আপনার যাত্রা শুভ ও নিরাপদ হোক!
*${orgName}*`;

  const waUrl = bdPhone ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
  return { phone: rawPhone, message, waUrl };
}

export type TicketViewMode = 'FULL' | 'BOARDING_PASS' | 'CASH_CHALLAN';
export type PrintPaperMode = 'STANDARD_A4' | 'THERMAL_80MM';

export interface PaymentReceiptCardProps {
  booking: any;
  showControls?: boolean;
}

export function PaymentReceiptCard({ booking, showControls = true }: PaymentReceiptCardProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<TicketViewMode>('FULL');
  const [paperMode, setPaperMode] = useState<PrintPaperMode>('STANDARD_A4');

  // Dynamic SaaS Organization Branding
  const [orgBrand, setOrgBrand] = useState(() => getStoredOrganizationSettings().organization);

  useEffect(() => {
    fetchOrganizationSettingsFromBackend()
      .then((settings) => {
        if (settings?.organization) {
          setOrgBrand(settings.organization);
        }
      })
      .catch(() => {});
  }, []);

  // Inline Due Settlement modal
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);
  const [dueCollectAmount, setDueCollectAmount] = useState<number>(0);
  const [dueCollectMethod, setDueCollectMethod] = useState<'HAND_CASH' | 'BKASH' | 'NAGAD' | 'ROCKET'>('HAND_CASH');
  const [dueCollectRef, setDueCollectRef] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

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

  const grossAmount = booking.grossAmount ?? booking.gross_amount ?? (passengers.length * (trip.basePrice || 550));
  const discountAmount = booking.discountAmount ?? booking.discount_amount ?? 0;
  const netAmount = booking.netAmount ?? booking.net_amount ?? (grossAmount - discountAmount);
  const paidAmount = booking.paidAmount !== undefined ? booking.paidAmount : (booking.paid_amount !== undefined ? booking.paid_amount : netAmount);
  const dueAmount = booking.dueAmount !== undefined ? booking.dueAmount : (booking.due_amount !== undefined ? booking.due_amount : Math.max(0, netAmount - paidAmount));
  const isPaidInFull = dueAmount <= 0;

  const rawNotes = booking.notes || '';
  let duePromiseDate = booking.duePromiseDate || booking.due_promise_date || '';
  if (!duePromiseDate && rawNotes) {
    const match = rawNotes.match(/(?:DUE_DATE|পরিশোধের শেষ সময়|পরিশোধের প্রতিশ্রুতি তারিখ)[:\s]*([^\n|,;]+)/i);
    if (match) duePromiseDate = match[1].trim();
  }
  if (!duePromiseDate && dueAmount > 0) {
    duePromiseDate = trip.departureDate ? `${trip.departureDate} (যাত্রার দিন কাউন্টারে)` : 'যাত্রার দিন বোর্ডিং কাউন্টারে';
  }

  const receiptNumber = primaryPayment.receiptNumber || primaryPayment.receipt_number || `RCT-${booking.bookingNumber ? booking.bookingNumber.replace('BK-', '') : '20260828-001'}`;
  const bookingNumber = booking.bookingNumber || booking.booking_number || 'BK-20260828-XXXX';
  const paymentMethod = primaryPayment.method || booking.paymentMethod || 'HAND_CASH';
  const trxId = primaryTx.transactionId || primaryTx.transaction_id || primaryPayment.transactionId || booking.transactionId || booking.senderReference || 'OFFICE-CASH-VERIFIED';

  const busType = trip.tripBusType || bus.busType || bus.bus_type || 'MIXED';

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://atoms-transit.com';
  const verifyUrl = `${hostUrl}/bookings/${booking.id || ''}`;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDueModal = () => {
    setDueCollectAmount(dueAmount);
    setDueCollectRef(`ক্যাশ-বকেয়া-${bookingNumber}`);
    setIsCollectDueOpen(true);
  };

  const handleSettleDue = async () => {
    if (dueCollectAmount <= 0) return;
    setIsCollecting(true);
    try {
      const res = await recordPaymentAction({
        bookingId: booking.id,
        amount: Number(dueCollectAmount),
        method: dueCollectMethod,
        transactionId: dueCollectMethod === 'HAND_CASH' ? undefined : dueCollectRef,
        notes: `Due settlement collected at counter: ${dueCollectRef}`
      });
      if (res.success) {
        setIsCollectDueOpen(false);
        router.refresh();
      } else {
        alert(res.error || 'Failed to record payment');
      }
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Smart View Toolbar (Hidden during Print) */}
      {showControls && (
        <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 print:hidden shadow-lg">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('FULL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'FULL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>পূর্ণাঙ্গ চালান ও টিকিট</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('BOARDING_PASS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'BOARDING_PASS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>যাত্রী বোর্ডিং পাস</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CASH_CHALLAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CASH_CHALLAN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>অফিস ক্যাশ চালান</span>
            </button>
          </div>

          {/* Paper Format & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Size selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPaperMode('STANDARD_A4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  paperMode === 'STANDARD_A4' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 ভাউচার
              </button>
              <button
                type="button"
                onClick={() => setPaperMode('THERMAL_80MM')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  paperMode === 'THERMAL_80MM' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm থার্মাল
              </button>
            </div>

            {/* Settle Due Button if due exists */}
            {dueAmount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenDueModal}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                বকেয়া কালেকশন (৳{dueAmount})
              </Button>
            )}

            {/* Print Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 font-black text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              প্রিন্ট করুন
            </Button>
          </div>
        </div>
      )}

      {/* Global Print Styles for Single Page A4 Guarantee */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 6mm 8mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-payment-receipt {
            zoom: 0.88;
            height: auto !important;
            max-height: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Main Printable Ticket Container */}
      <div
        id="printable-payment-receipt"
        className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden relative print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:bg-white print:text-black ${
          paperMode === 'THERMAL_80MM'
            ? 'max-w-sm mx-auto font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-800'
            : 'rounded-3xl border-2 border-slate-200 dark:border-slate-800'
        }`}
      >
        {booking.isOffline && (
          <div className="bg-amber-500 text-slate-950 font-black text-xs py-1.5 px-4 text-center border-b border-amber-600 print:bg-slate-200 print:text-black">
            ⚠️ অফলাইন মোডে সংরক্ষিত রেকর্ড ({booking.offlineRefId || booking.bookingNumber}) — অনলাইন হলে সার্ভারে সিঙ্ক হবে
          </div>
        )}
        {/* ========================================================================= */}
        {/* MODE A: 80MM POS THERMAL SLIP MODE                                        */}
        {/* ========================================================================= */}
        {paperMode === 'THERMAL_80MM' ? (
          <div className="p-4 space-y-3 bg-white text-black font-mono text-xs">
            {/* Thermal Header */}
            <div className="text-center space-y-1 border-b-2 border-dashed border-black pb-3">
              {orgBrand.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={orgBrand.logoUrl} alt="" className="w-10 h-10 mx-auto object-contain mb-1 filter grayscale" />
              )}
              <div className="text-sm font-black uppercase tracking-wider">{orgBrand.name || 'সেন্ট্রাল এক্সপ্রেস ট্রানজিট'}</div>
              <div className="text-[10px] text-slate-700">{orgBrand.description || 'ভর্তি পরীক্ষা বিশেষ পরিবহন সেবা ২০২৬'}</div>
              <div className="text-[11px] font-black mt-1">
                {viewMode === 'BOARDING_PASS'
                  ? 'PASSENGER BOARDING PASS'
                  : viewMode === 'CASH_CHALLAN'
                  ? 'OFFICE CASH CHALLAN SLIP'
                  : 'OFFICIAL TICKET & CASH SLIP'}
              </div>
            </div>

            {/* Booking & Date strip */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2">
              <div className="flex justify-between font-bold">
                <span>রশিদ নং:</span>
                <span>{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>বুকিং আইডি:</span>
                <span className="font-bold">{bookingNumber}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>তারিখ ও সময়:</span>
                <span>{formatDateTime(booking.createdAt || new Date())}</span>
              </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2">
              <div className="font-bold">রুট: {route.routeName || 'ঢাকা ➔ বিশ্ববিদ্যালয়'}</div>
              <div>তারিখ: {formatDate(trip.departureDate)} | সময়: {formatTime(trip.departureTime)}</div>
              <div>বাস: {bus.busName || trip.busName || 'Express Coach'} ({bus.busNumber || 'কোচ'})</div>
              <div>ওঠার স্থান: {booking.boardingPoint || 'কাউন্টার'}</div>
              <div>নামার স্থান: {booking.droppingPoint || 'বিশ্ববিদ্যালয় গেট'}</div>
            </div>

            {/* Seats & Passengers */}
            <div className="space-y-1.5 border-b border-dashed border-black pb-2">
              <div className="font-bold text-[11px] uppercase">যাত্রী ও বরাদ্দকৃত সিট:</div>
              {passengers.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    সিট <strong>{p.seatNumber || `Seat ${idx + 1}`}</strong>: {p.passengerName || booking.contactName}
                  </span>
                  <span className="font-bold">{formatCurrency(p.fareSnapshot || trip.basePrice || 550)}</span>
                </div>
              ))}
            </div>

            {/* Accounts Breakdown */}
            <div className="space-y-1 text-[11px] border-b-2 border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>মোট ভাড়া:</span>
                <span>{formatCurrency(grossAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>ছাড় (কুপন/লেস):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-black">
                <span>সর্বমোট প্রদেয়:</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between font-black">
                <span>পরিশোধিত (Paid):</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>বকেয়া (Due):</span>
                <span>{formatCurrency(dueAmount)}</span>
              </div>
              {dueAmount > 0 && (
                <div className="text-[10px] font-bold text-rose-800 pt-0.5 border-t border-dotted border-black">
                  বকেয়া পরিশোধের শেষ সময়: {duePromiseDate}
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-700 pt-0.5">
                <span>পেমেন্ট চ্যানেল:</span>
                <span className="font-bold">{paymentMethod === 'HAND_CASH' ? 'কাউন্টার নগদ ক্যাশ' : paymentMethod}</span>
              </div>
            </div>

            {/* QR Code in Thermal */}
            <div className="flex flex-col items-center justify-center py-2 space-y-1">
              <QRCodeView value={verifyUrl} size={110} />
              <div className="text-[9px] text-center text-slate-700">ক্যামেরা স্ক্যানে লাইভ স্ট্যাটাস যাচাই</div>
            </div>

            {/* Thermal Footer */}
            <div className="text-center text-[9px] space-y-0.5 border-t border-dashed border-black pt-2 text-slate-700">
              <div>আপনার যাত্রা শুভ ও নিরাপদ হোক!</div>
              <div>হেল্পলাইন: {orgBrand.phone || '০১৭১১-০০০০০১'} | {orgBrand.name || 'সেন্ট্রাল ট্রানজিট'}</div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE B: STANDARD FULL A4 / CARD VOUCHER MODE                              */
          /* ========================================================================= */
          <div>
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 print:p-4 relative overflow-hidden print:bg-slate-900 print:text-white">
              {/* Decorative background bus illustration */}
              <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6 print:hidden">
                <Bus className="w-64 h-64 text-white -rotate-12" />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Brand & Organization */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {orgBrand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={orgBrand.logoUrl}
                        alt={orgBrand.name}
                        className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                        <Bus className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                          {orgBrand.name || 'সেন্ট্রাল এক্সপ্রেস ট্রানজিট'}
                        </h2>
                      </div>
                      <p className="text-[11px] text-blue-300 font-mono">
                        {orgBrand.description || 'ভর্তি পরীক্ষা বিশেষ পরিবহন সেবা • ২০২৬'}
                      </p>
                      <h1 className="text-xs sm:text-sm font-bold text-white/90">
                        {viewMode === 'BOARDING_PASS'
                          ? 'যাত্রী ডিজিটাল বোর্ডিং পাস'
                          : viewMode === 'CASH_CHALLAN'
                          ? 'অফিস ক্যাশ চালান ও হিসাব ভাউচার'
                          : 'অফিসিয়াল পেমেন্ট রসিদ ও টিকিট ইনভয়েস'}
                      </h1>
                    </div>
                  </div>
                  {(orgBrand.phone || orgBrand.email || orgBrand.address) && (
                    <div className="text-[10px] text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 font-mono">
                      {orgBrand.phone && <span>📞 হেল্পলাইন: {orgBrand.phone}</span>}
                      {orgBrand.email && <span>✉️ {orgBrand.email}</span>}
                      {orgBrand.address && <span>📍 {orgBrand.address}</span>}
                    </div>
                  )}
                </div>

                {/* Receipt Number & Verification Badge */}
                <div className="sm:text-right font-mono bg-white/10 dark:bg-black/40 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/15 shadow-inner">
                  <div className="text-[10px] text-blue-300 uppercase tracking-wider font-bold">
                    মানি রিসিট ও চালান নং
                  </div>
                  <div className="text-sm sm:text-base font-black text-white tracking-wider">
                    {receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span suppressHydrationWarning>{formatDateTime(booking.createdAt || new Date())}</span>
                  </div>
                </div>
              </div>

              {/* Status Ribbon in Header */}
              <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">বুকিং ট্র্যাকিং নং:</span>
                  <span className="font-black text-white bg-blue-600/70 px-3 py-0.5 rounded-lg border border-blue-400/40">
                    {bookingNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md ${
                      isPaidInFull
                        ? 'bg-emerald-500 text-white'
                        : paidAmount === 0
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    {isPaidInFull
                      ? '✓ পরিশোধিত (PAID IN FULL)'
                      : paidAmount === 0
                      ? `⚠️ সম্পূর্ণ বকেয়া (বকেয়া ৳${dueAmount})`
                      : `⚠️ আংশিক পরিশোধ (বকেয়া ৳${dueAmount})`}
                  </span>
                  {dueAmount > 0 && (
                    <span className="bg-rose-500/90 text-white font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-rose-400/50">
                      পরিশোধের শেষ সময়: {duePromiseDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Perforated Divider Ticket Notch */}
            <div className="relative h-6 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between px-4 border-y border-dashed border-slate-300 dark:border-slate-700 print:bg-slate-100">
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-950 -ml-6" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                ✂ OFFICIAL PASSENGER TRANSIT MONEY RECEIPT & CHALLAN ✂
              </span>
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-950 -mr-6" />
            </div>

            {/* Main Receipt Content */}
            <div className="p-6 sm:p-8 space-y-6 print:p-3 print:space-y-2.5">
              {/* Trip & Schedule Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 print:p-2.5 print:space-y-1.5 print:rounded-xl">
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
                          ? '➡️ শুধুমাত্র যাওয়া'
                          : booking.journeyType === 'RETURN_ONLY' || booking.journey_type === 'RETURN_ONLY'
                          ? '⬅️ শুধুমাত্র আসা'
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

              {/* Passenger & Seat Allotment Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>যাত্রীদের তালিকা ও বরাদ্দকৃত আসন (Passenger & Seat Allotment)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-md">
                    মোট {passengers.length || 1} টি সিট (সর্বোচ্চ ৬ সিট সীমা)
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2">সিট নম্বর</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2">যাত্রীর নাম</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2">মোবাইল ও ইমেইল</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2">ক্যাটাগরি</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2">ভর্তি রোল / আইডি</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1.5 print:px-2 text-right">ভাড়ার হার</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {passengers.map((p: any, idx: number) => {
                        const sLabel = p.seatNumber || p.seat?.seatNumber || `Seat ${idx + 1}`;
                        const sFare = p.fareSnapshot || booking.seats?.[idx]?.fareSnapshot || trip.basePrice || 550;
                        const pEmail = p.email || p.passengerEmail || p.passenger_email || booking.contactEmail || booking.contact_email;
                        return (
                          <tr key={p.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                {sLabel}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2 font-bold text-slate-900 dark:text-white">
                              {p.passengerName || booking.contactName}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2 font-mono text-slate-600 dark:text-slate-300 font-bold">
                              <div>{p.passengerPhone || booking.contactPhone}</div>
                              {pEmail && (
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-normal lowercase truncate max-w-[150px]">
                                  ✉️ {pEmail}
                                </div>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2">
                              <Badge variant="primary" className="text-[10px]">
                                {p.passengerType === 'STUDENT' ? 'শিক্ষার্থী' : p.passengerType === 'GUARDIAN' ? 'অভিভাবক' : 'যাত্রী'}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2 font-mono text-slate-700 dark:text-slate-300">
                              {p.admissionId || p.student?.admissionId || booking.studentAdmissionId || '—'}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 print:py-1 print:px-2 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                              {formatCurrency(sFare)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Computation & QR Code Verification Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 print:gap-2 pt-2 print:pt-1">
                {/* 1. Payment Channel / Challan Details */}
                <div className="p-4 sm:p-5 print:p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 print:space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    পেমেন্ট চ্যানেল ও ট্রানজেকশন বিবরণ
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {paymentMethod === 'HAND_CASH' ? (
                        <CashMoneyLogo className="w-8 h-8" />
                      ) : paymentMethod === 'BKASH' ? (
                        <BkashLogo className="w-8 h-8" />
                      ) : paymentMethod === 'NAGAD' ? (
                        <NagadLogo className="w-8 h-8" />
                      ) : paymentMethod === 'ROCKET' ? (
                        <RocketLogo className="w-8 h-8" />
                      ) : (
                        <BankTransferLogo className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {paymentMethod === 'HAND_CASH'
                          ? 'কাউন্টার সরাসরি নগদ ক্যাশ (Hand Cash)'
                          : paymentMethod === 'BKASH'
                          ? 'বিকাশ মোবাইল ব্যাংকিং (bKash)'
                          : paymentMethod === 'NAGAD'
                          ? 'নগদ ডিজিটাল পেমেন্ট (Nagad)'
                          : paymentMethod === 'ROCKET'
                          ? 'রকেট ডিবিবিএল (Rocket DBBL)'
                          : 'ব্যাংক ট্রান্সফার / ডিপোজিট'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        স্ট্যাটাস: <strong className="text-emerald-600 dark:text-emerald-400">ভেরিফাইড ও নিশ্চিত</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">রেফারেন্স / TrxID:</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{trxId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">ইস্যু কাউন্টার:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{orgBrand.name || 'সেন্ট্রাল ট্রানজিট'} হেল্পডেস্ক</span>
                    </div>
                    {primaryPassenger.passengerPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">যোগাযোগ নম্বর:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{primaryPassenger.passengerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fare Breakdown Summary */}
                <div className="p-4 sm:p-5 print:p-2.5 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-slate-800 dark:to-slate-850 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 space-y-2 print:space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 font-mono block">
                    ভাড়ার বিস্তারিত হিসাব (Fare Computation)
                  </span>

                  <div className="space-y-1 text-xs font-medium">
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

                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold pt-1 bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                      <span className="flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        পরিশোধিত টাকা:
                      </span>
                      <span className="font-mono font-black text-sm">{formatCurrency(paidAmount)}</span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400 font-bold pt-0.5">
                      <span>অবশিষ্ট বকেয়া (Due):</span>
                      <span className={`font-mono ${dueAmount > 0 ? 'text-rose-600 font-black text-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                        {formatCurrency(dueAmount)} {dueAmount <= 0 ? '(সম্পূর্ণ পরিশোধিত)' : ''}
                      </span>
                    </div>

                    {dueAmount > 0 && (
                      <div className="pt-1.5 border-t border-rose-200 dark:border-rose-900/60 text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
                        <span>⏰ বকেয়া পরিশোধের শেষ সময়:</span>
                        <span className="font-black">{duePromiseDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Official QR Code & Scan Verification Card */}
                <div className="p-4 sm:p-5 print:p-2.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5 print:space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    ডিজিটাল ভেরিফিকেশন কিউআর কোড
                  </span>
                  <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-200">
                    <QRCodeView value={verifyUrl} size={100} />
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {bookingNumber}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    স্মার্টফোন ক্যামেরা দিয়ে স্ক্যান করে টিকিট ও লাইভ সিট স্ট্যাটাস যাচাই করুন।
                  </p>
                </div>
              </div>

              {/* Official Terms & Counter Signatures */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:pt-1.5 print:gap-2">
                {/* Guidelines */}
                <div className="space-y-0.5 max-w-md text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] leading-relaxed">
                  <p>
                    🔒 <strong>যাত্রীদের জন্য জরুরি নির্দেশনাবলী:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>বাস ছাড়ার অন্তত ৩০ মিনিট পূর্বে নির্ধারিত বোর্ডিং পয়েন্টে উপস্থিত থাকুন।</li>
                    <li>যাত্রার সময় ডিজিটাল টিকিট অথবা মানি রিসিট কন্ডাক্টরকে প্রদর্শন করুন।</li>
                    <li>জরুরি প্রয়োজনে {orgBrand.name || 'সেন্ট্রাল ট্রানজিট'} কেন্দ্রীয় হেল্পলাইনে ({orgBrand.phone || '০১৭১১-০০০০০১'}) যোগাযোগ করুন।</li>
                  </ul>
                </div>

                {/* Signatures & Desk Seal */}
                <div className="flex items-center gap-5 print:flex">
                  <div className="text-center">
                    <div className="w-24 border-b border-slate-400 dark:border-slate-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 font-mono block">যাত্রীর স্বাক্ষর</span>
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-b border-slate-400 dark:border-slate-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 font-mono block">কাউন্টার ক্যাশিয়ার সিল</span>
                  </div>
                  {/* Verified Seal */}
                  <div className="shrink-0 text-center p-1.5 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] select-none rotate-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                    <div className="font-black">VERIFIED & CONFIRMED</div>
                    <div>{orgBrand.name ? `${orgBrand.name.slice(0, 16).toUpperCase()} SEAL` : 'DESK AUDIT SEAL'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Settle Due Modal */}
      <Modal
        isOpen={isCollectDueOpen}
        onClose={() => setIsCollectDueOpen(false)}
        title={`বকেয়া কালেকশন ও হিসাব সমন্বয়: ${bookingNumber}`}
        description={`অবশিষ্ট বকেয়া টাকার পরিমাণ: ${formatCurrency(dueAmount)}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="জমা আদায়ের পরিমাণ (BDT) *"
            type="number"
            value={dueCollectAmount}
            onChange={(e) => setDueCollectAmount(Number(e.target.value))}
            max={dueAmount}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              পেমেন্ট মাধ্যম
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDueCollectMethod('HAND_CASH')}
                className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  dueCollectMethod === 'HAND_CASH'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                💵 নগদ ক্যাশ
              </button>
              <button
                type="button"
                onClick={() => setDueCollectMethod('BKASH')}
                className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  dueCollectMethod === 'BKASH'
                    ? 'bg-[#E2136E] text-white border-[#E2136E]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                বিকাশ
              </button>
            </div>
          </div>

          <Input
            label="রেফারেন্স / নোট"
            value={dueCollectRef}
            onChange={(e) => setDueCollectRef(e.target.value)}
            placeholder="যেমন: কাউন্টার ক্যাশ বকেয়া আদায়"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCollectDueOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={handleSettleDue}
              isLoading={isCollecting}
              className="rounded-xl font-bold text-xs"
            >
              বকেয়া জমা ও রসিদ আপডেট
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function PaymentReceiptModal({
  booking,
  isOpen,
  onClose,
  onNewBooking,
  autoPrint
}: {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onNewBooking?: () => void;
  autoPrint?: boolean;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [orgBrand, setOrgBrand] = useState(() => getStoredOrganizationSettings().organization);
  const [dispatchStatus, setDispatchStatus] = useState<{
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    hasEmail: boolean;
    isDispatching: boolean;
  }>({
    whatsapp: true,
    sms: true,
    email: false,
    hasEmail: Boolean(booking?.contactEmail || booking?.contact_email || booking?.passengers?.some((p: any) => p.email || p.passengerEmail || p.passenger_email)),
    isDispatching: false
  });
  const [hasDispatched, setHasDispatched] = useState(false);

  useEffect(() => {
    if (isOpen && autoPrint && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  useEffect(() => {
    if (!isOpen || !booking?.id || hasDispatched) return;
    setHasDispatched(true);

    fetchOrganizationSettingsFromBackend()
      .then((settings) => {
        if (settings?.organization) setOrgBrand(settings.organization);
      })
      .catch(() => {});

    setDispatchStatus(prev => ({ ...prev, isDispatching: true }));
    fetch('/api/backend/notifications/send-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: booking.id,
        send_whatsapp: true,
        send_sms: true,
        send_email: true
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDispatchStatus({
            whatsapp: Boolean(data.whatsapp_sent),
            sms: Boolean(data.sms_sent),
            email: Boolean(data.email_sent),
            hasEmail: Boolean(booking?.contactEmail || booking?.contact_email || booking?.passengers?.some((p: any) => p.email || p.passengerEmail || p.passenger_email)),
            isDispatching: false
          });
        } else {
          setDispatchStatus(prev => ({ ...prev, isDispatching: false }));
        }
      })
      .catch(() => {
        setDispatchStatus(prev => ({ ...prev, isDispatching: false }));
      });
  }, [isOpen, booking?.id, hasDispatched]);

  if (!isOpen || !booking) return null;

  const passengers = booking.passengers && booking.passengers.length > 0
    ? booking.passengers
    : [{
        passengerName: booking.contactName || 'সম্মানিত যাত্রী',
        passengerPhone: booking.contactPhone || '',
        phoneType: 'WHATSAPP',
        hasWhatsapp: true
      }];

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = (p?: any) => {
    const { waUrl } = buildWhatsAppTicketMessage(booking, p, orgBrand);
    window.open(waUrl, '_blank');
  };

  const handleCopyMessage = (p?: any, idx: number = 0) => {
    const { message } = buildWhatsAppTicketMessage(booking, p, orgBrand);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                বুকিং সফল ও টিকিট নিশ্চিত হয়েছে!
              </h2>
              <p className="text-[11px] text-slate-400">
                অফিসিয়াল পেমেন্ট স্লিপ, ক্যাশ চালান ও কিউআর কোড টিকিট তৈরি হয়েছে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 font-black text-xs shadow-md shadow-blue-500/20 cursor-pointer rounded-xl"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              প্রিন্ট করুন
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

        {/* WhatsApp, SMS & Email Automatic Notification Status Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-3.5 sm:p-4 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <WhatsAppLogo className="w-9 h-9 shrink-0 drop-shadow-md rounded-full" />
            <div>
              <div className="text-xs sm:text-sm font-black flex items-center gap-2 flex-wrap">
                <span>স্মার্ট স্বয়ংক্রিয় নোটিফিকেশন সার্ভিস</span>
                <span className="bg-emerald-950/90 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                  ✓ WhatsApp ও পেমেন্ট কপি প্রস্তুত
                </span>
                <span className="bg-blue-950/90 text-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-400/40 flex items-center gap-1">
                  ✓ সরাসরি SMS রেকর্ড সম্পন্ন
                </span>
                {dispatchStatus.hasEmail ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    dispatchStatus.email
                      ? 'bg-purple-950/90 text-purple-200 border-purple-400/40'
                      : 'bg-amber-950/90 text-amber-200 border-amber-400/40'
                  }`}>
                    {dispatchStatus.email ? '✓ ইমেইল টিকিট ভাউচার প্রেরিত' : '✉️ ইমেইল প্রেরিত হচ্ছে...'}
                  </span>
                ) : (
                  <span className="bg-slate-800/80 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-600/40">
                    ⚪ ইমেইল বিকল্প দেয়া হয়নি
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                বুকিং কনফার্ম হওয়ার সাথে সাথে সার্ভার থেকে স্বয়ংক্রিয়ভাবে মেসেজ ও ডাটাবেস লগ সংরক্ষিত হয়েছে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {passengers.length > 1 && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  // Open first passenger and alert
                  handleSendWhatsApp(passengers[0]);
                }}
                className="bg-emerald-950 hover:bg-black text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all border border-emerald-400/50"
                title="সকল যাত্রীর WhatsApp টিকিট উইন্ডো খুলুন"
              >
                <span>🚀 সব যাত্রীকে পাঠান ({passengers.length} জন)</span>
              </Button>
            )}

            {passengers.map((p: any, idx: number) => {
              const pPhone = p.whatsappNumber || p.passengerPhone || p.passenger_phone || booking.contactPhone || '';
              const pName = p.passengerName || p.passenger_name || `যাত্রী ${idx + 1}`;
              const sNum = p.seatNumber || p.seat_number || `সিট ${idx + 1}`;

              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSendWhatsApp(p)}
                    className="bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-emerald-100"
                    title={`WhatsApp এ পাঠান: ${pPhone}`}
                  >
                    <WhatsAppLogo className="w-4 h-4 shrink-0" />
                    <span>
                      {passengers.length === 1 ? `WhatsApp এ পাঠান (${pPhone})` : `${pName} (${sNum})`}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyMessage(p, idx)}
                    className="bg-emerald-800/70 hover:bg-emerald-800 border-emerald-400/50 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="মেসেজ কপি করুন"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span className="text-[11px] text-emerald-100 font-bold">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-100" />
                        <span className="text-[11px] hidden sm:inline">কপি</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
          <PaymentReceiptCard booking={booking} showControls={true} />
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
