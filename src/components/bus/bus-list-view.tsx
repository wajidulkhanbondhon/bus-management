'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bus as BusIcon,
  Plus,
  Grid3X3,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Save,
  X,
  GraduationCap,
  MapPin,
  Building2,
  Settings,
  Sparkles,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  SlidersHorizontal,
  ChevronDown,
  Ticket,
  RotateCcw,
  Armchair
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { updateBusAction, deleteBusAction } from '@/actions/bus.actions';
import { useApp } from '@/lib/context';
import { DEFAULT_COMPANIES, getStoredCompanies } from '@/lib/company-storage';
import { CompanyManagerModal } from './company-manager-modal';
import { UniversityItem, DEFAULT_UNIVERSITIES, getStoredUniversities } from '@/lib/university-storage';
import { UniversityManagerModal } from './university-manager-modal';

interface BusListViewProps {
  buses: any[];
  layouts: any[];
}

export function BusListView({ buses: initialBuses, layouts }: BusListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useApp();
  const [buses, setBuses] = useState(initialBuses);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // ALL, ACTIVE, MAINTENANCE, INACTIVE
  const [selectedGender, setSelectedGender] = useState<string>('ALL'); // ALL, MIXED, FEMALE, MALE
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<'ALL' | 'HOTEL_ONLY' | 'BUS_ONLY'>('ALL'); // ALL, HOTEL_ONLY, BUS_ONLY
  const [selectedUniversity, setSelectedUniversity] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<string>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'JOURNEY' | 'BOOKING_START' | 'BOOKING_END'>('JOURNEY');
  const [selectedDateValue, setSelectedDateValue] = useState<string>('ALL'); // ALL or YYYY-MM-DD
  const [uniMatrixViewMode, setUniMatrixViewMode] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL'); // ALL, GENERAL, ENGG, AGRI, MED, SCIENCE_TECH, SPECIAL
  const [uniSearchQuery, setUniSearchQuery] = useState<string>('');
  const [isUniExpanded, setIsUniExpanded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Dynamic Universities State
  const [uniList, setUniList] = useState<UniversityItem[]>(DEFAULT_UNIVERSITIES);
  const [isUniManagerOpen, setIsUniManagerOpen] = useState<boolean>(false);

  // Dynamic Companies List State
  const [companyList, setCompanyList] = useState<string[]>(DEFAULT_COMPANIES);
  const [isCompanyManagerOpen, setIsCompanyManagerOpen] = useState(false);

  useEffect(() => {
    setBuses(initialBuses);
  }, [initialBuses]);

  useEffect(() => {
    setCompanyList(getStoredCompanies());
    setUniList(getStoredUniversities());
  }, []);

  // Creation Notification State via URL Params
  const [createdNotification, setCreatedNotification] = useState<{ busName: string; busNumber: string } | null>(null);

  useEffect(() => {
    if (searchParams && searchParams.get('created') === '1') {
      const busName = searchParams.get('busName') || 'নতুন বাস';
      const busNumber = searchParams.get('busNumber') || '';
      setCreatedNotification({ busName, busNumber });
      const timer = setTimeout(() => {
        setCreatedNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Edit Modal State
  const [editingBus, setEditingBus] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick Assign Company Vendor Modal State
  const [assigningCompanyBus, setAssigningCompanyBus] = useState<any | null>(null);
  const [vendorCompanyInput, setVendorCompanyInput] = useState(DEFAULT_COMPANIES[0]);
  const [customVendorInput, setCustomVendorInput] = useState('');
  const [isAssigningCompany, setIsAssigningCompany] = useState(false);

  // Delete Modal & Notification State
  const [deletingBus, setDeletingBus] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState<{ busName: string; busNumber: string } | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const POPULAR_COMPANIES = [
    'দেশ ট্রাভেলস (Desh Travels)',
    'শ্যামলী এন.আর ট্রাভেলস (Shyamoli N.R)',
    'হানিফ এন্টারপ্রাইজ (Hanif Enterprise)',
    'গ্রিন লাইন পরিবহন (Green Line)',
    'একতা পরিবহন (Ekota Paribahan)',
    'সেন্টমার্টিন ট্রাভেলস (Saintmartin Travels)',
    'রিল্যাক্স পরিবহন (Relax Paribahan)',
    'বাবলু এন্টারপ্রাইজ (Bablu Enterprise)',
    'অন্যান্য কোম্পানি (Custom Company)'
  ];

  const universityList = [
    { id: 'ALL', labelBn: 'সকল বিশ্ববিদ্যালয় ও কেন্দ্র (All Universities)', labelEn: 'All Universities', cluster: 'ALL' },
    { id: 'RU', labelBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', labelEn: 'Rajshahi University (RU)', cluster: 'GENERAL' },
    { id: 'DU', labelBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)', labelEn: 'Dhaka University (DU)', cluster: 'GENERAL' },
    { id: 'CU', labelBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', labelEn: 'Chittagong University (CU)', cluster: 'GENERAL' },
    { id: 'GST', labelBn: 'জিএসটি গুচ্ছ (GST Cluster)', labelEn: 'GST Cluster', cluster: 'GENERAL' },
    { id: 'JU', labelBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)', labelEn: 'Jahangirnagar Univ (JU)', cluster: 'GENERAL' },
    { id: 'BUET', labelBn: 'বুয়েট (BUET)', labelEn: 'BUET Engineering', cluster: 'ENGG' },
    { id: 'ENGG', labelBn: 'ইঞ্জিনিয়ারিং গুচ্ছ (RUET, CUET, KUET)', labelEn: 'Engg Cluster (CKRUET)', cluster: 'ENGG' },
    { id: 'KUET', labelBn: 'কুয়েট খুলনা (KUET)', labelEn: 'KUET Express', cluster: 'ENGG' },
    { id: 'RUET', labelBn: 'রুয়েট রাজশাহী (RUET)', labelEn: 'RUET Rajshahi', cluster: 'ENGG' },
    { id: 'CUET', labelBn: 'চুয়েট চট্টগ্রাম (CUET)', labelEn: 'CUET Chittagong', cluster: 'ENGG' },
    { id: 'SUST', labelBn: 'সাস্ট সিলেট (SUST)', labelEn: 'SUST Sylhet', cluster: 'ENGG' },
    { id: 'AGRI', labelBn: 'কৃষি গুচ্ছ (Agri Cluster)', labelEn: 'Agri Universities Cluster', cluster: 'AGRI' },
    { id: 'BAU', labelBn: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU)', labelEn: 'BAU Mymensingh', cluster: 'AGRI' },
    { id: 'MED', labelBn: 'মেডিকেল ও ডেন্টাল (Medical & Dental)', labelEn: 'Medical & Dental', cluster: 'MED' },
    { id: 'JNU', labelBn: 'জগন্নাথ বিশ্ববিদ্যালয় (JnU)', labelEn: 'Jagannath Univ (JnU)', cluster: 'GENERAL' },
    { id: 'BUP', labelBn: 'বিইউপি (BUP)', labelEn: 'BUP Dhaka', cluster: 'SPECIAL' },
    { id: 'IU', labelBn: 'ইসলামী বিশ্ববিদ্যালয় কুষ্টিয়া (IU)', labelEn: 'Islamic Univ (IU)', cluster: 'GENERAL' },
    { id: 'COU', labelBn: 'কুমিল্লা বিশ্ববিদ্যালয় (CoU)', labelEn: 'Comilla Univ (CoU)', cluster: 'GENERAL' },
    { id: 'BRUR', labelBn: 'বেগম রোকেয়া রংপুর (BRUR)', labelEn: 'Begum Rokeya Univ', cluster: 'GENERAL' }
  ];

  // Helper to extract hotel package details
  const getHotelInfo = (notes?: string) => {
    if (!notes || !notes.includes('HOTEL PACKAGE:')) return null;
    const match = notes.match(/\[🏨 HOTEL PACKAGE: (.*?)\]/);
    if (match) return match[1];
    return null;
  };

  // Helper to extract structured route info
  const getRouteInfo = (notes?: string) => {
    if (!notes || !notes.includes('ROUTE:')) return null;
    const match = notes.match(/\[📍 ROUTE:\s*([^\]]+)\]/);
    if (match) {
      const parts = match[1].split('➔').map(s => s.trim());
      return {
        origin: parts[0] || '',
        destination: parts[1] || '',
        raw: match[1]
      };
    }
    return null;
  };

  // Helper to extract pricing info
  const getFareInfo = (notes?: string) => {
    if (!notes || !notes.includes('FARE:')) return null;
    const match = notes.match(/\[💰 FARE:\s*([^\]]+)\]/);
    if (match) return match[1];
    return null;
  };

  // Helper to extract structured trip schedule details with guaranteed date & timing fallback
  const getScheduleInfo = (notes?: string, bus?: any) => {
    let departureDate = bus?.departureDate || bus?.departure_date || '';
    let departureTime = bus?.departureTime || bus?.departure_time || 'রাত ১০:৩০';
    let reportingTime = 'রাত ০৯:৪৫';
    let bookingOpens = '2026-09-01';
    let bookingCloses = '2026-09-04';
    let estArrival = 'ভোর ০৫:৩০';
    let returnJourney = '';

    if (notes && notes.includes('SCHEDULE:')) {
      const match = notes.match(/\[📅 SCHEDULE: (.*?)\]/);
      if (match) {
        const parts = match[1].split(' | ');
        const res: Record<string, string> = {};
        parts.forEach(p => {
          const idx = p.indexOf(': ');
          if (idx > -1) {
            const key = p.substring(0, idx).trim();
            const val = p.substring(idx + 2).trim();
            res[key] = val;
          }
        });

        const departureRaw = res['Departure'] || '';
        const departureParts = departureRaw.split(' ');
        if (departureParts[0]) departureDate = departureParts[0];
        if (departureParts.slice(1).join(' ')) departureTime = departureParts.slice(1).join(' ');
        if (res['Reporting']) reportingTime = res['Reporting'];
        if (res['Booking Opens']) bookingOpens = res['Booking Opens'];
        if (res['Booking Closes']) bookingCloses = res['Booking Closes'];
        if (res['Est Arrival']) estArrival = res['Est Arrival'];
        if (res['Return']) returnJourney = res['Return'];
      }
    }

    if (!departureDate && notes) {
      const dateMatch = notes.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) departureDate = dateMatch[1];
    }
    if (!departureDate) {
      departureDate = '2026-09-05';
    }

    return {
      departureDate,
      departureTime,
      reportingTime,
      bookingOpens,
      bookingCloses,
      estArrival,
      returnJourney,
    };
  };

  // Helper to extract or accurately detect target university for a bus
  const getBusUniversity = (bus: any): UniversityItem | null => {
    const notes = bus.notes || '';
    const busName = bus.busName || bus.bus_name || '';
    const op = bus.operator || '';
    const targetUni = bus.targetUniversity || bus.target_university || '';
    const routeDest = bus.routeDestination || bus.route_destination || bus.route?.destination || '';

    // 1. Direct [🎯 UNI: ...] match in notes
    const notesMatch = notes.match(/\[🎯 UNI:\s*([^\]]+)\]/i);
    if (notesMatch && notesMatch[1]) {
      const rawName = notesMatch[1].trim();
      const found = uniList.find(u => u.nameBn.toLowerCase() === rawName.toLowerCase() || u.id.toLowerCase() === rawName.toLowerCase() || (u.nameEn && u.nameEn.toLowerCase() === rawName.toLowerCase()));
      if (found) return found;
      return { id: 'CUSTOM', nameBn: rawName, nameEn: rawName, cluster: 'SPECIAL', isCustom: true };
    }

    // 2. targetUniversity property match
    if (targetUni) {
      const found = uniList.find(u => u.nameBn.toLowerCase() === targetUni.toLowerCase() || u.id.toLowerCase() === targetUni.toLowerCase());
      if (found) return found;
    }

    // 3. Scan combined text against dynamic uniList
    const fullText = `${busName} ${notes} ${op} ${targetUni} ${routeDest}`.toLowerCase();
    for (const u of uniList) {
      const uId = u.id.toLowerCase();
      const uName = u.nameBn.toLowerCase();
      const uEn = (u.nameEn || '').toLowerCase();
      const uFirst = uName.split(' ')[0];
      if (new RegExp(`\\b${uId}\\b`, 'i').test(fullText) || fullText.includes(`(${uId})`)) return u;
      if (fullText.includes(uName) || (uEn && fullText.includes(uEn))) return u;
      if (uFirst.length > 2 && fullText.includes(uFirst)) return u;
    }

    // Common Fallback Keyword checks
    if (fullText.includes('rajshahi') || fullText.includes('রাবি') || fullText.includes('রাজশাহী')) return uniList.find(u => u.id === 'RU') || null;
    if (fullText.includes('dhaka') || fullText.includes('ঢাবি') || fullText.includes('ঢাকা')) return uniList.find(u => u.id === 'DU') || null;
    if (fullText.includes('chittagong') || fullText.includes('চবি') || fullText.includes('চট্টগ্রাম')) return uniList.find(u => u.id === 'CU') || null;
    if (fullText.includes('jahangirnagar') || fullText.includes('জাবি')) return uniList.find(u => u.id === 'JU') || null;
    if (fullText.includes('gst') || fullText.includes('গুচ্ছ')) return uniList.find(u => u.id === 'GST') || null;
    if (fullText.includes('buet') || fullText.includes('বুয়েট')) return uniList.find(u => u.id === 'BUET') || null;
    if (fullText.includes('kuet') || fullText.includes('খুলনা')) return uniList.find(u => u.id === 'KUET') || null;
    if (fullText.includes('ruet') || fullText.includes('রুয়েট')) return uniList.find(u => u.id === 'RUET') || null;
    if (fullText.includes('cuet') || fullText.includes('চুয়েট')) return uniList.find(u => u.id === 'CUET') || null;
    if (fullText.includes('sust') || fullText.includes('সাস্ট') || fullText.includes('শাহজালাল')) return uniList.find(u => u.id === 'SUST') || null;
    if (fullText.includes('agri') || fullText.includes('কৃষি') || fullText.includes('bau')) return uniList.find(u => u.id === 'AGRI') || null;
    if (fullText.includes('medical') || fullText.includes('মেডিকেল')) return uniList.find(u => u.id === 'MED') || null;
    if (fullText.includes('jnu') || fullText.includes('জগন্নাথ')) return uniList.find(u => u.id === 'JNU') || null;
    if (fullText.includes('bup')) return uniList.find(u => u.id === 'BUP') || null;
    if (fullText.includes('islamic') || fullText.includes('ইসলামী')) return uniList.find(u => u.id === 'IU') || null;
    if (fullText.includes('comilla') || fullText.includes('কুমিল্লা')) return uniList.find(u => u.id === 'COU') || null;
    if (fullText.includes('rokeya') || fullText.includes('রোকেয়া')) return uniList.find(u => u.id === 'BRUR') || null;

    return null;
  };

  // Computed Fleet Governance Top Metrics (Active, Inactive, Capacity & University Allocations)
  const fleetMetrics = useMemo(() => {
    const total = buses.length;
    let activeCount = 0;
    let maintenanceCount = 0;
    let inactiveCount = 0;
    let femaleCount = 0;
    let maleCount = 0;
    let mixedCount = 0;
    let hotelCount = 0;
    let busOnlyCount = 0;
    let pendingVendorCount = 0;
    let assignedVendorCount = 0;
    let totalSeats = 0;

    const uniMap: Record<string, { label: string; count: number; active: number; maintenance: number; seats: number; id: string; cluster: string; isCustom?: boolean }> = {};
    uniList.forEach(u => {
      uniMap[u.id] = { label: u.nameBn, count: 0, active: 0, maintenance: 0, seats: 0, id: u.id, cluster: u.cluster, isCustom: u.isCustom };
    });
    uniMap['OTHER'] = { label: 'অন্যান্য কেন্দ্র', count: 0, active: 0, maintenance: 0, seats: 0, id: 'OTHER', cluster: 'OTHER' };

    buses.forEach((b: any) => {
      // Status Count
      const st = (b.status || 'ACTIVE').toUpperCase();
      const isAct = st === 'ACTIVE';
      const isMaint = st === 'MAINTENANCE';

      if (isAct) activeCount++;
      else if (isMaint) maintenanceCount++;
      else inactiveCount++;

      // Gender Count
      const bType = (b.busType || b.bus_type || 'MIXED').toUpperCase();
      if (bType === 'FEMALE') femaleCount++;
      else if (bType === 'MALE') maleCount++;
      else mixedCount++;

      // Hotel Count & Total Seats
      const notes = b.notes || '';
      if (notes.includes('HOTEL PACKAGE:')) hotelCount++;
      else busOnlyCount++;

      const cap = Number(b.capacity) || 45;
      totalSeats += cap;

      // Operator Count
      const op = b.operator || '';
      if (op.includes('পরে নির্ধারণ') || op.includes('Pending Vendor') || !op.trim()) {
        pendingVendorCount++;
      } else {
        assignedVendorCount++;
      }

      // Dynamic university mapping via robust detector
      const matchedUni = getBusUniversity(b);
      if (matchedUni && uniMap[matchedUni.id]) {
        uniMap[matchedUni.id].count++;
        uniMap[matchedUni.id].seats += cap;
        if (isAct) uniMap[matchedUni.id].active++;
        if (isMaint) uniMap[matchedUni.id].maintenance++;
      } else if (matchedUni) {
        uniMap[matchedUni.id] = {
          label: matchedUni.nameBn,
          count: 1,
          active: isAct ? 1 : 0,
          maintenance: isMaint ? 1 : 0,
          seats: cap,
          id: matchedUni.id,
          cluster: (matchedUni.cluster as any) || 'SPECIAL',
          isCustom: true
        };
      } else {
        uniMap['OTHER'].count++;
        uniMap['OTHER'].seats += cap;
        if (isAct) uniMap['OTHER'].active++;
        if (isMaint) uniMap['OTHER'].maintenance++;
      }
    });

    const activeAllocations = Object.values(uniMap)
      .filter(u => u.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      total,
      activeCount,
      maintenanceCount,
      inactiveCount,
      femaleCount,
      maleCount,
      mixedCount,
      hotelCount,
      busOnlyCount,
      pendingVendorCount,
      assignedVendorCount,
      totalSeats,
      uniMap,
      activeAllocations
    };
  }, [buses, uniList]);

  // Helper to extract YYYY-MM-DD from any date string
  const extractDateOnly = (str?: string) => {
    if (!str) return '';
    const match = str.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return str.split(' ')[0] || '';
  };

  // Extract all unique dates dynamically based on current Date Filter Type (Journey, Booking Start, Booking End)
  const availableDatesForType = useMemo(() => {
    const map: Record<string, number> = {};
    buses.forEach((b: any) => {
      const sch = getScheduleInfo(b.notes);
      if (!sch) return;
      let rawVal = '';
      if (dateFilterType === 'JOURNEY') rawVal = sch.departureDate;
      else if (dateFilterType === 'BOOKING_START') rawVal = sch.bookingOpens;
      else if (dateFilterType === 'BOOKING_END') rawVal = sch.bookingCloses;

      const dateOnly = extractDateOnly(rawVal);
      if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        map[dateOnly] = (map[dateOnly] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [buses, dateFilterType]);

  // Extract all unique companies dynamically from buses fleet and stored company list
  const distinctCompanies = useMemo(() => {
    const compMap: Record<string, number> = {};
    buses.forEach((b: any) => {
      const op = (b.operator || '').trim();
      if (op) {
        compMap[op] = (compMap[op] || 0) + 1;
      }
    });
    // Add stored company options
    companyList.forEach((c) => {
      const short = c.split(' (')[0].trim();
      if (!compMap[short] && !compMap[c]) {
        compMap[c] = compMap[c] || 0;
      }
    });
    return Object.entries(compMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [buses, companyList]);

  // Extract all unique seat capacities dynamically from fleet
  const distinctCapacities = useMemo(() => {
    const capMap: Record<number, number> = { 45: 0, 40: 0, 36: 0, 32: 0, 28: 0 };
    buses.forEach((b: any) => {
      const cap = Number(b.capacity) || 45;
      capMap[cap] = (capMap[cap] || 0) + 1;
    });
    return Object.entries(capMap)
      .map(([capStr, count]) => ({ capacity: Number(capStr), count }))
      .filter((item) => item.count > 0 || [45, 40, 36, 32, 28].includes(item.capacity))
      .sort((a, b) => b.capacity - a.capacity);
  }, [buses]);

  // Filter buses
  const filteredBuses = useMemo(() => {
    return buses.filter((bus: any) => {
      const busName = bus.busName || bus.bus_name || '';
      const busNumber = bus.busNumber || bus.bus_number || '';
      const operator = bus.operator || '';
      const regNumber = bus.regNumber || bus.reg_number || '';
      const notes = bus.notes || '';
      const q = (searchFilter || '').toLowerCase();

      const matchesSearch =
        busName.toLowerCase().includes(q) ||
        busNumber.toLowerCase().includes(q) ||
        operator.toLowerCase().includes(q) ||
        regNumber.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q);
      
      const busStatus = (bus.status || 'ACTIVE').toUpperCase();
      const matchesStatus = selectedStatus === 'ALL' || busStatus === selectedStatus;

      const busType = (bus.busType || bus.bus_type || 'MIXED').toUpperCase();
      const matchesGender = selectedGender === 'ALL' || busType === selectedGender;

      let matchesUniversity = true;
      if (selectedUniversity !== 'ALL') {
        const detected = getBusUniversity(bus);
        if (selectedUniversity === 'OTHER') {
          matchesUniversity = !detected || detected.id === 'OTHER';
        } else {
          matchesUniversity = detected?.id === selectedUniversity;
        }
      }

      let matchesDate = true;
      if (selectedDateValue !== 'ALL') {
        const sch = getScheduleInfo(bus.notes);
        if (!sch) {
          matchesDate = false;
        } else {
          let rawVal = '';
          if (dateFilterType === 'JOURNEY') rawVal = sch.departureDate;
          else if (dateFilterType === 'BOOKING_START') rawVal = sch.bookingOpens;
          else if (dateFilterType === 'BOOKING_END') rawVal = sch.bookingCloses;

          const dateOnly = extractDateOnly(rawVal);
          matchesDate = dateOnly === selectedDateValue;
        }
      }

      // Hotel package filter
      const hotelInfo = getHotelInfo(bus.notes);
      const hasHotel = !!hotelInfo;
      const matchesHotel =
        selectedHotelFilter === 'ALL' ||
        (selectedHotelFilter === 'HOTEL_ONLY' && hasHotel) ||
        (selectedHotelFilter === 'BUS_ONLY' && !hasHotel);

      // Company filter
      const matchesCompany =
        selectedCompanyFilter === 'ALL' ||
        operator.toLowerCase().includes(selectedCompanyFilter.toLowerCase());

      // Capacity filter
      const matchesCapacity =
        selectedCapacityFilter === 'ALL' ||
        String(bus.capacity || 40) === selectedCapacityFilter;

      return matchesSearch && matchesStatus && matchesGender && matchesUniversity && matchesDate && matchesHotel && matchesCompany && matchesCapacity;
    });
  }, [buses, searchFilter, selectedStatus, selectedGender, selectedHotelFilter, selectedUniversity, selectedCompanyFilter, selectedCapacityFilter, selectedDateValue, dateFilterType, uniList]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, selectedStatus, selectedGender, selectedHotelFilter, selectedUniversity, selectedCompanyFilter, selectedCapacityFilter, selectedDateValue, dateFilterType, pageSize]);

  // Scalable Pagination
  const totalPages = Math.ceil(filteredBuses.length / pageSize) || 1;
  const paginatedBuses = useMemo(() => {
    if (pageSize >= 9999) return filteredBuses;
    const start = (currentPage - 1) * pageSize;
    return filteredBuses.slice(start, start + pageSize);
  }, [filteredBuses, currentPage, pageSize]);

  const handleOpenEdit = (bus: any) => {
    setEditingBus({
      id: bus.id,
      busName: bus.busName,
      busNumber: bus.busNumber,
      operator: bus.operator || 'পরে নির্ধারণ করা হবে',
      regNumber: bus.regNumber,
      capacity: bus.capacity,
      busType: bus.busType,
      status: bus.status,
      seatLayoutId: bus.seatLayoutId || '',
      notes: bus.notes || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;

    setIsUpdating(true);
    setActionErrorMsg(null);
    try {
      const res = await updateBusAction(editingBus.id, {
        busName: editingBus.busName,
        busNumber: editingBus.busNumber,
        operator: editingBus.operator,
        regNumber: editingBus.regNumber,
        capacity: Number(editingBus.capacity),
        busType: editingBus.busType,
        status: editingBus.status,
        seatLayoutId: editingBus.seatLayoutId || undefined,
        notes: editingBus.notes
      });

      if (res.success) {
        setBuses(buses.map((b) => (b.id === editingBus.id ? { ...b, ...editingBus } : b)));
        const name = editingBus.busName;
        const num = editingBus.busNumber;
        setEditingBus(null);
        setActionSuccessMsg(language === 'bn' ? `✓ '${name}' (${num}) সফলভাবে আপডেট করা হয়েছে!` : `✓ '${name}' (${num}) updated successfully!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        router.refresh();
      } else {
        setActionErrorMsg(res.error || (language === 'bn' ? 'বাস আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update bus'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || (language === 'bn' ? 'বাস আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update bus'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenAssignCompany = (bus: any) => {
    setAssigningCompanyBus(bus);
    const currOp = bus.operator || '';
    if (currOp.includes('Pending') || currOp.includes('পরে নির্ধারণ')) {
      setVendorCompanyInput(POPULAR_COMPANIES[0]);
      setCustomVendorInput('');
    } else if (POPULAR_COMPANIES.includes(currOp)) {
      setVendorCompanyInput(currOp);
      setCustomVendorInput('');
    } else {
      setVendorCompanyInput('অন্যান্য কোম্পানি (Custom Company)');
      setCustomVendorInput(currOp);
    }
  };

  const handleSaveAssignCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCompanyBus) return;

    const chosenOp = vendorCompanyInput === 'অন্যান্য কোম্পানি (Custom Company)'
      ? (customVendorInput.trim() || 'Custom Transport')
      : vendorCompanyInput;

    setIsAssigningCompany(true);
    setActionErrorMsg(null);
    try {
      const res = await updateBusAction(assigningCompanyBus.id, {
        operator: chosenOp
      });

      if (res.success) {
        setBuses(buses.map(b => b.id === assigningCompanyBus.id ? { ...b, operator: chosenOp } : b));
        const busTitle = `${assigningCompanyBus.busName || ''} (${assigningCompanyBus.busNumber || ''})`;
        setAssigningCompanyBus(null);
        setActionSuccessMsg(language === 'bn' ? `✓ ${busTitle} এর বাস কোম্পানি '${chosenOp}' সফলভাবে নির্ধারণ করা হয়েছে!` : `✓ Operator assigned to '${chosenOp}' successfully!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        router.refresh();
      } else {
        setActionErrorMsg(res.error || (language === 'bn' ? 'কোম্পানি নির্ধারণ ব্যর্থ হয়েছে।' : 'Failed to assign company'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || (language === 'bn' ? 'কোম্পানি নির্ধারণ ব্যর্থ হয়েছে।' : 'Failed to assign company'));
    } finally {
      setIsAssigningCompany(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBus) return;

    const targetBus = { ...deletingBus };
    setIsDeleting(true);
    setActionErrorMsg(null);
    try {
      const res = await deleteBusAction(targetBus.id);
      if (res.success) {
        setBuses((prev) => prev.filter((b) => b.id !== targetBus.id));
        const deletedName = targetBus.busName || targetBus.bus_name || 'বাস';
        const deletedNumber = targetBus.busNumber || targetBus.bus_number || '';
        setDeletingBus(null);
        setDeleteNotification({
          busName: deletedName,
          busNumber: deletedNumber
        });
        setTimeout(() => {
          setDeleteNotification(null);
        }, 6000);
        router.refresh();
      } else {
        setActionErrorMsg(res.error || (language === 'bn' ? 'বাস মুছে ফেলতে সমস্যা হয়েছে।' : 'Failed to delete bus'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || (language === 'bn' ? 'বাস মুছে ফেলতে সমস্যা হয়েছে।' : 'Failed to delete bus'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12" suppressHydrationWarning>
      {/* Create Bus Success Notification Banner */}
      {createdNotification && (
        <div className="flex items-center justify-between p-4.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/30 border-2 border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>{language === 'bn' ? '🎉 নতুন বাস সফলভাবে তৈরি হয়েছে!' : '🎉 New Bus Created Successfully!'}</span>
                <Badge variant="default" className="bg-white/25 text-white font-mono text-xs uppercase font-bold">
                  {createdNotification.busNumber}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-white/95 font-medium mt-0.5">
                {language === 'bn'
                  ? `'${createdNotification.busName}' (${createdNotification.busNumber}) বাসটি ফ্লিট রোস্টার ও তালিকায় সফলভাবে যুক্ত হয়েছে।`
                  : `'${createdNotification.busName}' (${createdNotification.busNumber}) has been added to the fleet roster.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreatedNotification(null)}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Delete SMS / Toast Notification Banner */}
      {deleteNotification && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500 text-white shadow-xl shadow-rose-500/25 border-2 border-rose-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>{language === 'bn' ? '🗑️ বাসটি সফলভাবে মুছে ফেলা হয়েছে!' : '🗑️ Bus Deleted Successfully!'}</span>
                <Badge variant="default" className="bg-white/25 text-white font-mono text-xs uppercase">
                  {deleteNotification.busNumber}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                {language === 'bn'
                  ? `'${deleteNotification.busName}' বাসটি ফ্লিট রোস্টার ও তালিকা থেকে স্থায়ীভাবে রিমুভ করা হয়েছে।`
                  : `'${deleteNotification.busName}' has been removed from the fleet roster.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteNotification(null)}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Action Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/25 border-2 border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base">{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Action Error Notification Banner */}
      {actionErrorMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold text-sm">{actionErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {language === 'bn' ? 'ফ্লিট গভর্ন্যান্স ও বাস রোস্টার' : 'Fleet Governance'}
            </span>
            <Badge variant="primary" className="font-mono font-bold">
              {buses.length} {language === 'bn' ? 'টি বাস নিবন্ধিত' : 'Registered Buses'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.allBuses}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {language === 'bn'
              ? 'সকল ফিজিক্যাল কোচ, টিকিট বিক্রি পরবর্তী বাস কোম্পানি নির্ধারণ, সম্পূর্ণ শিডিউল, হোটেল প্যাকেজ ও সিট লেআউট নিয়ন্ত্রণ করুন।'
              : 'Manage physical coaches, post-booking vendor assignments, complete schedules, hotel packages, and layouts.'}
          </p>
        </div>

        {/* Action Controls: Primary Create Bus Button First & Sleek Management Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href="/buses/create">
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t.createBus}</span>
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setIsCompanyManagerOpen(true)}
            className="px-4 py-3 rounded-2xl text-sm font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'bn' ? 'কোম্পানি' : 'Companies'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUniManagerOpen(true)}
            className="px-4 py-3 rounded-2xl text-sm font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'bn' ? 'বিশ্ববিদ্যালয়' : 'Universities'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Governance Top Metrics Dashboard (সম্পূর্ণ ডার্ক ও লাইট মোড অ্যাডাপ্টিভ, স্ক্রল ছাড়াই বাসের বিবরণ ও সরাসরি ফিল্টার) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <BusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {language === 'bn' ? '📊 ফ্লিট গভর্ন্যান্স ও সামগ্রিক ওভারভিউ' : '📊 Fleet Governance & Fleet Overview'}
                </h3>
                <Badge variant="primary" className="font-mono text-xs font-bold">
                  {fleetMetrics.totalSeats} {language === 'bn' ? 'মোট সিট' : 'Total Seats'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'সক্রিয়, সার্ভিসিং ও নিষ্ক্রিয় বাস বহর, বিশ্ববিদ্যালয় কেন্দ্র ও ভেন্ডর অ্যাসাইনমেন্ট একনজরে নিয়ন্ত্রণ করুন।'
                  : 'Monitor active fleet, maintenance status, university allocations, and vendor assignments at a glance.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(selectedStatus !== 'ALL' || selectedGender !== 'ALL' || selectedUniversity !== 'ALL' || searchFilter !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedGender('ALL');
                  setSelectedUniversity('ALL');
                  setSelectedCluster('ALL');
                  setSearchFilter('');
                  setUniSearchQuery('');
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. Metric KPI Cards Row (Active, Inactive, Gender, Hotel, Vendors) - Large, Spacious & Prominent */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {/* Total Fleet */}
          <div
            onClick={() => { setSelectedStatus('ALL'); setSelectedGender('ALL'); setSelectedHotelFilter('ALL'); setSelectedUniversity('ALL'); }}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedStatus === 'ALL' && selectedGender === 'ALL' && selectedHotelFilter === 'ALL' && selectedUniversity === 'ALL'
                ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-4 ring-blue-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-black flex items-center gap-1.5">
                <BusIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'bn' ? 'সর্বমোট বাস' : 'Total Fleet'}</span>
              </span>
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-lg">
                ১০০%
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.total}</span>
              <span className="text-sm font-bold text-slate-500 font-sans">{language === 'bn' ? 'টি বাস' : 'Buses'}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400">
              💺 {fleetMetrics.totalSeats} {language === 'bn' ? 'মোট সিট' : 'Total Seats'}
            </div>
          </div>

          {/* ACTIVE Fleet (সক্রিয় বাস) */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedStatus === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-black flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{language === 'bn' ? 'সক্রিয় বাস বহর' : 'Active Fleet'}</span>
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.activeCount}</span>
              <span className="text-sm font-bold text-emerald-700/70 dark:text-emerald-300 font-sans">{language === 'bn' ? 'টি প্রস্তুত' : 'Ready'}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ {language === 'bn' ? 'বুকিং ও রুট চালু' : 'Live on Routes'}
            </div>
          </div>

          {/* MAINTENANCE Fleet (রক্ষণাবেক্ষণ) */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedStatus === 'MAINTENANCE'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-500 ring-4 ring-amber-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-black flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>{language === 'bn' ? 'সার্ভিসিং / গ্যারেজ' : 'Maintenance'}</span>
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.maintenanceCount}</span>
              <span className="text-sm font-bold text-amber-700/70 dark:text-amber-300 font-sans">{language === 'bn' ? 'টি গ্যারেজ' : 'In Garage'}</span>
            </div>
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-300">
              ⚙️ {language === 'bn' ? 'রক্ষণাবেক্ষণাধীন' : 'Under Servicing'}
            </div>
          </div>

          {/* INACTIVE Fleet (স্থগিত / রিজার্ভ) */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedStatus === 'INACTIVE'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 dark:border-rose-500 ring-4 ring-rose-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 font-black flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>{language === 'bn' ? 'স্থগিত / নিষ্ক্রিয়' : 'Inactive'}</span>
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.inactiveCount}</span>
              <span className="text-sm font-bold text-rose-700/70 dark:text-rose-300 font-sans">{language === 'bn' ? 'টি বাস' : 'Buses'}</span>
            </div>
            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/50 text-xs font-bold text-rose-700 dark:text-rose-300">
              🔴 {language === 'bn' ? 'সাময়িক স্থগিত' : 'Temporarily Paused'}
            </div>
          </div>

          {/* Female Special */}
          <div
            onClick={() => setSelectedGender(selectedGender === 'FEMALE' ? 'ALL' : 'FEMALE')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedGender === 'FEMALE'
                ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-500 dark:border-pink-500 ring-4 ring-pink-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-pink-50/50 dark:hover:bg-pink-950/30 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-pink-800 dark:text-pink-300 font-black block">
                👩 {language === 'bn' ? 'ছাত্রী স্পেশাল বাস' : 'Female Special'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-pink-600 dark:text-pink-400 font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.femaleCount}</span>
              <span className="text-sm font-bold text-pink-700/70 dark:text-pink-300 font-sans">{language === 'bn' ? 'টি সংরক্ষিত' : 'Reserved'}</span>
            </div>
            <div className="pt-2 border-t border-pink-200/60 dark:border-pink-800/50 text-xs font-bold text-pink-700 dark:text-pink-300">
              🌸 {language === 'bn' ? 'শুধু নারী শিক্ষার্থী' : 'Female Only Seats'}
            </div>
          </div>

          {/* Hotel Tour Package */}
          <div
            onClick={() => setSelectedHotelFilter(selectedHotelFilter === 'HOTEL_ONLY' ? 'ALL' : 'HOTEL_ONLY')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-2 ${
              selectedHotelFilter === 'HOTEL_ONLY'
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 dark:border-purple-500 ring-4 ring-purple-400/20 shadow-md'
                : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-purple-800 dark:text-purple-300 font-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{language === 'bn' ? 'হোটেল প্যাকেজ' : 'Hotel Packages'}</span>
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono flex items-baseline justify-between pt-1">
              <span>{fleetMetrics.hotelCount}</span>
              <span className="text-sm font-bold text-purple-700/70 dark:text-purple-300 font-sans">{language === 'bn' ? 'টি বাস' : 'Buses'}</span>
            </div>
            <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/50 text-xs font-bold text-purple-700 dark:text-purple-300">
              🏨 {language === 'bn' ? 'আবাসন সহ ট্যুর' : 'Stay Included'}
            </div>
          </div>
        </div>

        {/* 2. Smart University Fleet Allocation Matrix - Large, Spacious Cards */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {language === 'bn' ? '🎓 বিশ্ববিদ্যালয় ও ভর্তি কেন্দ্রভিত্তিক বাস বরাদ্দ' : '🎓 University Fleet Allocation Matrix'}
                  </h4>
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {fleetMetrics.activeAllocations.length} {language === 'bn' ? 'টি কেন্দ্রে বাস বরাদ্দ' : 'Universities Assigned'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'কোন বিশ্ববিদ্যালয়ের জন্য কয়টি বাস তৈরি করা হয়েছে তা দেখুন এবং যে কোনো কার্ডে ক্লিক করে সরাসরি ফিল্টার করুন।'
                    : 'Real-time breakdown of buses created per university. Click any card to filter immediately.'}
                </p>
              </div>
            </div>

            {/* View Mode Switcher & Add University Button */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap self-start lg:self-auto">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setUniMatrixViewMode('ACTIVE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    uniMatrixViewMode === 'ACTIVE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'bn' ? `🟢 বরাদ্দকৃত কেন্দ্র (${fleetMetrics.activeAllocations.length})` : `🟢 Assigned (${fleetMetrics.activeAllocations.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setUniMatrixViewMode('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    uniMatrixViewMode === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'bn' ? `🌐 সকল বিশ্ববিদ্যালয় (${uniList.length})` : `🌐 All Centers (${uniList.length})`}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsUniManagerOpen(true)}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bn' ? 'নতুন বিশ্ববিদ্যালয়' : 'Add University'}</span>
              </button>
            </div>
          </div>

          {/* Search and Cluster Filters for Matrix when viewing all */}
          {uniMatrixViewMode === 'ALL' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={uniSearchQuery}
                  onChange={(e) => setUniSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম বা কোড (RU, DU, KUET...) দিয়ে খুঁজুন...' : 'Search university by name or code...'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', labelBn: 'সকল গুচ্ছ', labelEn: 'All Clusters' },
                  { id: 'GENERAL', labelBn: '🏛️ সাধারণ', labelEn: '🏛️ General' },
                  { id: 'ENGG', labelBn: '⚙️ ইঞ্জিনিয়ারিং', labelEn: '⚙️ Engineering' },
                  { id: 'AGRI', labelBn: '🌾 কৃষি গুচ্ছ', labelEn: '🌾 Agriculture' },
                  { id: 'MED', labelBn: '🩺 মেডিকেল', labelEn: '🩺 Medical' },
                  { id: 'SPECIAL', labelBn: '✨ বিশেষ', labelEn: '✨ Special' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCluster(c.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      selectedCluster === c.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'bn' ? c.labelBn : c.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proportional University Allocation Progress Bar */}
          {buses.length > 0 && fleetMetrics.activeAllocations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner border border-slate-200/60 dark:border-slate-700/60">
                {fleetMetrics.activeAllocations.map((alloc, idx) => {
                  const pct = Math.max(4, Math.round((alloc.count / buses.length) * 100));
                  const colors = [
                    'bg-blue-600',
                    'bg-emerald-500',
                    'bg-indigo-600',
                    'bg-purple-600',
                    'bg-pink-500',
                    'bg-amber-500',
                    'bg-teal-500',
                    'bg-cyan-500'
                  ];
                  const col = colors[idx % colors.length];
                  return (
                    <div
                      key={alloc.id}
                      style={{ width: `${pct}%` }}
                      className={`${col} h-full transition-all cursor-pointer hover:opacity-85`}
                      title={`${alloc.label}: ${alloc.count}টি বাস (${Math.round((alloc.count / buses.length) * 100)}%)`}
                      onClick={() => setSelectedUniversity(selectedUniversity === alloc.id ? 'ALL' : alloc.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Filter Notification Banner if a University is Selected */}
          {selectedUniversity !== 'ALL' && (
            <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-950/70 border-2 border-blue-400 dark:border-blue-700 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 text-sm font-bold text-blue-900 dark:text-blue-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                <span>
                  {language === 'bn' ? 'বিশ্ববিদ্যালয় ফিল্টার সক্রিয়:' : 'Active University Filter:'}{' '}
                  <span className="font-black text-base underline text-blue-700 dark:text-blue-300">
                    {uniList.find(u => u.id === selectedUniversity)?.nameBn || selectedUniversity}
                  </span>{' '}
                  ({fleetMetrics.uniMap[selectedUniversity]?.count || 0} {language === 'bn' ? 'টি বাস বরাদ্দকৃত' : 'Buses Allocated'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUniversity('ALL')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <X className="w-4 h-4" />
                <span>{language === 'bn' ? 'সকল বাস দেখুন' : 'View All Buses'}</span>
              </button>
            </div>
          )}

          {/* Dynamic University Allocation Cards Grid (Spacious, Large & Clear) */}
          {(() => {
            const listToRender = uniMatrixViewMode === 'ACTIVE'
              ? fleetMetrics.activeAllocations
              : uniList
                  .filter(u => {
                    const matchesCluster = selectedCluster === 'ALL' || u.cluster === selectedCluster;
                    const matchesQuery = !uniSearchQuery || u.nameBn.toLowerCase().includes(uniSearchQuery.toLowerCase()) || u.id.toLowerCase().includes(uniSearchQuery.toLowerCase()) || (u.nameEn && u.nameEn.toLowerCase().includes(uniSearchQuery.toLowerCase()));
                    return matchesCluster && matchesQuery;
                  })
                  .map(u => {
                    const info = fleetMetrics.uniMap[u.id] || { count: 0, active: 0, maintenance: 0, seats: 0 };
                    return {
                      id: u.id,
                      label: u.nameBn,
                      count: info.count,
                      active: info.active,
                      maintenance: info.maintenance,
                      seats: info.seats,
                      cluster: u.cluster,
                      isCustom: u.isCustom
                    };
                  });

            if (listToRender.length === 0) {
              return (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-500">
                    {language === 'bn' ? 'কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।' : 'No universities match your search.'}
                  </p>
                  <Button variant="primary" size="md" onClick={() => { setUniSearchQuery(''); setSelectedCluster('ALL'); }}>
                    {language === 'bn' ? 'সার্চ রিসেট করুন' : 'Reset Search'}
                  </Button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1">
                {listToRender.map((alloc) => {
                  const isSelected = selectedUniversity === alloc.id;
                  const hasBuses = alloc.count > 0;
                  const pct = buses.length > 0 ? Math.round((alloc.count / buses.length) * 100) : 0;
                  return (
                    <div
                      key={alloc.id}
                      onClick={() => setSelectedUniversity(isSelected ? 'ALL' : alloc.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative overflow-hidden group hover:scale-[1.01] ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-500 ring-2 ring-blue-400/30 shadow-md'
                          : hasBuses
                          ? 'bg-slate-50/80 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:border-blue-300 shadow-2xs'
                          : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1 truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono text-[10.5px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs ${
                              hasBuses ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {alloc.id}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {alloc.label.split(' (')[0]}
                            </span>
                            {alloc.isCustom && <span className="text-amber-500 text-[10px]" title="Custom">⭐</span>}
                          </div>
                        </div>
                        {hasBuses && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                            {pct}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl sm:text-3xl font-black font-mono ${hasBuses ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {alloc.count}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {language === 'bn' ? 'টি বাস' : 'Buses'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {alloc.seats} {language === 'bn' ? 'সিট' : 'Seats'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] font-semibold pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 text-slate-500 dark:text-slate-400">
                        {hasBuses ? (
                          <>
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{alloc.active} {language === 'bn' ? 'সক্রিয়' : 'Ready'}</span>
                            </span>
                            {alloc.maintenance > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {alloc.maintenance} {language === 'bn' ? 'গ্যারেজ' : 'Garage'}
                              </span>
                            )}
                            <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline">
                              {isSelected ? (language === 'bn' ? '✓ ফিল্টার' : '✓ Active') : (language === 'bn' ? 'ফিল্টার ➔' : 'Filter ➔')}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full text-slate-400 text-[10px]">
                            <span>{language === 'bn' ? 'বাস তৈরি নেই' : 'No Buses'}</span>
                            <Link href="/buses/create" className="text-blue-600 hover:underline font-bold" onClick={(e) => e.stopPropagation()}>
                              {language === 'bn' ? '+ বাস তৈরি' : '+ Create'}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. Comprehensive Filters (Search + Date Filter + Status + Gender) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={language === 'bn' ? 'বাসের নাম, নম্বর (বাস-০১), কোম্পানি, রুট বা নোট দিয়ে খুঁজুন...' : 'Filter buses by name, number, company, route or notes...'}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full lg:w-64 text-xs font-bold px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {universityList.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {language === 'bn' ? uni.labelBn : uni.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 self-end lg:self-auto text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'bn' ? 'প্রতি পেজে:' : 'Per Page:'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value={12}>১২ {language === 'bn' ? 'টি' : ''}</option>
              <option value={24}>২৪ {language === 'bn' ? 'টি' : ''}</option>
              <option value={48}>৪৮ {language === 'bn' ? 'টি' : ''}</option>
              <option value={9999}>{language === 'bn' ? 'সবগুলো' : 'All'}</option>
            </select>
          </div>
        </div>

        {/* 📅 PROMINENT 3-WAY DATE FILTER (যাত্রার তারিখ | বুকিং শুরু | বুকিং সমাপ্তি) */}
        <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/50 rounded-2xl border border-blue-200 dark:border-blue-900/70 space-y-2.5 text-xs">
          {/* Top Row: Date Mode Selector Tabs & Custom Input */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5 shrink-0 mr-1">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'bn' ? 'তারিখ ফিল্টার টাইপ:' : 'Date Filter Type:'}</span>
              </span>

              {/* 3 Date Filter Type Mode Buttons */}
              {[
                { id: 'JOURNEY', labelBn: '🚀 যাত্রার তারিখ (Journey Date)', labelEn: '🚀 Journey Date' },
                { id: 'BOOKING_START', labelBn: '🟢 বুকিং শুরু (Booking Start)', labelEn: '🟢 Booking Opens' },
                { id: 'BOOKING_END', labelBn: '🔴 বুকিং সমাপ্তি (Booking End)', labelEn: '🔴 Booking Closes' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setDateFilterType(m.id as any);
                    setSelectedDateValue('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    dateFilterType === m.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {language === 'bn' ? m.labelBn : m.labelEn}
                </button>
              ))}
            </div>

            {/* Custom Date Input Picker */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold hidden sm:inline">
                {language === 'bn' ? 'কাস্টম তারিখ:' : 'Custom Date:'}
              </span>
              <input
                type="date"
                value={selectedDateValue === 'ALL' ? '' : selectedDateValue}
                onChange={(e) => setSelectedDateValue(e.target.value || 'ALL')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              />
              {selectedDateValue !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedDateValue('ALL')}
                  className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 hover:bg-rose-200 transition-colors"
                  title={language === 'bn' ? 'তারিখ ফিল্টার রিসেট করুন' : 'Clear Date Filter'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Dynamic Date Pills based on selected Type */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {/* All Dates Pill */}
            <button
              type="button"
              onClick={() => setSelectedDateValue('ALL')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedDateValue === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? `সকল তারিখ (${buses.length}টি বাস)` : `All Dates (${buses.length} Buses)`}
            </button>

            {/* Dynamic Dates Pills */}
            {availableDatesForType.map(({ date, count }) => {
              const isSelected = selectedDateValue === date;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDateValue(isSelected ? 'ALL' : date)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-900/60 hover:border-blue-400'
                  }`}
                >
                  <span>📅 {date}</span>
                  <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>
                    {count} {language === 'bn' ? 'টি' : ''}
                  </span>
                </button>
              );
            })}

            {availableDatesForType.length === 0 && (
              <span className="text-slate-500 italic text-[11px]">
                {language === 'bn' ? 'এই ক্যাটাগরিতে কোনো নির্ধারিত তারিখ পাওয়া যায়নি' : 'No schedules found for this category'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Filter Pill Tabs (Hotel Package, Status, Gender, Company & Capacity) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Row 1: Hotel & Tour Package + Status & Gender */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* 1. Hotel Tour Package Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-black text-purple-700 dark:text-purple-300 mr-1 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>{language === 'bn' ? 'আবাসন / প্যাকেজ:' : 'Tour Package:'}</span>
              </span>
              {[
                { id: 'ALL', label: language === 'bn' ? 'সকল প্যাকেজ' : 'All Packages', count: buses.length },
                { id: 'HOTEL_ONLY', label: language === 'bn' ? '🏨 হোটেল সহ বাস' : '🏨 Hotel Included', count: fleetMetrics.hotelCount },
                { id: 'BUS_ONLY', label: language === 'bn' ? '🚌 শুধু বাস সার্ভিস' : '🚌 Bus Only', count: fleetMetrics.busOnlyCount }
              ].map((hp) => {
                const isSelected = selectedHotelFilter === hp.id;
                return (
                  <button
                    key={hp.id}
                    type="button"
                    onClick={() => setSelectedHotelFilter(hp.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/40'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100'
                    }`}
                  >
                    <span>{hp.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10.5px] font-bold ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
                    }`}>
                      {hp.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* 2. Operational Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-0.5">{language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                {[
                  { id: 'ALL', label: language === 'bn' ? 'সকল' : 'All' },
                  { id: 'ACTIVE', label: language === 'bn' ? '🟢 সক্রিয়' : '🟢 Active' },
                  { id: 'MAINTENANCE', label: language === 'bn' ? '🟡 সার্ভিসিং' : '🟡 Maintenance' },
                  { id: 'INACTIVE', label: language === 'bn' ? '🔴 স্থগিত' : '🔴 Inactive' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatus(st.id)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs ${
                      selectedStatus === st.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* 3. Gender Policy Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-0.5">{language === 'bn' ? 'জেন্ডার:' : 'Gender:'}</span>
                {['ALL', 'FEMALE', 'MALE', 'MIXED'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedGender(type)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs ${
                      selectedGender === type
                        ? type === 'FEMALE' ? 'bg-pink-600 text-white shadow-2xs' : type === 'MALE' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'ALL'
                      ? language === 'bn' ? 'সকল' : 'All'
                      : type === 'FEMALE'
                      ? language === 'bn' ? '👩 ছাত্রী' : 'Female'
                      : type === 'MALE'
                      ? language === 'bn' ? '👨 ছাত্র' : 'Male'
                      : language === 'bn' ? '👥 মিক্সড' : 'Mixed'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Transport Company & Seat Capacity Dropdowns (User Requested) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 1. 🏢 Transport Company Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[220px]">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                    {language === 'bn' ? 'পরিবহন কোম্পানি (অপারেটর)' : 'Company / Operator'}
                  </label>
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer truncate mt-0.5"
                  >
                    <option value="ALL">🏢 {language === 'bn' ? `সকল কোম্পানি (${buses.length}টি বাস)` : `All Companies (${buses.length})`}</option>
                    {distinctCompanies.map(({ name, count }) => (
                      <option key={name} value={name}>
                        {name} {count > 0 ? `(${count}টি বাস)` : '(০টি বাস)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. 💺 Seat Capacity Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[180px]">
                <Armchair className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                    {language === 'bn' ? 'সিট ধারণক্ষমতা' : 'Seat Capacity'}
                  </label>
                  <select
                    value={selectedCapacityFilter}
                    onChange={(e) => setSelectedCapacityFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer truncate mt-0.5 font-mono"
                  >
                    <option value="ALL">💺 {language === 'bn' ? `সকল ধারণক্ষমতা (${buses.length}টি)` : `All Capacities (${buses.length})`}</option>
                    {distinctCapacities.map(({ capacity, count }) => (
                      <option key={capacity} value={String(capacity)}>
                        {capacity} সিট {count > 0 ? `(${count}টি বাস)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reset All Filters Button */}
            {(searchFilter || selectedStatus !== 'ALL' || selectedGender !== 'ALL' || selectedHotelFilter !== 'ALL' || selectedUniversity !== 'ALL' || selectedCompanyFilter !== 'ALL' || selectedCapacityFilter !== 'ALL' || selectedDateValue !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchFilter('');
                  setSelectedStatus('ALL');
                  setSelectedGender('ALL');
                  setSelectedHotelFilter('ALL');
                  setSelectedUniversity('ALL');
                  setSelectedCompanyFilter('ALL');
                  setSelectedCapacityFilter('ALL');
                  setSelectedDateValue('ALL');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Showing Results Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          {language === 'bn'
            ? `ফিল্টারকৃত ফলাফল: মোট ${filteredBuses.length} টি বাসের মধ্যে ${paginatedBuses.length} টি দেখানো হচ্ছে`
            : `Showing ${paginatedBuses.length} of ${filteredBuses.length} matching buses`}
        </span>
        {filteredBuses.length === 0 && (
          <span className="text-rose-600 dark:text-rose-400 font-bold">
            {language === 'bn' ? 'কোনো বাস পাওয়া যায়নি! ফিল্টার পরিবর্তন করুন।' : 'No buses match your filter criteria.'}
          </span>
        )}
      </div>

      {/* 4. Bus Fleet Cards Grid with Scalable Pagination */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {paginatedBuses.map((bus) => {
          const hotelInfo = getHotelInfo(bus.notes);
          const scheduleInfo = getScheduleInfo(bus.notes, bus);
          const routeInfo = getRouteInfo(bus.notes);
          const fareInfo = getFareInfo(bus.notes);
          const busUni = getBusUniversity(bus);
          const isPendingCompany = !bus.operator || bus.operator.includes('Pending') || bus.operator.includes('পরে নির্ধারণ');
          const busStatus = (bus.status || 'ACTIVE').toUpperCase();
          const isFemale = bus.busType === 'FEMALE';
          const isMale = bus.busType === 'MALE';

          return (
            <Card
              key={bus.id}
              className={`h-full hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group rounded-3xl overflow-hidden border-2 ${
                hotelInfo
                  ? 'border-purple-400 dark:border-purple-600 bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/30 shadow-lg shadow-purple-500/15 hover:border-purple-500 ring-2 ring-purple-300/40 dark:ring-purple-700/40'
                  : isFemale
                  ? 'border-pink-300 dark:border-pink-800/80 bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 dark:from-pink-950/30 dark:via-slate-900 dark:to-pink-950/10 shadow-sm shadow-pink-500/10 hover:border-pink-500'
                  : isMale
                  ? 'border-blue-300 dark:border-blue-800/80 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/10 shadow-sm shadow-blue-500/10 hover:border-blue-500'
                  : 'border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-sm shadow-emerald-500/10 hover:border-emerald-500'
              }`}
            >
              {/* Card Container Header */}
              <div className={`p-5 pb-3.5 border-b space-y-3 ${
                hotelInfo
                  ? 'border-purple-200 dark:border-purple-800/60'
                  : 'border-slate-100 dark:border-slate-800/80'
              }`}>
                {/* Top Row: Bus Code, Prominent Journey Date, Hotel Tag, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-sm font-black px-3 py-1 rounded-xl border shadow-2xs ${
                      hotelInfo
                        ? 'text-purple-950 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/90 border-purple-300 dark:border-purple-700'
                        : isFemale
                        ? 'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/80 border-pink-200 dark:border-pink-800'
                        : isMale
                        ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800'
                        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      🚌 {bus.busNumber}
                    </span>

                    {/* PROMINENT JOURNEY DATE BADGE */}
                    <span className={`font-mono text-sm font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                      hotelInfo
                        ? 'text-purple-950 dark:text-purple-100 bg-purple-50/80 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
                        : isFemale
                        ? 'text-pink-950 dark:text-pink-100 bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800'
                        : isMale
                        ? 'text-blue-950 dark:text-blue-100 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                        : 'text-emerald-950 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <Calendar className={`w-4 h-4 ${hotelInfo ? 'text-purple-600 dark:text-purple-400' : isFemale ? 'text-pink-600' : isMale ? 'text-blue-600' : 'text-emerald-600'}`} />
                      <span>{scheduleInfo.departureDate}</span>
                    </span>

                    {/* Prominent VIP Hotel Indicator Pill */}
                    {hotelInfo && (
                      <span className="text-xs font-black bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border border-purple-400/60 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/25 ring-1 ring-purple-300/40 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'bn' ? '🏨 হোটেল স্পেশাল প্যাকেজ' : 'Hotel Special'}</span>
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={busStatus === 'ACTIVE' ? 'success' : busStatus === 'MAINTENANCE' ? 'warning' : 'default'}
                    className="text-xs px-3 py-1 font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      busStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : busStatus === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span>
                      {busStatus === 'ACTIVE'
                        ? (language === 'bn' ? 'সক্রিয়' : 'ACTIVE')
                        : busStatus === 'MAINTENANCE'
                        ? (language === 'bn' ? 'সার্ভিসিং' : 'MAINTENANCE')
                        : (language === 'bn' ? 'স্থগিত' : 'INACTIVE')}
                    </span>
                  </Badge>
                </div>

                {/* Title & Gender Badge */}
                <div className="flex items-start justify-between gap-2 min-h-[40px]">
                  <h3 className={`text-lg sm:text-xl font-black text-slate-900 dark:text-white transition-colors leading-snug line-clamp-2 ${
                    hotelInfo
                      ? 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
                      : isFemale
                      ? 'group-hover:text-pink-600'
                      : isMale
                      ? 'group-hover:text-blue-600'
                      : 'group-hover:text-emerald-600'
                  }`}>
                    {bus.busName}
                  </h3>
                  <span className={`text-xs font-black px-3 py-1 rounded-xl shadow-2xs whitespace-nowrap shrink-0 text-white ${
                    isFemale
                      ? 'bg-pink-600 shadow-pink-500/20'
                      : isMale
                      ? 'bg-blue-600 shadow-blue-500/20'
                      : 'bg-emerald-600 shadow-emerald-500/20'
                  }`}>
                    {isFemale
                      ? (language === 'bn' ? '👩 শুধু ছাত্রী' : 'Female Only')
                      : isMale
                      ? (language === 'bn' ? '👨 শুধু ছাত্র' : 'Male Only')
                      : (language === 'bn' ? '👥 মিক্সড বাস' : 'Mixed')}
                  </span>
                </div>

                {/* University & Route Strip */}
                <div className={`p-3 rounded-2xl border space-y-1.5 ${
                  hotelInfo
                    ? 'bg-purple-100/70 dark:bg-purple-950/60 border-purple-200/90 dark:border-purple-800/80'
                    : isFemale
                    ? 'bg-pink-50/70 dark:bg-pink-950/40 border-pink-200/80 dark:border-pink-900/50'
                    : isMale
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/50'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50'
                }`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-black flex items-center gap-2 truncate ${
                      hotelInfo
                        ? 'text-purple-950 dark:text-purple-100'
                        : isFemale
                        ? 'text-pink-950 dark:text-pink-100'
                        : isMale
                        ? 'text-blue-950 dark:text-blue-100'
                        : 'text-emerald-950 dark:text-emerald-100'
                    }`}>
                      <GraduationCap className={`w-4 h-4 shrink-0 ${hotelInfo ? 'text-purple-600 dark:text-purple-400' : isFemale ? 'text-pink-600' : isMale ? 'text-blue-600' : 'text-emerald-600'}`} />
                      <span className="truncate">{busUni?.nameBn || bus.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কোচ'}</span>
                    </span>
                    {busUni?.isCustom && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md shrink-0">
                        কাস্টম
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-bold truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">
                      {routeInfo
                        ? `${routeInfo.origin} ➔ ${routeInfo.destination}`
                        : bus.routeDestination || 'ঢাকা ➔ বিশ্ববিদ্যালয় কেন্দ্র'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Body Details (Timings, Specs, Hotel/Route notes) */}
              <div className="p-5 pt-3.5 space-y-3.5 flex-1 flex flex-col justify-between text-sm">
                <div className="space-y-3">
                  {/* Clean Timings & Schedule Box */}
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    hotelInfo
                      ? 'bg-purple-50/50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800/60'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60'
                  }`}>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">{language === 'bn' ? '🚀 ছাড়ার সময়:' : 'Departure:'}</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono text-sm sm:text-base">{scheduleInfo.departureTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">{language === 'bn' ? '⏱️ রিপোর্টিং:' : 'Reporting:'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">{scheduleInfo.reportingTime}</span>
                      </div>
                    </div>

                    {/* Booking Window & Arrival */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span>🎟️ বুকিং: {scheduleInfo.bookingOpens} হতে {scheduleInfo.bookingCloses}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">🏁 {scheduleInfo.estArrival}</span>
                    </div>
                  </div>

                  {/* 1. Dedicated Transport Company / Vendor Strip */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                    isPendingCompany
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isPendingCompany ? 'bg-amber-100 dark:bg-amber-900/60' : 'bg-emerald-100 dark:bg-emerald-900/60'
                      }`}>
                        <Building2 className={`w-4 h-4 ${
                          isPendingCompany ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                          {language === 'bn' ? 'পরিবহন কোম্পানি:' : 'Bus Operator Company:'}
                        </span>
                        <span className={`font-black text-xs sm:text-sm block truncate mt-0.5 ${
                          isPendingCompany ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'
                        }`}>
                          {bus.operator || bus.operator_name || bus.company || 'পরে নির্ধারণ করা হবে'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignCompany(bus)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer hover:scale-105 transition-all"
                      title={language === 'bn' ? 'কোম্পানি পরিবর্তন / নির্ধারণ করুন' : 'Assign / Change Company'}
                    >
                      <Edit2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>{isPendingCompany ? (language === 'bn' ? 'নির্ধারণ' : 'Assign') : (language === 'bn' ? 'পরিবর্তন' : 'Change')}</span>
                    </button>
                  </div>

                  {/* 2. Specs Row (Capacity, Fare) */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    {/* Seats */}
                    <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                      hotelInfo
                        ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60'
                    }`}>
                      <span className="text-xs text-slate-500 font-bold block">{language === 'bn' ? 'সিট সংখ্যা' : 'Seats'}</span>
                      <span className={`font-mono font-black text-sm sm:text-base block mt-0.5 ${
                        hotelInfo
                          ? 'text-purple-700 dark:text-purple-300'
                          : isFemale
                          ? 'text-pink-600 dark:text-pink-400'
                          : isMale
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {bus.capacity} টি
                      </span>
                    </div>

                    {/* Fare */}
                    <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                      hotelInfo
                        ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60'
                    }`}>
                      <span className="text-xs text-slate-500 font-bold block">{language === 'bn' ? 'ভাড়া / প্যাকেজ' : 'Fare'}</span>
                      <span className={`font-black text-xs sm:text-sm truncate block mt-0.5 ${
                        hotelInfo ? 'text-purple-700 dark:text-purple-300' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {fareInfo || (hotelInfo ? 'প্যাকেজ' : 'স্ট্যান্ডার্ড')}
                      </span>
                    </div>
                  </div>

                  {/* Feature Tag: Hotel info if hotel package, or Direct Journey for standard */}
                  <div className="p-2.5 rounded-2xl text-xs min-h-[46px] flex items-center">
                    {hotelInfo ? (
                      <div className="w-full bg-gradient-to-r from-purple-100/90 via-indigo-50 to-purple-100/90 dark:from-purple-950/80 dark:via-indigo-950/60 dark:to-purple-950/80 p-3 rounded-2xl border-2 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-xs">
                        <span className="font-black text-xs mb-0.5 flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>🏨 অন্তর্ভুক্ত হোটেল ও আবাসন সুবিধা:</span>
                        </span>
                        <p className="line-clamp-2 text-xs leading-snug font-bold text-purple-950 dark:text-purple-100">{hotelInfo}</p>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/40 text-slate-600 dark:text-slate-300">
                        <span className="font-black block text-xs mb-0.5">🚌 বাস সার্ভিস:</span>
                        <p className="line-clamp-1 text-xs leading-tight font-medium">{bus.notes || 'সরাসরি বিশ্ববিদ্যালয়ের জন্য ডেডিকেটেড এক্সক্লুসিভ কোচ'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Action Buttons - WITH DIRECT ONE-CLICK TICKET ISSUE CTA */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {/* Primary Direct Issue Ticket Button */}
                  <Link
                    href={`/bookings/new?tripId=${bus.id}`}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4 text-white" />
                    <span>{language === 'bn' ? '🎟️ সরাসরি টিকিট ইস্যু করুন (ধাপ ১-৫)' : '🎟️ Direct Issue Ticket'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Secondary Actions Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignCompany(bus)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title={language === 'bn' ? 'কোম্পানি নির্ধারণ' : 'Assign Vendor'}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'কোম্পানি' : 'Vendor'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(bus)}
                        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                        title={t.editBus}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBus(bus)}
                        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                        title={t.deleteBus}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* View Seats Link */}
                    <Link
                      href={`/buses/${bus.id}`}
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'সিট ম্যাপ' : 'Seat Map'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5. Scalable Pagination Controls Bar */}
      {filteredBuses.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {language === 'bn'
              ? `মোট ${filteredBuses.length} টির মধ্যে ${(currentPage - 1) * pageSize + 1} হতে ${Math.min(currentPage * pageSize, filteredBuses.length)} নম্বর বাস দেখানো হচ্ছে`
              : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredBuses.length)} of ${filteredBuses.length} buses`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                currentPage === 1
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                currentPage === totalPages
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white cursor-pointer'
              }`}
            >
              <span>{language === 'bn' ? 'পরবর্তী' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN BUS COMPANY MODAL */}
      {assigningCompanyBus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                  <BusIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'bn' ? 'বাস কোম্পানি (অপারেটর) নির্ধারণ' : 'Assign Transport Operator'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {assigningCompanyBus.busName} ({assigningCompanyBus.busNumber})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAssigningCompanyBus(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignCompany} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'কোম্পানির নাম নির্বাচন করুন:' : 'Select Company Vendor:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCompanyManagerOpen(true)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{language === 'bn' ? '⚙️ কোম্পানি ম্যানেজ' : 'Manage'}</span>
                  </button>
                </div>
                <select
                  value={vendorCompanyInput}
                  onChange={(e) => setVendorCompanyInput(e.target.value)}
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {companyList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="পরে নির্ধারণ করা হবে (Pending Vendor Allocation)">
                    {language === 'bn' ? '⏳ পরে নির্ধারণ করা হবে (পেন্ডিং রাখুন)' : 'Pending Allocation'}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setAssigningCompanyBus(null)}>
                  {t.cancel}
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isAssigningCompany} className="font-bold px-5">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'কোম্পানি সংরক্ষণ করুন' : 'Save Operator'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUS MODAL */}
      {editingBus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.editBus}</h3>
              </div>
              <button
                onClick={() => setEditingBus(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={language === 'bn' ? 'বাসের নাম' : 'Bus Name'}
                  value={editingBus.busName}
                  onChange={(e) => setEditingBus({ ...editingBus, busName: e.target.value })}
                  required
                />
                <Input
                  label={language === 'bn' ? 'বাস নম্বর / কোড' : 'Bus Code / Number'}
                  value={editingBus.busNumber}
                  onChange={(e) => setEditingBus({ ...editingBus, busNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'বাস কোম্পানি (অপারেটর)' : 'Bus Operator Company'}
                </label>
                <Input
                  value={editingBus.operator || ''}
                  onChange={(e) => setEditingBus({ ...editingBus, operator: e.target.value })}
                  placeholder="e.g. দেশ ট্রাভেলস / পরে নির্ধারণ করা হবে"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`${language === 'bn' ? 'BRTA রেজিস্ট্রেশন নম্বর' : 'BRTA Registration No'} (${t.optional})`}
                  value={editingBus.regNumber || ''}
                  onChange={(e) => setEditingBus({ ...editingBus, regNumber: e.target.value })}
                  placeholder={language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
                />
                <Input
                  label={language === 'bn' ? 'সিট ধারণক্ষমতা' : 'Seating Capacity'}
                  type="number"
                  value={editingBus.capacity}
                  onChange={(e) => setEditingBus({ ...editingBus, capacity: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'লিঙ্গ নীতি (Gender Policy)' : 'Gender Policy'}
                  </label>
                  <select
                    value={editingBus.busType}
                    onChange={(e) => setEditingBus({ ...editingBus, busType: e.target.value })}
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
                    value={editingBus.status}
                    onChange={(e) => setEditingBus({ ...editingBus, status: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">{language === 'bn' ? '🟢 সক্রিয় (Active)' : 'Active'}</option>
                    <option value="INACTIVE">{language === 'bn' ? '🔴 স্থগিত (Inactive)' : 'Inactive'}</option>
                    <option value="MAINTENANCE">{language === 'bn' ? '🟡 সার্ভিসিং (Maintenance)' : 'Maintenance'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'সিট লেআউট নির্ধারণ' : 'Bind Seat Layout'}
                </label>
                <select
                  value={editingBus.seatLayoutId}
                  onChange={(e) => setEditingBus({ ...editingBus, seatLayoutId: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">{language === 'bn' ? 'ডিফল্ট লেআউট' : 'Default Layout'}</option>
                  {layouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.totalSeats} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'bn' ? 'রুট, হোটেল প্যাকেজ ও অন্যান্য তথ্য' : 'Route, Hotel Package & Notes'}
                </label>
                <textarea
                  value={editingBus.notes}
                  onChange={(e) => setEditingBus({ ...editingBus, notes: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="md" type="button" onClick={() => setEditingBus(null)}>
                  {t.cancel}
                </Button>
                <Button variant="primary" size="md" type="submit" isLoading={isUpdating} className="font-bold">
                  <Save className="w-4 h-4 mr-1.5" />
                  {t.saveChanges}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.deleteBus}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{deletingBus.busNumber} • {deletingBus.busName}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {t.confirmDelete}
            </p>
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-100 dark:border-rose-900">
              {t.deleteWarning}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setDeletingBus(null)}>
                {t.cancel}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t.deleteBus}
              </Button>
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
          if (!updated.includes(vendorCompanyInput) && updated.length > 0) {
            setVendorCompanyInput(updated[0]);
          }
        }}
        language={language}
      />

      {/* Dynamic University & Exam Center Manager Modal */}
      <UniversityManagerModal
        isOpen={isUniManagerOpen}
        onClose={() => setIsUniManagerOpen(false)}
        universities={uniList}
        onUpdateUniversities={(updated) => {
          setUniList(updated);
        }}
        onSelectUniversity={(uni) => {
          setSelectedUniversity(uni.id);
        }}
        language={language}
      />
    </div>
  );
}
