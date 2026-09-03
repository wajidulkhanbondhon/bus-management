'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle2,
  AlertCircle,
  BusFront,
  CalendarRange,
  ArrowLeft,
  Filter,
  Layers,
  Sparkles,
  ShieldAlert,
  Loader2,
  Folder,
  FolderOpen,
  FolderDown,
  FolderCheck,
  FolderX,
  Armchair,
  GraduationCap,
  TicketPercent,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Check,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/context';
import {
  RecycleBinItem,
  RecycleBinSummary,
  RecycleBinFolder
} from '@/services/recycle-bin.service';
import {
  restoreRecycleItemAction,
  purgeRecycleItemAction,
  emptyRecycleBinAction,
  restoreAllInFolderAction,
  bulkRestoreRecycleItemsAction,
  bulkPurgeRecycleItemsAction
} from '@/actions/recycle-bin.actions';

interface RecycleBinViewProps {
  initialItems: RecycleBinItem[];
  summary: RecycleBinSummary;
}

const DEFAULT_FOLDERS: RecycleBinFolder[] = [
  {
    id: 'buses',
    name: 'বাস ও ফ্লিট ফোল্ডার',
    nameEn: 'Buses & Fleet Folder',
    icon: 'BusFront',
    description: 'সফটওয়্যার থেকে মুছে ফেলা বাস ও ফ্লিট যানবাহন',
    color: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    count: 0
  },
  {
    id: 'trips',
    name: 'ট্রিপ ও শিডিউল ফোল্ডার',
    nameEn: 'Trips & Schedules Folder',
    icon: 'CalendarRange',
    description: 'বাতিল বা মুছে ফেলা রুট ও ট্রিপ শিডিউল',
    color: 'from-cyan-600 to-teal-700',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
    count: 0
  },
  {
    id: 'layouts',
    name: 'সিট লেআউট ও প্ল্যান ফোল্ডার',
    nameEn: 'Seat Layouts & Plans',
    icon: 'Armchair',
    description: 'ডিলিট করা বাস সিট কনফিগারেশন ও লেআউট',
    color: 'from-purple-600 to-violet-700',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    count: 0
  },
  {
    id: 'universities',
    name: 'বিশ্ববিদ্যালয় ও রুট ফোল্ডার',
    nameEn: 'Universities & Routes',
    icon: 'GraduationCap',
    description: 'ডিলিট করা বিশ্ববিদ্যালয় কেন্দ্র ও সার্কুলার',
    color: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    count: 0
  },
  {
    id: 'coupons',
    name: 'কুপন ও অফার ফোল্ডার',
    nameEn: 'Coupons & Promos Folder',
    icon: 'TicketPercent',
    description: 'বাতিলকৃত মার্কেটিং প্রোমোকোড ও ডিসকাউন্ট',
    color: 'from-rose-600 to-pink-700',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    count: 0
  },
  {
    id: 'settings',
    name: 'শাখা ও সেটিংস ফোল্ডার',
    nameEn: 'Branches & Settings Folder',
    icon: 'SlidersHorizontal',
    description: 'মুছে ফেলা কাউন্টার শাখা, স্টপ ও সেটিংস',
    color: 'from-slate-600 to-slate-800',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    count: 0
  }
];

