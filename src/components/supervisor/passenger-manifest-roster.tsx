'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Sparkles,
  PhoneCall,
  CreditCard,
} from 'lucide-react';
import { PassengerAttendanceCard, PassengerRecord } from './passenger-attendance-card';
import { formatCurrency } from '@/lib/utils';

interface PassengerManifestRosterProps {
  passengers: PassengerRecord[];
  busName: string;
  busNumber: string;
  onStatusChange: (id: string, newStatus: 'BOARDED' | 'WAITING' | 'ABSENT') => void;
  onCollectDue: (id: string, amount: number) => void;
}

export function PassengerManifestRoster({
  passengers,
  busName,
  busNumber,
  onStatusChange,
  onCollectDue,
}: PassengerManifestRosterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'BOARDED' | 'WAITING' | 'ABSENT'>('ALL');

  // Extract unique boarding points
  const boardingPoints = useMemo(() => {
    return Array.from(new Set(passengers.map((p) => p.boardingPoint)));
  }, [passengers]);

  // Filtered passengers
  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      // Boarding point filter
      if (selectedBoardingPoint !== 'ALL' && p.boardingPoint !== selectedBoardingPoint) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL' && p.attendanceStatus !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesSeats = p.seatNumbers.some((s) => s.toLowerCase().includes(q));
        const matchesRef = p.bookingRef.toLowerCase().includes(q);
        const matchesExam = p.unitOrExam.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesSeats || matchesRef || matchesExam;
      }
      return true;
    });
  }, [passengers, selectedBoardingPoint, selectedStatusFilter, searchQuery]);

  // Statistics counters
  const totalCount = passengers.length;
  const boardedCount = passengers.filter((p) => p.attendanceStatus === 'BOARDED').length;
  const waitingCount = passengers.filter((p) => p.attendanceStatus === 'WAITING').length;
  const absentCount = passengers.filter((p) => p.attendanceStatus === 'ABSENT').length;
  const totalDueToCollect = passengers.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

  return (
    <div className="space-y-4">
      {/* 1. Attendance Statistics Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            মোট যাত্রী
          </div>
          <div className="text-xl font-black font-mono mt-1">{totalCount} জন</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter('BOARDED')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'BOARDED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            উপস্থিত (বোর্ডেড)
          </div>
          <div className="text-xl font-black font-mono mt-1">{boardedCount} জন</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter('WAITING')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'WAITING'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            অপেক্ষমাণ
          </div>
          <div className="text-xl font-black font-mono mt-1">{waitingCount} জন</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter('ABSENT')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'ABSENT'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-bold opacity-80 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            অনুপস্থিত
          </div>
          <div className="text-xl font-black font-mono mt-1">{absentCount} জন</div>
        </button>
      </div>

      {/* Due Alert Banner if dues exist */}
      {totalDueToCollect > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              বাসে যাত্রীদের থেকে মোট বকেয়া আদায়যোগ্য:{' '}
              <strong className="font-mono text-sm">{formatCurrency(totalDueToCollect)}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
            ক্যাশ সংগ্রহ করুন
          </span>
        </div>
      )}

      {/* 2. Premium Filter & Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <input
              type="text"
              placeholder="যাত্রীর নাম, মোবাইল নম্বর, সিট (A1) বা বুকিং..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner text-slate-900 dark:text-white"
            />
          </div>

          {/* Boarding Point Dropdown */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <select
              value={selectedBoardingPoint}
              onChange={(e) => setSelectedBoardingPoint(e.target.value)}
              className="block w-full pl-10 pr-10 py-3.5 appearance-none bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">📍 সকল বোর্ডিং পয়েন্ট ({passengers.length} জন)</option>
              {boardingPoints.map((point) => {
                const count = passengers.filter((p) => p.boardingPoint === point).length;
                return (
                  <option key={point} value={point}>
                    {point} ({count} জন)
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Results summary & active filter tag */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 px-2 mt-4 relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
          <span>
            প্রদর্শিত যাত্রী: <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredPassengers.length}</strong> জন
          </span>
          {(searchQuery || selectedBoardingPoint !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBoardingPoint('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-rose-500 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              ফিল্টার রিসেট
            </button>
          )}
        </div>
      </div>

      {/* 3. Passenger Cards Grid */}
      {filteredPassengers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">কোনো যাত্রী পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-400">ফিল্টার বা সার্চ কিওয়ার্ড পরিবর্তন করে চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPassengers.map((passenger) => (
            <PassengerAttendanceCard
              key={passenger.id}
              passenger={passenger}
              busName={busName}
              busNumber={busNumber}
              onStatusChange={onStatusChange}
              onCollectDue={onCollectDue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
