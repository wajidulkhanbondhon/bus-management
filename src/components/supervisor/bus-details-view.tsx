'use client';

import React from 'react';
import {
  Bus,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Shield,
  User,
  Navigation,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { AssignedBusInfo } from './supervisor-trip-header';
import { formatTime, formatDate } from '@/lib/utils';

interface BoardingStopTimeline {
  stopName: string;
  landmark: string;
  expectedTime: string;
  passengerCount: number;
}

interface BusDetailsViewProps {
  busInfo: AssignedBusInfo;
  stops: BoardingStopTimeline[];
}

export function BusDetailsView({ busInfo, stops }: BusDetailsViewProps) {
  return (
    <div className="space-y-4">
      {/* 1. Bus Specifications Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {busInfo.busName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {busInfo.busNumber}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              busInfo.coachType === 'FEMALE'
                ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                : busInfo.coachType === 'MALE'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {busInfo.coachType === 'FEMALE'
              ? '🚺 মহিলা স্পেশাল'
              : busInfo.coachType === 'MALE'
              ? '🚹 ছাত্র স্পেশাল'
              : '🚌 মিক্সড এক্সপ্রেস'}
          </span>
        </div>

        {/* Key Bus Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">মোট আসন</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">
              {busInfo.totalSeats} টি সিট
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ট্রিপ কোড</span>
            <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
              {busInfo.tripCode}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">যাত্রার তারিখ</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatDate(busInfo.departureDate)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ছাড়ার সময়</span>
            <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
              {formatTime(busInfo.departureTime)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Driver & Staff Details */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ড্রাইভার ও ট্রিপ স্টাফ তথ্য
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Driver Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                প্রধান ড্রাইভার
              </span>
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {busInfo.driverName}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{busInfo.driverPhone}</p>
            </div>
            <a
              href={`tel:${busInfo.driverPhone}`}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
              title="ড্রাইভারকে কল দিন"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Supervisor Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                দায়িত্বপ্রাপ্ত সুপারভাইজার
              </span>
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {busInfo.supervisorName}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{busInfo.supervisorPhone}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              অন-ডিউটি
            </span>
          </div>
        </div>
      </div>

      {/* 3. Stops & Pickup Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            বোর্ডিং পয়েন্ট ও স্টপ টাইমলাইন
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            {stops.length} টি পিকআপ পয়েন্ট
          </span>
        </div>

        <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-8">
          {stops.map((stop, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className="absolute -left-8 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{stop.stopName}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      ({stop.expectedTime})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {stop.landmark}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold font-mono">
                  {stop.passengerCount} জন উঠবে
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Emergency & Safety Guidelines */}
      <div className="bg-rose-50 dark:bg-rose-950/30 rounded-3xl p-5 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-rose-900 dark:text-rose-200">
        <h4 className="font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          জরুরি নির্দেশনা ও সাপোর্ট
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
          <li>যেকোনো যাত্রী অনুপস্থিত থাকলে গাড়ী ছাড়ার ৫ মিনিট পূর্বে ফোন দিন।</li>
          <li>বাসে ক্যাশ আদায় করলে সাথে সাথে সিস্টেমে "ক্যাশ সংগ্রহ" বাটনে ক্লিক করে আপডেট করুন।</li>
          <li>হেড অফিস জরুরি কন্ট্রোল রুম: <strong>01711-000001</strong></li>
        </ul>
      </div>
    </div>
  );
}
