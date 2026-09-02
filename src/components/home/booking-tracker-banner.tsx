'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Search } from 'lucide-react';
import { useApp } from '@/lib/context';

export function BookingTrackerBanner() {
  const { language, t } = useApp();
  const router = useRouter();
  const [trackingQuery, setTrackingQuery] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingQuery.trim();
    if (query) {
      router.push(`/track/${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-100 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xs dark:shadow-none">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              {t.landingTrackBooking || 'বুকিং ট্র্যাক করুন'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'bn'
                ? 'আপনার বুকিং রেফারেন্স নম্বর (যেমন: BK-20260827-10024) অথবা মোবাইল নম্বর দিয়ে ভেরিফিকেশন ও পেমেন্ট টাইমার স্ট্যাটাস চেক করুন।'
                : 'Check your seat verification progress, payment countdown timer, and download invoice using your Booking ID or Mobile Number.'}
            </p>
          </div>

          <form
            onSubmit={handleTrackSubmit}
            className="flex w-full lg:w-auto items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                language === 'bn'
                  ? 'বুকিং নম্বর বা মোবাইল'
                  : 'Booking Ref or Phone'
              }
              value={trackingQuery}
              onChange={(e) => setTrackingQuery(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono w-full sm:w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ট্র্যাক' : 'Track'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
