'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Bus,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Smartphone,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';

interface TripReminder {
  id: string;
  tripCode: string;
  busNumber: string;
  route: string;
  targetUniversity: string;
  departureTime: string;
  hoursRemaining: number;
  totalPassengers: number;
  remindersSent: boolean;
  lastSentAt?: string;
}

const UPCOMING_TRIPS: TripReminder[] = [
  {
    id: 'TRIP-001',
    tripCode: 'TRIP-HANIF-01',
    busNumber: 'ঢাকা মেট্রো-ব-১৫-৪২২১ (হানিফ স্পেশাল)',
    route: 'ঢাকা (গাবতলী) ➔ সিলেট (শাবিপ্রবি কেন্দ্র)',
    targetUniversity: 'শাবিপ্রবি (SUST)',
    departureTime: 'আজ রাত ১০:৩০ PM',
    hoursRemaining: 2.5,
    totalPassengers: 38,
    remindersSent: false
  },
  {
    id: 'TRIP-002',
    tripCode: 'TRIP-ENAH-02',
    busNumber: 'ঢাকা মেট্রো-ব-১২-৭৭৮৮ (এনা ক্লাসিক)',
    route: 'ঢাকা (মহাখালী) ➔ রাজশাহী বিশ্ববিদ্যালয় (RU)',
    targetUniversity: 'রাবি (RU)',
    departureTime: 'আজ রাত ১১:১৫ PM',
    hoursRemaining: 3.25,
    totalPassengers: 40,
    remindersSent: true,
    lastSentAt: 'সন্ধ্যা ০৬:৪৫ PM'
  },
  {
    id: 'TRIP-003',
    tripCode: 'TRIP-SHAM-03',
    busNumber: 'ঢাকা মেট্রো-ব-১৪-৯৯০০ (শ্যামলী পরিবহন)',
    route: 'ঢাকা (সায়েদাবাদ) ➔ চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
    targetUniversity: 'চবি (CU)',
    departureTime: 'কাল ভোর ০৫:০০ AM',
    hoursRemaining: 9.0,
    totalPassengers: 35,
    remindersSent: false
  }
];

export function DepartureRemindersClient() {
  const { language } = useApp();
  const [trips, setTrips] = useState<TripReminder[]>(UPCOMING_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<TripReminder>(UPCOMING_TRIPS[0]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  const [reminderTemplate, setReminderTemplate] = useState(
    '🚌 আসসালামু আলাইকুম {passenger_name}, আপনার {target_uni} ভর্তি স্পেশাল বাস {bus_number} {departure_time}-এ নির্দিষ্ট কাউন্টার থেকে ছাড়বে। অনুগ্রহ করে ৩০ মিনিট পূর্বে কাউন্টারে রিপোর্ট করুন। আসন নং: {seat_number}।'
  );

  const handleDispatchReminders = async (tripId: string) => {
    setSendingId(tripId);
    setSuccessAlert(null);

    // Simulate batch SMS and WhatsApp dispatch
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, remindersSent: true, lastSentAt: `আজ ${timeStr}` } : t
      )
    );

    const trip = trips.find((t) => t.id === tripId);
    setSuccessAlert(
      language === 'bn'
        ? `${trip?.busNumber} বাসের ${trip?.totalPassengers} জন যাত্রীর কাছে ডিপার্চার SMS ও WhatsApp বার্তা সফলভাবে পাঠানো হয়েছে!`
        : `Departure reminders sent to all ${trip?.totalPassengers} passengers!`
    );

    setSendingId(null);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'স্বয়ংক্রিয় ডিপার্চার রিমাইন্ডার সেন্টার' : 'Automated Departure Reminder Dispatch'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'বাস ছাড়ার পূর্বে যাত্রীদের মোবাইল ও হোয়াটসঅ্যাপে বাস নম্বর, সময় ও কাউন্টার লোকেশন নোটিফিকেশন পাঠান'
                : 'Send automated pre-trip SMS & WhatsApp notifications with reporting time & bus details'}
            </p>
          </div>
        </div>
      </div>

      {successAlert && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successAlert}</span>
          </div>
          <button onClick={() => setSuccessAlert(null)} className="text-xs px-2 py-1 bg-black/10 rounded-lg">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Trips list */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                আসন্ন ট্রিপ ও ডিপার্চার টাইমলাইন
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {trips.map((trip) => {
                const isSelected = selectedTrip.id === trip.id;
                const isSending = sendingId === trip.id;

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {trip.tripCode}
                          </span>
                          <Badge variant="primary" className="text-[10px]">
                            {trip.targetUniversity}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          {trip.busNumber}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{trip.route}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-600 block">
                          {trip.departureTime}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          (বাকি {trip.hoursRemaining} ঘণ্টা)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>কনফার্মড যাত্রী: {trip.totalPassengers} জন</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {trip.remindersSent ? (
                          <Badge variant="success" className="text-[10px]">
                            ✓ পাঠানো হয়েছে ({trip.lastSentAt})
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isSending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDispatchReminders(trip.id);
                            }}
                            className="text-xs h-7 rounded-xl font-bold bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {isSending ? 'পাঠানো হচ্ছে...' : 'রিমাইন্ডার পাঠান'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Message Template Preview & Test */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                এসএমএস ও হোয়াটসঅ্যাপ মেসেজ টেমপ্লেট
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মেসেজ ড্রাফট
                </label>
                <textarea
                  rows={4}
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Dynamic Live Preview */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    যাত্রীর ফোনে যেভাবে প্রদর্শিত হবে:
                  </span>
                  <Badge variant="success" className="text-[10px]">WhatsApp & SMS</Badge>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans shadow-xs">
                  🚌 আসসালামু আলাইকুম <strong>তানভীর আহমেদ</strong>, আপনার <strong>{selectedTrip.targetUniversity}</strong> ভর্তি স্পেশাল বাস <strong>{selectedTrip.busNumber.split(' ')[0]}</strong> <strong>{selectedTrip.departureTime}</strong>-এ নির্দিষ্ট কাউন্টার থেকে ছাড়বে। অনুগ্রহ করে ৩০ মিনিট পূর্বে কাউন্টারে রিপোর্ট করুন। আসন নং: <strong>A1</strong>।
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleDispatchReminders(selectedTrip.id)}
                  disabled={sendingId === selectedTrip.id}
                  className="w-full font-black rounded-2xl py-3 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  নির্বাচিত বাসের ({selectedTrip.totalPassengers} জন) যাত্রীকে রিমাইন্ডার পাঠান
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
