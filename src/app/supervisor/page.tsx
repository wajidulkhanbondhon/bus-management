'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, 
  LogOut, 
  Wallet, 
  Receipt, 
  Plus, 
  MapPin, 
  Clock, 
  Calendar,
  Fuel,
  Utensils,
  Wrench,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const EXPENSE_CATEGORIES = [
  { id: 'FUEL', label: 'তেল খরচ', icon: Fuel },
  { id: 'FOOD', label: 'খাবার', icon: Utensils },
  { id: 'REPAIR', label: 'মেরামত', icon: Wrench },
  { id: 'TOLL', label: 'টোল/পার্কিং', icon: MapPin },
  { id: 'EMERGENCY', label: 'জরুরি', icon: AlertTriangle },
  { id: 'OTHER', label: 'অন্যান্য', icon: Receipt },
];

export default function SupervisorDashboard() {
  const router = useRouter();
  const { success, error } = useToast();
  
  // Auth check
  useEffect(() => {
    const auth = localStorage.getItem('supervisor_auth');
    if (!auth) {
      router.push('/supervisor/login');
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<'info' | 'expense'>('info');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Dummy Data
  const [issuedAmount] = useState(15000);
  const [expenses, setExpenses] = useState([
    { id: '1', category: 'FUEL', amount: 5000, desc: 'তেল', time: new Date().toISOString() },
    { id: '2', category: 'FOOD', amount: 450, desc: 'রাতের খাবার', time: new Date().toISOString() }
  ]);
  
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingAmount = issuedAmount - totalExpense;

  const [newExpense, setNewExpense] = useState({ category: 'FUEL', amount: '', desc: '' });

  const handleLogout = () => {
    localStorage.removeItem('supervisor_auth');
    router.push('/supervisor/login');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpense.amount);
    if (!amount || amount <= 0) {
      error('ভুল পরিমাণ', 'সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }
    
    setExpenses([{ 
      id: Date.now().toString(), 
      category: newExpense.category, 
      amount, 
      desc: newExpense.desc,
      time: new Date().toISOString()
    }, ...expenses]);
    
    setNewExpense({ category: 'FUEL', amount: '', desc: '' });
    setShowAddForm(false);
    success('সফল', 'খরচ যুক্ত করা হয়েছে।');
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold">মোঃ শফিকুল ইসলাম</div>
              <div className="text-[10px] text-emerald-100">সুপারভাইজার</div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full text-emerald-50 hover:bg-white/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* Balance Card */}
        <div className="bg-emerald-700/50 rounded-2xl p-4 border border-emerald-500/30">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] text-emerald-100 uppercase tracking-wider mb-1">বর্তমান ব্যালেন্স</div>
              <div className="text-3xl font-black font-mono tracking-tight">{formatCurrency(remainingAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-200">ইস্যুকৃত: {formatCurrency(issuedAmount)}</div>
              <div className="text-[10px] text-rose-300">খরচ: {formatCurrency(totalExpense)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm sticky top-[152px] z-10">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          ট্রিপ তথ্য
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'expense' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          খরচের হিসাব
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'info' ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">TRIP-2026-A1</span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> রানিং
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">বাস</div>
                    <div className="text-sm font-bold text-slate-800">Dhaka Express 01</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">রুট</div>
                    <div className="text-sm font-bold text-slate-800">ঢাকা গাবতলী ➔ রাজশাহী বিশ্ববিদ্যালয়</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">তারিখ ও সময়</div>
                    <div className="text-sm font-bold text-slate-800">২৮ আগস্ট ২০২৬ • রাত ১০:৩০</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-800 font-mono">৩৮ <span className="text-base text-slate-500">/ ৪০</span></div>
              <div className="text-xs text-slate-500 font-bold mt-1">মোট যাত্রী</div>
            </div>
            
            <button className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
              <Receipt className="w-4 h-4" /> ট্রিপ ক্লোজ করুন
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            {expenses.map((expense) => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category) || EXPENSE_CATEGORIES[5];
              const Icon = cat.icon;
              return (
                <div key={expense.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(expense.time)} {expense.desc && `• ${expense.desc}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black font-mono text-rose-500">-{formatCurrency(expense.amount)}</div>
                    <button onClick={() => deleteExpense(expense.id)} className="text-slate-300 hover:text-red-500 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {expenses.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div className="text-sm">কোনো খরচ যুক্ত করা হয়নি</div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button for Expenses */}
      {activeTab === 'expense' && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 pb-0 sm:pb-4">
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">খরচ যুক্ত করুন</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddExpense} className="p-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">ক্যাটাগরি</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 border transition-colors ${
                          newExpense.category === cat.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">টাকার পরিমাণ</label>
                  <input 
                    type="number" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-xl text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">বিবরণ (ঐচ্ছিক)</label>
                  <input 
                    type="text" 
                    value={newExpense.desc}
                    onChange={e => setNewExpense({ ...newExpense, desc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="কী বাবদ খরচ..."
                  />
                </div>
                
                <button type="submit" className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30">
                  সংরক্ষণ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
