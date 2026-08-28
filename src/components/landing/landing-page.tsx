'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  PhoneCall,
  Search,
  ArrowRight,
  Filter,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Eye,
  MessageCircle,
  Timer,
  Building,
  User,
  Lock
} from 'lucide-react';
import { BangladeshMap } from '@/components/landing/bangladesh-map';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { useApp } from '@/lib/context';
import { OfficialWhatsAppIcon } from '@/components/passenger/passenger-portal-client';

interface TripData {
  id: string;
  tripCode: string;
  tripBusType: string;
  departureDate: string;
  departureTime: string;
  basePrice: number;
  status: string;
  totalSeats: number;
  bookedCount: number;
  availableCount: number;
  hasAccommodation?: boolean;
  has_accommodation?: boolean;
  bus: {
    busName: string;
    busNumber?: string;
    regNumber?: string;
    seatLayout?: { totalSeats: number };
  };
  route: {
    origin: string;
    destination: string;
    routeName?: string;
  };
}

interface LandingPageProps {
  initialTrips: TripData[];
  origins: string[];
  destinations: string[];
}

// Stats counter animation
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
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

function BookingStatusBadge({ trip, language }: { trip: TripData; language: string }) {
  const occupancy = trip.totalSeats > 0 ? (trip.bookedCount / trip.totalSeats) * 100 : 0;
  
  if (trip.availableCount <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30">
        <XCircle className="w-3 h-3" />
        {language === 'bn' ? 'বুকিং বন্ধ' : 'Sold Out'}
      </span>
    );
  }
  if (occupancy >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
        <AlertCircle className="w-3 h-3" />
        {language === 'bn' ? 'শেষ হচ্ছে!' : 'Filling Fast!'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" />
      {language === 'bn' ? 'বুকিং চলছে' : 'Booking Open'}
    </span>
  );
}

