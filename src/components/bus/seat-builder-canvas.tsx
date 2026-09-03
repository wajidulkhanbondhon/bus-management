'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Bus,
  CheckCircle,
  AlertCircle,
  Settings2,
  Layers,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Undo2,
  Sliders,
  Compass,
  Zap,
  Info,
  Palette,
  FolderOpen,
  Check,
  X,
  GraduationCap,
  LayoutGrid,
  RefreshCw,
  Search,
  Printer,
  Download,
  Copy,
  List,
  Grid,
  Bot,
  Wand2,
  Filter,
  SlidersHorizontal,
  BadgePercent,
  RotateCcw,
  Armchair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  createCustomLayoutAction,
  deleteSeatLayoutAction
} from '@/actions/bus.actions';
import { restoreRecycleItemAction } from '@/actions/recycle-bin.actions';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/ui/toast';
import { getStoredUniversities, getUniversityUnits, DEFAULT_UNIVERSITIES, UniversityItem, addStoredUniversity } from '@/lib/university-storage';

interface SeatCell {
  id?: string;
  rowIndex: number;
  colIndex: number;
  seatNumber: string;
  type: 'SEAT' | 'AISLE' | 'DOOR' | 'DRIVER' | 'EMPTY';
  genderRule: 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY';
  fareZoneId?: string;
  baseFare?: number;
  isExtra?: boolean;
}

export interface FareRangeSegment {
  id: string;
  name: string;
  startRow: string;
  endRow: string;
  fare: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
  zoneId?: string;
}

const COLOR_OPTIONS: { id: FareRangeSegment['color']; label: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }[] = [
  { id: 'emerald', label: 'Emerald Green', bgClass: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/70 dark:to-emerald-900/70', borderClass: 'border-emerald-500 dark:border-emerald-400', textClass: 'text-emerald-950 dark:text-emerald-100', dotClass: 'bg-emerald-500' },
  { id: 'blue', label: 'Royal Blue', bgClass: 'from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/70', borderClass: 'border-blue-500 dark:border-blue-400', textClass: 'text-blue-950 dark:text-blue-100', dotClass: 'bg-blue-500' },
  { id: 'purple', label: 'Indigo Purple', bgClass: 'from-purple-50 to-purple-100 dark:from-purple-950/70 dark:to-purple-900/70', borderClass: 'border-purple-500 dark:border-purple-400', textClass: 'text-purple-950 dark:text-purple-100', dotClass: 'bg-purple-500' },
  { id: 'amber', label: 'Sunset Amber', bgClass: 'from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/70', borderClass: 'border-amber-500 dark:border-amber-400', textClass: 'text-amber-950 dark:text-amber-100', dotClass: 'bg-amber-500' },
  { id: 'rose', label: 'Coral Rose', bgClass: 'from-rose-50 to-rose-100 dark:from-rose-950/70 dark:to-rose-900/70', borderClass: 'border-rose-500 dark:border-rose-400', textClass: 'text-rose-950 dark:text-rose-100', dotClass: 'bg-rose-500' },
  { id: 'cyan', label: 'Ocean Cyan', bgClass: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/70 dark:to-cyan-900/70', borderClass: 'border-cyan-500 dark:border-cyan-400', textClass: 'text-cyan-950 dark:text-cyan-100', dotClass: 'bg-cyan-500' }
];

const ROW_LETTERS = 'ABCDEFGHIJKLMN';

function buildInitial45Seats(): SeatCell[] {
  const rows = 11;
  const cols = 5;
  const newCells: SeatCell[] = [];
  for (let r = 0; r < rows; r++) {
    const rowChar = ROW_LETTERS[r] || `R${r + 1}`;
    const isLastRow = r === rows - 1;
    const defaultSegFare = r < 5 ? 650 : r < 8 ? 550 : r < 10 ? 500 : 450;

    for (let c = 0; c < cols; c++) {
      if (isLastRow) {
        newCells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: `${rowChar}${c + 1}`,
          type: 'SEAT',
          genderRule: 'ANY',
          baseFare: 450
        });
      } else if (c === 2) {
        newCells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: '',
          type: 'AISLE',
          genderRule: 'ANY'
        });
      } else {
        const seatLetter = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
        newCells.push({
          rowIndex: r,
          colIndex: c,
          seatNumber: `${rowChar}${seatLetter}`,
          type: 'SEAT',
          genderRule: 'ANY',
          baseFare: defaultSegFare
        });
      }
    }
  }
  return newCells;
}

const toBengaliNumber = (num: number | string): string => {
  return String(num).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
};

