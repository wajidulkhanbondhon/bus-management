'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatCurrency } from '@/lib/utils';

// Types
interface PreBooking {
  id: string;
  passengerName: string;
  phone: string;
  tripCode: string;
  route: string;
  date: string;
  seats: string[];
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isStudent: boolean;
  gender: 'MALE' | 'FEMALE';
  requestTime: string;
}

const DEMO_BOOKINGS: PreBooking[] = [
  {
    id: 'REQ-1001',
    passengerName: 'সাদিয়া আক্তার',
    phone: '01711223344',
    tripCode: 'TRIP-2026-A1',
    route: 'ঢাকা ➔ রাজশাহী',
    date: '২০২৬-০৮-২৯',
    seats: ['A1', 'A2'],
    totalAmount: 1600,
    status: 'PENDING',
    isStudent: true,
    gender: 'FEMALE',
    requestTime: '10 mins ago',
  },
  {
    id: 'REQ-1002',
    passengerName: 'রাকিব হাসান',
    phone: '01811223344',
    tripCode: 'TRIP-2026-A1',
    route: 'ঢাকা ➔ রাজশাহী',
    date: '২০২৬-০৮-২৯',
    seats: ['C3'],
    totalAmount: 800,
    status: 'PENDING',
    isStudent: false,
    gender: 'MALE',
    requestTime: '25 mins ago',
  },
  {
    id: 'REQ-1003',
    passengerName: 'তানভীর আহমেদ',
    phone: '01911223344',
    tripCode: 'TRIP-2026-B2',
    route: 'রাজশাহী ➔ ঢাকা',
    date: '২০২৬-০৮-৩০',
    seats: ['B1', 'B2', 'B3'],
    totalAmount: 2400,
    status: 'APPROVED',
    isStudent: true,
    gender: 'MALE',
    requestTime: '2 hours ago',
  }
];

