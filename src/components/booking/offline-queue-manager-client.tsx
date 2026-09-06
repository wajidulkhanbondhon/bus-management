'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Database,
  Trash2,
  Ticket
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOfflineBookingsQueue,
  syncOfflineBookingsToServer,
  OfflineBookingRecord,
  isNetworkOnline
} from '@/services/offline-sync.service';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

export function OfflineQueueManagerClient() {
  const { language } = useApp();
  const [queue, setQueue] = useState<OfflineBookingRecord[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{ synced: number; conflicts: number } | null>(null);

  const refreshQueue = () => {
    setQueue(getOfflineBookingsQueue());
    setIsOnline(isNetworkOnline());
  };

  useEffect(() => {
    refreshQueue();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert(language === 'bn' ? 'ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে নেট চেক করুন।' : 'No internet connection.');
      return;
    }

    setIsSyncing(true);
    setSyncSummary(null);
    try {
      const res = await syncOfflineBookingsToServer();
      setSyncSummary({ synced: res.syncedCount, conflicts: res.conflictCount });
      refreshQueue();
    } catch (e: any) {
      alert(e.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSynced = () => {
    if (typeof window === 'undefined') return;
    const current = getOfflineBookingsQueue();
    const pendingOnly = current.filter((r) => r.syncStatus !== 'SYNCED');
    localStorage.setItem('atmos_bus_offline_bookings_queue_v1', JSON.stringify(pendingOnly));
    refreshQueue();
  };

  const pendingCount = queue.filter((r) => r.syncStatus === 'PENDING').length;
  const syncedCount = queue.filter((r) => r.syncStatus === 'SYNCED').length;
  const conflictCount = queue.filter((r) => r.syncStatus === 'CONFLICT').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
        isOnline
          ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800'
          : 'bg-gradient-to-r from-amber-700 via-rose-700 to-amber-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
            {isOnline ? <Wifi className="w-6 h-6 text-emerald-300" /> : <WifiOff className="w-6 h-6 text-amber-300 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-md">
                {isOnline ? 'Online Synced' : 'Offline Storage Active'}
              </span>
              <Badge variant={isOnline ? 'success' : 'danger'} className="text-[10px] font-bold">
                {isOnline ? (language === 'bn' ? '● ইন্টারনেট কানেক্টেড' : '● Online') : (language === 'bn' ? '○ ইন্টারনেট ডিসকানেক্টেড' : '○ Offline')}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'অফলাইন বুকিং সিঙ্ক কিউ' : 'Offline Bookings & Sync Manager'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            disabled={isSyncing || pendingCount === 0 || !isOnline}
            onClick={handleSyncNow}
            className="bg-white text-slate-900 hover:bg-slate-100 border-white font-black text-xs rounded-xl shadow-md cursor-pointer"
          >
            {isSyncing ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{language === 'bn' ? 'সার্ভারে সিঙ্ক হচ্ছে...' : 'Syncing...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'bn' ? 'সার্ভারে সিঙ্ক করুন' : 'Sync to Server'}</span>
              </span>
            )}
          </Button>

          {syncedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearSynced}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? 'সিঙ্কড হিস্ট্রি মুছুন' : 'Clear Synced'}
            </Button>
          )}
        </div>
      </div>

      {/* Sync Result Toast Banner */}
      {syncSummary && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'bn'
                ? `সফলভাবে ${syncSummary.synced} টি টিকিট সেন্ট্রাল সার্ভারে সিঙ্ক হয়েছে।`
                : `Successfully synced ${syncSummary.synced} bookings.`}
              {syncSummary.conflicts > 0 && (
                <span className="text-rose-600 ml-2">
                  ({syncSummary.conflicts} {language === 'bn' ? 'টি কনফ্লিক্ট দেখা গেছে' : 'conflicts'})
                </span>
              )}
            </span>
          </div>
          <button type="button" onClick={() => setSyncSummary(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Metric HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">{language === 'bn' ? 'মোট অফলাইন টিকিট' : 'Total Queue'}</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">{queue.length} টি</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase block">{language === 'bn' ? 'পেন্ডিং সিঙ্ক' : 'Pending Sync'}</span>
          <span className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200 mt-1 block">{pendingCount} টি</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">{language === 'bn' ? 'সিঙ্ক সম্পন্ন' : 'Synced'}</span>
          <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200 mt-1 block">{syncedCount} টি</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase block">{language === 'bn' ? 'কনফ্লিক্ট / এরর' : 'Conflicts'}</span>
          <span className="text-2xl font-black font-mono text-rose-900 dark:text-rose-200 mt-1 block">{conflictCount} টি</span>
        </div>
      </div>

      {/* Queue Records Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>{language === 'bn' ? 'অফলাইন ব্রাউজার লোকালস্টোরেজ রেকর্ড' : 'Offline Queue Records'}</span>
          </CardTitle>
          <span className="text-xs font-mono font-bold text-slate-500">
            Storage Key: atmos_bus_offline_bookings_queue_v1
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 font-bold text-slate-600 dark:text-slate-300">
                <th className="p-3.5 pl-6">{language === 'bn' ? 'লোকাল আইডি' : 'Local Ref ID'}</th>
                <th className="p-3.5">{language === 'bn' ? 'যাত্রী ও সিট' : 'Passenger & Seats'}</th>
                <th className="p-3.5">{language === 'bn' ? 'ভাড়া ও পেমেন্ট' : 'Fare & Payment'}</th>
                <th className="p-3.5">{language === 'bn' ? 'অফলাইনে কাটা হয়েছে' : 'Booked At'}</th>
                <th className="p-3.5 pr-6 text-right">{language === 'bn' ? 'সিঙ্ক স্ট্যাটাস' : 'Sync Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'অফলাইন কিউ পুরোপুরি খালি' : 'Offline Queue is completely empty'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'bn' ? 'সব টিকিট রিয়েল-টাইমে মূল সার্ভারে আপলোড করা আছে।' : 'All counter tickets have been securely pushed to PostgreSQL.'}
                    </p>
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.localId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-6 font-mono font-black text-slate-800 dark:text-slate-200">
                      {item.localId}
                      {item.bookingNumber && (
                        <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                          ➔ {item.bookingNumber}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.passengers?.[0]?.passenger_name || 'Passenger'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.passengers?.[0]?.passenger_phone || '—'} • সিট: {item.seats.map((s) => s.seat_number || s.seat_id).join(', ')}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.paid_amount || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {item.payment_method || 'HAND_CASH'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {item.bookedAt ? `${formatDate(item.bookedAt)} ${formatTime(item.bookedAt)}` : '—'}
                    </td>

                    <td className="p-3.5 pr-6 text-right">
                      <Badge
                        variant={
                          item.syncStatus === 'SYNCED'
                            ? 'success'
                            : item.syncStatus === 'CONFLICT'
                            ? 'danger'
                            : item.syncStatus === 'SYNCING'
                            ? 'primary'
                            : 'warning'
                        }
                        className="text-[10px] font-bold"
                      >
                        {item.syncStatus === 'SYNCED'
                          ? '✓ SYNCED'
                          : item.syncStatus === 'CONFLICT'
                          ? '✕ CONFLICT'
                          : item.syncStatus === 'SYNCING'
                          ? '⏳ SYNCING'
                          : '⏱ PENDING'}
                      </Badge>
                      {item.conflictReason && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">
                          {item.conflictReason}
                        </p>
                      )}
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
