'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bus as BusIcon,
  Save,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  MapPin,
  Sparkles,
  PlusCircle,
  Hash,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createBusAction } from '@/actions/bus.actions';
import { useApp } from '@/lib/context';
import { DEFAULT_COMPANIES, getStoredCompanies } from '@/lib/company-storage';
import { CompanyManagerModal } from './company-manager-modal';

interface BusCreateFormProps {
  layouts: any[];
  existingBuses?: any[];
}

const DEFAULT_FLEET_PRESETS = [
  { name: 'রাবি স্পেশাল কোচ (RU Special)', uni: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', dest: 'Rajshahi University (RU)', capacity: 45 },
  { name: 'ঢাবি ভর্তি এক্সপ্রেস (DU Express)', uni: 'ঢাকা বিশ্ববিদ্যালয় (DU)', dest: 'Dhaka University (DU)', capacity: 40 },
  { name: 'চবি চাটগাঁ স্পেশাল (CU Special)', uni: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', dest: 'Chittagong University (CU)', capacity: 40 },
  { name: 'সাস্ট সিলেট এক্সপ্রেস (SUST Express)', uni: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (SUST)', dest: 'SUST Sylhet', capacity: 45 },
  { name: 'জিএসটি গুচ্ছ স্পেশাল (GST Special)', uni: 'জিএসটি গুচ্ছ (GST Cluster)', dest: 'GST Exam Centers', capacity: 40 },
  { name: 'জাবি ক্যাম্পাস স্পেশাল (JU Special)', uni: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)', dest: 'Jahangirnagar University (JU)', capacity: 40 },
  { name: 'কুয়েট খুলনা এক্সপ্রেস (KUET Express)', uni: 'খুলনা প্রকৌশল ও প্রযুক্তি (KUET)', dest: 'KUET Khulna', capacity: 40 },
  { name: 'বুয়েট ইঞ্জিনিয়ারিং কোচ (BUET Special)', uni: 'বুয়েট / ইঞ্জিনিয়ারিং গুচ্ছ', dest: 'BUET Dhaka', capacity: 40 },
  { name: 'দেশ ট্রাভেলস এক্সপ্রেস (Desh Travels)', uni: 'কেন্দ্রীয় ভর্তি সার্ভিস', dest: 'All Universities', capacity: 40 },
  { name: 'শ্যামলী স্পেশাল সার্ভিস (Shyamoli)', uni: 'কেন্দ্রীয় পরিবহন নেটওয়ার্ক', dest: 'All Centers', capacity: 40 }
];

export function BusCreateForm({ layouts, existingBuses = [] }: BusCreateFormProps) {
  const router = useRouter();
  const { t, language } = useApp();

  // Combine unique bus names from database and presets
  const availableBusNames = useMemo(() => {
    const namesSet = new Set<string>();
    existingBuses.forEach(b => {
      if (b.busName && b.busName.trim()) namesSet.add(b.busName.trim());
    });
    DEFAULT_FLEET_PRESETS.forEach(p => namesSet.add(p.name));
    return Array.from(namesSet);
  }, [existingBuses]);

  // Form States
  const [isCustomNameMode, setIsCustomNameMode] = useState(false);
  const [selectedPresetName, setSelectedPresetName] = useState(availableBusNames[0] || 'রাবি স্পেশাল কোচ (RU Special)');
  const [customBusNameInput, setCustomBusNameInput] = useState('');
  
  const activeBusName = isCustomNameMode ? customBusNameInput.trim() : selectedPresetName.trim();

  const [busNumber, setBusNumber] = useState('বাস-০১');
  const [regNumber, setRegNumber] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('Dhaka (Farmgate / Gabtoli)');
  const [routeDestination, setRouteDestination] = useState('Rajshahi University (RU)');
  const [targetUniversity, setTargetUniversity] = useState('রাজশাহী বিশ্ববিদ্যালয় (RU)');
  const [capacity, setCapacity] = useState(45);
  const [busType, setBusType] = useState<'MALE' | 'FEMALE' | 'MIXED'>('MIXED');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'>('ACTIVE');
  const [seatLayoutId, setSeatLayoutId] = useState(layouts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Company / Vendor state
  const [companyList, setCompanyList] = useState<string[]>(DEFAULT_COMPANIES);
  const [isCompanyManagerOpen, setIsCompanyManagerOpen] = useState(false);
  const [isCompanyPending, setIsCompanyPending] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(DEFAULT_COMPANIES[0]);
  const [customCompanyInput, setCustomCompanyInput] = useState('');

  // Queue Pagination State for Bus Numbers (10 per window, scalable to 50+)
  const [queuePage, setQueuePage] = useState(0);

  useEffect(() => {
    const loaded = getStoredCompanies();
    setCompanyList(loaded);
    if (loaded.length > 0 && !loaded.includes(selectedCompany)) {
      setSelectedCompany(loaded[0]);
    }
  }, []);

  // Hotel / Accommodation Package state
  const [hasHotelPackage, setHasHotelPackage] = useState(false);
  const [hotelName, setHotelName] = useState('হোটেল রয়েল রাজ (Rajshahi)');
  const [hotelRoomType, setHotelRoomType] = useState('২-বেড শেয়ারিং (Twin Sharing / Student)');
  const [hotelDuration, setHotelDuration] = useState('২ দিন ১ রাত (Exam Stay)');
  const [hotelCostPerPerson, setHotelCostPerPerson] = useState(1200);
  const [hotelBreakfast, setHotelBreakfast] = useState(true);
  const [hotelShuttle, setHotelShuttle] = useState(true);
  const [hotelWifi, setHotelWifi] = useState(true);

  const POPULAR_HOTELS = [
    'হোটেল রয়েল রাজ (রাজশাহী - RU Exam)',
    'হোটেল আগ্রাবাদ (চট্টগ্রাম - CU Exam)',
    'হোটেল নূরজাহান গ্র্যান্ড (সিলেট - SUST Exam)',
    'হোটেল ক্যাসল সালাম (খুলনা - KUET Exam)',
    'হোটেল ধানমন্ডি ইন (ঢাকা - DU Exam)',
    'কাস্টম হোটেল / রেস্ট হাউস (Custom Hotel)'
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Calculate existing bus numbers for activeBusName
  const busesUnderActiveName = useMemo(() => {
    if (!activeBusName) return [];
    return existingBuses.filter(b => 
      b.busName && b.busName.trim().toLowerCase() === activeBusName.toLowerCase()
    );
  }, [existingBuses, activeBusName]);

  const usedBusNumbers = useMemo(() => {
    return busesUnderActiveName.map(b => (b.busNumber || '').toUpperCase().trim());
  }, [busesUnderActiveName]);

  // Normalize bus numbers to detect duplicates even with variations like 'বাস-১', 'BUS-1', '1', 'বাস-০১'
  const normalizeNumberTag = (str: string) => {
    return str
      .replace(/[\s\-_]/g, '')
      .replace(/বাস/g, '')
      .replace(/BUS/gi, '')
      .replace(/০/g, '0')
      .replace(/১/g, '1')
      .replace(/২/g, '2')
      .replace(/৩/g, '3')
      .replace(/৪/g, '4')
      .replace(/৫/g, '5')
      .replace(/৬/g, '6')
      .replace(/৭/g, '7')
      .replace(/৮/g, '8')
      .replace(/৯/g, '9')
      .replace(/^0+/, ''); // strip leading zeros for comparison
  };

  const isDuplicate = useMemo(() => {
    if (!busNumber.trim()) return false;
    const currentNorm = normalizeNumberTag(busNumber);
    return usedBusNumbers.some(used => {
      if (used === busNumber.toUpperCase().trim()) return true;
      if (currentNorm && normalizeNumberTag(used) === currentNorm) return true;
      return false;
    });
  }, [busNumber, usedBusNumbers]);

  // Smart suggestions: Generate in batches of 10 up to 50 (or max used + 10)
  const numberSuggestions = useMemo(() => {
    const usedInts = new Set<number>();
    usedBusNumbers.forEach(num => {
      const norm = normalizeNumberTag(num);
      const val = parseInt(norm, 10);
      if (!isNaN(val)) usedInts.add(val);
    });

    const maxUsed = Math.max(...Array.from(usedInts), 0);
    // At least 50 suggestions, or rounded up to next 10 batch
    const totalCount = Math.max(50, Math.ceil((maxUsed + 10) / 10) * 10);

    const suggestions: { label: string; bnLabel: string; code: string; isUsed: boolean; num: number }[] = [];
    for (let i = 1; i <= totalCount; i++) {
      const isUsed = usedInts.has(i);
      const padNum = i < 10 ? `0${i}` : `${i}`;
      const bnDigits = `${i}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
      const bnPad = i < 10 ? `০${bnDigits}` : bnDigits;

      suggestions.push({
        num: i,
        label: `Bus-${padNum}`,
        bnLabel: `বাস-${bnPad}`,
        code: `BUS-${padNum}`,
        isUsed
      });
    }
    return suggestions;
  }, [usedBusNumbers]);

  // Suggested next free bus number
  const nextAvailableSuggestion = useMemo(() => {
    return numberSuggestions.find(s => !s.isUsed) || numberSuggestions[0];
  }, [numberSuggestions]);

  // 10-Item Queue Pagination
  const totalQueuePages = Math.ceil(numberSuggestions.length / 10);
  const currentQueueSuggestions = useMemo(() => {
    const start = queuePage * 10;
    return numberSuggestions.slice(start, start + 10);
  }, [numberSuggestions, queuePage]);

  // When activeBusName changes, auto-set to the next free suggestion & jump queue to that page
  useEffect(() => {
    if (nextAvailableSuggestion) {
      setBusNumber(nextAvailableSuggestion.bnLabel);
      const targetPage = Math.floor((nextAvailableSuggestion.num - 1) / 10);
      setQueuePage(targetPage);
    }
    // Check if matching preset info exists
    const preset = DEFAULT_FLEET_PRESETS.find(p => p.name === activeBusName);
    if (preset) {
      setTargetUniversity(preset.uni);
      setRouteDestination(preset.dest);
      setCapacity(preset.capacity);
    }
  }, [activeBusName]);

  const handleSelectBusNumberSuggestion = (s: typeof numberSuggestions[0]) => {
    setBusNumber(s.bnLabel);
  };

  const handlePresetDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW_CUSTOM_NAME__') {
      setIsCustomNameMode(true);
      setCustomBusNameInput('');
    } else {
      setIsCustomNameMode(false);
      setSelectedPresetName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusName) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে বাসের একটি নাম নির্বাচন বা এন্ট্রি করুন।' : 'Please select or enter a bus name.');
      return;
    }

    if (isDuplicate) {
      setErrorMessage(
        language === 'bn'
          ? `সতর্কতা: '${activeBusName}' এর জন্য '${busNumber}' ইতিমধ্যে বিদ্যমান! অনুগ্রহ করে '${nextAvailableSuggestion?.bnLabel || 'পরবর্তী'}' বা অন্য নম্বর বেছে নিন।`
          : `Duplicate Alert: Bus '${busNumber}' already exists under '${activeBusName}'!`
      );
      return;
    }

    const finalOperator = isCompanyPending
      ? 'পরে নির্ধারণ করা হবে (Pending Vendor Allocation)'
      : (selectedCompany === 'অন্যান্য কোম্পানি (Custom Company)' ? (customCompanyInput.trim() || 'Custom Operator') : selectedCompany);

    let enrichedNotes = notes.trim();
    if (hasHotelPackage) {
      const perksArr = [];
      if (hotelBreakfast) perksArr.push('ফ্রি নাস্তা');
      if (hotelShuttle) perksArr.push('পরীক্ষার হল শাটল');
      if (hotelWifi) perksArr.push('এসি ও ওয়াইফাই');
      const hotelTag = `[🏨 HOTEL PACKAGE: ${hotelName.trim()} | Room: ${hotelRoomType} | Stay: ${hotelDuration} | Fee: ৳${hotelCostPerPerson}/person | Inclusions: ${perksArr.join(', ')}]`;
      enrichedNotes = enrichedNotes ? `${hotelTag} | ${enrichedNotes}` : hotelTag;
    }

    try {
      const res = await createBusAction({
        busName: activeBusName,
        busNumber: busNumber.toUpperCase().trim(),
        operator: finalOperator,
        regNumber: regNumber ? regNumber.toUpperCase().trim() : undefined,
        routeOrigin: routeOrigin.trim(),
        routeDestination: routeDestination.trim(),
        targetUniversity: targetUniversity.trim(),
        capacity: Number(capacity),
        busType,
        status,
        seatLayoutId: seatLayoutId || undefined,
        notes: enrichedNotes
      });

      if (res.success) {
        setSuccessMessage(
          language === 'bn'
            ? `🎉 '${activeBusName}' এর '${busNumber}' সফলভাবে তৈরি হয়েছে!`
            : `🎉 Bus '${busNumber}' successfully created!`
        );
        setTimeout(() => {
          router.push('/buses');
          router.refresh();
        }, 900);
      } else {
        setErrorMessage(res.error || 'Failed to create bus');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/buses">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.createBus}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'bn'
              ? 'নতুন বাস, রুট ও পরীক্ষার কেন্দ্র রেজিস্টার করুন। এক রুটে একাধিক বাস থাকলে স্মার্ট নম্বর সাজেশন ব্যবহার করুন।'
              : 'Register a new bus with intelligent duplicate detection and sequential number suggestions.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-sm border-2 border-rose-300 dark:border-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold">{language === 'bn' ? 'ত্রুটি / সতর্কতা:' : 'Validation Error:'}</div>
            <p className="mt-0.5 text-xs font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-sm border-2 border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <Card className="shadow-lg border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1-Click Fast Configuration Presets */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'bn' ? '১-ক্লিক ফাস্ট কোচ প্রিসেট (1-Click Presets)' : '1-Click Coach Presets'}</span>
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  {language === 'bn' ? 'স্বয়ংক্রিয় ক্যাপাসিটি ও সিট কনফিগারেশন' : 'Auto-sets capacity & seat configuration'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapacity(40);
                    const standardLayout = layouts.find(l => l.totalSeats === 40);
                    if (standardLayout) setSeatLayoutId(standardLayout.id);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                    capacity === 40
                      ? 'border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-850 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">40-Seat Luxury AC</span>
                    <Badge variant="primary" className="text-[10px] font-bold">40 Seats</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'bn' ? 'স্ট্যান্ডার্ড ২x২ লাক্সারি এসি কোচ (VIP ফ্রন্ট রো)' : 'Standard 2x2 AC Luxury (VIP front rows)'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCapacity(45);
                    const layout45 = layouts.find(l => l.totalSeats === 45);
                    if (layout45) setSeatLayoutId(layout45.id);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                    capacity === 45
                      ? 'border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-850 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">45-Seat High-Deck</span>
                    <Badge variant="purple" className="text-[10px] font-bold">45 Seats</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'bn' ? 'হাই-ডেক এক্সপ্রেস (২x২ + ৫-সিট রিয়ার বেঞ্চ)' : 'High-Deck Coach (2x2 + 5-seat rear bench)'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCapacity(28);
                    const layout28 = layouts.find(l => l.totalSeats === 28);
                    if (layout28) setSeatLayoutId(layout28.id);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                    capacity === 28
                      ? 'border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-400/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-850 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">28-Seat Business</span>
                    <Badge variant="success" className="text-[10px] font-bold">28 Seats</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'bn' ? 'রয়েল বিজনেস ক্লাস (২x১ লাক্সারি রিক্লাইনার)' : 'Royal Business Class (2x1 Luxury Recliner)'}
                  </p>
                </button>
              </div>
            </div>

            {/* Section 1: Bus Fleet & Unique Numbering */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-blue-600" />
                  <span>{language === 'bn' ? '১. বাসের নাম ও নম্বর নির্ধারণ' : '1. Bus Fleet & Numbering'}</span>
                </div>
                {busesUnderActiveName.length > 0 && (
                  <Badge variant="primary" className="text-[11px] font-bold">
                    {language === 'bn' ? `এই রুটে চালু আছে: ${busesUnderActiveName.length} টি বাস` : `Active on route: ${busesUnderActiveName.length} buses`}
                  </Badge>
                )}
              </h3>

              {/* Bus Name Dropdown or Custom Entry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'bn' ? 'বাসের নাম / ফ্লিট (Bus Name Dropdown) *' : 'Bus Name / Fleet Title *'}
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomNameMode(!isCustomNameMode);
                      if (!isCustomNameMode) setCustomBusNameInput('');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {isCustomNameMode ? (
                      <span>{language === 'bn' ? '← ড্রপডাউন থেকে নির্বাচন করুন' : '← Pick from dropdown'}</span>
                    ) : (
                      <span>{language === 'bn' ? '✨ + নতুন বাসের নাম এন্ট্রি করুন' : '✨ + Enter Custom Name'}</span>
                    )}
                  </button>
                </div>

                {isCustomNameMode ? (
                  <div className="space-y-1.5 animate-in fade-in">
                    <Input
                      value={customBusNameInput}
                      onChange={(e) => setCustomBusNameInput(e.target.value)}
                      placeholder="e.g. রাবি স্পেশাল নাইট কোচ (RU Night Express)"
                      autoFocus
                      required
                      className="border-2 border-blue-500 font-bold text-sm bg-blue-50/40 dark:bg-blue-950/20"
                    />
                    <p className="text-[11px] text-slate-500">
                      {language === 'bn'
                        ? 'নতুন বাসের নাম টাইপ করুন। এটি ভবিষ্যতে ড্রপডাউনে সংরক্ষিত থাকবে।'
                        : 'Type a new custom bus name. It will be added to your fleet roster.'}
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedPresetName}
                    onChange={handlePresetDropdownChange}
                    className="w-full text-sm font-bold px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-xs"
                  >
                    <optgroup label={language === 'bn' ? 'তালিকাভুক্ত বাসের নামসমূহ' : 'Available Fleet Names'}>
                      {availableBusNames.map((name) => {
                        const count = existingBuses.filter(b => b.busName === name).length;
                        return (
                          <option key={name} value={name}>
                            {name} {count > 0 ? `(${count} টি বাস বিদ্যমান)` : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    <option value="__ADD_NEW_CUSTOM_NAME__" className="font-bold text-blue-600">
                      {language === 'bn' ? '✨ + নতুন বাসের নাম টাইপ করুন (Add New Name)' : '✨ + Add New Custom Name...'}
                    </option>
                  </select>
                )}
              </div>

              {/* Bus Number with Smart Conflict Detection & Next Suggestions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      {language === 'bn' ? 'বাসের নম্বর / কোড (Bus Number) *' : 'Bus Number / Sequence *'}
                    </label>
                    <div className="relative">
                      <Input
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                        placeholder="e.g. বাস-০১ or BUS-01"
                        required
                        className={`font-mono text-base font-black uppercase transition-all ${
                          isDuplicate
                            ? 'border-2 border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 pr-10 focus:ring-rose-500'
                            : 'border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                        }`}
                      />
                      <div className="absolute right-3 top-3.5">
                        {isDuplicate ? (
                          <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                        ) : (
                          <Check className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    </div>

                    {/* Conflict Warning or Success Validation Message */}
                    {isDuplicate ? (
                      <div className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-start gap-1.5 animate-in fade-in">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          {language === 'bn'
                            ? `সতর্কতা: "${activeBusName}" এর অধীনে "${busNumber}" ইতিমধ্যে খোলা আছে! একই বাসে দুইবার একই নম্বর দেওয়া যাবে না। নিচে থেকে পরবর্তী নম্বর সিলেক্ট করুন।`
                            : `Duplicate Warning: Bus "${busNumber}" is already in use under this fleet name! Pick another number below.`}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'এই বাস নম্বরটি ব্যবহারের জন্য উপযুক্ত (Available)' : 'This bus number is available.'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'BRTA রেজিস্ট্রেশন নম্বর (ঐচ্ছিক)' : 'BRTA Registration No (Optional)'}
                    </label>
                    <Input
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder={language === 'bn' ? 'যেমন: ঢাকা মেট্রো-ব ১৪-২৫৮০ (খালি রাখা যাবে)' : 'e.g. DHAKA-METRO-B-1425'}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Smart Sequential Number Suggestions Queue (10 at a time, up to 50+) */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? `বাস নম্বর কিউ (১০টি করে প্রদর্শন - পৃষ্ঠা ${queuePage + 1}/${totalQueuePages}):` : `Bus Number Queue (${queuePage + 1}/${totalQueuePages}):`}</span>
                    </span>

                    {/* Queue Navigation Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={queuePage === 0}
                        onClick={() => setQueuePage(p => Math.max(0, p - 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 flex items-center gap-1 transition-all"
                        title="পূর্ববর্তী ১০টি বাস নম্বর"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'পূর্বের ১০টি' : 'Prev 10'}</span>
                      </button>

                      {/* Queue Page Tabs */}
                      <div className="hidden md:flex items-center gap-1">
                        {Array.from({ length: totalQueuePages }).map((_, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setQueuePage(pIdx)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all ${
                              queuePage === pIdx
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            {pIdx * 10 + 1}-{pIdx * 10 + 10}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={queuePage >= totalQueuePages - 1}
                        onClick={() => setQueuePage(p => Math.min(totalQueuePages - 1, p + 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 flex items-center gap-1 transition-all"
                        title="পরবর্তী ১০টি বাস নম্বর"
                      >
                        <span>{language === 'bn' ? 'পরবর্তী ১০টি' : 'Next 10'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 10 Bus Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {currentQueueSuggestions.map((s) => {
                      const isCurrent = busNumber.toUpperCase().trim() === s.bnLabel.toUpperCase().trim() || busNumber.toUpperCase().trim() === s.label.toUpperCase().trim();
                      return (
                        <button
                          key={s.num}
                          type="button"
                          disabled={s.isUsed}
                          onClick={() => handleSelectBusNumberSuggestion(s)}
                          className={`px-3 py-2 rounded-xl text-xs font-black font-mono transition-all flex items-center justify-between ${
                            s.isUsed
                              ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed border border-transparent opacity-60'
                              : isCurrent
                              ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-md scale-105 ring-2 ring-blue-400/40'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                          }`}
                          title={s.isUsed ? 'এই বাস নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে' : 'এই নম্বরটি নির্বাচন করুন'}
                        >
                          <span>{s.bnLabel}</span>
                          {s.isUsed && <span className="text-[9px] font-sans font-normal opacity-75">(আছে)</span>}
                          {!s.isUsed && !isCurrent && s.num === nextAvailableSuggestion?.num && (
                            <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded font-black">Next</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Transport Company / Operator Vendor Assignment */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? '২. পরিবহন কোম্পানি / বাস অপারেটর' : '2. Transport Company / Vendor'}</span>
                </div>
                {isCompanyPending ? (
                  <Badge variant="warning" className="text-[11px] font-bold">
                    {language === 'bn' ? '⏳ বিক্রি শেষে নির্ধারিত হবে' : 'Pending Allocation'}
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[11px] font-bold">
                    {language === 'bn' ? '✓ কোম্পানি নির্ধারিত' : 'Assigned'}
                  </Badge>
                )}
              </h3>

              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 space-y-3">
                {/* Deferred Checkbox */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="companyPendingCheck"
                      checked={isCompanyPending}
                      onChange={(e) => setIsCompanyPending(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                    />
                    <label htmlFor="companyPendingCheck" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      {language === 'bn'
                        ? '☑ টিকিট বিক্রি সম্পন্ন হওয়ার পর বাস কোম্পানি (অপারেটর) নির্ধারণ করবো'
                        : 'Assign transport company vendor later (after ticket sales are finalized)'}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCompanyManagerOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? '⚙️ কোম্পানি ম্যানেজ' : 'Manage Companies'}</span>
                  </button>
                </div>

                {!isCompanyPending && (
                  <div className="space-y-3 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {language === 'bn' ? 'কোম্পানির নাম নির্বাচন করুন:' : 'Select Transport Operator:'}
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {companyList.length} {language === 'bn' ? 'টি কোম্পানি তালিকাভুক্ত' : 'companies'}
                        </span>
                      </div>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {companyList.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Hotel & Accommodation Tour Package Integration */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>{language === 'bn' ? '৩. হোটেল ও আবাসন প্যাকেজ (ট্যুর প্যাকেজ)' : '3. Hotel & Accommodation Tour Package'}</span>
                </div>
                {hasHotelPackage ? (
                  <Badge variant="purple" className="text-[11px] font-bold">
                    {language === 'bn' ? '🏨 হোটেল প্যাকেজ সক্রিয়' : 'Hotel Package Active'}
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[11px]">
                    {language === 'bn' ? 'শুধু বাস জার্নি' : 'Bus Only'}
                  </Badge>
                )}
              </h3>

              <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-4 ${
                hasHotelPackage
                  ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}>
                {/* Hotel Toggle Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hotelPackageToggle"
                    checked={hasHotelPackage}
                    onChange={(e) => setHasHotelPackage(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="hotelPackageToggle" className="text-xs sm:text-sm font-bold text-purple-950 dark:text-purple-200 cursor-pointer">
                    {language === 'bn'
                      ? '🏨 এই বাসের সাথে শিক্ষার্থীদের জন্য হোটেল / আবাসিক প্যাকেজ সুবিধা রয়েছে'
                      : 'Include Hotel / Accommodation tour package for candidates with this bus'}
                  </label>
                </div>

                {hasHotelPackage && (
                  <div className="space-y-4 pt-3 border-t border-purple-200 dark:border-purple-800/80 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'হোটেলের নাম ও অবস্থান *' : 'Hotel Name & City *'}
                        </label>
                        <input
                          type="text"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                          placeholder="e.g. হোটেল রয়েল রাজ (রাজশাহী)"
                          className="w-full px-3.5 py-2 text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required={hasHotelPackage}
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {POPULAR_HOTELS.map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setHotelName(h)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-semibold hover:bg-purple-200"
                            >
                              {h.split(' ')[0]} {h.split(' ')[1]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'রুম শেয়ারিং ক্যাটাগরি *' : 'Room Category *'}
                        </label>
                        <select
                          value={hotelRoomType}
                          onChange={(e) => setHotelRoomType(e.target.value)}
                          className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="২-বেড শেয়ারিং (Twin Sharing / Student)">২-বেড শেয়ারিং (Twin Sharing / Student)</option>
                          <option value="৪-বেড স্টুডেন্ট শেয়ারিং (4-Bed Economy)">৪-বেড স্টুডেন্ট শেয়ারিং (4-Bed Economy)</option>
                          <option value="ডিলাক্স কাপল / অভিভাবক রুম (Deluxe Guardian Room)">ডিলাক্স কাপল / অভিভাবক রুম (Guardian Room)</option>
                          <option value="ডরমিটরি / বাজেট আবাসন (Dormitory)">ডরমিটরি / বাজেট আবাসন (Dormitory)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'অবস্থানের সময়কাল *' : 'Stay Duration *'}
                        </label>
                        <select
                          value={hotelDuration}
                          onChange={(e) => setHotelDuration(e.target.value)}
                          className="w-full text-xs font-bold px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="২ দিন ১ রাত (Exam Stay)">২ দিন ১ রাত (Exam Stay)</option>
                          <option value="৩ দিন ২ রাত (Full Package)">৩ দিন ২ রাত (Full Package)</option>
                          <option value="১ রাত (Day Stay)">১ রাত (Day Stay)</option>
                          <option value="কাস্টম সময়কাল">কাস্টম সময়কাল</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'হোটেল প্যাকেজ ফি / সারচার্জ (প্রতি জন ৳)' : 'Hotel Surcharge (৳ / person)'}
                        </label>
                        <input
                          type="number"
                          value={hotelCostPerPerson}
                          onChange={(e) => setHotelCostPerPerson(Number(e.target.value))}
                          className="w-full px-3.5 py-2 text-sm font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Inclusions Checkboxes */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        {language === 'bn' ? 'প্যাকেজে অন্তর্ভুক্ত সুবিধাসমূহ:' : 'Included Package Facilities:'}
                      </label>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hotelBreakfast}
                            onChange={(e) => setHotelBreakfast(e.target.checked)}
                            className="w-3.5 h-3.5 text-purple-600 rounded accent-purple-600"
                          />
                          <span>ফ্রি সকালের নাস্তা (Breakfast)</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hotelShuttle}
                            onChange={(e) => setHotelShuttle(e.target.checked)}
                            className="w-3.5 h-3.5 text-purple-600 rounded accent-purple-600"
                          />
                          <span>পরীক্ষার কেন্দ্রে লোকাল ট্রান্সপোর্ট (Center Shuttle)</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hotelWifi}
                            onChange={(e) => setHotelWifi(e.target.checked)}
                            className="w-3.5 h-3.5 text-purple-600 rounded accent-purple-600"
                          />
                          <span>সার্বক্ষণিক এসি ও ওয়াইফাই (AC & Wi-Fi)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Custom Route & Target University */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>{language === 'bn' ? '৪. রুট ও টার্গেট বিশ্ববিদ্যালয়' : '4. Route & Target University'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`${t.routeOrigin} *`}
                  value={routeOrigin}
                  onChange={(e) => setRouteOrigin(e.target.value)}
                  placeholder="e.g. Dhaka (Farmgate / Gabtoli)"
                  required
                />
                <Input
                  label={`${t.routeDestination} *`}
                  value={routeDestination}
                  onChange={(e) => setRouteDestination(e.target.value)}
                  placeholder="e.g. Rajshahi University (RU)"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.targetUniversity} *
                </label>
                <div className="space-y-2">
                  <Input
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU)"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center">
                      {language === 'bn' ? 'প্রস্তাবিত:' : 'Quick Select:'}
                    </span>
                    {DEFAULT_FLEET_PRESETS.map((p) => (
                      <button
                        key={p.uni}
                        type="button"
                        onClick={() => {
                          setTargetUniversity(p.uni);
                          setRouteDestination(p.dest);
                          setCapacity(p.capacity);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          targetUniversity === p.uni
                            ? 'bg-blue-600 text-white font-bold border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p.uni}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Capacity, Gender & Seating Matrix */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>{language === 'bn' ? '৫. সিট সংখ্যা ও লেআউট নির্ধারণ' : '5. Seating & Custom Layout'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={`${language === 'bn' ? 'সিট ধারণক্ষমতা (Capacity)' : 'Seating Capacity'} *`}
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                />

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'লিঙ্গ নীতি (Gender Policy)' : 'Gender Policy'}
                  </label>
                  <select
                    value={busType}
                    onChange={(e) => setBusType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="MIXED">{t.mixedBus}</option>
                    <option value="FEMALE">{t.femaleBus}</option>
                    <option value="MALE">{t.maleBus}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'অপারেশনাল স্ট্যাটাস' : 'Operational Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">Active (Ready for trips)</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'কাস্টম সিট লেআউট সংযুক্ত করুন' : 'Bind Custom Seat Layout'}
                  </label>
                  <Link href="/buses/seat-builder" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    + {t.seatBuilder}
                  </Link>
                </div>
                <select
                  value={seatLayoutId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setSeatLayoutId(lId);
                    const selectedLay = layouts.find(l => l.id === lId);
                    if (selectedLay) {
                      setCapacity(selectedLay.totalSeats);
                    }
                  }}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">{language === 'bn' ? 'ডিফল্ট স্ট্যান্ডার্ড লেআউট' : 'Default Standard Layout'}</option>
                  {layouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.totalSeats} Seats, {l.totalRows}x{l.totalCols} Grid)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'অভ্যন্তরীণ নোট / মন্তব্য' : 'Internal Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={language === 'bn' ? 'যেমন: হাই-স্পিড এসি, ড্রাইভার ফোন নম্বর...' : 'e.g. Equipped with AC, emergency GPS...'}
                  className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href="/buses">
                <Button variant="ghost" size="md" type="button">
                  {t.cancel}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={isDuplicate || isLoading}
                isLoading={isLoading}
                className="font-bold shadow-lg shadow-blue-500/25 px-7 py-2.5 rounded-xl text-sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {language === 'bn' ? 'বাস নিবন্ধন সম্পন্ন করুন' : 'Register Bus'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dynamic Company Manager Modal (Add / Edit / Delete) */}
      <CompanyManagerModal
        isOpen={isCompanyManagerOpen}
        onClose={() => setIsCompanyManagerOpen(false)}
        companies={companyList}
        onUpdateCompanies={(updated) => {
          setCompanyList(updated);
          if (!updated.includes(selectedCompany) && updated.length > 0) {
            setSelectedCompany(updated[0]);
          }
        }}
        language={language}
      />
    </div>
  );
}
