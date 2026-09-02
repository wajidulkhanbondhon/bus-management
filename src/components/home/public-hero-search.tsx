'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  ArrowRight,
  Lock,
  MapPin,
  Bus,
  Calendar,
  Filter,
  Eye,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { BangladeshRouteMap } from './bangladesh-route-map';

export interface PublicHeroSearchProps {
  totalTripsCount: number;
  totalSeatsCount: number;
  origins: string[];
  destinations: string[];
  selectedOrigin: string;
  selectedDestination: string;
  selectedGenderType: string;
  searchDate: string;
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onGenderTypeChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1600;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export function PublicHeroSearch({
  totalTripsCount,
  totalSeatsCount,
  origins,
  destinations,
  selectedOrigin,
  selectedDestination,
  selectedGenderType,
  searchDate,
  onOriginChange,
  onDestinationChange,
  onGenderTypeChange,
  onDateChange,
  onResetFilters,
  filteredCount,
}: PublicHeroSearchProps) {
  const { language, t } = useApp();
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [passengerSession, setPassengerSession] = useState<{ phone: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // The phone number is remembered locally (PIN is server-side only).
      const phone = localStorage.getItem('atoms_passenger_phone');
      if (phone) {
        try {
          const rawHistory = localStorage.getItem('atoms_passenger_history');
          const history = rawHistory ? JSON.parse(rawHistory) : [];
          const found = history.find((p: any) => p.phone === phone);
          setPassengerSession({ phone, name: found?.name || phone });
        } catch {
          setPassengerSession({ phone, name: phone });
        }
      } else {
        setPassengerSession(null);
      }
    }
  }, []);

  return (
    <>
      {/* ═══════ 1. HERO SECTION ═══════ */}
      <section className="relative overflow-hidden pt-4 sm:pt-6">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 transition-colors duration-200" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 dark:opacity-20" />

        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-6 pb-12 lg:pb-16 lg:pt-8">
            {/* Left: Hero Info & Live Stats */}
            <motion.div
              className="space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>{t.landingSpecialTag || 'বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাস'}</span>
                </div>

                {passengerSession && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>স্বাগতম, {passengerSession.name}!</span>
                  </motion.div>
                )}
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                {language === 'bn' ? (
                  <>
                    বিশ্ববিদ্যালয় ভর্তি পরীক্ষার{' '}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      নিরাপদ ও নির্ভরযোগ্য
                    </span>{' '}
                    বাস সার্ভিস
                  </>
                ) : (
                  <>
                    Safe & Reliable{' '}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Special Bus Service
                    </span>{' '}
                    for University Admissions
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {t.landingHeroSubtitle || 'রাজশাহী বিশ্ববিদ্যালয় (RU) ও প্রধান কেন্দ্রসমূহ থেকে ঢাকা, চট্টগ্রাম, খুলনা, সিলেট, রংপুর ও জিএসটি গুচ্ছ কেন্দ্রসমূহে ভর্তি পরীক্ষার্থী ও অভিভাবকদের জন্য ডেডিকেটেড স্পেশাল এক্সপ্রেস বাস।'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <a
                  href="#trips"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{t.landingViewSeats || 'বাস ও সিট খুঁজুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/passenger"
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:scale-[1.02] transition-all ${
                    passengerSession
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500/40'
                  }`}
                >
                  {passengerSession ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{language === 'bn' ? 'আমার স্টুডেন্ট পোর্টাল (লগইন)' : 'My Student Dashboard'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-blue-500" />
                      <span>{language === 'bn' ? 'স্টুডেন্ট পোর্টাল (লগইন / টিকিট)' : 'Student Portal'}</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Live Stats Counters */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-center lg:text-left shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    <AnimatedCounter value={totalTripsCount} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t.landingTotalTrips || 'মোট বাস ট্রিপ'}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-center lg:text-left shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    <AnimatedCounter value={totalSeatsCount} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t.landingAvailableSeats || 'ফাঁকা আসন'}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-center lg:text-left shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    <AnimatedCounter value={98} suffix="%" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === 'bn' ? 'যথাসময়ে পৌঁছার নিশ্চয়তা' : 'On-Time Guarantee'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Bangladesh Map Component */}
            <motion.div
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-5 shadow-xl dark:shadow-2xl dark:shadow-blue-500/5">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {language === 'bn' ? 'রাজশাহী সেন্ট্রাল হাব এক্সপ্রেস নেটওয়ার্ক' : 'Rajshahi Central Hub Express'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    HEADQUARTERS
                  </span>
                </div>
                <BangladeshRouteMap showLabels={true} />
              </div>
            </motion.div>
          </div>

          {/* Mobile Map Toggle */}
          <div className="lg:hidden mb-8">
            <button
              onClick={() => setIsMapVisible(!isMapVisible)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              {isMapVisible ? (t.landingHideMap || 'মানচিত্র লুকান') : (t.landingShowMap || 'বাংলাদেশ মানচিত্র দেখুন')}
            </button>
            <AnimatePresence>
              {isMapVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-3 shadow-md">
                    <BangladeshRouteMap showLabels={true} className="max-h-[350px]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══════ 2. SEARCH / FILTER BAR ═══════ */}
      <section className="sticky top-16 z-30 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 py-3 sm:py-5 transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Origin */}
              <div className="space-y-1.5 relative group">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {t.landingFrom || 'কোথা থেকে'}
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => onOriginChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-700 appearance-none cursor-pointer"
                >
                  <option value="ALL">{t.landingAllOrigins || 'সকল উৎস'}</option>
                  {origins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-1.5 relative group">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t.landingTo || 'কোথায় যাবে'}
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm group-hover:border-emerald-300 dark:group-hover:border-emerald-700 appearance-none cursor-pointer"
                >
                  <option value="ALL">{t.landingAllDestinations || 'সকল গন্তব্য'}</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Bus Type */}
              <div className="space-y-1.5 relative group">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <Bus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {t.landingBusType || 'বাসের ধরন'}
                </label>
                <select
                  value={selectedGenderType}
                  onChange={(e) => onGenderTypeChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-3 text-sm font-bold focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm group-hover:border-amber-300 dark:group-hover:border-amber-700 appearance-none cursor-pointer"
                >
                  <option value="ALL">{t.landingAllBusesCategory || 'সকল বাস'}</option>
                  <option value="FEMALE">{t.landingFemaleBusCategory || 'মহিলা বাস'}</option>
                  <option value="MALE">{t.landingMaleBusCategory || 'ছাত্র বাস'}</option>
                  <option value="MIXED">{t.landingMixedBusCategory || 'মিক্সড বাস'}</option>
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5 relative group">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  {t.landingDate || 'তারিখ'}
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-3 text-sm font-bold focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm group-hover:border-purple-300 dark:group-hover:border-purple-700 cursor-pointer"
                />
              </div>

              {/* Results & Reset */}
              <div className="flex flex-col justify-end gap-2 pb-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg w-fit">
                  <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-900 dark:text-white font-black text-base">{filteredCount}</span>{' '}
                  {t.landingBusesFound || 'টি বাস পাওয়া গেছে'}
                </div>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-bold text-xs text-left cursor-pointer transition-colors px-1"
                >
                  {t.landingFilterReset || 'ফিল্টার রিসেট'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
