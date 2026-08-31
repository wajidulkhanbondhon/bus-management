'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Megaphone,
  PlusCircle,
  MessageSquare,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  PlayCircle,
  PauseCircle,
  Users
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface Campaign {
  id: string;
  name: string;
  type: 'SMS' | 'EMAIL';
  targetSegment: string;
  reach: number;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'COMPLETED';
  conversionRate: number;
}

export default function CampaignManagerPage() {
  const { language } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: '1', name: 'RU Admission Final Reminder', type: 'SMS', targetSegment: 'RU Candidates', reach: 4500, status: 'ACTIVE', conversionRate: 12.5 },
    { id: '2', name: 'Winter Break 20% Off', type: 'EMAIL', targetSegment: 'All Students', reach: 12000, status: 'PAUSED', conversionRate: 5.2 },
    { id: '3', name: 'DU Science Faculty Alert', type: 'SMS', targetSegment: 'DU Candidates', reach: 2100, status: 'DRAFT', conversionRate: 0 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    type: 'SMS',
    targetSegment: '',
    status: 'DRAFT'
  });

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData(campaign);
    } else {
      setEditingCampaign(null);
      setFormData({ name: '', type: 'SMS', targetSegment: '', status: 'DRAFT' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...formData } as Campaign : c));
    } else {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: formData.name || 'Untitled Campaign',
        type: formData.type as 'SMS' | 'EMAIL',
        targetSegment: formData.targetSegment || 'All',
        reach: Math.floor(Math.random() * 5000),
        status: formData.status as 'ACTIVE' | 'DRAFT',
        conversionRate: 0
      };
      setCampaigns([...campaigns, newCampaign]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : (currentStatus === 'PAUSED' || currentStatus === 'DRAFT') ? 'ACTIVE' : 'COMPLETED';
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800">
              <Megaphone className="w-3.5 h-3.5 mr-1" />
              Marketing
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'ক্যাম্পেইন ম্যানেজার' : 'Campaign Manager'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'স্টুডেন্টদের উদ্দেশ্যে বাল্ক SMS ও Email ব্রডকাস্ট করুন।' : 'Broadcast bulk SMS & Emails to student segments.'}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন ক্যাম্পেইন' : 'New Campaign'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Campaigns</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{campaigns.length}</h3>
          </div>
        </Card>
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Audience Reached</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {campaigns.reduce((acc, c) => acc + c.reach, 0).toLocaleString()}
            </h3>
          </div>
        </Card>
        <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Conversion</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {(campaigns.reduce((acc, c) => acc + c.conversionRate, 0) / (campaigns.length || 1)).toFixed(1)}%
            </h3>
          </div>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Target Segment</th>
                <th className="px-6 py-4">Reach</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{campaign.name}</div>
                    <div className="text-xs text-slate-500">Conv. Rate: {campaign.conversionRate}%</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {campaign.type === 'SMS' ? <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> : <Mail className="w-3.5 h-3.5 text-emerald-500" />}
                      {campaign.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                    {campaign.targetSegment}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                    {campaign.reach.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      campaign.status === 'ACTIVE' ? 'success' :
                      campaign.status === 'PAUSED' ? 'warning' :
                      campaign.status === 'DRAFT' ? 'secondary' : 'default'
                    } className="text-[10px]">
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          campaign.status === 'ACTIVE' 
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={campaign.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
                      >
                        {campaign.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleOpenModal(campaign)}
                        className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No campaigns found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCampaign ? 'Edit Campaign' : 'Create Campaign'} size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Campaign Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-fuchsia-500 focus:outline-none" 
              placeholder="e.g., Winter 2026 Promo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Campaign Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="SMS">SMS (Text)</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active (Send Now)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Segment</label>
            <select 
              value={formData.targetSegment}
              onChange={e => setFormData({...formData, targetSegment: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="">Select a segment...</option>
              <option value="All Students">All Registered Students</option>
              <option value="RU Candidates">RU Candidates Only</option>
              <option value="DU Candidates">DU Candidates Only</option>
              <option value="Inactive Users">Inactive Users (&gt; 30 days)</option>
            </select>
          </div>
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Content</label>
             <textarea 
               className="w-full h-24 px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-fuchsia-500 focus:outline-none resize-none"
               placeholder="Write your SMS or Email content here... Use {name} for passenger name."
             ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold" onClick={handleSave}>
              {editingCampaign ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
