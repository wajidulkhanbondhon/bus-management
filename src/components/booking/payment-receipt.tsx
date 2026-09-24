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
  OrganizationSettingsState,
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
import {
  A4_W,
  A4_H,
  SHEET_ID,
  THERMAL_W_PX,
  isThermalSheet,
  ensureSheetPageSize,
  useTicketFit,
  useSheetViewZoom,
  useSheetPageSize,
  type PaperMode
} from '@/lib/ticket-print';

export interface AccommodationInfo {
  hasHotel: boolean;
  hotelName: string;
  roomType: string;
  checkIn?: string;
  checkOut?: string;
  locationAddress?: string;
  contactPerson?: string;
  hotelFee?: number;
}

export function extractAccommodationInfo(booking: any): AccommodationInfo | null {
  if (!booking) return null;
  const acc = booking.accommodation || booking.hotelAccommodation;
  const trip = booking.trip || {};

  if (acc && (acc.hotelName || acc.hasHotel)) {
    return {
      hasHotel: true,
      hotelName: acc.hotelName || 'ক্যাম্পাস গেস্টহাউস অ্যান্ড স্যুটস',
      roomType: acc.roomType || 'ডিলাক্স শেয়ার্ড রুম',
      checkIn: acc.checkIn || 'দুপুর ১২:০০',
      checkOut: acc.checkOut || 'পরবর্তী দিন সকাল ১০:০০',
      locationAddress: acc.locationAddress || 'ক্যাম্পাস সংলগ্ন আবাসন জোন',
      contactPerson: acc.contactPerson || '০১৭০০-০০০০০০',
      hotelFee: Number(acc.hotelFee || acc.price || 0)
    };
  }

  const tripNotes = trip.notes || '';
  if (trip.hasHotelPackage || tripNotes.includes('HOTEL PACKAGE')) {
    const feeMatch = tripNotes.match(/৳\s*(\d+)/);
    const nameMatch = tripNotes.match(/HOTEL PACKAGE:\s*([^-]+)/i);
    return {
      hasHotel: true,
      hotelName: nameMatch ? nameMatch[1].trim() : 'ক্যাম্পাস রেসিডেনসিয়াল প্যাকেজ',
      roomType: 'ডিলাক্স এসি শেয়ার্ড রুম',
      checkIn: 'দুপুর ১২:০০',
      checkOut: 'পরবর্তী দিন সকাল ১০:০০',
      locationAddress: 'ক্যাম্পাস এরিয়া',
      contactPerson: '০১৭০০-০০০০০০',
      hotelFee: feeMatch ? Number(feeMatch[1]) : 0
    };
  }

  return null;
}

export function cleanLocationName(str: string | null | undefined, fallback: string = ''): string {
  if (!str) return fallback;
  return str
    .replace(/\s*\(\s*Talaimari\s*\/\s*Bhadra\s*\/\s*Railgate\s*\)/gi, '')
    .replace(/\s*\([^)]*talaimari[^)]*\)/gi, '')
    .trim() || fallback;
}

export function formatSafeTicketDate(val: any): string {
  if (!val) return 'নির্ধারিত তারিখ';
  const str = String(val).trim();
  const d = new Date(str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).replace(/[\u202f\u00a0]/g, ' ');
}

export function formatSafeTicketTime(val: any): string {
  if (!val) return 'নির্ধারিত সময়';
  const str = String(val).trim();
  if (/(AM|PM)/i.test(str)) return str.replace(/[\u202f\u00a0]/g, ' ');
  if (str.includes(':') && !str.includes('-') && !str.includes('T')) {
    const parts = str.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (!isNaN(h)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }
    return str.replace(/[\u202f\u00a0]/g, ' ');
  }
  const d = new Date(str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }).replace(/[\u202f\u00a0]/g, ' ');
}

export function buildWhatsAppTicketMessage(booking: any, passenger?: any, branding?: any): { phone: string; message: string; waUrl: string } {
  const bNumber = booking?.bookingNumber || booking?.booking_number || 'N/A';
  const primaryP = passenger || booking?.passengers?.[0];
  const pName = primaryP?.passengerName || primaryP?.passenger_name || booking?.contactName || 'সম্মানিত যাত্রী';
  const rawPhone = primaryP?.passengerPhone || primaryP?.passenger_phone || booking?.contactPhone || '';
  let waPhone = rawPhone.replace(/\D/g, '');
  if (waPhone.startsWith('01') && waPhone.length === 11) {
    waPhone = `88${waPhone}`;
  }

  const tripObj = booking?.trip || {};
  const busObj = tripObj.bus || {};
  const routeObj = tripObj.route || {};
  const rawOrigin = cleanLocationName(routeObj.origin || 'ঢাকা', 'ঢাকা');
  const routeName = routeObj.routeName ? cleanLocationName(routeObj.routeName, `${rawOrigin} ➔ ${routeObj.destination || 'ক্যাম্পাস'}`) : `${rawOrigin} ➔ ${routeObj.destination || 'ক্যাম্পাস'}`;

  const seatsStr = booking?.passengers?.map((p: any) => p.seatNumber || p.seat_number).filter(Boolean).join(', ') ||
                   booking?.seats?.map((s: any) => s.seatNumber || s.seat_number).filter(Boolean).join(', ') || 'N/A';

  const depDateRaw = tripObj.departureDate || tripObj.departure_date || booking?.departureDate || booking?.departure_date || booking?.journeyDate || booking?.journey_date;
  const depTimeRaw = tripObj.departureTime || tripObj.departure_time || booking?.departureTime || booking?.departure_time;

  const depDate = formatSafeTicketDate(depDateRaw);
  const depTime = formatSafeTicketTime(depTimeRaw);
  const boardingStr = cleanLocationName(booking?.boardingPoint || booking?.boarding_point || tripObj?.boardingPoint, 'কাউন্টার পয়েন্ট');
  const droppingStr = booking?.droppingPoint || booking?.dropping_point || tripObj?.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';

  const paidAmt = booking?.paidAmount ?? booking?.paid_amount ?? booking?.grossAmount ?? booking?.gross_amount ?? 0;
  const dueAmt = booking?.dueAmount ?? booking?.due_amount ?? 0;
  const pmtStatus = (booking?.paymentStatus || booking?.payment_status) === 'PAID' || dueAmt === 0 ? 'পরিশোধিত (PAID)' : `বকেয়া ৳${dueAmt}`;

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://atoms-transit.com';
  const verifyUrl = `${hostUrl}/bookings/${booking?.id || ''}`;

  const orgName = branding?.name || 'ATOMS Transit Management';
  const helpline = branding?.phone || '01711000001';

  const hotelInfo = extractAccommodationInfo(booking);
  let hotelSection = '';
  if (hotelInfo && hotelInfo.hasHotel) {
    hotelSection = `\n🏨 *হোটেল বুকিং ও আবাসন ভাউচার (CONFIRMED):*
🏢 *হোটেল/হোস্টেল:* ${hotelInfo.hotelName}
🛏️ *রুম টাইপ:* ${hotelInfo.roomType}
⏰ *চেক-ইন:* ${hotelInfo.checkIn || 'দুপুর ১২:০০'} | *চেক-আউট:* ${hotelInfo.checkOut || 'সকাল ১০:০০'}
📍 *ঠিকানা:* ${hotelInfo.locationAddress || 'ক্যাম্পাস সংলগ্ন'}
📞 *কেয়ারটেকার:* ${hotelInfo.contactPerson || helpline}\n`;
  }

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
━━━━━━━━━━━━━━━━━━━━${hotelSection}
🔗 *ডিজিটাল টিকিট ও কিউআর কোড (QR Code) লিঙ্ক:*
${verifyUrl}

*(বাসে ওঠার সময় এই লিঙ্কের ডিজিটাল টিকিট ও কিউআর কোডটি প্রদর্শন করুন)*

📞 হেল্পলাইন: ${helpline}
আপনার যাত্রা শুভ ও নিরাপদ হোক!
*${orgName}*`;

  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
  return { phone: rawPhone, message, waUrl };
}

export type TicketViewMode = 'FULL' | 'BOARDING_PASS' | 'CASH_CHALLAN';
export type PrintPaperMode = PaperMode;

/**
 * Direct print of the ticket sheet.
 *
 * The sheet is a fixed A4 box, so the page size only has to be pinned for the
 * duration of the print — everything else (scaling to one page, colours) is
 * already baked into the sheet's own styles.
 */
export function printReceiptElement(elementId: string = SHEET_ID) {
  if (typeof window === 'undefined') return;
  const sheet = document.getElementById(elementId);
  const mode: PaperMode = isThermalSheet(sheet) ? 'THERMAL_80MM' : 'STANDARD_A4';
  ensureSheetPageSize(mode);
  window.focus();
  window.print();
}

/**
 * Download the ticket as a 1-page PDF.
 *
 * The sheet is rasterised at its natural A4 size and placed onto an A4 page
 * minus any margins, so the PDF matches the browser and print output exactly.
 */
export async function downloadReceiptAsPdf(bookingNumber: string, elementId: string = SHEET_ID) {
  if (typeof window === 'undefined') return;
  const sheet = document.getElementById(elementId);
  if (!sheet) {
    printReceiptElement(elementId);
    return;
  }

  const thermal = isThermalSheet(sheet);
  const width = thermal ? THERMAL_W_PX : A4_W;
  const height = thermal ? sheet.scrollHeight || 400 : A4_H;

  const offscreen = document.createElement('div');
  offscreen.setAttribute('aria-hidden', 'true');
  Object.assign(offscreen.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${width}px`,
    height: `${height}px`,
    background: '#ffffff',
    zIndex: '-99999',
    opacity: '0',
    pointerEvents: 'none'
  });

  // Clone the sheet at 1:1 so the on-screen preview zoom cannot distort the PDF.
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.style.zoom = '1';
  clone.style.margin = '0';
  clone.style.width = `${width}px`;
  clone.style.height = thermal ? 'auto' : `${A4_H}px`;
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    let html2canvas: any;
    try {
      const h2cPro = await import('html2canvas-pro');
      html2canvas = h2cPro.default || h2cPro;
    } catch {
      const h2c = await import('html2canvas');
      html2canvas = h2c.default || h2c;
    }
    const { jsPDF } = await import('jspdf');

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 120));

    const rendered = await html2canvas(offscreen, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width,
      height,
      windowWidth: A4_W
    });

    const imgData = rendered.toDataURL('image/png');

    if (thermal) {
      const pdfWidth = 80;
      const imgWidth = pdfWidth - 4;
      const imgHeight = (rendered.height * imgWidth) / rendered.width;
      const pdfHeight = Math.max(100, Math.ceil(imgHeight) + 6);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 2, 3, imgWidth, imgHeight);
      pdf.save(`ticket-pos-${bookingNumber}.pdf`);
    } else {
      const pageWidth = 210;
      const pageHeight = 297;
      // Preserve the sheet's aspect ratio so it can never spill onto a 2nd page.
      const ratio = Math.min(pageWidth / width, pageHeight / height);
      const drawWidth = width * ratio;
      const drawHeight = height * ratio;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(
        imgData,
        'PNG',
        (pageWidth - drawWidth) / 2,
        (pageHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      pdf.save(`ticket-${bookingNumber}.pdf`);
    }
  } catch (err) {
    console.error('PDF generation error, falling back to print:', err);
    printReceiptElement(elementId);
  } finally {
    if (document.body.contains(offscreen)) {
      document.body.removeChild(offscreen);
    }
  }
}

