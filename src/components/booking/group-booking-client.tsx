'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Phone,
  Ticket,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Percent,
  Bus,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface StudentPassenger {
  name: string;
  phone: string;
  roll: string;
  seat: string;
}

export function GroupBookingClient() {
  const { language } = useApp();
  const [groupName, setGroupName] = useState('উদ্ভাস / ফোকাস ভর্তি কোচিং গ্রুপ');
  const [organizerPhone, setOrganizerPhone] = useState('01712345678');
  const [targetBus, setTargetBus] = useState('হানিফ স্পেশাল ভর্তি এক্সপ্রেস - ঢাকা ➔ শাবিপ্রবি (SUST)');
  const [seatPrice, setSeatPrice] = useState(650);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [students, setStudents] = useState<StudentPassenger[]>([
    { name: 'আরিফুল ইসলাম', phone: '01710000001', roll: '2026-GST-101', seat: 'A1' },
    { name: 'মেহেদী হাসান', phone: '01710000002', roll: '2026-GST-102', seat: 'A2' },
    { name: 'রাকিবুল হাসান', phone: '01710000003', roll: '2026-GST-103', seat: 'B1' },
    { name: 'সাইফুল ইসলাম', phone: '01710000004', roll: '2026-GST-104', seat: 'B2' },
    { name: 'শামীম ওসমান', phone: '01710000005', roll: '2026-GST-105', seat: 'C1' },
    { name: 'তাহমিদ আহমেদ', phone: '01710000006', roll: '2026-GST-106', seat: 'C2' },
    { name: 'জাকির হোসেন', phone: '01710000007', roll: '2026-GST-107', seat: 'D1' },
    { name: 'আসিফ মাহমুদ', phone: '01710000008', roll: '2026-GST-108', seat: 'D2' },
    { name: 'সোহাগ রানা', phone: '01710000009', roll: '2026-GST-109', seat: 'E1' },
    { name: 'নাসিমুল গনি', phone: '01710000010', roll: '2026-GST-110', seat: 'E2' },
  ]);

  const [bookingDone, setBookingDone] = useState(false);
  const [masterTicketNo, setMasterTicketNo] = useState('');

  const totalSeats = students.length;
  const subtotal = totalSeats * seatPrice;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const netTotal = subtotal - discountAmount;

  const handleAddRow = () => {
    const nextSeat = `S${students.length + 1}`;
    setStudents([...students, { name: '', phone: '', roll: '', seat: nextSeat }]);
  };

  const handleRemoveRow = (idx: number) => {
    setStudents(students.filter((_, i) => i !== idx));
  };

  const handleUpdateStudent = (idx: number, field: keyof StudentPassenger, val: string) => {
    const updated = [...students];
    updated[idx][field] = val;
    setStudents(updated);
  };

  const handleConfirmGroupBooking = () => {
    const code = `GRP-${Date.now().toString().slice(-6)}`;
    setMasterTicketNo(code);
    setBookingDone(true);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? 'কোচিং সেন্টার ও গ্রুপ বুকিং কনসোল' : 'Group & Coaching Reservation Hub'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'ভর্তি কোচিং বা শিক্ষার্থীদের গ্রুপের জন্য ১০-৪০টি আসন এককালীন বুকিং ও গ্রুপ ডিসকাউন্ট'
                : 'Bulk seat reservations and group discounted rates for coaching centers'}
            </p>
          </div>
        </div>

        <Link href="/bookings">
          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs">
            {language === 'bn' ? 'সব বুকিং' : 'All Bookings'}
          </Button>
        </Link>
      </div>

      {bookingDone ? (
        <Card className="rounded-3xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">গ্রুপ বুকিং সফলভাবে কনফার্ম হয়েছে!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            মাস্টার গ্রুপ বুকিং নম্বর: <span className="font-mono font-black text-emerald-600">{masterTicketNo}</span>
          </p>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border max-w-md mx-auto text-xs space-y-1 text-left">
            <div><strong>গ্রুপ / প্রতিষ্ঠান:</strong> {groupName}</div>
            <div><strong>বাস:</strong> {targetBus}</div>
            <div><strong>মোট বরাদ্দকৃত আসন:</strong> {totalSeats} টি</div>
            <div><strong>পরিশোধিত মোট নিট ভাড়া:</strong> {formatCurrency(netTotal)}</div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => window.print()} className="font-bold rounded-xl text-xs">
              <Printer className="w-4 h-4 mr-1.5" />
              মাস্টার রসিদ ও শিক্ষার্থী তালিকা প্রিন্ট
            </Button>
            <Button variant="outline" onClick={() => setBookingDone(false)} className="font-bold rounded-xl text-xs">
              নতুন গ্রুপ বুকিং করুন
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Coaching Info & Pricing */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black">গ্রুপ ও কোচিং বিবরণ</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">কোচিং / গ্রুপের নাম</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">যোগাযোগকারীর মোবাইল</label>
                  <input
                    type="text"
                    value={organizerPhone}
                    onChange={(e) => setOrganizerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">টার্গেট বাস ও রুট</label>
                  <input
                    type="text"
                    value={targetBus}
                    onChange={(e) => setTargetBus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">প্রতি সিটের রেগুলার ভাড়া</label>
                    <input
                      type="number"
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">গ্রুপ ডিসকাউন্ট (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Calculation summary card */}
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোট শিক্ষার্থী / আসন:</span>
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">{totalSeats} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">সাবটোটাল:</span>
                    <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>গ্রুপ ছাড় ({discountPercent}%):</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 flex justify-between font-black text-sm">
                    <span>প্রদেয় নিট ভাড়া:</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300">{formatCurrency(netTotal)}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleConfirmGroupBooking}
                  className="w-full font-black rounded-2xl py-3 shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  গ্রুপ বুকিং কনফার্ম করুন
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Student Roster Grid */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  শিক্ষার্থী প্যাসেঞ্জার রোস্টার ({students.length} জন)
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddRow} className="text-xs h-8 rounded-xl font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  + শিক্ষার্থী যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">শিক্ষার্থীর নাম</th>
                        <th className="px-3 py-2.5">মোবাইল</th>
                        <th className="px-3 py-2.5">ভর্তি রোল</th>
                        <th className="px-3 py-2.5">আসন</th>
                        <th className="px-3 py-2.5 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.map((st, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={st.name}
                              onChange={(e) => handleUpdateStudent(idx, 'name', e.target.value)}
                              placeholder="নাম..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={st.phone}
                              onChange={(e) => handleUpdateStudent(idx, 'phone', e.target.value)}
                              placeholder="017..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-mono font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={st.roll}
                              onChange={(e) => handleUpdateStudent(idx, 'roll', e.target.value)}
                              placeholder="রোল..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-mono"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={st.seat}
                              onChange={(e) => handleUpdateStudent(idx, 'seat', e.target.value)}
                              className="w-16 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs font-mono font-bold text-center text-blue-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
