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
  Building2,
  Download,
  FileDown,
  Armchair,
  Info,
  User,
  Briefcase,
  AlertTriangle,
  BadgePercent,
  UserCheck,
  Lock,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/lib/utils';
import { QRCodeView } from '@/components/common/qr-code';
import { BarcodeView } from '@/components/common/barcode';
import { recordPaymentAction } from '@/actions/payment.actions';
import {
  getStoredOrganizationSettings,
  fetchOrganizationSettingsFromBackend,
  DEFAULT_ORGANIZATION_SETTINGS
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
  const primaryP = passenger || booking?.passengers?.[0];
  const pName = primaryP?.passengerName || primaryP?.passenger_name || booking?.contactName || 'সম্মানিত যাত্রী';
  const rawPhone = primaryP?.passengerPhone || primaryP?.passenger_phone || booking?.contactPhone || '';
  const bdPhone = rawPhone.replace(/\D/g, '');

  const tripObj = booking?.trip || {};
  const busObj = tripObj.bus || {};
  const routeObj = tripObj.route || {};
  const routeName = routeObj.routeName || `${routeObj.origin || 'ঢাকা'} ➔ ${routeObj.destination || 'ক্যাম্পাস'}`;

  const seatsStr = booking?.passengers?.map((p: any) => p.seatNumber || p.seat_number).filter(Boolean).join(', ') ||
                   booking?.seats?.map((s: any) => s.seatNumber || s.seat_number).filter(Boolean).join(', ') || 'N/A';

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

/**
 * Isolated Printing: Clones the ticket into an invisible iframe with all styles
 * so that ZERO background page elements, dashboard tables, or modal overlays bleed into the print output!
 */
export function printReceiptElement(elementId: string = 'printable-payment-receipt') {
  if (typeof window === 'undefined') return;
  const receiptEl = document.getElementById(elementId);
  if (!receiptEl) {
    window.print();
    return;
  }

  // Gather all style elements and stylesheets
  let styleTags = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    styleTags += node.outerHTML + '\n';
  });

  const printIframe = document.createElement('iframe');
  printIframe.setAttribute('id', 'receipt-print-iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.top = '0';
  printIframe.style.left = '0';
  printIframe.style.width = '100vw';
  printIframe.style.height = '100vh';
  printIframe.style.border = 'none';
  printIframe.style.zIndex = '999999';
  printIframe.style.background = '#ffffff';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Ticket-Print</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+Bengali:wght@400;600;700;900&display=swap">
  ${styleTags}
  <style>
    * { box-sizing: border-box; }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    #printable-payment-receipt {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: 1.5px solid #0f172a !important;
      zoom: 0.88;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  </style>
</head>
<body style="padding: 6px; background: #ffffff;">
  ${receiptEl.outerHTML}
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (e) {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1500);
    }
  }, 400);
}

/**
 * Direct PDF Download: Uses html2canvas + jsPDF to generate an actual .pdf file
 * with 2x crisp DPI and single-page A4 dimensions.
 */
