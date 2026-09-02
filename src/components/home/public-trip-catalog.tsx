'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  Building,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { useApp } from '@/lib/context';

export interface TripItemData {
  id: string;
  tripCode: string;
  tripBusType: string;
  departureDate: string;
  departureTime: string;
  basePrice: number;
  status: string;
  totalSeats: number;
  bookedCount: number;
  availableCount: number;
  hasAccommodation?: boolean;
  has_accommodation?: boolean;
  bus: {
    busName: string;
    busNumber?: string;
    regNumber?: string;
    seatLayout?: { totalSeats: number };
  };
  route: {
    origin: string;
    destination: string;
    routeName?: string;
  };
}

export interface PublicTripCatalogProps {
  trips: TripItemData[];
}

function BookingStatusBadge({
  trip,
  language,
}: {
  trip: TripItemData;
  language: string;
}) {
  const occupancy =
    trip.totalSeats > 0 ? (trip.bookedCount / trip.totalSeats) * 100 : 0;

  if (trip.availableCount <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30">
        <XCircle className="w-3 h-3" />
        {language === 'bn' ? 'বুকিং বন্ধ' : 'Sold Out'}
      </span>
    );
  }
  if (occupancy >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
        <AlertCircle className="w-3 h-3" />
        {language === 'bn' ? 'শেষ হচ্ছে!' : 'Filling Fast!'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" />
      {language === 'bn' ? 'বুকিং চলছে' : 'Booking Open'}
    </span>
  );
}

export function PublicTripCatalog({ trips }: PublicTripCatalogProps) {
  const { language, t } = useApp();

  return (
    <section id="trips" className="py-12 bg-slate-100/60 dark:bg-slate-900/30 transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {t.landingLiveBusSchedule || 'চলমান বাসের তালিকা'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.landingLiveBusSubtitle || 'লাইভ সিট সংখ্যা ও সরাসরি প্রি-বুকিং অপশন'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Availability
            </span>
          </div>
        </div>

        {/* Empty State */}
        {trips.length === 0 ? (
          <motion.div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Bus className="w-14 h-14 text-slate-400 dark:text-slate-700 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'কোনো বাস ট্রিপ পাওয়া যায়নি' : 'No Bus Trips Found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আবার দেখুন।'
                  : 'Try adjusting filters or check back later.'}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, idx) => {
              const occupancy =
                trip.totalSeats > 0
                  ? Math.round((trip.bookedCount / trip.totalSeats) * 100)
                  : 0;
              const isSoldOut = trip.availableCount <= 0;
              const hasAccommodation = Boolean(
                trip.hasAccommodation || trip.has_accommodation
              );

              return (
                <motion.div
                  key={trip.id}
                  className={`relative bg-white dark:bg-slate-900/90 border rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 group flex flex-col justify-between ${
                    isSoldOut
                      ? 'border-red-300 dark:border-red-900/40 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {/* Top Gradient Stripe */}
                  <div
                    className={`h-2 w-full bg-gradient-to-r ${
                      trip.tripBusType === 'FEMALE'
                        ? 'from-pink-500 via-rose-500 to-purple-500'
                        : trip.tripBusType === 'MALE'
                        ? 'from-blue-500 via-indigo-500 to-cyan-500'
                        : 'from-emerald-500 via-teal-500 to-cyan-500'
                    }`}
                  />

                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                            {trip.tripCode}
                          </span>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                            {trip.bus?.busName}
                          </h3>
                        </div>
                        <BookingStatusBadge trip={trip} language={language} />
                      </div>

                      {/* Coach Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            trip.tripBusType === 'FEMALE'
                              ? 'bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30'
                              : trip.tripBusType === 'MALE'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30'
                              : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30'
                          }`}
                        >
                          {trip.tripBusType === 'FEMALE'
                            ? '🚺 মহিলা স্পেশাল বাস'
                            : trip.tripBusType === 'MALE'
                            ? '🚹 ছাত্র স্পেশাল বাস'
                            : '🚌 মিক্সড এক্সপ্রেস'}
                        </span>

                        {hasAccommodation && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            আবাসন প্যাকেজ অন্তর্ভুক্ত
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Route Box */}
                    <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-500 font-medium mb-0.5">
                            {language === 'bn' ? 'কোথা থেকে' : 'Origin'}
                          </div>
                          <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{trip.route?.origin}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-1">
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="flex-1 text-right">
                          <div className="text-[10px] text-slate-500 font-medium mb-0.5">
                            {language === 'bn' ? 'কোথায় যাবে' : 'Destination'}
                          </div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 justify-end">
                            <span className="truncate">{trip.route?.destination}</span>
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/50 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(trip.departureDate)}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {formatTime(trip.departureTime)}
                        </span>
                      </div>
                    </div>

                    {/* Price & Availability */}
                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {language === 'bn' ? 'ভাড়া (প্রতি সিট)' : 'Fare'}
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(trip.basePrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {language === 'bn' ? 'ফাঁকা আসন' : 'Seats Available'}
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`text-xl font-mono ${
                              isSoldOut
                                ? 'text-red-500 dark:text-red-400'
                                : trip.availableCount > 5
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {trip.availableCount}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            / {trip.totalSeats}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isSoldOut
                            ? 'bg-red-500'
                            : occupancy > 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${occupancy}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/book/${trip.id}`}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                        isSoldOut
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none shadow-none'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/40 hover:scale-[1.01]'
                      }`}
                    >
                      {isSoldOut ? (
                        language === 'bn' ? 'সিট পূর্ণ (Sold Out)' : 'Sold Out'
                      ) : (
                        <>
                          {language === 'bn'
                            ? 'সিট দেখুন ও প্রি-বুকিং করুন'
                            : 'View Seats & Pre-Book'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
