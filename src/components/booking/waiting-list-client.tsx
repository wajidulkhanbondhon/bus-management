'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  UserPlus,
  Phone,
  User,
  GraduationCap,
  Bus,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Ticket,
  Filter,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';

interface WaitingCandidate {
  id: string;
  name: string;
  phone: string;
  admissionRoll: string;
  targetUniversity: string;
  seatsNeeded: number;
  status: 'WAITING' | 'OFFERED' | 'CONVERTED' | 'EXPIRED';
  createdAt: string;
  notes: string;
}

const DEFAULT_WAITING_LIST: WaitingCandidate[] = [
  {
    id: 'WL-101',
    name: 'তানভীর হাসান',
    phone: '01711223344',
    admissionRoll: '2026-GST-4412',
    targetUniversity: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)',
    seatsNeeded: 1,
    status: 'WAITING',
    createdAt: '2026-09-06 14:30',
    notes: 'জানালার পাশের আসন পেলে ভালো হয়।'
  },
  {
    id: 'WL-102',
    name: 'ফারহানা ইয়াসমিন',
    phone: '01822334455',
    admissionRoll: '2026-RU-8871',
    targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
    seatsNeeded: 2,
    status: 'OFFERED',
    createdAt: '2026-09-06 15:10',
    notes: 'বোন ও মা সাথে যাবেন।'
  },
  {
    id: 'WL-103',
    name: 'নাজমুল সাকিব',
    phone: '01933445566',
    admissionRoll: '2026-CU-1290',
    targetUniversity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)',
    seatsNeeded: 1,
    status: 'WAITING',
    createdAt: '2026-09-06 16:45',
    notes: 'যেকোনো আসন হলেই চলবে।'
  }
];

export function WaitingListClient() {
  const { language } = useApp();
  const [candidates, setCandidates] = useState<WaitingCandidate[]>(DEFAULT_WAITING_LIST);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New candidate form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roll, setRoll] = useState('');
  const [university, setUniversity] = useState('শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)');
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newEntry: WaitingCandidate = {
      id: `WL-${Date.now().toString().slice(-4)}`,
      name,
      phone,
      admissionRoll: roll || 'N/A',
      targetUniversity: university,
      seatsNeeded: Number(seats) || 1,
      status: 'WAITING',
      createdAt: 'এখন মাত্র',
      notes: notes || 'কোনো বিশেষ রিকোয়েস্ট নেই'
    };

    setCandidates([newEntry, ...candidates]);
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setRoll('');
    setNotes('');

    setActionAlert({
      type: 'success',
      text: language === 'bn' ? `${name}-কে সফলভাবে ওয়েটিং লিস্টে যুক্ত করা হয়েছে!` : 'Candidate added to waiting list!'
    });
  };

  const handleSendOffer = (c: WaitingCandidate) => {
    setCandidates((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, status: 'OFFERED' } : item))
    );
    setActionAlert({
      type: 'success',
      text: language === 'bn'
        ? `${c.name}-এর নম্বরে (${c.phone}) সিট খালি হওয়ার নোটিফিকেশন এসএমএস ও হোয়াটসঅ্যাপ পাঠানো হয়েছে!`
        : `Seat offer notification sent to ${c.phone}!`
    });
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'ওয়েটিং লিস্ট ও সিট অ্যালার্ট ম্যানেজার' : 'Waiting List & Seat Alert Queue'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'বাসের সব সিট পূর্ণ হলে অপেক্ষমাণ শিক্ষার্থীদের তালিকা এবং সিট ক্যানসেল হলে স্বয়ংক্রিয় নোটিফিকেশন'
                  : 'Manage standby candidates and automatically alert them when booked seats become available'}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          {language === 'bn' ? '+ প্রার্থী যুক্ত করুন' : '+ Add Candidate'}
        </Button>
      </div>

      {actionAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold border ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{actionAlert.text}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-xs px-2 py-1 bg-black/10 rounded-lg">✕</button>
        </div>
      )}

      {/* Candidates List Table */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3.5">ক্রম ও আইডি</th>
                  <th className="px-4 py-3.5">শিক্ষার্থীর নাম ও রোল</th>
                  <th className="px-4 py-3.5">মোবাইল</th>
                  <th className="px-4 py-3.5">টার্গেট বিশ্ববিদ্যালয়</th>
                  <th className="px-4 py-3.5 text-center">আসন সংখ্যা</th>
                  <th className="px-4 py-3.5 text-center">স্ট্যাটাস</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {candidates.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-black text-blue-600">#{idx + 1} ({c.id})</span>
                      <span className="text-[11px] text-slate-400 block">{c.createdAt}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">রোল: {c.admissionRoll}</div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold">{c.phone}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{c.targetUniversity}</div>
                      <div className="text-[11px] text-slate-400">{c.notes}</div>
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-bold">{c.seatsNeeded} টি</td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant={c.status === 'WAITING' ? 'warning' : c.status === 'OFFERED' ? 'primary' : 'success'}
                        className="text-[10px] font-bold"
                      >
                        {c.status === 'WAITING' ? 'অপেক্ষমাণ' : c.status === 'OFFERED' ? 'অফার পাঠানো হয়েছে' : 'বুকিং সম্পন্ন'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'WAITING' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSendOffer(c)}
                            className="text-xs h-8 rounded-xl font-bold bg-amber-600 hover:bg-amber-700"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            সিট অফার পাঠান
                          </Button>
                        )}
                        <Link href={`/bookings/quick`}>
                          <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold">
                            <Ticket className="w-3.5 h-3.5 mr-1" />
                            টিকিট কাটুন
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="ওয়েটিং লিস্টে নতুন শিক্ষার্থী যুক্ত করুন"
          description="বাসের আসন পূর্ণ হয়ে গেলে অপেক্ষমাণ প্রার্থীর তথ্য সংগ্রহ করে রাখুন।"
        >
          <form onSubmit={handleAddCandidate} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold mb-1">শিক্ষার্থীর নাম *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর হাসান"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ভর্তি পরীক্ষার রোল</label>
                <input
                  type="text"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  placeholder="2026-GST-..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">টার্গেট বিশ্ববিদ্যালয়</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                >
                  <option value="শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)">শাবিপ্রবি (SUST)</option>
                  <option value="রাজশাহী বিশ্ববিদ্যালয় (RU)">রাবি (RU)</option>
                  <option value="চট্টগ্রাম বিশ্ববিদ্যালয় (CU)">চবি (CU)</option>
                  <option value="খুলনা বিশ্ববিদ্যালয় (KU)">খুবি (KU)</option>
                  <option value="ঢাকা বিশ্ববিদ্যালয় (DU)">ঢাবি (DU)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">প্রয়োজনীয় আসন সংখ্যা</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">মন্তব্য বা বিশেষ পছন্দ</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: জানালার সিট বা সামনের সারি..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                তালিকায় যুক্ত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
