'use client';

import React from 'react';
import { Bus, MapPin, Calendar, Clock, Phone, UserCheck, ShieldCheck, LogOut, Navigation } from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';

export interface AssignedBusInfo {
  id: string;
  tripCode: string;
  busName: string;
  busNumber: string;
  coachType: 'MALE' | 'FEMALE' | 'MIXED';
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  estimatedArrival: string;
  totalSeats: number;
  driverName: string;
  driverPhone: string;
  supervisorName: string;
  supervisorPhone: string;
  issuedCash: number;
}

interface SupervisorTripHeaderProps {
  busInfo: AssignedBusInfo;
  totalBoarded: number;
  totalPassengers: number;
  remainingCash: number;
  onLogout: () => void;
}

export function SupervisorTripHeader({
  busInfo,
  totalBoarded,
  totalPassengers,
  remainingCash,
  onLogout,
}: SupervisorTripHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white p-4 sm:p-6 sticky top-0 z-30 shadow-xl border-b border-emerald-600/30">
      {/* Top Bar: Brand & Profile */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-emerald-200 border border-white/20 shadow-inner">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight">{busInfo.busName}</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded-full">
                {busInfo.busNumber}
              </span>
            </div>
            <div className="text-xs text-emerald-100/80 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>সুপারভাইজার: <strong>{busInfo.supervisorName}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 bg-white/10 hover:bg-rose-500/30 rounded-xl text-emerald-100 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="লগআউট"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Attendance Counter */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-inner">
          <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-300" />
            হাজিরা / বোর্ডিং
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white">{totalBoarded}</span>
            <span className="text-xs text-emerald-200 font-mono">/ {totalPassengers} জন</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalPassengers > 0 ? (totalBoarded / totalPassengers) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Live Cash Balance */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-inner">
          <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider mb-1">
            হাতে থাকা ক্যাশ
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {formatCurrency(remainingCash)}
          </div>
          <div className="text-[10px] text-emerald-200/80 mt-1 truncate">
            ইস্যু: {formatCurrency(busInfo.issuedCash)}
          </div>
        </div>

        {/* Route Details */}
        <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-inner flex flex-col justify-between">
          <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-300" />
              রুট ও সময়
            </span>
            <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
              {busInfo.tripCode}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate mt-1">
            {busInfo.origin} ➔ {busInfo.destination}
          </div>
          <div className="text-[10px] text-emerald-200/90 flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-amber-300" />
              {formatTime(busInfo.departureTime)}
            </span>
            <span>•</span>
            <span>{formatDate(busInfo.departureDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
