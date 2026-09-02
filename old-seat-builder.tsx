'use client';

import React, { useState, useEffect } from 'react';
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
  Download
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
import { useApp } from '@/lib/context';

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

export function SeatBuilderCanvas({
  fareZones: initialFareZones,
  savedLayouts: initialSavedLayouts = []
}: {
  fareZones: any[];
  savedLayouts?: any[];
}) {
  const router = useRouter();
  const { t, language } = useApp();

  // Active View Tab: 'builder' | 'gallery'
  const [activeTab, setActiveTab] = useState<'builder' | 'gallery'>('builder');

  // Editing existing layout indicator
  const [editingExistingLayoutId, setEditingExistingLayoutId] = useState<string | null>(null);

  const [targetUniversity, setTargetUniversity] = useState('রাজশাহী বিশ্ববিদ্যালয় (RU)');
  const [layoutName, setLayoutName] = useState('রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)');
  const [layoutDescription, setLayoutDescription] = useState('রাজশাহী বিশ্ববিদ্যালয় ভর্তি পরীক্ষা স্পেশাল ৪৫ সিট কোচ লেআউট');
  
  // Capacity: 40, 45, etc.
  const [capacityInput, setCapacityInput] = useState<number>(45);
  const [totalRows, setTotalRows] = useState(11);
  const [totalCols, setTotalCols] = useState(5);
  const [cells, setCells] = useState<SeatCell[]>([]);
  const [extraSeats, setExtraSeats] = useState<SeatCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<SeatCell | null>(null);
  const [cellFormApplied, setCellFormApplied] = useState(false);

  const [fareZones, setFareZones] = useState<any[]>(initialFareZones);
  const [savedLayouts, setSavedLayouts] = useState<any[]>(initialSavedLayouts);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryUniFilter, setGalleryUniFilter] = useState('ALL');

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
      id: 'RU',
      name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
      defaultLayoutName: 'রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 550, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–J)', startRow: 'I', endRow: 'J', fare: 500, color: 'purple' as const },
        { id: 'seg-4', name: 'Last Row Bench (K)', startRow: 'K', endRow: 'K', fare: 450, color: 'amber' as const }
      ]
    },
    {
      id: 'CU',
      name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
      defaultLayoutName: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU) নাইট কোচ - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Middle (F–H)', startRow: 'F', endRow: 'H', fare: 600, color: 'blue' as const },
        { id: 'seg-3', name: 'Rear Economy (I–K)', startRow: 'I', endRow: 'K', fare: 550, color: 'purple' as const }
      ]
    },
    {
      id: 'DU',
      name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
      defaultLayoutName: 'ঢাকা বিশ্ববিদ্যালয় (DU) ডে এক্সপ্রেস - ৪০ সিট (৳৫০০)',
      capacity: 40,
      segments: [
        { id: 'seg-1', name: 'Front Seats (A–D)', startRow: 'A', endRow: 'D', fare: 500, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (E–J)', startRow: 'E', endRow: 'J', fare: 450, color: 'blue' as const }
      ]
    },
    {
      id: 'GST',
      name: 'জিএসটি গুচ্ছ (GST Cluster)',
      defaultLayoutName: 'জিএসটি গুচ্ছ (GST) স্পেশাল - ৪৫ সিট (৳৬০০/৳৫০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 600, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 500, color: 'blue' as const }
      ]
    },
    {
      id: 'JU',
      name: 'জাহাঙ্গীরনগর (JU)',
      defaultLayoutName: 'জাহাঙ্গীরনগর (JU) শাটল বাস - ৩৬ সিট (৳৩৫০)',
      capacity: 36,
      segments: [
        { id: 'seg-1', name: 'All Seats (A–I)', startRow: 'A', endRow: 'I', fare: 350, color: 'blue' as const }
      ]
    },
    {
      id: 'KUET',
      name: 'কুয়েট খুলনা (KUET)',
      defaultLayoutName: 'কুয়েট এক্সপ্রেস (KUET) - ৪৫ সিট (৳৬৫০/৳৫৫০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 650, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard Seats (F–K)', startRow: 'F', endRow: 'K', fare: 550, color: 'blue' as const }
      ]
    },
    {
      id: 'SUST',
      name: 'সাস্ট সিলেট (SUST)',
      defaultLayoutName: 'সাস্ট সিলেট (SUST) এক্সপ্রেস - ৪৫ সিট (৳৭০০/৳৬০০)',
      capacity: 45,
      segments: [
        { id: 'seg-1', name: 'Front VIP (A–E)', startRow: 'A', endRow: 'E', fare: 700, color: 'emerald' as const },
        { id: 'seg-2', name: 'Standard (F–K)', startRow: 'F', endRow: 'K', fare: 600, color: 'blue' as const }
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
    name: 'নতুন বিশ্ববিদ্যালয় কোচ লেআউট - ৪৫ সিট',
    targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    capacity: 45,
    defaultFare: 550,
    description: 'নতুন বিশ্ববিদ্যালয় ভর্তি পরীক্ষা বাস লেআউট',
    saveAsPreset: false
  });

  const handleOpenCreateNewLayoutModal = () => {
    setNewLayoutModalForm({
      name: `নতুন বিশ্ববিদ্যালয় লেআউট - ৪৫ সিট (${new Date().toLocaleDateString('bn-BD')})`,
      targetUniversity: targetUniversity || 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
      capacity: 45,
      defaultFare: 550,
      description: 'নতুন বাস সিট লেআউট',
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
              genderRule: (r < 3 && (c === 0 || c === 1)) ? 'FEMALE_ONLY' : 'ANY',
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
              genderRule: (r < 3 && (c === 0 || c === 1)) ? 'FEMALE_ONLY' : 'ANY',
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
                genderRule: (r < 3 && (c === 0 || c === 1)) ? 'FEMALE_ONLY' : 'ANY',
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
    generateDynamicLayout(45, 'রাজশাহী বিশ্ববিদ্যালয় (RU) স্পেশাল - ৪৫ সিট (৳৬৫০/৳৫৫০)');
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
    const newExtra: SeatCell = {
      rowIndex: 999,
      colIndex: nextIdx,
      seatNumber: `EX-${nextIdx}`,
      type: 'SEAT',
      genderRule: 'ANY',
      baseFare: 450,
      isExtra: true
    };
    setExtraSeats([...extraSeats, newExtra]);
    setSelectedCell(newExtra);
    setCellFormApplied(false);
  };

  const handleRemoveSingleExtraSeat = (seatNum: string) => {
    setExtraSeats(prev => prev.filter(s => s.seatNumber !== seatNum));
    if (selectedCell?.seatNumber === seatNum) {
      setSelectedCell(null);
    }
  };

  const handleUndoExtraSeat = () => {
    if (extraSeats.length === 0) return;
    const updated = [...extraSeats];
    const removed = updated.pop();
    setExtraSeats(updated);
    if (selectedCell?.seatNumber === removed?.seatNumber) {
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
      setExtraSeats(extraSeats.map(s => s.seatNumber === selectedCell.seatNumber ? updated : s));
    } else {
      setCells(cells.map(c => (c.rowIndex === updated.rowIndex && c.colIndex === updated.colIndex ? updated : c)));
    }
  };

  const handleApplyInspectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCellFormApplied(true);
    setTimeout(() => setCellFormApplied(false), 2500);
  };

  // Load and Edit Saved Layout
  const handleLoadAndEditLayout = (layout: any) => {
    setEditingExistingLayoutId(layout.id);
    setLayoutName(layout.name);
    setLayoutDescription(layout.description || '');
    setTotalRows(layout.totalRows);
    setTotalCols(layout.totalCols);

    if (layout.layoutJson) {
      try {
        const parsed = JSON.parse(layout.layoutJson);
        if (parsed.grid) {
          const loadedCells: SeatCell[] = [];
          for (let r = 0; r < parsed.grid.length; r++) {
            for (let c = 0; c < parsed.grid[r].length; c++) {
              const item = parsed.grid[r][c];
              if (item) {
                loadedCells.push({
                  rowIndex: r,
                  colIndex: c,
                  seatNumber: item.label || '',
                  type: item.type,
                  genderRule: item.genderAllowed || 'ANY',
                  baseFare: item.baseFare || 500,
                  fareZoneId: item.fareZoneId
                });
              }
            }
          }
          setCells(loadedCells);

          if (parsed.extraSeats && Array.isArray(parsed.extraSeats) && parsed.extraSeats.length > 0) {
            setExtraSeats(parsed.extraSeats);
            setCapacityInput(layout.totalSeats - parsed.extraSeats.length);
          } else {
            setExtraSeats([]);
            setCapacityInput(layout.totalSeats);
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

    generateDynamicLayout(layout.totalSeats, layout.name);
    setActiveTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSavedLayout = async (id: string, name: string) => {
    if (!confirm(language === 'bn' ? `আপনি কি "${name}" লেআউটটি মুছে ফেলতে চান?` : `Are you sure you want to delete "${name}"?`)) return;
    const res = await deleteSeatLayoutAction(id);
    if (res.success) {
      setSavedLayouts(prev => prev.filter(l => l.id !== id));
      if (editingExistingLayoutId === id) {
        setEditingExistingLayoutId(null);
      }
      router.refresh();
    } else {
      alert(res.error || 'Failed to delete layout');
    }
  };

  // Trigger Print / A4 Download
  const handlePrintLayout = () => {
    window.print();
  };

  // Save layout to DB
  const handleSaveLayout = async () => {
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

      const isUpdate = !!editingExistingLayoutId;

      const res = await createCustomLayoutAction({
        id: editingExistingLayoutId || undefined,
        name: layoutName.trim(),
        description: layoutDescription.trim(),
        totalRows: totalRows,
        totalCols: totalCols,
        layoutGrid,
        extraSeats: extraSeats
      });

      if (res.success) {
        if (res.layout) {
          const savedItem = res.layout;
          setSavedLayouts(prev => [savedItem, ...prev.filter(l => l.id !== savedItem.id)]);
        }
        setEditingExistingLayoutId(null);
        setToastNotification({
          show: true,
          title: language === 'bn' ? '🎉 সফল হয়েছে!' : '🎉 Success!',
          message: isUpdate
            ? (language === 'bn' ? `"${layoutName}" লেআউটটি সফলভাবে আপডেট হয়েছে!` : `Layout "${layoutName}" successfully updated!`)
            : (language === 'bn' ? `"${layoutName}" লেআউটটি সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!` : `Layout "${layoutName}" successfully saved!`),
          type: 'success'
        });
        setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 6000);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to save seat layout');
        setToastNotification({
          show: true,
          title: language === 'bn' ? 'সেভ ব্যর্থ হয়েছে' : 'Save Failed',
          message: res.error || 'Failed to save seat layout',
          type: 'error'
        });
        setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving layout');
      setToastNotification({
        show: true,
        title: language === 'bn' ? 'এরর' : 'Error',
        message: err.message || 'An error occurred while saving layout',
        type: 'error'
      });
      setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const totalMainSeats = cells.filter(c => c.type === 'SEAT').length;
  const totalAllSeats = totalMainSeats + extraSeats.length;

  const filteredSavedLayouts = (savedLayouts || []).filter(l => {
    const name = l?.name || '';
    const desc = l?.description || '';
    const q = (gallerySearch || '').toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    let matchesUni = true;
    if (galleryUniFilter && galleryUniFilter !== 'ALL') {
      const text = `${name} ${desc}`.toLowerCase();
      matchesUni = text.includes(galleryUniFilter.toLowerCase());
    }
    return matchesSearch && matchesUni;
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
    <div className="max-w-7xl mx-auto pb-16">
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
            <div className="bg-slate-900 text-white rounded-2xl p-2.5 flex items-center justify-between text-xs sm:text-sm font-black shadow-md">
              <span className="bg-emerald-800 border-2 border-emerald-500 px-5 py-1.5 rounded-xl text-emerald-100 flex items-center gap-1.5">
                🚪 বাসের গেট (ENTRY)
              </span>
              <span className="bg-slate-800 border-2 border-slate-600 px-6 py-1.5 rounded-xl font-mono text-amber-300">
                🚌 ইঞ্জিন বনেট
              </span>
              <span className="bg-blue-800 border-2 border-blue-500 px-5 py-1.5 rounded-xl text-blue-100 flex items-center gap-1.5">
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
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                {language === 'bn' ? 'কাস্টম সিট বিল্ডার ও গ্যালারি' : 'Custom Seat Builder & Gallery'}
              </span>
              <Badge variant="primary" className="text-xs px-3 py-1 font-bold">
                {totalAllSeats} {t.seatsTotal} ({totalMainSeats} Main + {extraSeats.length} Extra)
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {language === 'bn' ? 'বিশ্ববিদ্যালয় সিট লেআউট ও ভাড়া বিল্ডার' : 'University Seat Layout & Fare Builder'}
            </h1>
          </div>

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
        <div className="flex flex-wrap items-center gap-3">
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
            onClick={handleSaveLayout}
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
        <div className="no-print flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
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
      <div className="no-print flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'builder'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{language === 'bn' ? '🛠 লেআউট বিল্ডার ও ভিজ্যুয়াল ক্যানভাস' : 'Seat Layout Builder'}</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'gallery'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>{language === 'bn' ? '📁 সংরক্ষিত বিশ্ববিদ্যালয় লেআউট গ্যালারি' : 'Saved University Layouts Gallery'}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-black/20 text-white">
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

          {/* 2. UNIVERSITY PRESET PICKER CARD WITH EDIT & ADD BUTTONS */}
          <Card className="no-print shadow-2xs border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
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

          {/* 3. Custom Layout Name & Description Input Card */}
          <Card className="no-print shadow-2xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                    className="text-xs font-bold border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 rounded-xl"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? '+ অতিরিক্ত সিট' : '+ Extra Seat'}
                  </Button>

                  {/* Primary Save Button right next to + অতিরিক্ত সিট */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveLayout}
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

                  {/* COCKPIT SECTION: Bonnet Engine Grill + Front Windshield + Driver Cabin + Door Steps (ENLARGED TYPOGRAPHY) */}
                  <div className="mb-6 pb-4 border-b-2 border-dashed border-slate-200 dark:border-slate-800 print:mb-2 print:pb-2">
                    {/* Windshield Glass */}
                    <div className="h-6 bg-blue-100/80 dark:bg-blue-950/60 rounded-t-2xl border-t-2 border-blue-300 dark:border-blue-800 mb-2.5 flex items-center justify-center print:h-4 print:mb-1.5">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 font-mono print:text-[10px]">
                        {language === 'bn' ? 'সামনের উইন্ডশিল্ড গ্লাস' : 'FRONT WINDSHIELD GLASS'}
                      </span>
                    </div>

                    {/* Dashboard & Cockpit: Larger Door, Bonnet, and Driver Cabins */}
                    <div className="h-22 bg-slate-900 dark:bg-slate-950 rounded-2xl p-3 sm:p-4 flex items-center justify-between text-white shadow-inner relative overflow-hidden print:h-auto print:p-2 print:rounded-xl print:bg-slate-900">
                      {/* Left: Passenger Entry Door / Gate */}
                      <div className="flex items-center gap-2.5 bg-emerald-950 border-2 border-emerald-500 px-4 py-2.5 rounded-2xl shadow-md print:px-2 print:py-1 print:rounded-lg">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0 print:hidden" />
                        <div>
                          <div className="text-sm sm:text-base font-black text-emerald-400 leading-tight print:text-xs">
                            {language === 'bn' ? 'বাসের গেট' : 'ENTRY DOOR'}
                          </div>
                          <div className="text-[10px] sm:text-xs text-emerald-200 font-bold leading-none mt-0.5 print:text-[9px]">
                            {language === 'bn' ? 'প্রবেশদ্বার' : 'Entry'}
                          </div>
                        </div>
                      </div>

                      {/* Center: Bonnet / Engine Hood */}
                      <div className="text-center px-4 py-2 bg-slate-800 rounded-2xl border-2 border-slate-600 shadow-md print:px-2 print:py-1 print:rounded-lg">
                        <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wider print:text-xs">
                          {language === 'bn' ? 'বনেট / ইঞ্জিন' : 'ENGINE BONNET'}
                        </div>
                        <div className="text-[10px] text-slate-300 font-bold mt-0.5 print:hidden">Front Chassis</div>
                      </div>

                      {/* Right: Driver Cabin & Steering Wheel */}
                      <div className="flex items-center gap-2.5 bg-blue-950 border-2 border-blue-500 px-4 py-2.5 rounded-2xl text-right shadow-md print:px-2 print:py-1 print:rounded-lg">
                        <div>
                          <div className="text-sm sm:text-base font-black text-blue-400 leading-tight print:text-xs">
                            {language === 'bn' ? 'ড্রাইভার কেবিন' : 'DRIVER CABIN'}
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-200 font-bold leading-none mt-0.5 print:text-[9px]">
                            {language === 'bn' ? 'কন্ট্রোল' : 'Cockpit'}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600/50 border-2 border-blue-300 flex items-center justify-center text-sm font-black text-blue-100 print:w-5 print:h-5 print:text-xs">
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
                            onClick={handleSaveLayout}
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
                          <div key={extra.seatNumber} className="relative group">
                            {renderRealisticSeat(extra)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSingleExtraSeat(extra.seatNumber);
                              }}
                              className="no-print absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-md hover:bg-rose-700 transition-all z-20"
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
            <div className="no-print space-y-6">
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
        /* FULL-WIDTH DEDICATED SAVED UNIVERSITY LAYOUTS GALLERY */
        <div className="space-y-6">
          {/* Gallery Filter & Search Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder={language === 'bn' ? 'সংরক্ষিত লেআউটের নাম খুঁজুন...' : 'Search saved layouts...'}
                className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartNewLayout}
                className="font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-blue-500/20"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                {language === 'bn' ? '+ নতুন লেআউট তৈরি করুন' : '+ Create New Layout'}
              </Button>
            </div>
          </div>

          {/* Grid of Saved Layout Cards */}
          {filteredSavedLayouts.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'কোন সংরক্ষিত বিশ্ববিদ্যালয় লেআউট পাওয়া যায়নি' : 'No saved layouts found'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'bn' ? 'উপরে "+ নতুন লেআউট তৈরি করুন" এ ক্লিক করে নতুন লেআউট সংরক্ষণ করুন।' : 'Create a new layout and save it to your roster.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSavedLayouts.map((layout) => (
                <Card
                  key={layout.id}
                  className="shadow-sm border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="primary" className="text-[10px] font-bold mb-1">
                          {layout.totalSeats} {language === 'bn' ? 'সিটের কোচ' : 'Seats Coach'}
                        </Badge>
                        <CardTitle className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {layout.name}
                        </CardTitle>
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-bold shrink-0">
                        {layout.totalRows}×{layout.totalCols}
                      </span>
                    </div>
                    {layout.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {layout.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                      <span>{language === 'bn' ? 'সারি ও গ্রিড:' : 'Grid Specs:'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {layout.totalRows} Rows ({layout.totalSeats} Seats)
                      </span>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleLoadAndEditLayout(layout)}
                        className="flex-1 font-bold text-xs rounded-xl shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        {language === 'bn' ? 'লোড ও এডিট করুন' : 'Load & Edit'}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSavedLayout(layout.id, layout.name)}
                        className="font-bold text-xs rounded-xl px-3"
                        title="Delete Layout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

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

      {/* Create New Layout Modal */}
      <Modal
        isOpen={isCreateNewLayoutModalOpen}
        onClose={() => setIsCreateNewLayoutModalOpen(false)}
        title={language === 'bn' ? '✨ নতুন বিশ্ববিদ্যালয় লেআউট তৈরি করুন' : 'Create New Seat Layout'}
      >
        <form onSubmit={handleConfirmCreateNewLayout} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'লেআউটের নাম (Layout Name)' : 'Layout Name'}
            </label>
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'bn' ? 'বিবরণ (Description - Optional)' : 'Description'}
            </label>
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
      <button
        type="button"
        onClick={() => handleCellClick(cell)}
        className={`w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] shrink-0 p-1.5 rounded-2xl flex flex-col items-center justify-between text-base font-black transition-all duration-200 ease-out relative select-none cursor-pointer ${
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
    );
  }
}
