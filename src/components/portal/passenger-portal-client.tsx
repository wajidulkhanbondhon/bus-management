'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Search,
  CheckCircle2,
  Users,
  Flame,
  ArrowRight,
  Filter,
  CreditCard,
  Lock,
  UserCheck,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { PassengerSeatSelectorModal } from '@/components/booking/passenger-seat-selector-modal';

interface Props {
  initialTrips: any[];
  origins: string[];
  destinations: string[];
}

export function PassengerPortalClient({ initialTrips, origins, destinations }: Props) {
  const [trips, setTrips] = useState<any[]>(initialTrips);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedGenderType, setSelectedGenderType] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');
  const [trackingQuery, setTrackingQuery] = useState<string>('');

  // Selected trip for seat modal
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  // Filter trips locally
  const filteredTrips = trips.filter(trip => {
    if (selectedOrigin !== 'ALL' && trip.route?.origin !== selectedOrigin) return false;
    if (selectedDestination !== 'ALL' && trip.route?.destination !== selectedDestination) return false;
    if (selectedGenderType !== 'ALL' && trip.tripBusType !== selectedGenderType) return false;
    if (searchDate) {
      const tripDateStr = new Date(trip.departureDate).toISOString().slice(0, 10);
      if (tripDateStr !== searchDate) return false;
    }
    return true;
  });

  const handleOpenSeatModal = (trip: any) => {
    setActiveTrip(trip);
    setIsSeatModalOpen(true);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 pt-10 pb-14 border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              বিশ্ববিদ্যালয় ভর্তি স্পেশাল বাস সার্ভিস ও রিজার্ভেশন
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              সহজে বাস সিট পছন্দ করুন, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
                ভেরিফিকেশন শেষে টিকিট কনফার্ম করুন
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              সরাসরি কোনো অগ্রিম পেমেন্ট ছাড়াই আপনার পছন্দের সিটটি সিলেক্ট করে প্রি-বুকিং রিকোয়েস্ট পাঠান। আমাদের অফিস প্রতিনিধি ফোন দিয়ে ভেরিফাই করে আপনার জন্য নির্দিষ্ট পেমেন্ট টাইমার উন্মুক্ত করবেন।
            </p>
          </div>

          {/* Search / Filter Box */}
          <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Origin */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  যাত্রা শুরু (From)
                </label>
                <select
                  value={selectedOrigin}
                  onChange={e => setSelectedOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">সকল উৎস (All Origins)</option>
                  {origins.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  গন্তব্য (To)
                </label>
                <select
                  value={selectedDestination}
                  onChange={e => setSelectedDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">সকল গন্তব্য (All Destinations)</option>
                  {destinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Gender Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  বাসের ধরন (Bus Type)
                </label>
                <select
                  value={selectedGenderType}
                  onChange={e => setSelectedGenderType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">সকল বাস (All Buses)</option>
                  <option value="FEMALE">মহিলা স্পেশাল বাস (Female Only)</option>
                  <option value="MALE">ছাত্র স্পেশাল বাস (Male Only)</option>
                  <option value="MIXED">মিক্সড বাস (Mixed)</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  যাত্রার তারিখ (Date)
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="text-slate-400 font-medium flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                পাওয়া গেছে <span className="text-white font-bold">{filteredTrips.length}</span> টি বাস শিডিউল
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrigin('ALL');
                  setSelectedDestination('ALL');
                  setSelectedGenderType('ALL');
                  setSearchDate('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works Workflow Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              ১
            </div>
            <h3 className="font-bold text-white text-sm">সিট বেছে নিয়ে অনুরোধ পাঠান</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              বাসের তালিকা থেকে সুবিধাজনক রুট ও সময় বেছে নিয়ে ফাঁকা সিট সিলেক্ট করুন এবং নাম ও ফোন নম্বর দিয়ে রিকোয়েস্ট সাবমিট করুন।
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ২
            </div>
            <h3 className="font-bold text-white text-sm">কল সেন্টার প্রতিনিধি তথ্য ভেরিফাই করবেন</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              আমাদের প্রতিনিধি কল করে ছেলে/মেয়ে সিট পলিসি ও শিক্ষার্থী আইডি যাচাই করবেন এবং আপনার সিটের জন্য নির্দিষ্ট পেমেন্ট টাইমার চালু করবেন।
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ৩
            </div>
            <h3 className="font-bold text-white text-sm">টাইমারের মধ্যে পেমেন্ট ও টিকিট ইস্যু</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              টাইমার চলাকালীন সিটটি শুধু আপনার জন্য লক থাকবে। পেমেন্ট কনফার্ম হওয়া মাত্র অফিসিয়াল ডিজিটাল টিকিট জেনারেট হয়ে যাবে।
            </p>
          </div>
        </div>
      </section>

      {/* 3. Available Trips Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-400" />
              চলমান বাসের তালিকা ও সিট বরাদ্দ
            </h2>
            <p className="text-xs text-slate-400">লাইভ সিট সংখ্যা ও সরাসরি সিট বুকিং অপশন</p>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <Bus className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">কোনো বাস ট্রিপ পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map(trip => {
              const occupancy = Math.round((trip.bookedCount / trip.totalSeats) * 100);

              return (
                <Card
                  key={trip.id}
                  className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top Bus & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-blue-400 block uppercase">
                          {trip.tripCode}
                        </span>
                        <h3 className="font-bold text-base text-white">{trip.bus?.busName}</h3>
                        <p className="text-[11px] text-slate-400">{trip.bus?.regNumber}</p>
                      </div>

                      <Badge
                        variant={
                          trip.tripBusType === 'FEMALE'
                            ? 'purple'
                            : trip.tripBusType === 'MALE'
                            ? 'primary'
                            : 'default'
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {trip.tripBusType === 'FEMALE'
                          ? 'মহিলা বাস'
                          : trip.tripBusType === 'MALE'
                          ? 'ছাত্র বাস'
                          : 'মিক্সড বাস'}
                      </Badge>
                    </div>

                    {/* Route Details */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span className="flex items-center gap-1.5 text-blue-300">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          {trip.route?.origin}
                        </span>
                        <span className="text-slate-500 font-normal">➔</span>
                        <span className="text-emerald-300">{trip.route?.destination}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(trip.departureDate)}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-200">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTime(trip.departureTime)}
                        </span>
                      </div>
                    </div>

                    {/* Seat & Price Status */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">ভাড়া (Fare)</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {formatCurrency(trip.basePrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">ফাঁকা সিট (Available)</span>
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          <span
                            className={`text-sm font-mono ${
                              trip.availableCount > 5 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {trip.availableCount}
                          </span>
                          <span className="text-slate-500 text-[10px]">/ {trip.totalSeats}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleOpenSeatModal(trip)}
                      disabled={trip.availableCount === 0}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 shadow-md shadow-blue-600/30"
                    >
                      {trip.availableCount === 0 ? (
                        'সিট পূর্ণ (Sold Out)'
                      ) : (
                        <>
                          সিট দেখুন ও প্রি-বুকিং করুন
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Booking Tracking Quick Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-900/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              ইতিমধ্যে প্রি-বুকিং করেছেন? স্ট্যাটাস ও টাইমার চেক করুন
            </h3>
            <p className="text-xs text-slate-300">
              আপনার বুকিং রেফারেন্স নম্বর (যেমন: BK-20260827-10024) অথবা মোবাইল নম্বর দিয়ে সার্চ করে ভেরিফিকেশন ও পেমেন্ট টাইমার স্ট্যাটাস দেখুন।
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (trackingQuery.trim()) {
                window.location.href = `/track/${trackingQuery.trim()}`;
              }
            }}
            className="flex w-full md:w-auto items-center gap-2"
          >
            <input
              type="text"
              placeholder="বুকিং নম্বর বা মোবাইল"
              value={trackingQuery}
              onChange={e => setTrackingQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs placeholder:text-slate-500 font-mono w-full sm:w-64"
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 py-2.5"
            >
              ট্র্যাক করুন
            </Button>
          </form>
        </div>
      </section>

      {/* 5. Passenger Seat Selector Modal */}
      {activeTrip && (
        <PassengerSeatSelectorModal
          isOpen={isSeatModalOpen}
          onClose={() => {
            setIsSeatModalOpen(false);
            setActiveTrip(null);
          }}
          trip={activeTrip}
          seats={activeTrip.bus?.seatLayout?.seats || []}
        />
      )}
    </div>
  );
}
