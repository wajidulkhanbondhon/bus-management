'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Archive,
  AlertTriangle,
  X,
  Loader2,
  ShieldAlert,
  FolderDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';

export interface UniversalDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveToRecycleBin: () => Promise<void> | void;
  onPermanentDelete: () => Promise<void> | void;
  itemTitle: string;
  itemSubtitle?: string;
  itemCategory?: string;
  itemIcon?: React.ReactNode;
  warningText?: string;
}

export function UniversalDeleteModal({
  isOpen,
  onClose,
  onMoveToRecycleBin,
  onPermanentDelete,
  itemTitle,
  itemSubtitle,
  itemCategory = 'আইটেম',
  itemIcon,
  warningText
}: UniversalDeleteModalProps) {
  const { language } = useApp();
  const [isTrashing, setIsTrashing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecycleBin = async () => {
    setActionError(null);
    setIsTrashing(true);
    try {
      await onMoveToRecycleBin();
    } catch (err: any) {
      setActionError(err.message || (language === 'bn' ? 'রিসাইকেল বিনে পাঠাতে সমস্যা হয়েছে।' : 'Failed to move to recycle bin.'));
    } finally {
      setIsTrashing(false);
    }
  };

  const handlePermanent = async () => {
    setActionError(null);
    setIsPurging(true);
    try {
      await onPermanentDelete();
    } catch (err: any) {
      setActionError(err.message || (language === 'bn' ? 'স্থায়ীভাবে মুছতে সমস্যা হয়েছে।' : 'Failed to permanently delete.'));
    } finally {
      setIsPurging(false);
    }
  };

  const isBusy = isTrashing || isPurging;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !isBusy && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              {itemIcon || <Trash2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ডিলিট কনফার্মেশন ও অপশন' : 'Delete Options & Confirmation'}
                </h3>
                {itemCategory && (
                  <Badge variant="outline" className="text-[10.5px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {itemCategory}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'আইটেমটি কিভাবে ডিলিট করতে চান তা বেছে নিন'
                  : 'Choose how you want to handle this deletion'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'নির্বাচিত আইটেম:' : 'Target Item:'}
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
            {itemTitle}
          </div>
          {itemSubtitle && (
            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {itemSubtitle}
            </div>
          )}
        </div>

        {/* Warning / Info Alert */}
        {warningText ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningText}</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              {language === 'bn'
                ? 'রিসাইকেল বিনে পাঠালে এটি সুরক্ষিত থাকবে এবং যে কোনো সময় ১-ক্লিকে ফিরিয়ে আনা যাবে। স্থায়ীভাবে মুছলে চিরতরে অপসারিত হবে।'
                : 'Moving to recycle bin keeps it safe and restorable. Permanent delete purges it completely.'}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Three Action Options */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Move to Recycle Bin (Recommended Safe Option) */}
          <button
            type="button"
            onClick={handleRecycleBin}
            disabled={isBusy}
            className="w-full p-4 rounded-2xl border-2 border-indigo-500/50 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-950 dark:text-indigo-100 transition-all flex items-center justify-between gap-3 group text-left cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {isTrashing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FolderDown className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-black flex items-center gap-2">
                  <span>{language === 'bn' ? '📦 রিসাইকেল বিনে পাঠান' : '📦 Move to Recycle Bin'}</span>
                  <Badge variant="default" className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2">
                    {language === 'bn' ? 'নিরাপদ (Safe)' : 'Safe'}
                  </Badge>
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                  {language === 'bn'
                    ? 'তালিকায় লুকানো থাকবে, পরবর্তীতে ফোল্ডার থেকে রিস্টোর করতে পারবেন'
                    : 'Hidden from active list, restorable anytime from Recycle Bin folders'}
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Permanently Delete (Hard Purge) */}
          <button
            type="button"
            onClick={handlePermanent}
            disabled={isBusy}
            className="w-full p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-rose-950 dark:text-rose-100 transition-all flex items-center justify-between gap-3 group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {isPurging ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <span>{language === 'bn' ? '⚠️ স্থায়ীভাবে মুছে ফেলুন' : '⚠️ Permanently Delete'}</span>
                  <Badge variant="danger" className="text-[10px] px-1.5 py-0.2">
                    {language === 'bn' ? 'অপরিবর্তনযোগ্য' : 'Irreversible'}
                  </Badge>
                </div>
                <div className="text-xs text-rose-600/80 dark:text-rose-400 font-medium mt-0.5">
                  {language === 'bn'
                    ? 'ডাটাবেস থেকে চিরতরে মুছে যাবে, আর ফেরত পাওয়া যাবে না'
                    : 'Permanently purges from database, cannot be recovered'}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Option 3: Cancel Button */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isBusy}
            className="font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            <X className="w-4 h-4 mr-1.5" />
            <span>{language === 'bn' ? 'বাতিল করুন (Cancel)' : 'Cancel'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
