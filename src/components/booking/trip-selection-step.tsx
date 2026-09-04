'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronUp,
  CheckCircle2,
  Filter,
  LayoutGrid,
  List,
  TableProperties,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Ticket,
  SlidersHorizontal,
  Tag,
  Check,
  X,
  Zap,
  Users,
  Compass,
  Lock,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

export interface FareRangeSegment {
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

type ViewMode = 'card' | 'list' | 'table';

export interface FormattedUniInfo {
  code: string;
  nameBn: string;
  shortTag: string;
  badgeGradient: string;
  badgeBorder: string;
  badgeText: string;
  unitText: string;
  unitTagColor: string;
  examDate: string;
}

export function matchTripUniversityCode(t: any): string {
  const targetUni = (t.targetUniversity || '').trim();
  const dest = (t.route?.destination || t.route?.routeName || '').trim();
  const busName = (t.bus?.busName || t.bus?.bus_name || '').trim();
  const combined = `${targetUni} ${dest} ${busName}`.trim().toUpperCase();
  if (!combined) return 'OTHER';

  if (/\bRU\b|\(RU\)|RAJSHAHI|রাজশাহী|রাবি/i.test(combined)) return 'RU';
  if (/\bDU\b|\(DU\)|DHAKA UNIVERSITY|ঢাকা বিশ্ববিদ্যালয়|ঢাবি/i.test(combined)) return 'DU';
  if (/\bCU\b|\(CU\)|CHITTAGONG|CHATTOGRAM|চট্টগ্রাম বিশ্ববিদ্যালয়|চবি/i.test(combined)) return 'CU';
  if (/\bJU\b|\(JU\)|JAHANGIRNAGAR|জাহাঙ্গীরনগর|জাবি/i.test(combined)) return 'JU';
  if (/\bGST\b|\(GST\)|গুচ্ছ|CLUSTER/i.test(combined)) return 'GST';
  if (/\bBUET\b|\(BUET\)|বুয়েট/i.test(combined)) return 'BUET';
  if (/\bCKRUET\b|ইঞ্জিনিয়ারিং গুচ্ছ/i.test(combined)) return 'ENGG';
  if (/\bKUET\b|\(KUET\)|খুলনা প্রকৌশল|কুয়েট/i.test(combined)) return 'KUET';
  if (/\bRUET\b|\(RUET\)|রাজশাহী প্রকৌশল|রুয়েট/i.test(combined)) return 'RUET';
  if (/\bCUET\b|\(CUET\)|চট্টগ্রাম প্রকৌশল|চুয়েট/i.test(combined)) return 'CUET';
  if (/\bSUST\b|\(SUST\)|শাহজালাল|সাস্ট/i.test(combined)) return 'SUST';
  if (/\bAGRI\b|\(AGRI\)|কৃষি গুচ্ছ/i.test(combined)) return 'AGRI';
  if (/\bBAU\b|\(BAU\)|বাংলাদেশ কৃষি বিশ্ববিদ্যালয়/i.test(combined)) return 'BAU';
  if (/\bMED\b|\(MED\)|মেডিকেল|ডেন্টাল|DENTAL/i.test(combined)) return 'MED';
  if (/\bJNU\b|\(JNU\)|জগন্নাথ বিশ্ববিদ্যালয়|জবি/i.test(combined)) return 'JNU';
  if (/\bBUP\b|\(BUP\)|বিইউপি/i.test(combined)) return 'BUP';
  if (/\bIU\b|\(IU\)|ইসলামী বিশ্ববিদ্যালয়|ইবি/i.test(combined)) return 'IU';
  if (/\bCOU\b|\(COU\)|কুমিল্লা বিশ্ববিদ্যালয়|কুবি/i.test(combined)) return 'COU';
  if (/\bBRUR\b|\(BRUR\)|বেগম রোকেয়া|বেরোবি/i.test(combined)) return 'BRUR';
  if (/\bPSTU\b|\(PSTU\)|পটুয়াখালী বিজ্ঞান/i.test(combined)) return 'PSTU';
  if (/\bHSTU\b|\(HSTU\)|হাজী দানেশ/i.test(combined)) return 'HSTU';
  if (/\bMBSTU\b|\(MBSTU\)|মাওলানা ভাসানী/i.test(combined)) return 'MBSTU';
  if (/\bNSTU\b|\(NSTU\)|নোয়াখালী বিজ্ঞান/i.test(combined)) return 'NSTU';
  if (/\bJUST\b|\(JUST\)|যশোর বিজ্ঞান/i.test(combined)) return 'JUST';
  if (/\bBSMRSTU\b|\(BSMRSTU\)|বশেমুরবিপ্রবি|গোপালগঞ্জ/i.test(combined)) return 'BSMRSTU';
  return targetUni || dest || 'OTHER';
}

export function getTripUniversityAndUnit(t: any): FormattedUniInfo {
  const code = matchTripUniversityCode(t);
  
  // Format exam unit clearly
  let unitText = (t.examUnit || t.bus?.examUnit || '').trim();
  if (!unitText || unitText.toLowerCase() === 'general / all units' || unitText.toLowerCase() === 'custom') {
    unitText = 'সকল ইউনিট (All Units)';
  } else if (!unitText.toLowerCase().includes('unit') && !unitText.toLowerCase().includes('ইউনিট')) {
    unitText = `ইউনিট: ${unitText}`;
  }

  // Calculate or retrieve exam date
  let examDate = (t.examDate || t.exam_date || t.bus?.examDate || t.bus?.exam_date || '').toString().trim();
  if (!examDate) {
    switch (code) {
      case 'RU':
        examDate = '2026-10-05';
        break;
      case 'DU':
        examDate = '2026-09-10';
        break;
      case 'CU':
        examDate = '2026-10-12';
        break;
      case 'JU':
        examDate = '2026-10-20';
        break;
      case 'GST':
        examDate = '2026-10-25';
        break;
      case 'BUET':
        examDate = '2026-11-01';
        break;
      case 'ENGG':
      case 'CKRUET':
        examDate = '2026-11-08';
        break;
      case 'AGRI':
        examDate = '2026-11-15';
        break;
      case 'MED':
        examDate = '2026-10-02';
        break;
      default:
        if (t.departureDate) {
          try {
            const dep = new Date(t.departureDate);
            dep.setDate(dep.getDate() + 1);
            examDate = dep.toISOString().split('T')[0];
          } catch (e) {
            examDate = '2026-10-15';
          }
        } else {
          examDate = '2026-10-15';
        }
    }
  }

  let info: any;
  switch (code) {
    case 'RU':
      info = {
        code: 'RU',
        nameBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
        shortTag: 'রাবি • RU',
        badgeGradient: 'from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-950',
        badgeBorder: 'border-blue-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-amber-300 text-slate-900 border border-amber-400'
      };
      break;
    case 'DU':
      info = {
        code: 'DU',
        nameBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        shortTag: 'ঢাবি • DU',
        badgeGradient: 'from-rose-600 via-rose-700 to-red-800 dark:from-rose-700 dark:via-rose-800 dark:to-red-950',
        badgeBorder: 'border-rose-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-yellow-300 text-slate-900 border border-yellow-400'
      };
      break;
    case 'CU':
      info = {
        code: 'CU',
        nameBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
        shortTag: 'চবি • CU',
        badgeGradient: 'from-teal-600 via-emerald-700 to-teal-800 dark:from-teal-700 dark:via-emerald-800 dark:to-teal-950',
        badgeBorder: 'border-teal-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-emerald-200 text-slate-900 border border-emerald-300'
      };
      break;
    case 'JU':
      info = {
        code: 'JU',
        nameBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
        shortTag: 'জাবি • JU',
        badgeGradient: 'from-amber-600 via-orange-600 to-amber-700 dark:from-amber-700 dark:via-orange-700 dark:to-amber-900',
        badgeBorder: 'border-amber-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-white text-slate-900 border border-amber-300'
      };
      break;
    case 'GST':
      info = {
        code: 'GST',
        nameBn: 'জিএসটি সাধারণ ও প্রযুক্তি গুচ্ছ (GST)',
        shortTag: 'গুচ্ছ • GST',
        badgeGradient: 'from-purple-600 via-violet-700 to-purple-800 dark:from-purple-700 dark:via-violet-800 dark:to-purple-950',
        badgeBorder: 'border-purple-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-pink-300 text-slate-900 border border-pink-400'
      };
      break;
    case 'BUET':
      info = {
        code: 'BUET',
        nameBn: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)',
        shortTag: 'বুয়েট • BUET',
        badgeGradient: 'from-red-600 via-rose-700 to-red-800 dark:from-red-700 dark:via-rose-800 dark:to-red-950',
        badgeBorder: 'border-red-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-white text-red-900 border border-red-300'
      };
      break;
    case 'ENGG':
    case 'CKRUET':
      info = {
        code: 'ENGG',
        nameBn: 'ইঞ্জিনিয়ারিং গুচ্ছ (CKRUET)',
        shortTag: 'ইঞ্জিনিয়ারিং • CKRUET',
        badgeGradient: 'from-cyan-600 via-blue-700 to-indigo-800 dark:from-cyan-700 dark:via-blue-800 dark:to-indigo-950',
        badgeBorder: 'border-cyan-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-yellow-300 text-slate-900 border border-yellow-400'
      };
      break;
    case 'KUET':
      info = {
        code: 'KUET',
        nameBn: 'খুলনা প্রকৌশল বিশ্ববিদ্যালয় (KUET)',
        shortTag: 'কুয়েট • KUET',
        badgeGradient: 'from-blue-700 to-slate-800',
        badgeBorder: 'border-blue-500/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-amber-300 text-slate-900'
      };
      break;
    case 'SUST':
      info = {
        code: 'SUST',
        nameBn: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (SUST)',
        shortTag: 'সাস্ট • SUST',
        badgeGradient: 'from-emerald-700 to-teal-900',
        badgeBorder: 'border-emerald-500/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-white text-emerald-950'
      };
      break;
    case 'AGRI':
      info = {
        code: 'AGRI',
        nameBn: 'কৃষি বিশ্ববিদ্যালয় গুচ্ছ (Agricultural)',
        shortTag: 'কৃষি গুচ্ছ • AGRI',
        badgeGradient: 'from-lime-600 to-emerald-800',
        badgeBorder: 'border-lime-500/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-yellow-300 text-slate-900'
      };
      break;
    case 'MED':
      info = {
        code: 'MED',
        nameBn: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (Medical)',
        shortTag: 'মেডিকেল • MED',
        badgeGradient: 'from-rose-600 to-pink-700',
        badgeBorder: 'border-rose-500/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-white text-rose-900'
      };
      break;
    default: {
      const fallbackName = t.targetUniversity || t.route?.destination || 'বিশ্ববিদ্যালয় ভর্তি এক্সপ্রেস';
      info = {
        code: 'OTHER',
        nameBn: fallbackName,
        shortTag: 'ভর্তি এক্সপ্রেস',
        badgeGradient: 'from-indigo-600 via-blue-700 to-indigo-800 dark:from-indigo-700 dark:via-blue-800 dark:to-indigo-950',
        badgeBorder: 'border-indigo-400/40',
        badgeText: 'text-white',
        unitText,
        unitTagColor: 'bg-amber-300 text-slate-900'
      };
      break;
    }
  }
  return { ...info, examDate };
}