export function LandingPage({ initialTrips, origins, destinations }: LandingPageProps) {
  const { language, setLanguage, theme, setTheme, t } = useApp();
  const [trips] = useState<TripData[]>(initialTrips);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedGenderType, setSelectedGenderType] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');
  const [trackingQuery, setTrackingQuery] = useState<string>('');
  const [isMapVisible, setIsMapVisible] = useState(true);

  // Active student session detection
  const [passengerSession, setPassengerSession] = useState<{ phone: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const phone = localStorage.getItem('atoms_passenger_phone');
      const pin = localStorage.getItem('atoms_passenger_pin');
      if (phone && pin && pin.length === 4) {
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

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (selectedOrigin !== 'ALL' && trip.route?.origin !== selectedOrigin) return false;
      if (selectedDestination !== 'ALL' && trip.route?.destination !== selectedDestination) return false;
      if (selectedGenderType !== 'ALL' && trip.tripBusType !== selectedGenderType) return false;
      if (searchDate) {
        const tripDateStr = new Date(trip.departureDate).toISOString().slice(0, 10);
        if (tripDateStr !== searchDate) return false;
      }
      return true;
    });
  }, [trips, selectedOrigin, selectedDestination, selectedGenderType, searchDate]);

  // Stats
  const totalAvailableSeats = filteredTrips.reduce((acc, t) => acc + t.availableCount, 0);
  const totalTrips = filteredTrips.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200 overflow-x-hidden relative">

      {/* ═══════ 1. HERO SECTION WITH MAP ═══════ */}
      <section className="relative overflow-hidden pt-4 sm:pt-6">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 transition-colors duration-200" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 dark:opacity-20" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-500/40 dark:bg-blue-400/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-6 pb-12 lg:pb-16 lg:pt-8">

            {/* Left: Hero Text + Stats */}
            <motion.div
              className="space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badges: Tagline + Active User Session Indicator */}
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

              {/* Title */}
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
                {t.landingHeroSubtitle || 'ঢাকা থেকে রাজশাহী, চট্টগ্রাম, জাহাঙ্গীরনগর, খুলনা ও জিএসটি গুচ্ছ কেন্দ্রসমূহে ভর্তি পরীক্ষার্থী ও অভিভাবকদের জন্য ডেডিকেটেড স্পেশাল বাস।'}
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
                    <AnimatedCounter value={totalTrips} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t.landingTotalTrips || 'মোট বাস ট্রিপ'}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-center lg:text-left shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    <AnimatedCounter value={totalAvailableSeats} />
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'লাইভ এক্সপ্রেস রুট ম্যাপ' : 'Live Express Routes'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                    GPS TRACKED
                  </span>
                </div>
                <BangladeshMap showLabels={true} />
              </div>
            </motion.div>
          </div>

          {/* Mobile map (show/hide toggle) */}
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
                    <BangladeshMap showLabels={true} className="max-h-[350px]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══════ 2. SEARCH / FILTER BAR ═══════ */}
      <section className="sticky top-16 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-lg dark:shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Origin */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  {t.landingFrom || 'কোথা থেকে'}
                </label>
                <select
                  value={selectedOrigin}
                  onChange={e => setSelectedOrigin(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                >
                  <option value="ALL">{t.landingAllOrigins || 'সকল উৎস'}</option>
                  {origins.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {t.landingTo || 'কোথায় যাবে'}
                </label>
                <select
                  value={selectedDestination}
                  onChange={e => setSelectedDestination(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                >
                  <option value="ALL">{t.landingAllDestinations || 'সকল গন্তব্য'}</option>
                  {destinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Bus Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Bus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  {t.landingBusType || 'বাসের ধরন'}
                </label>
                <select
                  value={selectedGenderType}
                  onChange={e => setSelectedGenderType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                >
                  <option value="ALL">{t.landingAllBusesCategory || 'সকল বাস'}</option>
                  <option value="FEMALE">{t.landingFemaleBusCategory || 'মহিলা বাস'}</option>
                  <option value="MALE">{t.landingMaleBusCategory || 'ছাত্র বাস'}</option>
                  <option value="MIXED">{t.landingMixedBusCategory || 'মিক্সড বাস'}</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  {t.landingDate || 'তারিখ'}
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>

              {/* Results + Reset */}
              <div className="flex flex-col justify-end gap-1.5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-900 dark:text-white font-bold">{filteredTrips.length}</span> {t.landingBusesFound || 'টি বাস পাওয়া গেছে'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrigin('ALL');
                    setSelectedDestination('ALL');
                    setSelectedGenderType('ALL');
                    setSearchDate('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] text-left cursor-pointer"
                >
                  {t.landingFilterReset || 'ফিল্টার রিসেট'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 3. TRIP LISTINGS ═══════ */}
      <section id="trips" className="py-12 bg-slate-100/60 dark:bg-slate-900/30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t.landingLiveBusSchedule || 'চলমান বাসের তালিকা'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.landingLiveBusSubtitle || 'লাইভ সিট সংখ্যা ও সরাসরি প্রি-বুকিং অপশন'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Availability
              </span>
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <motion.div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Bus className="w-14 h-14 text-slate-400 dark:text-slate-700 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'কোনো বাস ট্রিপ পাওয়া যায়নি' : 'No Bus Trips Found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আবার দেখুন।' : 'Try adjusting filters or check back later.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip, idx) => {
                const occupancy = trip.totalSeats > 0 ? Math.round((trip.bookedCount / trip.totalSeats) * 100) : 0;
                const isSoldOut = trip.availableCount <= 0;
                const hasAccommodation = Boolean(trip.hasAccommodation || trip.has_accommodation);

                return (
                  <motion.div
                    key={trip.id}
                    className={`relative bg-white dark:bg-slate-900/90 border rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 group flex flex-col justify-between ${
                      isSoldOut ? 'border-red-300 dark:border-red-900/40 opacity-80' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {/* Top gradient strip */}
                    <div className={`h-2 w-full bg-gradient-to-r ${
                      trip.tripBusType === 'FEMALE' ? 'from-pink-500 via-rose-500 to-purple-500' :
                      trip.tripBusType === 'MALE' ? 'from-blue-500 via-indigo-500 to-cyan-500' :
                      'from-emerald-500 via-teal-500 to-cyan-500'
                    }`} />

                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                              {trip.tripCode}
                            </span>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                              {trip.bus?.busName}
                            </h3>
                          </div>
                          <BookingStatusBadge trip={trip} language={language} />
                        </div>

                        {/* Badges: Coach Type & Accommodation */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            trip.tripBusType === 'FEMALE' 
                              ? 'bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30' 
                              : trip.tripBusType === 'MALE' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30'
                          }`}>
                            {trip.tripBusType === 'FEMALE' ? '🚺 মহিলা স্পেশাল বাস' : trip.tripBusType === 'MALE' ? '🚹 ছাত্র স্পেশাল বাস' : '🚌 মিক্সড এক্সপ্রেস'}
                          </span>

                          {hasAccommodation && (
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              আবাসন প্যাকেজ অন্তর্ভুক্ত
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Route Info Box */}
                      <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex-1">
                            <div className="text-[10px] text-slate-500 font-medium mb-0.5">
                              {language === 'bn' ? 'কোথা থেকে' : 'Origin'}
                            </div>
                            <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{trip.route?.origin}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center px-1">
                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-[10px] text-slate-500 font-medium mb-0.5">
                              {language === 'bn' ? 'কোথায় যাবে' : 'Destination'}
                            </div>
                            <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 justify-end">
                              <span className="truncate">{trip.route?.destination}</span>
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/50 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(trip.departureDate)}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white font-mono">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {formatTime(trip.departureTime)}
                          </span>
                        </div>
                      </div>

                      {/* Price & Availability */}
                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {language === 'bn' ? 'ভাড়া (প্রতি সিট)' : 'Fare'}
                          </div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(trip.basePrice)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {language === 'bn' ? 'ফাঁকা আসন' : 'Seats Available'}
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={`text-xl font-mono ${
                              isSoldOut ? 'text-red-500 dark:text-red-400' : trip.availableCount > 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {trip.availableCount}
                            </span>
                            <span className="text-slate-400 text-xs font-mono">/ {trip.totalSeats}</span>
                          </div>
                        </div>
                      </div>

                      {/* Occupancy Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            isSoldOut ? 'bg-red-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'
                          }`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${occupancy}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>

                      {/* Action Button: Direct navigation to dedicated Student Seat Booking page */}
                      <Link
                        href={`/book/${trip.id}`}
                        className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                          isSoldOut 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none shadow-none'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/40 hover:scale-[1.01]'
                        }`}
                      >
                        {isSoldOut ? (
                          (language === 'bn' ? 'সিট পূর্ণ (Sold Out)' : 'Sold Out')
                        ) : (
                          <>
                            {language === 'bn' ? 'সিট দেখুন ও প্রি-বুকিং করুন' : 'View Seats & Pre-Book'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ 4. BOOKING TRACKING ═══════ */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              onSubmit={e => {
                e.preventDefault();
                if (trackingQuery.trim()) {
                  window.location.href = `/track/${trackingQuery.trim()}`;
                }
              }}
              className="flex w-full lg:w-auto items-center gap-2"
            >
              <input
                type="text"
                placeholder={language === 'bn' ? 'বুকিং নম্বর বা মোবাইল' : 'Booking Ref or Phone'}
                value={trackingQuery}
                onChange={e => setTrackingQuery(e.target.value)}
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

      {/* ═══════ 5. VALUE PROPOSITIONS ═══════ */}
      <section className="py-12 bg-white/50 dark:bg-slate-900/30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: language === 'bn' ? 'নিরাপদ যাত্রা' : 'Safe Transit', desc: language === 'bn' ? 'প্রশিক্ষিত ড্রাইভার ও সুপারভাইজার' : 'Certified drivers & strict security', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { icon: Users, title: language === 'bn' ? 'অভিভাবকদের সাথে' : 'Guardian Accompanied', desc: language === 'bn' ? 'ছাত্র-ছাত্রী ও অভিভাবক একসাথে' : 'Student & guardian side-by-side', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { icon: MessageCircle, title: language === 'bn' ? 'WhatsApp সাপোর্ট' : 'WhatsApp Support', desc: language === 'bn' ? 'টিকিট ও তথ্য সরাসরি WhatsApp-এ' : 'Instant updates & PDF tickets', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
              { icon: Star, title: language === 'bn' ? 'প্রিমিয়াম সার্ভিস' : 'Premium Fleet', desc: language === 'bn' ? 'এসি বাস ও আরামদায়ক আসন' : 'AC executive coaches & reclining seats', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ 6. HELPLINE / CONTACT ═══════ */}
      <section className="py-8 border-t border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-transparent transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-5 py-2.5 rounded-full text-sm font-bold shadow-xs">
              <PhoneCall className="w-4 h-4 animate-pulse text-emerald-600 dark:text-emerald-400" />
              {t.landingHelpline || 'হেল্পলাইন: 01711-000001'}
            </div>
            <a
              href="https://wa.me/8801711000001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/60 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors shadow-xs"
            >
              <OfficialWhatsAppIcon className="w-4 h-4" />
              {language === 'bn' ? 'WhatsApp-এ সহায়তা নিন' : 'WhatsApp Support'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
