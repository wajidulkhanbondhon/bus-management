'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Package,
  PlusCircle,
  Edit2,
  Trash2,
  Percent,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface BundleOffer {
  id: string;
  name: string;
  type: 'SQUAD' | 'RETURN' | 'SEASON_PASS';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minTickets?: number;
  status: 'ACTIVE' | 'INACTIVE';
  timesUsed: number;
}

export default function BundleOffersPage() {
  const { language } = useApp();
  const [offers, setOffers] = useState<BundleOffer[]>([
    { id: '1', name: 'Squad Travel Promo', type: 'SQUAD', discountType: 'PERCENTAGE', discountValue: 15, minTickets: 3, status: 'ACTIVE', timesUsed: 120 },
    { id: '2', name: 'Dhaka-RU Return Combo', type: 'RETURN', discountType: 'FIXED', discountValue: 200, minTickets: 2, status: 'ACTIVE', timesUsed: 85 },
    { id: '3', name: 'Admission Season Pass (5 Trips)', type: 'SEASON_PASS', discountType: 'PERCENTAGE', discountValue: 25, status: 'INACTIVE', timesUsed: 12 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BundleOffer | null>(null);

  const [formData, setFormData] = useState<Partial<BundleOffer>>({
    name: '',
    type: 'SQUAD',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minTickets: 3,
    status: 'ACTIVE'
  });

  const handleOpenModal = (offer?: BundleOffer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData(offer);
    } else {
      setEditingOffer(null);
      setFormData({ name: '', type: 'SQUAD', discountType: 'PERCENTAGE', discountValue: 10, minTickets: 3, status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingOffer) {
      setOffers(prev => prev.map(o => o.id === editingOffer.id ? { ...o, ...formData } as BundleOffer : o));
    } else {
      const newOffer: BundleOffer = {
        id: Date.now().toString(),
        name: formData.name || 'New Offer',
        type: formData.type as 'SQUAD' | 'RETURN' | 'SEASON_PASS',
        discountType: formData.discountType as 'PERCENTAGE' | 'FIXED',
        discountValue: formData.discountValue || 10,
        minTickets: formData.type === 'SQUAD' ? (formData.minTickets || 3) : undefined,
        status: formData.status as 'ACTIVE' | 'INACTIVE',
        timesUsed: 0
      };
      setOffers([...offers, newOffer]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this bundle offer?')) {
      setOffers(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border-sky-200 dark:border-sky-800">
              <Package className="w-3.5 h-3.5 mr-1" />
              Sales & Promos
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'গ্রুপ ও কম্বো অফার' : 'Bundle & Group Offers'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'স্টুডেন্টদের জন্য গ্রুপ ট্রাভেল বা রিটার্ন টিকিটে বিশেষ ছাড় সেট করুন।' : 'Configure discounts for squad travel or return trips.'}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন অফার' : 'New Offer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <Card key={offer.id} className={`p-6 border-2 transition-all relative overflow-hidden ${offer.status === 'ACTIVE' ? 'border-sky-200 dark:border-sky-800/50 bg-white dark:bg-slate-900 shadow-xl shadow-sky-900/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-75'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${offer.status === 'ACTIVE' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {offer.type === 'SQUAD' ? <Users className="w-6 h-6" /> : <Package className="w-6 h-6" />}
              </div>
              <Badge variant={offer.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                {offer.status}
              </Badge>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{offer.name}</h3>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {offer.discountType === 'FIXED' ? '৳' : ''}{offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ''}
              </div>
              <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md uppercase">
                Discount
              </div>
            </div>

            {offer.type === 'SQUAD' && offer.minTickets && (
              <p className="text-sm text-slate-500 mt-3 font-medium">
                Requires minimum <span className="font-bold text-slate-700 dark:text-slate-300">{offer.minTickets} tickets</span> to activate.
              </p>
            )}
            {offer.type === 'RETURN' && (
              <p className="text-sm text-slate-500 mt-3 font-medium">
                Valid on simultaneous onward & return booking.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-bold">
                Used <span className="text-slate-900 dark:text-white">{offer.timesUsed}</span> times
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggleStatus(offer.id, offer.status)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1">
                  {offer.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
                <button onClick={() => handleOpenModal(offer)} className="text-slate-400 hover:text-blue-600 p-1">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(offer.id)} className="text-slate-400 hover:text-rose-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOffer ? 'Edit Offer' : 'Create Offer'} size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Offer Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Offer Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="SQUAD">Squad (Group)</option>
                <option value="RETURN">Return Combo</option>
                <option value="SEASON_PASS">Season Pass</option>
              </select>
            </div>
            {formData.type === 'SQUAD' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min Tickets</label>
                <input 
                  type="number" 
                  value={formData.minTickets}
                  onChange={e => setFormData({...formData, minTickets: parseInt(e.target.value) || 3})}
                  className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none" 
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
              <select 
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Value</label>
              <input 
                type="number" 
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-sky-600 hover:bg-sky-500 text-white font-bold" onClick={handleSave}>
              {editingOffer ? 'Save Changes' : 'Create Offer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