export function isTripBookingFull(t: any): boolean {
  const totalSeats = t.stats?.totalSeats || t.bus?.capacity || 45;
  const bookedCount = t.stats?.bookedCount || 0;
  const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
  const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
  const status = (t.status || '').toUpperCase();
  return status === 'COMPLETED' || status === 'CANCELLED' || availableCount <= 0 || soldPct >= 100;
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

  // View mode state (card, list, table)
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('atoms_booking_view_mode') as ViewMode;
      if (saved === 'card' || saved === 'list' || saved === 'table') {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('atoms_booking_view_mode', mode);
    } catch {}
  };

  // Filter minimize / expand state
  const [isFilterMinimized, setIsFilterMinimized] = useState<boolean>(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('atoms_booking_filter_minimized');
      if (saved !== null) {
        setIsFilterMinimized(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleFilterMinimized = () => {
    setIsFilterMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('atoms_booking_filter_minimized', String(next));
      } catch {}
      return next;
    });
  };

  // Filter values
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

  // Booking status tab: 'ACTIVE' (open seats) vs 'FULL' (sold out / completed)
  const [tripBookingStatusTab, setTripBookingStatusTab] = useState<'ACTIVE' | 'FULL'>('ACTIVE');

  // Count active vs full trips in entire fleet
  const activeTripsCount = useMemo(() => trips.filter((t) => !isTripBookingFull(t)).length, [trips]);
  const fullTripsCount = useMemo(() => trips.filter((t) => isTripBookingFull(t)).length, [trips]);

  // Base trips for current tab
  const currentTabBaseTrips = useMemo(() => {
    return trips.filter((t) => {
      const isFull = isTripBookingFull(t);
      return tripBookingStatusTab === 'FULL' ? isFull : !isFull;
    });
  }, [trips, tripBookingStatusTab]);

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
      activeCoaches: trips.filter((t) => !isTripBookingFull(t)).length,
      fullCoaches: trips.filter((t) => isTripBookingFull(t)).length,
      totalSeats,
      totalBooked,
      totalAvailable: Math.max(0, totalSeats - totalBooked),
      soldPct: totalSeats > 0 ? Math.round((totalBooked / totalSeats) * 100) : 0
    };
  }, [trips]);

  // University options derived from currentTabBaseTrips (falling back to trips if none)
  const universityOptions = useMemo(() => {
    const uniMap: Record<string, { code: string; label: string; count: number; minFare: number; maxFare: number; freeSeats: number }> = {};
    const sourceTrips = currentTabBaseTrips.length > 0 ? currentTabBaseTrips : trips;
    sourceTrips.forEach((t) => {
      const uniInfo = getTripUniversityAndUnit(t);
      const code = uniInfo.code;
      if (!uniMap[code]) {
        uniMap[code] = { code, label: uniInfo.nameBn, count: 0, minFare: 0, maxFare: 0, freeSeats: 0 };
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
  }, [currentTabBaseTrips, trips]);

  const operatorOptions = useMemo(() => {
    const opMap: Record<string, number> = {};
    const sourceTrips = currentTabBaseTrips.length > 0 ? currentTabBaseTrips : trips;
    sourceTrips.forEach((t) => {
      const op = (t.bus?.operator || '').trim();
      if (op) opMap[op] = (opMap[op] || 0) + 1;
    });
    return Object.entries(opMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [currentTabBaseTrips, trips]);

  const unitOptions = useMemo(() => {
    const uMap: Record<string, number> = {};
    const sourceTrips = currentTabBaseTrips.length > 0 ? currentTabBaseTrips : trips;
    sourceTrips.forEach((t) => {
      const u = (t.examUnit || t.bus?.examUnit || '').trim();
      if (u) uMap[u] = (uMap[u] || 0) + 1;
    });
    return Object.entries(uMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [currentTabBaseTrips, trips]);

  const dateOptions = useMemo(() => {
    const dateMap: Record<string, number> = {};
    const sourceTrips = currentTabBaseTrips.length > 0 ? currentTabBaseTrips : trips;
    sourceTrips.forEach((t) => {
      const d = (t.departureDate || '').toString().split('T')[0];
      if (d) dateMap[d] = (dateMap[d] || 0) + 1;
    });
    return Object.entries(dateMap);
  }, [currentTabBaseTrips, trips]);

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

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (busSearchQuery.trim()) count++;
    if (selectedUniFilter !== 'ALL') count++;
    if (selectedGenderFilter !== 'ALL') count++;
    if (selectedCompanyFilter !== 'ALL') count++;
    if (selectedOccupancyFilter !== 'ALL') count++;
    if (selectedDateFilter !== 'ALL') count++;
    if (selectedHotelFilter !== 'ALL') count++;
    if (selectedFareFilter !== 'ALL') count++;
    if (selectedSeatFilter.trim()) count++;
    if (selectedUnitFilter !== 'ALL') count++;
    return count;
  }, [busSearchQuery, selectedUniFilter, selectedGenderFilter, selectedCompanyFilter, selectedOccupancyFilter, selectedDateFilter, selectedHotelFilter, selectedFareFilter, selectedSeatFilter, selectedUnitFilter]);

  const hasActiveFilters = activeFilterCount > 0;

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

  // Filtered trips
  const filteredTrips = useMemo(() => {
    const filtered = currentTabBaseTrips.filter((t) => {
      const uniInfo = getTripUniversityAndUnit(t);
      if (selectedUniFilter !== 'ALL' && uniInfo.code !== selectedUniFilter) return false;

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
        const u = (t.examUnit || t.bus?.examUnit || '').trim();
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
          t.route?.routeName, t.route?.route_name, t.route?.origin, t.route?.destination,
          t.bus?.operator, t.targetUniversity, uniInfo.nameBn, uniInfo.unitText, t.examUnit, t.tripCode, t.trip_code
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
  }, [currentTabBaseTrips, selectedUniFilter, selectedFareFilter, customFareInput, selectedSeatFilter, selectedGenderFilter, selectedOccupancyFilter, selectedDateFilter, selectedHotelFilter, selectedCompanyFilter, busSearchQuery, selectedSortOrder, selectedUnitFilter]);

  const selectStyle = (isActive: boolean, activeColor = 'bg-blue-600 text-white shadow-md shadow-blue-500/20') =>
    `px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
      isActive ? activeColor : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <Card suppressHydrationWarning className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Header */}
      <div suppressHydrationWarning className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/60 via-slate-50 to-transparent dark:from-slate-800/60 dark:via-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                className="rounded-2xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 mr-1 shrink-0"
                title={language === 'bn' ? 'বুকিং তালিকায় ফিরে যান' : 'Back to Bookings'}
              >
                <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>{language === 'bn' ? 'পেছনে যান' : 'Back'}</span>
              </Button>
            )}
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'বিশ্ববিদ্যালয় ভিত্তিক বাস ও টিকিট বুকিং' : 'University Admission Bus Roster'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'bn'
                  ? 'টার্গেট বিশ্ববিদ্যালয় ও ভর্তি ইউনিট ভিত্তিক ডেডিকেটেড বাস বেছে নিয়ে টিকিট ইস্যু করুন।'
                  : 'Select coach by target admission university & exam unit to immediately book seats.'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right: Total Buses & View Mode Switcher */}
        <div className="flex items-center gap-3">
          <Badge variant="primary" className="font-mono text-xs font-bold px-3 py-1.5 shadow-2xs">
            {trips.length} {language === 'bn' ? 'টি সক্রিয় বাস' : 'Active Buses'}
          </Badge>

          {/* View Mode Switcher (Card / List / Table) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSetViewMode('card')}
              title={language === 'bn' ? 'কার্ড ভিউ' : 'Card View'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'কার্ড' : 'Card'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              title={language === 'bn' ? 'কমপ্যাক্ট লিস্ট ভিউ' : 'List View'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লিস্ট' : 'List'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              title={language === 'bn' ? 'ডাটা টেবিল ভিউ' : 'Table View'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Fleet Overview 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { label: language === 'bn' ? 'সক্রিয় কোচ (বুকিং ওপেন)' : 'Active Coaches', value: `${fleetStats.activeCoaches}টি`, icon: '🚌', color: 'text-blue-600 dark:text-blue-400' },
            { label: language === 'bn' ? 'বুকিং সম্পন্ন / ফুল' : 'Full Coaches', value: `${fleetStats.fullCoaches}টি`, icon: '🔒', color: 'text-rose-600 dark:text-rose-400' },
            { label: language === 'bn' ? 'মোট খালি সিট' : 'Total Free Seats', value: String(fleetStats.totalAvailable), icon: '🟢', color: 'text-emerald-600 dark:text-emerald-400' },
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

        {/* ── TOP-LEVEL BUS STATUS TABS: ACTIVE vs FULL / COMPLETED ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 flex-1">
            {/* Tab 1: Active / Available */}
            <button
              type="button"
              onClick={() => {
                setTripBookingStatusTab('ACTIVE');
                if (selectedOccupancyFilter === 'FULL') setSelectedOccupancyFilter('ALL');
              }}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                tripBookingStatusTab === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>{language === 'bn' ? 'সক্রিয় বাস (বুকিং চলছে)' : 'Active Buses (Open)'}</span>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-black ${
                tripBookingStatusTab === 'ACTIVE'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {activeTripsCount}
              </span>
            </button>

            {/* Tab 2: Full / Completed */}
            <button
              type="button"
              onClick={() => {
                setTripBookingStatusTab('FULL');
                if (selectedOccupancyFilter === 'AVAILABLE') setSelectedOccupancyFilter('ALL');
              }}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                tripBookingStatusTab === 'FULL'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px]">
                <Lock className="w-2.5 h-2.5" />
              </span>
              <span>{language === 'bn' ? 'বুকিং সম্পন্ন / ফুল বাস' : 'Full / Completed Buses'}</span>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-black ${
                tripBookingStatusTab === 'FULL'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {fullTripsCount}
              </span>
            </button>
          </div>

          {/* Context pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-500">
            {tripBookingStatusTab === 'ACTIVE' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>খালি আসন বিশিষ্ট বাসের তালিকা প্রদর্শিত হচ্ছে</span>
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>সম্পূর্ণ বুকড বা সম্পন্ন হওয়া বাসের তালিকা প্রদর্শিত হচ্ছে</span>
              </span>
            )}
          </div>
        </div>

        {/* --- PREMIUM FILTER SECTION WITH MINIMIZE / EXPAND TOGGLE --- */}
        <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 transition-all">
          
          {/* Filter Header Bar: Title + Minimize/Expand Button + Reset */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>{language === 'bn' ? 'ফিল্টার ও দ্রুত অনুসন্ধান' : 'Filter & Quick Search'}</span>
                {hasActiveFilters && (
                  <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {activeFilterCount} {language === 'bn' ? 'টি চালু' : 'active'}
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title={language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
                </button>
              )}

              {/* Minimize / Expand Toggle Button */}
              <button
                type="button"
                onClick={toggleFilterMinimized}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                {isFilterMinimized ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'bn' ? 'ফিল্টার খুলুন' : 'Expand Filters'}</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'bn' ? 'ফিল্টার সংকুচিত করুন' : 'Minimize Filters'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Always Visible: Search Input + Sort Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busSearchQuery}
                onChange={(e) => setBusSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'বিশ্ববিদ্যালয়, ইউনিট, বাস নম্বর, রুট বা অপারেটর দিয়ে খুঁজুন...' : 'Search university, unit, bus code, route, operator...'}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs transition-all"
              />
              {busSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBusSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 md:flex-none flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/80 min-w-[170px] shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <select
                  value={selectedSortOrder}
                  onChange={(e) => setSelectedSortOrder(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="DEFAULT">{language === 'bn' ? 'সাজান: ডিফল্ট' : 'Sort: Default'}</option>
                  <option value="SEATS_FREE_DESC">🟢 বেশি সিট খালি</option>
                  <option value="SOLD_DESC">🔥 দ্রুত বিক্রি হচ্ছে</option>
                  <option value="TIME_ASC">🕒 ছাড়ার সময় (আগে)</option>
                  <option value="FARE_ASC">💰 কম ভাড়া (আগে)</option>
                  <option value="FARE_DESC">💰 বেশি ভাড়া (আগে)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Minimized Active Pills */}
          {isFilterMinimized && hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500">সক্রিয় ফিল্টার:</span>
              {selectedUniFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg">
                  🏛️ {selectedUniFilter}
                  <button onClick={() => setSelectedUniFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedUnitFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg">
                  📝 {selectedUnitFilter}
                  <button onClick={() => setSelectedUnitFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedCompanyFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                  🏢 {selectedCompanyFilter}
                  <button onClick={() => setSelectedCompanyFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedGenderFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-lg">
                  👥 {selectedGenderFilter === 'FEMALE' ? 'ছাত্রী' : selectedGenderFilter === 'MALE' ? 'ছাত্র' : 'মিক্সড'}
                  <button onClick={() => setSelectedGenderFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedOccupancyFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg">
                  📊 {selectedOccupancyFilter}
                  <button onClick={() => setSelectedOccupancyFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedDateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg">
                  📅 {selectedDateFilter}
                  <button onClick={() => setSelectedDateFilter('ALL')} className="hover:text-rose-500">✕</button>
                </span>
              )}
              {selectedSeatFilter && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg">
                  💺 সিট: {selectedSeatFilter}
                  <button onClick={() => setSelectedSeatFilter('')} className="hover:text-rose-500">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Expanded Filter Panel */}
          {!isFilterMinimized && (
            <div className="space-y-4 pt-1 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in duration-200">
              {/* Dropdowns row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* University */}
                <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয়' : 'Target University'}
                    </label>
                  </div>
                  <select
                    value={selectedUniFilter}
                    onChange={(e) => setSelectedUniFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                  >
                    <option value="ALL">🏛️ {language === 'bn' ? `সকল বিশ্ববিদ্যালয় (${trips.length}টি বাস)` : `All Universities (${trips.length})`}</option>
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

                {/* Exam Unit */}
                <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট' : 'Exam Unit'}
                    </label>
                  </div>
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                  >
                    <option value="ALL">📝 {language === 'bn' ? `সকল ইউনিট` : `All Units`}</option>
                    {unitOptions.map((u) => (
                      <option key={u.name} value={u.name}>{u.name} ({u.count}টি বাস)</option>
                    ))}
                  </select>
                </div>

                {/* Company / Operator */}
                <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'বাস কোম্পানি (অপারেটর)' : 'Bus Operator'}
                    </label>
                  </div>
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

                {/* Fare Budget */}
                <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'ভাড়া / বাজেট' : 'Budget'}
                    </label>
                  </div>
                  <select
                    value={selectedFareFilter}
                    onChange={(e) => {
                      setSelectedFareFilter(e.target.value);
                      if (e.target.value !== 'CUSTOM') setCustomFareInput('');
                    }}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate appearance-none"
                  >
                    <option value="ALL">💰 {language === 'bn' ? 'সকল ভাড়া' : 'All Fares'}</option>
                    {[700, 650, 600, 550, 500, 450].map((fare) => (
                      <option key={`MAX_${fare}`} value={`MAX_${fare}`}>সর্বোচ্চ ৳{fare} পর্যন্ত (≤ ৳{fare})</option>
                    ))}
                    <option value="CUSTOM">{language === 'bn' ? 'কাস্টম বাজেট লিখুন...' : 'Custom Budget...'}</option>
                  </select>
                </div>
              </div>

              {selectedFareFilter === 'CUSTOM' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center gap-3">
                  <span className="font-bold text-amber-800 dark:text-amber-200 text-xs">💰 সর্বোচ্চ বাজেট (টাকা):</span>
                  <input
                    type="number"
                    value={customFareInput}
                    onChange={(e) => setCustomFareInput(e.target.value)}
                    placeholder="e.g. 600"
                    className="px-3 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-300 font-mono font-bold w-24 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    (৳{customFareInput || '০'} বা তার চেয়ে কম ভাড়ার বাস দেখাবে)
                  </span>
                </div>
              )}

              {/* Date & Specific Seat Finder Row */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between pt-1">
                {/* Date filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {language === 'bn' ? 'যাত্রার তারিখ' : 'Departure Date'}
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => setSelectedDateFilter('ALL')} className={selectStyle(selectedDateFilter === 'ALL')}>
                      {language === 'bn' ? 'সকল তারিখ' : 'All'}
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
                      className="px-2.5 py-1 text-[11px] h-[30px] font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Specific Seat filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between pl-1">
                    <span className="flex items-center gap-1.5">
                      <Armchair className="w-3.5 h-3.5 text-indigo-500" />
                      {language === 'bn' ? 'নির্দিষ্ট সিট নম্বর দিয়ে খুঁজুন' : 'Find Specific Seats'}
                    </span>
                    {selectedSeatFilter && (
                      <button onClick={() => setSelectedSeatFilter('')} className="text-rose-500 hover:text-rose-600 cursor-pointer uppercase text-[9px] font-bold">
                        {language === 'bn' ? 'মুছুন ✕' : 'Clear ✕'}
                      </button>
                    )}
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      value={selectedSeatFilter}
                      onChange={(e) => setSelectedSeatFilter(e.target.value.toUpperCase())}
                      placeholder="Ex: A1, B3"
                      className="w-24 px-3 py-1 text-[11px] h-[30px] font-bold font-mono rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
                    />
                    {(allFleetAvailableSeats.length > 0 ? allFleetAvailableSeats.slice(0, 8) : ['A1', 'A2', 'A3', 'B1', 'B2', 'C1']).map((seatCode) => (
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

              {/* Status, Gender, Hotel Pills Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  {language === 'bn' ? 'কুইক ফিল্টার:' : 'Quick Filters:'}
                </span>
                
                {/* Status */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
                  {[
                    { id: 'ALL', label: 'সকল বাস' },
                    { id: 'AVAILABLE', label: '🟢 খালি সিট' },
                    { id: 'DOUBLE_SEAT', label: '👩‍❤️‍👨 ডাবল সিট' },
                    { id: 'SELLING_FAST', label: '🔥 দ্রুত বিক্রি' },
                    { id: 'NEARLY_FULL', label: '🔴 প্রায় পূর্ণ' },
                    { id: 'EMPTY', label: '✨ সম্পূর্ণ ফাঁকা' }
                  ].map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setSelectedOccupancyFilter(occ.id)}
                      className={selectStyle(selectedOccupancyFilter === occ.id, 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-xs')}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>

                {/* Gender */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
                  {[
                    { id: 'ALL', label: 'সকল ধরন' },
                    { id: 'FEMALE', label: '👩 ছাত্রী স্পেশাল' },
                    { id: 'MALE', label: '👨 ছাত্র স্পেশাল' },
                    { id: 'MIXED', label: '👥 মিক্সড' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGenderFilter(g.id)}
                      className={selectStyle(
                        selectedGenderFilter === g.id,
                        g.id === 'FEMALE' ? 'bg-pink-600 text-white shadow-xs' : g.id === 'MALE' ? 'bg-blue-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Hotel */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
                  {[
                    { id: 'ALL', label: 'সকল' },
                    { id: 'HOTEL_ONLY', label: '🏨 হোটেল প্যাকেজ' }
                  ].map((hp) => (
                    <button
                      key={hp.id}
                      type="button"
                      onClick={() => setSelectedHotelFilter(hp.id)}
                      className={selectStyle(selectedHotelFilter === hp.id, 'bg-purple-600 text-white shadow-xs')}
                    >
                      {hp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- RESULTS SECTION --- */}
        {filteredTrips.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              tripBookingStatusTab === 'FULL' && fullTripsCount === 0
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            }`}>
              {tripBookingStatusTab === 'FULL' && fullTripsCount === 0 ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
                {tripBookingStatusTab === 'FULL' && fullTripsCount === 0
                  ? (language === 'bn' ? '🎉 বর্তমানে কোনো বুকিং সম্পন্ন বা ফুল বাস নেই!' : 'No full or completed coaches!')
                  : selectedSeatFilter
                  ? `⚠️ সিট "${selectedSeatFilter}" কোনো বাসে খালি পাওয়া যায়নি!`
                  : language === 'bn'
                  ? (tripBookingStatusTab === 'FULL' ? 'কোনো ফুল বাস ফিল্টারের সাথে মেলেনি' : 'কোনো সক্রিয় বাস খুঁজে পাওয়া যায়নি')
                  : 'No buses match your criteria'}
              </h4>
              <p className="text-xs text-slate-500">
                {tripBookingStatusTab === 'FULL' && fullTripsCount === 0
                  ? (language === 'bn' ? 'সকল সক্রিয় বাসে আসন খালি রয়েছে এবং টিকিট বুকিং চলছে।' : 'All active coaches have seats available.')
                  : (language === 'bn' ? 'দয়া করে ফিল্টার পরিবর্তন বা রিসেট করুন।' : 'Please adjust your filter settings.')}
              </p>
            </div>
            {tripBookingStatusTab === 'FULL' && fullTripsCount === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTripBookingStatusTab('ACTIVE')}
                className="mx-auto rounded-xl font-bold"
              >
                <Bus className="w-3.5 h-3.5 mr-1" />
                {language === 'bn' ? 'সক্রিয় বাসসমূহ দেখুন (ACTIVE)' : 'View Active Buses'}
              </Button>
            ) : (
              <>
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
                <Button variant="outline" size="sm" onClick={resetFilters} className="mx-auto rounded-xl font-bold">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
                </Button>
              </>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* ============================================================ */
          /* 1. CARD VIEW (GRID) — REORGANIZED WITH CLEAR UNIVERSITY & UNIT */
          /* ============================================================ */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTrips.map((t) => {
              const uniInfo = getTripUniversityAndUnit(t);
              const busType = t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED';
              const busName = t.bus?.busName || t.bus?.bus_name || 'Admission Express';
              const busNumber = t.bus?.busNumber || t.bus?.bus_number || t.tripCode || t.trip_code || '';
              const operator = t.bus?.operator || 'Central Transport Office';
              const origin = t.route?.origin || 'ঢাকা (গাবতলী/সায়েদাবাদ)';
              const destination = t.route?.destination || t.targetUniversity || 'বিশ্ববিদ্যালয় ক্যাম্পাস';
              const hotelPackage = t.hotelPackage || (t.bus?.notes && t.bus.notes.includes('HOTEL PACKAGE:'));

              const totalSeats = t.stats?.totalSeats || t.bus?.capacity || activeCapacity || 45;
              const bookedCount = t.stats?.bookedCount || 0;
              const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
              const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
              const femaleBooked = t.stats?.femaleCount || 0;
              const maleBooked = t.stats?.maleCount || 0;
              const freeSeatsList: string[] = t.stats?.availableSeatNumbersPreview || [];
              const isPreviewExpanded = expandedSeatPreviewTripId === t.id;

              const isFull = isTripBookingFull(t);
              const isHighOccupancy = soldPct >= 80;
              const isMediumOccupancy = soldPct >= 40 && soldPct < 80;

              let minF = t.basePrice || 550;
              let maxF = t.maxPrice || minF;
              const fareDisplay = minF === maxF ? formatCurrency(minF) : `${formatCurrency(minF)} - ${formatCurrency(maxF)}`;

              return (
                <div
                  key={t.id}
                  className="rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all duration-300 relative group flex flex-col justify-between hover:shadow-2xl hover:border-blue-500/80 hover:-translate-y-1 overflow-hidden"
                >
                  {/* ── 1. TOP HERO BANNER: TARGET UNIVERSITY & UNIT (সবচেয়ে দৃশ্যমান) ── */}
                  <div className={`p-4 bg-gradient-to-r ${uniInfo.badgeGradient} text-white shadow-md relative overflow-hidden`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                          <GraduationCap className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-black tracking-tight leading-snug drop-shadow-xs">
                            {uniInfo.nameBn}
                          </h4>
                          
                          {/* 🎯 BOLD & PROMINENT UNIT BADGE */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-amber-300 text-slate-950 border-2 border-amber-400 shadow-sm tracking-wide">
                              🎯 {uniInfo.unitText}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 text-white border border-rose-400/60 text-xs font-black uppercase shadow-xs">
                            <Lock className="w-3 h-3 text-white" />
                            বুকিং সম্পন্ন
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-black uppercase shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                            LIVE সিট
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                    {/* ── 2. BUS CODE, NAME & OPERATOR ── */}
                    <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm sm:text-base font-black px-3 py-1 rounded-xl bg-amber-400 text-slate-950 dark:bg-amber-400 dark:text-slate-950 border border-amber-300 shadow-sm">
                            🚌 {busNumber}
                          </span>
                          <Badge
                            variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'}
                            className="text-xs font-black tracking-wide uppercase px-2.5 py-1 rounded-xl shadow-2xs"
                          >
                            {busType === 'FEMALE' ? '👩 ছাত্রী স্পেশাল' : busType === 'MALE' ? '👨 ছাত্র স্পেশাল' : '👥 মিক্সড বাস'}
                          </Badge>
                        </div>

                        {hotelPackage && (
                          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>🏨 হোটেল প্যাকেজ</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {busName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          অপারেটর: <strong className="text-slate-700 dark:text-slate-300">{operator}</strong>
                        </p>
                      </div>
                    </div>

                    {/* ── 3. বাসের যাত্রা ও ভর্তি পরীক্ষার সময়সূচী ── */}
                    <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2 text-xs">
                      {/* বাসের যাত্রা (কবে যাবে ও ছাড়ার সময়) */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Bus className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block leading-tight">
                              বাস ছাড়ার তারিখ ও সময় (যাত্রা):
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono truncate block">
                              {formatDate(t.departureDate)} • {formatTime(t.departureTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* পরীক্ষার তারিখ */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block leading-tight">
                              ভর্তি পরীক্ষার তারিখ:
                            </span>
                            <span className="text-xs font-black text-amber-950 dark:text-amber-200 font-mono block">
                              🎯 {formatDate(uniInfo.examDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* সংক্ষিপ্ত গন্তব্য */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1 pt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{origin} <span className="text-blue-500">➔</span> {destination}</span>
                      </div>
                    </div>

                    {/* ── 4. OCCUPANCY & LIVE SEAT STATUS ── */}
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            {isHighOccupancy ? '🔥 প্রায় পূর্ণ:' : '📊 টিকিট বিক্রি:'}
                          </span>
                          <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                            isHighOccupancy
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                              : isMediumOccupancy
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {soldPct}% বিক্রি ({bookedCount}/{totalSeats})
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner flex" suppressHydrationWarning>
                          <div
                            suppressHydrationWarning
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

                      {/* 3 Stats Boxes */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">🟢 খালি সিট</span>
                          <span className="font-mono font-black text-base text-emerald-700 dark:text-emerald-300 block mt-0.5">{availableCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">🔴 বিক্রি</span>
                          <span className="font-mono font-black text-base text-rose-700 dark:text-rose-300 block mt-0.5">{bookedCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">মোট ধারণক্ষমতা</span>
                          <span className="font-mono font-black text-base text-slate-900 dark:text-white block mt-0.5">{totalSeats}</span>
                        </div>
                      </div>

                      {/* Gender breakdown pill */}
                      {bookedCount > 0 && (
                        <div className="flex items-center justify-between text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                          <span>যাত্রী অনুপাত:</span>
                          <div className="flex items-center gap-2 font-mono">
                            {femaleBooked > 0 && <span className="text-pink-600 dark:text-pink-400">🌸 {femaleBooked} ছাত্রী</span>}
                            {maleBooked > 0 && <span className="text-blue-600 dark:text-blue-400">👨 {maleBooked} ছাত্র</span>}
                          </div>
                        </div>
                      )}

                      {/* Seat Chips Preview */}
                      <div className="p-2.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black text-blue-950 dark:text-blue-200 flex items-center gap-1">
                            <Armchair className="w-3.5 h-3.5 text-blue-600" />
                            <span>খালি সিট নম্বর ({availableCount}টি):</span>
                          </span>
                          {freeSeatsList.length > 7 && (
                            <button
                              type="button"
                              onClick={() => setExpandedSeatPreviewTripId(isPreviewExpanded ? null : t.id)}
                              className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              {isPreviewExpanded ? 'সংক্ষিপ্ত করুন' : 'সবগুলো দেখুন'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(isPreviewExpanded ? freeSeatsList : freeSeatsList.slice(0, 7)).map((seatNum) => {
                            const isMatchedSeat = selectedSeatFilter && seatNum.toUpperCase() === selectedSeatFilter.trim().toUpperCase();
                            return (
                              <span
                                key={seatNum}
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all ${
                                  isMatchedSeat
                                    ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400 scale-110'
                                    : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                                }`}
                              >
                                {isMatchedSeat ? `✓ ${seatNum}` : seatNum}
                              </span>
                            );
                          })}
                          {!isPreviewExpanded && freeSeatsList.length > 7 && (
                            <span className="text-[10px] font-bold text-slate-500 font-mono">+{freeSeatsList.length - 7}টি</span>
                          )}
                          {freeSeatsList.length === 0 && (
                            <span className="text-rose-600 font-bold text-[11px]">কোনো খালি সিট নেই (সম্পূর্ণ বুকড)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── 5. FOOTER: FARE & BIG SEAT BOOKING BUTTON ── */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">ভাড়া / প্রতি সিট</div>
                          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {fareDisplay}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Ticket className="w-3 h-3 text-blue-500" />
                            কাউন্টার ইনস্ট্যান্ট
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isFull ? 'secondary' : 'primary'}
                        onClick={() => onSelectTrip(t.id)}
                        className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.98] ${
                          isFull
                            ? 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-600'
                            : ''
                        }`}
                      >
                        {isFull ? (
                          <>
                            <Eye className="w-4 h-4 text-amber-400" />
                            <span>সিট ও বুকিং বিবরণ দেখুন</span>
                            <ArrowRight className="w-4 h-4 text-amber-400" />
                          </>
                        ) : (
                          <>
                            <Armchair className="w-4 h-4" />
                            <span>সিট নির্বাচন ও টিকিট ইস্যু করুন</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'list' ? (
          /* ============================================================ */
          /* 2. COMPACT LIST VIEW — STRUCTURED MULTI-COLUMN BANNERS       */
          /* ============================================================ */
          <div className="space-y-3">
            {filteredTrips.map((t) => {
              const uniInfo = getTripUniversityAndUnit(t);
              const busType = t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED';
              const busName = t.bus?.busName || t.bus?.bus_name || 'Admission Express';
              const busNumber = t.bus?.busNumber || t.bus?.bus_number || t.tripCode || t.trip_code || '';
              const operator = t.bus?.operator || 'Central Transport Office';
              const origin = t.route?.origin || 'ঢাকা (গাবতলী/সায়েদাবাদ)';
              const destination = t.route?.destination || t.targetUniversity || 'বিশ্ববিদ্যালয় ক্যাম্পাস';

              const totalSeats = t.stats?.totalSeats || t.bus?.capacity || activeCapacity || 45;
              const bookedCount = t.stats?.bookedCount || 0;
              const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
              const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
              const isFull = isTripBookingFull(t);

              let minF = t.basePrice || 550;
              let maxF = t.maxPrice || minF;
              const fareDisplay = minF === maxF ? formatCurrency(minF) : `${formatCurrency(minF)} - ${formatCurrency(maxF)}`;

              return (
                <div
                  key={t.id}
                  className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                >
                  {/* Col 1: University & Exam Unit Hero Header */}
                  <div className="space-y-2 min-w-[240px] max-w-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-2xs flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                        {uniInfo.nameBn}
                      </span>
                    </div>
                    {/* BOLD LARGE PROMINENT UNIT BADGE */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-xl bg-amber-300 text-slate-950 border-2 border-amber-400 shadow-xs flex items-center gap-1.5">
                        🎯 {uniInfo.unitText}
                      </span>
                      <Badge
                        variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'}
                        className="text-[9.5px] font-black px-2 py-0.5"
                      >
                        {busType === 'FEMALE' ? '👩 ছাত্রী' : busType === 'MALE' ? '👨 ছাত্র' : '👥 মিক্সড'}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 font-mono font-bold">
                      কোচ: <strong className="text-slate-900 dark:text-white">{busNumber}</strong>
                    </div>
                  </div>

                  {/* Col 2: Coach Name & Operator */}
                  <div className="space-y-1 min-w-[180px] max-w-xs">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate">
                      {busName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      🏢 {operator}
                    </p>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                      মোট {totalSeats} সিট
                    </span>
                  </div>

                  {/* Col 3: বাসের যাত্রা ও ভর্তি পরীক্ষার সময়সূচী */}
                  <div className="space-y-1.5 min-w-[220px] max-w-sm">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-black text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40 shadow-2xs">
                      <Bus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>যাত্রা: {formatDate(t.departureDate)} • {formatTime(t.departureTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/70 dark:border-amber-900/40 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>পরীক্ষা: 🎯 {formatDate(uniInfo.examDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{origin} <span className="text-blue-500">➔</span> {destination}</span>
                    </div>
                  </div>

                  {/* Col 4: Seat Occupancy */}
                  <div className="space-y-1.5 min-w-[170px]">
                    <div className="flex items-center justify-between text-xs">
                      {isFull ? (
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>আসন পূর্ণ (ফুল)</span>
                        </span>
                      ) : (
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          🟢 {availableCount} সিট খালি
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[11px] font-bold">
                        {bookedCount}/{totalSeats}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner" suppressHydrationWarning>
                      <div
                        suppressHydrationWarning
                        style={{ width: `${Math.max(4, soldPct)}%` }}
                        className={`h-full rounded-full ${
                          soldPct >= 80 ? 'bg-rose-500' : soldPct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {isFull ? '১০০% বুকিং সম্পন্ন' : `${soldPct}% সিট বুকড`}
                    </span>
                  </div>

                  {/* Col 5: Fare & Direct Action Button */}
                  <div className="flex items-center justify-between xl:flex-col xl:items-end gap-2 shrink-0 min-w-[140px]">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">ভাড়া / সিট</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {fareDisplay}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={isFull ? 'secondary' : 'primary'}
                      onClick={() => onSelectTrip(t.id)}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 ${
                        isFull ? 'bg-slate-800 hover:bg-slate-700 text-white' : ''
                      }`}
                    >
                      {isFull ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>বিবরণ দেখুন</span>
                        </>
                      ) : (
                        <>
                          <Armchair className="w-3.5 h-3.5" />
                          <span>সিট বুকিং</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================ */
          /* 3. DENSE TABLE VIEW — FULL HIGH-DENSITY ENTERPRISE TABLE      */
          /* ============================================================ */
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3.5 px-4">🏛️ বিশ্ববিদ্যালয় ও ভর্তি ইউনিট</th>
                    <th className="py-3.5 px-4">🚌 বাস কোড ও ধরন</th>
                    <th className="py-3.5 px-4">কোচ ও অপারেটর</th>
                    <th className="py-3.5 px-4">🗓️ বাসের যাত্রা (তারিখ ও সময়)</th>
                    <th className="py-3.5 px-4">🎯 ভর্তি পরীক্ষার তারিখ</th>
                    <th className="py-3.5 px-4 text-center">💺 সিট অবস্থা</th>
                    <th className="py-3.5 px-4 text-right">ভাড়া (BDT)</th>
                    <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredTrips.map((t) => {
                    const uniInfo = getTripUniversityAndUnit(t);
                    const busType = t.tripBusType || t.bus?.busType || t.bus?.bus_type || 'MIXED';
                    const busName = t.bus?.busName || t.bus?.bus_name || 'Admission Express';
                    const busNumber = t.bus?.busNumber || t.bus?.bus_number || t.tripCode || t.trip_code || '';
                    const operator = t.bus?.operator || 'Central Transport Office';
                    const origin = t.route?.origin || 'ঢাকা';
                    const destination = t.route?.destination || t.targetUniversity || 'ক্যাম্পাস';

                    const totalSeats = t.stats?.totalSeats || t.bus?.capacity || activeCapacity || 45;
                    const bookedCount = t.stats?.bookedCount || 0;
                    const availableCount = t.stats?.availableCount ?? Math.max(0, totalSeats - bookedCount);
                    const soldPct = t.stats?.soldPercentage ?? (totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0);
                    const isFull = isTripBookingFull(t);

                    let minF = t.basePrice || 550;
                    let maxF = t.maxPrice || minF;
                    const fareDisplay = minF === maxF ? `৳${minF}` : `৳${minF}-৳${maxF}`;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors">
                        {/* University & Unit */}
                        <td className="py-4 px-4 max-w-[240px]">
                          <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                            {uniInfo.nameBn}
                          </div>
                          {/* BIGGER, PROMINENT UNIT BADGE */}
                          <div className="mt-1.5">
                            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-300 text-slate-950 border border-amber-400 shadow-2xs inline-flex items-center gap-1">
                              🎯 {uniInfo.unitText}
                            </span>
                          </div>
                        </td>

                        {/* Bus Code & Gender */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-black text-slate-900 dark:text-white">
                            {busNumber}
                          </div>
                          <div className="mt-1">
                            <Badge variant={busType === 'FEMALE' ? 'danger' : busType === 'MALE' ? 'primary' : 'success'} className="text-[9px] px-1.5 py-0">
                              {busType === 'FEMALE' ? 'ছাত্রী স্পেশাল' : busType === 'MALE' ? 'ছাত্র স্পেশাল' : 'মিক্সড'}
                            </Badge>
                          </div>
                        </td>

                        {/* Coach Name & Operator */}
                        <td className="py-3.5 px-4 max-w-[170px]">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{busName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{operator}</div>
                        </td>

                        {/* বাসের যাত্রা */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          <div className="font-black text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <Bus className="w-3 h-3 text-blue-500" />
                            {formatDate(t.departureDate)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold ml-4">
                            ছাড়ার সময়: {formatTime(t.departureTime)}
                          </div>
                        </td>

                        {/* পরীক্ষার তারিখ */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                            🎯 {formatDate(uniInfo.examDate)}
                          </span>
                        </td>

                        {/* Seats */}
                        <td className="py-3.5 px-4 text-center">
                          {isFull ? (
                            <span className="inline-flex items-center gap-1 font-mono font-black text-rose-600 dark:text-rose-400 text-xs px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                              <Lock className="w-3 h-3" />
                              ফুল (০ খালি)
                            </span>
                          ) : (
                            <span className="inline-block font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {availableCount} খালি
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {bookedCount}/{totalSeats} ({soldPct}%)
                          </div>
                        </td>

                        {/* Fare */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                          {fareDisplay}
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            size="sm"
                            variant={isFull ? 'secondary' : 'primary'}
                            onClick={() => onSelectTrip(t.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-black shadow-2xs ${
                              isFull ? 'bg-slate-800 hover:bg-slate-700 text-white' : ''
                            }`}
                          >
                            {isFull ? 'বিবরণ দেখুন' : 'সিট বুকিং'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
