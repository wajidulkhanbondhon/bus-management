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
  ChevronUp,
  Users,
  SlidersHorizontal,
  ChevronDown,
  Ticket,
  RotateCcw,
  Armchair,
  Copy,
  Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createBusAction, updateBusAction, deleteBusAction, purgeBusAction } from '@/actions/bus.actions';
import { getFleetNextBusNumber, getCategoryScopedNextBusNumber } from './bus-create-form';
import { extractUniqueCode } from '@/services/bus.service';
import { UniversalDeleteModal } from '@/components/common/universal-delete-modal';
import { BusSeatMapModal } from './bus-seat-map-modal';
import { useApp } from '@/lib/context';
import { DEFAULT_COMPANIES, getStoredCompanies } from '@/lib/company-storage';
import { CompanyManagerModal } from './company-manager-modal';
import { UniversityItem, DEFAULT_UNIVERSITIES, getStoredUniversities } from '@/lib/university-storage';
import { UniversityManagerModal } from './university-manager-modal';

// Clean any accidental company prefixes from bus title
export function cleanBusTitle(name?: string): string {
  if (!name) return '';
  return name
    .replace(/^(?:দেশ\s*ট্রাভেলস(?:\s*\([^)]*\))?|শ্যামলী(?:\s*এন\.?আর)?(?:\s*ট্রাভেলস)?(?:\s*\([^)]*\))?|হানিফ(?:\s*এন্টারপ্রাইজ)?(?:\s*\([^)]*\))?|গ্রিন\s*লাইন(?:\s*পরিবহন)?(?:\s*\([^)]*\))?|একতা(?:\s*পরিবহন)?(?:\s*\([^)]*\))?|সেন্টমার্টিন(?:\s*ট্রাভেলস)?(?:\s*\([^)]*\))?|রিল্যাক্স(?:\s*পরিবহন)?(?:\s*\([^)]*\))?|বাবলু(?:\s*এন্টারপ্রাইজ)?(?:\s*\([^)]*\))?|Central\s*Transport(?:\s*Office)?|Desh\s*Travels|Shyamoli|Hanif|Green\s*Line)\s*[-:—–|/]\s*/i, '')
    .trim() || name;
}

interface BusListViewProps {
  buses: any[];
  layouts: any[];
}

