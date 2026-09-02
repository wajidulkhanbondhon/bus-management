'use client';

import React, { useState, useMemo } from 'react';
import {
  Bus,
  AlertCircle,
  Search,
  RotateCcw,
  ArrowUpDown,
  GraduationCap,
  Building2,
  DollarSign,
  MapPin,
  Clock,
  Armchair,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

const COLOR_OPTIONS: { id: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }[] = [
  { id: 'emerald', bgClass: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/70 dark:to-emerald-900/70', borderClass: 'border-emerald-500 dark:border-emerald-400', textClass: 'text-emerald-950 dark:text-emerald-100', dotClass: 'bg-emerald-500' },
  { id: 'blue', bgClass: 'from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/70', borderClass: 'border-blue-500 dark:border-blue-400', textClass: 'text-blue-950 dark:text-blue-100', dotClass: 'bg-blue-500' },
  { id: 'purple', bgClass: 'from-purple-50 to-purple-100 dark:from-purple-950/70 dark:to-purple-900/70', borderClass: 'border-purple-500 dark:border-purple-400', textClass: 'text-purple-950 dark:text-purple-100', dotClass: 'bg-purple-500' },
  { id: 'amber', bgClass: 'from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/70', borderClass: 'border-amber-500 dark:border-amber-400', textClass: 'text-amber-950 dark:text-amber-100', dotClass: 'bg-amber-500' },
  { id: 'rose', bgClass: 'from-rose-50 to-rose-100 dark:from-rose-950/70 dark:to-rose-900/70', borderClass: 'border-rose-500 dark:border-rose-400', textClass: 'text-rose-950 dark:text-rose-100', dotClass: 'bg-rose-500' },
  { id: 'cyan', bgClass: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/70 dark:to-cyan-900/70', borderClass: 'border-cyan-500 dark:border-cyan-400', textClass: 'text-cyan-950 dark:text-cyan-100', dotClass: 'bg-cyan-500' }
];

interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: string;
}

export interface TripStepProps {
  trips: any[];
  activeCapacity: number;
  targetUniversity: string;
  activeSegments: FareRangeSegment[];
  currentUser?: any;
  onSelectTrip: (tripId: string) => void;
  onBack?: () => void;
}

const rowLetters = 'ABCDEFGHIJKLMN';

function matchTripUniversityCode(t: any): string {
  const targetUni = (t.targetUniversity || '').trim();
  const dest = (t.route?.destination || t.route?.routeName || '').trim();
  const combined = `${targetUni} ${dest}`.trim();
  if (!combined) return 'OTHER';
  const upper = combined.toUpperCase();
  if (/\bRU\b|\(RU\)|RAJSHAHI|রাজশাহী|রাবি/i.test(upper)) return 'RU';
  if (/\bDU\b|\(DU\)|DHAKA UNIVERSITY|ঢাকা বিশ্ববিদ্যালয়|ঢাবি/i.test(upper)) return 'DU';
  if (/\bCU\b|\(CU\)|CHITTAGONG|CHATTOGRAM|চট্টগ্রাম বিশ্ববিদ্যালয়|চবি/i.test(upper)) return 'CU';
  if (/\bJU\b|\(JU\)|JAHANGIRNAGAR|জাহাঙ্গীরনগর|জাবি/i.test(upper)) return 'JU';
  if (/\bGST\b|\(GST\)|গুচ্ছ|CLUSTER/i.test(upper)) return 'GST';
  if (/\bBUET\b|\(BUET\)|বুয়েট/i.test(upper)) return 'BUET';
  if (/\bCKRUET\b|ইঞ্জিনিয়ারিং গুচ্ছ/i.test(upper)) return 'ENGG';
  if (/\bKUET\b|\(KUET\)|খুলনা প্রকৌশল|কুয়েট/i.test(upper)) return 'KUET';
  if (/\bRUET\b|\(RUET\)|রাজশাহী প্রকৌশল|রুয়েট/i.test(upper)) return 'RUET';
  if (/\bCUET\b|\(CUET\)|চট্টগ্রাম প্রকৌশল|চুয়েট/i.test(upper)) return 'CUET';
  if (/\bSUST\b|\(SUST\)|শাহজালাল|সাস্ট/i.test(upper)) return 'SUST';
  if (/\bAGRI\b|\(AGRI\)|কৃষি গুচ্ছ/i.test(upper)) return 'AGRI';
  if (/\bBAU\b|\(BAU\)|বাংলাদেশ কৃষি বিশ্ববিদ্যালয়/i.test(upper)) return 'BAU';
  if (/\bMED\b|\(MED\)|মেডিকেল|ডেন্টাল|DENTAL/i.test(upper)) return 'MED';
  if (/\bJNU\b|\(JNU\)|জগন্নাথ বিশ্ববিদ্যালয়|জবি/i.test(upper)) return 'JNU';
  if (/\bBUP\b|\(BUP\)|বিইউপি/i.test(upper)) return 'BUP';
  if (/\bIU\b|\(IU\)|ইসলামী বিশ্ববিদ্যালয়|ইবি/i.test(upper)) return 'IU';
  if (/\bCOU\b|\(COU\)|কুমিল্লা বিশ্ববিদ্যালয়|কুবি/i.test(upper)) return 'COU';
  if (/\bBRUR\b|\(BRUR\)|বেগম রোকেয়া|বেরোবি/i.test(upper)) return 'BRUR';
  if (/\bPSTU\b|\(PSTU\)|পটুয়াখালী বিজ্ঞান/i.test(upper)) return 'PSTU';
  if (/\bHSTU\b|\(HSTU\)|হাজী দানেশ/i.test(upper)) return 'HSTU';
  if (/\bMBSTU\b|\(MBSTU\)|মাওলানা ভাসানী/i.test(upper)) return 'MBSTU';
  if (/\bNSTU\b|\(NSTU\)|নোয়াখালী বিজ্ঞান/i.test(upper)) return 'NSTU';
  if (/\bJUST\b|\(JUST\)|যশোর বিজ্ঞান/i.test(upper)) return 'JUST';
  if (/\bBSMRSTU\b|\(BSMRSTU\)|বশেমুরবিপ্রবি|গোপালগঞ্জ/i.test(upper)) return 'BSMRSTU';
  return targetUni || dest || 'OTHER';
}

export function TripSelectionStep({
  trips,
  activeCapacity,
  targetUniversity,
  activeSegments,
  currentUser,
  onSelectTrip,
  onBack
}: TripStepProps) {
  const { language } = useApp();
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [selectedUniFilter, setSelectedUniFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedOccupancyFilter, setSelectedOccupancyFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('ALL');
  const [selectedFareFilter, setSelectedFareFilter] = useState('ALL');
  const [selectedSeatFilter, setSelectedSeatFilter] = useState('');
  const [customFareInput, setCustomFareInput] = useState('');
  const [selectedSortOrder, setSelectedSortOrder] = useState('DEFAULT');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [expandedSeatPreviewTripId, setExpandedSeatPreviewTripId] = useState<string | null>(null);

  // Fleet aggregate stats
  const fleetStats = useMemo(() => {
    let totalSeats = 0;
    let totalBooked = 0;
    trips.forEach((t) => {
      const cap = t.stats?.totalSeats || t.bus?.capacity || 45;
      const booked = t.stats?.bookedCount || 0;
      totalSeats += cap;
      totalBooked += booked;
    });
    return {
      coaches: trips.length,
      totalSeats,
      totalBooked,
      totalAvailable: totalSeats - totalBooked,
      soldPct: totalSeats > 0 ? Math.round((totalBooked / totalSeats) * 100) : 0
    };
  }, [trips]);

  // University options derived from trips
  const universityOptions = useMemo(() => {
    const uniMap: Record<string, { code: string; label: string; count: number; minFare: number; maxFare: number; freeSeats: number }> = {};
    trips.forEach((t) => {
      const code = matchTripUniversityCode(t);
      if (!uniMap[code]) {
        uniMap[code] = { code, label: t.targetUniversity || code, count: 0, minFare: 0, maxFare: 0, freeSeats: 0 };
      }
      const fare = Number(t.basePrice) || 550;
      const free = t.stats?.availableCount ?? 45;
      const entry = uniMap[code];
      entry.count += 1;
      entry.freeSeats += free;
      if (entry.minFare === 0 || fare < entry.minFare) entry.minFare = fare;
      if (entry.maxFare === 0 || fare > entry.maxFare) entry.maxFare = fare;
    });
    return Object.values(uniMap).sort((a, b) => b.count - a.count);
  }, [trips]);

  const operatorOptions = useMemo(() => {
    const opMap: Record<string, number> = {};
    trips.forEach((t) => {
      const op = (t.bus?.operator || '').trim();
      if (op) opMap[op] = (opMap[op] || 0) + 1;
    });
    return Object.entries(opMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [trips]);

  const unitOptions = useMemo(() => {
    const uMap: Record<string, number> = {};
    trips.forEach((t) => {
      const u = (t.examUnit || '').trim();
      if (u) uMap[u] = (uMap[u] || 0) + 1;
    });
    return Object.entries(uMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [trips]);

  const dateOptions = useMemo(() => {
    const dateMap: Record<string, number> = {};
    trips.forEach((t) => {
      const d = (t.departureDate || '').toString().split('T')[0];
      if (d) dateMap[d] = (dateMap[d] || 0) + 1;
    });
    return Object.entries(dateMap);
  }, [trips]);

  const allFleetAvailableSeats = useMemo(() => {
    const seatSet = new Set<string>();
    trips.forEach((t) => {
      (t.stats?.availableSeatNumbersPreview || []).forEach((s: string) => seatSet.add(s.toUpperCase()));
    });
    return Array.from(seatSet).sort((a, b) => {
      const rowA = a.charAt(0);
      const rowB = b.charAt(0);
      if (rowA !== rowB) return rowA.localeCompare(rowB);
      return (parseInt(a.slice(1)) || 0) - (parseInt(b.slice(1)) || 0);
    });
  }, [trips]);

  const hasActiveFilters = !!(busSearchQuery || selectedUniFilter !== 'ALL' || selectedGenderFilter !== 'ALL' || selectedCompanyFilter !== 'ALL' || selectedOccupancyFilter !== 'ALL' || selectedDateFilter !== 'ALL' || selectedHotelFilter !== 'ALL' || selectedFareFilter !== 'ALL' || selectedSeatFilter || customFareInput || selectedSortOrder !== 'DEFAULT' || selectedUnitFilter !== 'ALL');

  const resetFilters = () => {
    setBusSearchQuery('');
    setSelectedUniFilter('ALL');
    setSelectedGenderFilter('ALL');
    setSelectedCompanyFilter('ALL');
    setSelectedOccupancyFilter('ALL');
    setSelectedDateFilter('ALL');
    setSelectedHotelFilter('ALL');
    setSelectedFareFilter('ALL');
    setSelectedSeatFilter('');
    setCustomFareInput('');
    setSelectedSortOrder('DEFAULT');
    setSelectedUnitFilter('ALL');
  };

  const filteredTrips = useMemo(() => {
    const filtered = trips.filter((t) => {
      if (selectedUniFilter !== 'ALL' && matchTripUniversityCode(t) !== selectedUniFilter) return false;

      const baseFare = Number(t.basePrice) || 550;
      if (selectedFareFilter !== 'ALL') {
        if (selectedFareFilter.startsWith('MAX_') && baseFare > Number(selectedFareFilter.replace('MAX_', ''))) return false;
        if (selectedFareFilter.startsWith('EXACT_') && baseFare !== Number(selectedFareFilter.replace('EXACT_', ''))) return false;
        if (selectedFareFilter === 'CUSTOM' && customFareInput && baseFare > Number(customFareInput)) return false;
      }

      if (selectedSeatFilter.trim()) {
        const requestedSeats = selectedSeatFilter.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
        const freeSeats: string[] = (t.stats?.availableSeatNumbersPreview || []).map((s: string) => s.toUpperCase());
        if (requestedSeats.length > 0 && !requestedSeats.every((req) => freeSeats.includes(req))) return false;
      }

      const busType = (t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED').toUpperCase();
      if (selectedGenderFilter !== 'ALL' && busType !== selectedGenderFilter) return false;

      const totalSeats = t.stats?.totalSeats || t.bus?.capacity || 45;
      const bookedCount = t.stats?.bookedCount || 0;
      const availableCount = t.stats?.availableCount ?? (totalSeats - bookedCount);
      const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);

      if (selectedOccupancyFilter === 'AVAILABLE' && availableCount <= 0) return false;
      if (selectedOccupancyFilter === 'SELLING_FAST' && soldPct < 40) return false;
      if (selectedOccupancyFilter === 'NEARLY_FULL' && soldPct < 80) return false;
      if (selectedOccupancyFilter === 'EMPTY' && bookedCount > 0) return false;
      if (selectedOccupancyFilter === 'FULL' && availableCount > 0) return false;
      if (selectedOccupancyFilter === 'DOUBLE_SEAT') {
        const freeSeats: string[] = (t.stats?.availableSeatNumbersPreview || []).map((s: string) => s.toUpperCase());
        let hasDouble = false;
        for (const s of freeSeats) {
          const m = s.match(/^([A-Z]+)(\d+)$/);
          if (m) {
            const row = m[1];
            const num = parseInt(m[2], 10);
            if ((num === 1 && freeSeats.includes(`${row}2`)) || (num === 3 && freeSeats.includes(`${row}4`))) hasDouble = true;
          }
          if (hasDouble) break;
        }
        if (!hasDouble) return false;
      }

      if (selectedDateFilter !== 'ALL') {
        const dStr = (t.departureDate || '').toString().split('T')[0];
        if (dStr !== selectedDateFilter) return false;
      }

      if (selectedUnitFilter !== 'ALL') {
        const u = (t.examUnit || '').trim();
        if (u !== selectedUnitFilter) return false;
      }

      const hasHotel = !!(t.hotelPackage || (t.bus?.notes && t.bus.notes.includes('HOTEL PACKAGE:')));
      if (selectedHotelFilter === 'HOTEL_ONLY' && !hasHotel) return false;
      if (selectedHotelFilter === 'BUS_ONLY' && hasHotel) return false;

      if (selectedCompanyFilter !== 'ALL') {
        const op = (t.bus?.operator || '').toLowerCase();
        if (!op.includes(selectedCompanyFilter.toLowerCase())) return false;
      }

      if (busSearchQuery.trim()) {
        const q = busSearchQuery.toLowerCase();
        const haystack = [
          t.bus?.busName, t.bus?.bus_name, t.bus?.busNumber, t.bus?.bus_number,
          t.route?.routeName, t.route?.route_name, t.bus?.operator, t.targetUniversity
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const aFree = a.stats?.availableCount ?? 45;
      const bFree = b.stats?.availableCount ?? 45;
      const aSold = a.stats?.soldPercentage ?? 0;
      const bSold = b.stats?.soldPercentage ?? 0;
      const aFare = Number(a.basePrice) || 550;
      const bFare = Number(b.basePrice) || 550;
      if (selectedSortOrder === 'SEATS_FREE_DESC') return bFree - aFree;
      if (selectedSortOrder === 'SOLD_DESC') return bSold - aSold;
      if (selectedSortOrder === 'FARE_ASC') return aFare - bFare;
      if (selectedSortOrder === 'FARE_DESC') return bFare - aFare;
      if (selectedSortOrder === 'TIME_ASC') {
        const aTime = `${a.departureDate || ''} ${a.departureTime || ''}`;
        const bTime = `${b.departureDate || ''} ${b.departureTime || ''}`;
        return aTime.localeCompare(bTime);
      }
      return 0;
    });
  }, [trips, selectedUniFilter, selectedFareFilter, customFareInput, selectedSeatFilter, selectedGenderFilter, selectedOccupancyFilter, selectedDateFilter, selectedHotelFilter, selectedCompanyFilter, busSearchQuery, selectedSortOrder, selectedUnitFilter]);

  const selectStyle = (isActive: boolean, activeColor = 'bg-blue-600 text-white shadow-md shadow-blue-500/20') =>
    `px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
      isActive ? activeColor : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/60 via-slate-50 to-transparent dark:from-slate-800/60 dark:via-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Bus className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'বাস ও শিডিউল নির্বাচন' : 'Select Bus & Schedule'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11 font-medium">
            {language === 'bn'
              ? 'যে বাসটির সিট বুকিং বা টিকিট ইস্যু করতে চান সেটি বেছে নিন'
              : 'Select the admission coach you want to book or issue tickets for.'}
          </p>
        </div>
        <Badge variant="primary" className="font-mono text-xs font-bold px-3 py-1.5 shadow-2xs">
          {trips.length} {language === 'bn' ? 'টি বাস প্রস্তুত' : 'Buses Ready'}
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Fleet Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { label: language === 'bn' ? 'মোট সক্রিয় কোচ' : 'Active Coaches', value: String(fleetStats.coaches), icon: '🚌', color: 'text-blue-600 dark:text-blue-400' },
            { label: language === 'bn' ? 'মোট খালি সিট' : 'Total Free Seats', value: String(fleetStats.totalAvailable), icon: '🟢', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: language === 'bn' ? 'মোট বিক্রিত সিট' : 'Total Booked Seats', value: String(fleetStats.totalBooked), icon: '🔴', color: 'text-rose-600 dark:text-rose-400' },
            { label: language === 'bn' ? 'ফ্লিট বিক্রি হার' : 'Fleet Sold', value: `${fleetStats.soldPct}%`, icon: '🔥', color: 'text-amber-600 dark:text-amber-400' }
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] sm:text-[11px] truncate">
                {s.icon} {s.label}
              </span>
              <span className={`text-lg sm:text-2xl font-black font-mono block ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* --- PREMIUM FILTER SECTION --- */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4 relative z-10 -mx-4 sm:-mx-6 px-4 sm:px-6">
          
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'ফিল্টার ও অনুসন্ধান' : 'Filter & Search'}
            </h3>
          </div>

          {/* Top Row: Search & Sort */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busSearchQuery}
                onChange={(e) => setBusSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'বিশ্ববিদ্যালয়, বাসের নাম, রুট দিয়ে খুঁজুন...' : 'Search university, bus, route...'}
                className="w-full pl-12 pr-4 py-3 text-sm font-bold rounded-2xl border-0 bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-4 py-3 rounded-2xl min-w-[160px]">
                <ArrowUpDown className="w-4 h-4 text-blue-500 shrink-0" />
                <select
                  value={selectedSortOrder}
                  onChange={(e) => setSelectedSortOrder(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="DEFAULT">{language === 'bn' ? 'সাজান: ডিফল্ট' : 'Sort: Default'}</option>
                  <option value="SEATS_FREE_DESC">🟢 বেশি সিট খালি</option>
                  <option value="SOLD_DESC">🔥 দ্রুত বিক্রি</option>
                  <option value="TIME_ASC">🕒 ছাড়ার সময়</option>
                  <option value="FARE_ASC">💰 কম ভাড়া</option>
                  <option value="FARE_DESC">💰 বেশি ভাড়া</option>
                </select>
              </div>
              
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title={language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Core dropdown filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 focus-within:border-blue-400/50 transition-colors">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {language === 'bn' ? 'বিশ্ববিদ্যালয়' : 'University'}
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={selectedUniFilter}
                  onChange={(e) => setSelectedUniFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                >
                  <option value="ALL">🎓 {language === 'bn' ? `সকল বিশ্ববিদ্যালয় (${trips.length}টি বাস)` : `All Universities (${trips.length})`}</option>
                  {universityOptions.map((u) => {
                    const fareStr = u.minFare === u.maxFare ? `৳${u.minFare}` : `৳${u.minFare}-৳${u.maxFare}`;
                    return (
                      <option key={u.code} value={u.code}>
                        🟢 {u.label} — {fareStr} • {u.count}টি বাস ({u.freeSeats} সিট খালি)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 focus-within:border-emerald-400/50 transition-colors">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {language === 'bn' ? 'কোম্পানি' : 'Company'}
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                >
                  <option value="ALL">🏢 {language === 'bn' ? `সকল কোম্পানি (${trips.length}টি)` : `All Companies (${trips.length})`}</option>
                  {operatorOptions.map((op) => (
                    <option key={op.name} value={op.name}>{op.name} ({op.count}টি বাস)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 focus-within:border-amber-400/50 transition-colors">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {language === 'bn' ? 'ভাড়া / বাজেট' : 'Budget'}
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={selectedFareFilter}
                  onChange={(e) => {
                    setSelectedFareFilter(e.target.value);
                    if (e.target.value !== 'CUSTOM') setCustomFareInput('');
                  }}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                >
                  <option value="ALL">💰 {language === 'bn' ? 'সকল ভাড়া' : 'All Fares'}</option>
                  {[700, 650, 600, 500, 450].map((fare) => (
                    <option key={`MAX_${fare}`} value={`MAX_${fare}`}>সর্বোচ্চ ৳{fare} পর্যন্ত (≤ ৳{fare})</option>
                  ))}
                  <option disabled className="text-slate-300">──────────</option>
                  {[700, 650, 600, 500, 450].map((fare) => (
                    <option key={`EXACT_${fare}`} value={`EXACT_${fare}`}>শুধু ৳{fare} ভাড়ার বাস</option>
                  ))}
                  <option value="CUSTOM">{language === 'bn' ? 'কাস্টম বাজেট লিখুন...' : 'Custom Budget...'}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 focus-within:border-purple-400/50 transition-colors">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {language === 'bn' ? 'ইউনিট' : 'Unit'}
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                >
                  <option value="ALL">📝 {language === 'bn' ? `সকল ইউনিট` : `All Units`}</option>
                  {unitOptions.map((u) => (
                    <option key={u.name} value={u.name}>{u.name} ({u.count})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedFareFilter === 'CUSTOM' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center gap-3">
              <span className="font-bold text-amber-800 dark:text-amber-200 text-sm">💰 সর্বোচ্চ বাজেট (টাকা):</span>
              <input
                type="number"
                value={customFareInput}
                onChange={(e) => setCustomFareInput(e.target.value)}
                placeholder="e.g. 600"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-none text-slate-900 dark:text-white font-mono font-bold w-24 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                (৳{customFareInput || '০'} বা তার চেয়ে কম ভাড়ার বাস দেখাবে)
              </span>
            </div>
          )}

          {/* Expanded Pills Section (Scrollable on mobile) */}
          <div className="pt-2 flex flex-col gap-4">
            
            {/* Date & Seats row */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {language === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setSelectedDateFilter('ALL')} className={selectStyle(selectedDateFilter === 'ALL')}>
                    {language === 'bn' ? 'সকল' : 'All'}
                  </button>
                  {dateOptions.map(([dStr, dCount]) => (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => setSelectedDateFilter(selectedDateFilter === dStr ? 'ALL' : dStr)}
                      className={selectStyle(selectedDateFilter === dStr)}
                    >
                      <span>{dStr}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] leading-none ${selectedDateFilter === dStr ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                        {dCount}
                      </span>
                    </button>
                  ))}
                  <input
                    type="date"
                    value={selectedDateFilter === 'ALL' ? '' : selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value || 'ALL')}
                    className="px-3 py-1 text-[11px] h-[30px] font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between pl-1">
                  <span className="flex items-center gap-1.5">
                    <Armchair className="w-3.5 h-3.5 text-indigo-500" />
                    {language === 'bn' ? 'নির্দিষ্ট সিট নাম্বার খুঁজুন' : 'Find Specific Seats'}
                  </span>
                  {selectedSeatFilter && (
                    <button onClick={() => setSelectedSeatFilter('')} className="text-rose-500 hover:text-rose-600 cursor-pointer uppercase text-[9px] font-bold">
                      {language === 'bn' ? 'মুছুন ✕' : 'Clear ✕'}
                    </button>
                  )}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={selectedSeatFilter}
                    onChange={(e) => setSelectedSeatFilter(e.target.value.toUpperCase())}
                    placeholder="Ex: A1, B3"
                    className="w-24 px-3 py-1.5 text-[11px] h-[30px] font-bold font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
                  />
                  {(allFleetAvailableSeats.length > 0 ? allFleetAvailableSeats.slice(0, 10) : ['A1', 'A2', 'A3', 'B1', 'B2', 'C1']).map((seatCode) => (
                    <button
                      key={seatCode}
                      type="button"
                      onClick={() => setSelectedSeatFilter(selectedSeatFilter === seatCode ? '' : seatCode)}
                      className={selectStyle(selectedSeatFilter === seatCode, 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20')}
                    >
                      {seatCode}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Status, Gender, Hotel Pills */}
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2">
                {language === 'bn' ? 'ফিল্টার:' : 'Filters:'}
              </span>
              
              {/* Status */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex-wrap">
                {[
                  { id: 'ALL', label: 'সকল বাস' },
                  { id: 'AVAILABLE', label: '🟢 খালি সিট' },
                  { id: 'DOUBLE_SEAT', label: '👩‍❤️‍👨 ডাবল সিট' },
                  { id: 'SELLING_FAST', label: '🔥 দ্রুত বিক্রি' },
                  { id: 'NEARLY_FULL', label: '🔴 প্রায় পূর্ণ' },
                  { id: 'EMPTY', label: '✨ ফাঁকা' },
                  { id: 'FULL', label: '❌ বুকিং ফুল' }
                ].map((occ) => (
                  <button key={occ.id} type="button" onClick={() => setSelectedOccupancyFilter(occ.id)} className={selectStyle(selectedOccupancyFilter === occ.id, 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md')}>
                    {occ.label}
                  </button>
                ))}
              </div>

              {/* Gender */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex-wrap">
                {[
                  { id: 'ALL', label: 'সকল' },
                  { id: 'FEMALE', label: '👩 ছাত্রী' },
                  { id: 'MALE', label: '👨 ছাত্র' },
                  { id: 'MIXED', label: '👥 মিক্সড' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenderFilter(g.id)}
                    className={selectStyle(
                      selectedGenderFilter === g.id,
                      g.id === 'FEMALE' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : g.id === 'MALE' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Hotel */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex-wrap">
                {[
                  { id: 'ALL', label: 'সকল' },
                  { id: 'HOTEL_ONLY', label: '🏨 হোটেল প্যাকেজ' }
                ].map((hp) => (
                  <button key={hp.id} type="button" onClick={() => setSelectedHotelFilter(hp.id)} className={selectStyle(selectedHotelFilter === hp.id, 'bg-purple-600 text-white shadow-md shadow-purple-500/20')}>
                    {hp.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Results */}
        {filteredTrips.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
                {selectedSeatFilter
                  ? `⚠️ সিট "${selectedSeatFilter}" কোনো বাসে খালি পাওয়া যায়নি!`
                  : language === 'bn' ? 'কোনো সক্রিয় বাস পাওয়া যায়নি' : 'No active buses match your criteria'}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'bn' ? 'দয়া করে ফিল্টার পরিবর্তন বা রিসেট করুন।' : 'Please adjust your filter settings.'}
              </p>
            </div>
            {selectedSeatFilter && allFleetAvailableSeats.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  💡 {language === 'bn' ? 'বর্তমানে অন্যান্য যে সিটগুলো খালি আছে:' : 'Other currently available seats:'}
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {allFleetAvailableSeats.slice(0, 14).map((altSeat) => (
                    <button
                      key={altSeat}
                      type="button"
                      onClick={() => setSelectedSeatFilter(altSeat)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold hover:bg-emerald-100 cursor-pointer transition-all"
                    >
                      {altSeat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={resetFilters} className="mx-auto">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? 'সকল ফিল্টার রিসেট' : 'Reset All Filters'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((t) => {
              const busType = t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED';
              const busName = t.bus?.busName || t.bus?.bus_name || 'Express Coach';
              const busNumber = t.bus?.busNumber || t.bus?.bus_number || '';
              const operator = t.bus?.operator || 'Central Transport Office';
              const routeName = t.route?.routeName || t.route?.route_name || 'Admission Route';
              const hotelPackage = t.hotelPackage || (t.bus?.notes && t.bus.notes.includes('HOTEL PACKAGE:'));

              const totalSeats = t.stats?.totalSeats || t.bus?.capacity || activeCapacity || 45;
              const bookedCount = t.stats?.bookedCount || 0;
              const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
              const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
              const femaleBooked = t.stats?.femaleCount || 0;
              const maleBooked = t.stats?.maleCount || 0;
              const freeSeatsList: string[] = t.stats?.availableSeatNumbersPreview || [];
              const isPreviewExpanded = expandedSeatPreviewTripId === t.id;

              const isHighOccupancy = soldPct >= 80;
              const isMediumOccupancy = soldPct >= 40 && soldPct < 80;
              const isSelected = false;

              let minF = t.basePrice || 550;
              let maxF = t.maxPrice || minF;

              const fareDisplay = minF === maxF ? formatCurrency(minF) : `${formatCurrency(minF)} - ${formatCurrency(maxF)}`;

              return (
                <div
                  key={t.id}
                  className="p-5 rounded-3xl border-2 bg-white dark:bg-slate-900 text-left transition-all duration-300 relative group flex flex-col justify-between hover:shadow-lg hover:border-blue-400/60"
                >
                  {/* Header row */}
                  <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                          busType === 'FEMALE'
                            ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                            : busType === 'MALE'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          🚌 {busNumber || t.tripCode || t.trip_code}
                        </span>
                        <span className="relative flex items-center gap-1.5 px-2 py-0.5 rounded-lg border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black text-[10px] tracking-widest uppercase overflow-hidden shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                          </span>
                          LIVE
                        </span>
                        {t.examUnit && (
                          <span className="text-[10.5px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-lg flex items-center shadow-xs">
                            📝 {t.examUnit}
                          </span>
                        )}
                        {hotelPackage && (
                          <span className="text-[10.5px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>🏨 হোটেল প্যাকেজ</span>
                          </span>
                        )}
                      </div>
                      <Badge variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'} className="text-[10.5px] font-bold shrink-0">
                        {busType === 'FEMALE' ? '👩 ছাত্রী স্পেশাল' : busType === 'MALE' ? '👨 ছাত্র স্পেশাল' : '👥 মিক্সড বাস'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-1">{busName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-bold mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{routeName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>🏢 {operator}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{totalSeats} সিট</span>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="py-3.5 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          {isHighOccupancy ? '🔥 প্রায় পূর্ণ (Hot):' : isMediumOccupancy ? '⚡ দ্রুত বিক্রি হচ্ছে:' : '📊 টিকিট বিক্রি:'}
                        </span>
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                          isHighOccupancy
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                            : isMediumOccupancy
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {soldPct}% বিক্রি হয়েছে ({bookedCount}/{totalSeats})
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner flex">
                        <div
                          style={{ width: `${Math.max(4, soldPct)}%` }}
                          className={`h-full transition-all duration-500 rounded-full ${
                            isHighOccupancy
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                              : isMediumOccupancy
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">মোট সিট</span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block mt-0.5">{totalSeats}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">🟢 খালি আছে</span>
                        <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 block mt-0.5">{availableCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">🔴 বিক্রি</span>
                        <span className="font-mono font-black text-sm text-rose-700 dark:text-rose-300 block mt-0.5">{bookedCount}</span>
                      </div>
                    </div>

                    {bookedCount > 0 && (
                      <div className="flex items-center justify-between text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                        <span>যাত্রী অনুপাত:</span>
                        <div className="flex items-center gap-2">
                          {femaleBooked > 0 && <span className="text-pink-600 font-mono">🌸 {femaleBooked} ছাত্রী</span>}
                          {maleBooked > 0 && <span className="text-blue-600 font-mono">👨 {maleBooked} ছাত্র</span>}
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-blue-950 dark:text-blue-200 flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-blue-600" />
                          <span>খালি সিট প্রিভিউ ({availableCount}টি):</span>
                        </span>
                        {freeSeatsList.length > 8 && (
                          <button
                            type="button"
                            onClick={() => setExpandedSeatPreviewTripId(isPreviewExpanded ? null : t.id)}
                            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            {isPreviewExpanded ? 'কম দেখুন' : 'সবগুলো দেখুন'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(isPreviewExpanded ? freeSeatsList : freeSeatsList.slice(0, 8)).map((seatNum) => {
                          const isMatchedSeat = selectedSeatFilter && seatNum.toUpperCase() === selectedSeatFilter.trim().toUpperCase();
                          return (
                            <span
                              key={seatNum}
                              className={`font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded-md transition-all ${
                                isMatchedSeat
                                  ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400 scale-110'
                                  : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                              }`}
                            >
                              {isMatchedSeat ? `✓ ${seatNum}` : seatNum}
                            </span>
                          );
                        })}
                        {!isPreviewExpanded && freeSeatsList.length > 8 && (
                          <span className="text-[10px] font-bold text-slate-500 font-mono">+{freeSeatsList.length - 8}টি</span>
                        )}
                        {freeSeatsList.length === 0 && (
                          <span className="text-rose-600 font-bold text-[11px]">কোনো খালি সিট নেই (সম্পূর্ণ বুকড)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">যাত্রা শুরুর সময়</div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{formatDate(t.departureDate)} • {formatTime(t.departureTime)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">প্রতি সিট ভাড়া</div>
                        <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {fareDisplay}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => onSelectTrip(t.id)}
                      className="w-full py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                    >
                      <span>💺 সিট নির্বাচন ও বুকিং করুন</span>
                      <ChevronDown className="w-4 h-4 rotate-270" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
