'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Handshake,
  PlusCircle,
  Edit2,
  Trash2,
  Building2,
  TicketPercent,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface Partnership {
  id: string;
  partnerName: string;
  type: 'COACHING' | 'HOSTEL' | 'UNIVERSITY_CLUB';
  promoCode: string;
  discountOffered: string; // e.g., "10%", "50 BDT"
  revenueGenerated: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function PartnershipsPage() {
  const { language } = useApp();
  const [partners, setPartners] = useState<Partnership[]>([
    { id: '1', partnerName: 'Udvash Coaching', type: 'COACHING', promoCode: 'UDVASH26', discountOffered: '10%', revenueGenerated: 450000, status: 'ACTIVE' },
    { id: '2', partnerName: 'Retina Medical', type: 'COACHING', promoCode: 'RETINAMED', discountOffered: '15%', revenueGenerated: 210000, status: 'ACTIVE' },
    { id: '3', partnerName: 'RU Student Hostel', type: 'HOSTEL', promoCode: 'RUHOSTEL', discountOffered: '50 BDT', revenueGenerated: 15000, status: 'INACTIVE' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partnership | null>(null);

  const [formData, setFormData] = useState<Partial<Partnership>>({
    partnerName: '',
    type: 'COACHING',
    promoCode: '',
    discountOffered: '10%',
    status: 'ACTIVE'
  });

  const handleOpenModal = (partner?: Partnership) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData(partner);
    } else {
      setEditingPartner(null);
      setFormData({ partnerName: '', type: 'COACHING', promoCode: '', discountOffered: '10%', status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...formData } as Partnership : p));
    } else {
      const newPartner: Partnership = {
        id: Date.now().toString(),
        partnerName: formData.partnerName || 'New Partner',
        type: formData.type as any,
        promoCode: formData.promoCode || 'PARTNERCODE',
        discountOffered: formData.discountOffered || '10%',
        revenueGenerated: 0,
        status: formData.status as 'ACTIVE' | 'INACTIVE'
      };
      setPartners([...partners, newPartner]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this B2B partnership?')) {
      setPartners(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800">
              <Handshake className="w-3.5 h-3.5 mr-1" />
              B2B Partnerships
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'বিটুবি পার্টনারশিপ' : 'B2B Partnerships'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'কোচিং সেন্টার এবং হোস্টেলগুলোর সাথে চুক্তি ও রেভিনিউ ম্যানেজ করুন।' : 'Manage corporate tie-ups with coaching centers and hostels.'}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন পার্টনার' : 'New Partner'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map(partner => (
          <Card key={partner.id} className="p-0 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className={`h-2 w-full ${partner.status === 'ACTIVE' ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{partner.partnerName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{partner.type}</p>
                  </div>
                </div>
                <Badge variant={partner.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                  {partner.status}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 mt-2">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><TicketPercent className="w-3.5 h-3.5" /> Promo Code</span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{partner.promoCode}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Discount Offered</span>
                  <span className="font-bold text-xs text-rose-600 dark:text-rose-400">{partner.discountOffered}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Revenue Gen.</span>
                  <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">৳ {partner.revenueGenerated.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button onClick={() => handleToggleStatus(partner.id, partner.status)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  {partner.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
                <button onClick={() => handleOpenModal(partner)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(partner.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPartner ? 'Edit Partnership' : 'Add Partnership'} size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Partner Organization Name</label>
            <input 
              type="text" 
              value={formData.partnerName}
              onChange={e => setFormData({...formData, partnerName: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-orange-500 focus:outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Partner Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="COACHING">Coaching Center</option>
                <option value="HOSTEL">Hostel / Hotel</option>
                <option value="UNIVERSITY_CLUB">University Club</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Promo Code</label>
              <input 
                type="text" 
                value={formData.promoCode}
                onChange={e => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm uppercase font-mono focus:border-orange-500 focus:outline-none" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Offered</label>
              <input 
                type="text" 
                value={formData.discountOffered}
                onChange={e => setFormData({...formData, discountOffered: e.target.value})}
                placeholder="e.g. 10% or 100 BDT"
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-orange-500 focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-orange-600 hover:bg-orange-500 text-white font-bold" onClick={handleSave}>
              {editingPartner ? 'Save Changes' : 'Create Partner'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