export function BusListView({ buses: initialBuses, layouts }: BusListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useApp();
  const [mounted, setMounted] = useState(false);
  const [buses, setBuses] = useState(initialBuses);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // ALL, ACTIVE, MAINTENANCE, INACTIVE
  const [selectedGender, setSelectedGender] = useState<string>('ALL'); // ALL, MIXED, FEMALE, MALE
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<'ALL' | 'HOTEL_ONLY' | 'BUS_ONLY'>('ALL'); // ALL, HOTEL_ONLY, BUS_ONLY
  const [selectedUniversity, setSelectedUniversity] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'JOURNEY' | 'BOOKING_START' | 'BOOKING_END'>('JOURNEY');
  const [selectedDateValue, setSelectedDateValue] = useState<string>('ALL'); // ALL or YYYY-MM-DD
  const [uniMatrixViewMode, setUniMatrixViewMode] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL'); // ALL, GENERAL, ENGG, AGRI, MED, SCIENCE_TECH, SPECIAL
  const [uniSearchQuery, setUniSearchQuery] = useState<string>('');
  const [isUniExpanded, setIsUniExpanded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Dynamic Universities State
  const [uniList, setUniList] = useState<UniversityItem[]>(DEFAULT_UNIVERSITIES);
  const [isUniManagerOpen, setIsUniManagerOpen] = useState<boolean>(false);

  // Dynamic Companies List State
  const [companyList, setCompanyList] = useState<string[]>(DEFAULT_COMPANIES);
  const [isCompanyManagerOpen, setIsCompanyManagerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCompanyList(getStoredCompanies());
    setUniList(getStoredUniversities());
  }, []);

  useEffect(() => {
    setBuses(initialBuses);
  }, [initialBuses]);

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

  // Seat Map Modal State
  const [viewingSeatMapBus, setViewingSeatMapBus] = useState<any | null>(null);

  // Delete Modal & Notification State
  const [deletingBus, setDeletingBus] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState<{ busName: string; busNumber: string; isPermanent?: boolean } | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // 1-Click Status Toggle Handler (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (bus: any) => {
    const currentStatus = (bus.status || 'ACTIVE').toUpperCase();
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsTogglingStatus(bus.id);

    // Optimistic UI state update
    setBuses((prev: any[]) => prev.map(b => b.id === bus.id ? { ...b, status: nextStatus } : b));

    try {
      const res = await updateBusAction(bus.id, {
        status: nextStatus as any
      });
      if (res.success) {
        setActionSuccessMsg(
          language === 'bn'
            ? `বাস '${bus.busNumber || bus.busName}' এর স্ট্যাটাস '${nextStatus === 'ACTIVE' ? 'সক্রিয় (Active)' : 'স্থগিত / নিষ্ক্রিয় (Inactive)'}' করা হয়েছে!`
            : `Bus '${bus.busNumber || bus.busName}' status updated to ${nextStatus}!`
        );
        setTimeout(() => setActionSuccessMsg(null), 3500);
      } else {
        // Rollback on failure
        setBuses((prev: any[]) => prev.map(b => b.id === bus.id ? { ...b, status: currentStatus } : b));
        setActionErrorMsg(res.error || 'Failed to update status');
        setTimeout(() => setActionErrorMsg(null), 3500);
      }
    } catch (err: any) {
      // Rollback on error
      setBuses((prev: any[]) => prev.map(b => b.id === bus.id ? { ...b, status: currentStatus } : b));
      setActionErrorMsg(err.message || 'Error updating status');
      setTimeout(() => setActionErrorMsg(null), 3500);
    } finally {
      setIsTogglingStatus(null);
    }
  };

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
  const getRouteInfo = (notes?: string, bus?: any) => {
    if (notes && notes.includes('ROUTE:')) {
      const match = notes.match(/\[📍 ROUTE:\s*([^\]]+)\]/);
      if (match) {
        const parts = match[1].split('➔').map(s => s.trim());
        return {
          origin: parts[0] || 'ঢাকা (উৎস)',
          destination: parts[1] || bus?.targetUniversity || 'বিশ্ববিদ্যালয় ক্যাম্পাস',
          raw: match[1]
        };
      }
    }
    const origin = bus?.routeOrigin || bus?.route_origin || 'ঢাকা (উৎস)';
    const destination = bus?.routeDestination || bus?.route_destination || bus?.targetUniversity || bus?.target_university || 'বিশ্ববিদ্যালয় ক্যাম্পাস';
    return {
      origin,
      destination,
      raw: `${origin} ➔ ${destination}`
    };
  };

  // Helper to calculate current booking window status (hydration-safe)
  const getBookingWindowStatus = (bookingOpens?: string, bookingCloses?: string) => {
    if (!bookingOpens || !bookingCloses) {
      return { status: 'OPEN', labelBn: 'বুকিং সক্রিয়', labelEn: 'Booking Open', variant: 'success' };
    }
    // During SSR or initial hydration before mount, return consistent static state
    if (!mounted) {
      return { status: 'OPEN', labelBn: 'বুকিং চলছে', labelEn: 'Booking Open', variant: 'success' };
    }
    try {
      const now = new Date();
      const openDate = new Date(bookingOpens.split(' ')[0]);
      const closeDate = new Date(bookingCloses.split(' ')[0]);
      closeDate.setHours(23, 59, 59, 999);

      if (now < openDate) {
        return { status: 'UPCOMING', labelBn: 'শীঘ্রই শুরু', labelEn: 'Upcoming', variant: 'warning' };
      }
      if (now > closeDate) {
        return { status: 'CLOSED', labelBn: 'বুকিং সমাপ্ত', labelEn: 'Closed', variant: 'default' };
      }
      return { status: 'OPEN', labelBn: 'বুকিং চলছে', labelEn: 'Booking Open', variant: 'success' };
    } catch {
      return { status: 'OPEN', labelBn: 'বুকিং চলছে', labelEn: 'Booking Open', variant: 'success' };
    }
  };

  // Helper to extract pricing info
  const getFareInfo = (notes?: string) => {
    if (!notes || !notes.includes('FARE:')) return null;
    const match = notes.match(/\[💰 FARE:\s*([^\]]+)\]/);
    if (match) return match[1];
    return null;
  };

  // Helper to extract multi-tier pricing info from layout grid or structured notes
  const getBusFareDetails = (bus: any) => {
    const distinctFares = new Set<number>();

    // 1. Check assigned seat layout
    const layout = layouts.find((l: any) => l.id === (bus.seatLayoutId || bus.seat_layout_id));
    if (layout) {
      let grid: any[][] = [];
      if (layout.layoutGrid && Array.isArray(layout.layoutGrid)) {
        grid = layout.layoutGrid;
      } else if (layout.layout_json) {
        try {
          const parsed = typeof layout.layout_json === 'string' ? JSON.parse(layout.layout_json) : layout.layout_json;
          if (parsed && parsed.layoutGrid) grid = parsed.layoutGrid;
        } catch {}
      }

      if (Array.isArray(grid)) {
        grid.forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(cell => {
              if (cell && (cell.type === 'SEAT' || cell.seatType) && cell.baseFare && Number(cell.baseFare) > 0) {
                distinctFares.add(Number(cell.baseFare));
              }
            });
          }
        });
      }
    }

    // 2. Check notes for [💰 FARE: ...] tag
    if (bus?.notes) {
      const match = bus.notes.match(/\[💰 FARE:\s*([^\]]+)\]/);
      if (match) {
        const nums = match[1].match(/\d+/g);
        if (nums) {
          nums.forEach((n: string) => distinctFares.add(Number(n)));
        }
      }
    }

    if (distinctFares.size === 0) {
      distinctFares.add(550);
    }

    const sortedFares = Array.from(distinctFares).sort((a, b) => a - b);
    const minFare = sortedFares[0];
    const maxFare = sortedFares[sortedFares.length - 1];
    const isMultiple = sortedFares.length > 1;

    const bnMin = `${minFare}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    const bnMax = `${maxFare}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);

    const displayBn = isMultiple ? `৳${bnMin} - ৳${bnMax} (মাল্টিপল ভাড়া)` : `৳${bnMin} (সিট প্রতি)`;
    const displayEn = isMultiple ? `৳${minFare} - ৳${maxFare} (Multiple Fares)` : `৳${minFare}/seat`;

    return {
      minFare,
      maxFare,
      isMultiple,
      distinctFares: sortedFares,
      displayBn,
      displayEn
    };
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

  // Helper to extract admission exam unit info
  const getExamUnitInfo = (bus?: any) => {
    if (!bus) return '';
    if (bus.examUnit || bus.exam_unit || bus.unit) {
      return String(bus.examUnit || bus.exam_unit || bus.unit).trim();
    }
    const notes = bus.notes || '';
    const match = notes.match(/UNIT:\s*([^;|\]]+)/i);
    if (match && match[1]) return match[1].trim();

    // Check attached layout from database
    const layoutId = bus.seatLayoutId || bus.seat_layout_id;
    if (layoutId && layouts && Array.isArray(layouts)) {
      const lay = layouts.find(l => l.id === layoutId);
      if (lay) {
        if (lay.unit) return String(lay.unit).trim();
        if (lay.examUnit) return String(lay.examUnit).trim();
        if (lay.layout_json) {
          try {
            const parsed = JSON.parse(lay.layout_json);
            if (parsed.unit) return String(parsed.unit).trim();
            if (parsed.examUnit) return String(parsed.examUnit).trim();
          } catch {}
        }
        const layMatch = (lay.name || '').match(/\[([A-Za-z0-9\s,()+-]+Unit[A-Za-z0-9\s,()+-]*)\]/i);
        if (layMatch) return layMatch[1].trim();
      }
    }

    // Check bus name or notes for unit patterns like "(Unit C)", "Unit-A", "ক ইউনিট", "Unit 01"
    const name = bus.busName || bus.bus_name || '';
    const nameMatch = name.match(/(?:Unit|ইউনিট)\s*[-:]?\s*([A-Za-z0-9ক-হ]+)/i) 
      || name.match(/\b([A-Za-z])\s*[-:]?\s*(?:Unit|ইউনিট)\b/i);
    if (nameMatch) {
      return `Unit ${nameMatch[1].toUpperCase()}`;
    }
    return '';
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

  // Extract all unique exam units dynamically from fleet
  const distinctUnits = useMemo(() => {
    const unitMap: Record<string, number> = {};
    buses.forEach((b: any) => {
      const u = getExamUnitInfo(b) || 'সাধারণ (All Units)';
      unitMap[u] = (unitMap[u] || 0) + 1;
    });
    return Object.entries(unitMap)
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count);
  }, [buses]);

  // Filter buses
  const filteredBuses = useMemo(() => {
    return buses.filter((bus: any) => {
      const busName = bus.busName || bus.bus_name || '';
      const busNumber = bus.busNumber || bus.bus_number || '';
      const operator = bus.operator || '';
      const regNumber = bus.regNumber || bus.reg_number || '';
      const notes = bus.notes || '';
      const uniqueCode = (bus.uniqueCode || extractUniqueCode(notes, busNumber, bus.id) || '').toLowerCase();
      const uni = getBusUniversity(bus);
      const uniName = uni ? `${uni.nameBn} ${uni.nameEn}`.toLowerCase() : '';
      const q = (searchFilter || '').toLowerCase().trim();

      const matchesSearch =
        !q ||
        busName.toLowerCase().includes(q) ||
        busNumber.toLowerCase().includes(q) ||
        uniqueCode.includes(q) ||
        uniName.includes(q) ||
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

      // Unit filter (User Requested)
      let matchesUnit = true;
      if (selectedUnitFilter !== 'ALL') {
        const detectedUnit = getExamUnitInfo(bus) || 'সাধারণ (All Units)';
        matchesUnit = detectedUnit.toLowerCase() === selectedUnitFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesGender && matchesUniversity && matchesDate && matchesHotel && matchesCompany && matchesCapacity && matchesUnit;
    });
  }, [buses, searchFilter, selectedStatus, selectedGender, selectedHotelFilter, selectedUniversity, selectedCompanyFilter, selectedCapacityFilter, selectedUnitFilter, selectedDateValue, dateFilterType, uniList]);

  // Active Filter Counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchFilter.trim()) count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedGender !== 'ALL') count++;
    if (selectedHotelFilter !== 'ALL') count++;
    if (selectedUniversity !== 'ALL') count++;
    if (selectedCompanyFilter !== 'ALL') count++;
    if (selectedCapacityFilter !== 'ALL') count++;
    if (selectedUnitFilter !== 'ALL') count++;
    if (selectedDateValue !== 'ALL') count++;
    return count;
  }, [
    searchFilter,
    selectedStatus,
    selectedGender,
    selectedHotelFilter,
    selectedUniversity,
    selectedCompanyFilter,
    selectedCapacityFilter,
    selectedUnitFilter,
    selectedDateValue
  ]);

  const handleResetFilters = () => {
    setSearchFilter('');
    setSelectedStatus('ALL');
    setSelectedGender('ALL');
    setSelectedHotelFilter('ALL');
    setSelectedUniversity('ALL');
    setSelectedCompanyFilter('ALL');
    setSelectedCapacityFilter('ALL');
    setSelectedUnitFilter('ALL');
    setSelectedDateValue('ALL');
    setSelectedCluster('ALL');
    setUniSearchQuery('');
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, selectedStatus, selectedGender, selectedHotelFilter, selectedUniversity, selectedCompanyFilter, selectedCapacityFilter, selectedUnitFilter, selectedDateValue, dateFilterType, pageSize]);

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
      notes: bus.notes || '',
      examUnit: getExamUnitInfo(bus) || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;

    const examUnit = (editingBus.examUnit || '').trim();
    let updatedNotes = editingBus.notes || '';
    if (examUnit) {
      if (updatedNotes.includes('UNIT:')) {
        updatedNotes = updatedNotes.replace(/UNIT:\s*[^;|\]]+/i, `UNIT: ${examUnit}`);
      } else {
        updatedNotes = `${updatedNotes} [📝 UNIT: ${examUnit}]`.trim();
      }
    }

    setIsUpdating(true);
    setActionErrorMsg(null);
    try {
      const originalBus = buses.find((b) => b.id === editingBus.id);
      const lockedBusNumber = originalBus?.busNumber || editingBus.busNumber;

      const res = await updateBusAction(editingBus.id, {
        busName: editingBus.busName,
        busNumber: lockedBusNumber,
        operator: editingBus.operator,
        regNumber: editingBus.regNumber,
        capacity: Number(editingBus.capacity),
        busType: editingBus.busType,
        status: editingBus.status,
        seatLayoutId: editingBus.seatLayoutId || undefined,
        notes: updatedNotes,
        examUnit: examUnit
      });

      if (res.success) {
        setBuses(buses.map((b) => (b.id === editingBus.id ? { ...b, ...editingBus, notes: updatedNotes, examUnit } : b)));
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
          busNumber: deletedNumber,
          isPermanent: false
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

  const handlePermanentDelete = async () => {
    if (!deletingBus) return;

    const targetBus = { ...deletingBus };
    setIsDeleting(true);
    setActionErrorMsg(null);
    try {
      const purgeRes = await purgeBusAction(targetBus.id);
      if (purgeRes.success) {
        setBuses((prev) => prev.filter((b) => b.id !== targetBus.id));
        const deletedName = targetBus.busName || targetBus.bus_name || 'বাস';
        const deletedNumber = targetBus.busNumber || targetBus.bus_number || '';
        setDeletingBus(null);
        setDeleteNotification({
          busName: deletedName,
          busNumber: deletedNumber,
          isPermanent: true
        });
        setTimeout(() => {
          setDeleteNotification(null);
        }, 6000);
        router.refresh();
      } else {
        setActionErrorMsg(purgeRes.error || (language === 'bn' ? 'স্থায়ীভাবে মুছতে সমস্যা হয়েছে।' : 'Failed to permanently purge bus'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || (language === 'bn' ? 'স্থায়ীভাবে মুছতে সমস্যা হয়েছে।' : 'Failed to permanently purge bus'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Bus Duplication State & Handlers
  const [duplicatingBus, setDuplicatingBus] = useState<any | null>(null);
  const [duplicateBusNumber, setDuplicateBusNumber] = useState('');
  const [duplicateBusName, setDuplicateBusName] = useState('');
  const [duplicateUniqueCode, setDuplicateUniqueCode] = useState('');
  const [duplicateBookingStartDate, setDuplicateBookingStartDate] = useState('');
  const [duplicateBookingStartTime, setDuplicateBookingStartTime] = useState('10:00 AM');
  const [duplicateBookingEndDate, setDuplicateBookingEndDate] = useState('');
  const [duplicateBookingEndTime, setDuplicateBookingEndTime] = useState('11:59 PM');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleOpenDuplicate = (bus: any) => {
    const uni = getBusUniversity(bus);
    const uniName = uni ? (uni.nameBn || uni.nameEn) : (bus.targetUniversity || '');
    const seq = getCategoryScopedNextBusNumber(buses, uniName, bus.busName || bus.bus_name);
    const sch = getScheduleInfo(bus.notes, bus);

    // Parse booking window dates and times
    const openRaw = (sch.bookingOpens || '').trim();
    const openParts = openRaw.split(' ');
    const openDate = openParts[0] || new Date().toISOString().split('T')[0];
    const openTime = openParts.slice(1).join(' ') || '10:00 AM';

    const closeRaw = (sch.bookingCloses || '').trim();
    const closeParts = closeRaw.split(' ');
    const closeDate = closeParts[0] || sch.departureDate || new Date().toISOString().split('T')[0];
    const closeTime = closeParts.slice(1).join(' ') || '11:59 PM';

    setDuplicatingBus(bus);
    setDuplicateBusNumber(seq.nextBnLabel);
    setDuplicateBusName(cleanBusTitle(bus.busName || bus.bus_name || ''));
    setDuplicateUniqueCode(seq.uniqueCode);
    setDuplicateBookingStartDate(openDate);
    setDuplicateBookingStartTime(openTime);
    setDuplicateBookingEndDate(closeDate);
    setDuplicateBookingEndTime(closeTime);
  };

  const handleConfirmDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingBus) return;
    if (!duplicateBusNumber.trim()) {
      setActionErrorMsg(language === 'bn' ? '⚠️ বাসের নম্বর আবশ্যক।' : 'Bus number is required.');
      return;
    }
    if (!duplicateBookingStartDate || !duplicateBookingEndDate) {
      setActionErrorMsg(language === 'bn' ? '⚠️ টিকিট বুকিং শুরুর ও শেষের তারিখ আবশ্যক।' : 'Booking start and end dates are required.');
      return;
    }
    if (duplicateBookingStartDate > duplicateBookingEndDate) {
      setActionErrorMsg(language === 'bn' ? '⚠️ বুকিং শুরুর তারিখ বুকিং শেষের তারিখের চেয়ে পরে হতে পারে না।' : 'Booking start date cannot be after end date.');
      return;
    }

    setIsDuplicating(true);
    setActionErrorMsg(null);
    try {
      const sch = getScheduleInfo(duplicatingBus.notes, duplicatingBus);
      let updatedNotes = duplicatingBus.notes || '';

      // Update schedule tag with the newly customized Booking Window!
      const newScheduleTag = `[📅 SCHEDULE: Departure: ${sch.departureDate} ${sch.departureTime} | Reporting: ${sch.reportingTime} | Booking Opens: ${duplicateBookingStartDate} ${duplicateBookingStartTime} | Booking Closes: ${duplicateBookingEndDate} ${duplicateBookingEndTime} | Est Arrival: ${sch.estArrival}${sch.returnJourney ? ` | Return: ${sch.returnJourney}` : ''}]`;
      if (updatedNotes.includes('[📅 SCHEDULE:')) {
        updatedNotes = updatedNotes.replace(/\[📅 SCHEDULE:[^\]]+\]/, newScheduleTag);
      } else {
        updatedNotes = `${newScheduleTag} | ${updatedNotes}`;
      }

      // Update unique system code tag in notes
      const newCodeTag = `[🏷️ CODE: ${duplicateUniqueCode}]`;
      if (updatedNotes.includes('[🏷️ CODE:')) {
        updatedNotes = updatedNotes.replace(/\[🏷️\s*CODE:[^\]]+\]/, newCodeTag);
      } else {
        updatedNotes = `${newCodeTag} | ${updatedNotes}`;
      }

      const res = await createBusAction({
        busName: duplicateBusName.trim() || cleanBusTitle(duplicatingBus.busName || duplicatingBus.bus_name || 'ভর্তি কোচ'),
        busNumber: duplicateBusNumber.trim(),
        operator: duplicatingBus.operator,
        capacity: Number(duplicatingBus.capacity) || 40,
        busType: duplicatingBus.busType || duplicatingBus.bus_type || 'MIXED',
        status: 'ACTIVE',
        notes: updatedNotes,
        seatLayoutId: duplicatingBus.seatLayoutId || duplicatingBus.seat_layout_id || undefined,
        regNumber: `DHAKA-METRO-BA-${Math.floor(1000 + Math.random() * 9000)}`
      });

      if (res.success) {
        setActionSuccessMsg(
          language === 'bn'
            ? `🎉 নতুন বাস (${duplicateBusNumber} • ${duplicateUniqueCode}) সফলভাবে ক্লোন/ডুপ্লিকেট করা হয়েছে!`
            : `Bus successfully duplicated as ${duplicateBusNumber} (${duplicateUniqueCode})!`
        );
        setDuplicatingBus(null);
        router.refresh();
      } else {
        setActionErrorMsg(res.error || 'Failed to duplicate bus');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error duplicating bus');
    } finally {
      setIsDuplicating(false);
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
        <div className={`flex items-center justify-between p-4 rounded-2xl text-white shadow-xl duration-300 border-2 animate-in fade-in slide-in-from-top-4 ${
          deleteNotification.isPermanent
            ? 'bg-rose-600 shadow-rose-600/25 border-rose-400'
            : 'bg-amber-600 shadow-amber-600/25 border-amber-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>
                  {deleteNotification.isPermanent
                    ? (language === 'bn' ? '🗑️ বাসটি স্থায়ীভাবে মুছে ফেলা হয়েছে!' : '🗑️ Bus Permanently Purged!')
                    : (language === 'bn' ? '♻️ বাসটি রিসাইকেল বিনে পাঠানো হয়েছে!' : '♻️ Bus Moved to Recycle Bin!')}
                </span>
                <Badge variant="default" className="bg-white/25 text-white font-mono text-xs uppercase">
                  {deleteNotification.busNumber}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-white/95 font-medium mt-0.5">
                {deleteNotification.isPermanent
                  ? (language === 'bn'
                    ? `'${deleteNotification.busName}' বাসটি ডাটাবেস হতে চিরতরে মুছে ফেলা হয়েছে।`
                    : `'${deleteNotification.busName}' has been permanently purged from the database.`)
                  : (language === 'bn'
                    ? `'${deleteNotification.busName}' বাসটি রিসাইকেল বিনে পাঠানো হয়েছে। প্রয়োজনে রিসাইকেল বিন পেজ থেকে এটি রিস্টোর করতে পারবেন।`
                    : `'${deleteNotification.busName}' has been moved to the Recycle Bin. You can restore it anytime.`)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!deleteNotification.isPermanent && (
              <Link
                href="/recycle-bin"
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
              >
                {language === 'bn' ? 'রিসাইকেল বিন খুলুন' : 'Open Recycle Bin'}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setDeleteNotification(null)}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
        </div>
      </div>

      {/* 2. Compact Search & Filter Control Bar (Minimal Height, Zero Screen Clutter) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={language === 'bn' ? 'বাসের নাম, নম্বর (বাস-০১), কোম্পানি, রুট বা নোট দিয়ে খুঁজুন...' : 'Filter buses by name, number, company, route or notes...'}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions: Filter Toggle Button + Reset + View Mode */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end">
            {/* Primary Filter Toggle Button (User Requested: minimizes by default, opens on click) */}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                isFilterPanelOpen || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{language === 'bn' ? 'ফিল্টার অপশন' : 'Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black">
                  {activeFilterCount}
                </span>
              )}
              {isFilterPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Reset All Filters Button (visible when filters active) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 flex items-center gap-1.5 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-2xs"
                title={language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            )}

            {/* View Switcher: Card View vs Table View */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('CARD')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'CARD'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'bn' ? 'কার্ড ভিউ' : 'Card View'}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
              >
                <SlidersHorizontal className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary Sub-Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {language === 'bn'
                ? `মোট ${buses.length} টি বাসের মধ্যে ${filteredBuses.length} টি পাওয়া গেছে (দেখানো হচ্ছে ${paginatedBuses.length} টি)`
                : `Showing ${paginatedBuses.length} of ${filteredBuses.length} buses (Total: ${buses.length})`}
            </span>
            {activeFilterCount > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                • {language === 'bn' ? `${activeFilterCount}টি ফিল্টার সক্রিয়` : `${activeFilterCount} filters active`}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isFilterPanelOpen ? (
              <>
                <span>{language === 'bn' ? 'ফিল্টার লুকান' : 'Hide Filters'}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>{language === 'bn' ? 'ফিল্টার অপশন দেখুন' : 'Show Filter Options'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Collapsible Filter Drawer (User requested: only shows when filter button is clicked) */}
      {isFilterPanelOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Detailed Filters Box */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border-2 border-blue-200/80 dark:border-blue-900/60 shadow-lg shadow-blue-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? '🎯 ফ্লিট ফিল্টারিং ও স্পেসিফিকেশন প্যানেল' : '🎯 Fleet Filtering & Specification Panel'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{language === 'bn' ? 'সব মুছুন' : 'Clear All'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'bn' ? 'লুকান' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Filter Strip */}
            <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {language === 'bn' ? 'তারিখ ভিত্তিক ফিল্টার:' : 'Date Filter:'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold self-start sm:self-auto">
                  {[
                    { type: 'JOURNEY', labelBn: '🚌 যাত্রার তারিখ', labelEn: '🚌 Trip Date' },
                    { type: 'BOOKING_START', labelBn: '🟢 বুকিং শুরু', labelEn: '🟢 Booking Open' },
                    { type: 'BOOKING_END', labelBn: '🔴 বুকিং শেষ', labelEn: '🔴 Booking Close' }
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => { setDateFilterType(t.type as any); setSelectedDateValue('ALL'); }}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        dateFilterType === t.type
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'bn' ? t.labelBn : t.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal Date Picker Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDateValue('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    selectedDateValue === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {language === 'bn' ? 'সকল তারিখ' : 'All Dates'}
                </button>
                {availableDatesForType.map(({ date, count }) => {
                  const isSelected = selectedDateValue === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDateValue(isSelected ? 'ALL' : date)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>📅 {date}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Status, Policy & Hotel Filter Chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {language === 'bn' ? 'বাসের স্ট্যাটাস' : 'Bus Status'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', labelBn: 'সব', labelEn: 'All' },
                    { id: 'ACTIVE', labelBn: 'সক্রিয়', labelEn: 'Active' },
                    { id: 'MAINTENANCE', labelBn: 'সার্ভিসিং', labelEn: 'Maintenance' },
                    { id: 'INACTIVE', labelBn: 'স্থগিত', labelEn: 'Inactive' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStatus(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === st.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'bn' ? st.labelBn : st.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender / Policy Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {language === 'bn' ? 'যাত্রী পলিসি / জেন্ডার' : 'Passenger Policy'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', labelBn: 'সব', labelEn: 'All' },
                    { id: 'MIXED', labelBn: '👥 মিক্সড', labelEn: 'Mixed' },
                    { id: 'FEMALE', labelBn: '👩 ছাত্রী', labelEn: 'Female' },
                    { id: 'MALE', labelBn: '👨 ছাত্র', labelEn: 'Male' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGender(g.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedGender === g.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'bn' ? g.labelBn : g.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotel Tour Package Filter Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {language === 'bn' ? 'হোটেল ট্যুর প্যাকেজ' : 'Hotel Tour Package'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', labelBn: 'সব', labelEn: 'All' },
                    { id: 'HOTEL_ONLY', labelBn: '🏨 হোটেল সহ', labelEn: 'Hotel Only' },
                    { id: 'BUS_ONLY', labelBn: '🚌 শুধু বাস', labelEn: 'Bus Only' }
                  ].map((hp) => (
                    <button
                      key={hp.id}
                      type="button"
                      onClick={() => setSelectedHotelFilter(hp.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedHotelFilter === hp.id
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'bn' ? hp.labelBn : hp.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dropdowns Row: University, Company, Admission Unit, Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-800">
              {/* Target University Dropdown */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  🏛️ {language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয়:' : 'Target University:'}
                </span>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs truncate"
                >
                  {universityList.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {language === 'bn' ? uni.labelBn : uni.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor / Operator Dropdown */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  🏢 {language === 'bn' ? 'কোম্পানি / অপারেটর:' : 'Company / Operator:'}
                </span>
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="ALL">🏢 {language === 'bn' ? 'সকল কোম্পানি' : 'All Companies'}</option>
                  <option value="PENDING">⏳ {language === 'bn' ? 'অপেক্ষমাণ (কোম্পানি ছাড়া)' : 'Pending Vendor'}</option>
                  {companyList.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Exam Unit Dropdown */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  🎯 {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট:' : 'Exam Unit:'}
                </span>
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="ALL">📝 {language === 'bn' ? `সকল ইউনিট (${buses.length}টি বাস)` : `All Units (${buses.length})`}</option>
                  {distinctUnits.map(({ unit, count }) => (
                    <option key={unit} value={unit}>
                      {unit} ({count}টি বাস)
                    </option>
                  ))}
                </select>
              </div>

              {/* Seat Capacity Dropdown */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  💺 {language === 'bn' ? 'সিট ক্যাপাসিটি:' : 'Seat Capacity:'}
                </span>
                <select
                  value={selectedCapacityFilter}
                  onChange={(e) => setSelectedCapacityFilter(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">💺 {language === 'bn' ? 'সকল ক্যাপাসিটি' : 'All Capacities'}</option>
                  {distinctCapacities.map(({ capacity, count }) => (
                    <option key={capacity} value={String(capacity)}>
                      {capacity} {language === 'bn' ? 'সিট' : 'Seats'} ({count}টি বাস)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* University Fleet Allocation Matrix Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'bn' ? '🎓 বিশ্ববিদ্যালয় কেন্দ্রভিত্তিক বাস বরাদ্দ ও ম্যাট্রিক্স' : '🎓 University Allocation Matrix'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'bn' ? 'যে কোনো বিশ্ববিদ্যালয়ে ক্লিক করে ওই কেন্দ্রের বাসের তালিকা ফিল্টার করুন।' : 'Click any university to filter buses for that exam center.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setUniMatrixViewMode('ACTIVE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      uniMatrixViewMode === 'ACTIVE'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'bn' ? `🟢 বরাদ্দকৃত (${fleetMetrics.activeAllocations.length})` : `🟢 Assigned (${fleetMetrics.activeAllocations.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUniMatrixViewMode('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      uniMatrixViewMode === 'ALL'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'bn' ? `🌐 সকল (${uniList.length})` : `🌐 All (${uniList.length})`}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUniManagerOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'নতুন বিশ্ববিদ্যালয়' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* University Cards Grid */}
            {(() => {
              const listToRender = (uniMatrixViewMode === 'ACTIVE'
                ? fleetMetrics.activeAllocations.map((a: any) => ({
                    id: a.id,
                    nameBn: a.label,
                    shortCode: a.id,
                    count: a.count,
                    seats: a.seats,
                    active: a.active,
                    maintenance: a.maintenance
                  }))
                : uniList
                    .filter((u: any) => {
                      const matchesSearch = !uniSearchQuery.trim() || 
                        u.nameBn.toLowerCase().includes(uniSearchQuery.toLowerCase()) || 
                        u.id.toLowerCase().includes(uniSearchQuery.toLowerCase());
                      const matchesCluster = selectedCluster === 'ALL' || u.cluster === selectedCluster;
                      return matchesSearch && matchesCluster;
                    })
                    .map((u: any) => {
                      const info = fleetMetrics.uniMap[u.id] || { count: 0, seats: 0, active: 0, maintenance: 0 };
                      return {
                        id: u.id,
                        nameBn: u.nameBn,
                        shortCode: u.id,
                        count: info.count,
                        seats: info.seats,
                        active: info.active,
                        maintenance: info.maintenance
                      };
                    })
              );

              if (listToRender.length === 0) {
                return (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-500">
                      {language === 'bn' ? 'কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।' : 'No universities match your search.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 max-h-64 overflow-y-auto pr-1">
                  {listToRender.map((alloc) => {
                    const isSelected = selectedUniversity === alloc.id;
                    const hasBuses = alloc.count > 0;
                    return (
                      <div
                        key={alloc.id}
                        onClick={() => setSelectedUniversity(isSelected ? 'ALL' : alloc.id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-2 ring-blue-400/20 shadow-sm'
                            : hasBuses
                            ? 'bg-slate-50/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {alloc.shortCode}
                          </span>
                          <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                            {alloc.count} {language === 'bn' ? 'বাস' : 'Buses'}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={alloc.nameBn}>
                          {alloc.nameBn}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 mt-1 border-t border-slate-200 dark:border-slate-800 font-semibold">
                          <span>{alloc.seats} সিট</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {isSelected ? '✓ সক্রিয়' : 'ফিল্টার ➔'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Bottom Drawer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'সকল ফিল্টার মুছুন' : 'Reset All Filters'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
                <span>{language === 'bn' ? 'ফিল্টার সংকুচিত করুন' : 'Minimize Filters'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bus Fleet Display: Card Grid OR Table View */}
      {viewMode === 'CARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {paginatedBuses.map((bus) => {
            const hotelInfo = getHotelInfo(bus.notes);
            const scheduleInfo = getScheduleInfo(bus.notes, bus);
            const routeInfo = getRouteInfo(bus.notes, bus);
            const fareInfo = getFareInfo(bus.notes);
            const fareDetails = getBusFareDetails(bus);
            const busUni = getBusUniversity(bus);
            const examUnitInfo = getExamUnitInfo(bus);
            const rawOp = bus.operator || '';
            const isPendingCompany = !rawOp || rawOp === 'Central Transport Office' || rawOp.includes('Pending') || rawOp.includes('পরে নির্ধারণ');
            const busStatus = (bus.status || 'ACTIVE').toUpperCase();
            const isFemale = bus.busType === 'FEMALE';
            const isMale = bus.busType === 'MALE';
            const bookingWindow = getBookingWindowStatus(scheduleInfo.bookingOpens, scheduleInfo.bookingCloses);

            return (
              <Card
                key={bus.id}
                className={`h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group rounded-3xl overflow-hidden border-2 bg-white dark:bg-slate-900 shadow-sm ${
                  hotelInfo
                    ? 'border-purple-200 dark:border-purple-800/70 shadow-purple-500/5'
                    : isFemale
                    ? 'border-pink-200 dark:border-pink-800/70 shadow-pink-500/5'
                    : isMale
                    ? 'border-blue-200 dark:border-blue-800/70 shadow-blue-500/5'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* ═══════════════════════════════════════════════════════ */}
                {/* 1. TOP HERO BANNER: TARGET UNIVERSITY & ADMISSION UNIT */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className={`p-4 sm:p-5 pb-4 border-b transition-colors ${
                  hotelInfo
                    ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60'
                    : isFemale
                    ? 'bg-pink-50/70 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/60'
                    : isMale
                    ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60'
                    : 'bg-slate-50/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-800'
                }`}>
                  {/* Top row: University Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয়:' : 'Target University:'}</span>
                        </span>
                        {busUni?.isCustom && (
                          <span className="text-[9.5px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                            কাস্টম
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug break-words" title={busUni?.nameBn || bus.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কোচ'}>
                        {busUni?.nameBn || bus.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কোচ'}
                      </h3>
                    </div>

                    {/* Status & Gender Badges */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        suppressHydrationWarning
                        variant={busStatus === 'ACTIVE' ? 'success' : busStatus === 'MAINTENANCE' ? 'warning' : 'default'}
                        className="text-[11px] px-2.5 py-0.5 font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
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

                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs whitespace-nowrap">
                        {isFemale
                          ? (language === 'bn' ? '👩 শুধু ছাত্রী' : 'Female')
                          : isMale
                          ? (language === 'bn' ? '👨 শুধু ছাত্র' : 'Male')
                          : (language === 'bn' ? '👥 মিক্সড' : 'Mixed')}
                      </span>
                    </div>
                  </div>

                  {/* High-Contrast Admission Exam Unit Badge */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">🎯</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট' : 'Admission Exam Unit'}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-black text-blue-700 dark:text-blue-400 break-words block leading-snug">
                          {examUnitInfo || (language === 'bn' ? 'সাধারণ (সকল ইউনিট)' : 'General (All Units)')}
                        </span>
                      </div>
                    </div>
                    {hotelInfo && (
                      <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-xl border border-purple-200 dark:border-purple-800 shrink-0 flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-purple-600 dark:text-amber-300" />
                        <span>হোটেল সহ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 2. BUS IDENTITY & ROUTE FLOW STRIP                      */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="p-4 sm:p-5 py-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-2xs">
                          🚌 {bus.busNumber}
                        </span>
                        <span className="font-mono text-[10.5px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs" title={language === 'bn' ? 'অ্যাকাউন্টিং ও অডিট ইউনিক কোড' : 'Unique Audit Code'}>
                          🏷️ {bus.uniqueCode || extractUniqueCode(bus.notes, bus.busNumber, bus.id)}
                        </span>
                      </div>
                      {bus.regNumber && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                          {bus.regNumber}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug break-words w-full" title={cleanBusTitle(bus.busName)}>
                      {cleanBusTitle(bus.busName)}
                    </h4>
                  </div>

                  {/* Route Flow (উৎস ➔ গন্তব্য) */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="break-words flex-1 text-slate-700 dark:text-slate-300 leading-snug">
                      <strong className="text-slate-900 dark:text-white">{routeInfo.origin}</strong>
                      <span className="mx-1.5 text-blue-600 dark:text-blue-400">➔</span>
                      <strong className="text-blue-700 dark:text-blue-300">{routeInfo.destination}</strong>
                    </span>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 3. TRIP SCHEDULE & BOOKING WINDOW                       */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="p-4 sm:p-5 py-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-3">
                    {/* Booking Window Box */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                        <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{language === 'bn' ? 'টিকিট বুকিং উইন্ডো:' : 'Booking Window:'}</span>
                        </span>
                        <Badge
                          variant={bookingWindow.variant as any}
                          className="text-[10px] font-black px-2 py-0.5"
                        >
                          {language === 'bn' ? bookingWindow.labelBn : bookingWindow.labelEn}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                        <div>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-semibold">
                            🟢 {language === 'bn' ? 'বুকিং শুরু:' : 'Booking Opens:'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {scheduleInfo.bookingOpens || '০১ সেপ্টেম্বর ২০২৬'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-semibold">
                            🔴 {language === 'bn' ? 'বুকিং শেষ:' : 'Booking Closes:'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {scheduleInfo.bookingCloses || '০৯ সেপ্টেম্বর ২০২৬'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Departure & Journey Schedule */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <span className="text-[10.5px] text-blue-800 dark:text-blue-300 font-bold block mb-0.5">
                          🚀 {language === 'bn' ? 'মূল যাত্রা (তারিখ):' : 'Journey Date:'}
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {scheduleInfo.departureDate}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <span className="text-[10.5px] text-blue-800 dark:text-blue-300 font-bold block mb-0.5">
                          ⏰ {language === 'bn' ? 'ছাড়ার সময়:' : 'Departure Time:'}
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {scheduleInfo.departureTime}
                        </span>
                      </div>
                    </div>

                    {/* Specs & Transport Company */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block">{language === 'bn' ? 'সিট সংখ্যা' : 'Seats'}</span>
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{bus.capacity} টি</span>
                        </div>
                        <Armchair className="w-4 h-4 text-slate-400" />
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                            {language === 'bn' ? 'সিট ভাড়া' : 'Fare'} {fareDetails.isMultiple ? `(${fareDetails.distinctFares.length} রেট)` : ''}
                          </span>
                          <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 truncate block" title={fareDetails.displayBn}>
                            {language === 'bn' ? fareDetails.displayBn : fareDetails.displayEn}
                          </span>
                        </div>
                        <span className="text-emerald-600 font-bold ml-1">৳</span>
                      </div>
                    </div>

                    {/* Operator / Company Section (User: Don't show dummy Central Transport Office!) */}
                    <div className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs">
                      {isPendingCompany ? (
                        <div className="w-full flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{language === 'bn' ? 'কোম্পানি: পরে বরাদ্দ হবে (অপেক্ষমাণ)' : 'Vendor: Pending Allocation'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignCompany(bus)}
                            className="text-[10.5px] font-black bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0"
                          >
                            + {language === 'bn' ? 'বরাদ্দ করুন' : 'Assign'}
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                          <span className="flex items-center gap-1.5 font-bold truncate">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{bus.operator}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignCompany(bus)}
                            className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 cursor-pointer font-bold"
                          >
                            {language === 'bn' ? 'পরিবর্তন' : 'Change'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════ */}
                  {/* 4. ACTIONS & 1-CLICK INACTIVE/ACTIVE TOGGLE BUTTON      */}
                  {/* ═══════════════════════════════════════════════════════ */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {/* Primary Direct Issue Ticket CTA */}
                    <Link
                      href={`/bookings/new?tripId=${bus.id}`}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-white" />
                      <span>{language === 'bn' ? '🎟️ সরাসরি টিকিট ইস্যু করুন' : '🎟️ Direct Issue Ticket'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {/* Secondary Actions Bar with Inactive/Active Toggle Button */}
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1-CLICK ACTIVE / INACTIVE TOGGLE BUTTON (User specifically requested!) */}
                        <button
                          type="button"
                          disabled={isTogglingStatus === bus.id}
                          onClick={() => handleToggleStatus(bus)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                            busStatus === 'ACTIVE'
                              ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          }`}
                          title={busStatus === 'ACTIVE' ? (language === 'bn' ? 'বাসটি নিষ্ক্রিয় / স্থগিত করুন' : 'Deactivate bus') : (language === 'bn' ? 'বাসটি সক্রিয় করুন' : 'Activate bus')}
                        >
                          {isTogglingStatus === bus.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : busStatus === 'ACTIVE' ? (
                            <>
                              <span>⏸️</span>
                              <span>{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                            </>
                          ) : (
                            <>
                              <span>▶️</span>
                              <span>{language === 'bn' ? 'সক্রিয় করুন' : 'Activate'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDuplicate(bus)}
                          className="p-1.5 px-2 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 text-xs font-black cursor-pointer shadow-2xs"
                          title={language === 'bn' ? 'বাসটি ক্লোন / ডুপ্লিকেট করুন' : 'Duplicate Bus'}
                        >
                          <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[10px] hidden sm:inline">{language === 'bn' ? 'ক্লোন' : 'Clone'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bus)}
                          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title={t.editBus}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingBus(bus)}
                          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title={t.deleteBus}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* View Seats Modal Button */}
                      <button
                        type="button"
                        onClick={() => setViewingSeatMapBus(bus)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        title={language === 'bn' ? 'সিট প্ল্যান দেখুন' : 'Seat Map'}
                      >
                        <Armchair className="w-3.5 h-3.5 text-white" />
                        <span>{language === 'bn' ? 'সিট ম্যাপ' : 'Seat Map'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (User Requested) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-4 px-4">{language === 'bn' ? 'বাস কোড ও নাম' : 'Bus Code & Name'}</th>
                  <th className="py-4 px-4">{language === 'bn' ? 'বিশ্ববিদ্যালয় ও ইউনিট' : 'University & Unit'}</th>
                  <th className="py-4 px-4">{language === 'bn' ? 'যাত্রার তারিখ ও সময়' : 'Departure & Schedule'}</th>
                  <th className="py-4 px-4">{language === 'bn' ? 'রুট (উৎস ➔ গন্তব্য)' : 'Route'}</th>
                  <th className="py-4 px-4">{language === 'bn' ? 'সিট ও ধরন' : 'Seats & Policy'}</th>
                  <th className="py-4 px-4">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-4 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {paginatedBuses.map((bus) => {
                  const hotelInfo = getHotelInfo(bus.notes);
                  const scheduleInfo = getScheduleInfo(bus.notes, bus);
                  const routeInfo = getRouteInfo(bus.notes, bus);
                  const fareInfo = getFareInfo(bus.notes);
                  const fareDetails = getBusFareDetails(bus);
                  const busUni = getBusUniversity(bus);
                  const examUnitInfo = getExamUnitInfo(bus);
                  const rawOp = bus.operator || '';
                  const isPendingCompany = !rawOp || rawOp === 'Central Transport Office' || rawOp.includes('Pending') || rawOp.includes('পরে নির্ধারণ');
                  const busStatus = (bus.status || 'ACTIVE').toUpperCase();
                  const isFemale = bus.busType === 'FEMALE';
                  const isMale = bus.busType === 'MALE';
                  const bookingWindow = getBookingWindowStatus(scheduleInfo.bookingOpens, scheduleInfo.bookingCloses);

                  return (
                    <tr
                      key={bus.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Bus Code & Name */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1 shrink-0">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs text-center">
                              🚌 {bus.busNumber}
                            </span>
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs text-center" title="অ্যাকাউন্টিং ও অডিট ইউনিক কোড">
                              🏷️ {bus.uniqueCode || extractUniqueCode(bus.notes, bus.busNumber, bus.id)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug break-words max-w-[280px]">
                              {cleanBusTitle(bus.busName)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {isPendingCompany ? (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                  {language === 'bn' ? 'কোম্পানি: পরে বরাদ্দ হবে' : 'Pending Vendor'}
                                </span>
                              ) : (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">
                                  {bus.operator}
                                </span>
                              )}
                              {bus.regNumber && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10.5px]">{bus.regNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* University & Exam Unit */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="leading-snug break-words max-w-[220px]">{busUni?.nameBn || bus.targetUniversity || 'ভর্তি কোচ'}</span>
                          </div>
                          <div className="pt-0.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-xl border-2 shadow-xs ${
                              examUnitInfo
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/20'
                                : 'bg-slate-700 text-slate-100 border-slate-600'
                            }`}>
                              <span className="text-amber-300">📝</span>
                              <span>{examUnitInfo ? `ইউনিট: ${examUnitInfo}` : (language === 'bn' ? 'ইউনিট: সাধারণ' : 'Unit: General')}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Departure & Booking Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{scheduleInfo.departureDate}</span>
                            <span className="text-[11px] font-normal text-slate-500">({scheduleInfo.departureTime})</span>
                          </div>
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-0.5">
                            <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span>🟢 বুকিং শুরু:</span>
                              <span className="font-mono">{scheduleInfo.bookingOpens || '০১ সেপ ২০২৬'}</span>
                            </div>
                            <div className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                              <span>🔴 বুকিং শেষ:</span>
                              <span className="font-mono">{scheduleInfo.bookingCloses || '০৯ সেপ ২০২৬'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Route & Hotel Package */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {routeInfo.origin} ➔ {routeInfo.destination}
                            </span>
                          </div>
                          {hotelInfo && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                              🏨 {hotelInfo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Capacity & Gender Policy */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            💺 {bus.capacity} {language === 'bn' ? 'সিট' : 'Seats'}
                          </div>
                          <div className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]" title={fareDetails.displayBn}>
                            💰 {language === 'bn' ? fareDetails.displayBn : fareDetails.displayEn}
                          </div>
                          <span className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                            isFemale
                              ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                              : isMale
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {isFemale
                              ? (language === 'bn' ? '👩 শুধু ছাত্রী' : 'Female')
                              : isMale
                              ? (language === 'bn' ? '👨 শুধু ছাত্র' : 'Male')
                              : (language === 'bn' ? '👥 মিক্সড' : 'Mixed')}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={busStatus === 'ACTIVE' ? 'success' : busStatus === 'MAINTENANCE' ? 'warning' : 'default'}
                          className="text-[11px] px-2.5 py-0.5 font-bold flex items-center gap-1.5 w-fit"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            busStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : busStatus === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span>
                            {busStatus === 'ACTIVE'
                              ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                              : busStatus === 'MAINTENANCE'
                              ? (language === 'bn' ? 'সার্ভিসিং' : 'Maint.')
                              : (language === 'bn' ? 'স্থগিত' : 'Inactive')}
                          </span>
                        </Badge>
                      </td>

                      {/* Actions Toolbar */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Ticket Issue CTA */}
                          <Link
                            href={`/bookings/new?tripId=${bus.id}`}
                            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                            title={language === 'bn' ? 'সরাসরি টিকিট ইস্যু করুন' : 'Direct Issue Ticket'}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </Link>

                          {/* 1-Click Status Toggle Button */}
                          <button
                            type="button"
                            disabled={isTogglingStatus === bus.id}
                            onClick={() => handleToggleStatus(bus)}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              busStatus === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:border-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700'
                            }`}
                            title={busStatus === 'ACTIVE' ? (language === 'bn' ? 'বাসটি নিষ্ক্রিয় / স্থগিত করুন' : 'Deactivate') : (language === 'bn' ? 'বাসটি সক্রিয় করুন' : 'Activate')}
                          >
                            {isTogglingStatus === bus.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : busStatus === 'ACTIVE' ? (
                              <span>⏸️</span>
                            ) : (
                              <span>▶️</span>
                            )}
                          </button>

                          {/* Seat Map Modal Button */}
                          <button
                            type="button"
                            onClick={() => setViewingSeatMapBus(bus)}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                            title={language === 'bn' ? 'সিট প্ল্যান দেখুন' : 'Seat Map'}
                          >
                            <Armchair className="w-3.5 h-3.5" />
                          </button>

                          {/* Company Assign Modal Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignCompany(bus)}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                            title={language === 'bn' ? 'কোম্পানি নির্ধারণ' : 'Assign Vendor'}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Duplicate Bus Action Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDuplicate(bus)}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                            title={language === 'bn' ? 'বাস ক্লোন / ডুপ্লিকেট করুন' : 'Duplicate Bus'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(bus)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title={t.editBus}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingBus(bus)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title={t.deleteBus}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'বাস নম্বর / কোড' : 'Bus Code / Number'}
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                      <Lock className="w-3 h-3" />
                      {language === 'bn' ? 'লক করা (অপরিবর্তনযোগ্য)' : 'Locked (Fixed)'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingBus.busNumber}
                      disabled
                      readOnly
                      title={language === 'bn' ? 'টিকিট ও সিট ম্যাপের নির্ভুলতা রক্ষার্থে বাস নম্বর পরিবর্তন লক করা রয়েছে।' : 'Bus number is locked to maintain ticketing & seat integrity.'}
                      className="w-full pl-3.5 pr-8 py-2 text-sm bg-slate-100/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold cursor-not-allowed select-all shadow-inner"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {language === 'bn' ? '🔒 টিকিট ও ট্রিপ সুরক্ষায় বাস কোড পরিবর্তন লক করা রয়েছে।' : '🔒 Bus code is locked for data integrity.'}
                  </p>
                </div>
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
                  {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট (Admission Exam Unit)' : 'Admission Exam Unit'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={['Unit A', 'Unit B', 'Unit C', 'Unit D', 'General / All Units'].includes(editingBus.examUnit) ? editingBus.examUnit : 'CUSTOM'}
                    onChange={(e) => {
                      if (e.target.value !== 'CUSTOM') {
                        setEditingBus({ ...editingBus, examUnit: e.target.value });
                      }
                    }}
                    className="w-1/2 text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Unit A">Unit A (বিজ্ঞান)</option>
                    <option value="Unit B">Unit B (মানবিক)</option>
                    <option value="Unit C">Unit C (বাণিজ্য)</option>
                    <option value="Unit D">Unit D (বিভাগ পরিবর্তন)</option>
                    <option value="General / All Units">General / All Units (সকল ইউনিট)</option>
                    <option value="CUSTOM">অন্যান্য / কাস্টম ইউনিট</option>
                  </select>
                  <Input
                    value={editingBus.examUnit || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, examUnit: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: Unit C' : 'e.g. Unit C'}
                    className="flex-1"
                  />
                </div>
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

      {/* UNIVERSAL 3-OPTION DELETE CONFIRMATION MODAL */}
      {deletingBus && (
        <UniversalDeleteModal
          isOpen={!!deletingBus}
          onClose={() => setDeletingBus(null)}
          itemTitle={`${deletingBus.busName || deletingBus.bus_name || ''} (${deletingBus.busNumber || deletingBus.bus_number || ''})`}
          itemSubtitle={`অপারেটর: ${deletingBus.operator || 'Central Transport'} • সিট: ${deletingBus.capacity} • ধরন: ${deletingBus.busType}`}
          itemCategory={language === 'bn' ? 'বাস ও ফ্লিট' : 'Buses & Fleet'}
          onMoveToRecycleBin={handleConfirmDelete}
          onPermanentDelete={handlePermanentDelete}
        />
      )}

      {/* Interactive Bus Seat Map Preview Modal */}
      <BusSeatMapModal
        isOpen={!!viewingSeatMapBus}
        onClose={() => setViewingSeatMapBus(null)}
        bus={viewingSeatMapBus}
      />

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

      {/* DUPLICATE BUS MODAL (1-Click Clone from Bus 1 to Bus 2) */}
      {duplicatingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border-2 border-indigo-200 dark:border-indigo-800/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    {language === 'bn' ? 'বাস ক্লোন / ডুপ্লিকেট করুন' : 'Duplicate / Clone Bus'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'bn' ? 'আগের বাসের সকল তথ্য হুবহু রেখে নতুন বাস তৈরি করুন' : 'Clone all route, layout, and policy settings into a new bus'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicatingBus(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Bus Info Summary */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">{language === 'bn' ? 'মূল বাস (Source):' : 'Source Bus:'}</span>
                <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                  🚌 {duplicatingBus.busNumber}
                </span>
              </div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {cleanBusTitle(duplicatingBus.busName)}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-600 dark:text-slate-300">
                <div>💺 সিট: <strong>{duplicatingBus.capacity} সিট</strong></div>
                <div>👥 ধরন: <strong>{duplicatingBus.busType}</strong></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmDuplicate} className="space-y-4">
              {/* New Bus Number (Uneditable / Locked by User Request) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'bn' ? 'নতুন বাসের নম্বর (স্বয়ংক্রিয় ও সংরক্ষিত) *' : 'New Bus Number (Auto-assigned & Locked) *'}
                  </label>
                  <span className="text-[10.5px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    🏷️ ইউনিক কোড: {duplicateUniqueCode}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    value={duplicateBusNumber}
                    readOnly
                    disabled
                    className="font-mono text-base font-black border-2 border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 cursor-not-allowed pl-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {language === 'bn'
                    ? '🔒 ডুপ্লিকেট নম্বর কনফ্লিক্ট এড়াতে ক্যাটাগরি অনুযায়ী পরবর্তী খালি নম্বরটি অপরিবর্তনীয় রাখা হয়েছে।'
                    : 'Auto-assigned and locked to prevent collision.'}
                </p>
              </div>

              {/* Ticket Booking Window Schedule (User Requested: কবে থেকে বুকিং শুরু হবে, কয়টা থেকে, এবং কবে শেষ হবে) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'bn' ? '🎟️ টিকিট বুকিং শিডিউল ও সময়সীমা' : 'Ticket Booking Schedule Window'}</span>
                  </span>
                  <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    বুকিং উইন্ডো
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Booking Opens: Date & Time */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      🟢 {language === 'bn' ? 'বুকিং শুরুর তারিখ ও সময়:' : 'Booking Opens (Date & Time):'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                          {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                        </label>
                        <Input
                          type="date"
                          value={duplicateBookingStartDate}
                          onChange={(e) => setDuplicateBookingStartDate(e.target.value)}
                          required
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                          {language === 'bn' ? 'শুরুর সময়' : 'Start Time'}
                        </label>
                        <Input
                          value={duplicateBookingStartTime}
                          onChange={(e) => setDuplicateBookingStartTime(e.target.value)}
                          placeholder="e.g. 10:00 AM"
                          required
                          className="text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Closes: Date & Time */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                    <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      🔴 {language === 'bn' ? 'বুকিং শেষের তারিখ ও সময়:' : 'Booking Closes (Date & Time):'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                          {language === 'bn' ? 'শেষের তারিখ' : 'End Date'}
                        </label>
                        <Input
                          type="date"
                          value={duplicateBookingEndDate}
                          onChange={(e) => setDuplicateBookingEndDate(e.target.value)}
                          required
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                          {language === 'bn' ? 'শেষের সময়' : 'End Time'}
                        </label>
                        <Input
                          value={duplicateBookingEndTime}
                          onChange={(e) => setDuplicateBookingEndTime(e.target.value)}
                          placeholder="e.g. 11:59 PM"
                          required
                          className="text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Booking Timeline */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-emerald-200/80 dark:border-emerald-800/60 text-[10.5px]">
                  <span className="text-slate-500 font-bold mr-1">{language === 'bn' ? 'কুইক অ্যাকশন:' : 'Quick:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setDuplicateBookingStartDate(today);
                      setDuplicateBookingStartTime('10:00 AM');
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    🟢 আজ সকাল ১০টা থেকে শুরু
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const tomorrow = d.toISOString().split('T')[0];
                      setDuplicateBookingStartDate(tomorrow);
                      setDuplicateBookingStartTime('08:00 AM');
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    ⚡ আগামীকাল সকাল ৮টা থেকে
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (duplicateBookingStartDate) {
                        const d = new Date(duplicateBookingStartDate);
                        d.setDate(d.getDate() + 3);
                        setDuplicateBookingEndDate(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    📅 ৩ দিনের উইন্ডো
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (duplicateBookingStartDate) {
                        const d = new Date(duplicateBookingStartDate);
                        d.setDate(d.getDate() + 7);
                        setDuplicateBookingEndDate(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    📅 ৭ দিনের উইন্ডো
                  </button>
                </div>
              </div>

              {/* New Bus Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'bn' ? 'নতুন বাসের নাম / টাইটেল *' : 'New Bus Title *'}
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {duplicateBusName.length}/50 অক্ষর
                  </span>
                </div>
                <Input
                  value={duplicateBusName}
                  onChange={(e) => setDuplicateBusName(e.target.value.slice(0, 50))}
                  maxLength={50}
                  placeholder="e.g. রাবি A Unit স্পেশাল (45 সিট)"
                  required
                  className="font-bold text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setDuplicatingBus(null)}
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isDuplicating}
                  className="font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  <span>{language === 'bn' ? '✨ এখনই ক্লোন সম্পন্ন করুন' : 'Confirm Clone'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
