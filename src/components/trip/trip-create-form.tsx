'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Bus as BusIcon,
  Sparkles,
  GraduationCap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createTripAction } from '@/actions/trip.actions';
import { useApp } from '@/lib/context';

interface TripCreateFormProps {
  buses: any[];
  routes: any[];
  fareZones?: any[];
}

const UNIVERSITY_PRESETS = [
  {
    name: 'Rajshahi University (RU)',
    bnName: 'রাজশাহী বিশ্ববিদ্যালয় (রাবি)',
    origin: 'Dhaka (Gabtoli / Farmgate)',
    destination: 'Rajshahi University Campus',
    defaultFare: 550,
    time: '21:30'
  },
  {
    name: 'Chittagong University (CU)',
    bnName: 'চট্টগ্রাম বিশ্ববিদ্যালয় (চবি)',
    origin: 'Dhaka (Sayedabad / Arambagh)',
    destination: 'Chittagong University 1 No Gate',
    defaultFare: 650,
    time: '22:00'
  },
  {
    name: 'GST Cluster Centers',
    bnName: 'জিএসটি গুচ্ছ পরীক্ষা কেন্দ্র',
    origin: 'Dhaka Central Hub',
    destination: 'GST Exam Centers (Combined)',
    defaultFare: 550,
    time: '20:30'
  },
  {
    name: 'Jahangirnagar University (JU)',
    bnName: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (জাবি)',
    origin: 'Dhaka (Motijheel / Farmgate)',
    destination: 'JU Main Gate / Prantik',
    defaultFare: 350,
    time: '07:30'
  },
  {
    name: 'Khulna University / KUET',
    bnName: 'খুলনা বিশ্ববিদ্যালয় / কুয়েট',
    origin: 'Dhaka (Gabtoli / Fulbaria)',
    destination: 'KUET Campus Main Gate',
    defaultFare: 600,
    time: '21:00'
  },
  {
    name: 'SUST Sylhet',
    bnName: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (সাস্ট)',
    origin: 'Dhaka (Sayedabad / Mohakhali)',
    destination: 'SUST Main Gate, Kumargaon',
    defaultFare: 650,
    time: '22:30'
  }
];