/**
 * Self-Contained Offline HTML Download: Extracts runtime CSS rules directly from the DOM
 * so the file opens and prints 100% styled even without internet or server connection.
 */
export function downloadReceiptOfflineHtml(bookingNumber: string, elementId: string = SHEET_ID) {
  if (typeof window === 'undefined') return;
  const receiptEl = document.getElementById(elementId);
  if (!receiptEl) {
    printReceiptElement(elementId);
    return;
  }

  const thermal = isThermalSheet(receiptEl);

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
    .offline-banner { max-width: 790px; margin: 0 auto 16px auto; padding: 14px 24px; background: linear-gradient(135deg, #059669, #047857); color: #fff; border-radius: 14px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px rgba(5,150,105,0.25); }
    .offline-banner button { background: #fff; color: #047857; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    #printable-payment-receipt { box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
    #printable-payment-receipt[data-paper-mode="THERMAL_80MM"] { width: 80mm; height: auto; }
    @page { ${thermal ? 'size: auto; margin: 3mm 4mm;' : 'size: A4 portrait; margin: 0;'} }
    @media print {
      body { background: #fff; padding: 0; }
      .offline-banner { display: none !important; }
      #printable-payment-receipt { box-shadow: none !important; margin: 0 auto !important; page-break-inside: avoid !important; break-inside: avoid !important; }
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


// ============================================================================
// CRISP HIGH-RESOLUTION MINI BUS SEAT MAP (AUTHENTIC BANGLADESH RHD LAYOUT)
// Single Unified Coach: Front on TOP, Rear on BOTTOM, Door on LEFT, Driver on RIGHT
// ============================================================================
function MiniBusSeatMap({
  allocatedSeats = [],
  busType = 'MIXED',
  isEcoMode = false,
  isCompact = false
}: {
  allocatedSeats: string[];
  busType?: string;
  isEcoMode?: boolean;
  isCompact?: boolean;
}) {
  const normalizedAllocated = React.useMemo(() => {
    return new Set(
      allocatedSeats.map(s => String(s).trim().toUpperCase().replace(/\s+/g, ''))
    );
  }, [allocatedSeats]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Detect extra seats (EX-1, EX-2, CABIN, GUIDE, etc.) not in standard A1-J5 grid
  const standardSeatRegex = /^[A-J][1-5]$/i;
  const extraAllocatedSeats = React.useMemo(() => {
    return Array.from(normalizedAllocated).filter(s => !standardSeatRegex.test(s));
  }, [normalizedAllocated]);

  const renderSeatBox = (sNum: string, isWindow: boolean) => {
    const isAllocated = normalizedAllocated.has(sNum);
    return (
      <div
        key={sNum}
        title={isAllocated ? `আপনার বরাদ্দকৃত আসন: ${sNum}` : `আসন নম্বর: ${sNum}`}
        className={`group relative flex-1 min-w-0 ${
          isCompact ? 'h-6 text-[8px]' : 'h-6.5 text-[8.5px]'
        } rounded-xl sm:rounded-2xl p-0.5 flex flex-col items-center justify-between font-mono select-none transition-all border-2 ${
          isAllocated
            ? isEcoMode
              ? 'bg-black text-white border-black font-black'
              : 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 text-white border-emerald-400 shadow-sm font-black ring-2 ring-emerald-400/50'
            : isEcoMode
            ? 'bg-white border-black text-black font-bold'
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 border-slate-300 text-slate-800 font-bold shadow-2xs hover:border-blue-500 hover:shadow-xs'
        }`}
      >
        {/* Curved Headrest Pillow Bar at Top */}
        <div
          className={`w-3/5 h-[3px] rounded-full shrink-0 mt-0.5 transition-all ${
            isAllocated
              ? isEcoMode ? 'bg-white/90' : 'bg-emerald-100 shadow-xs'
              : isEcoMode ? 'bg-black/30' : 'bg-slate-300 shadow-2xs'
          }`}
        />

        {/* Seat Label & Allocation Badge */}
        <div className="flex-1 w-full flex items-center justify-center px-0.5 leading-none">
          {isAllocated ? (
            <span className="flex items-center justify-center gap-0.5 px-0.5 truncate leading-none">
              <BadgeCheck className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white shrink-0`} />
              <span className="leading-none truncate font-black text-[9px]">{sNum}</span>
            </span>
          ) : (
            <span className="leading-none truncate text-slate-800 font-black text-[8.5px]">{sNum}</span>
          )}
        </div>

        {/* Bottom Soft Cushion Contour */}
        <div
          className={`w-2/3 h-[1.5px] shrink-0 mb-0.5 rounded-full ${
            isAllocated ? 'bg-emerald-800/40' : 'bg-slate-200'
          }`}
        />
      </div>
    );
  };

  return (
    <div suppressHydrationWarning className={`rounded-xl border overflow-hidden flex flex-col h-full justify-between ${
      isEcoMode
        ? 'bg-white border-black text-black'
        : 'bg-white border-slate-300 shadow-2xs'
    }`}>
      {/* Header Bar */}
      <div>
        <div className={`bg-[#032b69] text-white ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-[11.5px]'} flex items-center justify-between font-bold uppercase tracking-wide`}>
          <div className="flex items-center gap-1.5">
            <Bus className={isCompact ? "w-3 h-3 text-sky-300" : "w-3.5 h-3.5 text-sky-300"} />
            <span>বাস আসন অবস্থান (SEAT LOCATOR)</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-300 font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
            RHD COACH
          </span>
        </div>

        {/* Legend */}
        <div className={`${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[8.5px]'} bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold`}>
          <div className="flex items-center gap-1.5 text-emerald-800">
            <span className={`${isCompact ? 'w-3 h-3 text-[7px]' : 'w-3.5 h-3 text-[7.5px]'} rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-white font-black shadow-2xs`}>
              ✓
            </span>
            <span>আপনার আসন</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3'} rounded-full bg-white border-2 border-slate-400 inline-block`} />
            <span>অন্যান্য আসন</span>
          </div>
          <div className="text-slate-500 font-mono text-[8px]">
            [দরজা বামে • চালক ডানে]
          </div>
        </div>

        {/* Allocated Seats Quick Strip if seats exist */}
        {allocatedSeats.length > 0 && (
          <div className={`${isCompact ? 'px-2 py-0.5 text-[7.5px]' : 'px-2.5 py-1 text-[8.5px]'} bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between font-bold`}>
            <div className="flex items-center gap-1 text-emerald-900">
              <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>বরাদ্দকৃত আসন ({allocatedSeats.length}টি):</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {allocatedSeats.map(s => (
                <span key={s} className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-black text-[8px] shadow-2xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Realistic Unified Bus Coach Frame with Tinted Window Glass Sides */}
        <div className="p-2 w-full flex-1 flex flex-col justify-center">
          <div className={`w-full px-2 py-1.5 rounded-t-3xl rounded-b-2xl border-2 ${
            isEcoMode
              ? 'bg-white border-black'
              : 'bg-slate-50/60 border-slate-700 shadow-xs border-l-[3.5px] border-l-sky-600/40 border-r-[3.5px] border-r-sky-600/40'
          }`}>
            {/* Aerodynamic Windshield & Cockpit Header */}
            <div className={`flex items-center justify-between px-2 py-1 mb-1 text-[8px] rounded-t-2xl rounded-b-lg border font-bold ${
              isEcoMode
                ? 'bg-slate-100 border-black text-black'
                : 'bg-gradient-to-b from-sky-100 via-sky-50 to-white border-sky-300 text-sky-950 shadow-2xs'
            }`}>
              {/* Left Door */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-black shadow-2xs">
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                    <path d="M2 20h20" />
                    <circle cx="14" cy="12" r="1" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[7.5px] uppercase tracking-tight">দরজা (ENTRY)</span>
              </div>

              {/* Center Windshield Indicator */}
              <div className="px-2 py-0.5 rounded-full bg-white/90 border border-sky-200 text-slate-600 font-mono text-[7px] font-black uppercase tracking-wider shadow-2xs">
                ▲ সামনে (FRONT) ▲
              </div>

              {/* Right Driver Cabin with High-Contrast Solid Steering Wheel Console */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-300 text-[#032b69] font-black shadow-2xs">
                <span className="text-[7.5px] uppercase tracking-tight text-[#032b69] font-black">চালক (DRIVER)</span>
                <div className="w-4.5 h-4.5 rounded-full bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-blue-400">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <line x1="12" y1="2" x2="12" y2="9" />
                    <line x1="4.93" y1="19.07" x2="9.88" y2="14.12" />
                    <line x1="19.07" y1="19.07" x2="14.12" y2="14.12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Extra Seat Zone Callout if extra seats (EX-1, EX-2, CABIN, etc.) are booked */}
            {extraAllocatedSeats.length > 0 && (
              <div className="mb-1 p-0.5 rounded-md bg-amber-50 border border-amber-300 flex items-center justify-between gap-1 text-[7.5px]">
                <div className="flex items-center gap-1 font-bold text-amber-900">
                  <span>💺</span>
                  <span>অতিরিক্ত:</span>
                </div>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {extraAllocatedSeats.map(exSeat => (
                    <span key={exSeat} className="px-1 py-0.2 rounded bg-emerald-600 text-white font-mono font-black text-[7.5px] flex items-center gap-0.5">
                      <span>{exSeat}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coach Interior: Rows (Full-width, realistic 2x2 with central aisle runner) */}
            <div className="space-y-0.5">
              {rows.map((rowChar, rIdx) => {
                const isLastRow = rIdx === rows.length - 1;
                const s1 = `${rowChar}1`;
                const s2 = `${rowChar}2`;
                const s3 = `${rowChar}3`;
                const s4 = `${rowChar}4`;
                const s5 = `${rowChar}5`;

                if (isLastRow) {
                  return (
                    <div key={rowChar} className="flex items-center gap-1 w-full">
                      {renderSeatBox(s1, true)}
                      {renderSeatBox(s2, false)}
                      {renderSeatBox(s5, false)}
                      {renderSeatBox(s3, false)}
                      {renderSeatBox(s4, true)}
                    </div>
                  );
                }

                return (
                  <div key={rowChar} className="flex items-center justify-between gap-1 w-full">
                    {/* Left Window & Aisle pair (s1, s2) */}
                    <div className="flex-1 flex items-center gap-1">
                      {renderSeatBox(s1, true)}
                      {renderSeatBox(s2, false)}
                    </div>

                    {/* Center Gangway / Aisle Runner with Row Badge */}
                    <div className="w-5 sm:w-6 shrink-0 flex items-center justify-center">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200/95 border border-slate-300 text-slate-700 font-mono font-black text-[7.5px] flex items-center justify-center leading-none shadow-2xs">
                        {rowChar}
                      </span>
                    </div>

                    {/* Right Aisle & Window pair (s3, s4) */}
                    <div className="flex-1 flex items-center gap-1">
                      {renderSeatBox(s3, false)}
                      {renderSeatBox(s4, true)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rear Bumper & Taillights */}
            <div className="mt-1 pt-0.5 text-[7.5px] border-t border-dashed border-slate-300 flex items-center justify-between font-mono font-bold text-slate-500">
              <span className="text-rose-600 font-black">🔴 লাইট</span>
              <span className="text-[7px] text-slate-500">▼ পেছনে (REAR) ▼</span>
              <span className="text-rose-600 font-black">লাইট 🔴</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className={`${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[9px]'} bg-slate-100/70 border-t border-slate-200 text-center text-slate-600 font-bold`}>
        🚌 বাসে প্রবেশের পর আসন খুঁজে নিতে এই ম্যাপ অনুসরণ করুন
      </div>
    </div>
  );
}


type PaymentReceiptProps = {
  booking: any;
  showControls?: boolean;
  defaultViewMode?: TicketViewMode;
  defaultPaperMode?: PrintPaperMode;
  paperMode?: PrintPaperMode;
  onPaperModeChange?: (mode: PrintPaperMode) => void;
};

export function PaymentReceipt(props: PaymentReceiptProps) {
  if (!props.booking) return null;
  return <PaymentReceiptInner {...props} />;
}

function computeProcessingFeeFromSettings(fin: OrganizationSettingsState['finance'] | undefined, gross: number): number {
  if (!fin) return 0;
  if (fin.defaultProcessingFee !== undefined && Number(fin.defaultProcessingFee) > 0) {
    return Number(fin.defaultProcessingFee);
  }
  if (fin.serviceChargePercent && Number(fin.serviceChargePercent) > 0) {
    return Math.round((gross * Number(fin.serviceChargePercent)) / 100);
  }
  return 0;
}

function computeVatFromSettings(fin: OrganizationSettingsState['finance'] | undefined, gross: number): number {
  if (!fin) return 0;
  if (fin.taxCalculationType === 'FIXED' && fin.taxFixedAmount !== undefined && Number(fin.taxFixedAmount) > 0) {
    return Number(fin.taxFixedAmount);
  }
  if (fin.taxRatePercent && Number(fin.taxRatePercent) > 0) {
    return Math.round((gross * Number(fin.taxRatePercent)) / 100);
  }
  return 0;
}

function computeCashoutFromSettings(fin: OrganizationSettingsState['finance'] | undefined, gross: number): number {
  if (!fin || !fin.autoApplyMfsCashout) return 0;
  if (fin.mfsCashoutCalculationType === 'FIXED' && fin.defaultMfsCashoutFixed !== undefined && Number(fin.defaultMfsCashoutFixed) > 0) {
    return Number(fin.defaultMfsCashoutFixed);
  }
  if (fin.defaultMfsCashoutPercent && Number(fin.defaultMfsCashoutPercent) > 0) {
    return Math.round((gross * Number(fin.defaultMfsCashoutPercent)) / 100);
  }
  return 0;
}

function PaymentReceiptInner({
  booking,
  showControls = true,
  defaultViewMode = 'FULL',
  defaultPaperMode = 'STANDARD_A4',
  paperMode: controlledPaperMode,
  onPaperModeChange
}: PaymentReceiptProps) {
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

  // Full Organization Settings from Main Settings Store
  const [fullSettings, setFullSettings] = useState<OrganizationSettingsState>(DEFAULT_ORGANIZATION_SETTINGS);
  const [orgBrand, setOrgBrand] = useState(DEFAULT_ORGANIZATION_SETTINGS.organization);
  const [hostUrl, setHostUrl] = useState('https://atoms-transit.com');

  const reloadSettings = React.useCallback(() => {
    try {
      const stored = getStoredOrganizationSettings();
      if (stored) {
        setFullSettings(stored);
        if (stored.organization) setOrgBrand(stored.organization);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostUrl(window.location.origin);
      reloadSettings();

      const handleUpdate = (e?: any) => {
        if (e?.detail) {
          setFullSettings(e.detail);
          if (e.detail.organization) setOrgBrand(e.detail.organization);
        } else {
          reloadSettings();
        }
      };

      window.addEventListener('atoms_settings_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener('atoms_settings_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, [reloadSettings]);

  useEffect(() => {
    fetchOrganizationSettingsFromBackend()
      .then((settings) => {
        if (settings) {
          setFullSettings(settings);
          if (settings.organization) setOrgBrand(settings.organization);
        }
      })
      .catch(() => {});
  }, []);

  const trip = booking.trip || {};
  const bus = trip.bus || {};
  const route = trip.route || {};
  const passengers = booking.passengers || [];
  const primaryPassenger = passengers[0] || {};

  const rawPassengers = passengers.length > 0 ? passengers : (
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
          passengerType: 'STUDENT',
          admissionId: booking.studentAdmissionId || '—',
          fareSnapshot: booking.seats?.[0]?.fareSnapshot || trip.basePrice || trip.base_price || 550,
          passengerGender: 'MALE'
        }]
  );

  const seatCount = rawPassengers.length > 0 ? rawPassengers.length : 1;

  // Determine Gross Base Fare (উপমোট ভাড়া)
  const explicitGross = booking.grossAmount ?? booking.gross_amount;
  const bookingTotal = booking.totalAmount ?? booking.total_amount;
  const basePriceCandidate = trip.basePrice ?? trip.base_price;

  const derivedGrossAmount: number = explicitGross !== undefined && explicitGross !== null
    ? Math.max(0, Number(explicitGross))
    : (bookingTotal !== undefined && bookingTotal !== null && (!booking.processingFee && !booking.vatAmount && !booking.cashoutFee))
    ? Math.max(0, Number(bookingTotal))
    : Math.max(0, rawPassengers.reduce((sum: number, p: any) => {
        const itemFare = p.fareSnapshot ?? p.fare_snapshot ?? p.fare ?? basePriceCandidate;
        return sum + (itemFare ? Number(itemFare) : 0);
      }, 0) || (seatCount * (Number(basePriceCandidate) || 550)));

  const grossAmount = Math.max(0, derivedGrossAmount);
  const perSeatFare = seatCount > 0 ? Math.round(grossAmount / seatCount) : (Number(basePriceCandidate) || 550);

  // Dynamic passengers list strictly budgeted and styled for up to 6 seats with guaranteed uniform fareSnapshot
  const displayPassengers = (rawPassengers.slice(0, 6)).map((p: any, idx: number) => {
    const sFare = p.fareSnapshot ?? p.fare_snapshot ?? p.fare ?? booking.seats?.[idx]?.fareSnapshot ?? perSeatFare;
    return {
      ...p,
      fareSnapshot: Number(sFare) || perSeatFare
    };
  });

  const payments = booking.payments || [];
  const primaryPayment = payments[0] || {};
  const transactions = booking.transactions || [];
  const primaryTx = transactions[0] || {};

  // Live editable Billing Settings states — initialized dynamically from Main Settings (Finance)
  const hasBookingProcessingFee = (booking.processingFee ?? booking.processing_fee) !== undefined && (booking.processingFee ?? booking.processing_fee) !== null;
  const hasBookingVat = (booking.vatAmount ?? booking.vat_amount ?? booking.taxAmount) !== undefined && (booking.vatAmount ?? booking.vat_amount ?? booking.taxAmount) !== null;
  const hasBookingCashout = (booking.cashoutFee ?? booking.cashout_fee ?? booking.cashoutCharge) !== undefined && (booking.cashoutFee ?? booking.cashout_fee ?? booking.cashoutCharge) !== null;

  const [processingFee, setProcessingFee] = useState<number>(
    hasBookingProcessingFee
      ? Number(booking.processingFee ?? booking.processing_fee)
      : computeProcessingFeeFromSettings(fullSettings.finance, grossAmount)
  );
  const [vatAmount, setVatAmount] = useState<number>(
    hasBookingVat
      ? Number(booking.vatAmount ?? booking.vat_amount ?? booking.taxAmount)
      : computeVatFromSettings(fullSettings.finance, grossAmount)
  );
  const [cashoutFee, setCashoutFee] = useState<number>(
    hasBookingCashout
      ? Number(booking.cashoutFee ?? booking.cashout_fee ?? booking.cashoutCharge)
      : computeCashoutFromSettings(fullSettings.finance, grossAmount)
  );
  const [discountAmount, setDiscountAmount] = useState<number>(booking.discountAmount ?? booking.discount_amount ?? 0);
  const [paidAmount, setPaidAmount] = useState<number>(booking.paidAmount ?? booking.paid_amount ?? 0);

  // Dynamically update fees when Main Settings change (if not explicitly overridden by booking)
  useEffect(() => {
    if (!hasBookingProcessingFee) {
      setProcessingFee(computeProcessingFeeFromSettings(fullSettings.finance, grossAmount));
    }
    if (!hasBookingVat) {
      setVatAmount(computeVatFromSettings(fullSettings.finance, grossAmount));
    }
    if (!hasBookingCashout) {
      setCashoutFee(computeCashoutFromSettings(fullSettings.finance, grossAmount));
    }
  }, [fullSettings.finance, grossAmount, hasBookingProcessingFee, hasBookingVat, hasBookingCashout]);

  // Synchronize initial paidAmount if full payment was originally recorded
  useEffect(() => {
    if (booking.paidAmount !== undefined || booking.paid_amount !== undefined) {
      setPaidAmount(Number(booking.paidAmount ?? booking.paid_amount ?? 0));
    }
  }, [booking.paidAmount, booking.paid_amount]);

  const netAmount = Math.max(0, grossAmount - discountAmount + processingFee + vatAmount + cashoutFee);
  const dueAmount = Math.max(0, netAmount - paidAmount);
  const isPaidInFull = dueAmount <= 0 && paidAmount >= netAmount;

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

  // Robust Bus and Coach Number resolution across all schemas & models
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

  // Dynamic Boarding and Dropping Points with Detailed Addresses (Clean of Talaimari/Bhadra/Railgate)
  const routeOriginDisplay = cleanLocationName(route.origin || route.source || trip.origin, 'RAJSHAHI');
  const routeOrigin = cleanLocationName(route.origin || route.source, 'কাউন্টার পয়েন্ট');
  const routeDestination = route.destination || trip.targetUniversity || 'গন্তব্য ক্যাম্পাস';
  const routeDestinationDisplay = route.destination || trip.targetUniversity || 'JAHANGIRNAGAR UNIVERSITY (JU)';
  const boardingPointName = cleanLocationName(booking.boardingPoint || booking.boarding_point || trip.boardingPoint, `${routeOrigin} কাউন্টার`);
  const boardingAddressDetailed = cleanLocationName(booking.boardingAddress || booking.boarding_address, `${boardingPointName}, সেন্ট্রাল বাস টার্মিনাল`);
  
  const droppingPointName = booking.droppingPoint || booking.dropping_point || trip.droppingPoint || trip.targetUniversity || `${routeDestination} ড্রপিং জোন`;
  const droppingAddressDetailed = booking.droppingAddress || booking.dropping_address || `${droppingPointName}, প্রধান ফটক ও যাত্রী ড্রপিং লেন`;

  // Robust parsing of Journey Date and Departure Time from trip, schedule, or booking
  const rawDepartureDate = trip.departureDate || trip.departure_date || booking.departureDate || booking.departure_date || booking.journeyDate || booking.journey_date;
  const rawDepartureTime = trip.departureTime || trip.departure_time || booking.departureTime || booking.departure_time;

  const journeyDateFormatted = formatSafeTicketDate(rawDepartureDate);
  const departureTimeFormatted = formatSafeTicketTime(rawDepartureTime);

  const [isEcoMode, setIsEcoMode] = useState(false);
  const helplineNumber = orgBrand.phone || '01711000001';
  const helplineDial = helplineNumber.replace(/\D/g, '');
  const isMultiPassenger = displayPassengers.length >= 3;
  const isHighDensity = displayPassengers.length >= 5;
  const [showSeatMap, setShowSeatMap] = useState<boolean>(true);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const isThermal = paperMode === 'THERMAL_80MM';

  // Shrink the ticket to one A4 page (thermal is a continuous slip, so it is exempt).
  useTicketFit(canvasRef, !isThermal, [showSeatMap, paperMode, booking.id, displayPassengers.length]);
  useSheetViewZoom(viewportRef, 1.05);
  useSheetPageSize(isThermal ? 'THERMAL_80MM' : 'STANDARD_A4');


  const handlePrint = () => {
    printReceiptElement(SHEET_ID);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(bookingNumber, SHEET_ID);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadOfflineTicket = () => {
    downloadReceiptOfflineHtml(bookingNumber, SHEET_ID);
  };

  const handleShareWhatsApp = () => {
    const waData = buildWhatsAppTicketMessage(booking, displayPassengers[0], orgBrand);
    if (typeof window !== 'undefined') {
      window.open(waData.waUrl, '_blank');
    }
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
    <div suppressHydrationWarning className="w-full space-y-4">
      {/* Smart View Toolbar (Hidden during Print or when showControls is false) */}
      {showControls && (
        <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl border border-slate-800 print:hidden shadow-xl space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left: Ticket Header, PNR & Payment Status Pill */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    অফিশিয়াল ট্রাভেল পাস ও ই-টিকিট
                  </h3>
                  <span className="font-mono text-xs text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-bold">
                    {bookingNumber}
                  </span>
                  {isPaidInFull ? (
                    <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      পরিশোধিত (PAID)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      বকেয়া: ৳{dueAmount}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  A4 সিঙ্গেল পেজ প্রিন্ট ভাউচার ও রিয়েল-টাইম কন্ডাক্টর কিউআর ভেরিফাইড পাস
                </div>
              </div>
            </div>

            {/* Right: Functionally Grouped & Clean Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* ভিউ ও প্রিন্ট ফরম্যাট নির্বাচক */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperMode('STANDARD_A4')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    paperMode === 'STANDARD_A4'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="A4 সাইজ সিঙ্গেল পেজ ভাউচার ভিউ"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 ভাউচার</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperMode('THERMAL_80MM')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    paperMode === 'THERMAL_80MM'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="80mm পিওএস থার্মাল রসিদ ভিউ"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>80mm থার্মাল</span>
                </button>
              </div>

              {/* সিট ম্যাপ অন/অফ বাটন */}
              <button
                type="button"
                onClick={() => setShowSeatMap(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                  showSeatMap
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="টিকেটে বাসের সিট মিনি-ম্যাপ চালু বা বন্ধ করুন"
              >
                <Armchair className="w-3.5 h-3.5" />
                <span>ম্যাপ: {showSeatMap ? 'চালু' : 'বন্ধ'}</span>
              </button>

              {/* হোয়াটসঅ্যাপে টিকেট শেয়ার বাটন */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                title="যাত্রীর মোবাইল নম্বরে সরাসরি হোয়াটসঅ্যাপ মেসেজ ও টিকিট লিঙ্ক পাঠান"
              >
                <WhatsAppLogo className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              {/* পিডিএফ ডাউনলোড বাটন */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="পিডিএফ ফাইল হিসেবে সংরক্ষণ করুন (Save as PDF)"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>{isDownloadingPdf ? 'ডাউনলোড হচ্ছে...' : 'পিডিএফ'}</span>
              </Button>

              {/* অফলাইন ফাইল (.html) ডাউনলোড বাটন */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadOfflineTicket}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="ইন্টারনেট ছাড়া ওপেন করার জন্য অফলাইন ফাইল (.html) ডাউনলোড করুন"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>অফলাইন</span>
              </Button>

              {/* বকেয়া কালেকশন বাটন (যদি বকেয়া থাকে) */}
              {dueAmount > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenDueModal}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>বকেয়া জমা (৳{dueAmount})</span>
                </Button>
              )}

              {/* প্রধান অ্যাকশন: প্রিন্ট বাটন */}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 cursor-pointer px-4 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Printable Ticket Container — a fixed A4 sheet shared by screen, print and PDF */}
      <div className="ticket-print-outer w-full flex justify-center overflow-x-auto py-1 print:block print:w-auto print:p-0 print:m-0 print:overflow-visible">
        <div ref={viewportRef} className="ticket-sheet-viewport">
        <div
          id="printable-payment-receipt"
          data-paper-mode={paperMode}
          suppressHydrationWarning
          className="bg-white text-slate-900 overflow-hidden relative"
        >
          <div ref={canvasRef} className="ticket-canvas">
        {booking.isOffline && (
          <div className="bg-amber-500 text-slate-950 font-black text-xs py-1.5 px-4 text-center border-b border-amber-600">
            ⚠️ অফলাইন মোডে সংরক্ষিত রেকর্ড ({booking.offlineRefId || booking.bookingNumber}) — অনলাইন হলে সার্ভারে সিঙ্ক হবে
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE A: 80MM POS THERMAL SLIP MODE                                        */}
        {/* ========================================================================= */}
        {isThermal ? (
          <div className="p-4 space-y-3 bg-white text-black font-mono text-xs">
            {/* Thermal Header */}
            <div className="text-center space-y-1 border-b-2 border-dashed border-black pb-3">
              {orgBrand.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={orgBrand.logoUrl} alt="" className="w-10 h-10 mx-auto object-contain mb-1 filter grayscale" />
              )}
              <div className="text-sm font-black uppercase tracking-wider">{orgBrand.name || 'সেন্ট্রাল এক্সপ্রেস ট্রানজিট'}</div>
              <div className="text-[10px] text-slate-700">{orgBrand.description || 'সেন্ট্রাল এক্সপ্রেস ট্রানজিট সেবা'}</div>
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
              <div suppressHydrationWarning>তারিখ: {formatDate(trip.departureDate)} | সময়: {formatTime(trip.departureTime)}</div>
              <div className="font-black text-black">🚌 বাস নং: {busNumber} ({busName})</div>
              <div>ওঠার স্থান: {booking.boardingPoint || 'কাউন্টার'}</div>
              <div>নামার স্থান: {booking.droppingPoint || 'বিশ্ববিদ্যালয় গেট'}</div>
            </div>

            {/* Seats & Passengers */}
            <div className="space-y-1.5 border-b border-dashed border-black pb-2">
              <div className="font-bold text-[11px] uppercase">যাত্রী ও বরাদ্দকৃত সিট:</div>
              {displayPassengers.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    সিট <strong>{p.seatNumber || `Seat ${idx + 1}`}</strong>: {p.passengerName || booking.contactName}
                  </span>
                  <span className="font-bold">{formatCurrency(p.fareSnapshot || perSeatFare)}</span>
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
              {cashoutFee > 0 && (
                <div className="flex justify-between font-medium">
                  <span>ক্যাশআউট চার্জ:</span>
                  <span>+{formatCurrency(cashoutFee)}</span>
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
              <div>হেল্পলাইন: {helplineNumber} | {orgBrand.name || 'ATOMS TRANSIT'}</div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE B: UNIFIED A4 EXECUTIVE TRANSIT E-TICKET & OFFICIAL TRAVEL PASS      */
          /* ULTRA-PREMIUM REFINEMENT MATCHED PIXEL-PERFECTLY TO REFERENCE DESIGN      */
          /* ========================================================================= */
          <div className={`relative bg-white text-slate-900 select-text font-sans w-full ${isMultiPassenger ? 'min-h-[800px]' : 'min-h-[850px]'} flex flex-col justify-between border border-slate-300 rounded-lg`}>
            {/* 1. TOP BRAND HERO HEADER (Transit Royal Navy Gradient with Single Verified Badge) */}
            <div className={`bg-gradient-to-r from-[#021f4d] via-[#053b8c] to-[#0a4fa8] text-white ${isMultiPassenger ? 'py-1.5 px-3' : 'py-2 px-3'} flex items-center justify-between gap-4 relative overflow-hidden`}>
              {/* Left Brand Identity */}
              <div className="relative z-10 flex items-center gap-3">
                {orgBrand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={orgBrand.logoUrl}
                    alt={orgBrand.name}
                    className={`${isMultiPassenger ? 'w-10 h-10' : 'w-11 h-11'} rounded-xl object-contain bg-white/10 p-1 border border-white/20 shrink-0 shadow-sm`}
                  />
                ) : (
                  <div className={`${isMultiPassenger ? 'w-10 h-10' : 'w-11 h-11'} rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shrink-0 shadow-inner`}>
                    <Bus className={isMultiPassenger ? "w-6 h-6 text-sky-300" : "w-7 h-7 text-sky-300"} />
                  </div>
                )}
                <div>
                  <h1 className={`${isMultiPassenger ? 'text-lg' : 'text-xl'} font-black uppercase tracking-wider text-white leading-tight font-sans drop-shadow-sm`}>
                    {orgBrand.name || 'ATOMS TRANSIT'}
                  </h1>
                </div>
              </div>

              {/* Right: Executive Dual-Ring Holographic Authority Seal */}
              <div className={`flex items-center gap-2.5 ${isMultiPassenger ? 'px-2.5 py-1.5' : 'px-3 py-1.5'} rounded-xl bg-white/10 backdrop-blur-md border border-white/25 shadow-sm relative z-10`}>
                <div className={`relative flex items-center justify-center ${isMultiPassenger ? 'w-8 h-8' : 'w-9 h-9'} rounded-full bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-sky-400/30 border-2 border-emerald-400 shadow-inner shrink-0 text-emerald-300`}>
                  <BadgeCheck className={isMultiPassenger ? "w-4.5 h-4.5 text-emerald-300" : "w-5 h-5 text-emerald-300"} />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                    ✓
                  </span>
                </div>
                <div className="text-left block">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black tracking-wider text-white uppercase block font-mono leading-none">
                      DIGITALLY VERIFIED
                    </span>
                    <span className="text-[7.5px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-1 py-0.2 rounded font-mono font-black">
                      AUTHENTIC
                    </span>
                  </div>
                  <span className="text-[8.5px] text-sky-200 font-bold font-mono block mt-0.5 tracking-tight">
                    PASS-ID: {securityHash}
                  </span>
                </div>
              </div>

              {/* Ambient light glow */}
              <div className="absolute -right-8 -bottom-10 w-52 h-52 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* 2. OFFICIAL BAR & PAYMENT STATUS PILL */}
            <div className={`w-full bg-slate-50 ${isMultiPassenger ? 'px-4 py-1' : 'px-5 py-2'} border-b border-slate-300 flex items-center justify-between gap-3 text-xs`}>
              <div className={`flex items-center gap-2 text-slate-900 font-black tracking-wide ${isMultiPassenger ? 'text-xs' : 'text-sm'}`}>
                <div className="w-5 h-5 rounded bg-[#032b69] text-white flex items-center justify-center text-[10px] shadow-2xs">
                  🎫
                </div>
                <span className="uppercase">OFFICIAL PASSENGER E-TICKET & BOARDING PASS</span>
              </div>

              <div>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-2xs font-mono uppercase ${
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
            <div className={`w-full bg-slate-950 text-sky-200 ${isMultiPassenger ? 'py-0.5 px-4 text-[8px]' : 'py-1 px-5 text-[9px]'} flex items-center justify-between font-mono tracking-widest uppercase overflow-hidden border-b border-slate-800`}>
              <div className="flex items-center gap-2 truncate">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-bold">
                  ★ OFFICIAL SECURE TRANSIT PASS ★ DO NOT DUPLICATE ★ ENCRYPTED ANTI-TAMPER VERIFICATION ★ ORIGINAL ATOMS PORTAL ★
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-black text-amber-300">
                <Fingerprint className="w-3 h-3" />
                <span>SEC-HASH: {securityHash}</span>
              </div>
            </div>

            {/* 3. KEY METRICS STRIP — Balanced 4 / 4 / 4 Grid with unified alignment */}
            <div className={`w-full ${isMultiPassenger ? 'px-4 py-1.5' : 'px-5 py-2.5'} bg-white border-b border-slate-300 grid grid-cols-12 items-center text-xs`}>
              {/* PNR / Tracking No. (4 Cols) */}
              <div className="col-span-4 flex items-center gap-2.5 pr-2">
                <div className={`${isMultiPassenger ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                  <Ticket className={isMultiPassenger ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-mono">PNR / TRACKING NO.</span>
                  <span className={`font-mono font-black text-slate-950 ${isMultiPassenger ? 'text-xs' : 'text-sm'} tracking-tight block truncate select-all leading-tight`}>
                    {bookingNumber}
                  </span>
                </div>
              </div>

              {/* Challan & Receipt No. (4 Cols) */}
              <div className="col-span-4 flex items-center gap-2.5 px-2 border-l border-slate-300">
                <div className={`${isMultiPassenger ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                  <FileText className={isMultiPassenger ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-mono">CHALLAN & RECEIPT NO.</span>
                  <span className={`font-mono font-black text-slate-900 ${isMultiPassenger ? 'text-xs' : 'text-sm'} tracking-tight block truncate select-all leading-tight`}>
                    {receiptNumber}
                  </span>
                </div>
              </div>

              {/* Issue Date & Time (4 Cols) */}
              <div className="col-span-4 flex items-center gap-2.5 pl-2 border-l border-slate-300" suppressHydrationWarning>
                <div className={`${isMultiPassenger ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                  <Clock className={isMultiPassenger ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-mono">ISSUE DATE & TIME</span>
                  <div className="font-mono text-slate-900 text-xs font-bold leading-tight" suppressHydrationWarning>
                    <span suppressHydrationWarning>{formatSafeTicketDate(booking.createdAt || booking.created_at)}</span>
                    <span suppressHydrationWarning className="text-slate-600 text-[10px] font-semibold block mt-0.5">
                      {formatSafeTicketTime(booking.createdAt || booking.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Main Content Body — Full bleed with zero white side gutters */}
            <div className="w-full flex-1 flex flex-col justify-between">
              {/* 4. ROUTE FLOW HERO BANNER — Full-bleed edge-to-edge */}
              <div className={`w-full border-b border-sky-300 bg-gradient-to-b from-[#e0f2fe]/95 via-[#f0f9ff]/80 to-white ${isMultiPassenger ? 'px-4 py-2' : 'px-5 py-3'}`}>
                {/* Boarding Point ────🚌──── Dropping Point */}
                <div className={`flex flex-row items-center justify-between gap-4 ${isMultiPassenger ? 'pb-1.5' : 'pb-2.5'} border-b border-sky-200/90`}>
                  {/* Origin */}
                  <div className="w-5/12 text-left space-y-0.5">
                    <div className="flex items-center gap-1.5 text-sky-900 text-[10px] font-black uppercase tracking-wider font-mono">
                      <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                      <span>ORIGIN & BOARDING LOCATION</span>
                    </div>
                    <div className={`${isMultiPassenger ? 'text-lg' : 'text-xl'} font-black text-slate-950 uppercase tracking-tight leading-none`}>
                      {routeOriginDisplay}
                    </div>
                    {/* Highlighted Boarding Point Pill */}
                    <div className={`inline-flex items-center gap-1.5 ${isMultiPassenger ? 'px-2 py-0.5' : 'px-3 py-1'} rounded-md bg-[#032b69] text-white shadow-xs`}>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-sky-300 font-bold">বোর্ডিং পয়েন্ট:</span>
                      <span className={`${isMultiPassenger ? 'text-[11px]' : 'text-xs'} font-black text-white tracking-wide`}>{boardingPointName}</span>
                    </div>
                    <div className={`${isMultiPassenger ? 'text-[10px]' : 'text-[11px]'} text-slate-600 font-medium leading-tight truncate`}>
                      <span className="text-slate-500 font-normal">ঠিকানা:</span> {boardingAddressDetailed}
                    </div>
                  </div>

                  {/* Flow Arrow with Bus Icon & High-Visibility Bus Number Badge */}
                  <div className="w-3/12 flex flex-col items-center justify-center px-1">
                    <div className="flex items-center w-full justify-center gap-1">
                      <div className="h-0.5 flex-1 bg-sky-300" />
                      <div className={`${isMultiPassenger ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-[#032b69] text-white flex items-center justify-center shadow-xs shrink-0`}>
                        <Bus className={isMultiPassenger ? "w-3.5 h-3.5" : "w-4 h-4"} />
                      </div>
                      <div className="h-0.5 flex-1 bg-sky-300 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-sky-400 rotate-45" />
                      </div>
                    </div>
                    {/* High-Visibility Bus Number Badge */}
                    <div className="mt-1 flex flex-col items-center">
                      <span className={`inline-flex items-center gap-1 ${isMultiPassenger ? 'px-2 py-0.2 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'} rounded-full bg-[#032b69] text-white font-mono font-black shadow-xs tracking-tight border border-sky-400/40`}>
                        <span>🚌</span>
                        <span>বাস নং: {busNumber}</span>
                      </span>
                      <span className="text-[8.5px] text-slate-600 font-bold truncate max-w-[150px] mt-0.5">
                        {busName}
                      </span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="w-5/12 text-right space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5 text-sky-900 text-[10px] font-black uppercase tracking-wider font-mono">
                      <span>DESTINATION & DROPPING LOCATION</span>
                      <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    </div>
                    <div className={`${isMultiPassenger ? 'text-lg' : 'text-xl'} font-black text-slate-950 uppercase tracking-tight leading-none`}>
                      {routeDestinationDisplay}
                    </div>
                    {/* Highlighted Dropping Point Pill */}
                    <div className={`inline-flex items-center justify-end gap-1.5 ${isMultiPassenger ? 'px-2 py-0.5' : 'px-3 py-1'} rounded-md bg-[#032b69] text-white shadow-xs ml-auto`}>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-sky-300 font-bold">ড্রপিং পয়েন্ট:</span>
                      <span className={`${isMultiPassenger ? 'text-[11px]' : 'text-xs'} font-black text-white tracking-wide`}>{droppingPointName}</span>
                    </div>
                    <div className={`${isMultiPassenger ? 'text-[10px]' : 'text-[11px]'} text-slate-600 font-medium leading-tight truncate`}>
                      <span className="text-slate-500 font-normal">ঠিকানা:</span> {droppingAddressDetailed}
                    </div>
                  </div>
                </div>

                {/* Journey Schedule 5-Columns Grid: Clean Sequence with Dedicated Bus Number Card */}
                <div className={`grid grid-cols-5 ${isMultiPassenger ? 'gap-1.5 pt-1.5' : 'gap-2 pt-2.5'} text-xs items-stretch`}>
                  {/* 1. Journey Date */}
                  <div className={`bg-white/90 rounded-lg ${isMultiPassenger ? 'p-1.5' : 'p-2'} border border-sky-200/90 flex items-start gap-1.5 shadow-2xs`}>
                    <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-sky-100 border border-sky-300 text-[#032b69] flex items-center justify-center shrink-0`}>
                      <Calendar className={isMultiPassenger ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block font-mono">যাত্রার তারিখ (DATE)</span>
                      <span suppressHydrationWarning className={`font-black text-slate-950 ${isMultiPassenger ? 'text-[10px]' : 'text-[11px]'} block mt-0.5 leading-tight`}>
                        {journeyDateFormatted}
                      </span>
                    </div>
                  </div>

                  {/* 2. Departure Time & Reporting */}
                  <div className={`bg-white/90 rounded-lg ${isMultiPassenger ? 'p-1.5' : 'p-2'} border border-sky-200/90 flex items-start gap-1.5 shadow-2xs`}>
                    <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-sky-100 border border-sky-300 text-[#032b69] flex items-center justify-center shrink-0`}>
                      <Clock className={isMultiPassenger ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block font-mono">ছাড়ার সময় (TIME)</span>
                      <span suppressHydrationWarning className={`font-mono font-black text-[#032b69] ${isMultiPassenger ? 'text-[10px]' : 'text-[11px]'} block mt-0.5 leading-tight`}>
                        {departureTimeFormatted} BST
                      </span>
                      <span className="text-[7.5px] text-emerald-700 font-bold block mt-0.5">
                        ⏱️ ২০ মি. পূর্বে রিপোর্ট
                      </span>
                    </div>
                  </div>

                  {/* 3. DEDICATED BUS NUMBER CARD — HIGH VISIBILITY */}
                  <div className={`bg-gradient-to-br from-blue-50/90 to-sky-100/90 rounded-lg ${isMultiPassenger ? 'p-1.5' : 'p-2'} border-2 border-[#032b69]/40 flex items-start gap-1.5 shadow-2xs`}>
                    <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-[#032b69] text-white flex items-center justify-center shrink-0 shadow-xs`}>
                      <Bus className={isMultiPassenger ? "w-3 h-3 text-sky-200" : "w-3.5 h-3.5 text-sky-200"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[7.5px] text-blue-900 font-black uppercase tracking-wider block font-mono">বাস নম্বর (BUS NO.)</span>
                      <span className={`font-mono font-black text-[#032b69] ${isMultiPassenger ? 'text-[10px]' : 'text-[11px]'} block mt-0.5 leading-tight truncate`}>
                        {busNumber}
                      </span>
                      <span className="text-[7.5px] text-slate-600 font-bold block mt-0.5 truncate">
                        {busName}
                      </span>
                    </div>
                  </div>

                  {/* 4. Coach Type / Category */}
                  <div className={`bg-white/90 rounded-lg ${isMultiPassenger ? 'p-1.5' : 'p-2'} border border-sky-200/90 flex items-start gap-1.5 shadow-2xs`}>
                    <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-sky-100 border border-sky-300 text-[#032b69] flex items-center justify-center shrink-0`}>
                      <Armchair className={isMultiPassenger ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block font-mono">কোচের ধরন (COACH)</span>
                      <div className="mt-0.5">
                        {busType === 'FEMALE' ? (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-pink-100 border border-pink-300 text-pink-900 font-bold text-[8.5px]">
                            👩 ছাত্রী স্পেশাল
                          </span>
                        ) : busType === 'MALE' ? (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-blue-100 border border-blue-300 text-blue-900 font-bold text-[8.5px]">
                            👨 ছাত্র স্পেশাল
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-[8.5px]">
                            👥 মিক্সড কোচ
                          </span>
                        )}
                      </div>
                      <span className="text-[7.5px] text-slate-500 font-semibold block mt-0.5 font-mono">
                        AC ডিলাক্স
                      </span>
                    </div>
                  </div>

                  {/* 5. Allocated Seats */}
                  <div className={`bg-white/90 rounded-lg ${isMultiPassenger ? 'p-1.5' : 'p-2'} border border-sky-200/90 flex items-start gap-1.5 shadow-2xs`}>
                    <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-sky-100 border border-sky-300 text-[#032b69] flex items-center justify-center shrink-0`}>
                      <Ticket className={isMultiPassenger ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block font-mono">বরাদ্দকৃত আসন (SEATS)</span>
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        {displayPassengers.map((p: any, idx: number) => {
                          const sNum = p.seatNumber || p.seat_number || p.seat?.seatNumber;
                          return (
                            <span
                              key={idx}
                              className={`px-1 py-0.2 rounded bg-[#032b69] text-white font-mono font-black ${isMultiPassenger ? 'text-[9px]' : 'text-[10px]'} shadow-2xs`}
                            >
                              {sNum || `S${idx + 1}`}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-[7.5px] text-slate-600 font-bold font-mono block mt-0.5">
                        মোট: {displayPassengers.length}টি আসন
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PASSENGER & SEAT MANIFEST TABLE — Full-bleed edge-to-edge */}
              <div className="w-full border-b border-slate-300 overflow-hidden">
                {/* Manifest Header Ribbon */}
                <div className={`bg-[#032b69] text-white ${isMultiPassenger ? 'px-4 py-1 text-[11px]' : 'px-5 py-2 text-xs'} flex items-center justify-between font-bold uppercase tracking-wider font-mono`}>
                  <div className="flex items-center gap-2">
                    <Users className={`${isMultiPassenger ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-sky-300`} />
                    <span>PASSENGER & SEAT MANIFEST — {displayPassengers.length}টি আসন</span>
                  </div>
                  <div className={`${isMultiPassenger ? 'text-[9px]' : 'text-[10px]'} text-sky-200 font-normal`}>
                    সর্বোচ্চ ৬ জন যাত্রী বরাদ্দ
                  </div>
                </div>

                {/* Table with fixed column widths and crisp alignment */}
                <table className="w-full text-left text-xs table-fixed">
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[29%]" />
                    <col className="w-[9%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead className={`bg-slate-100 text-slate-800 font-mono ${isMultiPassenger ? 'text-[9px]' : 'text-[10px]'} uppercase border-b border-slate-300 font-black tracking-wider`}>
                    <tr>
                      <th className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-center`}>Seat No.</th>
                      <th className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-left`}>Passenger Name</th>
                      <th className={`${isMultiPassenger ? "py-1 px-2" : "py-2 px-2"} text-center`}>Gender</th>
                      <th className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-left`}>Mobile Number</th>
                      <th className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-left`}>Category / Roll</th>
                      <th className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-right`}>Fare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayPassengers.map((p: any, idx: number) => {
                      const sLabel = p.seatNumber || p.seat_number || p.seat?.seatNumber || `Seat ${idx + 1}`;
                      const sFare = p.fareSnapshot || perSeatFare;
                      const pName = p.passengerName || p.passenger_name || booking.contactName;
                      const pPhone = p.passengerPhone || p.passenger_phone || booking.contactPhone || '—';
                      const pGender = p.passengerGender || p.gender || p.passenger_gender;
                      const pCategory = p.passengerType || p.passenger_type;
                      const rollId = p.admissionId || p.admission_id || p.student?.admissionId || booking.studentAdmissionId || '';

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* Seat Badge */}
                          <td className={`${isMultiPassenger ? "py-1 px-3" : "py-2 px-4"} text-center align-middle`}>
                            <span className={`${isMultiPassenger ? "w-6 h-5.5 text-[10px]" : "w-8 h-7 text-xs"} rounded-lg bg-[#0d6efd] text-white font-mono font-black inline-flex items-center justify-center shadow-2xs`}>
                              {sLabel}
                            </span>
                          </td>

                          {/* Passenger Name with Verified Badge */}
                          <td className={`${isMultiPassenger ? "py-1 px-3 text-[10.5px]" : "py-2 px-4 text-xs"} font-bold text-slate-950 align-middle`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{pName}</span>
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </div>
                          </td>

                          {/* Gender / লিঙ্গ Badge — Compact & Sleek */}
                          <td className={`${isMultiPassenger ? "py-1 px-2" : "py-2 px-2"} text-center align-middle`}>
                            {pGender === 'FEMALE' ? (
                              <span className={`${isMultiPassenger ? "px-1.5 py-0.2 text-[8.5px]" : "px-1.5 py-0.5 text-[10px]"} rounded bg-pink-100 border border-pink-300 text-pink-900 font-bold inline-flex items-center gap-1 font-sans shadow-2xs`}>
                                <span>👩</span>
                                <span>নারী</span>
                              </span>
                            ) : pGender === 'MALE' ? (
                              <span className={`${isMultiPassenger ? "px-1.5 py-0.2 text-[8.5px]" : "px-1.5 py-0.5 text-[10px]"} rounded bg-blue-100 border border-blue-300 text-blue-900 font-bold inline-flex items-center gap-1 font-sans shadow-2xs`}>
                                <span>👨</span>
                                <span>পুরুষ</span>
                              </span>
                            ) : (
                              <span className={`${isMultiPassenger ? "px-1.5 py-0.2 text-[8.5px]" : "px-1.5 py-0.5 text-[10px]"} rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold inline-flex items-center gap-1 font-sans shadow-2xs`}>
                                <span>👤</span>
                                <span>সাধারণ</span>
                              </span>
                            )}
                          </td>

                          {/* Mobile Phone */}
                          <td className={`${isMultiPassenger ? "py-1 px-3 text-[10.5px]" : "py-2 px-4 text-xs"} font-mono text-slate-900 font-bold align-middle truncate`}>
                            {pPhone}
                          </td>

                          {/* Category / Admission Roll */}
                          <td className={`${isMultiPassenger ? "py-1 px-3 text-[9.5px]" : "py-2 px-4 text-xs"} text-slate-800 align-middle`}>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`${isMultiPassenger ? "px-1.5 py-0.2 text-[8.5px]" : "px-2 py-0.5 text-[10px]"} rounded bg-slate-100 border border-slate-300 text-slate-900 font-bold shrink-0`}>
                                {pCategory === 'STUDENT' ? 'শিক্ষার্থী' : pCategory === 'GUARDIAN' ? 'অভিভাবক' : 'সাধারণ যাত্রী'}
                              </span>
                              {rollId && (
                                <span className={`text-slate-700 font-mono ${isMultiPassenger ? 'text-[8.5px]' : 'text-[10px]'} font-bold truncate`}>
                                  রোল: <strong className="text-slate-950">{rollId}</strong>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Seat Fare */}
                          <td className={`${isMultiPassenger ? "py-1 px-3 text-[10.5px]" : "py-2 px-4 text-xs"} text-right font-mono font-black text-slate-950 align-middle`}>
                            {formatCurrency(sFare)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Manifest Bottom Summary Bar */}
                <div className={`bg-slate-50 border-t border-slate-300 ${isMultiPassenger ? 'px-4 py-1 text-[11px]' : 'px-5 py-2 text-xs'} flex items-center justify-between`}>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Users className="w-3.5 h-3.5 text-[#032b69]" />
                    <span>মোট {displayPassengers.length}টি আসন</span>
                    <span className="text-slate-300">|</span>
                    <span>উপমোট ভাড়া: {formatCurrency(grossAmount)}</span>
                  </div>

                  <div className={`bg-[#0d6efd] text-white font-mono ${isMultiPassenger ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'} rounded-lg font-black shadow-2xs text-right`}>
                    Total Seats: 0{displayPassengers.length} &nbsp;|&nbsp; Total Fare: {formatCurrency(netAmount)}
                  </div>
                </div>
              </div>

              {/* 6. BOTTOM 3-COLUMN SECTION — Full-bleed container edge-to-edge */}
              <div className={`w-full ${isMultiPassenger ? 'px-4 py-1.5' : 'px-5 py-2.5'} border-b border-slate-300 bg-slate-50/50`}>
                <div className={`grid grid-cols-12 ${isMultiPassenger ? 'gap-2' : 'gap-3'} text-xs items-stretch`}>
                  {/* 6.1 COLUMN 1: Journey Details & Instructions (md:col-span-4) */}
                  <div className={`${showSeatMap ? "col-span-4" : "col-span-6"} rounded-xl border border-slate-300 overflow-hidden bg-white shadow-2xs flex flex-col justify-between`}>
                    <div>
                      <div className={`bg-[#032b69] text-white ${isMultiPassenger ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'} flex items-center justify-between font-bold uppercase tracking-wide`}>
                        <div className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-sky-300" />
                          <span>জরুরি নির্দেশিকা ও তথ্য</span>
                        </div>
                        <span className="text-[9px] font-mono text-sky-200 font-normal">RULES &amp; INFO</span>
                      </div>

                      <div className={`${isMultiPassenger ? 'p-1.5 space-y-1' : 'p-2 space-y-1.5'}`}>
                        {/* Reporting Time & Boarding Point - Clean 2-row layout */}
                        <div className="rounded-xl border border-sky-200 overflow-hidden shadow-2xs">
                          {/* Row 1: Reporting Time */}
                          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-sky-50/80">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-[#032b69] shrink-0" />
                              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-wide">রিপোর্টিং সময়</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black font-mono leading-none ${isMultiPassenger ? 'text-[9.5px]' : 'text-[10.5px]'}`}>
                              বাস ছাড়ার ২০ মি. পূর্বে
                            </span>
                          </div>
                          {/* Divider */}
                          <div className="border-t border-sky-200" />
                          {/* Row 2: Boarding Point */}
                          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <MapPin className="w-3.5 h-3.5 text-[#032b69] shrink-0" />
                              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-wide">বোর্ডিং পয়েন্ট</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md bg-[#032b69] text-white font-black font-mono leading-none max-w-[140px] truncate ${isMultiPassenger ? 'text-[9.5px]' : 'text-[10.5px]'}`}>
                              {boardingPointName}
                            </span>
                          </div>
                        </div>
                        {/* Payment Method Card */}
                        <div className="p-2 rounded-xl bg-slate-50/90 border border-slate-200/90 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-black text-slate-900">
                              <CreditCard className="w-4 h-4 text-[#032b69] shrink-0" />
                              <span className={`${isMultiPassenger ? 'text-[11px]' : 'text-xs'} font-black uppercase tracking-tight`}>
                                পেমেন্ট মাধ্যম (PAYMENT)
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/90 border border-emerald-300 text-emerald-900 font-black text-[9.5px]">
                              <BadgeCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>ভেরিফাইড পে</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            {paymentMethod === 'BKASH' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DF146E]/10 border border-[#DF146E]/30 text-[#DF146E] font-black text-xs shadow-2xs">
                                <BkashLogo className="w-4 h-4 shrink-0" />
                                <span>বিকাশ (bKash Wallet)</span>
                              </div>
                            ) : paymentMethod === 'NAGAD' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9A01B]/10 border border-[#F9A01B]/30 text-[#D4710A] font-black text-xs shadow-2xs">
                                <NagadLogo className="w-4 h-4 shrink-0" />
                                <span>নগদ (Nagad Wallet)</span>
                              </div>
                            ) : paymentMethod === 'ROCKET' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8C3494]/10 border border-[#8C3494]/30 text-[#8C3494] font-black text-xs shadow-2xs">
                                <RocketLogo className="w-4 h-4 shrink-0" />
                                <span>রকেট (Rocket)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-black text-xs shadow-2xs">
                                <CashMoneyLogo className="w-4 h-4 shrink-0" />
                                <span>কাউন্টার সরাসরি ক্যাশ</span>
                              </div>
                            )}

                            <span className="text-[10px] text-slate-600 font-mono font-bold">
                              স্ট্যাটাস: <strong className="text-emerald-700 font-black">{isPaidInFull ? 'পরিশোধিত' : 'অনুমোদিত'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* TRAVEL GUIDELINES & TERMS (ভ্রমণ নির্দেশিকা ও শর্তাবলী) — High-Visibility Hero Block */}
                        <div className="rounded-xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-2 shadow-2xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className={`${isMultiPassenger ? 'text-[11px]' : 'text-xs'} font-black text-slate-950 uppercase tracking-tight`}>
                                ভ্রমণ নির্দেশিকা ও শর্তাবলী
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-amber-800 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded font-black">
                              আবশ্যিক
                            </span>
                          </div>

                          {/* 3 Prominently Styled Rules with Clear Typography & Badge Numbers */}
                          <div className={`space-y-1.5 ${isMultiPassenger ? 'pt-1' : 'pt-1.5'}`}>
                            {/* Rule 1 */}
                            <div className="flex items-start gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <span className="w-5 h-5 rounded-md bg-[#032b69] text-white flex items-center justify-center text-[10.5px] font-black shrink-0 font-mono shadow-2xs mt-0.5">
                                ১
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`${isMultiPassenger ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold text-slate-950 leading-snug block`}>
                                  ডিজিটাল টিকিট ও প্রয়োজনীয় পরিচয়পত্র সাথে রাখুন।
                                </span>
                              </div>
                            </div>

                            {/* Rule 2 */}
                            <div className="flex items-start gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10.5px] font-black shrink-0 font-mono shadow-2xs mt-0.5">
                                ২
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`${isMultiPassenger ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold text-slate-950 leading-snug block`}>
                                  বাসে ওঠার সময় কন্ডাক্টরকে কিউআর কোড স্ক্যান করতে দিন।
                                </span>
                              </div>
                            </div>

                            {/* Rule 3 */}
                            <div className="flex items-start gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                              <span className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center text-[10.5px] font-black shrink-0 font-mono shadow-2xs mt-0.5">
                                ৩
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`${isMultiPassenger ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold text-slate-950 leading-snug block`}>
                                  যাত্রার নির্দিষ্ট সময়ের পূর্বে আসনে অবস্থান নিন।
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Helpline Strip */}
                    <div className={`${isMultiPassenger ? 'p-1.5 text-[9.5px]' : 'p-2 text-[10.5px]'} bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1`}>
                      <a
                        href={`tel:${helplineDial}`}
                        className="inline-flex items-center gap-1.5 text-emerald-800 font-bold hover:underline"
                        title="কাউন্টার হেল্পলাইনে কল করুন"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>হেল্পলাইন: <strong>{helplineNumber}</strong></span>
                      </a>
                      <div className="flex items-center gap-0.5 text-emerald-800 font-bold text-[9px]">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>অনুমোদিত ট্রাভেল পাস</span>
                      </div>
                    </div>
                  </div>

                  {/* 6.2 COLUMN 2: Visual Coach Mini Seat Map (Only if showSeatMap is true) */}
                  {showSeatMap && (
                    <div className="col-span-4 flex flex-col">
                      <MiniBusSeatMap
                        allocatedSeats={displayPassengers.map((p: any) => p.seatNumber || p.seat_number || p.seat?.seatNumber).filter(Boolean)}
                        busType={busType}
                        isEcoMode={isEcoMode}
                        isCompact={isMultiPassenger}
                      />
                    </div>
                  )}

                  {/* 6.3 COLUMN 3: Clean Billing Summary & 3D QR Verification (md:col-span-4) */}
                  <div className={`${showSeatMap ? "col-span-4" : "col-span-6"} rounded-xl border border-slate-300 overflow-hidden bg-white shadow-2xs flex flex-col justify-between`}>
                    <div>
                      <div className={`bg-[#032b69] text-white ${isMultiPassenger ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'} flex items-center justify-between font-bold uppercase tracking-wide`}>
                        <div className="flex items-center gap-1.5">
                          <BadgePercent className="w-3.5 h-3.5 text-sky-300" />
                          <span>ভাড়ার হিসাব (BILLING)</span>
                        </div>
                        <span className="text-[9px] font-mono text-sky-200 font-normal">
                          OFFICIAL VOUCHER
                        </span>
                      </div>

                      <div className={`${isMultiPassenger ? 'p-2 space-y-0.5 text-[10px]' : 'p-2.5 space-y-1 text-[11px]'} font-mono`}>
                        {/* Base Fare Calculation */}
                        <div className="flex justify-between items-center text-slate-700">
                          <span>মূল ভাড়া ({formatCurrency(perSeatFare)} × {displayPassengers.length}):</span>
                          <span className="font-bold text-slate-900">{formatCurrency(grossAmount)}</span>
                        </div>

                        {/* Discount row if applicable */}
                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-emerald-700 font-bold">
                            <span>ছাড় / বিশেষ কুপন (লেস):</span>
                            <span>- {formatCurrency(discountAmount)}</span>
                          </div>
                        )}

                        {/* Processing Fee */}
                        <div className="flex justify-between items-center text-slate-700 font-medium">
                          <span>অনলাইন প্রসেসিং ফি:</span>
                          <span className="font-bold text-slate-900">{processingFee > 0 ? `+ ${formatCurrency(processingFee)}` : '৳০'}</span>
                        </div>

                        {/* VAT & Tax */}
                        <div className="flex justify-between items-center text-slate-700 font-medium">
                          <span>ভ্যাট ও সরকারি কর:</span>
                          <span className="font-bold text-slate-900">{vatAmount > 0 ? `+ ${formatCurrency(vatAmount)}` : '৳০'}</span>
                        </div>

                        {/* Cashout Charge */}
                        <div className="flex justify-between items-center text-amber-800 font-medium">
                          <span>ক্যাশআউট চার্জ:</span>
                          <span className="font-bold text-slate-900">{cashoutFee > 0 ? `+ ${formatCurrency(cashoutFee)}` : '৳০'}</span>
                        </div>

                        {/* Net Total Payable */}
                        <div className="flex justify-between items-center text-slate-950 font-black pt-1 border-t border-slate-300 text-xs">
                          <span>সর্বমোট প্রদেয় ভাড়া:</span>
                          <span className={`${isMultiPassenger ? 'text-xs' : 'text-sm'} font-black text-slate-950`}>{formatCurrency(netAmount)}</span>
                        </div>

                        {/* PAYMENT & DUE STATUS CARDS */}
                        {isPaidInFull ? (
                          <div className={`${isMultiPassenger ? 'my-1 p-1.5' : 'my-1.5 p-2'} rounded-lg bg-emerald-50 border-2 border-emerald-600 flex items-center justify-between`}>
                            <div>
                              <span className="text-[8.5px] text-emerald-900 font-black uppercase tracking-wider font-mono block">
                                পরিশোধিত (PAID IN FULL)
                              </span>
                              <span className={`${isMultiPassenger ? 'text-sm' : 'text-base'} font-black text-emerald-800 font-mono leading-none mt-0.5 block`}>
                                {formatCurrency(paidAmount)}
                              </span>
                              <span className="text-[8px] text-emerald-700 font-bold mt-0.5 block">
                                ✓ কোনো বকেয়া নেই
                              </span>
                            </div>
                            <div>
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[9px] flex items-center gap-1 font-mono shadow-xs">
                                PAID <BadgeCheck className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className={`${isMultiPassenger ? 'my-1 space-y-0.5' : 'my-1.5 space-y-1'}`}>
                            <div className={`${isMultiPassenger ? 'p-1.5' : 'p-2'} rounded-lg bg-rose-50 border-2 border-rose-600 flex items-center justify-between`}>
                              <div>
                                <span className="text-[8.5px] text-rose-900 font-black uppercase tracking-wider font-mono block">
                                  অবশিষ্ট বকেয়া টাকা (DUE AMOUNT)
                                </span>
                                <span className={`${isMultiPassenger ? 'text-base' : 'text-lg'} font-black text-rose-700 font-mono leading-none mt-0.5 block`}>
                                  {formatCurrency(dueAmount)}
                                </span>
                                <span className="text-[8px] text-rose-800 font-bold mt-0.5 block">
                                  ⚠️ কাউন্টারে প্রদেয়: {duePromiseDate}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] inline-block font-mono shadow-xs">
                                  DUE ৳{dueAmount}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[9px] px-0.5 font-mono text-slate-700">
                              <span>জমা (Paid): <strong className="text-slate-900">{formatCurrency(paidAmount)}</strong></span>
                              <span>বকেয়া (Due): <strong className="text-rose-700 font-black">{formatCurrency(dueAmount)}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3D Security Framed QR Scan & Anti-Fraud Box */}
                    <div className={`${isMultiPassenger ? 'p-1.5 pt-0' : 'p-2 pt-0'}`}>
                      <div className={`bg-slate-50 ${isMultiPassenger ? 'p-1.5 gap-1.5' : 'p-2 gap-2'} rounded-xl border border-slate-300 flex items-center`}>
                        {/* 3D-depth framed QR Code */}
                        <div className="p-0.5 bg-white rounded-lg border-2 border-slate-800 shadow-sm shrink-0">
                          <QRCodeView value={verifyUrl} size={isMultiPassenger ? 58 : 76} />
                        </div>

                        {/* Verification Code & Anti-Tamper Details */}
                        <div className="text-[8.5px] text-slate-700 font-mono space-y-0.5 flex-1 min-w-0">
                          <span className="text-[7.5px] font-black text-slate-900 uppercase block tracking-wide">
                            ৩D সিকিউরিটি গেট পাস
                          </span>
                          <div className="bg-[#032b69] text-white px-1 py-0.2 rounded font-black text-[9px] inline-block tracking-wider">
                            *{bookingNumber}*
                          </div>
                          <div className="text-[7.5px] font-bold text-slate-900 flex items-center gap-0.5">
                            <BadgeCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span className="truncate">HASH: {securityHash}</span>
                          </div>
                          <div className="text-[7px] text-slate-500 leading-tight">
                            ডিজিটাল ভেরিফিকেশনের জন্য মূল কিউআর কোড স্ক্যান করুন।
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6.4 COMPACT SECURITY & BARCODE VALIDATION STRIP — Full-bleed edge-to-edge */}
              <div className={`w-full border-b border-slate-300 bg-white ${isMultiPassenger ? 'px-4 py-1' : 'px-5 py-2'} flex flex-row items-center justify-between gap-2`}>
                <div className="flex items-center gap-2">
                  <div className={`${isMultiPassenger ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border-2 border-dashed border-emerald-600 flex items-center justify-center shrink-0 bg-slate-50`}>
                    <ShieldCheck className={isMultiPassenger ? "w-3.5 h-3.5 text-emerald-600" : "w-4.5 h-4.5 text-emerald-600"} />
                  </div>
                  <div className="text-left font-mono">
                    <div className={`${isMultiPassenger ? 'text-[9px]' : 'text-[10px]'} font-black text-slate-900 uppercase flex items-center gap-1`}>
                      <span>DIGITAL TRANSIT SECURITY PASS</span>
                      <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 text-[7.5px] rounded font-bold">AUTHENTICATED</span>
                    </div>
                    <div className={`${isMultiPassenger ? 'text-[8px]' : 'text-[9px]'} text-slate-600 mt-0.5`}>
                      HASH: <strong className="text-slate-950">{securityHash}</strong> • PNR: <strong className="text-slate-950">{bookingNumber}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <BarcodeView value={bookingNumber} height={isMultiPassenger ? 20 : 28} showText={false} className={isMultiPassenger ? "w-44" : "w-56"} barColor="#032b69" />
                  <span className="text-[7.5px] font-mono text-slate-600 font-bold tracking-widest mt-0.5">
                    *{bookingNumber}*
                  </span>
                </div>
              </div>
            </div>

            {/* 7. BOTTOM CENTRAL FOOTER STRIP — Website address ONLY here at the very bottom */}
            <div className={`w-full bg-[#032b69] text-white ${isMultiPassenger ? 'py-1 px-4 text-[10px]' : 'py-2 px-5 text-[11px]'} text-center font-medium tracking-wide border-t border-slate-800 shrink-0`}>
              <div className="font-bold flex items-center justify-center gap-2 flex-wrap">
                <Lock className="w-3 h-3 text-sky-300" />
                <span>{orgBrand.name || 'ATOMS Transit'} Central Secure Transit Pass Management System</span>
                <span>•</span>
                <span className="font-mono text-emerald-300 font-bold bg-white/10 px-2 py-0.2 rounded border border-white/20">
                  🌐 {orgBrand.website || 'www.atomstransit.com'}
                </span>
              </div>
              <div className={`text-sky-200 ${isMultiPassenger ? 'text-[8.5px]' : 'text-[10px]'} flex items-center justify-center gap-3 mt-0.5 font-mono`}>
                <span>Anti-Counterfeit Protection</span>
                <span>•</span>
                <span>Real-Time Conductor QR Verification</span>
                <span>•</span>
                <span>Paperless Boarding Valid</span>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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
        printReceiptElement(SHEET_ID);
      }, 800);
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
    printReceiptElement(SHEET_ID);
  };

  const handleDownloadPdf = async () => {
    const bookingNumber = booking?.bookingNumber || booking?.booking_number || 'TICKET';
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(bookingNumber, SHEET_ID);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadOfflineTicket = () => {
    const bookingNumber = booking?.bookingNumber || booking?.booking_number || 'TICKET';
    downloadReceiptOfflineHtml(bookingNumber, SHEET_ID);
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
      <div className="w-full max-w-6xl max-h-[96vh] flex flex-col bg-slate-900 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden border border-slate-700/80">
        
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
          <div className="w-full max-w-[1100px] flex justify-center">
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
