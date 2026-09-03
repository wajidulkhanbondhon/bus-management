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
  Building2,
  Clock,
  X,
  Bot,
  Wand2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createBusAction } from '@/actions/bus.actions';
import { useApp } from '@/lib/context';
import { DEFAULT_COMPANIES, getStoredCompanies } from '@/lib/company-storage';
import { CompanyManagerModal } from './company-manager-modal';
import { UniversityItem, getStoredUniversities, DEFAULT_UNIVERSITIES, getUniversityUnits } from '@/lib/university-storage';
import { UniversityManagerModal } from './university-manager-modal';

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
  { name: 'রাজশাহী বিশ্ববিদ্যালয় A Unit স্পেশাল কোচ', uni: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', dest: 'Rajshahi University (RU)', capacity: 45 },
  { name: 'কৃষি গুচ্ছ স্পেশাল কোচ (Agri Cluster)', uni: 'কৃষি গুচ্ছ (Agri Cluster)', dest: 'Agricultural Universities', capacity: 40 }
];

// Helper to compute next available bus number across the entire fleet (kept for general fallback)
export function getFleetNextBusNumber(busesList: any[] = []): string {
  const usedInts = new Set<number>();
  busesList.forEach(b => {
    const raw = (b.busNumber || b.bus_number || '').trim();
    const en = raw.replace(/[০-৯]/g, (d: string) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
    const match = en.match(/(\d+)/);
    if (match) {
      usedInts.add(parseInt(match[1], 10));
    }
  });

  let next = 1;
  while (usedInts.has(next)) {
    next++;
  }

  const pad = next < 10 ? `0${next}` : `${next}`;
  const bnPad = pad.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  return `বাস-${bnPad}`;
}

// Helper to compute next available bus number scoped to University / Category
export function getCategoryScopedNextBusNumber(
  existingBuses: any[] = [],
  targetUni: string = '',
  busName: string = ''
): { nextBnLabel: string; usedNumbers: string[]; nextInt: number; uniqueCode: string } {
  const normUni = (targetUni || '').trim().toLowerCase().split(' (')[0];
  const normName = (busName || '').trim().toLowerCase().split(' (')[0];

  // Filter buses that match this university or name category
  const categoryBuses = existingBuses.filter(b => {
    if (!b) return false;
    const bUni = (b.targetUniversity || '').trim().toLowerCase().split(' (')[0];
    const bName = (b.busName || b.bus_name || '').trim().toLowerCase().split(' (')[0];
    
    if (normUni && normUni !== 'all' && normUni !== 'সকল' && normUni !== '') {
      if (bUni && (bUni.includes(normUni) || normUni.includes(bUni))) return true;
    }
    if (normName && normName !== '') {
      if (bName && (bName.includes(normName) || normName.includes(bName))) return true;
    }
    return false;
  });

  const usedInts = new Set<number>();
  const usedNumbers: string[] = [];

  categoryBuses.forEach(b => {
    const raw = (b.busNumber || b.bus_number || '').trim();
    if (raw) usedNumbers.push(raw.toUpperCase());
    const en = raw.replace(/[০-৯]/g, (d: string) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
    const match = en.match(/(\d+)/);
    if (match) {
      usedInts.add(parseInt(match[1], 10));
    }
  });

  // Calculate next integer for this category (starts from 1!)
  let nextInt = 1;
  while (usedInts.has(nextInt)) {
    nextInt++;
  }

  const pad = nextInt < 10 ? `0${nextInt}` : `${nextInt}`;
  const bnPad = pad.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  const nextBnLabel = `বাস-${bnPad}`;

  // Next Fleet-Wide Unique Accounting Code (ATOMS-101, ATOMS-102, ...)
  const allExistingCodes = new Set<number>();
  existingBuses.forEach(b => {
    const notes = b.notes || '';
    const m = notes.match(/\[🏷️?\s*CODE:\s*ATOMS-(\d+)\]/i);
    if (m) allExistingCodes.add(parseInt(m[1], 10));
  });
  let nextCodeInt = 101;
  while (allExistingCodes.has(nextCodeInt)) {
    nextCodeInt++;
  }
  const uniqueCode = `ATOMS-${nextCodeInt}`;

  return { nextBnLabel, usedNumbers, nextInt, uniqueCode };
}

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
  const [targetUniversity, setTargetUniversity] = useState('');
  const [isCustomNameMode, setIsCustomNameMode] = useState(false);
  const [selectedPresetName, setSelectedPresetName] = useState(availableBusNames[0] || 'রাবি স্পেশাল কোচ (RU Special)');
  const [customBusNameInput, setCustomBusNameInput] = useState('');
  
  const activeBusName = isCustomNameMode ? customBusNameInput.trim() : selectedPresetName.trim();

  // Dynamic Category Scoped Bus Numbering & Unique Accounting Code
  const categorySeqInfo = useMemo(() => {
    return getCategoryScopedNextBusNumber(existingBuses, targetUniversity, activeBusName);
  }, [existingBuses, targetUniversity, activeBusName]);

  const [busNumber, setBusNumber] = useState(categorySeqInfo.nextBnLabel);
  const [uniqueSystemCode, setUniqueSystemCode] = useState(categorySeqInfo.uniqueCode);

  useEffect(() => {
    setBusNumber(categorySeqInfo.nextBnLabel);
    setUniqueSystemCode(categorySeqInfo.uniqueCode);
  }, [categorySeqInfo.nextBnLabel, categorySeqInfo.uniqueCode]);

  const [regNumber, setRegNumber] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('Dhaka (Farmgate / Gabtoli)');
  const [routeDestination, setRouteDestination] = useState('');
  const [capacity, setCapacity] = useState(45);
  const [busType, setBusType] = useState<'MALE' | 'FEMALE' | 'MIXED'>('MIXED');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'>('ACTIVE');
  const [seatLayoutId, setSeatLayoutId] = useState('');
  const [examUnit, setExamUnit] = useState('');
  const [isCustomUnitMode, setIsCustomUnitMode] = useState(false);
  const [baseFare, setBaseFare] = useState(550);
  const [notes, setNotes] = useState('');

  // Light AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Dynamic Universities List & Manager state
  const [uniList, setUniList] = useState<UniversityItem[]>(DEFAULT_UNIVERSITIES);
  const [isUniManagerOpen, setIsUniManagerOpen] = useState(false);

  // Dynamic Units for the currently selected target university
  const currentUniversityUnits = useMemo(() => {
    return getUniversityUnits(targetUniversity, uniList);
  }, [targetUniversity, uniList]);

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
    setUniList(getStoredUniversities());
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

  // Schedule & Timings state (যাত্রার তারিখ, ছাড়ার সময় ও বুকিং উইন্ডো)
  const [departureDate, setDepartureDate] = useState('2026-09-05');
  const [departureTime, setDepartureTime] = useState('22:30'); // রাত ১০:৩০
  const [reportingTime, setReportingTime] = useState('21:45'); // রাত ৯:৪৫
  const [bookingStartDate, setBookingStartDate] = useState('2026-08-25');
  const [bookingStartTime, setBookingStartTime] = useState('10:00'); // সকাল ১০:০০
  const [bookingEndDate, setBookingEndDate] = useState('2026-09-04');
  const [bookingEndTime, setBookingEndTime] = useState('23:59'); // রাত ১১:৫৯
  const [estArrivalTime, setEstArrivalTime] = useState('সকাল ০৬:০০');
  const [returnJourneyDate, setReturnJourneyDate] = useState('2026-09-07');

  // Preset Capacity Filter for 1-Click Presets
  const [presetCapacityFilter, setPresetCapacityFilter] = useState<number | null>(null);

  // Central Auto-Load Handler: When a layout is selected, instantly load maximum details
  const applyLayoutDetails = (layoutId: string) => {
    setSeatLayoutId(layoutId);
    if (!layoutId) {
      setExamUnit('');
      setTargetUniversity('');
      setRouteDestination('');
      setPresetCapacityFilter(null);
      return;
    }
    const selectedLay = layouts.find(l => l.id === layoutId);
    if (!selectedLay) return;

    // 1. Capacity (Strictly locked to layout)
    const layCap = selectedLay.totalSeats || selectedLay.total_seats || 45;
    setCapacity(layCap);

    // 2. University: Extract from university field, layout JSON, or name
    let uni = selectedLay.university || '';
    if (!uni) {
      const jsonRaw = selectedLay.layoutJson || selectedLay.layout_json;
      if (jsonRaw) {
        try {
          const p = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
          if (p?.university) uni = p.university;
        } catch {}
      }
    }
    if (!uni) {
      const text = `${selectedLay.name} ${selectedLay.description || ''}`.toLowerCase();
      if (text.includes('রাজশাহী') || text.includes('ru') || text.includes('রাবি')) uni = 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
      else if (text.includes('ঢাকা') || text.includes('du') || text.includes('ঢাবি')) uni = 'ঢাকা বিশ্ববিদ্যালয় (DU)';
      else if (text.includes('চট্টগ্রাম') || text.includes('cu') || text.includes('চবি')) uni = 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)';
      else if (text.includes('জাহাঙ্গীরনগর') || text.includes('ju') || text.includes('জাবি')) uni = 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)';
      else if (text.includes('গুচ্ছ') || text.includes('gst')) uni = 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)';
      else if (text.includes('বুয়েট') || text.includes('buet')) uni = 'বুয়েট (BUET)';
      else if (text.includes('মেডিকেল') || text.includes('medical')) uni = 'মেডিকেল ও ডেন্টাল (Medical & Dental)';
    }
    if (uni) {
      setTargetUniversity(uni);
    }

    // 3. Exam Unit: Extract from unit, examUnit, layout JSON, or name
    let unit = selectedLay.unit || selectedLay.examUnit || selectedLay.exam_unit || '';
    if (!unit) {
      const jsonRaw = selectedLay.layoutJson || selectedLay.layout_json;
      if (jsonRaw) {
        try {
          const p = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
          if (p?.unit) unit = p.unit;
          else if (p?.examUnit) unit = p.examUnit;
          else if (p?.exam_unit) unit = p.exam_unit;
        } catch {}
      }
    }
    if (!unit) {
      const text = `${selectedLay.name} ${selectedLay.description || ''}`.toLowerCase();
      const match = text.match(/(?:unit|ইউনিট)\s*([a-z0-9+ ]+)/i);
      if (match) unit = `Unit ${match[1].trim()}`;
      else if (text.includes('unit a') || text.includes('a unit')) unit = 'Unit A';
      else if (text.includes('unit b') || text.includes('b unit')) unit = 'Unit B';
      else if (text.includes('unit c') || text.includes('c unit')) unit = 'Unit C';
      else if (text.includes('kha') || text.includes('খ ইউনিট')) unit = 'Kha / B Unit';
      else if (text.includes('ka') || text.includes('ক ইউনিট')) unit = 'Ka / A Unit';
    }
    const finalUnit = unit || 'সাধারণ (সকল ইউনিট)';
    setExamUnit(finalUnit);

    // 4. Route Destination, Hotel and Base Fare auto-sync
    const uniCombined = (uni || selectedLay.name || '').toLowerCase();
    if (uniCombined.includes('রাজশাহী') || uniCombined.includes('ru')) {
      setRouteDestination('Rajshahi University (RU)');
      setBaseFare(550);
      setHotelName('পদ্মা হোটেল অ্যান্ড রিসোর্ট (Rajshahi)');
    } else if (uniCombined.includes('ঢাকা') || uniCombined.includes('du')) {
      setRouteDestination('Dhaka University (DU)');
      setBaseFare(500);
      setHotelName('হোটেল ৭১ / এশিয়া হোটেল (Dhaka)');
    } else if (uniCombined.includes('চট্টগ্রাম') || uniCombined.includes('cu')) {
      setRouteDestination('Chittagong University (CU)');
      setBaseFare(650);
      setHotelName('হোটেল আগ্রাবাদ / জিইসি (Chittagong)');
    } else if (uniCombined.includes('জাহাঙ্গীরনগর') || uniCombined.includes('ju')) {
      setRouteDestination('Jahangirnagar University (JU - Savar)');
      setBaseFare(400);
      setHotelName('সাভার ইন রিসোর্ট (Savar)');
    } else if (uniCombined.includes('গুচ্ছ') || uniCombined.includes('gst')) {
      setRouteDestination('GST Exam Center (জিএসটি পরীক্ষা কেন্দ্র)');
      setBaseFare(550);
    } else if (uniCombined.includes('বুয়েট') || uniCombined.includes('buet')) {
      setRouteDestination('BUET Campus (ঢাকা)');
      setBaseFare(500);
    }

    // 5. Dynamic Bus Name Suggestion (Never include company name in the bus title!)
    if (!isCustomNameMode) {
      const shortUni = uni ? uni.split(' (')[0] : 'ভর্তি কোচ';
      const unitShort = finalUnit && finalUnit !== 'সাধারণ (সকল ইউনিট)' ? ` ${finalUnit.split(' (')[0]}` : '';
      const autoName = `${shortUni}${unitShort} স্পেশাল কোচ (${layCap} সিট)`;
      setSelectedPresetName(autoName);
    }
  };

  // Initial Auto-Load when layouts are loaded ONLY IF a layout was explicitly chosen
  useEffect(() => {
    if (seatLayoutId) {
      applyLayoutDetails(seatLayoutId);
    }
  }, [layouts]);

  // Light AI Assistant Functions
  const executeAiSmartSetup = (promptInput: string) => {
    if (!promptInput.trim()) return;
    setIsAiProcessing(true);
    setAiFeedback(null);

    const text = promptInput.toLowerCase();

    // 1. Detect University & Destination & Base Fare
    let detectedUni = '';
    let detectedDest = '';
    let detectedFare = 550;
    let detectedHotel = '';

    if (text.includes('রাজশাহী') || text.includes('ru') || text.includes('রাবি')) {
      detectedUni = 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
      detectedDest = 'Rajshahi University (RU)';
      detectedFare = 550;
      detectedHotel = 'পদ্মা হোটেল অ্যান্ড রিসোর্ট (Rajshahi)';
    } else if (text.includes('ঢাকা') || text.includes('du') || text.includes('ঢাবি')) {
      detectedUni = 'ঢাকা বিশ্ববিদ্যালয় (DU)';
      detectedDest = 'Dhaka University (DU)';
      detectedFare = 500;
      detectedHotel = 'হোটেল ৭১ / এশিয়া হোটেল (Dhaka)';
    } else if (text.includes('চট্টগ্রাম') || text.includes('cu') || text.includes('চবি')) {
      detectedUni = 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)';
      detectedDest = 'Chittagong University (CU)';
      detectedFare = 650;
      detectedHotel = 'হোটেল আগ্রাবাদ / জিইসি (Chittagong)';
    } else if (text.includes('জাহাঙ্গীরনগর') || text.includes('ju') || text.includes('জাবি')) {
      detectedUni = 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)';
      detectedDest = 'Jahangirnagar University (JU - Savar)';
      detectedFare = 400;
      detectedHotel = 'সাভার ইন রিসোর্ট (Savar)';
    } else if (text.includes('মেডিকেল') || text.includes('medical') || text.includes('ডেন্টাল')) {
      detectedUni = 'মেডিকেল ও ডেন্টাল (Medical & Dental)';
      detectedDest = 'Medical Exam Center (ঢাকা/বিভাগীয় কেন্দ্র)';
      detectedFare = 500;
    } else if (text.includes('বুয়েট') || text.includes('buet')) {
      detectedUni = 'বুয়েট (BUET)';
      detectedDest = 'BUET Campus (ঢাকা)';
      detectedFare = 500;
    } else if (text.includes('গুচ্ছ') || text.includes('gst')) {
      detectedUni = 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)';
      detectedDest = 'GST Exam Center';
      detectedFare = 550;
    }

    if (detectedUni) setTargetUniversity(detectedUni);
    if (detectedDest) setRouteDestination(detectedDest);
    if (detectedFare) setBaseFare(detectedFare);
    if (detectedHotel) setHotelName(detectedHotel);

    // 2. Detect Capacity
    let detectedCap = 0;
    const capMatch = text.match(/\b(45|40|36|28|52|30|32|38|42|50)\b/);
    if (capMatch) {
      detectedCap = parseInt(capMatch[1], 10);
    }

    // 3. Find best matching layout in database
    let bestLayout = layouts.find(l => {
      const lText = `${l.name} ${l.university || ''} ${l.description || ''}`.toLowerCase();
      const lCap = l.totalSeats || l.total_seats;
      const uniMatches = detectedUni ? lText.includes(detectedUni.split(' (')[0].toLowerCase()) : true;
      const capMatches = detectedCap ? lCap === detectedCap : true;
      return uniMatches && capMatches;
    });

    if (!bestLayout && detectedCap) {
      bestLayout = layouts.find(l => (l.totalSeats || l.total_seats) === detectedCap);
    }
    if (!bestLayout && detectedUni) {
      bestLayout = layouts.find(l => {
        const lText = `${l.name} ${l.university || ''}`.toLowerCase();
        return lText.includes(detectedUni.split(' (')[0].toLowerCase());
      });
    }
    if (!bestLayout && layouts.length > 0) {
      bestLayout = layouts[0];
    }

    if (bestLayout) {
      applyLayoutDetails(bestLayout.id);
    }

    // 4. Detect Gender Policy
    let detectedGender: 'MALE' | 'FEMALE' | 'MIXED' = 'MIXED';
    if (text.includes('ছাত্রী') || text.includes('female') || text.includes('মহিলা') || text.includes('মেয়ে')) {
      detectedGender = 'FEMALE';
      setBusType('FEMALE');
    } else if (text.includes('ছাত্র') || text.includes('male') || text.includes('পুরুষ') || text.includes('ছেলে')) {
      detectedGender = 'MALE';
      setBusType('MALE');
    } else {
      setBusType('MIXED');
    }

    // 5. Detect Hotel Package
    if (text.includes('হোটেল') || text.includes('hotel') || text.includes('আবাসন') || text.includes('প্যাকেজ')) {
      setHasHotelPackage(true);
    }

    // 6. Detect Departure Time (Night / Morning)
    if (text.includes('সকাল') || text.includes('morning') || text.includes('দিন')) {
      setDepartureTime('06:30');
      setReportingTime('05:45');
      setEstArrivalTime('দুপুর ১২:৩০');
    } else {
      setDepartureTime('22:30');
      setReportingTime('21:45');
      setEstArrivalTime('সকাল ০৬:০০');
    }

    // 7. Auto-Generate Smart Student Notes / Advisory
    const uniLabel = detectedUni ? detectedUni.split(' (')[0] : 'ভর্তি পরীক্ষা';
    const genderLabel = detectedGender === 'FEMALE' ? 'শুধুমাত্র ছাত্রীদের জন্য সংরক্ষিত' : detectedGender === 'MALE' ? 'শুধুমাত্র ছাত্রদের জন্য' : 'সাধারণ (ছাত্র-ছাত্রী ও অভিভাবক)';
    const hotelNotice = text.includes('হোটেল') ? '🏨 নির্ধারিত হোটেল রুমে থাকার ব্যবস্থা অন্তর্ভুক্ত।' : '';

    const aiGeneratedNotes = `🎓 [${uniLabel} ভর্তি পরীক্ষা ২০২৬ স্পেশাল বাস সার্ভিস]\n• বাস পলিসি: ${genderLabel}\n• রিপোর্টিং: ছাড়ার ৪৫ মিনিট পূর্বে কাউন্টারে উপস্থিত থাকতে হবে।\n• ড্রপ-অফ: সরাসরি পরীক্ষা কেন্দ্রের প্রধান ফটকে শিক্ষার্থীদের নামিয়ে দেওয়া হবে।\n${hotelNotice ? hotelNotice + '\n' : ''}• হেল্পলাইন: যাত্রার দিন সুপারভাইজারের নম্বর টিকিটে স্বয়ংক্রিয়ভাবে প্রদান করা হবে।`;
    setNotes(aiGeneratedNotes);

    setTimeout(() => {
      setIsAiProcessing(false);
      setAiFeedback({
        message: `🤖 AI সফলভাবে ${uniLabel} (${bestLayout ? (bestLayout.totalSeats || bestLayout.total_seats || 45) + ' সিট' : 'বাস'}) কনফিগার করেছে!`,
        type: 'success'
      });
    }, 350);
  };

  const handleAiScheduleOptimize = () => {
    setDepartureTime('22:30');
    setReportingTime('21:45');
    setEstArrivalTime('সকাল ০৬:০০');
    setAiFeedback({
      message: '⚡ AI স্মার্ট শিডিউল অপ্টিমাইজড: রাত ১০:৩০ এ ছাড়া, ৯:৪৫ এ রিপোর্টিং এবং সকাল ৬:০০ টায় পৌঁছানো নির্ধারণ করা হয়েছে।',
      type: 'info'
    });
  };

  const handleAiNoticeGenerate = () => {
    const uniLabel = targetUniversity ? targetUniversity.split(' (')[0] : 'বিশ্ববিদ্যালয়';
    const genderLabel = busType === 'FEMALE' ? 'শুধুমাত্র ছাত্রীদের জন্য সংরক্ষিত' : busType === 'MALE' ? 'শুধুমাত্র ছাত্রদের জন্য' : 'সাধারণ (ছাত্র-ছাত্রী ও অভিভাবক)';
    const generated = `🎓 [${uniLabel} ভর্তি পরীক্ষা স্পেশাল বাস সার্ভিস]\n• রুট: ${routeOrigin} ➔ ${routeDestination || 'ক্যাম্পাস'}\n• বাস পলিসি: ${genderLabel}\n• রিপোর্টিং: ছাড়ার ৪৫ মিনিট পূর্বে কাউন্টারে উপস্থিত থাকুন।\n• ড্রপ-অফ লোকেশন: সরাসরি পরীক্ষা কেন্দ্রের প্রধান ফটক।\n• সিট পলিসি: নির্ধারিত লেআউট অনুযায়ী সিট সংরক্ষিত।\n• জরুরি যোগাযোগ: সুপারভাইজার হটলাইন টিকিট বুকিং কনফার্মেশনে প্রদর্শিত হবে।`;
    setNotes(generated);
    setAiFeedback({
      message: '✨ AI যাত্রীদের নির্দেশনাবলী ও গাইডলাইন স্বয়ংক্রিয়ভাবে তৈরি করেছে!',
      type: 'success'
    });
  };

  // AI Function to Generate Bus Name based on selected Seating Layout, University & Exam Unit
  const generateAiNameFromLayout = () => {
    const selectedLayout = layouts.find(l => l.id === seatLayoutId);
    const layoutCap = selectedLayout ? (selectedLayout.totalSeats || selectedLayout.total_seats || capacity) : capacity;
    const layoutName = selectedLayout?.name || '';
    
    // 1. Identify University / Destination
    let uniTag = '';
    if (targetUniversity && targetUniversity !== 'ALL') {
      const rawUni = targetUniversity.split(' (')[0].trim();
      if (rawUni.includes('রাজশাহী') || rawUni.includes('RU')) uniTag = 'রাবি';
      else if (rawUni.includes('ঢাকা') || rawUni.includes('DU')) uniTag = 'ঢাবি';
      else if (rawUni.includes('চট্টগ্রাম') || rawUni.includes('CU')) uniTag = 'চবি';
      else if (rawUni.includes('জাহাঙ্গীরনগর') || rawUni.includes('JU')) uniTag = 'জাবি';
      else if (rawUni.includes('খুলনা') || rawUni.includes('KUET')) uniTag = 'কুয়েট';
      else if (rawUni.includes('বুয়েট') || rawUni.includes('BUET')) uniTag = 'বুয়েট';
      else if (rawUni.includes('কৃষি গুচ্ছ')) uniTag = 'কৃষি গুচ্ছ';
      else if (rawUni.includes('জিএসটি')) uniTag = 'জিএসটি গুচ্ছ';
      else uniTag = rawUni.slice(0, 10);
    } else if (routeDestination) {
      uniTag = routeDestination.split(' (')[0].trim().slice(0, 10);
    } else if (layoutName) {
      uniTag = layoutName.replace(/\(\d+\s*সিট\)/gi, '').trim().slice(0, 10);
    } else {
      uniTag = 'বিশ্ববিদ্যালয়';
    }

    // 2. Identify Exam Unit
    let unitTag = '';
    if (examUnit && examUnit !== 'General / All Units' && !examUnit.includes('সকল')) {
      const cleanUnit = examUnit.replace(/Unit\s*/i, '').replace(/ইউনিট\s*/i, '').trim();
      unitTag = cleanUnit ? `${cleanUnit} Unit ` : '';
    }

    // 3. Identify Bus Special Type
    let typeTag = 'স্পেশাল';
    if (busType === 'FEMALE') typeTag = 'ছাত্রী স্পেশাল';
    else if (busType === 'MALE') typeTag = 'ছাত্র স্পেশাল';
    else if (hasHotelPackage) typeTag = 'ট্যুর প্যাকেজ';

    // 4. Combine cleanly: e.g. "রাবি A Unit স্পেশাল (45 সিট)"
    let generated = `${uniTag} ${unitTag}${typeTag} (${layoutCap} সিট)`.replace(/\s+/g, ' ').trim();
    if (generated.length > 50) {
      generated = generated.slice(0, 50);
    }

    setIsCustomNameMode(true);
    setCustomBusNameInput(generated);
    setAiFeedback({
      message: language === 'bn' 
        ? `✨ AI নাম তৈরি সম্পন্ন: "${generated}"`
        : `✨ AI Name Generated: "${generated}"`,
      type: 'success'
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdSuccessModal, setCreatedSuccessModal] = useState<{ show: boolean; busName: string; busNumber: string } | null>(null);

  // 1. Calculate used bus numbers scoped to the selected category / university
  const usedBusNumbers = useMemo(() => {
    return categorySeqInfo.usedNumbers;
  }, [categorySeqInfo.usedNumbers]);

  const busesWithSameName = useMemo(() => {
    if (!activeBusName) return [];
    return existingBuses.filter(b => 
      b.busName && b.busName.trim().toLowerCase() === activeBusName.toLowerCase()
    );
  }, [existingBuses, activeBusName]);

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

    // 1. Bus Name & Number Validation
    if (!activeBusName || !activeBusName.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ বাসের নাম আবশ্যক (Please enter/select bus name).' : 'Bus name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeBusName.trim().length > 50) {
      setErrorMessage(
        language === 'bn'
          ? '⚠️ বাসের নাম ৫০ অক্ষরের মধ্যে হতে হবে। অনুগ্রহ করে নাম সংক্ষেপ করুন যাতে কার্ডে সম্পূর্ণ দেখা যায়।'
          : 'Bus name cannot exceed 50 characters.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!busNumber || !busNumber.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ বাসের নম্বর / কোড আবশ্যক (Please enter bus number).' : 'Bus number is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isDuplicate) {
      setErrorMessage(
        language === 'bn'
          ? `⚠️ সতর্কবার্তা: '${busNumber}' ইতিমধ্যে ফ্লিটের অন্য একটি বাসের জন্য ব্যবহৃত হয়েছে! অনুগ্রহ করে '${nextAvailableSuggestion?.bnLabel || 'পরবর্তী খালি নম্বর'}' বেছে নিন।`
          : `Duplicate Alert: Bus '${busNumber}' already exists in the fleet!`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Trip Schedule & Booking Window Required Validation
    if (!departureDate || !departureDate.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ যাত্রার তারিখ (Departure Date) নির্বাচন করা আবশ্যক।' : 'Departure date is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!departureTime || !departureTime.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ বাস ছাড়ার সময় (Departure Time) উল্লেখ করা আবশ্যক।' : 'Departure time is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!reportingTime || !reportingTime.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ যাত্রী রিপোর্টিং সময় (Reporting Time) উল্লেখ করা আবশ্যক।' : 'Reporting time is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!bookingStartDate || !bookingStartDate.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ টিকিট বুকিং শুরুর তারিখ (Booking Opens) আবশ্যক।' : 'Booking start date is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!bookingEndDate || !bookingEndDate.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ টিকিট বুকিং শেষের তারিখ (Booking Closes) আবশ্যক।' : 'Booking end date is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (bookingStartDate > bookingEndDate) {
      setErrorMessage(
        language === 'bn'
          ? `⚠️ তারিখ অসঙ্গতি: বুকিং শুরুর তারিখ (${bookingStartDate}) বুকিং শেষের তারিখ (${bookingEndDate}) এর চেয়ে পরে হতে পারে না।`
          : `Invalid Dates: Booking start date (${bookingStartDate}) cannot be after booking end date (${bookingEndDate}).`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (bookingEndDate > departureDate) {
      setErrorMessage(
        language === 'bn'
          ? `⚠️ তারিখ অসঙ্গতি: বুকিং শেষের তারিখ (${bookingEndDate}) মূল যাত্রার তারিখ (${departureDate}) এর পরে হতে পারে না।`
          : `Invalid Dates: Booking end date (${bookingEndDate}) cannot be after departure date (${departureDate}).`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Route & Target University Required Validation
    if (!targetUniversity || !targetUniversity.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ লক্ষ্য বিশ্ববিদ্যালয় / ভর্তি কেন্দ্র (Target University) নির্বাচন করা আবশ্যক।' : 'Target University is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!routeOrigin || !routeOrigin.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ যাত্রা শুরুর স্থান (Route Origin) উল্লেখ করা আবশ্যক।' : 'Route Origin is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!routeDestination || !routeDestination.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ বাসের গন্তব্য (Route Destination) উল্লেখ করা আবশ্যক।' : 'Route Destination is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Seating & Custom Layout Required Validation
    if (!capacity || Number(capacity) <= 0) {
      setErrorMessage(language === 'bn' ? '⚠️ বাসের সিট ধারণক্ষমতা (Capacity) অন্তত ১ বা তার বেশি হতে হবে।' : 'Capacity must be at least 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!seatLayoutId || !seatLayoutId.trim()) {
      setErrorMessage(language === 'bn' ? '⚠️ অনুগ্রহ করে একটি বাস সিট লেআউট নির্বাচন করুন।' : 'Please select a seat layout.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. Hotel Tour Package Validation (If Checked)
    if (hasHotelPackage) {
      if (!hotelName || !hotelName.trim()) {
        setErrorMessage(language === 'bn' ? '⚠️ হোটেল প্যাকেজ সক্রিয় থাকায় হোটেলের নাম ও অবস্থান আবশ্যক।' : 'Hotel name is required when hotel package is enabled.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (hotelCostPerPerson === undefined || hotelCostPerPerson < 0) {
        setErrorMessage(language === 'bn' ? '⚠️ হোটেলের জনপ্রতি চার্জ উল্লেখ করুন (০ বা তার বেশি)।' : 'Please provide valid hotel cost per person.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const finalOperator = isCompanyPending
      ? 'পরে নির্ধারণ করা হবে (Pending Vendor Allocation)'
      : (selectedCompany === 'অন্যান্য কোম্পানি (Custom Company)' ? (customCompanyInput.trim() || 'Custom Operator') : selectedCompany);

    let enrichedNotes = notes.trim();
    
    // 1. Structured Schedule Tag (Includes Departure & Exact Booking Open/Close Times)
    const scheduleTag = `[📅 SCHEDULE: Departure: ${departureDate} ${departureTime} | Reporting: ${reportingTime} | Booking Opens: ${bookingStartDate} ${bookingStartTime} | Booking Closes: ${bookingEndDate} ${bookingEndTime} | Est Arrival: ${estArrivalTime}${returnJourneyDate ? ` | Return: ${returnJourneyDate}` : ''}]`;
    
    // 2. Hotel Package Tag
    let hotelTag = '';
    if (hasHotelPackage) {
      const perksArr = [];
      if (hotelBreakfast) perksArr.push('ফ্রি নাস্তা');
      if (hotelShuttle) perksArr.push('পরীক্ষার হল শাটল');
      if (hotelWifi) perksArr.push('এসি ও ওয়াইফাই');
      hotelTag = `[🏨 HOTEL PACKAGE: ${hotelName.trim()} | Room: ${hotelRoomType} | Stay: ${hotelDuration} | Fee: ৳${hotelCostPerPerson}/person | Inclusions: ${perksArr.join(', ')}]`;
    }

    // 3. Target University & Route Tag & Exam Unit Tag
    const uniTag = targetUniversity ? `[🎯 UNI: ${targetUniversity.trim()}]` : '';
    const routeTag = routeOrigin && routeDestination ? `[📍 ROUTE: ${routeOrigin.trim()} ➔ ${routeDestination.trim()}]` : '';
    const unitTag = examUnit ? `UNIT: ${examUnit.trim()};` : '';
    const fareTag = `[💰 FARE: ${baseFare}]`;
    const codeTag = `[🏷️ CODE: ${uniqueSystemCode || categorySeqInfo.uniqueCode}]`;
    const tags = [codeTag, uniTag, routeTag, scheduleTag, hotelTag, unitTag, fareTag, enrichedNotes].filter(Boolean);
    enrichedNotes = tags.join(' | ');

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

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
        const msg = language === 'bn'
          ? `🎉 '${activeBusName}' এর '${busNumber}' সফলভাবে তৈরি হয়েছে!`
          : `🎉 Bus '${busNumber}' successfully created!`;
        setSuccessMessage(msg);
        setCreatedSuccessModal({
          show: true,
          busName: activeBusName,
          busNumber: busNumber.toUpperCase().trim()
        });
        const encodedName = encodeURIComponent(activeBusName);
        const encodedNum = encodeURIComponent(busNumber.toUpperCase().trim());
        setTimeout(() => {
          router.push(`/buses?created=1&busName=${encodedName}&busNumber=${encodedNum}`);
          router.refresh();
        }, 1800);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12" suppressHydrationWarning>
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
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-xl shadow-emerald-600/25 border-2 border-emerald-400 animate-in fade-in slide-in-from-top-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-black text-base">{successMessage}</span>
            <p className="text-xs text-white/90 font-normal mt-0.5">
              {language === 'bn' ? 'বাস তালিকায় রিডাইরেক্ট করা হচ্ছে...' : 'Redirecting to fleet roster...'}
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-lg border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 🤖 AI COACH ASSISTANT (হালকা AI অ্যাসিস্ট্যান্ট)                     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border-2 border-indigo-200/90 dark:border-indigo-800/70 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                      <span>🤖 AI বাস কনফিগারেশন অ্যাসিস্ট্যান্ট (Smart AI Quick Setup)</span>
                      <Badge variant="primary" className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5">
                        Light AI
                      </Badge>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {language === 'bn' 
                        ? 'আপনার বাসের উদ্দেশ্য সংক্ষেপে লিখুন বা নিচের AI বাটনে ক্লিক করুন — স্বয়ংক্রিয়ভাবে লেআউট, রুট ও শিডিউল সেট হবে।'
                        : 'Type your bus prompt or click an AI preset — fills layout, route, schedule & student guidelines.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Prompt Input Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        executeAiSmartSetup(aiPrompt);
                      }
                    }}
                    placeholder={language === 'bn' ? 'যেমন: "রাবি এ ইউনিট ৪৫ সিট ফিমেল স্পেশাল" বা "ঢাবি খ ইউনিট রাতের বাস"...' : 'e.g. "DU Kha Unit 40-seat AC bus with hotel"...'}
                    className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-2xl border-2 border-indigo-300/80 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-xs"
                  />
                  <Sparkles className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  disabled={isAiProcessing || !aiPrompt.trim()}
                  onClick={() => executeAiSmartSetup(aiPrompt)}
                  className="px-4 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/25 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  {isAiProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>প্রসেসিং...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>✨ AI তৈরি করো</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Quick Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                  {language === 'bn' ? '⚡ দ্রুত প্রম্পট:' : 'Quick Prompts:'}
                </span>
                {[
                  { label: '🏛️ রাবি A Unit (৪৫ সিট)', prompt: 'রাবি এ ইউনিট ৪৫ সিট স্পেশাল কোচ' },
                  { label: '🎓 ঢাবি B Unit (৪০ সিট)', prompt: 'ঢাকা বিশ্ববিদ্যালয় খ ইউনিট ৪০ সিট এক্সপ্রেস' },
                  { label: '🌸 জাবি ছাত্রী স্পেশাল (হোটেল সহ)', prompt: 'জাবি ডি ইউনিট ফিমেল স্পেশাল বাস সাথে হোটেল প্যাকেজ' },
                  { label: '🩺 মেডিকেল এক্সাম এক্সপ্রেস', prompt: 'মেডিকেল ভর্তি পরীক্ষা স্পেশাল বাস' },
                  { label: '🌊 চবি C Unit স্পেশাল', prompt: 'চট্টগ্রাম বিশ্ববিদ্যালয় সি ইউনিট স্পেশাল কোচ' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(chip.prompt);
                      executeAiSmartSetup(chip.prompt);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/90 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/60 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* AI Status Feedback Toast */}
              {aiFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{aiFeedback.message}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: SEATING & CUSTOM LAYOUT (User: Top Priority at the Start) */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200 dark:border-indigo-900/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    {language === 'bn' ? '১. বাস সিট লেআউট নির্বাচন ও কনফিগারেশন' : '1. Seating & Custom Layout'}
                  </h3>
                </div>
                <Badge variant="primary" className="text-[11px] font-bold bg-indigo-600 text-white shadow-2xs">
                  ⚡ লেআউট নির্বাচন করলেই তথ্য অটো-লোড হবে
                </Badge>
              </div>

              {/* 1-Click Fast Configuration Presets with Dynamic Layout Filtering */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-900/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{language === 'bn' ? '১-ক্লিক ফাস্ট কোচ প্রিসেট (1-Click Presets)' : '1-Click Coach Presets'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    {language === 'bn' ? 'ক্যাপাসিটি অনুযায়ী ফিল্টার ও সংশ্লিষ্ট সিট লেআউট প্রদর্শন' : 'Filters & displays matching seat layouts'}
                  </span>
                </div>

                {/* Preset Capacity Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { cap: 45, name: '45-Seat High-Deck', desc: 'হাই-ডেক এক্সপ্রেস (২×২)' },
                    { cap: 40, name: '40-Seat Luxury AC', desc: 'স্ট্যান্ডার্ড লাক্সারি এসি' },
                    { cap: 36, name: '36-Seat Executive', desc: 'বিজনেস রিক্লাইনার' },
                    { cap: 28, name: '28-Seat VIP Suite', desc: 'রয়েল ভিআইপি স্যুট (২×১)' },
                    { cap: 52, name: '52-Seat Economy', desc: 'ইকোনমি লং-রুট' }
                  ].map((preset) => {
                    const isActive = presetCapacityFilter === preset.cap;
                    const matchingCount = layouts.filter(l => (l.totalSeats || l.total_seats) === preset.cap).length;
                    return (
                      <button
                        key={preset.cap}
                        type="button"
                        onClick={() => {
                          setPresetCapacityFilter(isActive ? null : preset.cap);
                          const matchingLay = layouts.find(l => (l.totalSeats || l.total_seats) === preset.cap);
                          if (matchingLay) {
                            applyLayoutDetails(matchingLay.id);
                          } else {
                            setCapacity(preset.cap);
                          }
                        }}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isActive
                            ? 'border-indigo-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-400/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-850 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">{preset.cap} সিট</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            matchingCount > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}>
                            {matchingCount} লেআউট
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Matching Layouts Tray for the Chosen Preset */}
                {presetCapacityFilter !== null && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 space-y-2.5 shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>{presetCapacityFilter} {language === 'bn' ? 'সিটের জন্য প্রস্তুতকৃত লেআউটসমূহ:' : 'Seat Layouts:'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPresetCapacityFilter(null)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        ✕ {language === 'bn' ? 'ফিল্টার বন্ধ' : 'Reset'}
                      </button>
                    </div>

                    {layouts.filter(l => (l.totalSeats || l.total_seats) === presetCapacityFilter).length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <span>⚠️ ডাটাবেজে এখনো {presetCapacityFilter} সিটের কোনো সংরক্ষিত লেআউট পাওয়া যায়নি।</span>
                        <Link href="/buses/seat-builder" className="shrink-0 font-bold text-indigo-600 hover:underline">
                          + সিট বিল্ডারে {presetCapacityFilter} সিটের লেআউট তৈরি করুন ➔
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {layouts
                          .filter(l => (l.totalSeats || l.total_seats) === presetCapacityFilter)
                          .map((l) => {
                            const isSelected = seatLayoutId === l.id;
                            const cap = l.totalSeats || l.total_seats || presetCapacityFilter;
                            return (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => applyLayoutDetails(l.id)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-400 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-indigo-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate">{l.name}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                    {cap} সিট {l.university ? `• ${l.university.split(' (')[0]}` : ''} {l.unit ? `(${l.unit})` : ''}
                                  </span>
                                </div>
                                <Badge variant={isSelected ? 'primary' : 'outline'} className="text-[10px] font-bold shrink-0">
                                  {isSelected ? '✓ সিলেক্টেড' : 'বাছাই'}
                                </Badge>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PRIMARY SEAT LAYOUT DROPDOWN & SPECS DASHBOARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{language === 'bn' ? 'বাস সিট লেআউট নির্বাচন করুন *' : 'Select Bus Seat Layout *'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {language === 'bn'
                        ? 'সিট ধারণক্ষমতা ও ভর্তি ইউনিট নির্বাচিত লেআউটের সাথে সরাসরি সমন্বিত থাকে।'
                        : 'Bus seat capacity and exam units are strictly defined by the chosen layout grid.'}
                    </p>
                  </div>
                  <Link
                    href="/buses/seat-builder"
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 shrink-0"
                  >
                    ⚙️ {language === 'bn' ? 'সিট বিল্ডারে নতুন লেআউট তৈরি করুন ➔' : 'Create New Layout in Seat Builder ➔'}
                  </Link>
                </div>

                {/* Layout Dropdown */}
                <select
                  value={seatLayoutId}
                  onChange={(e) => applyLayoutDetails(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-3 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-xs"
                >
                  <option value="">{language === 'bn' ? '-- একটি সিট লেআউট বেছে নিন --' : '-- Select a Seat Layout --'}</option>
                  {layouts.map((l) => {
                    const cap = l.totalSeats || l.total_seats || 45;
                    const uni = l.university ? ` [${l.university}]` : '';
                    const unit = l.unit ? ` (${l.unit})` : '';
                    return (
                      <option key={l.id} value={l.id}>
                        {l.name} — {cap} সিট{uni}{unit}
                      </option>
                    );
                  })}
                </select>

                {/* Quick Layout Switch Buttons (Presets: 45, 40, 36, 28) */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {language === 'bn' ? 'দ্রুত লেআউট পরিবর্তন (Quick Layout Change):' : 'Quick Layout Switch:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { cap: 45, label: '৪৫ সিট লেআউট (RU Special)' },
                      { cap: 40, label: '৪০ সিট লেআউট (DU Express)' },
                      { cap: 36, label: '৩৬ সিট লেআউট (Executive)' },
                      { cap: 28, label: '২৮ সিট লেআউট (VIP Recliner)' }
                    ].map((preset) => {
                      const matchingLay = layouts.find(l => (l.totalSeats || l.total_seats) === preset.cap);
                      const isMatching = seatLayoutId && matchingLay ? seatLayoutId === matchingLay.id : capacity === preset.cap;
                      return (
                        <button
                          key={preset.cap}
                          type="button"
                          onClick={() => {
                            setPresetCapacityFilter(preset.cap);
                            if (matchingLay) {
                              applyLayoutDetails(matchingLay.id);
                            } else {
                              setCapacity(preset.cap);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            isMatching
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-102 ring-2 ring-indigo-400'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-xs">{isMatching ? '✓' : '＋'}</span>
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── AUTO-LOADED INFORMATION DASHBOARD FROM SELECTED LAYOUT ── */}
                {seatLayoutId && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-indigo-50/90 dark:from-indigo-950/50 dark:via-slate-900 dark:to-indigo-950/50 border-2 border-indigo-200 dark:border-indigo-800 shadow-xs space-y-3 mt-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <div>
                          <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            {language === 'bn' ? 'লেআউট থেকে স্বয়ংক্রিয় প্রাপ্ত তথ্যাবলী' : 'Auto-Loaded Specs from Selected Layout'}
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                            {language === 'bn' ? 'সিট প্ল্যান ও কনফিগারেশন থেকে এই তথ্যগুলো স্বয়ংক্রিয়ভাবে লোড ও সমন্বয় করা হয়েছে' : 'These specifications are automatically derived from the chosen layout'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="primary" className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-0.5 shadow-2xs">
                        ✓ স্বয়ংক্রিয় সিঙ্ক সম্পন্ন
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {/* 1. Target University */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          🏛️ {language === 'bn' ? 'বিশ্ববিদ্যালয়' : 'University'}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5" title={targetUniversity}>
                          {targetUniversity || 'সাধারণ বিশ্ববিদ্যালয়'}
                        </span>
                      </div>

                      {/* 2. Exam Unit */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          📝 {language === 'bn' ? 'ভর্তি ইউনিট' : 'Exam Unit'}
                        </span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate block mt-0.5" title={examUnit}>
                          {examUnit || 'সাধারণ (সকল ইউনিট)'}
                        </span>
                      </div>

                      {/* 3. Capacity */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          💺 {language === 'bn' ? 'আসন সংখ্যা' : 'Capacity'}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                          {capacity} টি সিট (লকড)
                        </span>
                      </div>

                      {/* 4. Destination Route */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          📍 {language === 'bn' ? 'গন্তব্য রুট' : 'Destination'}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5" title={routeDestination}>
                          {routeDestination || 'ক্যাম্পাস'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Bus Fleet & Unique Numbering */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-blue-600" />
                  <span>{language === 'bn' ? '২. বাসের নাম ও নম্বর নির্ধারণ' : '2. Bus Fleet & Numbering'}</span>
                </div>
                {busesWithSameName.length > 0 && (
                  <Badge variant="primary" className="text-[11px] font-bold">
                    {language === 'bn' ? `এই রুটে চালু আছে: ${busesWithSameName.length} টি বাস` : `Active on route: ${busesWithSameName.length} buses`}
                  </Badge>
                )}
              </h3>

              {/* Bus Name Dropdown or Custom Entry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'bn' ? 'বাসের নাম / ফ্লিট টাইটেল *' : 'Bus Name / Fleet Title *'}
                    </label>
                    <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      activeBusName.length >= 45 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {activeBusName.length}/50 অক্ষর
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ✨ AI Name Generator Button from Selected Layout */}
                    <button
                      type="button"
                      onClick={generateAiNameFromLayout}
                      className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title={language === 'bn' ? 'লেআউট অনুযায়ী স্বয়ংক্রিয় নাম তৈরি করুন' : 'Generate name from layout'}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>{language === 'bn' ? '✨ AI নাম তৈরি' : '✨ AI Generate Name'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomNameMode(!isCustomNameMode);
                        if (!isCustomNameMode) setCustomBusNameInput(activeBusName || '');
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isCustomNameMode ? (
                        <span>{language === 'bn' ? '← ড্রপডাউন' : '← Pick from dropdown'}</span>
                      ) : (
                        <span>{language === 'bn' ? '✨ + নতুন বাসের নাম' : '✨ + Custom Name'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {isCustomNameMode ? (
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="relative">
                      <Input
                        value={customBusNameInput}
                        onChange={(e) => setCustomBusNameInput(e.target.value.slice(0, 50))}
                        maxLength={50}
                        placeholder="e.g. রাবি A Unit স্পেশাল (45 সিট)"
                        required
                        className="border-2 border-indigo-500 font-bold text-sm bg-indigo-50/40 dark:bg-indigo-950/20 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400 pointer-events-none">
                        {customBusNameInput.length}/50
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{language === 'bn' ? 'সর্বোচ্চ ৫০ অক্ষরের মধ্যে সংক্ষেপিত যাতে সব কার্ডে সুন্দরভাবে দেখায়।' : 'Max 50 characters so it fits on all cards.'}</span>
                      {customBusNameInput.length >= 50 && (
                        <span className="text-amber-600 font-bold">{language === 'bn' ? 'সর্বোচ্চ সীমা পৌঁছেছে' : 'Max limit reached'}</span>
                      )}
                    </div>
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

                    {/* System Unique Code Badge & Scoped Category Indicator */}
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">
                        {targetUniversity ? `📍 ${targetUniversity.split(' (')[0]} ক্যাটাগরি` : '📍 ফ্লিট ক্রমিক'}
                      </span>
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs" title="হিসাব ও অডিটের জন্য অনন্য সিস্টেম কোড">
                        🏷️ ইউনিক কোড: {uniqueSystemCode}
                      </span>
                    </div>

                    {/* Conflict Warning or Success Validation Message */}
                    {isDuplicate ? (
                      <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300 space-y-2 animate-in fade-in">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            {language === 'bn'
                              ? `সতর্কতা: "${targetUniversity ? targetUniversity.split(' (')[0] : activeBusName}" এর অধীনে "${busNumber}" ইতিমধ্যে ব্যবহৃত হয়েছে! পরবর্তী খালি নম্বরটি বেছে নিন:`
                              : `Duplicate Warning: Bus "${busNumber}" is already in use under this category!`}
                          </span>
                        </div>
                        {nextAvailableSuggestion && (
                          <button
                            type="button"
                            onClick={() => setBusNumber(nextAvailableSuggestion.bnLabel)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{language === 'bn' ? `পরবর্তী খালি নম্বরটি গ্রহণ করুন: ${nextAvailableSuggestion.bnLabel}` : `Use next free: ${nextAvailableSuggestion.bnLabel}`}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? `এই ক্যাটাগরিতে এই বাস নম্বরটি খালি আছে (${busNumber})` : `This bus number is available (${busNumber})`}</span>
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

            {/* Section 2: Trip Schedule, Departure Date & Timings, Booking Window */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{language === 'bn' ? '৩. যাত্রার সময়সূচী, ছাড়ার সময় ও বুকিং উইন্ডো' : '3. Trip Schedule & Booking Window'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAiScheduleOptimize}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'bn' ? '✨ AI শিডিউল অপ্টিমাইজ' : 'AI Optimize'}</span>
                  </button>
                  <Badge variant="primary" className="text-[11px] font-bold font-mono">
                    📅 {departureDate} • {departureTime}
                  </Badge>
                </div>
              </h3>

              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Departure Date */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'যাত্রার তারিখ (Departure Date) *' : 'Departure Date *'}
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      required
                      className="w-full text-xs font-bold font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Departure Time */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'বাস ছাড়ার সময় (Departure Time) *' : 'Departure Time *'}
                    </label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      placeholder="e.g. রাত ১০:৩০ / 10:30 PM"
                      required
                      className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['রাত ১০:৩০', 'রাত ১১:০০', 'সকাল ০৭:০০', 'সকাল ০৮:০০', 'দুপুর ০২:৩০'].map((tVal) => (
                        <button
                          key={tVal}
                          type="button"
                          onClick={() => {
                            setDepartureTime(tVal);
                            if (tVal === 'রাত ১০:৩০') setReportingTime('রাত ০৯:৪৫');
                            else if (tVal === 'রাত ১১:০০') setReportingTime('রাত ১০:১৫');
                            else if (tVal === 'সকাল ০৭:০০') setReportingTime('সকাল ০৬:১৫');
                            else if (tVal === 'সকাল ০৮:০০') setReportingTime('সকাল ০৭:১৫');
                            else if (tVal === 'দুপুর ০২:৩০') setReportingTime('দুপুর ০১:৪৫');
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold hover:bg-blue-200 transition-colors"
                        >
                          {tVal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reporting Time */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'যাত্রী রিপোর্টিং সময় (Reporting Time) *' : 'Reporting Time *'}
                    </label>
                    <input
                      type="text"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      placeholder="e.g. রাত ০৯:৪৫ / 09:45 PM"
                      required
                      className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {language === 'bn' ? 'বাস ছাড়ার ৩০-৪৫ মিনিট পূর্বে কাউন্টারে উপস্থিতি' : 'Presence 30-45 mins before departure'}
                    </span>
                  </div>
                </div>

                {/* Booking Window with Exact Start and End Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-200/80 dark:border-blue-900/80">
                  {/* Booking Window Start: Date + Exact Time */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 space-y-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-500">🟢</span>
                        <span>{language === 'bn' ? 'বুকিং শুরুর তারিখ ও সময় *' : 'Booking Opens At *'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {bookingStartDate} • {bookingStartTime}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                        <input
                          type="date"
                          value={bookingStartDate}
                          onChange={(e) => setBookingStartDate(e.target.value)}
                          required
                          className="w-full text-xs font-bold font-mono px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{language === 'bn' ? 'সময় (কখন শুরু):' : 'Time:'}</span>
                        <input
                          type="time"
                          value={bookingStartTime}
                          onChange={(e) => setBookingStartTime(e.target.value)}
                          required
                          className="w-full text-xs font-bold font-mono px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Window End / Cutoff: Date + Exact Time */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-rose-500">🔴</span>
                        <span>{language === 'bn' ? 'বুকিং শেষের তারিখ ও কাট-অফ সময় *' : 'Booking Closes At *'}</span>
                      </span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold">
                        {bookingEndDate} • {bookingEndTime}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                        <input
                          type="date"
                          value={bookingEndDate}
                          onChange={(e) => setBookingEndDate(e.target.value)}
                          required
                          className="w-full text-xs font-bold font-mono px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{language === 'bn' ? 'সময় (কখন শেষ):' : 'Time:'}</span>
                        <input
                          type="time"
                          value={bookingEndTime}
                          onChange={(e) => setBookingEndTime(e.target.value)}
                          required
                          className="w-full text-xs font-bold font-mono px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimated Arrival & Return Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? '🏁 গন্তব্যে পৌঁছানোর আনুমানিক সময় (Est Arrival)' : 'Est Arrival'}
                    </label>
                    <input
                      type="text"
                      value={estArrivalTime}
                      onChange={(e) => setEstArrivalTime(e.target.value)}
                      placeholder="e.g. সকাল ০৬:০০ / 06:00 AM"
                      className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? '🔄 ফিরতি যাত্রার তারিখ (Return Journey Date)' : 'Return Journey Date'}
                    </label>
                    <input
                      type="date"
                      value={returnJourneyDate}
                      onChange={(e) => setReturnJourneyDate(e.target.value)}
                      className="w-full text-xs font-bold font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Transport Company / Operator Vendor Assignment */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? '৪. পরিবহন কোম্পানি / বাস অপারেটর' : '4. Transport Company / Vendor'}</span>
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

            {/* Section 4: Hotel & Accommodation Tour Package Integration */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>{language === 'bn' ? '৫. হোটেল ও আবাসন প্যাকেজ (ট্যুর প্যাকেজ)' : '5. Hotel & Accommodation Tour Package'}</span>
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

            {/* Section 5: Custom Route & Target University */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'bn' ? '৬. রুট ও টার্গেট বিশ্ববিদ্যালয়' : '6. Route & Target University'}</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setIsUniManagerOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? '➕ নতুন বিশ্ববিদ্যালয় যুক্ত করুন' : 'Add / Manage Universities'}</span>
                </button>
              </div>

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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {t.targetUniversity} *
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {uniList.length} {language === 'bn' ? 'টি বিশ্ববিদ্যালয় তালিকাভুক্ত' : 'universities'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={uniList.some(u => u.nameBn === targetUniversity) ? targetUniversity : 'CUSTOM'}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsUniManagerOpen(true);
                      } else if (e.target.value !== 'CUSTOM') {
                        const found = uniList.find(u => u.nameBn === e.target.value);
                        if (found) {
                          setTargetUniversity(found.nameBn);
                          setRouteDestination(found.nameEn || found.nameBn);
                        }
                      }
                    }}
                    className="px-3.5 py-2.5 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'bn' ? '-- তালিকা থেকে বিশ্ববিদ্যালয় নির্বাচন করুন --' : '-- Select University --'}</option>
                    {uniList.map((uni) => (
                      <option key={uni.id} value={uni.nameBn}>
                        {uni.nameBn} {uni.isCustom ? '⭐ (কাস্টম)' : ''}
                      </option>
                    ))}
                    <option value="CUSTOM">{language === 'bn' ? '✍️ ম্যানুয়ালি নাম লিখুন...' : '✍️ Custom / Type manually'}</option>
                    <option value="ADD_NEW" className="text-blue-600 font-bold">➕ নতুন বিশ্ববিদ্যালয় তৈরি করুন...</option>
                  </select>

                  <Input
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU) বা যেকোনো নাম"
                    required
                  />
                </div>

                {/* ── AUTO-LOADED EXAM UNIT FROM SELECTED LAYOUT (User: No manual input needed during bus creation) ── */}
                {seatLayoutId && examUnit ? (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-indigo-50/90 dark:from-indigo-950/50 dark:via-slate-900 dark:to-indigo-950/50 border-2 border-indigo-200 dark:border-indigo-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট (লেআউট থেকে স্বয়ংক্রিয়ভাবে প্রাপ্ত):' : 'Admission Exam Unit (Auto-Loaded from Layout):'}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-200 font-mono">
                            {examUnit}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-300">
                            ✓ লেআউট থেকে সক্রিয়
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {language === 'bn'
                        ? 'লেআউট তৈরির সময় ইউনিট নির্ধারিত থাকায় এখানে আলাদা করে লেখার প্রয়োজন নেই।'
                        : 'Unit is automatically assigned from the selected seat layout.'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-black text-slate-400 block uppercase tracking-wider">
                          {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট' : 'Admission Exam Unit'}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                          {language === 'bn' ? 'কোনো লেআউট নির্বাচন করা নেই (লেআউট বেছে নিলে ইউনিট স্বয়ংক্রিয়ভাবে লোড হবে)' : 'No layout selected yet (Unit will auto-load upon selecting a layout)'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                      লেআউট অপেক্ষমাণ
                    </Badge>
                  </div>
                )}

                {/* Ticket Fare Policy: Loaded dynamically from Layout Plan */}
                <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <span>🎟️ সিটের ভাড়া পলিসি (Seat Fare from Layout):</span>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {language === 'bn'
                        ? 'সিট প্ল্যানের লেআউট অনুযায়ী প্রতিটি সিটের নিজস্ব ভাড়া (যেমন: ফ্রন্ট রো ৳৬০০, স্ট্যান্ডার্ড ৳৫৫০) স্বয়ংক্রিয়ভাবে কার্যকর হবে।'
                        : 'Individual seat fares defined in the seat layout are automatically applied.'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 shrink-0 self-start sm:self-auto">
                    মাল্টিপল ভাড়া সক্রিয় ✅
                  </Badge>
                </div>

                {/* Quick Select Badges from Dynamic University List */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center">
                    {language === 'bn' ? 'দ্রুত বাছাই:' : 'Quick Select:'}
                  </span>
                  {uniList.slice(0, 10).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setTargetUniversity(u.nameBn);
                        setRouteDestination(u.nameEn || u.nameBn);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        targetUniversity === u.nameBn
                          ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{u.nameBn.split(' ')[0]}</span>
                      {u.isCustom && <span className="ml-1 text-[9px] text-amber-400">⭐</span>}
                    </button>
                  ))}
                  {uniList.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setIsUniManagerOpen(true)}
                      className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold hover:underline cursor-pointer"
                    >
                      + আরও {uniList.length - 10}টি...
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* SECTION 7: GENDER POLICY, OPERATIONAL STATUS & NOTES              */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>{language === 'bn' ? '৭. নীতিমালা, স্ট্যাটাস ও অভ্যন্তরীণ নোট' : '7. Policy, Status & Notes'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'লিঙ্গ নীতি (Gender Policy)' : 'Gender Policy'}
                  </label>
                  <select
                    value={busType}
                    onChange={(e) => setBusType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
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
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                  >
                    <option value="ACTIVE">Active (Ready for trips)</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* ── 3. Extra Seats Booking Guidance Banner ── */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <span className="text-base mt-0.5 shrink-0">💡</span>
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  <span className="font-black block text-amber-950 dark:text-amber-100 mb-0.5">
                    {language === 'bn' ? 'সিট পলিসি ও অতিরিক্ত সিট (Extra Seat) তথ্য:' : 'Seat Policy & Extra Seat Notice:'}
                  </span>
                  <span>
                    {language === 'bn'
                      ? 'বাসের স্থায়ী লেআউট ঠিক রাখতে সিট সংখ্যা লেআউট থেকেই সরাসরি লক থাকে। টিকিট বুকিংয়ের সময় যদি কোনো বাসে অতিরিক্ত সিট (যেমন: করিডোরে বা কেবিনে এক্সট্রা সিট) প্রয়োজন হয়, তবে টিকিট বুকিং স্ক্রিনে সরাসরি "+ অতিরিক্ত সিট (Extra Seat)" অপশন থেকে তা যুক্ত করা যাবে।'
                      : 'Seat capacity is locked to match the layout grid. During ticket booking, dynamic extra seats can be added per trip without breaking the main layout template.'}
                  </span>
                </div>
              </div>


              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'অভ্যন্তরীণ নোট / যাত্রীদের নির্দেশনা' : 'Internal Notes & Passenger Guidelines'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAiNoticeGenerate}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'bn' ? '✨ AI দিয়ে গাইডলাইন তৈরি' : 'AI Generate Guidelines'}</span>
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={language === 'bn' ? 'যেমন: হাই-স্পিড এসি, ড্রাইভার ফোন নম্বর...' : 'e.g. Equipped with AC, emergency GPS...'}
                  className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bottom Status / Error / Success Alerts */}
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
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-xl shadow-emerald-600/25 border-2 border-emerald-400 animate-in fade-in slide-in-from-top-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <span className="font-black text-base">{successMessage}</span>
                  <p className="text-xs text-white/90 font-normal mt-0.5">
                    {language === 'bn' ? 'বাস তালিকায় রিডাইরেক্ট করা হচ্ছে...' : 'Redirecting to fleet roster...'}
                  </p>
                </div>
              </div>
            )}

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

      {/* Floating Centered Success Confirmation Modal */}
      {createdSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'bn' ? '🎉 বাস সফলভাবে তৈরি হয়েছে!' : '🎉 Bus Created Successfully!'}
              </h3>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 font-mono">
                {createdSuccessModal.busName} • [{createdSuccessModal.busNumber}]
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'বাসটি ফ্লিট তালিকায় যুক্ত হয়েছে। স্বয়ংক্রিয়ভাবে রিডাইরেক্ট করা হচ্ছে...'
                  : 'The bus has been added to the fleet roster. Redirecting...'}
              </p>
            </div>

            <div className="pt-2">
              <Link href={`/buses?created=1&busName=${encodeURIComponent(createdSuccessModal.busName)}&busNumber=${encodeURIComponent(createdSuccessModal.busNumber)}`}>
                <Button variant="primary" className="w-full font-bold shadow-lg shadow-emerald-500/25">
                  <span>{language === 'bn' ? '✓ বাস তালিকা দেখুন' : '✓ View All Buses'}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

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

      {/* Dynamic University & Exam Center Manager Modal (Add / Manage) */}
      <UniversityManagerModal
        isOpen={isUniManagerOpen}
        onClose={() => setIsUniManagerOpen(false)}
        universities={uniList}
        onUpdateUniversities={(updated) => {
          setUniList(updated);
        }}
        onSelectUniversity={(uni) => {
          setTargetUniversity(uni.nameBn);
          setRouteDestination(uni.nameEn || uni.nameBn);
        }}
        language={language}
      />
    </div>
  );
}
