'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Monitor, 
  Laptop, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Globe,
  Clock,
  Ban,
  Unlock,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface DeviceSession {
  id: string;
  userName: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isBlocked: boolean;
  isCurrentDevice: boolean;
}

const DEMO_SESSIONS: DeviceSession[] = [
  { id: 'S1', userName: 'কামরুল হাসান (Admin)', deviceType: 'DESKTOP', browser: 'Chrome 120.0', os: 'Windows 11', ipAddress: '103.145.22.1', location: 'Dhaka, Bangladesh', lastActive: 'Current Session', isBlocked: false, isCurrentDevice: true },
  { id: 'S2', userName: 'কামরুল হাসান (Admin)', deviceType: 'MOBILE', browser: 'Safari', os: 'iOS 17', ipAddress: '110.34.55.22', location: 'Dhaka, Bangladesh', lastActive: '2 hours ago', isBlocked: false, isCurrentDevice: false },
  { id: 'S3', userName: 'শফিকুল ইসলাম (Supervisor)', deviceType: 'MOBILE', browser: 'Chrome Mobile', os: 'Android 14', ipAddress: '45.123.66.7', location: 'Rajshahi, Bangladesh', lastActive: '5 hours ago', isBlocked: false, isCurrentDevice: false },
  { id: 'S4', userName: 'অজানা ইউজার', deviceType: 'DESKTOP', browser: 'Firefox 119', os: 'Windows 10', ipAddress: '89.12.33.45', location: 'Moscow, Russia', lastActive: '1 day ago', isBlocked: true, isCurrentDevice: false },
];

export default function DeviceTrackingPage() {
  const { language } = useApp();
  const [sessions, setSessions] = useState<DeviceSession[]>(DEMO_SESSIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleBlockStatus = (id: string) => {
    setSessions(sessions.map(s => {
      if (s.id === id) {
        if (!s.isBlocked) {
          const confirm = window.confirm('আপনি কি নিশ্চিত এই ডিভাইসটি ব্লক করতে চান?');
          if (!confirm) return s;
        }
        return { ...s, isBlocked: !s.isBlocked };
      }
      return s;
    }));
  };

  const filteredSessions = sessions.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.userName.toLowerCase().includes(q) || s.ipAddress.includes(q) || s.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-500" />
            {language === 'bn' ? 'ডিভাইস ও সিকিউরিটি ট্র্যাকিং' : 'Device & Security Tracking'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            সিস্টেমে লগইন করা সমস্ত ডিভাইসের আইপি, দেশ এবং লোকেশন ট্র্যাক করুন। সন্দেহজনক ডিভাইস ব্লক করুন।
          </p>
        </div>
      </div>

      {/* Security Alert Banner */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400">সিকিউরিটি অ্যালার্ট</h3>
          <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
            সিস্টেমের নিরাপত্তার স্বার্থে অপরিচিত বা দেশের বাইরের আইপি থেকে লগইন করা ডিভাইসগুলো নিয়মিত যাচাই করুন। সন্দেহজনক মনে হলে সাথে সাথে ব্লক করে দিন।
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ইউজার, আইপি (IP) বা লোকেশন খুঁজুন..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Device List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.map(session => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden ${
              session.isBlocked ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' : 
              session.isCurrentDevice ? 'border-indigo-300 dark:border-indigo-500/50 shadow-indigo-500/5' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {session.isCurrentDevice && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                Current Device
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  session.isBlocked ? 'bg-red-100 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {session.deviceType === 'DESKTOP' && <Monitor className="w-6 h-6" />}
                  {session.deviceType === 'MOBILE' && <Smartphone className="w-6 h-6" />}
                  {session.deviceType === 'TABLET' && <Laptop className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{session.userName}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">{session.os} • {session.browser}</div>
                </div>
              </div>
              
              {!session.isCurrentDevice && (
                <button
                  onClick={() => toggleBlockStatus(session.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    session.isBlocked 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400'
                  }`}
                >
                  {session.isBlocked ? <><Unlock className="w-3.5 h-3.5" /> আনব্লক করুন</> : <><Ban className="w-3.5 h-3.5" /> ব্লক করুন</>}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> IP Address</div>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{session.ipAddress}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{session.location}</div>
              </div>
              <div className="col-span-2 pt-2 mt-1 border-t border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {session.lastActive}
                  {session.isBlocked && (
                    <span className="text-red-500 font-bold ml-auto flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Blocked access
                    </span>
                  )}
                  {!session.isBlocked && session.isCurrentDevice && (
                    <span className="text-indigo-500 font-bold ml-auto flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Secure session
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredSessions.length === 0 && (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-500">কোনো ডিভাইস পাওয়া যায়নি</h3>
          </div>
        )}
      </div>
    </div>
  );
}
