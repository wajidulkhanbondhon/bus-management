'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus as BusIcon,
  Plus,
  Grid3X3,
  ArrowRight,
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
  Sparkles
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

interface BusListViewProps {
  buses: any[];
  layouts: any[];
}

export function BusListView({ buses: initialBuses, layouts }: BusListViewProps) {
  const router = useRouter();
  const { t, language } = useApp();
  const [buses, setBuses] = useState(initialBuses);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedUniversity, setSelectedUniversity] = useState('ALL');

  // Dynamic Companies List State
  const [companyList, setCompanyList] = useState<string[]>(DEFAULT_COMPANIES);
  const [isCompanyManagerOpen, setIsCompanyManagerOpen] = useState(false);

  useEffect(() => {
    setCompanyList(getStoredCompanies());
  }, []);

  // Edit Modal State
  const [editingBus, setEditingBus] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick Assign Company Vendor Modal State
  const [assigningCompanyBus, setAssigningCompanyBus] = useState<any | null>(null);
  const [vendorCompanyInput, setVendorCompanyInput] = useState(DEFAULT_COMPANIES[0]);
  const [customVendorInput, setCustomVendorInput] = useState('');
  const [isAssigningCompany, setIsAssigningCompany] = useState(false);

  // Delete Modal State
  const [deletingBus, setDeletingBus] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    { id: 'ALL', labelBn: 'সকল বিশ্ববিদ্যালয় (All Universities)', labelEn: 'All Universities' },
    { id: 'RU', labelBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', labelEn: 'Rajshahi University (RU)' },
    { id: 'DU', labelBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)', labelEn: 'Dhaka University (DU)' },
    { id: 'CU', labelBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', labelEn: 'Chittagong University (CU)' },
    { id: 'GST', labelBn: 'জিএসটি গুচ্ছ (GST Cluster)', labelEn: 'GST Cluster' },
    { id: 'JU', labelBn: 'জাহাঙ্গীরনগর (JU)', labelEn: 'Jahangirnagar Univ (JU)' },
    { id: 'KUET', labelBn: 'কুয়েট (KUET)', labelEn: 'KUET Express' },
    { id: 'SUST', labelBn: 'সাস্ট (SUST)', labelEn: 'SUST Sylhet' }
  ];

  // Helper to extract hotel package details
  const getHotelInfo = (notes?: string) => {
    if (!notes || !notes.includes('HOTEL PACKAGE:')) return null;
    const match = notes.match(/\[🏨 HOTEL PACKAGE: (.*?)\]/);
    if (match) return match[1];
    return null;
  };

  // Filter buses
  const filteredBuses = buses.filter((bus: any) => {
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
    
    const busType = bus.busType || bus.bus_type || 'MIXED';
    const matchesGender = selectedGender === 'ALL' || busType === selectedGender;

    let matchesUniversity = true;
    if (selectedUniversity !== 'ALL') {
      const busText = `${busName} ${notes} ${operator}`.toLowerCase();
      if (selectedUniversity === 'RU') {
        matchesUniversity = busText.includes('rajshahi') || busText.includes('রাবি') || busText.includes('রাজশাহী') || busText.includes('ru');
      } else if (selectedUniversity === 'DU') {
        matchesUniversity = busText.includes('dhaka') || busText.includes('ঢাবি') || busText.includes('ঢাকা') || busText.includes('du');
      } else if (selectedUniversity === 'CU') {
        matchesUniversity = busText.includes('chittagong') || busText.includes('চবি') || busText.includes('চট্টগ্রাম') || busText.includes('cu');
      } else if (selectedUniversity === 'GST') {
        matchesUniversity = busText.includes('gst') || busText.includes('গুচ্ছ') || busText.includes('cluster');
      } else if (selectedUniversity === 'JU') {
        matchesUniversity = busText.includes('jahangirnagar') || busText.includes('জাবি') || busText.includes('ju');
      } else if (selectedUniversity === 'KUET') {
        matchesUniversity = busText.includes('kuet') || busText.includes('খুলনা') || busText.includes('khulna');
      } else if (selectedUniversity === 'SUST') {
        matchesUniversity = busText.includes('sust') || busText.includes('সাস্ট') || busText.includes('sylhet');
      }
    }


    return matchesSearch && matchesGender && matchesUniversity;
  });

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
        setEditingBus(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to update bus');
      }
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
    try {
      const res = await updateBusAction(assigningCompanyBus.id, {
        operator: chosenOp
      });

      if (res.success) {
        setBuses(buses.map(b => b.id === assigningCompanyBus.id ? { ...b, operator: chosenOp } : b));
        setAssigningCompanyBus(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to assign company');
      }
    } finally {
      setIsAssigningCompany(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBus) return;

    setIsDeleting(true);
    try {
      const res = await deleteBusAction(deletingBus.id);
      if (res.success) {
        setBuses(buses.filter((b) => b.id !== deletingBus.id));
        setDeletingBus(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete bus');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {language === 'bn' ? 'ফ্লিট রোস্টার ও বাস তালিকা' : 'Fleet Governance'}
            </span>
            <Badge variant="primary">{buses.length} {language === 'bn' ? 'টি বাস নিবন্ধিত' : 'Registered Buses'}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {t.allBuses}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'সকল ফিজিক্যাল কোচ, টিকিট বিক্রি পরবর্তী বাস কোম্পানি নির্ধারণ, হোটেল প্যাকেজ ও সিট লেআউট নিয়ন্ত্রণ করুন।'
              : 'Manage physical coaches, post-booking vendor assignments, hotel tour packages, and seat layouts.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCompanyManagerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'কোম্পানি ম্যানেজ' : 'Manage Companies'}</span>
          </button>
          <Link href="/buses/seat-builder">
            <Button variant="outline" size="md" className="font-semibold text-sm">
              <Grid3X3 className="w-4 h-4 mr-1.5" />
              {t.seatBuilder}
            </Button>
          </Link>
          <Link href="/buses/create">
            <Button variant="primary" size="md" className="font-bold shadow-lg shadow-blue-500/25 text-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              {t.createBus}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={language === 'bn' ? 'বাসের নাম, নম্বর, কোম্পানি বা রুট খুঁজুন...' : 'Filter buses by name, code or route...'}
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* University Selector Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="w-full lg:w-60 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            {universityList.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {language === 'bn' ? uni.labelBn : uni.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Policy Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {['ALL', 'MIXED', 'FEMALE', 'MALE'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedGender(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedGender === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type === 'ALL'
                ? language === 'bn'
                  ? 'সকল বাস'
                  : 'All Buses'
                : type === 'FEMALE'
                ? language === 'bn'
                  ? 'মেয়েদের বাস'
                  : 'Female Only'
                : type === 'MALE'
                ? language === 'bn'
                  ? 'ছেলেদের বাস'
                  : 'Male Only'
                : language === 'bn'
                ? 'মিক্সড বাস'
                : 'Mixed'}
            </button>
          ))}
        </div>
      </div>

      {/* Bus Fleet Cards Grid with Enlarged Fonts & Action Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuses.map((bus) => {
          const hotelInfo = getHotelInfo(bus.notes);
          const isPendingCompany = !bus.operator || bus.operator.includes('Pending') || bus.operator.includes('পরে নির্ধারণ');

          return (
            <Card
              key={bus.id}
              className={`hover:shadow-xl transition-all flex flex-col justify-between group rounded-3xl overflow-hidden ${
                hotelInfo
                  ? 'border-2 border-purple-400/90 dark:border-purple-600/80 bg-gradient-to-b from-purple-50/70 via-white to-purple-50/20 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 shadow-md shadow-purple-500/10 ring-1 ring-purple-400/30'
                  : 'border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Distinct Top Ribbon Banner for Hotel Tour Buses */}
              {hotelInfo && (
                <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-[11px] font-black px-4 py-1.5 flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>🏨 হোটেল ও আবাসন প্যাকেজ স্পেশাল বাস</span>
                  </span>
                  <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
                    Hotel Included
                  </span>
                </div>
              )}

              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 inline-block">
                      {bus.busNumber}
                    </span>
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
                      {bus.busName}
                    </CardTitle>
                  </div>
                  <Badge variant={bus.status === 'ACTIVE' ? 'success' : bus.status === 'MAINTENANCE' ? 'warning' : 'default'} className="text-xs px-2.5 py-1 font-bold">
                    {bus.status}
                  </Badge>
                </div>

                {/* Prominent Company Badge on Card */}
                <div className="pt-2">
                  {!isPendingCompany ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[220px]">কোম্পানি: {bus.operator}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAssignCompany(bus)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-800 shadow-2xs transition-all cursor-pointer"
                      title="কোম্পানি অ্যাসাইন করতে ক্লিক করুন"
                    >
                      <span className="animate-pulse">⏳</span>
                      <span>কোম্পানি: পরে নির্ধারিত হবে (অ্যাসাইন করুন)</span>
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-4 flex-1 flex flex-col justify-between">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2 text-xs sm:text-sm font-medium">
                  {/* Transport Company Vendor Quick Control */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">{language === 'bn' ? 'অপারেটর ভেন্ডর:' : 'Operator:'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {bus.operator || 'N/A'}
                      </span>
                      <button
                        onClick={() => handleOpenAssignCompany(bus)}
                        className="p-1 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title={language === 'bn' ? 'কোম্পানি পরিবর্তন করুন' : 'Change Operator Vendor'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'bn' ? 'রেজিস্ট্রেশন নম্বর:' : 'Registration No:'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{bus.regNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'bn' ? 'লিঙ্গ নীতি:' : 'Gender Policy:'}</span>
                    <Badge variant={bus.busType === 'FEMALE' ? 'danger' : bus.busType === 'MALE' ? 'primary' : 'default'} className="font-bold">
                      {bus.busType === 'FEMALE' ? t.femaleBus : bus.busType === 'MALE' ? t.maleBus : t.mixedBus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'bn' ? 'ধারণক্ষমতা:' : 'Seating Capacity:'}</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{bus.capacity} {t.seatsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'bn' ? 'সিট লেআউট:' : 'Seat Layout:'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                      {bus.seatLayout?.name || 'Standard Layout'}
                    </span>
                  </div>
                </div>

                {/* Hotel & Accommodation Package Highlight Box */}
                {hotelInfo && (
                  <div className="p-3.5 bg-purple-100/80 dark:bg-purple-950/60 rounded-2xl border-2 border-purple-300 dark:border-purple-700 text-xs text-purple-950 dark:text-purple-100 space-y-1.5 shadow-2xs">
                    <div className="font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                      <span>🏨 হোটেল ও আবাসন সুবিধা প্যাকেজ</span>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-purple-900 dark:text-purple-200 font-medium leading-relaxed">
                      {hotelInfo}
                    </p>
                  </div>
                )}

                {bus.notes && !hotelInfo && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <div className="font-bold text-blue-800 dark:text-blue-300 mb-0.5 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'রুট ও বিবরণ:' : 'Route & Notes:'}</span>
                    </div>
                    <p className="line-clamp-2">{bus.notes}</p>
                  </div>
                )}

                {/* Action Buttons: Assign Company, Edit, Delete & Schedule Trip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAssignCompany(bus)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Assign Bus Company"
                    >
                      <BusIcon className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'কোম্পানি' : 'Company'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(bus)}
                      className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                      title={t.editBus}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBus(bus)}
                      className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                      title={t.deleteBus}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/trips/create?busId=${bus.id}`}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{t.scheduleTrip}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
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
    </div>
  );
}