const getLayoutFareSummary = (layout: any, language: string = 'bn'): { minFare: number; maxFare: number; isFlat: boolean; formatted: string } => {
  const fares: number[] = [];

  // 1. Inspect layout_json / layoutJson
  const rawJson = layout.layout_json || layout.layoutJson;
  if (rawJson) {
    try {
      const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      if (parsed.layoutGrid && Array.isArray(parsed.layoutGrid)) {
        for (const row of parsed.layoutGrid) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (cell && (cell.type === 'SEAT' || cell.baseFare)) {
                const fare = Number(cell.baseFare);
                if (!isNaN(fare) && fare > 0) fares.push(fare);
              }
            }
          }
        }
      }
      if (parsed.extraSeats && Array.isArray(parsed.extraSeats)) {
        for (const cell of parsed.extraSeats) {
          const fare = Number(cell.baseFare);
          if (!isNaN(fare) && fare > 0) fares.push(fare);
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Inspect child seats if available
  if (fares.length === 0 && Array.isArray(layout.seats) && layout.seats.length > 0) {
    for (const s of layout.seats) {
      const fare = Number(s.base_fare ?? s.baseFare);
      if (!isNaN(fare) && fare > 0) fares.push(fare);
    }
  }

  // 3. Fallback if no explicit fares
  if (fares.length === 0) {
    return {
      minFare: 500,
      maxFare: 650,
      isFlat: false,
      formatted: language === 'bn' ? '৳৫০০ – ৳৬৫০' : '৳500 – ৳650'
    };
  }

  const minFare = Math.min(...fares);
  const maxFare = Math.max(...fares);
  const isFlat = minFare === maxFare;

  if (isFlat) {
    return {
      minFare,
      maxFare,
      isFlat: true,
      formatted: language === 'bn' ? `৳${toBengaliNumber(minFare)} ফ্ল্যাট` : `৳${minFare} Flat`
    };
  }

  return {
    minFare,
    maxFare,
    isFlat: false,
    formatted: language === 'bn'
      ? `৳${toBengaliNumber(minFare)} – ৳${toBengaliNumber(maxFare)}`
      : `৳${minFare} – ৳${maxFare}`
  };
};

const formatLayoutDate = (dateStr?: string, language: string = 'bn'): string => {
  if (!dateStr) return language === 'bn' ? 'সম্প্রতি তৈরি' : 'Recently Created';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'bn' ? 'সম্প্রতি তৈরি' : 'Recently Created';
    
    if (language === 'bn') {
      const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      const day = toBengaliNumber(d.getDate());
      const month = monthsBn[d.getMonth()];
      const year = toBengaliNumber(d.getFullYear());
      return `${day} ${month} ${year}`;
    } else {
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    return language === 'bn' ? 'সম্প্রতি তৈরি' : 'Recently Created';
  }
};

export function SeatBuilderCanvas({
  fareZones: initialFareZones,
  savedLayouts: initialSavedLayouts = []
}: {
  fareZones: any[];
  savedLayouts?: any[];
}) {
  const router = useRouter();
  const { t, language } = useApp();
  const { success: toastSuccess, error: toastError } = useToast();

  // Active View Tab: 'builder' | 'gallery'
  const [activeTab, setActiveTab] = useState<'builder' | 'gallery'>('builder');

  // Editing existing layout indicator
  const [editingExistingLayoutId, setEditingExistingLayoutId] = useState<string | null>(null);

  const [targetUniversity, setTargetUniversity] = useState('');
  const [admissionUnit, setAdmissionUnit] = useState('');
  const [unitDiscipline, setUnitDiscipline] = useState('');
  const [layoutName, setLayoutName] = useState('কাস্টম বাস সিট লেআউট - ৪৫ সিট');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [examName, setExamName] = useState('');
  
  // Capacity: 40, 45, etc.
  const [capacityInput, setCapacityInput] = useState<number>(45);
  const [totalRows, setTotalRows] = useState(11);
  const [totalCols, setTotalCols] = useState(5);
  const [cells, setCells] = useState<SeatCell[]>(buildInitial45Seats);
  const [extraSeats, setExtraSeats] = useState<SeatCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<SeatCell | null>(null);
  const [cellFormApplied, setCellFormApplied] = useState(false);

  const [fareZones, setFareZones] = useState<any[]>(initialFareZones);
  const [savedLayouts, setSavedLayouts] = useState<any[]>(initialSavedLayouts);
  const [isRefreshingGallery, setIsRefreshingGallery] = useState(false);

  // Sync savedLayouts whenever initialSavedLayouts updates via Next.js router.refresh()
  useEffect(() => {
    if (initialSavedLayouts && Array.isArray(initialSavedLayouts)) {
      setSavedLayouts(initialSavedLayouts);
    }
  }, [initialSavedLayouts]);

  const handleRefreshSavedLayouts = async () => {
    setIsRefreshingGallery(true);
    try {
      const res = await fetch('/api/backend/buses/seat-layouts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSavedLayouts(data);
          toastSuccess(language === 'bn' ? 'গ্যালারি রিফ্রেশ সম্পন্ন হয়েছে' : 'Gallery refreshed');
        }
      }
      router.refresh();
    } catch {
      toastError(language === 'bn' ? 'রিফ্রেশ করতে সমস্যা হয়েছে' : 'Failed to refresh gallery');
    } finally {
      setIsRefreshingGallery(false);
    }
  };

  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryUniFilter, setGalleryUniFilter] = useState('ALL');
  const [galleryUnitFilter, setGalleryUnitFilter] = useState('ALL');
  const [galleryCapacityFilter, setGalleryCapacityFilter] = useState<string>('ALL');
  const [gallerySortBy, setGallerySortBy] = useState<'newest' | 'seats_desc' | 'seats_asc' | 'name'>('newest');
  const [galleryViewMode, setGalleryViewMode] = useState<'grid' | 'table'>('grid');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('ALL');
  const [builderSeatFilter, setBuilderSeatFilter] = useState<'ALL' | 'VIP' | 'STANDARD' | 'REAR' | 'EXTRA'>('ALL');
  const [layoutToDelete, setLayoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState<'recycle' | 'permanent'>('recycle');
  const [isDeletingLayout, setIsDeletingLayout] = useState(false);

  // Rich delete success banner / notification with Undo & Recycle Bin link
  const [successDeleteBanner, setSuccessDeleteBanner] = useState<{
    show: boolean;
    title: string;
    message: string;
    layoutId?: string;
    layoutName?: string;
    wasSentToRecycleBin: boolean;
    deletedLayoutObj?: any;
  }>({ show: false, title: '', message: '', wasSentToRecycleBin: true });

  // Format / Name collision modal when restoring
  const [restoreConflictModal, setRestoreConflictModal] = useState<{
    show: boolean;
    layoutId: string;
    originalName: string;
    conflictingName: string;
    suggestedName: string;
    layoutObj?: any;
  }>({ show: false, layoutId: '', originalName: '', conflictingName: '', suggestedName: '' });
  const [customRestoreName, setCustomRestoreName] = useState('');
  const [isRestoringLayout, setIsRestoringLayout] = useState(false);

  // Dynamic Universities, Categories, Custom Uni & Multi-Unit State
  const [uniList, setUniList] = useState<UniversityItem[]>(DEFAULT_UNIVERSITIES);
  const [isCustomUnitMode, setIsCustomUnitMode] = useState(false);
  const [selectedUniCategory, setSelectedUniCategory] = useState<'ALL' | 'GENERAL' | 'CLUSTER' | 'ENGG_TECH' | 'MED' | 'CUSTOM'>('ALL');
  const [uniSearchFilter, setUniSearchFilter] = useState('');
  const [isAddCustomUniOpen, setIsAddCustomUniOpen] = useState(false);
  const [customUniForm, setCustomUniForm] = useState<{
    nameBn: string;
    shortCode: string;
    cluster: 'GENERAL' | 'ENGG' | 'AGRI' | 'MED' | 'SCIENCE_TECH' | 'SPECIAL' | 'OTHER';
    district: string;
    units: string;
  }>({
    nameBn: '',
    shortCode: '',
    cluster: 'GENERAL',
    district: '',
    units: 'A Unit, B Unit, C Unit'
  });
  const [singleCustomUnitInput, setSingleCustomUnitInput] = useState('');

  useEffect(() => {
    setUniList(getStoredUniversities());
  }, []);

  const filteredUniversities = useMemo(() => {
    return uniList.filter(u => {
      // 1. Search Query
      if (uniSearchFilter.trim()) {
        const query = uniSearchFilter.toLowerCase();
        const matches = u.nameBn.toLowerCase().includes(query) || 
          u.id.toLowerCase().includes(query) ||
          (u.nameEn && u.nameEn.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // 2. Category Cluster
      if (selectedUniCategory === 'ALL') return true;
      if (selectedUniCategory === 'CUSTOM') return !!u.isCustom;
      if (selectedUniCategory === 'CLUSTER') return u.id === 'GST' || u.id === 'AGRI' || u.id === 'ENGG' || u.cluster === 'AGRI' || u.nameBn.includes('গুচ্ছ');
      if (selectedUniCategory === 'GENERAL') return (u.cluster === 'GENERAL' || u.id === 'RU' || u.id === 'DU' || u.id === 'CU' || u.id === 'JU' || u.id === 'JNU' || u.id === 'IU') && !u.nameBn.includes('গুচ্ছ');
      if (selectedUniCategory === 'ENGG_TECH') return u.cluster === 'ENGG' || u.cluster === 'SCIENCE_TECH' || u.id === 'BUET' || u.id === 'SUST' || u.id === 'KUET' || u.id === 'RUET' || u.id === 'CUET' || u.id === 'JUST' || u.id === 'PUST' || u.id === 'NSTU' || u.id === 'MBSTU' || u.id === 'PSTU' || u.id === 'HSTU';
      if (selectedUniCategory === 'MED') return u.cluster === 'MED' || u.id === 'MED';
      return true;
    });
  }, [uniList, selectedUniCategory, uniSearchFilter]);

  const handleSaveCustomUniversity = () => {
    if (!customUniForm.nameBn.trim()) {
      alert(language === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম আবশ্যক' : 'University name is required');
      return;
    }
    const unitsArray = customUniForm.units
      .split(/[,+]/)
      .map(u => u.trim())
      .filter(Boolean);

    const newUniItem: UniversityItem = {
      id: customUniForm.shortCode.trim() || customUniForm.nameBn.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || `UNI_${Date.now().toString().slice(-4)}`,
      nameBn: customUniForm.nameBn.trim(),
      nameEn: customUniForm.shortCode ? `${customUniForm.nameBn.trim()} (${customUniForm.shortCode.trim().toUpperCase()})` : customUniForm.nameBn.trim(),
      cluster: customUniForm.cluster,
      district: customUniForm.district.trim(),
      isCustom: true,
      units: unitsArray.length > 0 ? unitsArray : ['A Unit', 'B Unit', 'C Unit']
    };

    const updated = addStoredUniversity(newUniItem);
    setUniList(updated);
    setTargetUniversity(newUniItem.nameBn);
    const initialUnit = newUniItem.units?.[0] || 'Unit A';
    setAdmissionUnit(initialUnit);
    autoFormatLayoutName(newUniItem.nameBn, initialUnit, unitDiscipline, capacityInput);
    setIsAddCustomUniOpen(false);
    toastSuccess(language === 'bn' ? 'কাস্টম বিশ্ববিদ্যালয় সফলভাবে যুক্ত হয়েছে!' : 'Custom university added successfully!');
  };

  const handleAddSingleCustomUnit = () => {
    if (!singleCustomUnitInput.trim()) return;
    const clean = singleCustomUnitInput.trim();
    const cleanCurrent = admissionUnit ? admissionUnit.trim() : '';
    const currentList = cleanCurrent ? cleanCurrent.split('+').map(u => u.trim()).filter(Boolean) : [];
    if (!currentList.some(u => u.toLowerCase() === clean.toLowerCase())) {
      const nextList = [...currentList, clean];
      const nextCombined = nextList.join(' + ');
      setAdmissionUnit(nextCombined);
      autoFormatLayoutName(targetUniversity, nextCombined, unitDiscipline, capacityInput);
    }
    setSingleCustomUnitInput('');
  };

  const currentUniversityUnits = useMemo(() => {
    return getUniversityUnits(targetUniversity, uniList);
  }, [targetUniversity, uniList]);

  const handleToggleUnit = (unitStr: string) => {
    const cleanCurrent = admissionUnit ? admissionUnit.trim() : '';
    const currentList = cleanCurrent ? cleanCurrent.split('+').map(u => u.trim()).filter(Boolean) : [];
    
    // Check if unitStr (or its code part e.g. "A Unit") is already in list
    const foundIdx = currentList.findIndex(u => 
      u.toLowerCase() === unitStr.toLowerCase() || 
      unitStr.toLowerCase().startsWith(u.toLowerCase()) || 
      u.toLowerCase().startsWith(unitStr.toLowerCase())
    );

    let nextList: string[];
    if (foundIdx > -1) {
      nextList = currentList.filter((_, i) => i !== foundIdx);
    } else {
      nextList = [...currentList, unitStr];
    }

    const nextCombined = nextList.join(' + ');
    setAdmissionUnit(nextCombined);
    autoFormatLayoutName(targetUniversity, nextCombined, unitDiscipline, capacityInput);
  };

  const autoFormatLayoutName = (
    uni = targetUniversity,
    unit = admissionUnit,
    disc = unitDiscipline,
    cap = capacityInput
  ) => {
    const uniSimple = (uni || 'সাধারণ বিশ্ববিদ্যালয়').split(' (')[0].trim();
    const match = uni.match(/\(([^)]+)\)/);
    const shortCode = match ? match[1] : (uniSimple.split(' ')[0] || 'কোচ');

    let unitPart = '';
    const cleanUnit = (unit || '').trim();
    if (cleanUnit && cleanUnit !== 'None' && cleanUnit !== 'সাধারণ') {
      const shortUnit = cleanUnit.split(' (')[0];
      unitPart = ` • ${shortUnit}`;
    }

    const formatted = `${uniSimple} (${shortCode})${unitPart} স্পেশাল কোচ - ${cap} সিট`;
    setLayoutName(formatted);
  };

  // AI Smart Layout Optimization Handler
  const handleApplyAIOptimization = (presetMode: 'RU' | 'DU' | 'CU' | 'GST' | 'ENGG' | 'MED' | 'AUTO' = 'AUTO') => {
    let targetUni = targetUniversity;
    let units = admissionUnit;
    let exam = examName || 'ভর্তি পরীক্ষা ২০২৫-২৬';
    let newDesc = '';
    let vipFare = 650;
    let stdFare = 550;
    let rearFare = 480;

    if (presetMode === 'RU' || (!targetUni && presetMode === 'AUTO')) {
      targetUni = 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
      units = 'Unit A (বিজ্ঞান) + Unit B (মানবিক)';
      exam = 'রাবি ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = 'রাজশাহী বিশ্ববিদ্যালয় পরীক্ষার্থী ও অভিভাবকদের জন্য ডেডিকেটেড এক্সক্লুসিভ ডে/নাইট কোচ।';
      vipFare = 650;
      stdFare = 550;
      rearFare = 500;
    } else if (presetMode === 'GST') {
      targetUni = 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)';
      units = 'A Unit (বিজ্ঞান) + B Unit (মানবিক)';
      exam = 'গুচ্ছ ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = '২৪ বিশ্ববিদ্যালয় জিএসটি গুচ্ছ ভর্তি পরীক্ষার স্পেশাল সেন্ট্রাল কোচ সার্ভিস।';
      vipFare = 620;
      stdFare = 520;
      rearFare = 460;
    } else if (presetMode === 'DU') {
      targetUni = 'ঢাকা বিশ্ববিদ্যালয় (DU)';
      units = 'ক-ইউনিট (বিজ্ঞান) + খ-ইউনিট (কলা)';
      exam = 'ঢাবি ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার এক্সপ্রেস সার্ভিস। দ্রুততম রুট ও আরামদায়ক রিক্লাইনার সিট।';
      vipFare = 700;
      stdFare = 600;
      rearFare = 520;
    } else if (presetMode === 'CU') {
      targetUni = 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)';
      units = 'A Unit + B Unit';
      exam = 'চবি ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = 'চট্টগ্রাম বিশ্ববিদ্যালয় পরীক্ষার্থীদের জন্য দূরপাল্লার স্পেশাল নাইট কোচ সার্ভিস।';
      vipFare = 800;
      stdFare = 700;
      rearFare = 600;
    } else if (presetMode === 'ENGG') {
      targetUni = 'প্রকৌশল গুচ্ছ (RUET, CUET, KUET)';
      units = 'ক ও খ বিভাগ (ইঞ্জিনিয়ারিং)';
      exam = 'ইঞ্জিনিয়ারিং গুচ্ছ ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = 'প্রকৌশল বিশ্ববিদ্যালয়ের ভর্তিচ্ছু শিক্ষার্থীদের জন্য প্রিমিয়াম আরামদায়ক আসন ব্যবস্থা।';
      vipFare = 750;
      stdFare = 650;
      rearFare = 550;
    } else if (presetMode === 'MED') {
      targetUni = 'মেডিকেল ভর্তি পরীক্ষা (MBBS & BDS)';
      units = 'MBBS (মেডিকেল) + BDS (ডেন্টাল)';
      exam = 'মেডিকেল ভর্তি পরীক্ষা ২০২৫-২৬';
      newDesc = 'মেডিকেল পরীক্ষার্থী ও অভিভাবকদের স্বস্তিদায়ক নিরাপদ যাত্রা নিশ্চিতকারী স্পেশাল কোচ।';
      vipFare = 650;
      stdFare = 550;
      rearFare = 480;
    }

    setTargetUniversity(targetUni);
    setAdmissionUnit(units);
    setExamName(exam);
    setLayoutDescription(newDesc);
    autoFormatLayoutName(targetUni, units, unitDiscipline, capacityInput);

    // AI Smart Fare Allocation (Tiered by seat rows):
    // Rows A to E -> VIP Fare
    // Rows F to H -> Standard Fare
    // Rear Rows -> Budget Fare
    // All gender rules remain ANY (open to all passengers)
    setCells(prev => prev.map(cell => {
      if (cell.type !== 'SEAT') return cell;
      const rowLettersArr = 'ABCDEFGHIJKLMN';
      const rowChar = rowLettersArr[cell.rowIndex] || 'A';
      let fare = stdFare;

      if (rowChar <= 'E') {
        fare = vipFare;
      } else if (rowChar >= 'I') {
        fare = rearFare;
      }

      return {
        ...cell,
        genderRule: cell.genderRule || 'ANY',
        baseFare: fare
      };
    }));

    // Update fare segments
    setSegments([
      { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: vipFare, color: 'emerald' },
      { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: stdFare, color: 'blue' },
      { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: rearFare, color: 'purple' },
      { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: rearFare - 30, color: 'amber' }
    ]);

    toastSuccess(
      language === 'bn' 
        ? `✨ AI অপ্টিমাইজেশন সফল হয়েছে! "${targetUni.split(' (')[0]}" এর জন্য নাম, ইউনিট ও ভাড়া স্বয়ংক্রিয়ভাবে সেট করা হয়েছে।` 
        : 'AI optimization applied successfully!'
    );
  };

  // --------------------------------------------------------------------------
  // AI Form-Filling & Beautiful Writing Assistants
  // --------------------------------------------------------------------------
  const handleAIFillSaveForm = () => {
    const uni = targetUniversity.trim() || 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
    let unit = admissionUnit.trim();
    let exam = examName.trim() || 'ভর্তি পরীক্ষা ২০২৫-২৬';
    
    // Auto-detect unit if empty
    if (!unit) {
      if (uni.includes('RU') || uni.includes('রাজশাহী')) unit = 'Unit A (বিজ্ঞান) + Unit B (মানবিক)';
      else if (uni.includes('GST') || uni.includes('গুচ্ছ')) unit = 'A Unit (বিজ্ঞান) + B Unit (মানবিক)';
      else if (uni.includes('DU') || uni.includes('ঢাকা')) unit = 'ক-ইউনিট (বিজ্ঞান) + খ-ইউনিট (কলা)';
      else if (uni.includes('CU') || uni.includes('চট্টগ্রাম')) unit = 'A Unit + B Unit';
      else if (uni.includes('BUET') || uni.includes('RUET') || uni.includes('প্রকৌশল')) unit = 'ক-বিভাগ (ইঞ্জিনিয়ারিং) ও খ-বিভাগ (আর্কিটেকচার)';
      else if (uni.includes('মেডিকেল') || uni.includes('MED')) unit = 'MBBS ও BDS ভর্তি পরীক্ষা';
      else unit = 'Unit A (বিজ্ঞান অনুষদ)';
    }

    const shortCode = uni.match(/\(([^)]+)\)/)?.[1] || uni.trim().split(' ')[0] || 'UNI';
    const cleanUni = uni.split(' (')[0].trim();
    const cleanTitle = `[${shortCode}] ${cleanUni} স্পেশাল - ${capacityInput} সিট (${unit.split(' + ')[0].split(' (')[0]})`;
    const cleanDesc = `${cleanUni} ভর্তি পরীক্ষার্থী ও অভিভাবকদের সুবিধার্থে প্রস্তুতকৃত ${capacityInput}-সিটের বিশেষ রিক্লাইনার কোচ। নির্দিষ্ট সময়ে পরীক্ষা কেন্দ্রে পৌঁছানো এবং আরামদায়ক ভ্রমণের নিশ্চয়তা।`;

    setTargetUniversity(uni);
    setAdmissionUnit(unit);
    setExamName(exam);
    setLayoutName(cleanTitle);
    setLayoutDescription(cleanDesc);
    toastSuccess(language === 'bn' ? '✨ AI দিয়ে ফর্মের নাম, ইউনিট ও বিবরণ সুন্দরভাবে পূরণ করা হয়েছে!' : 'Form fields filled with AI!');
  };

  const handleAIGenerateTitle = () => {
    const uni = targetUniversity.trim() || 'বিশ্ববিদ্যালয়';
    const shortCode = uni.match(/\(([^)]+)\)/)?.[1] || uni.trim().split(' ')[0] || 'UNI';
    const cleanUni = uni.split(' (')[0].trim();
    const unitTag = admissionUnit.trim() ? ` [${admissionUnit.split(' + ')[0]}]` : '';

    const titles = [
      `[${shortCode}]${unitTag} ${cleanUni} স্পেশাল - ${capacityInput} সিট`,
      `[${shortCode} এক্সপ্রেস] ${cleanUni} ভর্তি পরীক্ষা স্পেশাল কোচ - ${capacityInput} সিট`,
      `[${shortCode}] ${cleanUni} ডিল্যাক্স রিক্লাইনার - ${capacityInput} সিট (${admissionUnit || 'সকল অনুষদ'})`,
      `[${shortCode}] ${cleanUni} ডেডিকেটেড এক্সক্লুসিভ কোচ - ${capacityInput} সিট`
    ];

    const nextTitle = titles[Math.floor(Math.random() * titles.length)];
    setLayoutName(nextTitle);
    toastSuccess(language === 'bn' ? '✨ AI দিয়ে চমৎকার লেআউট নাম লেখা হয়েছে!' : 'AI generated layout title!');
  };

  const handleAIGenerateDescription = () => {
    const uni = targetUniversity.trim() || 'বিশ্ববিদ্যালয়';
    const cleanUni = uni.split(' (')[0].trim();
    const descriptions = [
      `${cleanUni} ভর্তি পরীক্ষার্থী ও অভিভাবকদের স্বস্তিদায়ক ভ্রমণের জন্য ${capacityInput}-সিটের বিশেষ রিক্লাইনার কোচ। পর্যাপ্ত লাগেজ স্পেস ও যথাসময়ে পরীক্ষা কেন্দ্রে পৌঁছানোর সুবিধাসহ।`,
      `${cleanUni} ভর্তি পরীক্ষা স্পেশাল ডে/নাইট সার্ভিস। শিক্ষার্থী বান্ধব পরিবেশ, আরামদায়ক আসন ও অভিজ্ঞ চালক দ্বারা পরিচালিত নিরাপদ যাত্রা।`,
      `${cleanUni} সকল অনুষদের শিক্ষার্থীদের সুবিধার্থে বিশেষ সরাসরি বাস সার্ভিস। পরীক্ষা কেন্দ্রের গেট পর্যন্ত পৌঁছে দেওয়ার সুবিধা ও নিরাপদ যাতায়াত।`,
      `${cleanUni} ভর্তি পরীক্ষা স্পেশাল আরামদায়ক যাত্রা। পর্যাপ্ত লেগরুম, হাইওয়ে স্পেশাল কোচ ও অভিজ্ঞ সহকারীর তত্ত্বাবধানে পরিচালিত।`
    ];

    const nextDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
    setLayoutDescription(nextDesc);
    toastSuccess(language === 'bn' ? '✨ AI দিয়ে সুন্দর বিবরণী লেখা হয়েছে!' : 'AI generated description!');
  };

  const handleAIFillNewLayoutModal = () => {
    const uni = newLayoutModalForm.targetUniversity.trim() || 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
    const cap = newLayoutModalForm.capacity || 45;
    const shortCode = uni.match(/\(([^)]+)\)/)?.[1] || uni.trim().split(' ')[0] || 'UNI';
    const cleanUni = uni.split(' (')[0].trim();

    setNewLayoutModalForm(prev => ({
      ...prev,
      targetUniversity: uni,
      name: `[${shortCode}] ${cleanUni} ভর্তি পরীক্ষা স্পেশাল - ${cap} সিট`,
      description: `${cleanUni} ভর্তি পরীক্ষার্থীদের যাতায়াতের জন্য প্রস্তুতকৃত ${cap}-সিটের আরামদায়ক কোচ।`
    }));
    toastSuccess(language === 'bn' ? '✨ AI দিয়ে নাম ও বিবরণী পূরণ করা হয়েছে!' : 'AI filled new layout details!');
  };

  // Custom Editable Fare Segments
  const [segments, setSegments] = useState<FareRangeSegment[]>([
    { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' },
    { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' },
    { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' },
    { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' }
  ]);

  // Segment Edit/Create Modal
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<FareRangeSegment | null>(null);
  const [segmentForm, setSegmentForm] = useState<{
    name: string;
    startRow: string;
    endRow: string;
    fare: number;
    color: FareRangeSegment['color'];
  }>({
    name: '',
    startRow: 'A',
    endRow: 'E',
    fare: 600,
    color: 'emerald'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const rowLetters = 'ABCDEFGHIJKLMN';

  // Standard Capacity Options (Prominent 40 vs 45 seats)
  const capacityOptions = [
    {
      capacity: 45,
      titleBn: '৪৫ সিট (ডিফল্ট / সবচেয়ে জনপ্রিয়)',
      titleEn: '45 Seats (Most Popular)',
      rowsDesc: '১১ সারি (১০ সারি × ৪ = ৪০ + শেষ সারিতে ৫টি সিট)',
      isDefault: true
    },
    {
      capacity: 40,
      titleBn: '৪০ সিট (স্ট্যান্ডার্ড কোচ)',
      titleEn: '40 Seats (Standard Coach)',
      rowsDesc: '১০ সারি (১০ সারি × ৪ = ৪০ সিট, ২+২ লেআউট)',
      isDefault: false
    },
    {
      capacity: 36,
      titleBn: '৩৬ সিট (৯ সারি)',
      titleEn: '36 Seats (9 Rows)',
      rowsDesc: '৯ সারি × ৪ = ৩৬ সিট',
      isDefault: false
    },
    {
      capacity: 32,
      titleBn: '৩২ সিট (৮ সারি)',
      titleEn: '32 Seats (8 Rows)',
      rowsDesc: '৮ সারি × ৪ = ৩২ সিট',
      isDefault: false
    },
    {
      capacity: 28,
      titleBn: '২৮ সিট (৭ সারি)',
      titleEn: '28 Seats (7 Rows)',
      rowsDesc: '৭ সারি × ৪ = ২৮ সিট',
      isDefault: false
    },
    {
      capacity: 42,
      titleBn: '৪২ সিট (১০ সারি + স্পেশাল)',
      titleEn: '42 Seats (10 Rows + Extra)',
      rowsDesc: '১০ সারি (৪০) + লাস্ট রো স্পেশাল ২ সিট',
      isDefault: false
    }
  ];

  // Dynamic University Presets (Editable, Creatable, Deletable)
  const [universityPresets, setUniversityPresets] = useState<any[]>([
    {
      id: 'GST',
      name: 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)',
      defaultLayoutName: '[GST] জিএসটি গুচ্ছ স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 500, color: 'purple' as const }
      ]
    },
    {
      id: 'RU',
      name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
      defaultLayoutName: '[RU] [Unit C - বিজ্ঞান] রাজশাহী বিশ্ববিদ্যালয় স্পেশাল - ৪৫ সিট',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' as const },
        { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' as const }
      ]
    },
    {
      id: 'DU',
      name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
      defaultLayoutName: '[DU] ঢাকা বিশ্ববিদ্যালয় ডে এক্সপ্রেস - ৪০ সিট (৳৫০০)',
      capacity: 40,
      segments: [
        { id: 'seg-1', name: 'Front Seats (A–D)', startRow: 'A', endRow: 'D', fare: 500, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (E–J)', startRow: 'E', endRow: 'J', fare: 450, color: 'blue' as const }
      ]
    },
    {
      id: 'CU',
      name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
      defaultLayoutName: '[CU] চট্টগ্রাম বিশ্ববিদ্যালয় নাইট কোচ - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 600, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 550, color: 'purple' as const }
      ]
    },
    {
      id: 'JU',
      name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
      defaultLayoutName: '[JU] জাহাঙ্গীরনগর বিশ্ববিদ্যালয় শাটল - ৩৬ সিট (৳৪০০)',
      capacity: 36,
      segments: [
        { id: 'seg-1', name: 'All Seats (A–I)', startRow: 'A', endRow: 'I', fare: 400, color: 'blue' as const }
      ]
    },
    {
      id: 'Agri',
      name: 'কৃষি গুচ্ছ (Agri Cluster - ৯ বিশ্ববিদ্যালয়)',
      defaultLayoutName: '[Agri] কৃষি গুচ্ছ ভর্তি পরীক্ষা স্পেশাল - ৪৫ সিট',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
      ]
    },
    {
      id: 'BUET',
      name: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)',
      defaultLayoutName: '[BUET] বুয়েট ভর্তি পরীক্ষা এক্সপ্রেস - ৪০ সিট',
      capacity: 40,
      segments: [
        { id: 'seg-1', name: 'Front Seats (A–D)', startRow: 'A', endRow: 'D', fare: 550, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (E–J)', startRow: 'E', endRow: 'J', fare: 500, color: 'blue' as const }
      ]
    },
    {
      id: 'Eng-Cluster',
      name: 'প্রকৌশল গুচ্ছ (RUET, CUET, KUET)',
      defaultLayoutName: '[Eng-Cluster] প্রকৌশল গুচ্ছ স্পেশাল - ৪৫ সিট',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 600, color: 'blue' as const }
      ]
    },
    {
      id: 'MBBS',
      name: 'মেডিকেল ভর্তি পরীক্ষা (MBBS & BDS)',
      defaultLayoutName: '[MBBS] মেডিকেল ভর্তি পরীক্ষা এক্সপ্রেস - ৪৫ সিট',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
      ]
    },
    {
      id: 'SUST',
      name: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (SUST)',
      defaultLayoutName: '[SUST] সাস্ট সিলেট এক্সপ্রেস - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 600, color: 'blue' as const }
      ]
    },
    {
      id: 'KU',
      name: 'খুলনা বিশ্ববিদ্যালয় (KU)',
      defaultLayoutName: '[KU] খুলনা বিশ্ববিদ্যালয় স্পেশাল - ৪৫ সিট',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
      ]
    }
  ]);

  // University Preset Modal State
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [editingUniPreset, setEditingUniPreset] = useState<any | null>(null);
  const [uniForm, setUniForm] = useState({
    name: '',
    defaultLayoutName: '',
    capacity: 45
  });

  const handleOpenEditUni = (e: React.MouseEvent, uni: any) => {
    e.stopPropagation();
    setEditingUniPreset(uni);
    setUniForm({
      name: uni.name,
      defaultLayoutName: uni.defaultLayoutName,
      capacity: uni.capacity
    });
    setIsUniModalOpen(true);
  };

  const handleOpenAddUni = () => {
    setEditingUniPreset(null);
    setUniForm({
      name: 'নতুন বিশ্ববিদ্যালয় (ভার্সিটি নাম)',
      defaultLayoutName: 'নতুন বিশ্ববিদ্যালয় স্পেশাল - ৪৫ সিট (৳৬০০)',
      capacity: 45
    });
    setIsUniModalOpen(true);
  };

  const handleSaveUniPreset = () => {
    if (!uniForm.name.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে বিশ্ববিদ্যালয়ের নাম দিন' : 'Please provide a university name');
      return;
    }

    if (editingUniPreset) {
      const updated = universityPresets.map(u =>
        u.id === editingUniPreset.id
          ? {
              ...u,
              name: uniForm.name.trim(),
              defaultLayoutName: uniForm.defaultLayoutName.trim() || `${uniForm.name.trim()} স্পেশাল - ${uniForm.capacity} সিট`,
              capacity: Number(uniForm.capacity)
            }
          : u
      );
      setUniversityPresets(updated);
      if (targetUniversity === editingUniPreset.name) {
        setTargetUniversity(uniForm.name.trim());
        setLayoutName(uniForm.defaultLayoutName.trim() || `${uniForm.name.trim()} স্পেশাল - ${uniForm.capacity} সিট`);
      }
    } else {
      const newUni = {
        id: `uni-${Date.now()}`,
        name: uniForm.name.trim(),
        defaultLayoutName: uniForm.defaultLayoutName.trim() || `${uniForm.name.trim()} স্পেশাল - ${uniForm.capacity} সিট`,
        capacity: Number(uniForm.capacity),
        segments: [
          { id: `seg-${Date.now()}-1`, name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
          { id: `seg-${Date.now()}-2`, name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
        ]
      };
      setUniversityPresets([...universityPresets, newUni]);
    }

    setIsUniModalOpen(false);
  };

  const handleDeleteUniPreset = (e: React.MouseEvent, uniId: string) => {
    e.stopPropagation();
    if (!confirm(language === 'bn' ? 'আপনি কি এই বিশ্ববিদ্যালয় প্রিসেটটি মুছে ফেলতে চান?' : 'Delete this university preset?')) return;
    setUniversityPresets(universityPresets.filter(u => u.id !== uniId));
  };

  // Helper to find segment matching row
  const getSegmentForRow = (rowChar: string, currentSegments = segments): FareRangeSegment | undefined => {
    return currentSegments.find(seg => {
      const startIdx = rowLetters.indexOf(seg.startRow.toUpperCase());
      const endIdx = rowLetters.indexOf(seg.endRow.toUpperCase());
      const curIdx = rowLetters.indexOf(rowChar.toUpperCase());
      return curIdx >= startIdx && curIdx <= endIdx;
    });
  };

  // Create New Layout Modal State
  const [isCreateNewLayoutModalOpen, setIsCreateNewLayoutModalOpen] = useState(false);
  const [newLayoutModalForm, setNewLayoutModalForm] = useState({
    name: 'নতুন বাস কোচ লেআউট - ৪৫ সিট',
    targetUniversity: '',
    capacity: 45,
    defaultFare: 550,
    description: '',
    saveAsPreset: false
  });

  const handleOpenCreateNewLayoutModal = () => {
    setNewLayoutModalForm({
      name: `নতুন বাস লেআউট - ৪৫ সিট (${new Date().toLocaleDateString('bn-BD')})`,
      targetUniversity: targetUniversity || '',
      capacity: 45,
      defaultFare: 550,
      description: '',
      saveAsPreset: false
    });
    setIsCreateNewLayoutModalOpen(true);
  };

  const handleConfirmCreateNewLayout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLayoutModalForm.name.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে লেআউটের একটি নাম দিন' : 'Please provide a layout name');
      return;
    }
    const cap = Math.max(10, Math.min(60, Number(newLayoutModalForm.capacity) || 45));
    const layoutTitle = newLayoutModalForm.name.trim();
    const uniTitle = newLayoutModalForm.targetUniversity.trim() || 'কাস্টম বিশ্ববিদ্যালয়';

    setEditingExistingLayoutId(null);
    setTargetUniversity(uniTitle);
    setLayoutName(layoutTitle);
    setLayoutDescription(newLayoutModalForm.description.trim());
    setExtraSeats([]);
    setSelectedCell(null);
    setCapacityInput(cap);
    generateDynamicLayout(cap, layoutTitle);

    if (newLayoutModalForm.saveAsPreset) {
      const newPreset = {
        id: `preset-${Date.now()}`,
        name: uniTitle,
        defaultLayoutName: layoutTitle,
        capacity: cap,
        segments: [...segments]
      };
      setUniversityPresets(prev => [newPreset, ...prev.filter(p => p.name !== newPreset.name)]);
    }

    setIsCreateNewLayoutModalOpen(false);
    setActiveTab('builder');
    setToastNotification({
      show: true,
      title: language === 'bn' ? '🎉 নতুন লেআউট তৈরি হয়েছে!' : '🎉 New Layout Started!',
      message: language === 'bn'
        ? `"${layoutTitle}" (${cap} সিট) লেআউটটি লোড হয়েছে।${newLayoutModalForm.saveAsPreset ? ' এবং প্রিসেট তালিকায় যোগ করা হয়েছে।' : ''} এবার আপনার পছন্দমতো সাজিয়ে সেভ করুন।`
        : `"${layoutTitle}" (${cap} seats) loaded. Customise and click Save Layout.`,
      type: 'success'
    });
    setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct quick reset
  const handleStartNewLayout = () => {
    handleOpenCreateNewLayoutModal();
  };

  // Select University Preset Handler
  const handleSelectUniversity = (uni: typeof universityPresets[0]) => {
    setTargetUniversity(uni.name);
    setLayoutName(uni.defaultLayoutName);
    setLayoutDescription(`${uni.name} ভর্তি পরীক্ষা স্পেশাল কোচ লেআউট`);
    setSegments(uni.segments);
    generateDynamicLayout(uni.capacity, uni.defaultLayoutName, uni.segments);
  };

  // Dynamic layout generator based on capacity (40, 45, etc.)
  const generateDynamicLayout = (
    targetCapacity: number,
    customName?: string,
    customSegments = segments
  ) => {
    setCapacityInput(targetCapacity);
    if (customName) setLayoutName(customName);

    const newCells: SeatCell[] = [];

    if (targetCapacity === 45) {
      // 45 Seats = 10 rows of 4 (40) + Row K 5 seats with K3 in middle
      const rows = 11;
      const cols = 5;
      setTotalRows(rows);
      setTotalCols(cols);

      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const isLastRow = r === rows - 1;
        const matchingSeg = getSegmentForRow(rowChar, customSegments);

        for (let c = 0; c < cols; c++) {
          if (isLastRow) {
            // Row K 5 seats: K1, K2, K3 (Center Aisle), K4, K5
            const seatNumber = `${rowChar}${c + 1}`;
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber,
              type: 'SEAT',
              genderRule: 'ANY',
              baseFare: matchingSeg?.fare || 450
            });
          } else if (c === 2) {
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber: '',
              type: 'AISLE',
              genderRule: 'ANY'
            });
          } else {
            const seatLetter = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber: `${rowChar}${seatLetter}`,
              type: 'SEAT',
              genderRule: 'ANY',
              baseFare: matchingSeg?.fare || 550
            });
          }
        }
      }
    } else if (targetCapacity === 40) {
      // Standard 40 seats = 10 rows of 4 (A1-J4)
      const rows = 10;
      const cols = 5;
      setTotalRows(rows);
      setTotalCols(cols);

      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const matchingSeg = getSegmentForRow(rowChar, customSegments);

        for (let c = 0; c < cols; c++) {
          if (c === 2) {
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber: '',
              type: 'AISLE',
              genderRule: 'ANY'
            });
          } else {
            const seatLetter = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber: `${rowChar}${seatLetter}`,
              type: 'SEAT',
              genderRule: 'ANY',
              baseFare: matchingSeg?.fare || 500
            });
          }
        }
      }
    } else {
      let rows = Math.ceil(targetCapacity / 4);
      if (rows < 5) rows = 5;
      const cols = 5;
      setTotalRows(rows);
      setTotalCols(cols);

      let seatCounter = 0;
      for (let r = 0; r < rows; r++) {
        const rowChar = rowLetters[r] || `R${r + 1}`;
        const matchingSeg = getSegmentForRow(rowChar, customSegments);

        for (let c = 0; c < cols; c++) {
          if (c === 2) {
            newCells.push({
              rowIndex: r,
              colIndex: c,
              seatNumber: '',
              type: 'AISLE',
              genderRule: 'ANY'
            });
          } else {
            if (seatCounter < targetCapacity) {
              seatCounter++;
              const seatLetter = c === 0 ? '1' : c === 1 ? '2' : c === 3 ? '3' : '4';
              newCells.push({
                rowIndex: r,
                colIndex: c,
                seatNumber: `${rowChar}${seatLetter}`,
                type: 'SEAT',
                genderRule: 'ANY',
                baseFare: matchingSeg?.fare || 500
              });
            } else {
              newCells.push({
                rowIndex: r,
                colIndex: c,
                seatNumber: '',
                type: 'EMPTY',
                genderRule: 'ANY'
              });
            }
          }
        }
      }
    }

    setCells(newCells);
    setSelectedCell(null);
  };

  useEffect(() => {
    generateDynamicLayout(45, 'কাস্টম বাস সিট লেআউট - ৪৫ সিট');
  }, []);

  const applySegmentsToCells = (updatedSegments: FareRangeSegment[]) => {
    setCells(prev =>
      prev.map(cell => {
        if (cell.type !== 'SEAT') return cell;
        const rowChar = rowLetters[cell.rowIndex] || 'A';
        const matching = updatedSegments.find(seg => {
          const startIdx = rowLetters.indexOf(seg.startRow.toUpperCase());
          const endIdx = rowLetters.indexOf(seg.endRow.toUpperCase());
          const curIdx = rowLetters.indexOf(rowChar.toUpperCase());
          return curIdx >= startIdx && curIdx <= endIdx;
        });
        if (matching) {
          return { ...cell, baseFare: matching.fare };
        }
        return cell;
      })
    );
  };

  const handleOpenAddSegment = () => {
    setEditingSegment(null);
    setSegmentForm({
      name: `VIP Zone ${rowLetters[0]}–${rowLetters[2]}`,
      startRow: 'A',
      endRow: 'C',
      fare: 650,
      color: 'emerald'
    });
    setIsSegmentModalOpen(true);
  };

  const handleOpenEditSegment = (seg: FareRangeSegment) => {
    setEditingSegment(seg);
    setSegmentForm({
      name: seg.name,
      startRow: seg.startRow,
      endRow: seg.endRow,
      fare: seg.fare,
      color: seg.color
    });
    setIsSegmentModalOpen(true);
  };

  const handleSaveSegment = () => {
    if (!segmentForm.name.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে রেঞ্জের একটি নাম দিন' : 'Please provide a name for this range');
      return;
    }
    const startIdx = rowLetters.indexOf(segmentForm.startRow.toUpperCase());
    const endIdx = rowLetters.indexOf(segmentForm.endRow.toUpperCase());
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
      alert(language === 'bn' ? 'সঠিক সারি রেঞ্জ সিলেক্ট করুন (যেমন: A থেকে E)' : 'Invalid row range selected');
      return;
    }

    let updatedList: FareRangeSegment[];
    if (editingSegment) {
      updatedList = segments.map(s => s.id === editingSegment.id ? { ...s, ...segmentForm } : s);
    } else {
      const newSeg: FareRangeSegment = {
        id: `seg-${Date.now()}`,
        ...segmentForm
      };
      updatedList = [...segments, newSeg];
    }

    setSegments(updatedList);
    applySegmentsToCells(updatedList);
    setIsSegmentModalOpen(false);
  };

  const handleDeleteSegment = (id: string) => {
    const updated = segments.filter(s => s.id !== id);
    setSegments(updated);
    applySegmentsToCells(updated);
  };

  // Extra Seats
  const handleAddExtraSeat = () => {
    const nextIdx = extraSeats.length + 1;
    const newId = `extra-${Date.now()}-${nextIdx}`;
    const newExtra: SeatCell = {
      id: newId,
      rowIndex: 999,
      colIndex: nextIdx,
      seatNumber: `EX-${nextIdx}`,
      type: 'SEAT',
      genderRule: 'ANY',
      baseFare: 450,
      isExtra: true
    };
    setExtraSeats(prev => [...prev, newExtra]);
    setSelectedCell(newExtra);
    setCellFormApplied(false);
  };

  const handleRemoveSingleExtraSeat = (targetSeat: SeatCell | string) => {
    const seatNum = typeof targetSeat === 'string' ? targetSeat : targetSeat.seatNumber;
    const seatId = typeof targetSeat === 'object' ? targetSeat.id : undefined;
    setExtraSeats(prev => prev.filter(s => (seatId && s.id ? s.id !== seatId : s.seatNumber !== seatNum)));
    if (selectedCell?.seatNumber === seatNum || (seatId && selectedCell?.id === seatId)) {
      setSelectedCell(null);
    }
  };

  const handleUndoExtraSeat = () => {
    if (extraSeats.length === 0) return;
    const updated = [...extraSeats];
    const removed = updated.pop();
    setExtraSeats(updated);
    if (selectedCell?.seatNumber === removed?.seatNumber || (removed?.id && selectedCell?.id === removed.id)) {
      setSelectedCell(null);
    }
  };

  const handleCellClick = (cell: SeatCell) => {
    setSelectedCell(cell);
    setCellFormApplied(false);
  };

  const handleUpdateSelectedCell = (updatedProps: Partial<SeatCell>) => {
    if (!selectedCell) return;
    const updated = { ...selectedCell, ...updatedProps };
    setSelectedCell(updated);

    if (selectedCell.isExtra) {
      setExtraSeats(prev => prev.map(s => 
        (selectedCell.id && s.id ? s.id === selectedCell.id : s.seatNumber === selectedCell.seatNumber) 
          ? updated 
          : s
      ));
    } else {
      setCells(prev => prev.map(c => (c.rowIndex === updated.rowIndex && c.colIndex === updated.colIndex ? updated : c)));
    }
  };

  const handleApplyInspectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCellFormApplied(true);
    setTimeout(() => setCellFormApplied(false), 2500);
  };

  // Helper: Extract or identify Unit badge for any layout
  // Helper: Extract or identify Unit badge for any layout
  const getLayoutUnitBadge = (layout: any) => {
    if (layout?.unit) return layout.unit;
    if (layout?.examUnit) return layout.examUnit;
    if (layout?.exam_unit) return layout.exam_unit;
    const jsonRaw = layout?.layoutJson || layout?.layout_json;
    if (jsonRaw) {
      try {
        const p = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
        if (p?.unit) return p.unit;
        if (p?.examUnit) return p.examUnit;
        if (p?.exam_unit) return p.exam_unit;
      } catch {}
    }
    const text = `${layout?.name || ''} ${layout?.description || ''}`.toLowerCase();
    const match = text.match(/(?:unit|ইউনিট)\s*([a-z0-9]+)/i);
    if (match) {
      return `Unit ${match[1].toUpperCase()}`;
    }
    if (text.includes('unit a') || text.includes('a unit') || text.includes('ইউনিট a') || text.includes('ইউনিট এ') || text.includes('[unit a]')) return 'Unit A';
    if (text.includes('unit b') || text.includes('b unit') || text.includes('ইউনিট b') || text.includes('ইউনিট বি') || text.includes('[unit b]')) return 'Unit B';
    if (text.includes('unit c') || text.includes('c unit') || text.includes('ইউনিট c') || text.includes('ইউনিট সি') || text.includes('[unit c]')) return 'Unit C';
    if (text.includes('unit d') || text.includes('d unit') || text.includes('ইউনিট d') || text.includes('ইউনিট ডি') || text.includes('[unit d]')) return 'Unit D';
    if (text.includes('unit e') || text.includes('e unit')) return 'Unit E';
    if (text.includes('general') || text.includes('সাধারণ')) return 'General';
    return null;
  };

  const getUnitBadgeStyle = (unit: string | null | undefined) => {
    if (!unit) return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    if (unit.includes('A')) return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    if (unit.includes('B')) return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    if (unit.includes('C')) return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    if (unit.includes('D')) return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    if (unit.includes('E')) return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  // Helper: Extract rich University Info for any layout (Immediate distinction between DU vs RU vs CU vs GST)
  const getLayoutUniversityDetails = (layout: any) => {
    let rawUni = layout?.university || '';
    if (!rawUni) {
      const jsonRaw = layout?.layoutJson || layout?.layout_json;
      if (jsonRaw) {
        try {
          const p = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
          if (p?.university) rawUni = p.university;
        } catch {}
      }
    }
    const combined = `${rawUni} ${layout?.name || ''} ${layout?.description || ''}`.toLowerCase();

    // 1. Dhaka University (DU / ঢাবি)
    if (combined.includes('ঢাকা') || combined.includes('du') || combined.includes('ঢাবি') || combined.includes('dhaka')) {
      return {
        code: 'DU',
        nameBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        shortName: 'ঢাকা বিশ্ববিদ্যালয়',
        district: 'ঢাকা',
        icon: '🏛️',
        headerGradient: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700',
        badgeBg: 'bg-red-600 text-white border-red-400 shadow-sm shadow-red-500/25',
        bannerClass: 'bg-gradient-to-r from-red-50 via-rose-50/50 to-red-50 dark:from-red-950/70 dark:via-slate-900 dark:to-red-950/60 border-red-300 dark:border-red-800'
      };
    }

    // 2. Rajshahi University (RU / রাবি)
    if (combined.includes('রাজশাহী') || combined.includes('ru') || combined.includes('রাবি') || combined.includes('rajshahi')) {
      return {
        code: 'RU',
        nameBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
        shortName: 'রাজশাহী বিশ্ববিদ্যালয়',
        district: 'রাজশাহী',
        icon: '🏛️',
        headerGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700',
        badgeBg: 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/25',
        bannerClass: 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 dark:from-blue-950/70 dark:via-slate-900 dark:to-indigo-950/60 border-blue-300 dark:border-blue-800'
      };
    }

    // 3. Chittagong University (CU / চবি)
    if (combined.includes('চট্টগ্রাম') || combined.includes('cu') || combined.includes('চবি') || combined.includes('chittagong')) {
      return {
        code: 'CU',
        nameBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
        shortName: 'চট্টগ্রাম বিশ্ববিদ্যালয়',
        district: 'চট্টগ্রাম',
        icon: '🏛️',
        headerGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700',
        badgeBg: 'bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-500/25',
        bannerClass: 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-emerald-950/70 dark:via-slate-900 dark:to-teal-950/60 border-emerald-300 dark:border-emerald-800'
      };
    }

    // 4. Jahangirnagar University (JU / জাবি)
    if (combined.includes('জাহাঙ্গীরনগর') || combined.includes('ju') || combined.includes('জাবি') || combined.includes('jahangirnagar')) {
      return {
        code: 'JU',
        nameBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
        shortName: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
        district: 'সাভার, ঢাকা',
        icon: '🏛️',
        headerGradient: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700',
        badgeBg: 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-500/25',
        bannerClass: 'bg-gradient-to-r from-purple-50 via-violet-50/50 to-purple-50 dark:from-purple-950/70 dark:via-slate-900 dark:to-violet-950/60 border-purple-300 dark:border-purple-800'
      };
    }

    // 5. GST Cluster (২৪ বিশ্ববিদ্যালয়)
    if (combined.includes('গুচ্ছ') || combined.includes('gst') || combined.includes('cluster')) {
      return {
        code: 'GST',
        nameBn: 'জিএসটি গুচ্ছ (GST Cluster)',
        shortName: 'জিএসটি গুচ্ছ',
        district: 'সারাদেশ (২৪ বিশ্ববিদ্যালয়)',
        icon: '🌐',
        headerGradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
        badgeBg: 'bg-amber-600 text-white border-amber-400 shadow-sm shadow-amber-500/25',
        bannerClass: 'bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/70 dark:via-slate-900 dark:to-orange-950/60 border-amber-300 dark:border-amber-800'
      };
    }

    // 6. BUET / Engineering
    if (combined.includes('বুয়েট') || combined.includes('buet') || combined.includes('ইঞ্জিনিয়ারিং') || combined.includes('ruet') || combined.includes('kuet') || combined.includes('cuet')) {
      return {
        code: 'BUET',
        nameBn: 'বুয়েট / ইঞ্জিনিয়ারিং গুচ্ছ',
        shortName: 'ইঞ্জিনিয়ারিং',
        district: 'ঢাকা / রাজশাহী / খুলনা',
        icon: '⚙️',
        headerGradient: 'bg-gradient-to-r from-cyan-600 via-slate-700 to-blue-700',
        badgeBg: 'bg-slate-800 text-cyan-300 border-cyan-500 shadow-sm',
        bannerClass: 'bg-gradient-to-r from-cyan-50 to-slate-100 dark:from-cyan-950/70 dark:to-slate-900 border-cyan-300 dark:border-cyan-800'
      };
    }

    // 7. Medical
    if (combined.includes('মেডিকেল') || combined.includes('medical') || combined.includes('ডেন্টাল')) {
      return {
        code: 'MED',
        nameBn: 'মেডিকেল ও ডেন্টাল (Medical)',
        shortName: 'মেডিকেল ভর্তি',
        district: 'সারাদেশ',
        icon: '🩺',
        headerGradient: 'bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600',
        badgeBg: 'bg-rose-600 text-white border-rose-400 shadow-sm',
        bannerClass: 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/70 dark:to-pink-950/60 border-rose-300 dark:border-rose-800'
      };
    }

    // Fallback / Custom University
    const cleanName = rawUni ? rawUni.split(' (')[0] : 'ভর্তি কোচিং লেআউট';
    const matchCode = rawUni ? rawUni.match(/\(([^)]+)\)/)?.[1] : null;
    return {
      code: matchCode || (rawUni ? 'কোচ' : 'সাধারণ'),
      nameBn: rawUni || 'সাধারণ বিশ্ববিদ্যালয় ভর্তি কোচ',
      shortName: cleanName,
      district: 'ভর্তি কেন্দ্র',
      icon: '🏛️',
      headerGradient: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700',
      badgeBg: 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-500/25',
      bannerClass: 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/70 dark:to-blue-950/60 border-indigo-300 dark:border-indigo-800'
    };
  };

  // Helper: Clean layout title for sleek, human-readable display
  const getCleanLayoutDisplayTitle = (layout: any) => {
    const raw = (layout?.name || '').trim();
    if (!raw) return 'কাস্টম বাস সিট লেআউট';

    // Remove raw bracket noise like [DU] [Kha / B Unit (...)] from the start
    let cleaned = raw
      .replace(/^\[[A-Z0-9_-]+\]\s*/i, '')
      .replace(/^\[[^\]]+\]\s*/i, '')
      .trim();

    return cleaned || raw;
  };

  // Check for duplicate layout names (excluding current editing layout)
  const trimmedCurrentName = layoutName.trim().toLowerCase();
  const duplicateExistingLayout = (savedLayouts || []).find(
    l => l?.name?.trim().toLowerCase() === trimmedCurrentName && l.id !== editingExistingLayoutId
  );

  // Load and Edit Saved Layout
  const handleLoadAndEditLayout = (layout: any) => {
    setEditingExistingLayoutId(layout.id);
    setLayoutName(layout.name);
    setLayoutDescription(layout.description || '');
    if (layout.university) setTargetUniversity(layout.university);
    if (layout.unit) setAdmissionUnit(layout.unit);
    else {
      const detected = getLayoutUnitBadge(layout);
      if (detected) setAdmissionUnit(detected);
    }
    if (layout.examName) setExamName(layout.examName);

    setTotalRows(layout.totalRows || layout.total_rows || 11);
    setTotalCols(layout.totalCols || layout.total_cols || 5);

    const jsonRaw = layout.layoutJson || layout.layout_json;
    if (jsonRaw) {
      try {
        const parsed = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
        if (parsed.university) setTargetUniversity(parsed.university);
        if (parsed.unit) setAdmissionUnit(parsed.unit);
        if (parsed.examName) setExamName(parsed.examName);

        const grid = parsed.layoutGrid || parsed.grid;
        if (grid && Array.isArray(grid)) {
          const loadedCells: SeatCell[] = [];
          for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
              const item = grid[r][c];
              if (item) {
                loadedCells.push({
                  rowIndex: r,
                  colIndex: c,
                  seatNumber: item.label || item.seatNumber || '',
                  type: item.type,
                  genderRule: item.genderAllowed || item.genderRule || 'ANY',
                  baseFare: item.baseFare || 500,
                  fareZoneId: item.fareZoneId
                });
              }
            }
          }
          setCells(loadedCells);

          if (parsed.extraSeats && Array.isArray(parsed.extraSeats) && parsed.extraSeats.length > 0) {
            setExtraSeats(parsed.extraSeats);
            setCapacityInput((layout.totalSeats || layout.total_seats || 45) - parsed.extraSeats.length);
          } else {
            setExtraSeats([]);
            setCapacityInput(layout.totalSeats || layout.total_seats || 45);
          }

          setSelectedCell(null);
          setActiveTab('builder');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch (e) {
        console.error('Failed to parse layoutJson', e);
      }
    }

    generateDynamicLayout(layout.totalSeats || layout.total_seats || 45, layout.name);
    setActiveTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestDeleteLayout = (id: string, name: string) => {
    const target = savedLayouts.find(l => l.id === id);
    setLayoutToDelete({ id, name, targetObj: target } as any);
    setDeleteMode('recycle'); // Default to safe recycle bin option
  };

  const confirmDeleteLayout = async () => {
    if (!layoutToDelete) return;
    setIsDeletingLayout(true);
    try {
      const { id, name } = layoutToDelete;
      const targetObj = (layoutToDelete as any).targetObj;
      const toRecycle = deleteMode === 'recycle';

      const res = await deleteSeatLayoutAction(id, toRecycle);
      if (res.success) {
        setSavedLayouts(prev => prev.filter(l => l.id !== id));
        if (editingExistingLayoutId === id) {
          setEditingExistingLayoutId(null);
        }

        // Show rich success message banner with Undo and Recycle Bin link
        setSuccessDeleteBanner({
          show: true,
          title: toRecycle
            ? (language === 'bn' ? '🗑️ লেআউট রিসাইকেল বিনে স্থানান্তর করা হয়েছে' : 'Moved to Recycle Bin')
            : (language === 'bn' ? '⚠️ লেআউট চিরতরে মুছে ফেলা হয়েছে' : 'Permanently Deleted'),
          message: toRecycle
            ? (language === 'bn'
                ? `"${name}" লেআউটটি নিরাপদে রিসাইকেল বিনে পাঠানো হয়েছে। কোনো বাসে প্রভাব পড়বে না এবং আপনি যেকোনো সময় এটি রিস্টোর করতে পারবেন।`
                : `Layout "${name}" was safely moved to Recycle Bin. You can restore it anytime.`)
            : (language === 'bn'
                ? `"${name}" লেআউটটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`
                : `Layout "${name}" was permanently removed.`),
          layoutId: id,
          layoutName: name,
          wasSentToRecycleBin: toRecycle,
          deletedLayoutObj: targetObj
        });

        toastSuccess(
          language === 'bn'
            ? `"${name}" সফলভাবে ${toRecycle ? 'রিসাইকেল বিনে পাঠানো হয়েছে' : 'মুছে ফেলা হয়েছে'}!`
            : `Layout "${name}" ${toRecycle ? 'moved to Recycle Bin' : 'deleted'} successfully!`
        );

        setLayoutToDelete(null);
        router.refresh();
      } else {
        toastError(
          res.error || 
          (language === 'bn' ? 'লেআউটটি মুছতে ব্যর্থ হয়েছে।' : 'Failed to delete layout')
        );
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete layout');
    } finally {
      setIsDeletingLayout(false);
    }
  };

  // Check if format / name already exists before restoring
  const handleAttemptRestore = async (layoutId: string, layoutName: string, layoutObj?: any, overrideName?: string) => {
    const nameToRestore = overrideName?.trim() || layoutName.trim();

    // Collision Check: Check if an active layout in savedLayouts already has this exact format or name
    const conflicting = savedLayouts.find(l => 
      l.id !== layoutId && l.name?.trim().toLowerCase() === nameToRestore.toLowerCase()
    );

    if (conflicting && !overrideName) {
      // Conflict found! Open conflict resolution modal
      const suggested = `${nameToRestore} (রিস্টোর্ড)`;
      setCustomRestoreName(suggested);
      setRestoreConflictModal({
        show: true,
        layoutId,
        originalName: layoutName,
        conflictingName: conflicting.name,
        suggestedName: suggested,
        layoutObj
      });
      return;
    }

    setIsRestoringLayout(true);
    try {
      const res = await restoreRecycleItemAction('layouts', layoutId, nameToRestore);
      if (res.success) {
        try {
          const freshRes = await fetch('/api/backend/buses/seat-layouts');
          if (freshRes.ok) {
            const freshData = await freshRes.json();
            if (Array.isArray(freshData) && freshData.length > 0) {
              setSavedLayouts(freshData);
            }
          }
        } catch (e) {
          console.error('Failed to reload layouts after restore:', e);
        }

        if (layoutObj) {
          const restoredItem = { 
            ...layoutObj, 
            name: nameToRestore, 
            description: (layoutObj.description || '').replace(/^\[DELETED.*?\]\s*/, '') 
          };
          setSavedLayouts(prev => {
            if (prev.some(l => l.id === layoutId)) {
              return prev.map(l => l.id === layoutId ? restoredItem : l);
            }
            return [restoredItem, ...prev];
          });
        }
        setSuccessDeleteBanner({ show: false, title: '', message: '', wasSentToRecycleBin: true });
        setRestoreConflictModal({ show: false, layoutId: '', originalName: '', conflictingName: '', suggestedName: '' });
        toastSuccess(
          language === 'bn'
            ? `✨ "${nameToRestore}" লেআউটটি সফলভাবে রিস্টোর করা হয়েছে!`
            : `Layout "${nameToRestore}" successfully restored!`
        );
        router.refresh();
      } else if (res.isConflict) {
        const suggested = `${nameToRestore} (রিস্টোর্ড)`;
        setCustomRestoreName(suggested);
        setRestoreConflictModal({
          show: true,
          layoutId,
          originalName: layoutName,
          conflictingName: nameToRestore,
          suggestedName: suggested,
          layoutObj
        });
      } else {
        toastError(res.error || 'Failed to restore layout');
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to restore layout');
    } finally {
      setIsRestoringLayout(false);
    }
  };

  // Duplicate/Clone Layout to Builder
  const handleDuplicateLayout = (layout: any) => {
    handleLoadAndEditLayout(layout);
    setEditingExistingLayoutId(null);
    const newName = `${layout.name} (কপি)`;
    setLayoutName(newName);
    toastSuccess(
      language === 'bn'
        ? `"${layout.name}" সফলভাবে কপি করে বিল্ডারে আনা হয়েছে!`
        : `Cloned "${layout.name}" into builder!`
    );
  };

  // Trigger Print / A4 Download
  const handlePrintLayout = () => {
    window.print();
  };

  // Save layout to DB
  const confirmSaveLayout = async () => {
    if (!layoutName.trim()) {
      setToastNotification({
        show: true,
        title: language === 'bn' ? 'লেআউট নাম প্রয়োজন' : 'Name Required',
        message: language === 'bn' ? 'অনুগ্রহ করে লেআউটের একটি নাম দিন।' : 'Please provide a layout name.',
        type: 'error'
      });
      setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 4500);
      return;
    }

    // Duplicate name warning prompt if creating fresh
    if (duplicateExistingLayout && !editingExistingLayoutId) {
      const wantOverwrite = confirm(language === 'bn'
        ? `⚠️ "${layoutName}" নামে ইতিমধ্যে একটি লেআউট ডাটাবেজে সংরক্ষিত আছে!\n\nআপনি কি আগের লেআউটটি প্রতিস্থাপন (Overwrite / Update) করতে চান?`
        : `A layout named "${layoutName}" already exists.\n\nDo you want to overwrite it?`);
      if (!wantOverwrite) {
        setIsSaveModalOpen(true);
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const layoutGrid: any[][] = [];
      for (let r = 0; r < totalRows; r++) {
        layoutGrid[r] = [];
        for (let c = 0; c < totalCols; c++) {
          const cell = cells.find(item => item.rowIndex === r && item.colIndex === c);
          if (cell) {
            layoutGrid[r][c] = {
              type: cell.type,
              label: cell.type === 'SEAT' ? cell.seatNumber : undefined,
              genderAllowed: cell.genderRule,
              fareZoneId: cell.fareZoneId,
              baseFare: cell.baseFare
            };
          } else {
            layoutGrid[r][c] = { type: 'EMPTY' };
          }
        }
      }

      const isUpdate = !!editingExistingLayoutId || (duplicateExistingLayout && !editingExistingLayoutId);
      const targetId = editingExistingLayoutId || (duplicateExistingLayout ? duplicateExistingLayout.id : undefined);

      const res = await createCustomLayoutAction({
        id: targetId,
        name: layoutName.trim(),
        description: layoutDescription.trim(),
        university: targetUniversity.trim(),
        unit: admissionUnit.trim(),
        examName: examName.trim(),
        totalRows: totalRows,
        totalCols: totalCols,
        layoutGrid,
        extraSeats: extraSeats
      });

      if (res.success) {
        if (res.layout) {
          const savedItem = res.layout;
          const normName = savedItem.name?.trim().toLowerCase();
          setSavedLayouts(prev => [
            savedItem,
            ...prev.filter(l => l.id !== savedItem.id && (l.name || '').trim().toLowerCase() !== normName)
          ]);
        }
        setEditingExistingLayoutId(null);
        const successMessage = isUpdate
          ? (language === 'bn' ? `"${layoutName}" লেআউটটি সফলভাবে আপডেট হয়েছে!` : `Layout "${layoutName}" successfully updated!`)
          : (language === 'bn' ? `"${layoutName}" লেআউটটি সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!` : `Layout "${layoutName}" successfully saved!`);
        toastSuccess(successMessage);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to save seat layout');
        toastError(res.error || 'Failed to save seat layout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving layout');
      toastError(err.message || 'An error occurred while saving layout');
    } finally {
      setIsSaving(false);
    }
  };

  const totalMainSeats = cells.filter(c => c.type === 'SEAT').length;
  const totalAllSeats = totalMainSeats + extraSeats.length;

  // Deduplicate savedLayouts by id and name so duplicates are never displayed
  const uniqueSavedLayouts = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const out: any[] = [];
    for (const l of savedLayouts || []) {
      if (!l || !l.id) continue;
      const normName = (l.name || '').trim().toLowerCase();
      if (!seenIds.has(l.id) && (!normName || !seenNames.has(normName))) {
        seenIds.add(l.id);
        if (normName) seenNames.add(normName);
        out.push(l);
      }
    }
    return out;
  }, [savedLayouts]);

  // Unique universities found in saved layouts for filter dropdown
  const availableUniversitiesForFilter = useMemo(() => {
    const list = new Set<string>();
    uniqueSavedLayouts.forEach(l => {
      if (l?.university) list.add(l.university);
      else if (l?.name?.includes('RU') || l?.name?.includes('রাজশাহী')) list.add('রাজশাহী বিশ্ববিদ্যালয় (RU)');
      else if (l?.name?.includes('GST') || l?.name?.includes('গুচ্ছ')) list.add('জিএসটি গুচ্ছ (GST)');
      else if (l?.name?.includes('DU') || l?.name?.includes('ঢাকা')) list.add('ঢাকা বিশ্ববিদ্যালয় (DU)');
      else if (l?.name?.includes('CU') || l?.name?.includes('চট্টগ্রাম')) list.add('চট্টগ্রাম বিশ্ববিদ্যালয় (CU)');
      else if (l?.name?.includes('বুয়েট') || l?.name?.includes('BUET')) list.add('বুয়েট (BUET)');
    });
    return Array.from(list);
  }, [uniqueSavedLayouts]);

  const handleResetGalleryFilters = () => {
    setGallerySearch('');
    setGalleryUniFilter('ALL');
    setGalleryUnitFilter('ALL');
    setGalleryCapacityFilter('ALL');
    setGalleryCategoryFilter('ALL');
    setGallerySortBy('newest');
  };

  const isAnyGalleryFilterActive = 
    Boolean(gallerySearch.trim()) ||
    galleryUniFilter !== 'ALL' ||
    galleryUnitFilter !== 'ALL' ||
    galleryCapacityFilter !== 'ALL' ||
    galleryCategoryFilter !== 'ALL' ||
    gallerySortBy !== 'newest';

  const filteredSavedLayouts = uniqueSavedLayouts
    .filter(l => {
      const name = l?.name || '';
      const desc = l?.description || '';
      const uni = l?.university || '';
      const unit = l?.unit || getLayoutUnitBadge(l) || '';
      const exam = l?.examName || '';
      const cap = Number(l?.totalSeats || l?.total_seats || 45);
      const q = (gallerySearch || '').toLowerCase().trim();

      const matchesSearch = 
        !q ||
        name.toLowerCase().includes(q) || 
        desc.toLowerCase().includes(q) || 
        uni.toLowerCase().includes(q) || 
        unit.toLowerCase().includes(q) || 
        exam.toLowerCase().includes(q);

      let matchesUni = true;
      if (galleryUniFilter && galleryUniFilter !== 'ALL') {
        const text = `${name} ${desc} ${uni}`.toLowerCase();
        matchesUni = text.includes(galleryUniFilter.toLowerCase());
      }

      let matchesUnit = true;
      if (galleryUnitFilter && galleryUnitFilter !== 'ALL') {
        const unitKey = `${unit} ${name}`.toLowerCase();
        matchesUnit = unitKey.includes(galleryUnitFilter.toLowerCase());
      }

      let matchesCap = true;
      if (galleryCapacityFilter && galleryCapacityFilter !== 'ALL') {
        matchesCap = cap === Number(galleryCapacityFilter);
      }

      let matchesCategory = true;
      if (galleryCategoryFilter && galleryCategoryFilter !== 'ALL') {
        const allText = `${name} ${desc} ${uni} ${unit}`.toLowerCase();
        if (galleryCategoryFilter === 'RU') {
          matchesCategory = allText.includes('রাবি') || allText.includes('রাজশাহী') || allText.includes('ru');
        } else if (galleryCategoryFilter === 'GST') {
          matchesCategory = allText.includes('গুচ্ছ') || allText.includes('gst');
        } else if (galleryCategoryFilter === 'DU') {
          matchesCategory = allText.includes('ঢাবি') || allText.includes('ঢাকা') || allText.includes('du');
        } else if (galleryCategoryFilter === 'CU') {
          matchesCategory = allText.includes('চবি') || allText.includes('চট্টগ্রাম') || allText.includes('cu');
        } else if (galleryCategoryFilter === 'ENGG') {
          matchesCategory = allText.includes('বুয়েট') || allText.includes('buet') || allText.includes('প্রকৌশল') || allText.includes('eng');
        } else if (galleryCategoryFilter === 'MED') {
          matchesCategory = allText.includes('মেডিকেল') || allText.includes('mbbs') || allText.includes('ডেন্টাল');
        } else if (galleryCategoryFilter === '45_SEAT') {
          matchesCategory = cap === 45;
        } else if (galleryCategoryFilter === '40_SEAT') {
          matchesCategory = cap === 40;
        }
      }

      return matchesSearch && matchesUni && matchesUnit && matchesCap && matchesCategory;
    })
    .sort((a, b) => {
      const capA = Number(a?.totalSeats || a?.total_seats || 45);
      const capB = Number(b?.totalSeats || b?.total_seats || 45);
      if (gallerySortBy === 'seats_desc') return capB - capA;
      if (gallerySortBy === 'seats_asc') return capA - capB;
      if (gallerySortBy === 'name') return (a?.name || '').localeCompare(b?.name || '');
      return (b?.id || 0) > (a?.id || 0) ? 1 : -1;
    });


  // Luxury High-Contrast Full-Page Print Seat Renderer with Large Fonts & Generous Gap Separation
  function renderPrintSeat(cell?: SeatCell, defaultFare = 500, segment?: FareRangeSegment) {
    if (!cell || cell.type === 'EMPTY' || cell.type === 'AISLE') {
      return <div className="flex-1 h-14" />;
    }
    const fare = cell.baseFare || segment?.fare || defaultFare;
    const segColorCfg = segment ? COLOR_OPTIONS.find(c => c.id === segment.color) : undefined;

    return (
      <div
        className={`flex-1 h-14 px-2 py-1.5 rounded-2xl border-2 flex flex-col items-center justify-between shadow-2xs ${
          cell.genderRule === 'FEMALE_ONLY'
            ? 'bg-pink-50 border-pink-600 text-pink-950'
            : cell.genderRule === 'MALE_ONLY'
            ? 'bg-blue-50 border-blue-600 text-blue-950'
            : cell.isExtra
            ? 'bg-purple-50 border-purple-600 text-purple-950'
            : segColorCfg
            ? `${segColorCfg.borderClass} ${segColorCfg.bgClass} ${segColorCfg.textClass}`
            : 'bg-white border-slate-700 text-slate-900'
        }`}
      >
        {/* Top Headrest Cushion Accent */}
        <div
          className={`w-12 h-1.5 rounded-full shadow-2xs ${
            cell.genderRule === 'FEMALE_ONLY'
              ? 'bg-pink-600'
              : cell.genderRule === 'MALE_ONLY'
              ? 'bg-blue-600'
              : cell.isExtra
              ? 'bg-purple-600'
              : segColorCfg
              ? segColorCfg.dotClass
              : 'bg-slate-500'
          }`}
        />

        {/* Large Bold Seat Number */}
        <div className="flex items-center justify-center gap-1.5 leading-none w-full my-0.5">
          <span className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-950">
            {cell.seatNumber}
          </span>
          {cell.genderRule === 'FEMALE_ONLY' && (
            <span className="text-[10px] text-pink-800 font-black leading-none bg-pink-200 border border-pink-400 px-1 py-0.5 rounded">F</span>
          )}
          {cell.genderRule === 'MALE_ONLY' && (
            <span className="text-[10px] text-blue-800 font-black leading-none bg-blue-200 border border-blue-400 px-1 py-0.5 rounded">M</span>
          )}
        </div>

        {/* Large High-Contrast Fare Amount */}
        <div className="w-full text-center bg-white/95 border border-slate-400 rounded-lg py-0.5 shadow-2xs">
          <span className="text-xs sm:text-sm font-mono font-black text-slate-950 leading-none">
            ৳{fare}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16" suppressHydrationWarning>
      {/* ========================================================================= */}
      {/* FULL-PAGE LUXURY 100% SINGLE-PAGE A4 PRINT MANIFEST (EXPANDED & DISTINCT GAPS) */}
      {/* ========================================================================= */}
      <div className="a4-print-sheet hidden print:block bg-white text-slate-900 font-sans w-full">
        {/* Clean University Header */}
        <div className="border-b-4 border-slate-950 pb-2 mb-3 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-none">
            {targetUniversity}
          </h1>

          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white font-mono text-sm font-black px-4 py-1 rounded-xl shadow-xs">
              {totalAllSeats} সিট ({capacityInput} সিট কোচ)
            </span>
          </div>
        </div>

        {/* Full-Page Width Luxury Coach Chassis */}
        <div className="border-4 border-slate-950 rounded-3xl p-3.5 bg-slate-50/60 w-full shadow-lg">
          {/* Panoramic Windshield & Cockpit */}
          <div className="border-b-3 border-dashed border-slate-300 pb-2.5 mb-3">
            <div className="h-4.5 bg-gradient-to-r from-sky-950 via-blue-900 to-sky-950 text-sky-100 rounded-t-xl text-center text-xs font-mono font-black tracking-widest flex items-center justify-center mb-1.5 shadow-inner">
              FRONT PANORAMIC WINDSHIELD GLASS
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-2 flex items-center justify-between text-xs font-bold shadow-sm">
              <span className="bg-emerald-900/90 border border-emerald-500 px-3 py-1 rounded-lg text-emerald-200 flex items-center gap-1">
                🚪 বাসের গেট (ENTRY)
              </span>
              <span className="bg-slate-800 border border-slate-600 px-3 py-1 rounded-lg font-mono text-amber-300">
                🚌 ইঞ্জিন বনেট
              </span>
              <span className="bg-blue-900/90 border border-blue-500 px-3 py-1 rounded-lg text-blue-200 flex items-center gap-1">
                ✇ ড্রাইভার কেবিন (DRIVER)
              </span>
            </div>
          </div>

          {/* 11 Rows Seating Grid (Generous Gaps +2px: gap-[22px] horizontally, space-y-4 vertically) */}
          <div className="space-y-4">
            {Array.from({ length: totalRows }).map((_, r) => {
              const rowCells = cells.filter(c => c.rowIndex === r);
              const isLastRow = r === totalRows - 1;
              const rowLabel = rowLetters[r] || `R${r + 1}`;
              const rowSegment = getSegmentForRow(rowLabel);
              const rowPrice = rowSegment?.fare || 500;

              return (
                <div key={r} className="flex items-center justify-between gap-[22px]">
                  {/* Left 2 seats (Distinctly Separated with gap-[22px]) */}
                  <div className="flex items-center gap-[22px] flex-1">
                    {renderPrintSeat(rowCells.find(c => c.colIndex === 0), rowPrice, rowSegment)}
                    {renderPrintSeat(rowCells.find(c => c.colIndex === 1), rowPrice, rowSegment)}
                  </div>

                  {/* Middle Aisle or K3 Center Seat (Wider Aisle Separation mx-[14px]) */}
                  <div className="w-20 h-14 text-center font-mono flex items-center justify-center shrink-0 mx-[14px]">
                    {isLastRow && (capacityInput === 45 || capacityInput === 42) ? (
                      renderPrintSeat(rowCells.find(c => c.colIndex === 2), rowPrice, rowSegment)
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200/90 border-2 border-slate-300 rounded-2xl shadow-2xs">
                        <span className="text-base font-black text-slate-950 leading-tight">
                          Row {rowLabel}
                        </span>
                        {rowSegment && (
                          <span className="text-xs font-black font-mono text-blue-900 leading-none mt-0.5">
                            ৳{rowSegment.fare}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right 2 seats (Distinctly Separated with gap-[22px]) */}
                  <div className="flex items-center gap-[22px] flex-1">
                    {renderPrintSeat(rowCells.find(c => c.colIndex === 3), rowPrice, rowSegment)}
                    {renderPrintSeat(rowCells.find(c => c.colIndex === 4), rowPrice, rowSegment)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extra Seats Section */}
          {extraSeats.length > 0 && (
            <div className="mt-3.5 pt-3 border-t-3 border-dashed border-purple-400 flex items-center justify-center gap-3.5 bg-purple-50/80 p-2.5 rounded-2xl">
              <span className="text-sm font-black text-purple-950 mr-2">অতিরিক্ত সিট:</span>
              <div className="flex items-center gap-3.5 flex-wrap">
                {extraSeats.map((ex) => (
                  <div key={ex.seatNumber} className="w-24">
                    {renderPrintSeat(ex, ex.baseFare || 450)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE WEB BUILDER VIEW (HIDDEN DURING PRINT) */}
      {/* ========================================================================= */}
      <div className="screen-only space-y-6">
        {/* Top Header with Create New Layout, Print, Tab Switcher & Save Button */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          {activeTab === 'gallery' ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  {language === 'bn' ? 'সংরক্ষিত লেআউট ডাটাবেজ' : 'Saved Layouts Archive'}
                </span>
                <Badge variant="primary" className="text-xs px-3 py-1 font-bold">
                  {uniqueSavedLayouts.length} {language === 'bn' ? 'টি লেআউট সংরক্ষিত' : 'Layouts Saved'}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {language === 'bn' ? '📁 সংরক্ষিত বাস লেআউট গ্যালারি' : 'Saved Bus Layouts Gallery'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn' 
                  ? 'পূর্বে সংরক্ষিত লেআউটসমূহ দেখুন, এডিট করুন বা নতুন লেআউট তৈরি করুন।' 
                  : 'Manage and load your saved bus seat layouts.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  {language === 'bn' ? 'কাস্টম সিট বিল্ডার' : 'Custom Seat Builder'}
                </span>
                <Badge variant="primary" className="text-xs px-3 py-1 font-bold">
                  {totalAllSeats} {t.seatsTotal} ({totalMainSeats} Main + {extraSeats.length} Extra)
                </Badge>
                {admissionUnit && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${getUnitBadgeStyle(admissionUnit)}`}>
                    🎓 {admissionUnit}{unitDiscipline && unitDiscipline !== 'None' && !admissionUnit.toLowerCase().includes(unitDiscipline.toLowerCase().split(' ')[0]) ? ` (${unitDiscipline.split(' ')[0]})` : ''}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {layoutName || (language === 'bn' ? 'কাস্টম বাস সিট লেআউট' : 'Custom Bus Seat Layout')}
              </h1>
              {(targetUniversity || examName) && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {targetUniversity && <span className="font-bold text-slate-700 dark:text-slate-300">🏛️ {targetUniversity}</span>}
                  {targetUniversity && examName && <span>•</span>}
                  {examName && <span className="font-bold text-purple-600 dark:text-purple-400">📝 {examName}</span>}
                </div>
              )}
            </div>
          )}

        {/* Floating Toast Notification */}
        {toastNotification.show && (
          <div
            className={`no-print fixed top-6 right-6 z-50 max-w-md p-4 rounded-3xl shadow-2xl border-2 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 ${
              toastNotification.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-500 shadow-emerald-950/50'
                : toastNotification.type === 'error'
                ? 'bg-rose-950 text-white border-rose-500 shadow-rose-950/50'
                : 'bg-slate-900 text-white border-blue-500 shadow-slate-950/50'
            }`}
          >
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : toastNotification.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {toastNotification.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : toastNotification.type === 'error' ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-black tracking-tight">{toastNotification.title}</h4>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                {toastNotification.message}
              </p>
            </div>
            <button
              onClick={() => setToastNotification(prev => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons: Create New Layout and Save */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handleStartNewLayout}
            className="font-bold border-2 border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl px-4 py-2"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {language === 'bn' ? '+ নতুন লেআউট' : '+ Create Layout'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsSaveModalOpen(true)}
            isLoading={isSaving}
            className="font-bold shadow-lg shadow-blue-500/25 px-6 rounded-2xl text-sm py-2"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {editingExistingLayoutId ? (language === 'bn' ? 'আপডেট করুন' : 'Update') : (language === 'bn' ? 'লেআউট সেভ করুন' : 'Save Layout')}
          </Button>
        </div>
      </div>

      {/* Mode Status Banner if editing an existing layout */}
      {editingExistingLayoutId && (
        <div className="hidden no-print bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              {language === 'bn' ? `আপনি বর্তমানে "${layoutName}" লেআউটটি এডিট করছেন। এডিট শেষে উপরে "আপডেট করুন" এ চাপুন।` : `Currently editing "${layoutName}". Click "Update" to save.`}
            </span>
          </div>
          <button
            onClick={handleStartNewLayout}
            className="text-xs font-black underline hover:text-amber-700 ml-3"
          >
            {language === 'bn' ? 'নতুন লেআউটে যান' : 'Switch to New'}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="no-print flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Switcher: Builder vs Full-Width Gallery */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'builder'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{language === 'bn' ? '🛠 লেআউট বিল্ডার ও ক্যানভাস' : 'Seat Layout Builder'}</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'gallery'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>{language === 'bn' ? '📁 সংরক্ষিত লেআউট গ্যালারি' : 'Saved Layouts Gallery'}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-700/80 text-white font-bold">
            {savedLayouts.length}
          </span>
        </button>
      </div>

      {activeTab === 'builder' ? (
        <>
          {/* 1. SEAT CAPACITY SWITCHER (PROMINENT 40 VS 45 SEATS CHOICE) */}
          <Card className="no-print shadow-2xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base sm:text-lg font-black">
                    {language === 'bn' ? 'বাসের ধারণক্ষমতা ও সিট সংখ্যা নির্বাচন করুন (৪০ সিট বনাম ৪৫ সিট)' : 'Select Seating Capacity (40 Seats vs 45 Seats)'}
                  </CardTitle>
                </div>
                <Badge variant="primary" className="text-xs font-bold px-3 py-1">
                  {capacityInput} {language === 'bn' ? 'সিট সক্রিয়' : 'Seats Active'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {capacityOptions.map((opt) => {
                  const isSelected = capacityInput === opt.capacity;
                  return (
                    <button
                      key={opt.capacity}
                      type="button"
                      onClick={() => generateDynamicLayout(opt.capacity)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 shadow-md ring-2 ring-blue-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.capacity === 45 && (
                        <span className="absolute top-3 right-3 text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md uppercase font-mono">
                          ★ Most Popular
                        </span>
                      )}
                      {opt.capacity === 40 && (
                        <span className="absolute top-3 right-3 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase font-mono">
                          Standard 2+2
                        </span>
                      )}

                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {language === 'bn' ? opt.titleBn : opt.titleEn}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {opt.rowsDesc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. UNIVERSITY PRESET PICKER CARD WITH EDIT & ADD BUTTONS - Hiding based on user instruction */}
          <Card className="hidden no-print shadow-2xs border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>{language === 'bn' ? 'টার্গেট বিশ্ববিদ্যালয় প্রিসেট সিলেক্টর (Target University):' : 'Select Target University Layout:'}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddUni}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {language === 'bn' ? '+ নতুন ভার্সিটি প্রিসেট' : '+ Add University Preset'}
                  </button>
                  <Badge variant="primary" className="text-[10px] font-bold">
                    {language === 'bn' ? 'বুকিং এর জন্য প্রস্তুত' : 'Ready for Booking'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {universityPresets.map((uni) => {
                  const isSelected = targetUniversity === uni.name;
                  return (
                    <div
                      key={uni.id}
                      onClick={() => handleSelectUniversity(uni)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="leading-none">{uni.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {uni.capacity} সিট
                      </span>

                      {/* Edit Preset Name Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditUni(e, uni)}
                        className={`p-1 rounded-lg hover:scale-110 transition-all ${isSelected ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400'}`}
                        title={language === 'bn' ? 'প্রিসেট নাম ও তথ্য এডিট করুন' : 'Edit University Preset'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {universityPresets.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUniPreset(e, uni.id)}
                          className={`p-1 rounded-lg hover:scale-110 transition-all ${isSelected ? 'hover:bg-blue-700 text-rose-200' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600'}`}
                          title="Delete Preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Custom Layout Name & Description Input Card - Hiding based on user instruction */}
          <Card className="hidden no-print shadow-2xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'লেআউটের নাম (যেমন: RU Special 45-Seat)' : 'Custom Layout Name'}
                  </label>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'bn' ? 'বিবরণ / নোট (Description)' : 'Description / Notes'}
                  </label>
                  <input
                    type="text"
                    value={layoutDescription}
                    onChange={(e) => setLayoutDescription(e.target.value)}
                    placeholder="e.g. VIP front seats and rear economy"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. DYNAMIC FARE RANGES & COLOR SEGMENTATION MANAGER (A–E, F–H, I–J, K) */}
          <Card className="no-print shadow-xs border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base font-black">
                    {language === 'bn' ? 'সারি ভিত্তিক ভাড়া সেগমেন্টেশন ও কালার কোডিং' : 'Row Fare Range & Color Segmentation'}
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'A–E, F–H, I–J, K সহ যেকোনো সারি রেঞ্জে নিজের মতো ভাড়া বসান, এডিট বা ডিলিট করুন। লেআউটে নির্দিষ্ট কালারে বড় ফন্টে ফুটে উঠবে।'
                    : 'Define custom fare and color for any row range (e.g. A-E, F-H, I-J, K). Edit or delete ranges anytime.'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddSegment}
                className="text-xs font-bold border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {language === 'bn' ? '+ নতুন ভাড়া রেঞ্জ যোগ করুন' : '+ Add Fare Range'}
              </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {segments.map((seg) => {
                  const colorCfg = COLOR_OPTIONS.find(c => c.id === seg.color) || COLOR_OPTIONS[0];
                  return (
                    <div
                      key={seg.id}
                      className={`p-3.5 rounded-2xl border-2 ${colorCfg.borderClass} bg-gradient-to-br ${colorCfg.bgClass} flex flex-col justify-between gap-3 shadow-2xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.dotClass}`} />
                            <span className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                              {seg.name}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 block">
                            {language === 'bn' ? `সারি ${seg.startRow} থেকে ${seg.endRow}` : `Rows ${seg.startRow} to ${seg.endRow}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditSegment(seg)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Range"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSegment(seg.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Range"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          {language === 'bn' ? 'নির্ধারিত ভাড়া:' : 'Assigned Fare:'}
                        </span>
                        <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                          ৳{seg.fare}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 5. Main Canvas Grid: Realistic Bus View + Inspector with Submit Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Realistic Bus Visual Frame Canvas with LARGER FONTS, BIG COCKPIT & CLEAR AMOUNT BADGES */}
            <Card className="lg:col-span-2 shadow-xs border-slate-200 dark:border-slate-800 print-bus-frame">
              <CardHeader className="no-print flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <CardTitle className="text-lg font-black">
                    {language === 'bn' ? 'রিয়েলিস্টিক বাস কেবিন ও সিট প্ল্যান' : 'Realistic Bus Cabin & Floor Matrix'}
                  </CardTitle>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {totalRows} Rows × {totalCols} Cols | {totalMainSeats} Main Seats {extraSeats.length > 0 && `+ ${extraSeats.length} Extra`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Print Layout A4 Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintLayout}
                    className="text-xs font-black border-blue-200 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-800 shadow-2xs rounded-xl"
                    title="Print or Save as A4 PDF"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    {language === 'bn' ? '🖨️ প্রিন্ট লেআউট (A4)' : '🖨️ Print Layout (A4)'}
                  </Button>

                  {extraSeats.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndoExtraSeat}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl"
                      title="Undo last extra seat"
                    >
                      <Undo2 className="w-3.5 h-3.5 mr-1" />
                      {language === 'bn' ? 'আনডু' : 'Undo'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddExtraSeat}
                    className="text-xs font-bold border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? '+ অতিরিক্ত সিট' : '+ Extra Seat'}
                  </Button>

                  {/* Primary Save Button right next to + অতিরিক্ত সিট */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSaveModalOpen(true)}
                    isLoading={isSaving}
                    className="font-black text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 rounded-xl px-4 py-2"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {editingExistingLayoutId
                      ? (language === 'bn' ? 'আপডেট করুন (Save)' : 'Update Layout')
                      : (language === 'bn' ? '💾 লেআউট সেভ করুন' : 'Save Layout')}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-100/70 dark:bg-slate-950/70 overflow-x-auto min-h-[600px] print:p-0 print:bg-white print:min-h-0 print:overflow-visible">
                {/* REALISTIC HIGH-DECK COACH FRAME */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-9 rounded-[3.5rem] border-4 border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl relative print:p-3 print:border-2 print:border-black print:rounded-2xl print:max-w-md print:shadow-none print:mx-auto">
                  
                  {/* Bus Exterior Roof Marker & Mirrors */}
                  <div className="no-print absolute -top-3.5 left-12 right-12 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-t-2xl opacity-70" />
                  <div className="no-print absolute -left-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-l-md shadow-xs" title="Left Rearview Mirror" />
                  <div className="no-print absolute -right-3.5 top-10 w-3 h-12 bg-slate-400 dark:bg-slate-600 rounded-r-md shadow-xs" title="Right Rearview Mirror" />

                  {/* COCKPIT SECTION: Bonnet Engine Grill + Front Windshield + Driver Cabin + Door Steps */}
                  <div className="mb-5 pb-3.5 border-b-2 border-dashed border-slate-200 dark:border-slate-800 print:mb-2 print:pb-2">
                    {/* Windshield Glass */}
                    <div className="h-6 sm:h-7 bg-blue-100/80 dark:bg-blue-950/60 rounded-t-2xl border-t-2 border-blue-300 dark:border-blue-800 mb-2.5 flex items-center justify-center print:h-4 print:mb-1.5">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 font-mono print:text-[10px]">
                        {language === 'bn' ? 'সামনের উইন্ডশিল্ড গ্লাস' : 'FRONT WINDSHIELD GLASS'}
                      </span>
                    </div>

                    {/* Dashboard & Cockpit: Medium-large, comfortable, legible Door, Bonnet, and Driver Cabins */}
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-white shadow-inner relative overflow-hidden print:p-2 print:rounded-xl">
                      {/* Left: Passenger Entry Door / Gate */}
                      <div className="flex items-center gap-2.5 bg-emerald-950 border-2 border-emerald-500/80 px-3.5 py-2 rounded-xl shadow-md print:px-2 print:py-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0 print:hidden" />
                        <div>
                          <div className="text-xs sm:text-sm font-black text-emerald-400 leading-tight print:text-xs">
                            {language === 'bn' ? 'বাসের গেট' : 'ENTRY DOOR'}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-emerald-300 font-bold leading-none mt-0.5">
                            {language === 'bn' ? 'প্রবেশদ্বার (Entry)' : 'Entry Gate'}
                          </div>
                        </div>
                      </div>

                      {/* Center: Bonnet / Engine Hood */}
                      <div className="text-center px-3.5 py-1.5 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-md print:px-2 print:py-0.5">
                        <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wide print:text-[10px]">
                          {language === 'bn' ? 'বনেট / ইঞ্জিন' : 'ENGINE BONNET'}
                        </div>
                        <div className="text-[9px] text-slate-300 font-bold mt-0.5 print:hidden">Front Chassis</div>
                      </div>

                      {/* Right: Driver Cabin & Steering Wheel */}
                      <div className="flex items-center gap-2.5 bg-blue-950 border-2 border-blue-500/80 px-3.5 py-2 rounded-xl text-right shadow-md print:px-2 print:py-1">
                        <div>
                          <div className="text-xs sm:text-sm font-black text-blue-400 leading-tight print:text-xs">
                            {language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-blue-300 font-bold leading-none mt-0.5">
                            {language === 'bn' ? 'কন্ট্রোল (Cockpit)' : 'Cockpit'}
                          </div>
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600/50 border-2 border-blue-300 flex items-center justify-center text-xs font-black text-blue-100 print:w-4 print:h-4 print:text-[9px]">
                          ✇
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REALISTIC SEATING GRID WITH EXTRA LARGE SEAT BOXES & ENLARGED MIDDLE AISLE BADGES */}
                  <div className="space-y-3.5 print:space-y-1.5">
                    {Array.from({ length: totalRows }).map((_, r) => {
                      const rowCells = cells.filter(c => c.rowIndex === r);
                      const isLastRow = r === totalRows - 1;
                      const rowLabel = rowLetters[r] || `R${r + 1}`;
                      const rowSegment = getSegmentForRow(rowLabel);

                      return (
                        <div key={r} className="flex items-center justify-between gap-3 print:gap-1.5">
                          {/* Left Seats: Col 0 & Col 1 */}
                          <div className="flex items-center gap-2.5 print:gap-1.5">
                            {renderRealisticSeat(rowCells.find(c => c.colIndex === 0), false, rowSegment)}
                            {renderRealisticSeat(rowCells.find(c => c.colIndex === 1), false, rowSegment)}
                          </div>

                          {/* Middle Aisle Walkway OR 45-Seat Middle Seat (K3 on Row K) - ENLARGED & CLEAR */}
                          <div className="flex-1 text-center font-mono flex items-center justify-center">
                            {isLastRow && (capacityInput === 45 || capacityInput === 42) ? (
                              renderRealisticSeat(rowCells.find(c => c.colIndex === 2), true, rowSegment)
                            ) : (
                              <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[3.75rem] print:px-1.5 print:py-0.5 print:min-w-[2.5rem] print:rounded-lg">
                                <span className="text-sm sm:text-base font-black tracking-wider text-slate-800 dark:text-slate-100 leading-none print:text-xs">
                                  {rowLabel}
                                </span>
                                {rowSegment && (
                                  <span className="text-[11px] font-black font-mono text-blue-600 dark:text-blue-400 mt-1 leading-none print:text-[9px] print:mt-0.5">
                                    ৳{rowSegment.fare}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Seats: Col 3 & Col 4 */}
                          <div className="flex items-center gap-2.5 print:gap-1.5">
                            {renderRealisticSeat(rowCells.find(c => c.colIndex === 3), false, rowSegment)}
                            {renderRealisticSeat(rowCells.find(c => c.colIndex === 4), false, rowSegment)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rear Passenger Bench Notice */}
                  <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono font-black print:mt-2 print:pt-1 print:text-[10px]">
                    {capacityInput === 45
                      ? (language === 'bn' ? '★ ৪৫ সিট: শেষ সারিতে ৫টি সিট (K1, K2, K3 মাঝে, K4, K5)' : '★ 45-Seat: 5 Seats on Row K with K3 in Center Walkway')
                      : capacityInput === 40
                      ? (language === 'bn' ? '★ ৪০ সিট: ১০ সারি × ৪ সিট (২+২ স্ট্যান্ডার্ড)' : '★ 40-Seat: 10 Rows of 4 (2+2)')
                      : t.rearSeats}
                  </div>

                  {/* OVERLOAD / EXTRA SEATS SECTION WITH INDIVIDUAL REMOVE */}
                  {extraSeats.length > 0 && (
                    <div className="mt-5 pt-4 border-t-2 border-indigo-300 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs sm:text-sm font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>{language === 'bn' ? 'অতিরিক্ত / ওভারলোড সিট' : 'Extra Seats'} ({extraSeats.length})</span>
                        </span>

                        <div className="no-print flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold hidden sm:inline">
                            {language === 'bn' ? 'সিটে ক্লিক করে ভাড়া/নাম পরিবর্তন ও ✕ এ মুছুন' : 'Click seat to edit'}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => setIsSaveModalOpen(true)}
                            isLoading={isSaving}
                            className="text-xs font-black bg-blue-600 hover:bg-blue-700 rounded-xl py-1 px-3 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            {language === 'bn' ? '💾 লেআউট সেভ' : 'Save Layout'}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {extraSeats.map((extra) => (
                          <div key={extra.id || extra.seatNumber} className="relative group">
                            {renderRealisticSeat(extra)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSingleExtraSeat(extra);
                              }}
                              className="no-print absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-md hover:bg-rose-700 transition-all z-20 cursor-pointer"
                              title={language === 'bn' ? 'এই এক্সট্রা সিটটি মুছুন' : 'Remove this extra seat'}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Printable A4 Footer Signature */}
                  <div className="hidden print-only mt-3 pt-2 border-t border-slate-400 flex items-center justify-between text-[10px] text-slate-800 font-bold">
                    <span>অফিস কপি / কাউন্টার রেকর্ড</span>
                    <span>কাউন্টার ইনচার্জ স্বাক্ষর: ____________________</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Selected Cell Inspector with Explicit SUBMIT / APPLY BUTTON */}
            <div className="no-print space-y-6 lg:col-span-1">
              <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black">
                      {language === 'bn' ? 'সিট এডিটর ও সাবমিট' : 'Seat Inspector & Submit'}
                    </CardTitle>
                    {selectedCell && (
                      <Badge variant={selectedCell.isExtra ? 'purple' : 'primary'} className="font-mono font-bold text-xs px-2.5 py-0.5">
                        {selectedCell.isExtra ? 'EXTRA SEAT' : `Row ${selectedCell.rowIndex + 1} : Col ${selectedCell.colIndex + 1}`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {selectedCell ? (
                    <form onSubmit={handleApplyInspectorSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'bn' ? 'সিট নম্বর / লেবেল' : 'Seat Label'}
                        </label>
                        <input
                          type="text"
                          value={selectedCell.seatNumber}
                          onChange={(e) => handleUpdateSelectedCell({ seatNumber: e.target.value.toUpperCase() })}
                          disabled={selectedCell.type !== 'SEAT'}
                          className="w-full px-3.5 py-2 font-black font-mono text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      {selectedCell.type === 'SEAT' && (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              {language === 'bn' ? 'সিটের ভাড়া (Seat Fare ৳)' : 'Seat Fare (৳)'}
                            </label>
                            <input
                              type="number"
                              value={selectedCell.baseFare || 500}
                              onChange={(e) => handleUpdateSelectedCell({ baseFare: Number(e.target.value) })}
                              className="w-full text-base font-black font-mono px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              {language === 'bn' ? 'সিটের লিঙ্গ নীতি (Gender Policy)' : 'Gender Policy'}
                            </label>
                            <select
                              value={selectedCell.genderRule}
                              onChange={(e) => handleUpdateSelectedCell({ genderRule: e.target.value as any })}
                              className="w-full text-xs px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="ANY">{language === 'bn' ? 'যে কেউ বসতে পারবে (Any Gender)' : 'Any Gender (Standard)'}</option>
                              <option value="FEMALE_ONLY">{language === 'bn' ? 'শুধু মেয়ে শিক্ষার্থী (Female Only)' : 'Female Only Reserved'}</option>
                              <option value="MALE_ONLY">{language === 'bn' ? 'শুধু ছেলে শিক্ষার্থী (Male Only)' : 'Male Only Reserved'}</option>
                            </select>
                          </div>

                          {/* SUBMIT / APPLY BUTTON */}
                          <div className="pt-2 flex flex-col gap-2">
                            <Button
                              variant="primary"
                              size="md"
                              type="submit"
                              className="w-full font-black text-sm shadow-md shadow-blue-500/20 rounded-xl"
                            >
                              <Check className="w-4 h-4 mr-1.5" />
                              {language === 'bn' ? 'সিটের তথ্য প্রয়োগ / সাবমিট করুন' : 'Submit & Apply Seat'}
                            </Button>

                            {cellFormApplied && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {language === 'bn' ? 'সিটের তথ্য আপডেট হয়েছে!' : 'Seat info updated!'}
                              </span>
                            )}

                            {selectedCell.isExtra && (
                              <Button
                                variant="danger"
                                size="sm"
                                type="button"
                                onClick={() => handleRemoveSingleExtraSeat(selectedCell.seatNumber)}
                                className="w-full font-bold rounded-xl mt-1"
                              >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                {language === 'bn' ? 'এই অতিরিক্ত সিটটি মুছুন (Delete)' : 'Remove Extra Seat'}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </form>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      <Info className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      {language === 'bn'
                        ? 'সিটের নাম বা ব্যক্তিগত ভাড়া পরিবর্তন করতে যেকোনো সিটের উপর ক্লিক করুন এবং সাবমিট বাটনে চাপুন।'
                        : 'Click on any seat to inspect or customize its label, individual fare, and submit changes.'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* FULL-WIDTH DEDICATED SAVED UNIVERSITY LAYOUTS GALLERY (ORGANIZED & SLEEK) */
        <div className="space-y-6">
          {/* 1. Summary KPI Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {language === 'bn' ? 'মোট সংরক্ষিত লেআউট' : 'Total Saved Layouts'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {uniqueSavedLayouts.length}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {language === 'bn' ? '৪৫-সিটের স্পেশাল কোচ' : '45-Seat Coaches'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {uniqueSavedLayouts.filter(l => (l.totalSeats || l.total_seats) === 45).length}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {language === 'bn' ? '৪০-সিটের স্ট্যান্ডার্ড কোচ' : '40-Seat Coaches'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {uniqueSavedLayouts.filter(l => (l.totalSeats || l.total_seats) === 40).length}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {language === 'bn' ? 'কভারেজ বিশ্ববিদ্যালয়' : 'Target Universities'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {new Set(uniqueSavedLayouts.map(l => l.university).filter(Boolean)).size || '৫+'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Controls & Advanced Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            {/* Row 1: Search Box & View Mode Switcher */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1 shadow-inner">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder={language === 'bn' ? 'নাম, বিশ্ববিদ্যালয়, ইউনিট বা পরীক্ষা দিয়ে খুঁজুন...' : 'Search by layout name, university, unit, or exam...'}
                  className="w-full text-xs sm:text-sm bg-transparent border-none font-bold focus:outline-none text-slate-900 dark:text-white placeholder:font-normal"
                />
                {gallerySearch && (
                  <button type="button" onClick={() => setGallerySearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Switcher & Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setGalleryViewMode('grid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      galleryViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="কার্ড ভিউ"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'কার্ড ভিউ' : 'Cards'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryViewMode('table')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      galleryViewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="টেবিল ভিউ"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'লিস্ট ভিউ' : 'Table'}</span>
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isRefreshingGallery}
                  onClick={handleRefreshSavedLayouts}
                  className="font-bold rounded-2xl px-3 py-2 cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                  title="গ্যালারি রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGallery ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartNewLayout}
                  className="font-bold rounded-2xl px-4 py-2 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নতুন লেআউট' : 'New Layout'}</span>
                </Button>
              </div>
            </div>

            {/* Row 2: Advanced Dropdown Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {/* 1. University Dropdown Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'বিশ্ববিদ্যালয় ফিল্টার:' : 'University Filter:'}</span>
                </label>
                <select
                  value={galleryUniFilter}
                  onChange={(e) => setGalleryUniFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">🏛️ সকল বিশ্ববিদ্যালয় (All)</option>
                  <option value="RU">🏛️ রাজশাহী বিশ্ববিদ্যালয় (RU)</option>
                  <option value="GST">🌐 জিএসটি গুচ্ছ (GST)</option>
                  <option value="DU">🏛️ ঢাকা বিশ্ববিদ্যালয় (DU)</option>
                  <option value="CU">🏛️ চট্টগ্রাম বিশ্ববিদ্যালয় (CU)</option>
                  <option value="বুয়েট">⚙️ বুয়েট / ইঞ্জিনিয়ারিং</option>
                  <option value="মেডিকেল">🩺 মেডিকেল ভর্তি পরীক্ষা</option>
                  {availableUniversitiesForFilter.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* 2. Admission Unit Dropdown Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BadgePercent className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'bn' ? 'ভর্তি ইউনিট ফিল্টার:' : 'Admission Unit:'}</span>
                </label>
                <select
                  value={galleryUnitFilter}
                  onChange={(e) => setGalleryUnitFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">🎓 সকল ইউনিট (All Units)</option>
                  <option value="Unit A">Unit A (বিজ্ঞান)</option>
                  <option value="Unit B">Unit B (মানবিক)</option>
                  <option value="Unit C">Unit C (বাণিজ্য)</option>
                  <option value="ক-ইউনিট">ক-ইউনিট (বিজ্ঞান)</option>
                  <option value="খ-ইউনিট">খ-ইউনিট (মানবিক)</option>
                  <option value="গ-ইউনিট">গ-ইউনিট (বাণিজ্য)</option>
                  <option value="+">মাল্টি-ইউনিট কম্বাইন্ড (+)</option>
                </select>
              </div>

              {/* 3. Capacity Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'bn' ? 'সিট ধারণক্ষমতা ফিল্টার:' : 'Seat Capacity:'}</span>
                </label>
                <select
                  value={galleryCapacityFilter}
                  onChange={(e) => setGalleryCapacityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">🚌 সকল সিট সংখ্যা (All)</option>
                  <option value="45">৪৫ সিট বিশিষ্ট কোচ</option>
                  <option value="40">৪০ সিট বিশিষ্ট কোচ</option>
                  <option value="36">৩৬ সিট বিশিষ্ট কোচ</option>
                  <option value="32">৩২ সিট বিশিষ্ট কোচ</option>
                  <option value="28">২৮ সিট বিশিষ্ট কোচ</option>
                </select>
              </div>

              {/* 4. Sort Order */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'bn' ? 'সাজানোর ক্রম (Sort By):' : 'Sort Order:'}</span>
                </label>
                <select
                  value={gallerySortBy}
                  onChange={(e) => setGallerySortBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="newest">সর্বশেষ সংরক্ষিত (Newest First)</option>
                  <option value="seats_desc">সিট সংখ্যা: বেশি থেকে কম</option>
                  <option value="seats_asc">সিট সংখ্যা: কম থেকে বেশি</option>
                  <option value="name">লেআউট নাম (A থেকে Z)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Category Filter Quick Pills & Reset Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>{language === 'bn' ? 'কুইক ফিল্টার:' : 'Quick:'}</span>
                </span>
                {[
                  { id: 'ALL', labelBn: `সবগুলো (${uniqueSavedLayouts.length})`, labelEn: 'All' },
                  { id: 'RU', labelBn: '🏛️ রাবি (RU)', labelEn: 'Rajshahi (RU)' },
                  { id: 'GST', labelBn: '🌐 গুচ্ছ (GST)', labelEn: 'GST Cluster' },
                  { id: 'DU', labelBn: '🏛️ ঢাবি (DU)', labelEn: 'Dhaka (DU)' },
                  { id: 'CU', labelBn: '🏛️ চবি (CU)', labelEn: 'Chittagong (CU)' },
                  { id: 'ENGG', labelBn: '⚙️ ইঞ্জিনিয়ারিং / বুয়েট', labelEn: 'Engg / BUET' },
                  { id: 'MED', labelBn: '🩺 মেডিকেল', labelEn: 'Medical' },
                  { id: '45_SEAT', labelBn: '🚌 ৪৫ সিট', labelEn: '45 Seats' },
                  { id: '40_SEAT', labelBn: '🚌 ৪০ সিট', labelEn: '40 Seats' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGalleryCategoryFilter(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      galleryCategoryFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {language === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* Clear / Reset Filters Button */}
              {isAnyGalleryFilterActive && (
                <button
                  type="button"
                  onClick={handleResetGalleryFilters}
                  className="px-3 py-1 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Clear Filters'}</span>
                </button>
              )}
            </div>

            {/* Active Filter Result Summary */}
            <div className="flex items-center justify-between text-xs font-bold px-1 text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {language === 'bn' 
                    ? `ফিল্টার অনুযায়ী মোট ${filteredSavedLayouts.length} টি লেআউট প্রদর্শিত হচ্ছে (মোট ${uniqueSavedLayouts.length} টির মধ্যে)`
                    : `Showing ${filteredSavedLayouts.length} of ${uniqueSavedLayouts.length} layouts`}
                </span>
              </span>
            </div>
          </div>

          {/* 4. Display Content (Cards View vs Table View) */}
          {filteredSavedLayouts.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'কোন সংরক্ষিত বিশ্ববিদ্যালয় লেআউট পাওয়া যায়নি' : 'No saved layouts found'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'bn' ? 'উপরে ফিল্টার পরিবর্তন করুন অথবা "+ নতুন লেআউট" এ ক্লিক করে নতুন লেআউট তৈরি করুন।' : 'Change filters or create a new layout to save.'}
              </p>
              {isAnyGalleryFilterActive && (
                <button
                  type="button"
                  onClick={handleResetGalleryFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold rounded-2xl text-xs border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset All Filters'}</span>
                </button>
              )}
            </Card>
          ) : galleryViewMode === 'table' ? (
            /* Modern Table View */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold">
                      <th className="p-4">{language === 'bn' ? 'লেআউটের নাম ও বিবরণ' : 'Layout Name & Info'}</th>
                      <th className="p-4">{language === 'bn' ? 'বিশ্ববিদ্যালয় ও ইউনিট' : 'University & Unit'}</th>
                      <th className="p-4">{language === 'bn' ? 'সিট ও বাস সংযোগ' : 'Seats & Buses'}</th>
                      <th className="p-4">{language === 'bn' ? 'প্রকৃত ভাড়া' : 'Actual Fare'}</th>
                      <th className="p-4">{language === 'bn' ? 'তৈরির তারিখ' : 'Created Date'}</th>
                      <th className="p-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSavedLayouts.map((layout) => {
                      const uniInfo = getLayoutUniversityDetails(layout);
                      const displayTitle = getCleanLayoutDisplayTitle(layout);
                      const cardUnit = layout.unit || getLayoutUnitBadge(layout);
                      const extraCount = Array.isArray(layout.extraSeats) ? layout.extraSeats.length : 0;
                      const totalSeats = layout.totalSeats || layout.total_seats || 45;
                      const busesCount = layout.assigned_buses_count || layout.assignedBusesCount || 0;
                      const fareSummary = getLayoutFareSummary(layout, language);
                      const createdDate = formatLayoutDate(layout.created_at || layout.createdAt || layout.updated_at, language);

                      return (
                        <tr key={layout.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            <div className="font-black text-sm">{displayTitle}</div>
                            {layout.description && (
                              <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                                {layout.description}
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-slate-400 mt-1">
                              {layout.totalRows || layout.total_rows} সারি × {layout.totalCols || layout.total_cols} কলাম
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl shrink-0">{uniInfo.icon}</span>
                              <div>
                                <div className="font-black text-slate-900 dark:text-white text-sm">
                                  {uniInfo.nameBn}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${uniInfo.badgeBg}`}>
                                    {uniInfo.code}
                                  </span>
                                  {cardUnit && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      📝 {cardUnit}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                                {totalSeats} {language === 'bn' ? 'সিট' : 'Seats'}
                              </span>
                              {extraCount > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded font-bold">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              {busesCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  🚌 {language === 'bn' ? `${toBengaliNumber(busesCount)}টি বাসে সক্রিয়` : `${busesCount} Buses Active`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  🚌 {language === 'bn' ? 'অব্যবহৃত' : 'Unassigned'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              💰 {fareSummary.formatted}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <span>🕒</span>
                              <span>{createdDate}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleLoadAndEditLayout(layout)}
                                className="font-bold text-xs rounded-xl py-1.5 px-3"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                <span>{language === 'bn' ? 'লোড' : 'Load'}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateLayout(layout)}
                                className="font-bold text-xs rounded-xl py-1.5 px-2.5 text-slate-600 dark:text-slate-300"
                                title="ডুপ্লিকেট করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRequestDeleteLayout(layout.id, layout.name)}
                                className="font-bold text-xs rounded-xl py-1.5 px-2.5"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Modern Organized Grid Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSavedLayouts.map((layout) => {
                const uniInfo = getLayoutUniversityDetails(layout);
                const displayTitle = getCleanLayoutDisplayTitle(layout);
                const cardUnit = layout.unit || getLayoutUnitBadge(layout);
                const extraCount = Array.isArray(layout.extraSeats) ? layout.extraSeats.length : 0;
                const totalSeats = layout.totalSeats || layout.total_seats || 45;
                const rows = layout.totalRows || layout.total_rows || 11;
                const cols = layout.totalCols || layout.total_cols || 5;
                const busesCount = layout.assigned_buses_count || layout.assignedBusesCount || 0;
                const fareSummary = getLayoutFareSummary(layout, language);
                const createdDate = formatLayoutDate(layout.created_at || layout.createdAt || layout.updated_at, language);

                return (
                  <div
                    key={layout.id}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Top Decorative Brand Stripe */}
                    <div className={`h-2 w-full ${uniInfo.headerGradient}`} />

                    <div className="p-5 space-y-4">
                      {/* 1. HIGH-IMPACT PROMINENT UNIVERSITY HERO BANNER (Instantly distinguishes Dhaka vs Rajshahi vs CU vs GST) */}
                      <div className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2.5 shadow-xs transition-all ${uniInfo.bannerClass}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0 drop-shadow-xs">{uniInfo.icon}</span>
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {language === 'bn' ? 'নির্ধারিত বিশ্ববিদ্যালয়' : 'Target University'}
                            </div>
                            <div className="text-sm sm:text-base font-black truncate text-slate-900 dark:text-white leading-tight">
                              {uniInfo.nameBn}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 tracking-wider border shadow-xs ${uniInfo.badgeBg}`}>
                          {uniInfo.code}
                        </span>
                      </div>

                      {/* 2. Key Specs Header Strip (Unit, Seats & Assigned Buses) */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* HIGH VISIBILITY EXAM UNIT BADGE */}
                          <span className={`text-xs font-black px-3 py-1 rounded-xl border-2 shadow-xs flex items-center gap-1.5 ${
                            cardUnit
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}>
                            <span className="text-amber-300">📝</span>
                            <span>{cardUnit ? `ইউনিট: ${cardUnit}` : (language === 'bn' ? 'ইউনিট: সাধারণ' : 'Unit: General')}</span>
                          </span>
                          {/* 🚌 Assigned Buses Badge */}
                          {busesCount > 0 ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                              <Bus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{language === 'bn' ? `${toBengaliNumber(busesCount)}টি বাসে সক্রিয়` : `${busesCount} Buses Active`}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <Bus className="w-3.5 h-3.5 text-slate-400" />
                              <span>{language === 'bn' ? 'অব্যবহৃত' : 'Unassigned'}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                          {totalSeats} {language === 'bn' ? 'সিট' : 'Seats'}
                        </span>
                      </div>

                      {/* 3. Clean Layout Title & Description */}
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {displayTitle}
                        </h4>
                        {layout.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {layout.description}
                          </p>
                        )}
                      </div>

                      {/* PROMINENT HIGH VISIBILITY EXAM UNIT BANNER (User Requested) */}
                      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/80 dark:via-slate-900 dark:to-indigo-950/80 border-2 border-indigo-300 dark:border-indigo-700 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <span className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                            {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট:' : 'Admission Exam Unit:'}
                          </span>
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-black px-3.5 py-1 rounded-xl bg-indigo-600 text-white shadow-xs tracking-wider">
                          {cardUnit || (language === 'bn' ? 'সাধারণ (সকল ইউনিট)' : 'General (All Units)')}
                        </span>
                      </div>

                      {/* Visual Mini Bus Blueprint Strip (Visual Layout Architecture) */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Bus className="w-3.5 h-3.5 text-blue-600" />
                            <span>লেআউট আর্কিটেকচার ({rows} সারি × {cols} কলাম):</span>
                          </span>
                          <span className="font-mono">{totalSeats} সিট</span>
                        </div>

                        {/* Mini Schematic Dots Preview */}
                        <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          {/* Cabin / Front Indicator */}
                          <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter shrink-0 pr-1 border-r border-slate-200 dark:border-slate-800">
                            Front
                          </div>

                          {/* Mini rows representation */}
                          <div className="flex items-center justify-around flex-1 px-1">
                            {Array.from({ length: Math.min(rows, 11) }).map((_, rIdx) => {
                              const isRear = rIdx === rows - 1;
                              return (
                                <div key={rIdx} className="flex flex-col gap-0.5 items-center">
                                  <div
                                    className={`w-1.5 h-2 rounded-xs ${
                                      isRear
                                        ? 'bg-slate-500'
                                        : 'bg-blue-500'
                                    }`}
                                    title={`Row ${String.fromCharCode(65 + rIdx)}`}
                                  />
                                  <div
                                    className={`w-1.5 h-2 rounded-xs ${
                                      isRear
                                        ? 'bg-slate-500'
                                        : 'bg-blue-500'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Rear Indicator */}
                          <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter shrink-0 pl-1 border-l border-slate-200 dark:border-slate-800">
                            Back
                          </div>
                        </div>

                        {/* Color legend */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                            <span>সাধারণ আসন</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                            <span>পেছনের বেঞ্চ</span>
                          </span>
                          {extraCount > 0 && (
                            <span className="flex items-center gap-1 text-purple-600 font-bold">
                              <span>+{extraCount} Extra</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specs Row: Created Date & Dynamic Real Fare Range */}
                      <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                          <span>🕒</span>
                          <span title={layout.examName ? `${layout.examName} • তৈরি: ${createdDate}` : `তৈরি: ${createdDate}`}>
                            {language === 'bn' ? `তৈরি: ${createdDate}` : `Created: ${createdDate}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span>💰</span>
                          <span>{fareSummary.formatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer Bar */}
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleLoadAndEditLayout(layout)}
                        className="flex-1 font-bold text-xs rounded-xl shadow-xs py-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>{language === 'bn' ? 'বিল্ডারে লোড করুন' : 'Load & Edit'}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateLayout(layout)}
                        className="font-bold text-xs rounded-xl py-2 px-3 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750"
                        title="ডুপ্লিকেট / কপি তৈরি করুন"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRequestDeleteLayout(layout.id, layout.name)}
                        className="font-bold text-xs rounded-xl py-2 px-3"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Delete Confirmation & Recycle Bin Options Modal */}
      <Modal
        isOpen={Boolean(layoutToDelete)}
        onClose={() => !isDeletingLayout && setLayoutToDelete(null)}
        title={language === 'bn' ? '🗑️ লেআউট মুছে ফেলার ধরণ বেছে নিন' : 'Choose Deletion Method'}
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <Armchair className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'bn' ? 'নির্বাচিত লেআউট' : 'Selected Layout'}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                  {layoutToDelete?.name}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              ID: {layoutToDelete?.id.slice(0, 8)}...
            </Badge>
          </div>

          <div className="space-y-2.5">
            {/* Option 1: Move to Recycle Bin (Recommended) */}
            <div
              onClick={() => setDeleteMode('recycle')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                deleteMode === 'recycle'
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                deleteMode === 'recycle' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-400'
              }`}>
                {deleteMode === 'recycle' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {language === 'bn' ? '🗑️ রিসাইকেল বিনে পাঠান' : 'Move to Recycle Bin'}
                  </span>
                  <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                    {language === 'bn' ? 'সুপারিশকৃত / নিরাপদ' : 'Recommended'}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {language === 'bn'
                    ? 'লেআউটটি রিসাইকেল বিনে জমা থাকবে। এটি সাময়িকভাবে গ্যালারি থেকে সরবে কিন্তু ভবিষ্যতে যেকোনো সময় এক ক্লিকে পুনরুদ্ধার (রিস্টোর) করতে পারবেন।'
                    : 'Safely stores the layout in the Recycle Bin. You can restore it anytime with a single click.'}
                </p>
              </div>
            </div>

            {/* Option 2: Permanent Purge */}
            <div
              onClick={() => setDeleteMode('permanent')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                deleteMode === 'permanent'
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                deleteMode === 'permanent' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-400'
              }`}>
                {deleteMode === 'permanent' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {language === 'bn' ? '⚠️ স্থায়ীভাবে মুছে ফেলুন' : 'Permanently Delete'}
                  </span>
                  <Badge variant="danger" className="text-[10px] py-0 px-1.5 font-bold">
                    {language === 'bn' ? 'চিরতরে অপসারিত' : 'Irreversible'}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {language === 'bn'
                    ? 'ডাটাবেজ ও সিট কনফিগারেশন থেকে চিরতরে অপসারিত হবে। এটি আর কখনো পুনরুদ্ধার বা রিস্টোর করা যাবে না।'
                    : 'Permanently purges the layout configuration from database. This action cannot be reversed.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeletingLayout}
              onClick={() => setLayoutToDelete(null)}
              className="font-bold rounded-xl px-4 py-2 cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              variant={deleteMode === 'recycle' ? 'primary' : 'danger'}
              size="sm"
              isLoading={isDeletingLayout}
              onClick={confirmDeleteLayout}
              className={`font-bold rounded-xl px-5 py-2 flex items-center gap-1.5 cursor-pointer shadow-md ${
                deleteMode === 'recycle'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {deleteMode === 'recycle'
                  ? (language === 'bn' ? 'রিসাইকেল বিনে পাঠান' : 'Move to Recycle Bin')
                  : (language === 'bn' ? 'স্থায়ীভাবে মুছে ফেলুন' : 'Permanently Delete')}
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Format & Name Collision Detection Modal on Restore */}
      <Modal
        isOpen={restoreConflictModal.show}
        onClose={() => !isRestoringLayout && setRestoreConflictModal(prev => ({ ...prev, show: false }))}
        title={language === 'bn' ? '⚠️ ফরম্যাট ও নামের দ্বৈততা পাওয়া গেছে!' : 'Layout Format Conflict Detected'}
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'bn' ? 'এই ফরম্যাটে ইতিমধ্যে একটি লেআউট সক্রিয় রয়েছে!' : 'Conflict with Active Layout'}
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              {language === 'bn'
                ? `আপনার গ্যালারিতে "${restoreConflictModal.conflictingName}" নামের একটি লেআউট সক্রিয় রয়েছে। কনফ্লিক্ট বা ওভাররাইট এড়াতে রিস্টোর করা লেআউটটির জন্য নতুন একটি নাম নির্ধারণ করুন:`
                : `A layout named "${restoreConflictModal.conflictingName}" already exists. Please provide a new name to restore without conflict:`}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'bn' ? 'রিস্টোর করা লেআউটের নতুন নাম' : 'New Name for Restored Layout'}
            </label>
            <Input
              value={customRestoreName}
              onChange={(e) => setCustomRestoreName(e.target.value)}
              placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় স্পেশাল (রিস্টোর্ড)"
              className="font-bold text-sm rounded-xl py-2.5 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={isRestoringLayout}
              onClick={() => setRestoreConflictModal(prev => ({ ...prev, show: false }))}
              className="font-bold rounded-xl px-4 py-2 cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isRestoringLayout}
              disabled={!customRestoreName.trim()}
              onClick={() => handleAttemptRestore(
                restoreConflictModal.layoutId,
                restoreConflictModal.originalName,
                restoreConflictModal.layoutObj,
                customRestoreName
              )}
              className="font-bold rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন নামে রিস্টোর করুন' : 'Restore with New Name'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rich Floating Notification Banner with Undo & Recycle Bin Link */}
      {successDeleteBanner.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-2xl shadow-emerald-950/20 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{successDeleteBanner.title}</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {successDeleteBanner.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessDeleteBanner(prev => ({ ...prev, show: false }))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successDeleteBanner.wasSentToRecycleBin && successDeleteBanner.layoutId && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/recycle-bin';
                  }}
                  className="text-xs font-bold rounded-xl py-1.5 px-3 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                >
                  <span>{language === 'bn' ? '📂 রিসাইকেল বিনে যান' : 'Go to Recycle Bin'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isRestoringLayout}
                  onClick={() => handleAttemptRestore(
                    successDeleteBanner.layoutId!,
                    successDeleteBanner.layoutName || 'Layout',
                    successDeleteBanner.deletedLayoutObj
                  )}
                  className="text-xs font-bold rounded-xl py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? '↩️ এখনই আনডু / রিস্টোর করুন' : 'Undo / Restore'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Segment Create / Edit Modal */}
      <Modal
        isOpen={isSegmentModalOpen}
        onClose={() => setIsSegmentModalOpen(false)}
        title={editingSegment ? (language === 'bn' ? 'ভাড়া রেঞ্জ এডিট করুন' : 'Edit Fare Range') : (language === 'bn' ? 'নতুন ভাড়া রেঞ্জ যোগ করুন' : 'Add New Fare Range')}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'রেঞ্জের নাম (Range Name)' : 'Range Name'}
            </label>
            <input
              type="text"
              value={segmentForm.name}
              onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
              placeholder="e.g. Front VIP A–E"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'শুরু সারি (Start Row)' : 'Start Row'}
              </label>
              <select
                value={segmentForm.startRow}
                onChange={(e) => setSegmentForm({ ...segmentForm, startRow: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Array.from({ length: totalRows }).map((_, i) => (
                  <option key={i} value={rowLetters[i]}>Row {rowLetters[i]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'শেষ সারি (End Row)' : 'End Row'}
              </label>
              <select
                value={segmentForm.endRow}
                onChange={(e) => setSegmentForm({ ...segmentForm, endRow: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Array.from({ length: totalRows }).map((_, i) => (
                  <option key={i} value={rowLetters[i]}>Row {rowLetters[i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'ভাড়ার পরিমাণ (Fare Amount ৳)' : 'Fare Amount (৳)'}
            </label>
            <input
              type="number"
              value={segmentForm.fare}
              onChange={(e) => setSegmentForm({ ...segmentForm, fare: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-lg font-mono font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'bn' ? 'লেআউট কালার থিম (Color Theme)' : 'Visual Color Theme'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSegmentForm({ ...segmentForm, color: c.id })}
                  className={`p-2 rounded-xl border-2 flex items-center gap-2 text-xs font-bold transition-all ${
                    segmentForm.color === c.id
                      ? `${c.borderClass} bg-slate-100 dark:bg-slate-800 ring-2 ring-blue-500`
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.dotClass}`} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsSegmentModalOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveSegment} className="font-bold">
              <Check className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Range'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* University Preset Create / Edit Modal */}
      <Modal
        isOpen={isUniModalOpen}
        onClose={() => setIsUniModalOpen(false)}
        title={editingUniPreset ? (language === 'bn' ? 'বিশ্ববিদ্যালয় প্রিসেট নাম ও তথ্য এডিট করুন' : 'Edit University Preset') : (language === 'bn' ? 'নতুন বিশ্ববিদ্যালয় প্রিসেট যোগ করুন' : 'Add New University Preset')}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম (University Name)' : 'University Name'}
            </label>
            <input
              type="text"
              value={uniForm.name}
              onChange={(e) => setUniForm({ ...uniForm, name: e.target.value })}
              placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU)"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'ডিফল্ট লেআউট নাম (Default Layout Title)' : 'Default Layout Title'}
            </label>
            <input
              type="text"
              value={uniForm.defaultLayoutName}
              onChange={(e) => setUniForm({ ...uniForm, defaultLayoutName: e.target.value })}
              placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'ডিফল্ট সিট সংখ্যা (Default Capacity)' : 'Default Capacity'}
            </label>
            <select
              value={uniForm.capacity}
              onChange={(e) => setUniForm({ ...uniForm, capacity: Number(e.target.value) })}
              className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value={45}>৪৫ সিট (11 Rows, Middle K3)</option>
              <option value={40}>৪০ সিট (10 Rows Standard 2+2)</option>
              <option value={36}>৩৬ সিট (9 Rows 2+2)</option>
              <option value={32}>৩২ সিট (8 Rows 2+2)</option>
              <option value={28}>২৮ সিট (7 Rows 2+2)</option>
              <option value={42}>৪২ সিট (10 Rows + Extra)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsUniModalOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveUniPreset} className="font-bold">
              <Check className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'প্রিসেট সংরক্ষণ করুন' : 'Save University Preset'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Custom University & Units Modal */}
      <Modal
        isOpen={isAddCustomUniOpen}
        onClose={() => setIsAddCustomUniOpen(false)}
        title={language === 'bn' ? '➕ নতুন কাস্টম বিশ্ববিদ্যালয় ও ইউনিট যুক্ত করুন' : 'Add Custom University & Units'}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'বিশ্ববিদ্যালয়ের পূর্ণ নাম (বাংলায়) *' : 'University Full Name *'}
            </label>
            <input
              type="text"
              value={customUniForm.nameBn}
              onChange={(e) => setCustomUniForm({ ...customUniForm, nameBn: e.target.value })}
              placeholder="e.g. খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (KUET)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'সংক্ষিপ্ত কোড (Code / Abbr) *' : 'Short Code *'}
              </label>
              <input
                type="text"
                value={customUniForm.shortCode}
                onChange={(e) => setCustomUniForm({ ...customUniForm, shortCode: e.target.value.toUpperCase() })}
                placeholder="e.g. KUET, BRUR, PUST"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'ক্যাটাগরি / ক্লাস্টার' : 'Category / Cluster'}
              </label>
              <select
                value={customUniForm.cluster}
                onChange={(e) => setCustomUniForm({ ...customUniForm, cluster: e.target.value as any })}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="GENERAL">🏛️ সাধারণ বিশ্ববিদ্যালয়</option>
                <option value="ENGG">⚙️ ইঞ্জিনিয়ারিং / প্রকৌশল</option>
                <option value="SCIENCE_TECH">🔬 বিজ্ঞান ও প্রযুক্তি</option>
                <option value="AGRI">🌾 কৃষি গুচ্ছ / বিশ্ববিদ্যালয়</option>
                <option value="MED">🩺 মেডিকেল / ডেন্টাল</option>
                <option value="SPECIAL">🎖️ স্পেশাল / অধিভুক্ত</option>
                <option value="OTHER">অন্যান্য / কাস্টম</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'জেলা / ক্যাম্পাস লোকেশন (District / Location)' : 'District / Location'}
            </label>
            <input
              type="text"
              value={customUniForm.district}
              onChange={(e) => setCustomUniForm({ ...customUniForm, district: e.target.value })}
              placeholder="e.g. খুলনা, রংপুর, রাজশাহী, ঢাকা"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'ভর্তি পরীক্ষার ইউনিট সমূহ (কমা বা + দিয়ে আলাদা করুন)' : 'Admission Units (comma separated)'}
            </label>
            <input
              type="text"
              value={customUniForm.units}
              onChange={(e) => setCustomUniForm({ ...customUniForm, units: e.target.value })}
              placeholder="e.g. A Unit (বিজ্ঞান), B Unit (মানবিক), C Unit (বাণিজ্য)"
              className="w-full px-3.5 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              উদাহরণ: A Unit (বিজ্ঞান), B Unit (মানবিক), C Unit (বাণিজ্য), চারুকলা, IBA
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddCustomUniOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCustomUniversity} className="font-bold">
              <Check className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'সংরক্ষণ করুন ও সিলেক্ট করুন' : 'Save & Select'}
            </Button>
          </div>
        </div>
      </Modal>

      
      {/* Save Layout Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title={language === 'bn' ? '💾 লেআউট সংরক্ষণ ও কনফিগারেশন' : 'Save Seat Layout'}
        size="lg"
      >
        <div className="space-y-4 p-1">
          {/* AI 1-Click Form Auto-Fill Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {language === 'bn' ? '✨ AI স্মার্ট ফর্ম সহকারী (Smart Form Assistant)' : 'AI Smart Form Assistant'}
                </h4>
                <p className="text-[11px] text-blue-100 font-medium leading-snug">
                  {language === 'bn' 
                    ? '১-ক্লিকেই ফর্মের নাম, ভর্তি ইউনিট ও সুন্দর বিবরণী স্বয়ংক্রিয়ভাবে লিখে ফেলুন।'
                    : 'Auto-fill layout name, units and description with AI in 1-click.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAIFillSaveForm}
              className="font-black text-xs bg-white text-indigo-700 hover:bg-blue-50 rounded-xl px-4 py-2 shadow-md cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'bn' ? 'AI দিয়ে ফর্ম পূরণ করুন' : 'Auto-Fill with AI'}</span>
            </button>
          </div>

          {/* Live Warning for Duplicate Name */}
          {duplicateExistingLayout && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-500 rounded-2xl text-amber-950 dark:text-amber-200 text-xs space-y-2.5 animate-in fade-in shadow-sm">
              <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                <span>⚠️ সতর্কতা: এই নামে ইতিমধ্যে একটি লেআউট সংরক্ষিত আছে!</span>
              </div>
              <p className="leading-relaxed">
                <strong>"{duplicateExistingLayout.name}"</strong> ({duplicateExistingLayout.totalSeats || duplicateExistingLayout.total_seats} সিট) নামে একটি লেআউট তালিকায় রয়েছে। একই নামে সেভ করলে এটি আগের লেআউটটিকে প্রতিস্থাপন (Overwrite / Update) করবে।
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-900">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">নাম আলাদা করতে ক্লিক করুন:</span>
                <button
                  type="button"
                  onClick={() => {
                    const tag = admissionUnit ? ` (${admissionUnit})` : ' (নতুন)';
                    setLayoutName(prev => `${prev.replace(/\s*\([^)]*\)\s*$/, '')}${tag}`);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  + {admissionUnit || 'Unit A'} যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutName(prev => `${prev} - নতুন সংস্করণ`);
                  }}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  + নতুন সংস্করণ
                </button>
              </div>
            </div>
          )}

          {/* 1. Target University & Exam Center (Organized with Categories, Search & Custom Uni Manager) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'bn' ? 'বিশ্ববিদ্যালয় / পরীক্ষা কেন্দ্রের নাম (Target University)' : 'Target University / Exam Center'}</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setCustomUniForm({
                    nameBn: '',
                    shortCode: '',
                    cluster: 'GENERAL',
                    units: 'A Unit, B Unit, C Unit',
                    district: ''
                  });
                  setIsAddCustomUniOpen(true);
                }}
                className="px-3 py-1 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{language === 'bn' ? '➕ নতুন কাস্টম বিশ্ববিদ্যালয় যুক্ত করুন' : '+ Add Custom University'}</span>
              </button>
            </div>

            {/* Editable Selected University Display with Instant Input */}
            <div className="relative">
              <input
                type="text"
                value={targetUniversity}
                onChange={(e) => {
                  setTargetUniversity(e.target.value);
                  autoFormatLayoutName(e.target.value, admissionUnit, unitDiscipline, capacityInput);
                }}
                placeholder="বিশ্ববিদ্যালয়ের নাম লিখুন অথবা নিচের ক্যাটাগরি থেকে বেছে নিন..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              {targetUniversity && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetUniversity('');
                    autoFormatLayoutName('', admissionUnit, unitDiscipline, capacityInput);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Save as Custom if User typed an unrecognized name */}
            {targetUniversity && !uniList.some(u => u.nameBn === targetUniversity || targetUniversity.includes(u.nameBn)) && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                <span className="text-amber-800 dark:text-amber-300 font-medium">
                  💡 <strong>"{targetUniversity}"</strong> তালিকায় নেই। ভবিষ্যতে ব্যবহারের জন্য সংরক্ষণ করবেন?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = targetUniversity.trim();
                    const newUni: UniversityItem = {
                      id: cleanName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || `UNI_${Date.now().toString().slice(-4)}`,
                      nameBn: cleanName,
                      nameEn: cleanName,
                      cluster: 'OTHER',
                      isCustom: true,
                      units: ['Unit A', 'Unit B', 'Unit C']
                    };
                    const updated = addStoredUniversity(newUni);
                    setUniList(updated);
                    toastSuccess(language === 'bn' ? 'কাস্টম বিশ্ববিদ্যালয় সংরক্ষিত হয়েছে!' : 'Custom university saved!');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0 ml-2"
                >
                  সংরক্ষণ করুন (Save)
                </button>
              </div>
            )}

            {/* Organized Category Tabs & Search */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী বিশ্ববিদ্যালয় নির্বাচন করুন:' : 'Browse by Category:'}
                </span>

                {/* Search Bar inside Universities */}
                <div className="relative w-44">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={uniSearchFilter}
                    onChange={(e) => setUniSearchFilter(e.target.value)}
                    placeholder="খুঁজুন (Search)..."
                    className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  {uniSearchFilter && (
                    <button
                      type="button"
                      onClick={() => setUniSearchFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cluster Category Tabs */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', labelBn: 'সবগুলো', labelEn: 'All' },
                  { id: 'GENERAL', labelBn: '🏛️ সাধারণ', labelEn: 'General' },
                  { id: 'CLUSTER', labelBn: '🌐 গুচ্ছ', labelEn: 'Clusters' },
                  { id: 'ENGG_TECH', labelBn: '⚙️ ইঞ্জিনিয়ারিং ও প্রযুক্তি', labelEn: 'Engg & Tech' },
                  { id: 'MED', labelBn: '🩺 মেডিকেল', labelEn: 'Medical' },
                  { id: 'CUSTOM', labelBn: '⭐ কাস্টম', labelEn: 'Custom' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedUniCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedUniCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {language === 'bn' ? cat.labelBn : cat.labelEn}
                    {cat.id === 'CUSTOM' && (
                      <span className="ml-1 text-[10px] px-1 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono">
                        {uniList.filter(u => u.isCustom).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Clean Filtered Universities (Organized, No Clutter!) */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-1">
                {filteredUniversities.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2 italic w-full text-center">
                    {language === 'bn' ? 'কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।' : 'No universities match your filter.'}
                  </div>
                ) : (
                  filteredUniversities.map((u) => {
                    const isSelected = targetUniversity === u.nameBn;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setTargetUniversity(u.nameBn);
                          autoFormatLayoutName(u.nameBn, admissionUnit, unitDiscipline, capacityInput);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 shadow-sm scale-102'
                            : u.id === 'GST' || u.id === 'AGRI'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                            : u.isCustom
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:bg-purple-100'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{u.nameBn}</span>
                        {u.isCustom && <span className="text-[9px] px-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded font-normal">কাস্টম</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 2. Admission Unit (Multi-Unit & Custom Support) + Discipline/Group */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>ভর্তি পরীক্ষার ইউনিট (Admission Unit - এক বাসে দুই বা ততোধিক ইউনিট সমর্থিত):</span>
              </label>

              {/* Mode Toggle: Official University Units vs Custom Typing */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsCustomUnitMode(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    !isCustomUnitMode
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  বিশ্ববিদ্যালয় তালিকা
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomUnitMode(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isCustomUnitMode
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ✍️ কাস্টম লিখুন
                </button>
              </div>
            </div>

            {/* Mode 1: Official University Units with Multi-Unit Support */}
            {!isCustomUnitMode && currentUniversityUnits.length > 0 && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{targetUniversity ? targetUniversity.split(' (')[0] : 'বিশ্ববিদ্যালয়'}-এর অফিসিয়াল ইউনিট (একাধিক সিলেক্ট করুন):</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    (ক্লিক করে ইউনিট যোগ/বাদ দিন)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentUniversityUnits.map((u) => {
                    const isSelected = admissionUnit.toLowerCase().includes(u.toLowerCase()) || 
                      admissionUnit.split('+').some(part => part.trim().toLowerCase() === u.trim().toLowerCase());
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleToggleUnit(u)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-102 ring-2 ring-blue-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="text-xs">{isSelected ? '✓' : '＋'}</span>
                        <span className="truncate max-w-[280px]" title={u}>{u}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Multi-Unit Combination Badges */}
            <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                💡 মাল্টি-ইউনিট কম্বিনেশন সাজেশন (ক্লিক করে ২ ইউনিট সেট করুন):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Unit A + Unit B (বিজ্ঞান ও কলা)',
                  'Unit B + Unit C (কলা ও বাণিজ্য)',
                  'Unit A + Unit C (বিজ্ঞান ও বাণিজ্য)',
                  'A + B + C Unit (সকল অনুষদ)',
                  'Unit A + IBA (কম্বাইন্ড)',
                  'কলা ও সমাজবিজ্ঞান অনুষদ',
                  'সাধারণ / কম্বাইন্ড কোচ'
                ].map((combo) => (
                  <button
                    key={combo}
                    type="button"
                    onClick={() => {
                      setAdmissionUnit(combo);
                      autoFormatLayoutName(targetUniversity, combo, unitDiscipline, capacityInput);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-amber-950 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    ＋ {combo}
                  </button>
                ))}
              </div>
            </div>

            {/* Freeform Unit Input with Clear Button & Custom Unit Adder */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={admissionUnit}
                  onChange={(e) => {
                    setAdmissionUnit(e.target.value);
                    autoFormatLayoutName(targetUniversity, e.target.value, unitDiscipline, capacityInput);
                  }}
                  placeholder="যেমন: Unit A + Unit B, বিজ্ঞান ও মানবিক, বা কাস্টম নাম..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                {admissionUnit && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdmissionUnit('');
                      autoFormatLayoutName(targetUniversity, '', unitDiscipline, capacityInput);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Add Custom Unit Tag Inline */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <input
                  type="text"
                  value={singleCustomUnitInput}
                  onChange={(e) => setSingleCustomUnitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSingleCustomUnit();
                    }
                  }}
                  placeholder="নতুন কাস্টম ইউনিট টাইপ করুন (যেমন: IBA, চারুকলা, Unit D, স্থাপত্য)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddSingleCustomUnit}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ইউনিট যোগ করুন' : 'Add Unit'}</span>
                </button>
              </div>
            </div>

            {/* Discipline / Stream / Faculty Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                বিভাগ / অনুষদের ধরন (Discipline / Stream - ঐচ্ছিক):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'বিজ্ঞান (Science)', label: '🔬 বিজ্ঞান (Science)' },
                  { id: 'মানবিক (Humanities)', label: '📚 মানবিক (Arts)' },
                  { id: 'ব্যবসায় শিক্ষা (Business)', label: '💼 ব্যবসায় শিক্ষা' },
                  { id: 'বিভাগ পরিবর্তন / IBA', label: '🔄 বিভাগ পরিবর্তন' },
                  { id: 'চারুকলা (Fine Arts)', label: '🎨 চারুকলা' },
                  { id: 'মেডিকেল ও বায়োলজিক্যাল', label: '🩺 মেডিকেল / বায়ো' },
                  { id: 'ইঞ্জিনিয়ারিং ও টেকনোলজি', label: '⚙️ ইঞ্জিনিয়ারিং' },
                  { id: 'None', label: '❌ কোনোটিই নয়' }
                ].map(disc => (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => {
                      setUnitDiscipline(disc.id);
                      autoFormatLayoutName(targetUniversity, admissionUnit, disc.id, capacityInput);
                    }}
                    className={`p-1.5 rounded-xl text-[11px] font-bold border transition-all text-left truncate cursor-pointer ${
                      unitDiscipline === disc.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {disc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Exam & Session Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'পরীক্ষা বা সেশনের নাম (Exam / Session)' : 'Exam / Session Name'}
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  {['ভর্তি পরীক্ষা ২০২৫-২৬', 'স্পেশাল নাইট কোচ', 'সরাসরি ডে কোচ'].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setExamName(chip)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 font-medium cursor-pointer"
                    >
                      ＋ {chip}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. ভর্তি পরীক্ষা ২০২৫-২৬"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'সিট ধারণক্ষমতা (Capacity)' : 'Seat Capacity'}
              </label>
              <div className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold">
                {totalAllSeats} সিট ({totalMainSeats} Main {extraSeats.length > 0 ? `+ ${extraSeats.length} Extra` : ''})
              </div>
            </div>
          </div>

          {/* 4. Full Layout Name with AI Writer */}
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'লেআউটের পূর্ণাঙ্গ নাম (Layout Title)' : 'Full Layout Title'}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAIGenerateTitle}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                  title="ক্লিক করে নতুন আকর্ষণীয় নাম তৈরি করুন"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>{language === 'bn' ? '✨ AI নাম তৈরি করুন' : 'AI Generate Title'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => autoFormatLayoutName(targetUniversity, admissionUnit, unitDiscipline, capacityInput)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
                  title="ডিফল্ট অটো ফরম্যাট"
                >
                  {language === 'bn' ? 'অটো-ফরম্যাট' : 'Auto Format'}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="e.g. [RU] [Unit A] রাজশাহী বিশ্ববিদ্যালয় স্পেশাল - ৪৫ সিট"
              className={`w-full px-4 py-2.5 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none ${
                duplicateExistingLayout
                  ? 'border-amber-500 ring-2 ring-amber-300 dark:ring-amber-800'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
              }`}
            />
          </div>

          {/* 5. Description with AI Writer */}
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'বিবরণ / নোট (Description / Notes)' : 'Description / Notes'}
              </label>
              <button
                type="button"
                onClick={handleAIGenerateDescription}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                title="ক্লিক করে সুন্দর ও গোছানো বিবরণী লিখুন"
              >
                <Wand2 className="w-3 h-3 text-indigo-600" />
                <span>{language === 'bn' ? '✨ AI দিয়ে সুন্দর বিবরণ লিখুন' : 'AI Write Description'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={layoutDescription}
              onChange={(e) => setLayoutDescription(e.target.value)}
              placeholder="যেমন: রাজশাহী বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থী ও অভিভাবকদের সুবিধার্থে প্রস্তুতকৃত ৪৫-সিটের বিশেষ রিক্লাইনার কোচ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsSaveModalOpen(false);
                confirmSaveLayout();
              }}
              isLoading={isSaving}
              className="bg-blue-600 hover:bg-blue-700 font-bold px-5"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {editingExistingLayoutId 
                ? (language === 'bn' ? 'আপডেট করুন (Update)' : 'Update')
                : (language === 'bn' ? 'সেভ করুন (Save)' : 'Save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create New Layout Modal */}
      <Modal
        isOpen={isCreateNewLayoutModalOpen}
        onClose={() => setIsCreateNewLayoutModalOpen(false)}
        title={language === 'bn' ? '✨ নতুন বিশ্ববিদ্যালয় লেআউট তৈরি করুন' : 'Create New Seat Layout'}
      >
        <form onSubmit={handleConfirmCreateNewLayout} className="space-y-4 pt-2">
          {/* AI 1-Click Form Auto-Fill Banner for New Layout */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'স্মার্ট এআই দিয়ে ১-ক্লিকে নাম ও বিবরণ পূরণ করুন' : 'Auto-fill name & details with AI'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAIFillNewLayoutModal}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? '✨ AI অটো-ফিল' : 'AI Auto-Fill'}</span>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'লেআউটের নাম (Layout Name)' : 'Layout Name'}
              </label>
              <button
                type="button"
                onClick={handleAIFillNewLayoutModal}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{language === 'bn' ? '✨ AI নাম' : 'AI Name'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={newLayoutModalForm.name}
              onChange={(e) => setNewLayoutModalForm({ ...newLayoutModalForm, name: e.target.value })}
              placeholder="e.g. রাবি স্পেশাল নাইট কোচ - ৪৫ সিট"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'বিশ্ববিদ্যালয় / রুটের নাম (University / Route)' : 'University / Route'}
              </label>
              <input
                type="text"
                value={newLayoutModalForm.targetUniversity}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewLayoutModalForm(prev => ({
                    ...prev,
                    targetUniversity: val,
                    name: prev.name.includes('বিশ্ববিদ্যালয়') ? `${val} স্পেশাল - ${prev.capacity} সিট` : prev.name
                  }));
                }}
                placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU)"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'bn' ? 'সিট সংখ্যা (Exact Capacity)' : 'Seat Capacity'}
              </label>
              <input
                type="number"
                min={10}
                max={60}
                value={newLayoutModalForm.capacity}
                onChange={(e) => {
                  const cap = Number(e.target.value) || 45;
                  setNewLayoutModalForm(prev => ({
                    ...prev,
                    capacity: cap,
                    name: prev.name.replace(/\d+\s*সিট/g, `${cap} সিট`)
                  }));
                }}
                className="w-full px-3.5 py-2 text-base font-mono font-black border-2 border-blue-400 dark:border-blue-700 rounded-xl bg-blue-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Capacity Badges */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              {language === 'bn' ? 'দ্রুত সিট সংখ্যা সিলেক্ট করুন:' : 'Quick Select Capacity:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[45, 40, 36, 35, 32, 28, 42].map((capNum) => (
                <button
                  key={capNum}
                  type="button"
                  onClick={() => {
                    setNewLayoutModalForm(prev => ({
                      ...prev,
                      capacity: capNum,
                      name: prev.name.replace(/\d+\s*সিট/g, `${capNum} সিট`)
                    }));
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                    newLayoutModalForm.capacity === capNum
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {capNum} সিট
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'বিবরণ (Description - Optional)' : 'Description'}
              </label>
              <button
                type="button"
                onClick={() => {
                  const uni = newLayoutModalForm.targetUniversity.trim() || 'বিশ্ববিদ্যালয়';
                  setNewLayoutModalForm(prev => ({
                    ...prev,
                    description: `${uni.split(' (')[0]} ভর্তি পরীক্ষার্থী ও অভিভাবকদের সুবিধার্থে প্রস্তুতকৃত ${prev.capacity}-সিটের বিশেষ রিক্লাইনার কোচ।`
                  }));
                  toastSuccess(language === 'bn' ? '✨ AI দিয়ে সুন্দর বিবরণ লেখা হয়েছে!' : 'Description filled!');
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>{language === 'bn' ? '✨ AI বিবরণ' : 'AI Description'}</span>
              </button>
            </div>
            <input
              type="text"
              value={newLayoutModalForm.description}
              onChange={(e) => setNewLayoutModalForm({ ...newLayoutModalForm, description: e.target.value })}
              placeholder="e.g. ভর্তি পরীক্ষা স্পেশাল ডে/নাইট কোচ"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick presets shortcut */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
              {language === 'bn' ? 'বিশ্ববিদ্যালয় প্রিসেট থেকে নিন:' : 'From University Presets:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {universityPresets.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setNewLayoutModalForm({
                      ...newLayoutModalForm,
                      targetUniversity: u.name,
                      name: u.defaultLayoutName,
                      capacity: u.capacity
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {u.id} ({u.capacity} সিট)
                </button>
              ))}
            </div>
          </div>

          {/* Save as Preset Checkbox */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center gap-3">
            <input
              type="checkbox"
              id="saveAsPresetCheck"
              checked={newLayoutModalForm.saveAsPreset}
              onChange={(e) => setNewLayoutModalForm({ ...newLayoutModalForm, saveAsPreset: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
            />
            <label htmlFor="saveAsPresetCheck" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              {language === 'bn' ? '☑ এই লেআউটটিকে দ্রুত ব্যবহারের জন্য প্রিসেট (Preset) হিসেবেও সেভ করুন' : 'Save as Quick University Preset'}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateNewLayoutModalOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold px-5">
              <Sparkles className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? 'লেআউট তৈরি শুরু করুন' : 'Start Building Layout'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  // REALISTIC LUXURY COACH SEAT RENDERER WITH FIXED UNIFORM SIZING & FULL SOLID COLOR ON SELECTION
  function renderRealisticSeat(cell?: SeatCell, isMiddleSeat = false, segment?: FareRangeSegment) {
    if (!cell) return <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />;

    const isSelected =
      selectedCell?.rowIndex === cell.rowIndex &&
      selectedCell?.colIndex === cell.colIndex &&
      selectedCell?.seatNumber === cell.seatNumber;

    if (cell.type === 'AISLE') {
      return (
        <button
          type="button"
          onClick={() => handleCellClick(cell)}
          className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-600 ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          AISLE
        </button>
      );
    }

    if (cell.type === 'EMPTY') {
      return (
        <button
          type="button"
          onClick={() => handleCellClick(cell)}
          className="min-w-[4.25rem] min-h-[4.25rem] sm:min-w-[4.75rem] sm:min-h-[4.75rem] rounded-2xl border-2 border-dashed border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700"
        >
          ·
        </button>
      );
    }

    const segColorCfg = segment ? COLOR_OPTIONS.find(c => c.id === segment.color) : undefined;
    const seatPrice = cell.baseFare || segment?.fare || 500;

    return (
      <div className="relative group">
        {/* 3D Left Armrest */}
        <div
          className={`absolute -left-1.5 top-3.5 bottom-3.5 w-1.5 rounded-full transition-all duration-200 z-10 ${
            isSelected
              ? 'bg-blue-400 shadow-sm shadow-blue-500/50'
              : cell.genderRule === 'FEMALE_ONLY'
              ? 'bg-pink-300 dark:bg-pink-800'
              : cell.genderRule === 'MALE_ONLY'
              ? 'bg-blue-300 dark:bg-blue-800'
              : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
          }`}
        />

        {/* 3D Right Armrest */}
        <div
          className={`absolute -right-1.5 top-3.5 bottom-3.5 w-1.5 rounded-full transition-all duration-200 z-10 ${
            isSelected
              ? 'bg-blue-400 shadow-sm shadow-blue-500/50'
              : cell.genderRule === 'FEMALE_ONLY'
              ? 'bg-pink-300 dark:bg-pink-800'
              : cell.genderRule === 'MALE_ONLY'
              ? 'bg-blue-300 dark:bg-blue-800'
              : 'bg-slate-300 dark:bg-slate-700 shadow-2xs group-hover:bg-indigo-400'
          }`}
        />

        <button
          type="button"
          onClick={() => handleCellClick(cell)}
          className={`w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0 p-1.5 rounded-2xl flex flex-col items-center justify-between text-base font-black transition-all duration-200 ease-out relative select-none cursor-pointer overflow-hidden ${
            isSelected
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border-2 border-blue-300 shadow-xl shadow-blue-500/40 ring-4 ring-blue-400/40 -translate-y-1 z-10'
              : cell.isExtra
              ? 'bg-gradient-to-b from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/80 dark:to-purple-900/80 text-purple-950 dark:text-purple-100 border-2 border-purple-400 dark:border-purple-500 shadow-sm hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
              : cell.genderRule === 'FEMALE_ONLY'
              ? 'bg-gradient-to-b from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950/80 dark:to-pink-900/80 text-pink-950 dark:text-pink-100 border-2 border-pink-400 dark:border-pink-500 shadow-sm shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/30 hover:border-pink-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
              : cell.genderRule === 'MALE_ONLY'
              ? 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/80 text-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 hover:border-blue-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
              : isMiddleSeat
              ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 dark:from-amber-950/80 dark:to-amber-900/80 text-amber-950 dark:text-amber-100 border-2 border-amber-400 dark:border-amber-500 shadow-sm hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
              : segColorCfg
              ? `bg-gradient-to-b ${segColorCfg.bgClass} ${segColorCfg.textClass} border-2 ${segColorCfg.borderClass} shadow-sm hover:shadow-lg hover:-translate-y-1 active:translate-y-0.5 active:scale-95`
              : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0.5 active:scale-95'
          }`}
        >
          {/* Subtle Glassmorphic Sheen Highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />

          {/* Ergonomic Headrest Cushion Detail */}
          <div
            className={`w-10 h-1.5 rounded-full shadow-inner transition-all ${
              isSelected
                ? 'bg-white/95 shadow-white/40'
                : cell.genderRule === 'FEMALE_ONLY'
                ? 'bg-pink-500'
                : cell.genderRule === 'MALE_ONLY'
                ? 'bg-blue-500'
                : cell.isExtra
                ? 'bg-purple-500'
                : segColorCfg
                ? segColorCfg.dotClass
                : 'bg-slate-400'
            }`}
          />

          {/* EXTRA LARGE CRISP SEAT NUMBER */}
          <span className={`text-base sm:text-lg font-black tracking-tight leading-none font-mono drop-shadow-xs ${isSelected ? 'text-white' : ''}`}>
            {cell.seatNumber}
          </span>

          {/* PROMINENT HIGH-CONTRAST AMOUNT BADGE */}
          <div
            className={`w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg overflow-hidden backdrop-blur-xs transition-colors ${
              isSelected
                ? 'bg-black/25 text-white border border-white/20'
                : 'bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5'
            }`}
          >
            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight">
              ৳{seatPrice}
            </span>
            {!isSelected && cell.genderRule === 'FEMALE_ONLY' && (
              <span className="text-[9px] text-pink-800 dark:text-pink-300 font-black leading-none">F</span>
            )}
            {!isSelected && cell.genderRule === 'MALE_ONLY' && (
              <span className="text-[9px] text-blue-800 dark:text-blue-300 font-black leading-none">M</span>
            )}
            {!isSelected && isMiddleSeat && !cell.isExtra && (
              <span className="text-[8px] text-amber-800 dark:text-amber-200 font-black leading-none">MID</span>
            )}
          </div>
        </button>
      </div>
    );
  }
}
