'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bus,
  KeyRound,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cleanAndLimitPhoneNumber, isValidBdMobile, getBdMobileOperator } from '@/lib/utils';

interface DemoSupervisor {
  name: string;
  phone: string;
  pin: string;
  busName: string;
  route: string;
}

const DEMO_SUPERVISORS: DemoSupervisor[] = [
  {
    name: 'মোঃ শফিকুল ইসলাম',
    phone: '01712345678',
    pin: '1234',
    busName: 'Dhaka Express 01',
    route: 'ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়',
  },
  {
    name: 'মোঃ জাহাঙ্গীর আলম',
    phone: '01819987654',
    pin: '1234',
    busName: 'Chittagong Express 02',
    route: 'ঢাকা ➔ চট্টগ্রাম বিশ্ববিদ্যালয়',
  },
];

export default function SupervisorLoginPage() {
  const router = useRouter();
  const { error, success } = useToast();

  const [phone, setPhone] = useState('01712345678');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanAndLimitPhoneNumber(raw);
    setPhone(cleaned);
    setPhoneError(null);
    setGeneralError(null);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(raw);
    setPinError(null);
    setGeneralError(null);
  };

  const handleAutofillDemo = (demo: DemoSupervisor) => {
    setPhone(demo.phone);
    setPin(demo.pin);
    setPhoneError(null);
    setPinError(null);
    setGeneralError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPinError(null);
    setGeneralError(null);

    const cleanedPhone = cleanAndLimitPhoneNumber(phone);

    // 1. Validate Phone Number
    if (!cleanedPhone) {
      setPhoneError('মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!isValidBdMobile(cleanedPhone)) {
      const opCheck = getBdMobileOperator(cleanedPhone);
      setPhoneError(opCheck.error || '১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }

    // 2. Validate PIN
    if (!pin) {
      setPinError('৪ ডিজিটের পিন কোড লিখুন।');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError('পিন কোড অবশ্যই ৪ সংখ্যার হতে হবে (যেমন: 1234)');
      return;
    }

    setIsLoading(true);

    // 3. Verify Credentials against demo accounts or standard supervisor access
    setTimeout(() => {
      setIsLoading(false);

      const matchedDemo = DEMO_SUPERVISORS.find((s) => s.phone === cleanedPhone && s.pin === pin);
      const isGenericDemo = pin === '1234' && isValidBdMobile(cleanedPhone);

      if (matchedDemo || isGenericDemo) {
        const supervisorProfile = matchedDemo || {
          name: 'মোঃ শফিকুল ইসলাম',
          phone: cleanedPhone,
          pin: pin,
          busName: 'Dhaka Express 01',
          route: 'ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়',
        };

        // Save session in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('supervisor_auth', JSON.stringify(supervisorProfile));
        }

        success('লগইন সফল', `স্বাগতম ${supervisorProfile.name}! সুপারভাইজার পোর্টালে রিডাইরেক্ট করা হচ্ছে...`);
        router.push('/supervisor');
        router.refresh();
      } else {
        setGeneralError('মোবাইল নম্বর অথবা ৪-ডিজিটের পিন কোড সঠিক নয়। (ডেমো পিন: 1234)');
        error('লগইন ব্যর্থ', 'সঠিক মোবাইল নম্বর এবং পিন কোড দিন।');
      }
    }, 600);
  };

  const operatorInfo = getBdMobileOperator(phone);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 selection:bg-emerald-500/30 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-center text-white space-y-2 relative overflow-hidden">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-xl font-black tracking-tight">সুপারভাইজার পোর্টাল</h1>
          <p className="text-xs text-emerald-100/90 font-medium">
            ATOMS Admission Transport • অন-ট্রিপ বাস ও যাত্রী হাজিরা সিস্টেম
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {generalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Field with validation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  সুপারভাইজার মোবাইল নম্বর
                </label>
                {operatorInfo.valid && (
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                    {operatorInfo.operator}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="01712345678"
                  maxLength={11}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    phoneError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  required
                />
              </div>
              {phoneError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {phoneError}
                </p>
              )}
            </div>

            {/* PIN Field with 4-digit limit and visibility toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ৪-ডিজিটের সিক্রেট পিন কোড
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3 h-3" /> লুকান
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> দেখুন
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  maxLength={4}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl px-4 py-3 text-lg tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    pinError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  required
                />
              </div>
              {pinError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {pinError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-emerald-600/25 cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>সুপারভাইজার লগইন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Supervisor Selector */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ১-ক্লিক ডেমো সুপারভাইজার
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                পিন: 1234
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_SUPERVISORS.map((demo) => {
                const isSelected = phone === demo.phone && pin === demo.pin;

                return (
                  <button
                    key={demo.phone}
                    type="button"
                    onClick={() => handleAutofillDemo(demo)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-slate-900 dark:text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {demo.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{demo.phone}</div>
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">{demo.busName}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 text-center border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          পিন ভুলে গেলে বা দায়িত্ব পরিবর্তনের জন্য হেড অফিসে যোগাযোগ করুন
        </div>
      </motion.div>
    </div>
  );
}
