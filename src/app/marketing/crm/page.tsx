'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  PlusCircle,
  Edit2,
  Trash2,
  Filter,
  PieChart
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  userCount: number;
  type: 'AUTO' | 'MANUAL';
}

export default function CRMSegmentationPage() {
  const { language } = useApp();
  const [segments, setSegments] = useState<Segment[]>([
    { id: '1', name: 'VIP Students', description: 'Students who booked more than 5 trips.', criteria: 'Total Trips > 5', userCount: 145, type: 'AUTO' },
    { id: '2', name: 'DU Candidates', description: 'Registered for Dhaka University trips.', criteria: 'Route Contains "Dhaka University"', userCount: 1200, type: 'AUTO' },
    { id: '3', name: 'Inactive Users', description: 'No bookings in the last 3 months.', criteria: 'Last Booking > 90 days', userCount: 3400, type: 'AUTO' },
    { id: '4', name: 'Custom Campaign Target', description: 'Manually added users from recent seminar.', criteria: 'Manual Import', userCount: 450, type: 'MANUAL' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  const [formData, setFormData] = useState<Partial<Segment>>({
    name: '',
    description: '',
    criteria: 'Manual Import',
    type: 'MANUAL'
  });

  const handleOpenModal = (segment?: Segment) => {
    if (segment) {
      setEditingSegment(segment);
      setFormData(segment);
    } else {
      setEditingSegment(null);
      setFormData({ name: '', description: '', criteria: 'Manual Import', type: 'MANUAL' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingSegment) {
      setSegments(prev => prev.map(s => s.id === editingSegment.id ? { ...s, ...formData } as Segment : s));
    } else {
      const newSegment: Segment = {
        id: Date.now().toString(),
        name: formData.name || 'New Segment',
        description: formData.description || '',
        criteria: formData.criteria || 'Manual',
        userCount: Math.floor(Math.random() * 500),
        type: formData.type as 'AUTO' | 'MANUAL'
      };
      setSegments([...segments, newSegment]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this segment?')) {
      setSegments(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border-teal-200 dark:border-teal-800">
              <Users className="w-3.5 h-3.5 mr-1" />
              Segmentation
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'কাস্টমার সিআরএম (CRM)' : 'Customer CRM & Segments'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'যাত্রীদের বিভিন্ন গ্রুপে ভাগ করুন এবং মার্কেটিং ক্যাম্পেইনে ব্যবহার করুন।' : 'Group users into segments for targeted marketing.'}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন সেগমেন্ট' : 'New Segment'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-teal-500" />
              Audience Segments
            </h2>
          </div>
          
          <div className="space-y-4">
            {segments.map(segment => (
              <div key={segment.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-teal-200 dark:hover:border-teal-800/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{segment.name}</h3>
                    <Badge variant={segment.type === 'AUTO' ? 'secondary' : 'default'} className="text-[9px]">
                      {segment.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{segment.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Rule: {segment.criteria}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-black text-lg text-slate-900 dark:text-white">{segment.userCount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Users</div>
                  </div>
                  <div className="flex gap-1 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <button onClick={() => handleOpenModal(segment)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {segment.type === 'MANUAL' && (
                      <button onClick={() => handleDelete(segment.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
           <PieChart className="w-16 h-16 text-teal-100 dark:text-teal-900/50 mb-4" />
           <h3 className="text-xl font-black text-slate-900 dark:text-white">Audience Insights</h3>
           <p className="text-sm text-slate-500 mt-2">
             You have a total of <span className="font-bold text-slate-800 dark:text-slate-200">{segments.reduce((acc, s) => acc + s.userCount, 0).toLocaleString()}</span> tagged users across all active segments. Use the Campaign Manager to broadcast to these groups.
           </p>
           <Button className="mt-6 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
             Sync with CRM
           </Button>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSegment ? 'Edit Segment' : 'Create Segment'} size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Segment Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:outline-none" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:outline-none" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Segment Type</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="MANUAL">Manual (Upload/Static)</option>
              <option value="AUTO">Auto (Dynamic Rules)</option>
            </select>
          </div>
          {formData.type === 'AUTO' && (
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Filtering Rule (SQL/Text representation)</label>
               <input 
                 type="text" 
                 value={formData.criteria}
                 onChange={e => setFormData({...formData, criteria: e.target.value})}
                 className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-900 text-sm font-mono focus:border-teal-500 focus:outline-none" 
                 placeholder="e.g. Total Trips > 5"
               />
             </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-teal-600 hover:bg-teal-500 text-white font-bold" onClick={handleSave}>
              {editingSegment ? 'Save Segment' : 'Create Segment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
