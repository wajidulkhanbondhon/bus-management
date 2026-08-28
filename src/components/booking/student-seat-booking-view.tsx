'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bus,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { InteractiveSeatMap } from '@/components/trip/interactive-seat-map';
import { SeatStatusDetail } from '@/services/inventory.service';
import { formatTime, formatDate } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  trip: any;
  seats: SeatStatusDetail[];
  summary: any;
}

export function StudentSeatBookingView({ trip, seats, summary }: Props) {
  const { language } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Top Banner Navigation matching Dashboard standard */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Brand & Route Info */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 font-bold">
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'bn' ? 'হোম পেজে ফিরুন' : 'Back to Home'}</span>
                </Button>
              </Link>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-[10px] font-black uppercase tracking-wider font-mono">
                    {trip.tripCode || 'ADMISSION-SPECIAL'}
                  </Badge>
                  {trip.tripBusType && (
                    <Badge variant={trip.tripBusType === 'FEMALE' ? 'purple' : 'default'} className="text-[10px] font-bold">
                      {trip.tripBusType === 'FEMALE' ? '👩 ছাত্রী স্পেশাল' : trip.tripBusType === 'MALE' ? '👨 ছাত্র স্পেশাল' : '👥 মিশ্র কোচ'}
                    </Badge>
                  )}
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                  <span>{trip.route?.origin || 'Dhaka'}</span>
                  <span className="text-blue-600 font-bold">➔</span>
                  <span className="text-blue-600">{trip.route?.destination || 'Exam Campus'}</span>
                </h1>
              </div>
            </div>

            {/* Quick Trip Metadata & Live Seats */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{formatDate(trip.departureDate || trip.departure_date)}</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{formatTime(trip.departureTime || trip.departure_time)}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {trip.bus?.busName || 'Luxury Admission Coach'} ({trip.bus?.busNumber || 'DHAKA-METRO'})
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black font-mono">
                {summary.availableSeats} সিট খালি
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Shared Dynamic Luxury Seat Map Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <InteractiveSeatMap
          trip={trip}
          seats={seats}
          summary={summary}
        />
      </div>
    </div>
  );
}
