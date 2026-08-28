'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  Filter, 
  MessageCircle, 
  Mail, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/lib/context';

const TEMPLATES = [
  { id: '1', name: 'টিকিট কনফার্মেশন', content: 'হ্যালো {{name}}, আপনার {{bus_name}} বাসের টিকিট ({{trip_date}}) কনফার্ম হয়েছে। সিট: {{seats}}। ধন্যবাদ, ATOMS Transport।' },
  { id: '2', name: 'পেমেন্ট রিমাইন্ডার', content: 'প্রিয় {{name}}, আপনার বুকিং ({{booking_id}}) এর {{due_amount}} টাকা বকেয়া আছে। অনুগ্রহ করে আজই পরিশোধ করুন।' },
  { id: '3', name: 'বাস ছাড়ার নোটিশ', content: 'আপনার বাস {{bus_name}} আজ রাত {{time}} এ ছাড়বে। দয়া করে ১৫ মিনিট আগে কাউন্টারে উপস্থিত থাকুন।' },
  { id: '4', name: 'ঈদ অফার', content: 'ঈদের বিশেষ অফার! অগ্রিম টিকিট বুকিংয়ে ২০% ছাড়। আজই আপনার সিট বুক করুন।' },
];

export default function CommunicationPage() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    const template = TEMPLATES.find(t => t.id === val);
    if (template) {
      setMessage(template.content);
    }
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + ` {{${variable}}}`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-500" />
            {language === 'bn' ? 'কমিউনিকেশন হাব' : 'Communication Hub'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            যাত্রীদের হোয়াটসঅ্যাপ, এসএমএস এবং ইমেইল পাঠান সহজেই। ডাইনামিক ভেরিয়েবল ব্যবহার করুন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${
                  activeTab === 'whatsapp' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-b-2 border-green-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${
                  activeTab === 'sms' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                SMS
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 text-sm font-bold transition-colors ${
                  activeTab === 'email' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">টেমপ্লেট নির্বাচন করুন</label>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateSelect}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="">-- নতুন মেসেজ লিখুন --</option>
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">মেসেজ কনটেন্ট</label>
                  <span className="text-[10px] text-slate-400">{message.length} ক্যারেক্টার</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={6}
                    placeholder="মেসেজ লিখুন..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 p-4 text-sm resize-none outline-none focus:ring-0"
                  />
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-2 flex flex-wrap gap-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold px-2 py-1">ভেরিয়েবল:</span>
                    {['name', 'bus_name', 'trip_date', 'seats', 'due_amount', 'booking_id'].map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 px-2 py-1 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 inline text-green-500 mr-1" />
                  ডাইনামিক ভেরিয়েবল অটো-রিপ্লেস হবে।
                </p>
                <button className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md shadow-green-600/20 flex items-center gap-2 transition-all">
                  <Send className="w-4 h-4" /> 
                  পাঠান
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Audience */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-500" />
              প্রাপক নির্বাচন (Audience)
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম বা নম্বর খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer">
                  <input type="radio" name="audience" defaultChecked className="text-green-500 focus:ring-green-500" />
                  <span className="text-xs font-bold">সকল যাত্রী (আজকের ট্রিপ)</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer">
                  <input type="radio" name="audience" className="text-green-500 focus:ring-green-500" />
                  <span className="text-xs font-bold">যাদের পেমেন্ট বাকি আছে</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer">
                  <input type="radio" name="audience" className="text-green-500 focus:ring-green-500" />
                  <span className="text-xs font-bold">কাস্টম লিস্ট নির্বাচন</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="text-xs font-bold text-green-100 uppercase mb-4">আজকের স্ট্যাটাস</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black font-mono">১২৪</div>
                <div className="text-[10px] text-green-100">মেসেজ পাঠানো হয়েছে</div>
              </div>
              <div>
                <div className="text-2xl font-black font-mono">৯৮%</div>
                <div className="text-[10px] text-green-100">ডেলিভারি রেট</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
