'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  MapPin,
  Banknote,
  BookOpen,
  Info,
  Bus,
  Settings
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';

// Sample university fallback data
const SAMPLE_UNIVERSITIES = [
  {
    id: '1',
    name: 'রাজশাহী বিশ্ববিদ্যালয়',
    nameEn: 'University of Rajshahi',
    applyStatus: 'OPEN',
    deadline: '2026-09-15',
    examDate: '2026-10-05',
    units: ['A ইউনিট', 'B ইউনিট', 'C ইউনিট', 'D ইউনিট'],
    fees: '৳৫০০ - ৳৮০০',
    requirements: [
      'এসএসসি ও এইচএসসি সনদ ও মার্কশিট (মূল ও ফটোকপি)',
      'পাসপোর্ট সাইজের ছবি (৩ কপি)',
      'জাতীয় পরিচয়পত্র / জন্ম সনদ ফটোকপি',
      'অনলাইন আবেদন ফি পরিশোধের রসিদ'
    ],
    howToApply: 'admission.ru.ac.bd ওয়েবসাইটে গিয়ে অনলাইন আবেদন ফরম পূরণ করুন। বিকাশ/নগদ/রকেটে আবেদন ফি দিন।',
    location: 'রাজশাহী',
    circularUrl: null,
  },
  {
    id: '2',
    name: 'চট্টগ্রাম বিশ্ববিদ্যালয়',
    nameEn: 'University of Chittagong',
    applyStatus: 'OPEN',
    deadline: '2026-09-20',
    examDate: '2026-10-12',
    units: ['A ইউনিট', 'B ইউনিট', 'C ইউনিট'],
    fees: '৳৬০০',
    requirements: [
      'এসএসসি ও এইচএসসি সনদ ও মার্কশিট',
      'পাসপোর্ট সাইজের ছবি (৪ কপি)',
      'প্রবেশপত্র প্রিন্ট'
    ],
    howToApply: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের অফিসিয়াল ওয়েবসাইটে অনলাইন আবেদন করুন।',
    location: 'চট্টগ্রাম',
    circularUrl: null,
  },
  {
    id: '3',
    name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
    nameEn: 'Jahangirnagar University',
    applyStatus: 'UPCOMING',
    deadline: '2026-10-01',
    examDate: '2026-10-20',
    units: ['বিজ্ঞান', 'কলা ও মানবিকী', 'সমাজবিজ্ঞান', 'ব্যবসায় শিক্ষা'],
    fees: '৳৫০০',
    requirements: [
      'এসএসসি ও এইচএসসি রেজাল্ট',
      'ফটো আইডি',
      'পাসপোর্ট সাইজের ছবি'
    ],
    howToApply: 'শীঘ্রই ঘোষণা করা হবে।',
    location: 'সাভার, ঢাকা',
    circularUrl: null,
  },
  {
    id: '4',
    name: 'ঢাকা বিশ্ববিদ্যালয়',
    nameEn: 'University of Dhaka',
    applyStatus: 'CLOSED',
    deadline: '2026-08-20',
    examDate: '2026-09-10',
    units: ['ক ইউনিট', 'খ ইউনিট', 'গ ইউনিট', 'ঘ ইউনিট', 'চারুকলা'],
    fees: '৳১,০০০',
    requirements: [
      'এসএসসি ও এইচএসসি সনদ',
      'ফটো ও আইডি',
    ],
    howToApply: 'আবেদন সময়সীমা শেষ হয়ে গেছে।',
    location: 'ঢাকা',
    circularUrl: null,
  },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    OPEN: { label: 'আবেদন চলছে', icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    UPCOMING: { label: 'আসছে শীঘ্রই', icon: AlertCircle, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    CLOSED: { label: 'আবেদন শেষ', icon: XCircle, cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  }[status] || { label: status, icon: Info, cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${config.cls}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState(SAMPLE_UNIVERSITIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUniversities() {
      try {
        const res = await fastApiClient.getUniversities();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            nameEn: u.name_en || u.nameEn || '',
            applyStatus: u.apply_status || u.applyStatus || 'OPEN',
            deadline: u.deadline,
            examDate: u.exam_date || u.examDate,
            units: Array.isArray(u.units) ? u.units : (u.units ? JSON.parse(u.units) : []),
            fees: u.fees,
            requirements: Array.isArray(u.requirements) ? u.requirements : (u.requirements ? JSON.parse(u.requirements) : []),
            howToApply: u.how_to_apply || u.howToApply,
            location: u.location,
            circularUrl: u.circular_url || u.circularUrl,
          }));
          setUniversities(mapped);
        }
      } catch (err) {
        console.warn('Failed to load universities from API, using fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUniversities();
  }, []);

  const filtered = universities.filter(u => {
    if (statusFilter !== 'ALL' && u.applyStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.includes(q) || (u.nameEn && u.nameEn.toLowerCase().includes(q)) || (u.location && u.location.includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-b border-amber-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ল্যান্ডিং পেজে ফিরে যান
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-600/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                বিশ্ববিদ্যালয় <span className="text-amber-400">ভর্তি তথ্য কেন্দ্র</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                কোন কোন বিশ্ববিদ্যালয়ে ভর্তি আবেদন চলছে, কী কী লাগবে, কীভাবে করতে হবে — সব তথ্য।
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="বিশ্ববিদ্যালয়ের নাম বা শহর খুঁজুন..."
                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="OPEN">আবেদন চলছে</option>
              <option value="UPCOMING">আসছে শীঘ্রই</option>
              <option value="CLOSED">আবেদন শেষ</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            <Filter className="w-3 h-3 inline-block mr-1" />
            {filtered.length} টি বিশ্ববিদ্যালয় পাওয়া গেছে
          </div>
        </div>
      </div>

      {/* University Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-white">কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।</p>
          </div>
        ) : (
          filtered.map((uni) => {
            const isExpanded = expandedId === uni.id;
            const daysLeft = Math.ceil((new Date(uni.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={uni.id}
                className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all ${
                  uni.applyStatus === 'CLOSED' ? 'border-slate-800/60 opacity-70' : 'border-slate-800 hover:border-amber-500/30'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Card Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : uni.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-600/15 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{uni.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{uni.nameEn}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <StatusBadge status={uni.applyStatus} />
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {uni.location}
                          </span>
                          {uni.applyStatus !== 'CLOSED' && daysLeft > 0 && (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {daysLeft} দিন বাকি
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:block text-right">
                        <div className="text-[10px] text-slate-500 font-semibold">পরীক্ষার তারিখ</div>
                        <div className="text-xs font-bold text-white">{new Date(uni.examDate).toLocaleDateString('bn-BD')}</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Units */}
                          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> ইউনিট/বিভাগ
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {uni.units.map((unit, i) => (
                                <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                                  {unit}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Deadline & Exam */}
                          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> গুরুত্বপূর্ণ তারিখ
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">আবেদনের শেষ তারিখ:</span>
                                <span className="font-bold text-white">{new Date(uni.deadline).toLocaleDateString('bn-BD')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">পরীক্ষার তারিখ:</span>
                                <span className="font-bold text-white">{new Date(uni.examDate).toLocaleDateString('bn-BD')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Fees */}
                          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Banknote className="w-3 h-3" /> আবেদন ফি
                            </div>
                            <div className="text-lg font-black text-emerald-400 font-mono">{uni.fees}</div>
                          </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/50">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> প্রয়োজনীয় কাগজপত্র
                          </div>
                          <ul className="space-y-2">
                            {uni.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* How to Apply */}
                        <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-800/30">
                          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Info className="w-3 h-3" /> কীভাবে আবেদন করবেন
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{uni.howToApply}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {uni.circularUrl && (
                            <a
                              href={uni.circularUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              সার্কুলার ডাউনলোড
                            </a>
                          )}
                          <Link
                            href={`/?destination=${encodeURIComponent(uni.location)}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                          >
                            <Bus className="w-3.5 h-3.5" />
                            {uni.location}-এর বাস দেখুন
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
