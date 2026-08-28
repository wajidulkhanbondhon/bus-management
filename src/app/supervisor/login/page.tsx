'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bus, KeyRound, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function SupervisorLogin() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { error, success } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) {
      error('ভুল তথ্য', 'দয়া করে ফোন নম্বর এবং পিন কোড দিন।');
      return;
    }
    
    setIsLoading(true);
    // Dummy login logic for now
    setTimeout(() => {
      setIsLoading(false);
      if (pin === '1234') {
        success('সফল', 'লগইন সফল হয়েছে।');
        // Store dummy auth
        localStorage.setItem('supervisor_auth', 'true');
        router.push('/supervisor');
      } else {
        error('লগইন ব্যর্থ', 'ফোন নম্বর অথবা পিন কোড ভুল।');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-emerald-600 p-6 text-center text-white space-y-2">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black">সুপারভাইজার পোর্টাল</h1>
          <p className="text-xs text-emerald-100">ATOMS Transport</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> মোবাইল নম্বর
            </label>
            <input 
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> পিন কোড
            </label>
            <input 
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg tracking-[0.5em] text-center font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-emerald-600/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                লগইন করুন <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium">
            পিন ভুলে গেলে হেড অফিসে যোগাযোগ করুন
          </p>
        </div>
      </motion.div>
    </div>
  );
}
