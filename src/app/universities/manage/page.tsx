'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Save,
  X
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';

interface UniversityItem {
  id: string;
  name: string;
  name_en?: string;
  apply_status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  deadline?: string;
  exam_date?: string;
  units?: string[];
  fees?: string;
  requirements?: string[];
  how_to_apply?: string;
  location?: string;
  circular_url?: string;
}

export default function UniversityManagePage() {
  const { language } = useApp();
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversityItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formStatus, setFormStatus] = useState<'OPEN' | 'UPCOMING' | 'CLOSED'>('OPEN');
  const [formDeadline, setFormDeadline] = useState('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formUnits, setFormUnits] = useState('');
  const [formFees, setFormFees] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formHowToApply, setFormHowToApply] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCircularUrl, setFormCircularUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fastApiClient.getUniversities();
      if (res.success && Array.isArray(res.data)) {
        setUniversities(res.data);
      }
    } catch (err) {
      console.error('Failed to load universities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormNameEn('');
    setFormStatus('OPEN');
    setFormDeadline('');
    setFormExamDate('');
    setFormUnits('');
    setFormFees('');
    setFormRequirements('');
    setFormHowToApply('');
    setFormLocation('');
    setFormCircularUrl('');
    setModalOpen(true);
  };

  const openEditModal = (item: UniversityItem) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormNameEn(item.name_en || '');
    setFormStatus(item.apply_status || 'OPEN');
    setFormDeadline(item.deadline || '');
    setFormExamDate(item.exam_date || '');
    setFormUnits(Array.isArray(item.units) ? item.units.join(', ') : (item.units || ''));
    setFormFees(item.fees || '');
    setFormRequirements(Array.isArray(item.requirements) ? item.requirements.join('\n') : (item.requirements || ''));
    setFormHowToApply(item.how_to_apply || '');
    setFormLocation(item.location || '');
    setFormCircularUrl(item.circular_url || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    const unitsArr = formUnits.split(',').map(u => u.trim()).filter(Boolean);
    const reqsArr = formRequirements.split('\n').map(r => r.trim()).filter(Boolean);

    const payload = {
      name: formName.trim(),
      name_en: formNameEn.trim() || undefined,
      apply_status: formStatus,
      deadline: formDeadline.trim() || undefined,
      exam_date: formExamDate.trim() || undefined,
      units: unitsArr,
      fees: formFees.trim() || undefined,
      requirements: reqsArr,
      how_to_apply: formHowToApply.trim() || undefined,
      location: formLocation.trim() || undefined,
      circular_url: formCircularUrl.trim() || undefined
    };

    try {
      if (editingItem) {
        await fastApiClient.updateUniversity(editingItem.id, payload);
      } else {
        await fastApiClient.createUniversity(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving university:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" এর সার্কুলার তথ্য মুছে ফেলতে চান?`)) {
      try {
        await fastApiClient.deleteUniversity(id);
        loadData();
      } catch (err) {
        console.error('Error deleting university:', err);
      }
    }
  };

  const filtered = universities.filter(u => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.name_en?.toLowerCase().includes(q) || u.location?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/universities"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              পাবলিক পেজ দেখুন
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            বিশ্ববিদ্যালয় সার্কুলার ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ভর্তি পরীক্ষার সার্কুলার, আবেদনের ডেডলাইন ও ইউনিটের তথ্য ড্যাশবোর্ড থেকে ডায়নামিক নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs">
            <Plus className="w-4 h-4" />
            নতুন বিশ্ববিদ্যালয় যুক্ত করুন
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="বিশ্ববিদ্যালয়ের নাম বা অবস্থান দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* University Grid / Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">সার্কুলার লোড হচ্ছে...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          কোনো বিশ্ববিদ্যালয়ের তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(uni => (
            <Card key={uni.id} className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                      {uni.name}
                    </CardTitle>
                    {uni.name_en && (
                      <p className="text-[11px] text-slate-500 font-medium">{uni.name_en}</p>
                    )}
                  </div>
                  <Badge variant={uni.apply_status === 'OPEN' ? 'success' : (uni.apply_status === 'UPCOMING' ? 'warning' : 'danger')}>
                    {uni.apply_status === 'OPEN' ? 'চলছে' : (uni.apply_status === 'UPCOMING' ? 'আসছে' : 'শেষ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {uni.location && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{uni.location}</span>
                  </div>
                )}
                {uni.deadline && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>আবেদনের শেষ তারিখ: <strong>{uni.deadline}</strong></span>
                  </div>
                )}
                {uni.exam_date && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>পরীক্ষার তারিখ: <strong>{uni.exam_date}</strong></span>
                  </div>
                )}
                {uni.fees && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                    <span>আবেদন ফি: {uni.fees}</span>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    {uni.units ? `${Array.isArray(uni.units) ? uni.units.length : 1} টি ইউনিট` : 'ইউনিট নির্দিষ্ট নেই'}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(uni)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(uni.id, uni.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  {editingItem ? 'বিশ্ববিদ্যালয় তথ্য সম্পাদনা' : 'নতুন বিশ্ববিদ্যালয় সার্কুলার যোগ করুন'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">বিশ্ববিদ্যালয়ের নাম (বাংলা) *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="যেমন: রাজশাহী বিশ্ববিদ্যালয়"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">নাম (ইংরেজি)</label>
                    <input
                      type="text"
                      value={formNameEn}
                      onChange={e => setFormNameEn(e.target.value)}
                      placeholder="University of Rajshahi"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">আবেদন স্ট্যাটাস</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    >
                      <option value="OPEN">আবেদন চলছে (OPEN)</option>
                      <option value="UPCOMING">আসছে শীঘ্রই (UPCOMING)</option>
                      <option value="CLOSED">আবেদন শেষ (CLOSED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">আবেদনের শেষ তারিখ</label>
                    <input
                      type="text"
                      value={formDeadline}
                      onChange={e => setFormDeadline(e.target.value)}
                      placeholder="2026-09-15"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">পরীক্ষার তারিখ</label>
                    <input
                      type="text"
                      value={formExamDate}
                      onChange={e => setFormExamDate(e.target.value)}
                      placeholder="2026-10-05"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ইউনিটসমূহ (কমা দিয়ে আলাদা)</label>
                    <input
                      type="text"
                      value={formUnits}
                      onChange={e => setFormUnits(e.target.value)}
                      placeholder="A ইউনিট, B ইউনিট, C ইউনিট"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">আবেদন ফি</label>
                    <input
                      type="text"
                      value={formFees}
                      onChange={e => setFormFees(e.target.value)}
                      placeholder="৳৫০০ - ৳৮০০"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">অবস্থান / শহর</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      placeholder="রাজশাহী"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">অফিসিয়াল সার্কুলার লিংক</label>
                    <input
                      type="text"
                      value={formCircularUrl}
                      onChange={e => setFormCircularUrl(e.target.value)}
                      placeholder="https://admission.ru.ac.bd"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">প্রয়োজনীয় কাগজপত্র (প্রতি লাইনে একটি)</label>
                  <textarea
                    rows={3}
                    value={formRequirements}
                    onChange={e => setFormRequirements(e.target.value)}
                    placeholder="এসএসসি ও এইচএসসি সনদ ও মার্কশিট&#10;পাসপোর্ট সাইজের ছবি&#10;এনআইডি ফটোকপি"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">আবেদন প্রক্রিয়া / নির্দেশিকা</label>
                  <textarea
                    rows={2}
                    value={formHowToApply}
                    onChange={e => setFormHowToApply(e.target.value)}
                    placeholder="অফিসিয়াল ওয়েবসাইটে গিয়ে অনলাইন ফরম পূরণ করুন..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5">
                    <Save className="w-4 h-4" />
                    {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