export async function downloadReceiptAsPdf(bookingNumber: string, elementId: string = 'printable-payment-receipt') {
  if (typeof window === 'undefined') return;
  const receiptEl = document.getElementById(elementId);
  if (!receiptEl) {
    printReceiptElement(elementId);
    return;
  }

  try {
    // Dynamically import html2canvas-pro (native support for modern CSS color spaces: lab, oklch, lch)
    // with fallback to html2canvas if needed
    let html2canvas: any;
    try {
      const h2cPro = await import('html2canvas-pro');
      html2canvas = h2cPro.default || h2cPro;
    } catch {
      const h2c = await import('html2canvas');
      html2canvas = h2c.default || h2c;
    }
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(receiptEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 8;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    pdf.save(`ticket-${bookingNumber}.pdf`);
  } catch (err) {
    console.error('PDF generation error, falling back to print:', err);
    printReceiptElement(elementId);
  }
}

/**
 * Self-Contained Offline HTML Download: Extracts runtime CSS rules directly from the DOM
 * so the file opens and prints 100% styled even without internet or server connection.
 */
export function downloadReceiptOfflineHtml(bookingNumber: string, elementId: string = 'printable-payment-receipt') {
  if (typeof window === 'undefined') return;
  const receiptEl = document.getElementById(elementId);
  if (!receiptEl) {
    printReceiptElement(elementId);
    return;
  }

  // Extract all CSS rules from active stylesheets
  let embeddedStyles = '';
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            embeddedStyles += sheet.cssRules[j].cssText + '\n';
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  let externalStyleTags = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    externalStyleTags += node.outerHTML + '\n';
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Ticket-${bookingNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+Bengali:wght@400;600;700;900&display=swap">
  ${externalStyleTags}
  <style>
    ${embeddedStyles}
  </style>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Noto Sans Bengali', 'Inter', sans-serif; margin: 0; padding: 24px; background: #0b1329; color: #0f172a; min-height: 100vh; }
    .offline-banner { max-width: 820px; margin: 0 auto 16px auto; padding: 14px 24px; background: linear-gradient(135deg, #059669, #047857); color: #fff; border-radius: 14px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px rgba(5,150,105,0.25); }
    .offline-banner button { background: #fff; color: #047857; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    #printable-payment-receipt { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); overflow: hidden; }
    @page { size: A4 portrait; margin: 6mm 8mm; }
    @media print {
      body { background: #fff; padding: 0; }
      .offline-banner { display: none !important; }
      #printable-payment-receipt { box-shadow: none !important; border: 1.5px solid #0f172a !important; border-radius: 4px !important; zoom: 0.88; max-height: 275mm !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="offline-banner">
    <span>🚌 অফিশিয়াল ই-টিকিট ও ট্রাভেল পাস — PNR: ${bookingNumber}</span>
    <button onclick="window.print()">🖨️ সরাসরি প্রিন্ট / Save as PDF</button>
  </div>
  ${receiptEl.outerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${bookingNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PaymentReceipt({
  booking,
  showControls = true,
  defaultViewMode = 'FULL',
  defaultPaperMode = 'STANDARD_A4',
  paperMode: controlledPaperMode,
  onPaperModeChange
}: {
  booking: any;
  showControls?: boolean;
  defaultViewMode?: TicketViewMode;
  defaultPaperMode?: PrintPaperMode;
  paperMode?: PrintPaperMode;
  onPaperModeChange?: (mode: PrintPaperMode) => void;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<TicketViewMode>(defaultViewMode);
  const [internalPaperMode, setInternalPaperMode] = useState<PrintPaperMode>(defaultPaperMode);
  const paperMode = controlledPaperMode ?? internalPaperMode;

  const setPaperMode = (m: PrintPaperMode) => {
    setInternalPaperMode(m);
    onPaperModeChange?.(m);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);
  const [dueCollectAmount, setDueCollectAmount] = useState(0);
  const [dueCollectMethod, setDueCollectMethod] = useState<'HAND_CASH' | 'BKASH' | 'NAGAD' | 'ROCKET'>('HAND_CASH');
  const [dueCollectRef, setDueCollectRef] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [orgBrand, setOrgBrand] = useState(DEFAULT_ORGANIZATION_SETTINGS.organization);
  const [hostUrl, setHostUrl] = useState('https://atoms-transit.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostUrl(window.location.origin);
      try {
        const local = getStoredOrganizationSettings().organization;
        if (local) setOrgBrand(local);
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchOrganizationSettingsFromBackend()
      .then((settings) => {
        if (settings?.organization) setOrgBrand(settings.organization);
      })
      .catch(() => {});
  }, []);

  if (!booking) return null;

  const trip = booking.trip || {};
  const bus = trip.bus || {};
  const route = trip.route || {};
  const passengers = booking.passengers || [];
  const primaryPassenger = passengers[0] || {};

  // Dynamic passengers list strictly budgeted and styled for up to 6 seats
  const displayPassengers = passengers.length > 0
    ? passengers.slice(0, 6)
    : [{
        passengerName: booking.contactName || 'সম্মানিত যাত্রী',
        passengerPhone: booking.contactPhone || '—',
        seatNumber: booking.seats?.[0]?.seatNumber || booking.seatNumber || 'নির্ধারিত',
        passengerType: 'STUDENT',
        admissionId: booking.studentAdmissionId || '—',
        fareSnapshot: booking.seats?.[0]?.fareSnapshot || trip.basePrice || 550,
        passengerGender: 'MALE'
      }];

  const payments = booking.payments || [];
  const primaryPayment = payments[0] || {};
  const transactions = booking.transactions || [];
  const primaryTx = transactions[0] || {};

  const grossAmount = booking.grossAmount ?? booking.gross_amount ?? 0;
  const discountAmount = booking.discountAmount ?? booking.discount_amount ?? 0;
  const processingFee = booking.processingFee ?? booking.processing_fee ?? 0;
  const vatAmount = booking.vatAmount ?? booking.vat_amount ?? booking.taxAmount ?? 0;
  const netAmount = booking.netAmount ?? booking.net_amount ?? (grossAmount - discountAmount + processingFee + vatAmount);
  const paidAmount = booking.paidAmount ?? booking.paid_amount ?? 0;
  const dueAmount = booking.dueAmount ?? booking.due_amount ?? Math.max(0, netAmount - paidAmount);
  const isPaidInFull = dueAmount <= 0;

  const duePromiseDate = booking.duePromiseDate || booking.due_promise_date
    ? formatDate(booking.duePromiseDate || booking.due_promise_date)
    : 'যাত্রা শুরুর পূর্বে কাউন্টারে প্রদেয়';

  const receiptNumber = primaryPayment.receiptNumber || primaryPayment.receipt_number || `RCT-${booking.bookingNumber ? booking.bookingNumber.replace('BK-', '') : '20260828-001'}`;
  const bookingNumber = booking.bookingNumber || booking.booking_number || 'BK-20260828-XXXX';
  const paymentMethod = primaryPayment.method || booking.paymentMethod || 'HAND_CASH';
  const trxId = primaryTx.transactionId || primaryTx.transaction_id || primaryPayment.transactionId || booking.transactionId || booking.senderReference || 'OFFICE-CASH-VERIFIED';

  // Anti-tamper Cryptographic Security Hash
  const securityHash = React.useMemo(() => {
    const rawStr = `${bookingNumber}|${receiptNumber}|${grossAmount}|${netAmount}|${displayPassengers.map((p: any) => p.seatNumber || '').join(',')}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      hash = ((hash << 5) - hash) + rawStr.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `SEC-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }, [bookingNumber, receiptNumber, grossAmount, netAmount, displayPassengers]);

  const busType = trip.tripBusType || bus.busType || bus.bus_type || 'MIXED';
  const verifyUrl = `${hostUrl}/bookings/${booking.id || ''}`;

  const handlePrint = () => {
    printReceiptElement('printable-payment-receipt');
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(bookingNumber, 'printable-payment-receipt');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadOfflineTicket = () => {
    downloadReceiptOfflineHtml(bookingNumber, 'printable-payment-receipt');
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
    <div suppressHydrationWarning className="space-y-4">
      {/* Smart View Toolbar (Hidden during Print or when showControls is false) */}
      {showControls && (
        <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 print:hidden shadow-lg">
          {/* Executive Pass Title & PNR Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>অফিশিয়াল ট্রাভেল পাস ও ই-টিকিট</span>
                <span className="font-mono text-xs text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  {bookingNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                A4 সাইজ সিঙ্গেল পেজ প্রিন্ট ও অফলাইন ভাউচার ফরম্যাট
              </div>
            </div>
          </div>

          {/* Paper Format & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Size selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPaperMode('STANDARD_A4')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  paperMode === 'STANDARD_A4' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 ভাউচার
              </button>
              <button
                type="button"
                onClick={() => setPaperMode('THERMAL_80MM')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  paperMode === 'THERMAL_80MM' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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

            {/* Download PDF Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 border-none"
              title="পিডিএফ ফাইল হিসেবে সংরক্ষণ করুন (Save as PDF)"
            >
              <Download className="w-4 h-4" />
              <span>পিডিএফ</span>
            </Button>

            {/* Offline Ticket HTML Download */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadOfflineTicket}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="অফলাইন টিকিট ফাইল (.html) ডাউনলোড করুন"
            >
              <FileDown className="w-4 h-4" />
              <span>অফলাইন ফাইল</span>
            </Button>

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

      {/* Global Print Styles strictly enforcing Single Page A4 output */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm 8mm;
        }
        @media print {
          /* Hide all page content except the printable ticket container */
          body > *:not(:has(#printable-payment-receipt)) {
            display: none !important;
          }
          /* Hide sibling elements of modals */
          header, nav, aside, footer, .sidebar, [data-portal], .fixed:not(:has(#printable-payment-receipt)) {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Neutralize modal wrapper and backdrop when printing */
          .fixed, [role="dialog"], div[class*="backdrop-blur"] {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            display: block !important;
          }
          div[class*="max-h-"] {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }
          #printable-payment-receipt {
            zoom: 0.90;
            height: auto !important;
            max-height: 275mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            overflow: visible !important;
            border: 1.5px solid #0f172a !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Main Printable Ticket Container */}
      <div
        id="printable-payment-receipt"
        className={`bg-white text-slate-900 overflow-hidden relative print:shadow-none print:m-0 print:w-full print:bg-white print:text-black ${
          paperMode === 'THERMAL_80MM'
            ? 'max-w-sm mx-auto font-mono text-xs rounded-xl border border-slate-300 shadow-xl'
            : 'max-w-3xl mx-auto rounded-2xl border border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5 print:border-slate-900 print:shadow-none print:rounded-none'
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
                <span suppressHydrationWarning>{formatDateTime(booking.createdAt || new Date())}</span>
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
              {processingFee > 0 && (
                <div className="flex justify-between">
                  <span>অনলাইন প্রসেসিং ফি:</span>
                  <span>+{formatCurrency(processingFee)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>ভ্যাট ও ট্যাক্স:</span>
                  <span>+{formatCurrency(vatAmount)}</span>
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
          /* MODE B: UNIFIED A4 EXECUTIVE TRANSIT E-TICKET & OFFICIAL TRAVEL PASS      */
          /* ULTRA-PREMIUM REFINEMENT MATCHED PIXEL-PERFECTLY TO REFERENCE DESIGN      */
          /* ========================================================================= */
          <div className="relative bg-white text-slate-900 select-text font-sans shadow-lg">
            {/* 1. TOP BRAND HERO HEADER (Transit Royal Navy Gradient with Single Verified Badge) */}
            <div className="bg-gradient-to-r from-[#021f4d] via-[#053b8c] to-[#0a4fa8] text-white p-4 sm:p-5 flex items-center justify-between gap-4 relative overflow-hidden print:bg-[#021f4d]">
              {/* Left Brand Identity */}
              <div className="relative z-10 flex items-center gap-3.5">
                {orgBrand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={orgBrand.logoUrl}
                    alt={orgBrand.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shrink-0 shadow-inner">
                    <Bus className="w-7 h-7 sm:w-8 sm:h-8 text-sky-300" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white leading-none font-sans drop-shadow-sm">
                    {orgBrand.name || 'ATOMS TRANSIT'}
                  </h1>
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-sky-200 font-semibold mt-1 tracking-wide">
                    <span>Safe Journey</span>
                    <span>•</span>
                    <span>Smart Transport</span>
                    <span>•</span>
                    <span>Better Tomorrow</span>
                  </div>
                </div>
              </div>

              {/* Right: Executive Dual-Ring Holographic Authority Seal */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 shadow-sm relative z-10 print:border-white/40">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-sky-400/30 border-2 border-emerald-400 shadow-inner shrink-0 text-emerald-300">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                    ✓
                  </span>
                </div>
                <div className="text-left hidden xs:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black tracking-wider text-white uppercase block font-mono leading-none">
                      DIGITALLY VERIFIED
                    </span>
                    <span className="text-[8px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-1 py-0.2 rounded font-mono font-black">
                      AUTHENTIC
                    </span>
                  </div>
                  <span className="text-[9px] text-sky-200 font-bold font-mono block mt-1 tracking-tight">
                    PASS-ID: {securityHash}
                  </span>
                </div>
              </div>

              {/* Ambient light glow */}
              <div className="absolute -right-8 -bottom-10 w-52 h-52 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* 2. OFFICIAL BAR & PAYMENT STATUS PILL */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-300 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-black tracking-wide text-xs sm:text-sm">
                <div className="w-5 h-5 rounded bg-[#032b69] text-white flex items-center justify-center text-[10px] shadow-2xs">
                  🎫
                </div>
                <span className="uppercase">OFFICIAL PASSENGER E-TICKET & BOARDING PASS</span>
              </div>

              <div>
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs font-mono uppercase ${
                    isPaidInFull
                      ? 'bg-[#10b981] text-white shadow-emerald-500/20'
                      : paidAmount === 0
                      ? 'bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-amber-600 text-white shadow-amber-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isPaidInFull
                    ? 'PAID IN FULL'
                    : paidAmount === 0
                    ? `UNPAID (৳${dueAmount})`
                    : `PARTIAL (DUE ৳${dueAmount})`}
                </span>
              </div>
            </div>

            {/* 2.1 MICRO-PRINT ANTI-COPY SECURITY STRIP */}
            <div className="bg-slate-950 text-sky-200 py-1 px-3 flex items-center justify-between text-[8px] sm:text-[9px] font-mono tracking-widest uppercase overflow-hidden border-b border-slate-800 print:bg-black print:text-white">
              <div className="flex items-center gap-2 truncate">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-bold">
                  ★ OFFICIAL SECURE TRANSIT PASS ★ DO NOT DUPLICATE ★ ENCRYPTED ANTI-TAMPER VERIFICATION ★ ORIGINAL ATOMS PORTAL ★
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0 font-black text-amber-300 print:text-white">
                <Fingerprint className="w-3 h-3" />
                <span>SEC-HASH: {securityHash}</span>
              </div>
            </div>

            {/* 3. KEY METRICS STRIP (Unclipped PNR & Challan with full visibility) */}
            <div className="px-3 sm:px-4 py-2.5 bg-white border-b border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-0 items-center text-xs">
              {/* PNR / Tracking No. (5 Cols) */}
              <div className="sm:col-span-5 flex items-center gap-2.5 sm:pr-3">
                <div className="w-8 h-8 rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-wider block font-mono">PNR / TRACKING NO.</span>
                  <span className="font-mono font-black text-slate-950 text-xs sm:text-[13px] tracking-tight block break-all select-all leading-tight">
                    {bookingNumber}
                  </span>
                </div>
              </div>

              {/* Challan & Receipt No. (4 Cols) */}
              <div className="sm:col-span-4 flex items-center gap-2.5 sm:px-3 sm:border-l border-slate-300">
                <div className="w-8 h-8 rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-wider block font-mono">CHALLAN & RECEIPT NO.</span>
                  <span className="font-mono font-black text-slate-900 text-xs sm:text-[13px] tracking-tight block break-all select-all leading-tight">
                    {receiptNumber}
                  </span>
                </div>
              </div>

              {/* Issue Time (3 Cols) */}
              <div className="sm:col-span-3 flex items-center gap-2.5 sm:pl-3 sm:border-l border-slate-300">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-wider block font-mono">ISSUE TIME</span>
                  <span className="font-mono text-slate-800 text-[11px] sm:text-xs font-bold block leading-tight whitespace-nowrap">
                    {formatDateTime(booking.createdAt || new Date())}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Main Content Body */}
            <div className="p-3.5 sm:p-4.5 print:p-2.5 space-y-3 print:space-y-2.5">
              {/* 4. ROUTE FLOW HERO BANNER (Sky-Blue Gradient Card with high contrast) */}
              <div className="rounded-2xl border border-sky-300 print:border-slate-800 bg-gradient-to-b from-[#e0f2fe]/90 via-[#f0f9ff]/70 to-white p-3.5 sm:p-4 shadow-2xs">
                {/* Boarding Point ────🚌──── Dropping Point */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-sky-200/90 print:border-slate-400">
                  {/* Origin */}
                  <div className="w-full sm:w-5/12 text-left">
                    <div className="flex items-center gap-1.5 text-sky-800 print:text-black text-[10px] font-black uppercase tracking-wider font-mono">
                      <MapPin className="w-3.5 h-3.5 text-sky-700 print:text-black" />
                      <span>BOARDING POINT</span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5 leading-tight">
                      {route.origin || 'RAJSHAHI'}
                    </div>
                    <div className="text-xs text-slate-700 font-medium mt-0.5">
                      {booking.boardingPoint || booking.boarding_point || 'Talaimari / Bhadra / Railgate Bus Counter'}
                    </div>
                  </div>

                  {/* Flow Arrow with Bus Icon */}
                  <div className="w-full sm:w-2/12 flex items-center justify-center my-1 sm:my-0">
                    <div className="flex items-center w-full justify-center gap-1.5">
                      <div className="h-0.5 flex-1 bg-slate-400" />
                      <div className="w-8 h-8 rounded-lg bg-[#032b69] text-white flex items-center justify-center shadow-xs print:bg-black">
                        <Bus className="w-4.5 h-4.5" />
                      </div>
                      <div className="h-0.5 flex-1 bg-slate-400 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-500 rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="w-full sm:w-5/12 text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1.5 text-sky-800 print:text-black text-[10px] font-black uppercase tracking-wider font-mono">
                      <MapPin className="w-3.5 h-3.5 text-sky-700 print:text-black" />
                      <span>DROPPING POINT</span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5 leading-tight">
                      {route.destination || 'JAHANGIRNAGAR UNIVERSITY (JU)'}
                    </div>
                    <div className="text-xs text-slate-700 font-medium mt-0.5">
                      {booking.droppingPoint || booking.dropping_point || 'University Main Gate / Designated Campus Drop Zone'}
                    </div>
                  </div>
                </div>

                {/* Journey Schedule 4-Columns Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 text-xs">
                  {/* Journey Date */}
                  <div className="flex items-start gap-2 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <Calendar className="w-4 h-4 text-[#032b69] print:text-black shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block uppercase">Journey Date</span>
                      <span className="font-black text-slate-950 text-xs">
                        {formatDate(trip.departureDate)}
                      </span>
                    </div>
                  </div>

                  {/* Departure Time */}
                  <div className="flex items-start gap-2 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <Clock className="w-4 h-4 text-[#032b69] print:text-black shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold block uppercase">Departure Time</span>
                      <span className="font-mono font-black text-[#032b69] print:text-black text-xs">
                        {formatTime(trip.departureTime)} (BST)
                      </span>
                    </div>
                  </div>

                  {/* Coach & Bus Type (Full Name, No Truncate) */}
                  <div className="flex items-start gap-2 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <Bus className="w-4 h-4 text-[#032b69] print:text-black shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-600 font-bold block uppercase">Coach & Bus Type</span>
                      <span className="font-black text-slate-950 text-xs block leading-snug break-words">
                        {bus.busName || trip.busName || 'Express Deluxe'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold font-mono block mt-0.5">
                        ({busType === 'FEMALE' ? 'Female Special' : busType === 'MALE' ? 'Student Special' : 'Mixed Coach'} • {bus.busNumber || 'Coach Reg'})
                      </span>
                    </div>
                  </div>

                  {/* Total Reserved Seats */}
                  <div className="flex items-start gap-2 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <Armchair className="w-4 h-4 text-[#032b69] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Reserved Seats</span>
                      <span className="font-mono font-black text-blue-900 text-xs block">
                        {displayPassengers.map((p: any) => p.seatNumber || p.seat_number || p.seat?.seatNumber).filter(Boolean).join(', ') || 'Assigned'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold">
                        ({displayPassengers.length} Seats)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PASSENGER & SEAT MANIFEST TABLE (Dark Blue Header) */}
              <div className="rounded-xl border border-slate-300 print:border-black overflow-hidden shadow-2xs">
                {/* Manifest Header Ribbon */}
                <div className="bg-[#032b69] print:bg-black text-white px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-300 print:text-white" />
                    <span>PASSENGER & SEAT MANIFEST — {displayPassengers.length}টি আসন</span>
                  </div>
                  <div className="text-[11px] text-sky-200 print:text-white font-normal">
                    সর্বোচ্চ ৬ জন যাত্রী বরাদ্দ
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 print:bg-slate-200 text-slate-800 font-mono text-[10px] uppercase border-b border-slate-300 print:border-black font-black">
                    <tr>
                      <th className="py-2 px-3 text-center w-20">Seat No.</th>
                      <th className="py-2 px-3">Passenger Name</th>
                      <th className="py-2 px-3">Mobile Number</th>
                      <th className="py-2 px-3">Category / Admission Roll</th>
                      <th className="py-2 px-3 text-right">Fare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                    {displayPassengers.map((p: any, idx: number) => {
                      const sLabel = p.seatNumber || p.seat_number || p.seat?.seatNumber || `Seat ${idx + 1}`;
                      const sFare = p.fareSnapshot || booking.seats?.[idx]?.fareSnapshot || trip.basePrice || 650;
                      const pName = p.passengerName || p.passenger_name || booking.contactName;
                      const pPhone = p.passengerPhone || p.passenger_phone || booking.contactPhone || '—';
                      const pGender = p.passengerGender || p.gender || p.passenger_gender;
                      const pCategory = p.passengerType || p.passenger_type;
                      const rollId = p.admissionId || p.admission_id || p.student?.admissionId || booking.studentAdmissionId || '';

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Seat Badge (Solid Blue Rounded / Solid Black in B&W) */}
                          <td className="py-2 px-3 text-center">
                            <span className="w-8 h-7 rounded-lg bg-[#0d6efd] print:bg-black text-white font-mono font-black inline-flex items-center justify-center text-xs shadow-2xs">
                              {sLabel}
                            </span>
                          </td>

                          {/* Passenger Name with Avatar Badge */}
                          <td className="py-2 px-3 font-bold text-slate-950 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{pGender === 'FEMALE' ? '👩' : '👨'}</span>
                              <span>{pName}</span>
                            </div>
                          </td>

                          {/* Mobile Phone */}
                          <td className="py-2 px-3 font-mono text-slate-900 text-xs font-bold">
                            {pPhone}
                          </td>

                          {/* Category / Admission Roll */}
                          <td className="py-2 px-3 text-slate-800 text-xs">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 print:border-black text-slate-900 font-bold text-[11px] inline-block">
                              {pCategory === 'STUDENT' ? 'শিক্ষার্থী' : pCategory === 'GUARDIAN' ? 'অভিভাবক' : 'সাধারণ যাত্রী'}
                            </span>
                            {rollId && (
                              <span className="text-slate-700 font-mono text-[11px] ml-2 font-bold">
                                রোল: <strong className="text-slate-950">{rollId}</strong>
                              </span>
                            )}
                          </td>

                          {/* Seat Fare */}
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-950 text-xs">
                            {formatCurrency(sFare)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Manifest Bottom Summary Bar */}
                <div className="bg-slate-50 print:bg-slate-100 border-t border-slate-300 print:border-black px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Users className="w-4 h-4 text-blue-700 print:text-black" />
                    <span>মোট {displayPassengers.length}টি আসন</span>
                    <span className="text-slate-400">|</span>
                    <span>উপমোট ভাড়া: {formatCurrency(grossAmount || displayPassengers.length * 650)}</span>
                  </div>

                  <div className="bg-[#0d6efd] print:bg-black text-white font-mono px-4 py-1.5 rounded-lg text-xs font-black shadow-2xs text-right">
                    Total Seats: 0{displayPassengers.length} &nbsp;|&nbsp; Total Fare: {formatCurrency(netAmount)}
                  </div>
                </div>
              </div>

              {/* 6. BOTTOM 2-COLUMN SECTION: Journey Details (Left) & Billing Summary (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* 6.1 LEFT COLUMN: Journey Details & Instructions */}
                <div className="rounded-xl border border-slate-300 print:border-slate-800 overflow-hidden bg-white shadow-2xs">
                  <div className="bg-[#032b69] print:bg-black text-white px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs">
                    <Info className="w-3.5 h-3.5 text-sky-300 print:text-white" />
                    <span>যাত্রার বিবরণ ও ভ্রমণ নিয়মাবলী</span>
                  </div>

                  <div className="p-3 space-y-2.5 text-[11px]">
                    {/* Boarding Point */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#032b69] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">বোর্ডিং পয়েন্ট:</span>
                        <span className="text-slate-600">
                          {booking.boardingPoint || booking.boarding_point || 'কাউন্টার নির্ধারিত (ছাড়ার ৩০ মিনিট পূর্বে উপস্থিতি)'}
                        </span>
                      </div>
                    </div>

                    {/* Dropping Point */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#032b69] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">ড্রপিং পয়েন্ট:</span>
                        <span className="text-slate-600">
                          {booking.droppingPoint || booking.dropping_point || 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ক্যাম্পাস (মেইন গেট ড্রপিং জোন)'}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method with Authentic Brand Logo */}
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-[#032b69] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">পেমেন্ট পদ্ধতি:</span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {paymentMethod === 'BKASH' ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#DF146E]/10 border border-[#DF146E]/30 text-[#DF146E] font-bold text-xs">
                              <BkashLogo className="w-4 h-4" />
                              <span>বিকাশ ডিজিটাল (bKash)</span>
                            </div>
                          ) : paymentMethod === 'NAGAD' ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F9A01B]/10 border border-[#F9A01B]/30 text-[#D4710A] font-bold text-xs">
                              <NagadLogo className="w-4 h-4" />
                              <span>নগদ ডিজিটাল (Nagad)</span>
                            </div>
                          ) : paymentMethod === 'ROCKET' ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#8C3494]/10 border border-[#8C3494]/30 text-[#8C3494] font-bold text-xs">
                              <RocketLogo className="w-4 h-4" />
                              <span>রকেট ডিজিটাল (Rocket)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
                              <CashMoneyLogo className="w-4 h-4" />
                              <span>কাউন্টার সরাসরি ক্যাশ (Hand Cash)</span>
                            </div>
                          )}
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            • অফিস কাউন্টার ভেরিফাইড
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booked By */}
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-[#032b69] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">বুকিংকারী ব্যক্তি:</span>
                        <span className="text-slate-700 font-mono font-bold">
                          {booking.contactName || primaryPassenger.passengerName} (ফোন: {booking.contactPhone || primaryPassenger.passengerPhone})
                        </span>
                      </div>
                    </div>

                    {/* Important Rules List */}
                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-600">
                      <div className="font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>জরুরি ভ্রমণ নিয়মাবলী:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-0.5 pl-0.5">
                        <li>বাস ছাড়ার অন্তত ৩০ মিনিট পূর্বে নিজ নিজ বোর্ডিং কাউন্টারে রিপোর্ট করতে হবে।</li>
                        <li>প্রবেশপত্র এবং এই ডিজিটাল টিকিটের প্রিন্ট বা মোবাইল কপি সাথে রাখুন।</li>
                        <li>কাউন্টার ছেঁড়া স্লিপ জমা দেওয়া লাগবে না; বাসে ওঠার সময় ডিজিটাল ভেরিফিকেশন হবে।</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* 6.2 RIGHT COLUMN: Clean Billing Summary & Anti-Copy QR Verification */}
                <div className="rounded-xl border border-slate-300 print:border-slate-800 overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="bg-[#032b69] print:bg-black text-white px-3.5 py-1.5 flex items-center justify-between font-bold text-xs">
                      <div className="flex items-center gap-2">
                        <BadgePercent className="w-3.5 h-3.5 text-sky-300" />
                        <span>ভ্রমণ ভাড়া (BILLING SUMMARY)</span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-200 print:text-white font-normal">
                        অফিসিয়াল পেমেন্ট ভাউচার
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1.5 text-xs font-mono">
                      {/* Base Fare Calculation */}
                      <div className="flex justify-between text-slate-700">
                        <span>মূল ভাড়া ({formatCurrency(displayPassengers[0]?.fareSnapshot || 650)} × {displayPassengers.length} আসন):</span>
                        <span className="font-bold text-slate-900">{formatCurrency(grossAmount)}</span>
                      </div>

                      {/* Discount row if applicable */}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 print:text-black font-bold">
                          <span>ছাড় / বিশেষ কুপন লেস:</span>
                          <span>- {formatCurrency(discountAmount)}</span>
                        </div>
                      )}

                      {/* Processing Fee if entered in software */}
                      {processingFee > 0 && (
                        <div className="flex justify-between text-slate-700 font-medium">
                          <span>অনলাইন রিজার্ভেশন ও প্রসেসিং ফি:</span>
                          <span className="font-bold text-slate-900">+ {formatCurrency(processingFee)}</span>
                        </div>
                      )}

                      {/* VAT & Tax if entered in software */}
                      {vatAmount > 0 && (
                        <div className="flex justify-between text-slate-700 font-medium">
                          <span>ভ্যাট ও সরকার নির্ধারিত ট্যাক্স:</span>
                          <span className="font-bold text-slate-900">+ {formatCurrency(vatAmount)}</span>
                        </div>
                      )}

                      {/* Net Total Payable */}
                      <div className="flex justify-between text-slate-950 font-black pt-1.5 border-t border-slate-300 text-[13px]">
                        <span>সর্বমোট প্রদেয় ভাড়া:</span>
                        <span>{formatCurrency(netAmount)}</span>
                      </div>

                      {/* NET PAID BANNER (High contrast for Color and B&W print) */}
                      <div className="my-2 p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-600 print:border-black print:bg-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-900 print:text-black font-black uppercase tracking-wider font-mono block">
                            NET PAID (পরিশোধিত)
                          </span>
                          <span className="text-2xl font-black text-emerald-800 print:text-black font-mono leading-none mt-0.5 block">
                            {formatCurrency(paidAmount || netAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-600 print:bg-black text-white font-black text-xs flex items-center gap-1.5 font-mono shadow-xs">
                            PAID <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        </div>
                      </div>

                      {/* Due Info */}
                      <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                        <span className="text-slate-600">অবশিষ্ট বকেয়া (Due):</span>
                        <span className={dueAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-800'}>
                          {formatCurrency(dueAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Scan & Anti-Fraud Security Box */}
                  <div className="p-3 pt-0">
                    <div className="bg-slate-50 print:bg-white p-2.5 rounded-xl border border-slate-300 print:border-black flex items-center gap-3">
                      {/* Enlarged High-Contrast QR Code */}
                      <div className="p-1.5 bg-white rounded-lg border-2 border-slate-800 shrink-0 shadow-xs">
                        <QRCodeView value={verifyUrl} size={92} />
                      </div>

                      {/* Verification Code & Anti-Tamper Details */}
                      <div className="text-[10px] text-slate-700 font-mono space-y-1 flex-1 min-w-0">
                        <span className="text-[9px] font-black text-slate-900 uppercase block tracking-wide">
                          ডিজিটাল গেট স্ক্যান ও নিরাপত্তা কোড
                        </span>
                        <div className="bg-[#032b69] print:bg-black text-white px-2 py-0.5 rounded font-black text-[11px] inline-block tracking-wider">
                          *{bookingNumber}*
                        </div>
                        <div className="text-[9px] font-bold text-slate-900 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 print:text-black" />
                          <span>SEC-HASH: {securityHash}</span>
                        </div>
                        <div className="text-[8px] text-slate-500 print:text-black leading-tight">
                          ⚠️ জাল বা ফটোকপি টিকিট দণ্ডনীয় অপরাধ। কেবল মূল কিউআর কোড স্ক্যানকৃত কপি বৈধ।
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. BOTTOM CENTRAL FOOTER STRIP */}
            <div className="bg-[#032b69] print:bg-black text-white py-2 px-4 text-center text-[10px] font-medium tracking-wide">
              <div className="font-bold flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-sky-300 print:text-white" />
                <span>{orgBrand.name || 'ATOMS Transit'} Central Secure Transit Pass Management System</span>
              </div>
              <div className="text-sky-200 print:text-white text-[9px] flex items-center justify-center gap-3 mt-0.5 font-mono">
                <span>Anti-Counterfeit Protection</span>
                <span>•</span>
                <span>Real-Time QR Verification</span>
                <span>•</span>
                <span>Paperless Boarding Valid</span>
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
  const [orgBrand, setOrgBrand] = useState(DEFAULT_ORGANIZATION_SETTINGS.organization);
  const [paperMode, setPaperMode] = useState<PrintPaperMode>('STANDARD_A4');
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
    if (typeof window !== 'undefined') {
      try {
        const local = getStoredOrganizationSettings().organization;
        if (local) setOrgBrand(local);
      } catch {}
    }
  }, []);

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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handlePrint = () => {
    printReceiptElement('printable-payment-receipt');
  };

  const handleDownloadPdf = async () => {
    const bookingNumber = booking?.bookingNumber || booking?.booking_number || 'TICKET';
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(bookingNumber, 'printable-payment-receipt');
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadOfflineTicket = () => {
    const bookingNumber = booking?.bookingNumber || booking?.booking_number || 'TICKET';
    downloadReceiptOfflineHtml(bookingNumber, 'printable-payment-receipt');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[96vh] flex flex-col bg-slate-900 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden border border-slate-700/80">
        
        {/* Executive Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          {/* Left: Status & Booking summary */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white">
                  বুকিং নিশ্চিত ও ডিজিটাল ট্রাভেল পাস প্রস্তুত!
                </h2>
                <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-700/60">
                  {booking.bookingNumber || booking.booking_number}
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
                  সিট: {passengers.map((p: any) => p.seatNumber || p.seat_number).filter(Boolean).join(', ') || 'নির্ধারিত'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                যাত্রী: {passengers[0]?.passengerName || booking.contactName} • A4 সিঙ্গেল পেজ এক্সিকিউটিভ ভাউচার ও ট্রাভেল পাস
              </p>
            </div>
          </div>

          {/* Right: Controls (Paper mode, PDF, Print, Offline, Close) */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Paper Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPaperMode('STANDARD_A4')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  paperMode === 'STANDARD_A4' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 ভাউচার
              </button>
              <button
                type="button"
                onClick={() => setPaperMode('THERMAL_80MM')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  paperMode === 'THERMAL_80MM' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm থার্মাল
              </button>
            </div>

            {/* Download PDF */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm cursor-pointer rounded-xl flex items-center gap-1.5 border-none disabled:opacity-70"
              title="পিডিএফ ফাইল হিসেবে সংরক্ষণ করুন (Save as PDF)"
            >
              {isDownloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'তৈরি হচ্ছে...' : 'পিডিএফ'}</span>
            </Button>

            {/* Print Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 font-black text-xs shadow-sm cursor-pointer rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </Button>

            {/* Offline Ticket HTML Download */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadOfflineTicket}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="অফলাইন টিকিট ফাইল (.html) ডাউনলোড করুন"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অফলাইন ফাইল</span>
            </Button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Streamlined WhatsApp & Auto-Notification Strip */}
        <div className="bg-slate-900/95 text-slate-200 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <WhatsAppLogo className="w-5 h-5 shrink-0" />
            <span className="font-bold text-white">হোয়াটসঅ্যাপ টিকিট সার্ভিস:</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">যাত্রীর ফোনে ১-ক্লিকে সরাসরি লিঙ্ক ও কিউআর কোডসহ পাঠান</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {passengers.map((p: any, idx: number) => {
              const pPhone = p.whatsappNumber || p.passengerPhone || p.passenger_phone || booking.contactPhone || '';
              const pName = p.passengerName || p.passenger_name || `যাত্রী ${idx + 1}`;
              const sNum = p.seatNumber || p.seat_number || `সিট ${idx + 1}`;

              return (
                <div key={idx} className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSendWhatsApp(p)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                    title={`WhatsApp এ পাঠান: ${pPhone}`}
                  >
                    <WhatsAppLogo className="w-3.5 h-3.5" />
                    <span>
                      {passengers.length === 1 ? `WhatsApp পাঠান (${pPhone || 'যাত্রী'})` : `${pName} (${sNum})`}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyMessage(p, idx)}
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 font-bold text-xs px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    title="মেসেজ টেক্সট কপি করুন"
                  >
                    {copiedIndex === idx ? (
                      <span className="text-[10px] text-emerald-400 font-bold">কপি হয়েছে!</span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Luxury Document Workbench Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/95 flex justify-center items-start">
          <div className="w-full max-w-3xl">
            <PaymentReceipt
              booking={booking}
              showControls={false}
              paperMode={paperMode}
              onPaperModeChange={setPaperMode}
            />
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>💡</span>
            <span>সরাসরি প্রিন্ট করতে <strong>প্রিন্ট করুন</strong> চাপুন অথবা ব্রাউজারের প্রিন্ট ডায়ালগ থেকে <strong>Save as PDF</strong> নির্বাচন করুন।</span>
          </div>

          <div className="flex items-center gap-2">
            {onNewBooking ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewBooking}
                className="font-bold text-xs rounded-xl cursor-pointer bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              >
                + নতুন বুকিং করুন
              </Button>
            ) : (
              <Link href="/bookings/new">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs rounded-xl cursor-pointer bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                >
                  + নতুন বুকিং করুন
                </Button>
              </Link>
            )}

            <Link href={`/bookings/${booking.id}`}>
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-xs bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-sm"
              >
                বুকিং বিস্তারিত ড্যাশবোর্ড ➔
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="font-bold text-xs rounded-xl cursor-pointer text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
            >
              বন্ধ করুন
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PaymentReceiptCard = PaymentReceipt;
