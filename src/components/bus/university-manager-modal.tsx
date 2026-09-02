'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, GraduationCap, Save, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UniversityItem,
  getStoredUniversities,
  saveStoredUniversities,
  addStoredUniversity,
  deleteStoredUniversity
} from '@/lib/university-storage';

interface UniversityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  universities: UniversityItem[];
  onUpdateUniversities: (updated: UniversityItem[]) => void;
  onSelectUniversity?: (uni: UniversityItem) => void;
  language?: 'bn' | 'en';
}

export function UniversityManagerModal({
  isOpen,
  onClose,
  universities,
  onUpdateUniversities,
  onSelectUniversity,
  language = 'bn'
}: UniversityManagerModalProps) {
  const [nameBn, setNameBn] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [cluster, setCluster] = useState<UniversityItem['cluster']>('GENERAL');
  const [district, setDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = nameBn.trim();
    const cleanCode = shortCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanName) {
      setError(language === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম আবশ্যক।' : 'University name is required.');
      return;
    }
    if (!cleanCode) {
      setError(language === 'bn' ? 'বিশ্ববিদ্যালয়ের কোড/সংক্ষিপ্ত রূপ (যেমন: NSU, BU, PSTU) আবশ্যক।' : 'Short code is required.');
      return;
    }

    if (universities.some(u => u.id.toUpperCase() === cleanCode)) {
      setError(language === 'bn' ? `কোড '${cleanCode}' ইতিমধ্যে বিদ্যমান! অন্য কোড দিন।` : 'Code already exists!');
      return;
    }

    const newUni: UniversityItem = {
      id: cleanCode,
      nameBn: cleanName,
      nameEn: cleanName,
      cluster,
      district: district.trim() || undefined,
      isCustom: true
    };

    const updated = addStoredUniversity(newUni);
    onUpdateUniversities(updated);
    if (onSelectUniversity) {
      onSelectUniversity(newUni);
    }

    setNameBn('');
    setShortCode('');
    setDistrict('');
    setSuccessMsg(language === 'bn' ? `✨ '${cleanName}' সফলভাবে যুক্ত হয়েছে!` : 'University added successfully!');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleDelete = (id: string, name: string) => {
    if (universities.length <= 1) {
      setError(language === 'bn' ? 'কমপক্ষে একটি বিশ্ববিদ্যালয় তালিকায় থাকতে হবে।' : 'At least one university must remain.');
      return;
    }

    const updated = deleteStoredUniversity(id);
    onUpdateUniversities(updated);
    setError('');
    setSuccessMsg(language === 'bn' ? `'${name}' মুছে ফেলা হয়েছে।` : 'University removed.');
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const filteredList = universities.filter(u => {
    if (selectedClusterFilter !== 'ALL' && u.cluster !== selectedClusterFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.nameBn.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || (u.district && u.district.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {language === 'bn' ? '🎓 বিশ্ববিদ্যালয় ও কেন্দ্র ম্যানেজার (Add & Manage Universities)' : 'Manage University Centers'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'আপনার প্রয়োজন অনুযায়ী যেকোনো নতুন বিশ্ববিদ্যালয় বা ভর্তি কেন্দ্র যুক্ত করুন' : 'Add custom universities, exam centers and clusters'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New University Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400">
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন বিশ্ববিদ্যালয় বা পরীক্ষার কেন্দ্র যুক্ত করুন:' : 'Add New University:'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম (পূর্ণ নাম) *' : 'University Name *'}
              </label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: বরিশাল বিশ্ববিদ্যালয় (BU) বা NSU' : 'e.g. Barisal University (BU)'}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'সংক্ষিপ্ত কোড (Code) *' : 'Short Code *'}
              </label>
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                placeholder="BU / NSU / PSTU"
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'ক্যাটাগরি / ক্লাস্টার *' : 'Cluster Category *'}
              </label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="GENERAL">🏛️ সাধারণ বিশ্ববিদ্যালয় (General)</option>
                <option value="ENGG">⚙️ ইঞ্জিনিয়ারিং (Engineering)</option>
                <option value="SCIENCE_TECH">🔬 বিজ্ঞান ও প্রযুক্তি (Science & Tech)</option>
                <option value="AGRI">🌾 কৃষি বিশ্ববিদ্যালয় (Agri)</option>
                <option value="MED">🩺 মেডিকেল ও ডেন্টাল (Medical)</option>
                <option value="PRIVATE">🏢 প্রাইভেট বিশ্ববিদ্যালয় (Private)</option>
                <option value="SPECIAL">✨ বিশেষ ও অন্যান্য (Special)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'অবস্থান / জেলা (ঐচ্ছিক)' : 'District / City'}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: বরিশাল / ঢাকা / রাজশাহী' : 'City / District'}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" variant="primary" size="md" className="w-full font-bold shadow-md shadow-blue-500/25">
                <Plus className="w-4 h-4 mr-1.5" />
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Add University'}
              </Button>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-rose-600 animate-in fade-in">{error}</p>}
          {successMsg && <p className="text-xs font-bold text-emerald-600 animate-in fade-in">{successMsg}</p>}
        </form>

        {/* Existing Universities List with Live Search */}
        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'bn' ? `বিদ্যমান বিশ্ববিদ্যালয়ের তালিকা (${universities.length} টি)` : `Universities (${universities.length})`}
            </span>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'খুঁজুন...' : 'Search...'}
                className="w-full pl-7 pr-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60">
            {filteredList.map((uni) => (
              <div key={uni.id} className="pt-1.5 flex items-center justify-between gap-2 group">
                <div className="flex items-center gap-2 truncate">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px] shrink-0">
                    {uni.id}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {uni.nameBn}
                  </span>
                  {uni.isCustom && (
                    <Badge variant="primary" className="text-[10px] py-0 px-1.5 bg-purple-600 text-white font-bold">
                      কাস্টম
                    </Badge>
                  )}
                  {uni.district && (
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      📍 {uni.district}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {uni.isCustom ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(uni.id, uni.nameBn)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Custom University"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      ডিফল্ট
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold px-6">
            {language === 'bn' ? 'সম্পন্ন (Done)' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