export function RecycleBinView({ initialItems, summary }: RecycleBinViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useApp();

  const [items, setItems] = useState<RecycleBinItem[]>(initialItems);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'all'>('folders');
  const [searchQuery, setSearchQuery] = useState('');

  // Checkbox multi-select / single mark delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Transitions & Modals
  const [isPending, startTransition] = useTransition();
  const [purgingItem, setPurgingItem] = useState<RecycleBinItem | null>(null);
  const [isBulkPurging, setIsBulkPurging] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [isEmptyingFolder, setIsEmptyingFolder] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [conflictItem, setConflictItem] = useState<{ item: RecycleBinItem; suggestedName: string } | null>(null);
  const [conflictNewName, setConflictNewName] = useState('');

  // Sync folder query param
  useEffect(() => {
    const fParam = searchParams.get('folder') || searchParams.get('category');
    if (fParam) {
      setSelectedFolder(fParam);
      setViewMode('folders');
    }
  }, [searchParams]);

  // Merge folder counts with live items state
  const liveFolders = useMemo(() => {
    const baseFolders = summary.folders && summary.folders.length > 0 ? summary.folders : DEFAULT_FOLDERS;
    return baseFolders.map(f => {
      const liveCount = items.filter(i => i.folderId === f.id || i.category === f.id).length;
      return {
        ...f,
        count: liveCount
      };
    });
  }, [items, summary]);

  // Current active folder object
  const currentFolder = useMemo(() => {
    if (!selectedFolder) return null;
    return liveFolders.find(f => f.id === selectedFolder) || null;
  }, [selectedFolder, liveFolders]);

  // Filtered items based on folder selection and search query
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Folder filter
      if (selectedFolder && (item.folderId !== selectedFolder && item.category !== selectedFolder)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSub = item.subtitle.toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesReg = (item.regNumber || '').toLowerCase().includes(q);
        return matchesTitle || matchesSub || matchesNotes || matchesReg;
      }
      return true;
    });
  }, [items, selectedFolder, searchQuery]);

  // Single mark toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all visible items
  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedItems.length && displayedItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map(i => i.id)));
    }
  };

  // Icon component mapper
  const renderFolderIcon = (iconName: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'BusFront':
        return <BusFront className={className} />;
      case 'CalendarRange':
        return <CalendarRange className={className} />;
      case 'Armchair':
        return <Armchair className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'TicketPercent':
        return <TicketPercent className={className} />;
      case 'SlidersHorizontal':
        return <SlidersHorizontal className={className} />;
      default:
        return <Folder className={className} />;
    }
  };

  // 1-Click Single Item Restore with Conflict Check
  const handleRestoreItem = (item: RecycleBinItem, overrideName?: string) => {
    setProcessingId(item.id);
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await restoreRecycleItemAction(item.category, item.id, overrideName);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setConflictItem(null);
        setActionSuccess(res.message || (language === 'bn' ? 'আইটেম সফলভাবে রিস্টোর করা হয়েছে।' : 'Item restored successfully.'));
        router.refresh();
      } else if (res.isConflict) {
        const suggested = `${item.title} (রিস্টোর্ড)`;
        setConflictNewName(suggested);
        setConflictItem({ item, suggestedName: suggested });
        setActionError(res.error || (language === 'bn' ? 'এই ফরম্যাট ও নামের একটি আইটেম ইতিমধ্যে সক্রিয় রয়েছে!' : 'Conflict detected!'));
      } else {
        setActionError(res.error || (language === 'bn' ? 'রিস্টোর করতে সমস্যা হয়েছে।' : 'Failed to restore item.'));
      }
      setProcessingId(null);
    });
  };

  // Confirm Single Item Purge
  const handleConfirmPurge = () => {
    if (!purgingItem) return;
    const target = purgingItem;
    setProcessingId(target.id);
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await purgeRecycleItemAction(target.category, target.id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== target.id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
        setActionSuccess(res.message || (language === 'bn' ? 'স্থায়ীভাবে চিরতরে মুছে ফেলা হয়েছে।' : 'Item permanently purged.'));
        setPurgingItem(null);
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'স্থায়ীভাবে মুছতে সমস্যা হয়েছে।' : 'Failed to permanently purge.'));
      }
      setProcessingId(null);
    });
  };

  // Bulk Restore Selected Items
  const handleBulkRestoreSelected = () => {
    if (selectedIds.size === 0) return;
    const targets = items.filter(i => selectedIds.has(i.id)).map(i => ({ category: i.category, id: i.id }));
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await bulkRestoreRecycleItemsAction(targets);
      if (res.success) {
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        setSelectedIds(new Set());
        setActionSuccess(res.message || (language === 'bn' ? 'চিহ্নিত আইটেমসমূহ সফলভাবে রিস্টোর করা হয়েছে।' : 'Selected items restored.'));
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'চিহ্নিত আইটেম রিস্টোর করতে সমস্যা হয়েছে।' : 'Failed to restore selected items.'));
      }
    });
  };

  // Bulk Purge Selected Items
  const handleConfirmBulkPurge = () => {
    if (selectedIds.size === 0) return;
    const targets = items.filter(i => selectedIds.has(i.id)).map(i => ({ category: i.category, id: i.id }));
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await bulkPurgeRecycleItemsAction(targets);
      if (res.success) {
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        setSelectedIds(new Set());
        setActionSuccess(res.message || (language === 'bn' ? 'চিহ্নিত আইটেমসমূহ চিরতরে মুছে ফেলা হয়েছে।' : 'Selected items permanently deleted.'));
        setIsBulkPurging(false);
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'চিহ্নিত আইটেম মুছতে সমস্যা হয়েছে।' : 'Failed to delete selected items.'));
      }
    });
  };

  // Restore All Items in Current Folder
  const handleRestoreAllInCurrentFolder = () => {
    if (!selectedFolder) return;
    const targetFolderId = selectedFolder;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await restoreAllInFolderAction(targetFolderId);
      if (res.success) {
        setItems(prev => prev.filter(i => i.folderId !== targetFolderId && i.category !== targetFolderId));
        setSelectedIds(new Set());
        setActionSuccess(res.message || (language === 'bn' ? 'ফোল্ডারের সকল আইটেম সফলভাবে রিস্টোর করা হয়েছে।' : 'All items in folder restored.'));
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'ফোল্ডার রিস্টোর করতে সমস্যা হয়েছে।' : 'Failed to restore folder items.'));
      }
    });
  };

  // Empty Current Folder
  const handleConfirmEmptyCurrentFolder = () => {
    if (!selectedFolder) return;
    const targetFolderId = selectedFolder;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await emptyRecycleBinAction(targetFolderId);
      if (res.success) {
        setItems(prev => prev.filter(i => i.folderId !== targetFolderId && i.category !== targetFolderId));
        setSelectedIds(new Set());
        setActionSuccess(res.message || (language === 'bn' ? 'ফোল্ডারটি সম্পূর্ণ খালি করা হয়েছে।' : 'Folder emptied.'));
        setIsEmptyingFolder(false);
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'ফোল্ডার খালি করতে সমস্যা হয়েছে।' : 'Failed to empty folder.'));
      }
    });
  };

  // Empty Entire Recycle Bin (Delete All)
  const handleConfirmEmptyEntireTrash = () => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await emptyRecycleBinAction('all');
      if (res.success) {
        setItems([]);
        setSelectedIds(new Set());
        setActionSuccess(res.message || (language === 'bn' ? 'রিসাইকেল বিন সম্পূর্ণ খালি করা হয়েছে (Delete All)।' : 'Recycle bin completely emptied.'));
        setIsEmptyingTrash(false);
        router.refresh();
      } else {
        setActionError(res.error || (language === 'bn' ? 'রিসাইকেল বিন খালি করতে সমস্যা হয়েছে।' : 'Failed to empty recycle bin.'));
      }
    });
  };

  const isAllSelected = displayedItems.length > 0 && selectedIds.size === displayedItems.length;

  return (
    <div className="space-y-6 w-full pb-16 max-w-7xl mx-auto px-4 sm:px-6" suppressHydrationWarning>
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
          <Link
            href="/dashboard"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          {selectedFolder ? (
            <>
              <button
                type="button"
                onClick={() => { setSelectedFolder(null); setSelectedIds(new Set()); }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{language === 'bn' ? '🗑️ রিসাইকেল বিন এক্সপ্লোরার' : '🗑️ Recycle Bin'}</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 dark:text-white flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'bn' ? currentFolder?.name : currentFolder?.nameEn || selectedFolder}</span>
              </span>
            </>
          ) : (
            <span className="text-slate-900 dark:text-white flex items-center gap-1">
              <span>🗑️ {language === 'bn' ? 'রিসাইকেল বিন ও ফোল্ডার এক্সপ্লোরার' : 'Recycle Bin & Folder Explorer'}</span>
            </span>
          )}
        </div>

        {/* Top Badges and View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedFolder(null); setSelectedIds(new Set()); }}
              className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সকল ফোল্ডার' : 'All Folders'}</span>
            </Button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setViewMode('folders'); setSelectedFolder(null); setSelectedIds(new Set()); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'folders' && !selectedFolder
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ফোল্ডার ভিউ' : 'Folders'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('all'); setSelectedFolder(null); setSelectedIds(new Set()); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সকল আইটেম' : 'All Items'}</span>
              <span className="text-[10px] px-1 rounded-full bg-slate-200 dark:bg-slate-700">
                {items.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/50">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold backdrop-blur-md">
              <FolderDown className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'bn' ? 'সফটওয়্যার-ওয়াইড ফোল্ডার ভিত্তিক রিসাইকেল বিন' : 'Software-Wide Folder-Based Recycle Bin'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>{selectedFolder ? '📁' : '🗑️'}</span>
              <span>
                {selectedFolder
                  ? (language === 'bn' ? currentFolder?.name : currentFolder?.nameEn || selectedFolder)
                  : (language === 'bn' ? 'রিসাইকেল বিন ও রিস্টোর হাব' : 'Recycle Bin & Restore Hub')}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {language === 'bn'
                ? 'সিঙ্গেল মার্ক ডিলিট, ডিলিট অল (Delete All), কিংবা ১-ক্লিকে রিস্টোর (Restore)—সকল মুছে ফেলা ডেটা নিরাপদে পরিচালনা করুন।'
                : 'Single mark delete, Delete All, or 1-click Restore—safely manage all deleted items.'}
            </p>
          </div>

          {/* Action Buttons in Hero */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {selectedFolder && displayedItems.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRestoreAllInCurrentFolder}
                  disabled={isPending}
                  className="font-bold text-xs sm:text-sm h-11 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40"
                >
                  <RotateCcw className="w-4 h-4 mr-2 text-emerald-300" />
                  <span>{language === 'bn' ? 'সব রিস্টোর করুন' : 'Restore All in Folder'}</span>
                </Button>

                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setIsEmptyingFolder(true)}
                  disabled={isPending}
                  className="font-bold text-xs sm:text-sm h-11 px-4 rounded-xl bg-rose-600/80 hover:bg-rose-700"
                >
                  <FolderX className="w-4 h-4 mr-2" />
                  <span>{language === 'bn' ? 'ফোল্ডার খালি করুন' : 'Empty Folder'}</span>
                </Button>
              </>
            )}

            {!selectedFolder && items.length > 0 && (
              <Button
                variant="danger"
                size="md"
                onClick={() => setIsEmptyingTrash(true)}
                disabled={isPending}
                className="font-bold text-xs sm:text-sm h-11 px-4 rounded-xl shadow-lg shadow-rose-900/40 border border-rose-500/50 hover:bg-rose-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>{language === 'bn' ? 'সব মুছুন (Delete All)' : 'Delete All'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* STICKY BULK ACTION BAR (When 1 or more items are marked) */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-40 p-4 rounded-2xl bg-indigo-950 text-white shadow-2xl border-2 border-indigo-500/60 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
              {selectedIds.size}
            </div>
            <div>
              <div className="font-black text-xs sm:text-sm text-indigo-100 flex items-center gap-2">
                <span>{language === 'bn' ? 'চিহ্নিত আইটেম অপশন' : 'Marked Items Options'}</span>
                <Badge variant="default" className="bg-indigo-500 text-white text-[10px] px-2 py-0.5">
                  {selectedIds.size} {language === 'bn' ? 'টি নির্বাচিত' : 'Selected'}
                </Badge>
              </div>
              <p className="text-[11px] text-indigo-300 font-medium">
                {language === 'bn'
                  ? 'একসাথে সবগুলো রিস্টোর করুন অথবা স্থায়ীভাবে মুছে ফেলুন'
                  : 'Restore or permanently delete marked items together'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bulk Restore Button */}
            <Button
              size="sm"
              onClick={handleBulkRestoreSelected}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'চিহ্নিত রিস্টোর করুন' : 'Restore Selected'}</span>
            </Button>

            {/* Bulk Purge Button */}
            <Button
              size="sm"
              onClick={() => setIsBulkPurging(true)}
              disabled={isPending}
              variant="danger"
              className="font-bold text-xs h-9 px-3.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'চিহ্নিত মুছুন' : 'Delete Selected'}</span>
            </Button>

            {/* Clear Selection Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-white/70 hover:text-white hover:bg-white/10 font-bold text-xs h-9 px-2 rounded-xl"
              title="Deselect All"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 cursor-pointer font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {selectedFolder && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedFolder(null); setSelectedIds(new Set()); }}
              className="h-9 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>{language === 'bn' ? 'ফোল্ডারে ফিরুন' : 'Back to Folders'}</span>
            </Button>
          )}

          {/* Single Mark / Select All Checkbox */}
          {(selectedFolder || viewMode === 'all') && displayedItems.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center text-white ${isAllSelected ? 'bg-indigo-600' : selectedIds.size > 0 ? 'bg-indigo-400' : 'border border-slate-400'}`}>
                {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                {!isAllSelected && selectedIds.size > 0 && <span className="w-2 h-0.5 bg-white rounded-full" />}
              </div>
              <span>
                {isAllSelected
                  ? (language === 'bn' ? 'সব আনমার্ক করুন' : 'Deselect All')
                  : (language === 'bn' ? 'সব চিহ্নিত করুন (Select All)' : 'Select All')}
              </span>
            </button>
          )}

          <div className="text-xs font-bold text-slate-500">
            {selectedFolder
              ? (language === 'bn' ? `মোট ${displayedItems.length} টি আইটেম` : `${displayedItems.length} items`)
              : (language === 'bn' ? `মোট ${items.length} টি আইটেম ট্র্যাশে` : `${items.length} total in trash`)}
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px] sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              selectedFolder
                ? (language === 'bn' ? 'এই ফোল্ডারে খুঁজুন...' : 'Search in this folder...')
                : (language === 'bn' ? 'সকল ফোল্ডারে খুঁজুন (বাস, ট্রিপ, কোড)...' : 'Search across all folders...')
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: FOLDER EXPLORER GRID */}
      {!selectedFolder && viewMode === 'folders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-500" />
              <span>{language === 'bn' ? 'রিসাইকেল বিন ফোল্ডারসমূহ' : 'Recycle Bin Folders'}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'bn' ? 'ক্লিক করে ফোল্ডার খুলুন' : 'Click a folder to view items'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveFolders.map((folder) => {
              const hasItems = folder.count > 0;

              return (
                <div
                  key={folder.id}
                  onClick={() => { setSelectedFolder(folder.id); setSelectedIds(new Set()); }}
                  className={`group relative overflow-hidden rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                    hasItems
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${folder.color} group-hover:scale-110 transition-transform`}>
                      {renderFolderIcon(folder.icon, 'w-6 h-6')}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                          hasItems
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {folder.count} {language === 'bn' ? 'আইটেম' : 'items'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>{language === 'bn' ? folder.name : folder.nameEn}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {folder.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ফোল্ডার খুলুন' : 'Open Folder'}</span>
                    </span>
                    <span className="text-[11px] font-mono opacity-70">
                      {hasItems ? (language === 'bn' ? 'রিস্টোরযোগ্য' : 'Restorable') : (language === 'bn' ? 'খালি' : 'Empty')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ITEMS LIST (Inside selected folder OR in "all items" mode) */}
      {(selectedFolder || viewMode === 'all') && (
        <div className="space-y-3">
          {displayedItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl">
                🎉
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'কোনো ডিলিট হওয়া আইটেম নেই!' : 'No Deleted Items Here!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? (language === 'bn' ? `'${searchQuery}' এর সাথে মেলানো কোনো আইটেম পাওয়া যায়নি।` : 'No deleted items matched your query.')
                    : (language === 'bn' ? 'এই ফোল্ডারটি সম্পূর্ণ পরিষ্কার এবং কোনো ট্র্যাশ ফাইল নেই।' : 'This folder is completely empty and clean.')}
                </p>
              </div>

              {selectedFolder && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedFolder(null); setSelectedIds(new Set()); }}
                    className="font-bold text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    <span>{language === 'bn' ? 'অন্য ফোল্ডারে যান' : 'Browse Other Folders'}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedItems.map((item) => {
                const isProcessing = processingId === item.id;
                const isBus = item.category === 'buses';
                const isMarked = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isMarked
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Left: Checkbox + Icon + Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Single Mark Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className={`w-6 h-6 mt-1 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isMarked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
                        }`}
                        title={isMarked ? 'Unmark item' : 'Mark item for delete or restore'}
                      >
                        {isMarked && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isBus
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
                      }`}>
                        {renderFolderIcon(item.categoryIcon || (isBus ? 'BusFront' : 'CalendarRange'), 'w-5 h-5')}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.categoryLabel}
                          </Badge>
                          <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5">
                            DELETED
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {item.subtitle}
                        </p>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xl">
                            {item.notes}
                          </p>
                        )}

                        <div className="text-[10.5px] text-slate-400 pt-0.5">
                          <span>{language === 'bn' ? 'মুছে ফেলার সময়:' : 'Deleted on:'} </span>
                          <span className="font-mono font-semibold">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') : 'সম্প্রতি'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                      {/* Restore Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreItem(item)}
                        disabled={isProcessing}
                        className="h-9 px-3.5 rounded-xl font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{language === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                      </Button>

                      {/* Permanent Purge Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPurgingItem(item)}
                        disabled={isProcessing}
                        className="h-9 px-3 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 cursor-pointer flex items-center gap-1.5"
                        title={language === 'bn' ? 'স্থায়ীভাবে মুছুন' : 'Permanently Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'চিরতরে মুছুন' : 'Purge'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PURGE SINGLE ITEM MODAL */}
      {purgingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'স্থায়ীভাবে মুছে ফেলার সতর্কতা' : 'Permanent Purge Warning'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
                  {purgingItem.title}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <p className="font-bold">
                ⚠️ {language === 'bn' ? 'অপরিবর্তনযোগ্য কাজ:' : 'Irreversible Action:'}
              </p>
              <p className="leading-relaxed">
                {language === 'bn'
                  ? 'এই আইটেমটি ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর কখনোই ফিরিয়ে আনা সম্ভব হবে না।'
                  : 'This item will be permanently removed from the database and cannot be recovered.'}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setPurgingItem(null)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmPurge}
                isLoading={isPending}
                className="font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>{language === 'bn' ? 'হ্যাঁ, চিরতরে মুছুন' : 'Yes, Purge Permanently'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK PURGE MARKED ITEMS MODAL */}
      {isBulkPurging && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'চিহ্নিত আইটেম স্থায়ীভাবে মুছুন' : 'Purge Marked Items'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? `মোট ${selectedIds.size} টি চিহ্নিত আইটেম` : `${selectedIds.size} marked items`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <p className="font-bold">
                ⚠️ {language === 'bn' ? 'সতর্কতা:' : 'Warning:'}
              </p>
              <p className="leading-relaxed">
                {language === 'bn'
                  ? `আপনার চিহ্নিত করা মোট ${selectedIds.size}টি আইটেম ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?`
                  : `All ${selectedIds.size} selected items will be permanently erased.`}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setIsBulkPurging(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmBulkPurge}
                isLoading={isPending}
                className="font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>{language === 'bn' ? 'চিহ্নিতগুলো চিরতরে মুছুন' : 'Purge Marked'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EMPTY CURRENT FOLDER MODAL */}
      {isEmptyingFolder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <FolderX className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ফোল্ডার সম্পূর্ণ খালি করুন' : 'Empty This Folder'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? currentFolder?.name : currentFolder?.nameEn}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <p className="font-bold">
                ⚠️ {language === 'bn' ? 'সতর্কতা:' : 'Warning:'}
              </p>
              <p className="leading-relaxed">
                {language === 'bn'
                  ? `এই ফোল্ডারের সকল (${displayedItems.length}টি) আইটেম চিরতরে ডাটাবেস থেকে মুছে যাবে।`
                  : `All items inside this folder will be permanently purged.`}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setIsEmptyingFolder(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmEmptyCurrentFolder}
                isLoading={isPending}
                className="font-bold bg-rose-600 hover:bg-rose-700"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>{language === 'bn' ? 'হ্যাঁ, ফোল্ডার খালি করুন' : 'Empty Folder'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EMPTY ENTIRE TRASH MODAL (DELETE ALL) */}
      {isEmptyingTrash && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'রিসাইকেল বিন সম্পূর্ণ খালি করুন (Delete All)' : 'Delete All in Recycle Bin'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? `মোট ${items.length} টি আইটেম ট্র্যাশে রয়েছে` : `${items.length} items in trash`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
              <p className="font-bold">
                ⚠️ {language === 'bn' ? 'গুরুত্বপূর্ণ সতর্কতা:' : 'Important Warning:'}
              </p>
              <p className="leading-relaxed">
                {language === 'bn'
                  ? 'সকল ফোল্ডারের সমস্ত আইটেম চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?'
                  : 'All items across all folders will be erased permanently.'}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setIsEmptyingTrash(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmEmptyEntireTrash}
                isLoading={isPending}
                className="font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>{language === 'bn' ? 'সবকিছু চিরতরে মুছুন' : 'Delete Everything'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CONFLICT RESOLUTION MODAL ON RESTORE */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ফরম্যাট ও নামের দ্বৈততা পাওয়া গেছে' : 'Format Conflict Detected'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'ইতিমধ্যে সক্রিয় আইটেমের সাথে ওভাররাইট রোধে নতুন নাম দিন' : 'Specify a new name to restore'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <p className="font-bold">
                ⚠️ {language === 'bn' ? 'সতর্কতা:' : 'Notice:'}
              </p>
              <p className="leading-relaxed">
                {language === 'bn'
                  ? `"${conflictItem.item.title}" ফরম্যাট বা নামের একটি আইটেম বর্তমানে সক্রিয় রয়েছে। আপনি নিচের নতুন নামে এটি রিস্টোর করতে পারেন:`
                  : `An item with format "${conflictItem.item.title}" is already active. Please provide a new name to restore:`}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                {language === 'bn' ? 'রিস্টোর করা আইটেমের নতুন নাম' : 'New Restored Name'}
              </label>
              <input
                type="text"
                value={conflictNewName}
                onChange={(e) => setConflictNewName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setConflictItem(null)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleRestoreItem(conflictItem.item, conflictNewName)}
                isLoading={isPending}
                disabled={!conflictNewName.trim()}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>{language === 'bn' ? 'নতুন নামে রিস্টোর করুন' : 'Restore with New Name'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
