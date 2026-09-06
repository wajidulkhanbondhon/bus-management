'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Users,
  RefreshCw,
  Sparkles,
  Volume2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  initialBookings: any[];
}

export function ConductorQrScannerClient({ initialBookings }: Props) {
  const { language } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [activeCamera, setActiveCamera] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [boardedRecords, setBoardedRecords] = useState<Record<string, { time: string; supervisor: string }>>({});
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const totalPassengers = initialBookings.length;
  const totalBoarded = Object.keys(boardedRecords).length;

  const handleVerifyTicket = (rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return;

    const found = initialBookings.find((b) => {
      const bNum = (b.booking_number || b.bookingNumber || '').toLowerCase();
      const phone = (b.contact_phone || b.contactPhone || b.passengers?.[0]?.passenger_phone || '').toLowerCase();
      return bNum.includes(q) || phone.includes(q);
    });

    if (found) {
      setScannedResult(found);
      setFeedbackNotice({
        type: 'success',
        text: language === 'bn' ? 'টিকিট সফলভাবে সনাক্ত হয়েছে!' : 'Ticket successfully identified!'
      });
      // Audio beep feedback if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    } else {
      setScannedResult(null);
      setFeedbackNotice({
        type: 'error',
        text: language === 'bn' ? 'কোনো বৈধ টিকিট পাওয়া যায়নি!' : 'No valid ticket found for this code!'
      });
    }
  };

  const handleMarkBoarded = (bId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setBoardedRecords((prev) => ({
      ...prev,
      [bId]: { time: timeStr, supervisor: 'সুপারভাইজার' }
    }));
    setFeedbackNotice({
      type: 'success',
      text: language === 'bn' ? 'যাত্রী সফলভাবে বোর্ডেড (বাসে উঠেছেন) হিসেবে মার্ক করা হয়েছে!' : 'Passenger marked as Boarded!'
    });
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'কন্ডাক্টর ও সুপারভাইজার বোর্ডিং স্ক্যানার' : 'Conductor QR Boarding Scanner'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'যাত্রীর টিকিটের QR কোড স্ক্যান করে বাসে প্রবেশের তাৎক্ষণিক ছাড়পত্র দিন'
                : 'Scan ticket QR code or search to verify boarding candidates'}
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold block">মোট আসন বুকড</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{totalPassengers}</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">বোর্ডেড / উপস্থিত</span>
            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">{totalBoarded}</span>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {feedbackNotice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{feedbackNotice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Scanner Viewfinder & Input */}
        <div className="md:col-span-5 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <CardHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
              <span className="text-xs font-black flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                ক্যামেরা স্ক্যানার
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveCamera(!activeCamera)}
                className="text-[11px] h-7 bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                {activeCamera ? 'ক্যামেরা বন্ধ করুন' : 'ক্যামেরা চালু করুন'}
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative aspect-square w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center overflow-hidden border border-slate-800">
                {activeCamera ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* Simulated live video viewfinder */}
                    <div className="absolute inset-8 border-2 border-emerald-500/80 rounded-2xl animate-pulse flex items-center justify-center pointer-events-none">
                      <div className="w-full h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    </div>
                    <p className="text-xs text-slate-400 font-mono z-10">টিকিটের QR কোড স্ক্যানারের সামনে ধরুন</p>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <QrCode className="w-16 h-16 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">
                      ক্যামেরা স্ক্যানার বন্ধ রয়েছে। নিচের বক্সে টিকিট নম্বর টাইপ করতে পারেন।
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Ticket Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'ম্যানুয়াল টিকিট নম্বর বা মোবাইল' : 'Manual Ticket # or Mobile:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyTicket(manualCode)}
                    placeholder="BK-2026... অথবা 017..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleVerifyTicket(manualCode)}
                    className="rounded-xl shrink-0 font-bold text-xs"
                  >
                    যাচাই
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Candidate Verification Card */}
        <div className="md:col-span-7">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs h-full">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center justify-between">
                <span>যাত্রী যাচাই ও বোর্ডিং তথ্য</span>
                {scannedResult && (
                  <Badge variant="primary" className="font-mono text-xs">
                    {scannedResult.booking_number || scannedResult.bookingNumber}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!scannedResult ? (
                <div className="text-center py-20 space-y-3">
                  <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">
                    স্ক্যান করুন অথবা টিকিট নম্বর লিখে যাচাই বোতাম চাপুন
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Big Seat Indicator */}
                  <div className="p-5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">বরাদ্দকৃত আসন (Seat)</span>
                      <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                        {(scannedResult.seats || []).map((s: any) => s.seat_number || s.seatNumber || s.seat_id).join(', ') || 'A1'}
                      </span>
                    </div>

                    {boardedRecords[scannedResult.id] ? (
                      <Badge variant="success" className="text-xs px-3 py-1 font-bold">
                        ✓ বোর্ডেড ({boardedRecords[scannedResult.id].time})
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs px-3 py-1 font-bold animate-pulse">
                        উপস্থিতি বাকি (Pending)
                      </Badge>
                    )}
                  </div>

                  {/* Passenger Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">শিক্ষার্থী / প্রার্থীর নাম:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {scannedResult.contact_name || scannedResult.contactName || scannedResult.passengers?.[0]?.passenger_name || 'Candidate'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">মোবাইল নম্বর:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                        {scannedResult.contact_phone || scannedResult.contactPhone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">গন্তব্য বিশ্ববিদ্যালয়:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {scannedResult.trip?.targetUniversity || scannedResult.trip?.route?.destination || 'বিশ্ববিদ্যালয় কেন্দ্র'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">পেমেন্ট অবস্থা:</span>
                      <span className="font-bold text-emerald-600">
                        পরিশোধিত ({formatCurrency(scannedResult.net_amount || scannedResult.netAmount || 0)})
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Boarding Button */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    {boardedRecords[scannedResult.id] ? (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        এই যাত্রী ইতিমধ্যে বাসে অবস্থান গ্রহণ করেছেন।
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleMarkBoarded(scannedResult.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl py-3.5 shadow-lg shadow-emerald-500/25"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        যাত্রী বাসে উঠেছেন (Mark as Boarded)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