export default function BookingApprovalsPage() {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  
  const [selectedBooking, setSelectedBooking] = useState<PreBooking | null>(null);
  const [approvalSettings, setApprovalSettings] = useState({
    holdDuration: '1', // hours
    allowPartial: false,
    minAdvance: 0,
    allowDue: false,
    notes: ''
  });

  const filteredBookings = DEMO_BOOKINGS.filter(b => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.passengerName.toLowerCase().includes(q) || b.phone.includes(q) || b.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApprove = () => {
    // API call would go here
    alert('Booking Approved! Timer started for ' + approvalSettings.holdDuration + ' hour(s).');
    setSelectedBooking(null);
  };

  const handleReject = () => {
    // API call would go here
    const reason = prompt('বাতিল করার কারণ লিখুন:');
    if (reason) {
      alert('Booking Rejected. Reason: ' + reason);
      setSelectedBooking(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
            {language === 'bn' ? 'বুকিং ভেরিফিকেশন ও অ্যাপ্রুভাল' : 'Booking Approvals'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            যাত্রীদের প্রি-বুকিং রিকোয়েস্ট যাচাই করুন, পেমেন্ট টাইমার সেট করুন এবং অনুমোদন দিন।
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-3">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
              {DEMO_BOOKINGS.filter(b => b.status === 'PENDING').length}
            </div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
              পেন্ডিং<br/>রিকোয়েস্ট
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="নাম, নম্বর বা রিকোয়েস্ট আইডি খুঁজুন..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="ALL">সকল রিকোয়েস্ট</option>
            <option value="PENDING">পেন্ডিং (অপেক্ষমান)</option>
            <option value="APPROVED">অনুমোদিত</option>
            <option value="REJECTED">বাতিল</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.map(booking => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer ${
              booking.status === 'PENDING' ? 'border-amber-300 dark:border-amber-500/50 shadow-amber-500/10' : 'border-slate-200 dark:border-slate-800'
            }`}
            onClick={() => setSelectedBooking(booking)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1">{booking.id}</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{booking.passengerName}</h3>
                <div className="flex gap-2 mt-1">
                  {booking.isStudent && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ছাত্র/ছাত্রী</span>
                  )}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    booking.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {booking.gender === 'FEMALE' ? 'মহিলা' : 'পুরুষ'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                  booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {booking.status === 'PENDING' && <Clock className="w-3 h-3" />}
                  {booking.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                  {booking.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                  {booking.status}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">{booking.requestTime}</div>
              </div>
            </div>

            <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ফোন:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{booking.phone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">রুট:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{booking.route}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">সিট:</span>
                <span className="font-mono font-bold text-blue-600">{booking.seats.join(', ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">মোট ভাড়া:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(booking.totalAmount)}</span>
              </div>
            </div>

            {booking.status === 'PENDING' && (
              <button 
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
              >
                যাচাই করুন ও অনুমোদন দিন
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Approval Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">বুকিং রিকোয়েস্ট যাচাইকরণ</h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedBooking.id}</div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Passenger Info Card */}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 mb-6">
                  <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> যাত্রীর তথ্য যাচাই করুন
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">নাম</div>
                      <div className="font-bold text-sm text-blue-900 dark:text-blue-100">{selectedBooking.passengerName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">মোবাইল</div>
                      <div className="font-mono font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-1">
                        {selectedBooking.phone} 
                        <a href={`tel:${selectedBooking.phone}`} className="text-blue-500 hover:text-blue-700"><Phone className="w-3.5 h-3.5" /></a>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">স্ট্যাটাস</div>
                      <div className="font-bold text-sm text-blue-900 dark:text-blue-100">
                        {selectedBooking.isStudent ? 'স্টুডেন্ট' : 'সাধারণ যাত্রী'} • {selectedBooking.gender === 'FEMALE' ? 'মহিলা' : 'পুরুষ'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">সিট ও ভাড়া</div>
                      <div className="font-bold text-sm text-blue-900 dark:text-blue-100 font-mono">
                        {selectedBooking.seats.join(', ')} = {formatCurrency(selectedBooking.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedBooking.status === 'PENDING' && (
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                      অনুমোদন ও পেমেন্ট রুলস সেট করুন
                    </h3>
                    
                    {/* Timer Rule */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" /> 
                        পেমেন্ট করার সময়সীমা (Hold Duration)
                      </label>
                      <p className="text-[10px] text-slate-500">অনুমোদনের পর যাত্রী কতক্ষণ সময় পাবে পেমেন্ট করার জন্য?</p>
                      <select 
                        value={approvalSettings.holdDuration}
                        onChange={e => setApprovalSettings({...approvalSettings, holdDuration: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                      >
                        <option value="0.5">৩০ মিনিট</option>
                        <option value="1">১ ঘণ্টা (ডিফল্ট)</option>
                        <option value="2">২ ঘণ্টা</option>
                        <option value="12">১২ ঘণ্টা</option>
                        <option value="24">২৪ ঘণ্টা</option>
                      </select>
                    </div>

                    {/* Partial Payment Rules */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={approvalSettings.allowPartial}
                          onChange={e => setApprovalSettings({...approvalSettings, allowPartial: e.target.checked})}
                          className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">আংশিক পেমেন্ট (Partial Payment) অনুমোদন করুন</div>
                          <div className="text-[10px] text-slate-500">যাত্রী পুরো টাকার বদলে কিছু টাকা অগ্রিম দিতে পারবে।</div>
                        </div>
                      </label>

                      {approvalSettings.allowPartial && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pl-7 space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">সর্বনিম্ন অগ্রিম পেমেন্ট</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">৳</span>
                              <input 
                                type="number" 
                                value={approvalSettings.minAdvance}
                                onChange={e => setApprovalSettings({...approvalSettings, minAdvance: parseInt(e.target.value) || 0})}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm font-mono"
                              />
                            </div>
                          </div>
                          
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={approvalSettings.allowDue}
                              onChange={e => setApprovalSettings({...approvalSettings, allowDue: e.target.checked})}
                              className="mt-0.5 w-3.5 h-3.5 text-amber-600 rounded border-slate-300"
                            />
                            <div>
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">বাকি রাখার অনুমতি (Due Allowed)</div>
                              <div className="text-[10px] text-slate-500">বাকি টাকা বাসে ওঠার সময় বা পরে নেয়া হবে।</div>
                            </div>
                          </label>
                        </motion.div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অফিস নোট (ঐচ্ছিক)</label>
                      <textarea 
                        rows={2}
                        value={approvalSettings.notes}
                        onChange={e => setApprovalSettings({...approvalSettings, notes: e.target.value})}
                        placeholder="যাত্রীর সাথে কথা বলে কিছু নোট রাখতে চাইলে লিখুন..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {selectedBooking.status === 'PENDING' && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                  <button 
                    onClick={handleReject}
                    className="px-5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold transition-colors"
                  >
                    বুকিং বাতিল করুন
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    অনুমোদন দিন ও টাইমার চালু করুন
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
