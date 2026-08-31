'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

export function PaymentGatewayModal({ isOpen, onClose, booking, onSuccess }: PaymentGatewayModalProps) {
  const [step, setStep] = useState<'SELECT_METHOD' | 'BKASH_PIN' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('SELECT_METHOD');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');

  const handleBkashSelect = () => {
    setStep('BKASH_PIN');
  };

  const handlePay = () => {
    if (!phoneNumber || !pin) return;
    setStep('PROCESSING');
    
    // Simulate API call
    setTimeout(() => {
      // 90% success rate for demo
      if (Math.random() > 0.1) {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setStep('FAILED');
      }
    }, 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="নিরাপদ অনলাইন পেমেন্ট" size="md">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-[300px] flex flex-col justify-center items-center rounded-b-2xl">
        
        {step === 'SELECT_METHOD' && (
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500">পরিশোধের পরিমাণ</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatCurrency(booking.netAmount)}
              </h2>
            </div>
            
            <button 
              onClick={handleBkashSelect}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-2 border-[#e2136e] rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e2136e] rounded-lg flex items-center justify-center">
                  {/* bKash Bird SVG approximation */}
                  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">bKash (বিকাশ)</h3>
                  <p className="text-xs text-slate-500">মার্চেন্ট পেমেন্ট (কোনো চার্জ নেই)</p>
                </div>
              </div>
            </button>

            <button 
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f7941d] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  নগদ
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Nagad (নগদ)</h3>
                  <p className="text-xs text-slate-500">সাময়িকভাবে বন্ধ আছে</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 'BKASH_PIN' && (
          <div className="w-full bg-[#e2136e] p-6 rounded-xl text-white space-y-6">
            <div className="text-center border-b border-white/20 pb-4">
              <h3 className="text-lg font-bold">bKash Payment</h3>
              <p className="text-sm opacity-90 mt-1">ATOMS Transit</p>
              <h2 className="text-2xl font-black font-mono mt-2">{formatCurrency(booking.netAmount)}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-90">আপনার বিকাশ একাউন্ট নাম্বার দিন</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-lg text-slate-900 font-mono text-center tracking-wider focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-90">বিকাশ পিন (PIN)</label>
                <input 
                  type="password" 
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="•••••"
                  className="w-full px-4 py-3 rounded-lg text-slate-900 font-mono text-center tracking-widest focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 bg-transparent border-white text-white hover:bg-white/10" onClick={() => setStep('SELECT_METHOD')}>
                বাতিল
              </Button>
              <Button variant="primary" className="flex-1 bg-white text-[#e2136e] hover:bg-slate-100 font-bold" onClick={handlePay}>
                নিশ্চিত করুন
              </Button>
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-[#e2136e] animate-spin mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white">পেমেন্ট প্রসেস হচ্ছে...</h3>
            <p className="text-xs text-slate-500">অনুগ্রহ করে অপেক্ষা করুন, পেজটি রিলোড বা বন্ধ করবেন না।</p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-emerald-600">পেমেন্ট সফল!</h3>
            <p className="text-sm text-slate-500">আপনার বুকিং কনফার্ম করা হচ্ছে...</p>
          </div>
        )}

        {step === 'FAILED' && (
          <div className="text-center space-y-4 py-8 w-full">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-rose-600">পেমেন্ট ব্যর্থ হয়েছে</h3>
            <p className="text-sm text-slate-500">আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই অথবা পিন ভুল দিয়েছেন।</p>
            <Button variant="outline" className="w-full mt-4" onClick={() => setStep('BKASH_PIN')}>
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
