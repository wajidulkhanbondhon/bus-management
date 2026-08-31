'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  GraduationCap,
  PlusCircle,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Wallet,
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface Ambassador {
  id: string;
  name: string;
  university: string;
  promoCode: string;
  commissionRate: number; // percentage
  totalSales: number; // count
  totalEarnings: number; // BDT
  status: 'ACTIVE' | 'INACTIVE';
}

export default function CampusAmbassadorsPage() {
  const { language } = useApp();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([
    { id: '1', name: 'Md. Rakib Hasan', university: 'Dhaka University', promoCode: 'RAKIB10', commissionRate: 5, totalSales: 45, totalEarnings: 4500, status: 'ACTIVE' },
    { id: '2', name: 'Sumaiya Akter', university: 'Rajshahi University', promoCode: 'SUMAIYARU', commissionRate: 5, totalSales: 120, totalEarnings: 12000, status: 'ACTIVE' },
    { id: '3', name: 'Tanvir Ahmed', university: 'Chittagong University', promoCode: 'TANVIRCU', commissionRate: 7, totalSales: 15, totalEarnings: 1500, status: 'INACTIVE' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmbassador, setEditingAmbassador] = useState<Ambassador | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Ambassador>>({
    name: '',
    university: '',
    promoCode: '',
    commissionRate: 5,
    status: 'ACTIVE'
  });

  const handleOpenModal = (ambassador?: Ambassador) => {
    if (ambassador) {
      setEditingAmbassador(ambassador);
      setFormData(ambassador);
    } else {
      setEditingAmbassador(null);
      setFormData({ name: '', university: '', promoCode: '', commissionRate: 5, status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingAmbassador) {
      setAmbassadors(prev => prev.map(a => a.id === editingAmbassador.id ? { ...a, ...formData } as Ambassador : a));
    } else {
      const newAmbassador: Ambassador = {
        id: Date.now().toString(),
        name: formData.name || 'New Ambassador',
        university: formData.university || 'N/A',
        promoCode: formData.promoCode || 'NEWCODE',
        commissionRate: formData.commissionRate || 5,
        totalSales: 0,
        totalEarnings: 0,
        status: formData.status as 'ACTIVE' | 'INACTIVE'
      };
      setAmbassadors([...ambassadors, newAmbassador]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this ambassador?')) {
      setAmbassadors(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />
              Partnerships
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'ক্যাম্পাস অ্যাম্বাসেডর প্রোগ্রাম' : 'Campus Ambassadors'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'স্টুডেন্ট অ্যাম্বাসেডরদের অ্যাফিলিয়েট সেলস এবং কমিশন ম্যানেজ করুন।' : 'Manage student ambassadors, their promo codes, and payouts.'}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন অ্যাম্বাসেডর' : 'New Ambassador'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Reps</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{ambassadors.filter(a => a.status === 'ACTIVE').length}</h3>
          </div>
        </Card>
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Tickets Sold</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {ambassadors.reduce((acc, a) => acc + a.totalSales, 0)}
            </h3>
          </div>
        </Card>
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Commission Paid</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳ {ambassadors.reduce((acc, a) => acc + a.totalEarnings, 0).toLocaleString()}
            </h3>
          </div>
        </Card>
      </div>

      {/* List */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Ambassador Details</th>
                <th className="px-6 py-4">Promo Code & Rate</th>
                <th className="px-6 py-4">Sales Performance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ambassadors.map((ambassador) => (
                <tr key={ambassador.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {ambassador.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {ambassador.university}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700">
                      <LinkIcon className="w-3 h-3 text-indigo-500" />
                      {ambassador.promoCode}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase">
                      Commission: {ambassador.commissionRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {ambassador.totalSales} Tickets
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Earned: ৳{ambassador.totalEarnings.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ambassador.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                      {ambassador.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(ambassador.id, ambassador.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          ambassador.status === 'ACTIVE' 
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={ambassador.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {ambassador.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleOpenModal(ambassador)}
                        className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(ambassador.id)}
                        className="p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ambassadors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No campus ambassadors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAmbassador ? 'Edit Ambassador' : 'Add Ambassador'} size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University</label>
              <input 
                type="text" 
                value={formData.university}
                onChange={e => setFormData({...formData, university: e.target.value})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Promo Code</label>
              <input 
                type="text" 
                value={formData.promoCode}
                onChange={e => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm uppercase font-mono focus:border-indigo-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Commission Rate (%)</label>
              <input 
                type="number" 
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={e => setFormData({...formData, commissionRate: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onClick={handleSave}>
              {editingAmbassador ? 'Save Changes' : 'Add Ambassador'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
