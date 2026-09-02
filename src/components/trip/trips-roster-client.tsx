'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Clock,
  Bus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Search,
  Sparkles,
  Users,
  Eye,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  initialTrips: any[];
}

export function TripsRosterClient({ initialTrips }: Props) {
  const { language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'COMPLETED'>('ALL');

  const filteredTrips = useMemo(() => {
    return initialTrips.filter((trip) => {
      const q = searchQuery.toLowerCase().trim();
      const code = (trip.tripCode || trip.trip_code || '').toLowerCase();
      const busName = (trip.bus?.busName || trip.bus?.bus_name || '').toLowerCase();
      const routeName = (trip.route?.routeName || trip.route?.route_name || '').toLowerCase();
      const dest = (trip.route?.destination || '').toLowerCase();
      const origin = (trip.route?.origin || '').toLowerCase();

      const matchesSearch =
        !q ||
        code.includes(q) ||
        busName.includes(q) ||
        routeName.includes(q) ||
        dest.includes(q) ||
        origin.includes(q);

      const status = trip.status || 'SCHEDULED';
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialTrips, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'বাস ট্রিপ ও শিডিউল ম্যানেজমেন্ট' : 'Bus Trips & Departure Schedules'}
            </h1>
            <Badge variant="primary" className="font-mono text-xs font-bold px-2 py-0.5">
              {filteredTrips.length} {language === 'bn' ? 'টি ট্রিপ' : 'Trips'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'যাত্রী লোড মনিটরিং, বাস শিডিউল এবং সরাসরি সিট ম্যাপ নিয়ন্ত্রণ কেন্দ্র'
              : 'Monitor real-time passenger loads, departure timelines, and open interactive seat plans'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/trips/create">
            <Button variant="primary" size="md" className="font-black shadow-lg shadow-blue-500/25 rounded-2xl">
              <Plus className="w-4 h-4 mr-1.5" />
              {language === 'bn' ? '+ নতুন ট্রিপ শিডিউল' : '+ Schedule New Trip'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Premium Filter & Search Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row gap-4 items-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Search */}
        <div className="relative w-full md:flex-1 z-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'ট্রিপ কোড, রুট, বাস বা গন্তব্য খুঁজুন...' : 'Search trip code, route, bus...'}
            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 z-10">
          {/* Status Filter */}
          <div className="relative w-full sm:w-56 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
               <ShieldCheck className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label={language === 'bn' ? 'ট্রিপ স্ট্যাটাস ফিল্টার' : 'Trip Status Filter'}
              className="block w-full pl-10 pr-10 py-3.5 appearance-none bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">{language === 'bn' ? 'সব স্ট্যাটাস (All)' : 'All Trips'}</option>
              <option value="SCHEDULED">{language === 'bn' ? 'নির্ধারিত (Scheduled)' : 'Scheduled'}</option>
              <option value="BOARDING">{language === 'bn' ? 'বোর্ডিং চলছে (Boarding)' : 'Boarding'}</option>
              <option value="DEPARTED">{language === 'bn' ? 'ছেড়ে গেছে (Departed)' : 'Departed'}</option>
              <option value="COMPLETED">{language === 'bn' ? 'সম্পন্ন (Completed)' : 'Completed'}</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Trips Table Card (Desktop) */}
      <Card className="hidden md:block border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filteredTrips.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Bus}
                title={language === 'bn' ? 'কোনো ট্রিপ শিডিউল পাওয়া যায়নি' : 'No Trips Found'}
                description={
                  searchQuery
                    ? language === 'bn'
                      ? `"${searchQuery}" এর সাথে মিলে এমন কোনো ট্রিপ পাওয়া যায়নি।`
                      : `No trips matched your search "${searchQuery}".`
                    : language === 'bn'
                    ? 'যাত্রীদের টিকিট বিক্রি শুরু করার জন্য একটি নতুন বাস ট্রিপ তৈরি করুন।'
                    : 'No trips have been scheduled yet.'
                }
                actionLabel={language === 'bn' ? '+ নতুন ট্রিপ তৈরি করুন' : '+ Schedule New Trip'}
                actionHref="/trips/create"
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase">
                <tr>
                  <th className="px-5 py-3.5">{language === 'bn' ? 'ট্রিপ কোড ও বাস' : 'Trip Code & Bus'}</th>
                  <th className="px-4 py-3.5">{language === 'bn' ? 'রুট ও গন্তব্য' : 'Route Details'}</th>
                  <th className="px-4 py-3.5">{language === 'bn' ? 'ছাড়ার তারিখ ও সময়' : 'Departure Date & Time'}</th>
                  <th className="px-4 py-3.5 min-w-[150px]">{language === 'bn' ? 'আসন পূরণ (Occupancy)' : 'Seat Occupancy'}</th>
                  <th className="px-4 py-3.5 text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="px-4 py-3.5 text-right">{language === 'bn' ? 'ভাড়া (Fare)' : 'Base Fare'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {filteredTrips.map((trip: any) => {
                  const totalSeats = trip.bus?.seatLayout?.totalSeats || trip.bus?.totalSeats || trip.bus?.capacity || 40;
                  const bookedSeats = (trip.bookings || []).reduce(
                    (sum: number, b: any) => sum + (b.seats?.length || 1),
                    0
                  );
                  const occupancy = totalSeats > 0 ? Math.min(100, Math.round((bookedSeats / totalSeats) * 100)) : 0;
                  const busType = trip.tripBusType || trip.bus?.busType || trip.bus?.bus_type || 'MIXED';
                  const busName = trip.bus?.busName || trip.bus?.bus_name || 'Express Coach';
                  const routeName = trip.route?.routeName || trip.route?.route_name || 'Dhaka to University';
                  const origin = trip.route?.origin || 'Dhaka';
                  const destination = trip.route?.destination || 'Destination';

                  const isFemale = busType === 'FEMALE';
                  const isMale = busType === 'MALE';

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Trip Code & Bus */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 block text-xs">
                          {trip.tripCode || trip.trip_code}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">{busName}</span>

                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant={isFemale ? 'danger' : isMale ? 'primary' : 'default'}
                            className="text-[10px] font-bold px-1.5 py-0.2"
                          >
                            {isFemale
                              ? language === 'bn'
                                ? 'ছাত্রী স্পেশাল'
                                : 'Female Only'
                              : isMale
                              ? language === 'bn'
                                ? 'ছাত্র স্পেশাল'
                                : 'Male Only'
                              : language === 'bn'
                              ? 'উভয় যাত্রী'
                              : 'Mixed'}
                          </Badge>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{routeName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                          {origin} ➔ {destination}
                        </div>
                      </td>

                      {/* Departure Date & Time */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatDate(trip.departureDate || trip.departure_date)}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-xs mt-0.5">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{formatTime(trip.departureTime || trip.departure_time)}</span>
                        </div>
                      </td>

                      {/* Visual Occupancy Progress Bar */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono font-bold">
                            <span className="text-blue-600 dark:text-blue-400">{bookedSeats} / {totalSeats}</span>
                            <span className="text-slate-500 dark:text-slate-400">{occupancy}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                occupancy > 80
                                  ? 'bg-rose-500'
                                  : occupancy > 50
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant={
                            trip.status === 'SCHEDULED'
                              ? 'primary'
                              : trip.status === 'BOARDING'
                              ? 'warning'
                              : trip.status === 'COMPLETED'
                              ? 'success'
                              : 'default'
                          }
                          className="font-bold text-xs"
                        >
                          {trip.status === 'SCHEDULED'
                            ? language === 'bn'
                              ? 'নির্ধারিত'
                              : 'SCHEDULED'
                            : trip.status === 'BOARDING'
                            ? language === 'bn'
                              ? 'বোর্ডিং'
                              : 'BOARDING'
                            : trip.status}
                        </Badge>
                      </td>

                      {/* Base Fare */}
                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(trip.basePrice || trip.base_price || 550)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/book/${trip.id}`} target="_blank">
                            <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl px-2.5 py-1">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              {language === 'bn' ? 'পাবলিক' : 'Public'}
                            </Button>
                          </Link>
                          <Link href={`/trips/${trip.id}/seat-map`}>
                            <Button size="sm" variant="primary" className="font-bold text-xs rounded-xl px-2.5 py-1 shadow-xs">
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              {language === 'bn' ? 'সিট ম্যাপ' : 'Seats'}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Trips Mobile Cards View (Screens < md) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredTrips.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <EmptyState
              icon={Bus}
              title={language === 'bn' ? 'কোনো ট্রিপ শিডিউল পাওয়া যায়নি' : 'No Trips Found'}
              description={language === 'bn' ? 'নতুন বাস ট্রিপ তৈরি করুন।' : 'No trips scheduled yet.'}
              actionLabel={language === 'bn' ? '+ নতুন ট্রিপ তৈরি করুন' : '+ Schedule New Trip'}
              actionHref="/trips/create"
            />
          </div>
        ) : (
          filteredTrips.map((trip: any) => {
            const totalSeats = trip.bus?.seatLayout?.totalSeats || trip.bus?.totalSeats || trip.bus?.capacity || 40;
            const bookedSeats = (trip.bookings || []).reduce(
              (sum: number, b: any) => sum + (b.seats?.length || 1),
              0
            );
            const occupancy = totalSeats > 0 ? Math.min(100, Math.round((bookedSeats / totalSeats) * 100)) : 0;
            const busType = trip.tripBusType || trip.bus?.busType || trip.bus?.bus_type || 'MIXED';
            const busName = trip.bus?.busName || trip.bus?.bus_name || 'Express Coach';
            const routeName = trip.route?.routeName || trip.route?.route_name || 'Dhaka to University';
            const origin = trip.route?.origin || 'Dhaka';
            const destination = trip.route?.destination || 'Destination';

            return (
              <div
                key={trip.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs">
                      {trip.tripCode || trip.trip_code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{busName}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {origin} ➔ {destination}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        trip.status === 'SCHEDULED'
                          ? 'primary'
                          : trip.status === 'BOARDING'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[10px] font-bold"
                    >
                      {trip.status}
                    </Badge>
                    <div className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                      {formatCurrency(trip.basePrice || trip.base_price || 550)}
                    </div>
                  </div>
                </div>

                {/* Departure & Occupancy */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ছাড়ার সময়:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatDate(trip.departureDate || trip.departure_date)} ({formatTime(trip.departureTime || trip.departure_time)})
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>সিট বুকড:</span>
                      <span className="font-bold text-blue-600">{bookedSeats}/{totalSeats} ({occupancy}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${occupancy > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link href={`/book/${trip.id}`} target="_blank" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      পাবলিক ভিউ
                    </Button>
                  </Link>
                  <Link href={`/trips/${trip.id}/seat-map`} className="flex-1">
                    <Button size="sm" variant="primary" className="w-full text-xs h-8">
                      <Sparkles className="w-3 h-3 mr-1" />
                      সিট ম্যাপ
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
