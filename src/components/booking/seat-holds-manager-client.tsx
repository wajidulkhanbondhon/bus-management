'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LockKeyhole,
  Unlock,
  ShieldAlert,
  Clock,
  Bus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Armchair
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface HoldOrLockItem {
  id: string;
  type: 'HOLD' | 'LOCK';
  seatId: string;
  seatNumber: string;
  tripId: string;
  tripCode: string;
  busNumber?: string;
  destination?: string;
  staffName?: string;
  reason: string;
  expiresAt?: string;
  createdAt: string;
}

interface Props {
  initialItems: HoldOrLockItem[];
  allTrips: any[];
}

export function SeatHoldsManagerClient({ initialItems, allTrips }: Props) {
  const { language } = useApp();
  const [items, setItems] = useState<HoldOrLockItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'HOLD' | 'LOCK'>('ALL');
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.seatNumber.toLowerCase().includes(q) ||
      item.tripCode.toLowerCase().includes(q) ||
      (item.busNumber && item.busNumber.toLowerCase().includes(q)) ||
      item.reason.toLowerCase().includes(q);

    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleRelease = async (item: HoldOrLockItem) => {
    if (!confirm(language === 'bn' ? `আপনি কি নিশ্চিত যে সিট ${item.seatNumber} মুক্ত করতে চান?` : `Release seat ${item.seatNumber}?`)) {
      return;
    }

    setReleasingId(item.id);
    try {
      if (item.type === 'HOLD') {
        const res = await fetch(`/api/backend/inventory/${item.tripId}/release-seat-hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seat_id: item.seatId })
        });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        } else {
          alert('Failed to release hold');
        }
      } else {
        const res = await fetch(`/api/backend/inventory/${item.tripId}/unlock-seat?seat_id=${encodeURIComponent(item.seatId)}`, {
          method: 'POST'
        });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        } else {
          alert('Failed to unlock seat');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error releasing seat');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <LockKeyhole className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-400">
                Seat Protection Engine
              </span>
              <Badge variant="primary" className="text-[10px] font-bold">
                {items.length} {language === 'bn' ? 'টি সিট সুরক্ষিত' : 'Protected'}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'হোল্ড ও ভিআইপি সিট লক ম্যানেজার' : 'Seat Holds & VIP Locks Manager'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/bookings/quick">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold">
              ⚡ {language === 'bn' ? 'কাউন্টার বুকিং' : 'Counter Booking'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'সিট নম্বর, বাস বা কারণ খুঁজুন...' : 'Search seat, bus, reason...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(['ALL', 'HOLD', 'LOCK'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === t
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t === 'ALL' ? (language === 'bn' ? 'সব' : 'All') : t === 'HOLD' ? (language === 'bn' ? '⏳ হোল্ড' : 'Holds') : (language === 'bn' ? '🔒 ভিআইপি লক' : 'Locks')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 font-bold text-slate-600 dark:text-slate-300">
                <th className="p-3.5 pl-6">{language === 'bn' ? 'সিট ও স্ট্যাটাস' : 'Seat & Status'}</th>
                <th className="p-3.5">{language === 'bn' ? 'ট্রিপ ও বাস' : 'Trip & Bus'}</th>
                <th className="p-3.5">{language === 'bn' ? 'সুরক্ষার ধরন ও কারণ' : 'Reason / Lock Type'}</th>
                <th className="p-3.5">{language === 'bn' ? 'স্টাফ / অপারেটর' : 'Held By'}</th>
                <th className="p-3.5">{language === 'bn' ? 'মেয়াদকাল' : 'Expires At'}</th>
                <th className="p-3.5 pr-6 text-right">{language === 'bn' ? 'একশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Armchair className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                      {language === 'bn' ? 'কোনো হোল্ড বা লক করা সিট নেই' : 'No active seat holds or locks found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'bn' ? 'সব সিট স্বাভাবিক নিয়মে বিক্রির জন্য উন্মুক্ত রয়েছে।' : 'All seats are currently open for public booking.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black font-mono text-sm border-2 ${
                          item.type === 'HOLD'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                        }`}>
                          {item.seatNumber}
                        </div>
                        <div>
                          <Badge variant={item.type === 'HOLD' ? 'warning' : 'purple'} className="text-[10px] font-bold">
                            {item.type === 'HOLD' ? 'সাময়িক হোল্ড' : 'ভিআইপি লক'}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.busNumber || item.tripCode}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{item.destination || 'Exam Campus'}</span>
                    </td>

                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {item.reason}
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {item.staffName || 'Counter Staff'}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {item.expiresAt ? formatTime(item.expiresAt) : 'স্থায়ী (Manual Release)'}
                    </td>

                    <td className="p-3.5 pr-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={releasingId === item.id}
                        onClick={() => handleRelease(item)}
                        className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-800 cursor-pointer"
                      >
                        {releasingId === item.id ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                            <span>রিলিজ হচ্ছে...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'সিট মুক্ত করুন' : 'Release Seat'}</span>
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
