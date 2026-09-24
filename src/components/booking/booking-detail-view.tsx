'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentReceipt, printReceiptElement } from './payment-receipt';

interface Props {
  booking: any;
  autoPrint?: boolean;
}

export function BookingDetailView({ booking, autoPrint = false }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPnr, setCopiedPnr] = useState(false);

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

  return (
    <div suppressHydrationWarning className="w-full max-w-5xl mx-auto space-y-4 pb-16 px-2 sm:px-4 print:p-0 print:m-0 print:space-y-0 print:pb-0 print:max-w-none">
      {/* 1. Sleek Navigation & PNR Bar (Screen only) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl"
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
        </div>

        {/* Quick External Actions */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <Link href="/settings">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="ভ্যাট, ট্যাক্স, প্রসেসিং ফি ও সিস্টেম সেটিংস কনফিগার করুন"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">ভ্যাট ও সেটিংস</span>
            </Button>
          </Link>

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

      {/* 2. Direct Ticket Display Canvas (No Popups, Full Natural Browser View) */}
      <div className="w-full flex flex-col items-center justify-center print:p-0 print:m-0">
        <div className="w-full max-w-[860px] print:max-w-none print:w-full print:m-0 print:p-0">
          <PaymentReceipt booking={booking} showControls={true} />
        </div>
      </div>
    </div>
  );
}