export function TripCreateForm({ buses, routes, fareZones }: TripCreateFormProps) {
  const router = useRouter();
  const { language } = useApp();

  const [selectedBusId, setSelectedBusId] = useState(buses[0]?.id || '');
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || '');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10));
  const [departureTime, setDepartureTime] = useState('20:30');
  const [basePrice, setBasePrice] = useState(550);
  const [tripBusType, setTripBusType] = useState<'MALE' | 'FEMALE' | 'MIXED'>('MIXED');
  const [notes, setNotes] = useState('');

  // Accommodation package option
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCost, setHotelCost] = useState(1200);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeBus = buses.find(b => b.id === selectedBusId);

  const handleApplyPreset = (preset: typeof UNIVERSITY_PRESETS[0]) => {
    setBasePrice(preset.defaultFare);
    setDepartureTime(preset.time);
    setNotes(`Special admission express coach for ${preset.name}. Rest stop included.`);
    
    // Find matching route or keep first
    const matchedRoute = routes.find(r => 
      (r.destination && r.destination.toLowerCase().includes(preset.name.toLowerCase().slice(0, 5))) ||
      (r.route_name && r.route_name.toLowerCase().includes(preset.name.toLowerCase().slice(0, 5)))
    );
    if (matchedRoute) {
      setSelectedRouteId(matchedRoute.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusId) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে একটি বাস নির্বাচন করুন।' : 'Please select a bus.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const combinedDateTime = new Date(`${departureDate}T${departureTime}:00`);
      let enrichedNotes = notes.trim();
      if (includeHotel) {
        enrichedNotes = enrichedNotes ? `[🏨 Campus Accommodation Package Included: +৳${hotelCost}] | ${enrichedNotes}` : `[🏨 Campus Accommodation Package Included: +৳${hotelCost}]`;
      }

      const res = await createTripAction({
        busId: selectedBusId,
        routeId: selectedRouteId || (routes[0]?.id || 'default-route'),
        departureDate: new Date(departureDate),
        departureTime: combinedDateTime,
        basePrice: Number(basePrice),
        tripBusType,
        notes: enrichedNotes || undefined
      });

      if (res.success) {
        setSuccessMessage(
          language === 'bn'
            ? '🎉 নতুন ট্রিপ সফলভাবে শিডিউল করা হয়েছে!'
            : '🎉 New trip successfully scheduled!'
        );
        setTimeout(() => {
          router.push('/trips');
          router.refresh();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to schedule trip');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/trips">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'bn' ? 'নতুন ট্রিপ শিডিউল করুন' : 'Schedule New Bus Trip'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'bn'
              ? 'বিশ্ববিদ্যালয় ভর্তি স্পেশাল বাস ট্রিপ কনফিগার করুন এবং তাৎক্ষণিক লাইভ করুন।'
              : 'Configure university admission special trips with 1-click campus presets.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-sm border-2 border-rose-300 dark:border-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold">{language === 'bn' ? 'ত্রুটি:' : 'Error:'}</div>
            <p className="mt-0.5 text-xs font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-sm border-2 border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <Card className="shadow-lg border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1-Click University Destination Chips */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'bn' ? '১-ক্লিক বিশ্ববিদ্যালয় রুট প্রিসেট (Campus Selector)' : '1-Click Campus Presets'}</span>
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  {language === 'bn' ? 'রুট ও আনুমানিক ভাড়া স্বয়ংক্রিয় সেট হয়' : 'Auto-sets route & estimated fare'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {UNIVERSITY_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{p.bnName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>৳{p.defaultFare}</span>
                      <span className="font-mono">{p.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bus & Route Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'বাস / কোচ নির্বাচন করুন *' : 'Select Bus / Coach *'}
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  required
                  className="w-full text-xs font-bold px-3.5 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {buses.filter((b: any) => b.status === 'ACTIVE' || !b.status).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number || b.busNumber} - {b.bus_name || b.busName} ({b.capacity || 40} Seats, {b.bus_type || b.busType})
                    </option>
                  ))}
                </select>
                {activeBus && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <BusIcon className="w-3 h-3 text-blue-500" />
                    <span>অপারেটর: {activeBus.operator || 'Central Transport Office'} | ক্যাপাসিটি: {activeBus.capacity || 40} সিট</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'ট্রানজিট রুট নির্বাচন করুন *' : 'Select Transit Route *'}
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  required
                  className="w-full text-xs font-bold px-3.5 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {routes.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name || r.routeName} ({r.origin} ➔ {r.destination})
                    </option>
                  ))}
                  {routes.length === 0 && (
                    <option value="default-route">Dhaka ➔ Rajshahi University (RU Unit-A)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'যাত্রার তারিখ (Departure Date) *' : 'Departure Date *'}
                </label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'যাত্রার সময় (Departure Time) *' : 'Departure Time *'}
                </label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="font-bold text-sm"
                />
              </div>
            </div>

            {/* Fare & Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'বেস টিকিট ভাড়া (BDT ৳) *' : 'Base Ticket Fare (BDT ৳) *'}
                </label>
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  required
                  className="font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {language === 'bn' ? 'জেন্ডার পলিসি (Gender Policy)' : 'Gender Policy'}
                </label>
                <select
                  value={tripBusType}
                  onChange={(e) => setTripBusType(e.target.value as any)}
                  className="w-full text-xs font-bold px-3.5 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="MIXED">{language === 'bn' ? 'মিশ্র (ছাত্র ও ছাত্রী উভয়ের জন্য)' : 'Mixed (Male & Female)'}</option>
                  <option value="FEMALE">{language === 'bn' ? 'শুধুমাত্র ছাত্রী স্পেশাল কোচ' : 'Female Only Special Coach'}</option>
                  <option value="MALE">{language === 'bn' ? 'শুধুমাত্র ছাত্র স্পেশাল কোচ' : 'Male Only Special Coach'}</option>
                </select>
              </div>
            </div>

            {/* Optional Campus Accommodation Toggle */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHotel}
                    onChange={(e) => setIncludeHotel(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
                  />
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    {language === 'bn' ? '🏨 এই ট্রিপে ক্যাম্পাস আবাসন / হোটেল প্যাকেজ অন্তর্ভুক্ত করুন' : 'Include Campus Accommodation Package'}
                  </span>
                </label>
                {includeHotel && (
                  <Badge variant="purple" className="text-[10px] font-bold">৳{hotelCost}/Person</Badge>
                )}
              </div>

              {includeHotel && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800/60 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      {language === 'bn' ? 'আবাসন সারচার্জ (৳ / প্রতি জন):' : 'Accommodation Surcharge (৳/person):'}
                    </label>
                    <Input
                      type="number"
                      value={hotelCost}
                      onChange={(e) => setHotelCost(Number(e.target.value))}
                      className="text-xs font-bold"
                    />
                  </div>
                  <div className="text-[11px] text-purple-800 dark:text-purple-300 flex items-center">
                    <span>✓ ক্যাম্পাসের সন্নিকটে নিরাপদ আবাসন ও পরীক্ষার হল ড্রপ সার্ভিস অন্তর্ভুক্ত থাকবে।</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {language === 'bn' ? 'ট্রিপের বিশেষ নির্দেশনা / নোট' : 'Trip Schedule Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. রাবি 'এ' ইউনিট ভর্তি পরীক্ষার্থীদের জন্য স্পেশাল নাইট এক্সপ্রেস। সিরাজগঞ্জ ফুড ভিলেজে ৩০ মিনিট বিরতি।"
                className="w-full text-xs p-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href="/trips">
                <Button variant="ghost" size="md" type="button" className="rounded-xl">
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={isLoading}
                className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isLoading
                  ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (language === 'bn' ? 'ট্রিপ শিডিউল করুন' : 'Schedule Trip')}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
