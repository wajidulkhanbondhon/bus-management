'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Plus,
  MoreVertical,
  ShieldAlert,
  Edit2,
  Trash2
} from 'lucide-react';
import { useApp } from '@/lib/context';

type ContactRole = 'PASSENGER' | 'SUPERVISOR' | 'DRIVER' | 'AGENT' | 'BANNED';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: ContactRole;
  address: string;
  joinDate: string;
}

const DEMO_CONTACTS: Contact[] = [
  { id: '1', name: 'মোঃ আলী হোসেন', phone: '01711223344', email: 'ali@example.com', role: 'DRIVER', address: 'মিরপুর, ঢাকা', joinDate: '2025-01-15' },
  { id: '2', name: 'শফিকুল ইসলাম', phone: '01811223344', email: 'shafiq@example.com', role: 'SUPERVISOR', address: 'গাবতলী, ঢাকা', joinDate: '2025-02-10' },
  { id: '3', name: 'রহিম মিয়া', phone: '01911223344', email: 'rahim@example.com', role: 'AGENT', address: 'রাজশাহী বাস স্ট্যান্ড', joinDate: '2025-03-05' },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01611223344', email: 'sadia@example.com', role: 'PASSENGER', address: 'ধানমন্ডি, ঢাকা', joinDate: '2026-08-01' },
  { id: '5', name: 'কালো তালিকাভুক্ত', phone: '01511223344', email: 'banned@example.com', role: 'BANNED', address: 'অজ্ঞাত', joinDate: '2026-08-20' },
];

const ROLE_STYLES: Record<ContactRole, { bg: string, text: string, label: string }> = {
  PASSENGER: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', label: 'যাত্রী' },
  SUPERVISOR: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'সুপারভাইজার' },
  DRIVER: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', label: 'ড্রাইভার' },
  AGENT: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', label: 'এজেন্ট' },
  BANNED: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'ব্যানড' },
};

export default function ContactsPage() {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<ContactRole | 'ALL'>('ALL');

  const filteredContacts = DEMO_CONTACTS.filter(c => {
    if (filterRole !== 'ALL' && c.role !== filterRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            {language === 'bn' ? 'কন্টাক্ট ডিরেক্টরি' : 'Contact Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            যাত্রী, স্টাফ, এজেন্ট এবং সুপারভাইজারদের তালিকা ও প্রোফাইল।
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all">
          <Plus className="w-3.5 h-3.5" />
          নতুন যোগ করুন
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">সকল রোল</option>
            <option value="PASSENGER">যাত্রী</option>
            <option value="SUPERVISOR">সুপারভাইজার</option>
            <option value="DRIVER">ড্রাইভার</option>
            <option value="AGENT">এজেন্ট</option>
            <option value="BANNED">ব্যানড (কালো তালিকা)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => {
          const style = ROLE_STYLES[contact.role];
          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden ${
                contact.role === 'BANNED' ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {contact.role === 'BANNED' && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> ব্যানড
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg uppercase ${style.bg} ${style.text}`}>
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{contact.name}</h3>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{contact.address}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-[10px] text-slate-400">
                  যুক্ত হয়েছেন: {contact.joinDate}
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredContacts.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-500">কোনো রেজাল্ট পাওয়া যায়নি</h3>
          </div>
        )}
      </div>
    </div>
  );
}
