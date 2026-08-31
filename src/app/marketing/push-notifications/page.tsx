'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  BellRing,
  PlusCircle,
  Send,
  Trash2,
  Eye,
  Clock,
  Smartphone,
  Users
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetSegment: string;
  sentAt?: Date;
  status: 'DRAFT' | 'SENT' | 'SCHEDULED';
  clicks: number;
}

export default function PushNotificationsPage() {
  const { language } = useApp();
  const [notifications, setNotifications] = useState<PushNotification[]>([
    { id: '1', title: 'Flash Sale! 20% Off', message: 'Book your RU admission bus now and get 20% off. Limited time only!', targetSegment: 'All Users', sentAt: new Date(Date.now() - 86400000), status: 'SENT', clicks: 342 },
    { id: '2', title: 'DU Exam Date Announced', message: 'Dhaka University A unit exam on 15th March. Check schedules now.', targetSegment: 'DU Candidates', status: 'DRAFT', clicks: 0 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<PushNotification>>({
    title: '',
    message: '',
    targetSegment: 'All Users',
    status: 'DRAFT'
  });

  const handleOpenModal = () => {
    setFormData({ title: '', message: '', targetSegment: 'All Users', status: 'DRAFT' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const isSendingNow = formData.status === 'SENT';
    const newNotification: PushNotification = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled Notification',
      message: formData.message || '',
      targetSegment: formData.targetSegment || 'All Users',
      status: formData.status as 'DRAFT' | 'SENT' | 'SCHEDULED',
      sentAt: isSendingNow ? new Date() : undefined,
      clicks: 0
    };
    setNotifications([newNotification, ...notifications]);
    setIsModalOpen(false);
    
    if (isSendingNow) {
      alert('Push notification broadcasted successfully!');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800">
              <BellRing className="w-3.5 h-3.5 mr-1" />
              Notifications
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'ওয়েব পুশ নোটিফিকেশন' : 'Push Notifications'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'যাত্রীদের ব্রাউজার এবং মোবাইলে লাইভ অ্যালার্ট পাঠান।' : 'Broadcast live alerts to passenger devices.'}
          </p>
        </div>
        <Button onClick={handleOpenModal} className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25">
          <PlusCircle className="w-4 h-4 mr-2" />
          {language === 'bn' ? 'নতুন নোটিফিকেশন' : 'New Alert'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Broadcasts</h2>
          {notifications.map(notification => (
            <Card key={notification.id} className="p-4 border-2 border-slate-200 dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <BellRing className={`w-5 h-5 ${notification.status === 'SENT' ? 'text-emerald-500' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{notification.title}</h3>
                  <Badge variant={notification.status === 'SENT' ? 'success' : 'default'} className="text-[10px] ml-2">
                    {notification.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {notification.targetSegment}</span>
                  {notification.sentAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {notification.sentAt.toLocaleDateString()}</span>}
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-500" /> {notification.clicks} Clicks</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 border-l border-slate-100 dark:border-slate-800 pl-3">
                 <button onClick={() => handleDelete(notification.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </Card>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No notifications found.</div>
          )}
        </div>

        {/* Right Side: Preview */}
        <div className="hidden md:block">
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Live Preview</h2>
           <div className="relative mx-auto w-[300px] h-[600px] border-[8px] border-slate-900 rounded-[2.5rem] bg-slate-50 overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
             
             {/* Mock OS Header */}
             <div className="bg-blue-600 h-16 w-full absolute top-0 left-0"></div>
             
             {/* Mock Notification Popup */}
             <div className="absolute top-16 left-2 right-2 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-100 z-30 animate-in slide-in-from-top-4">
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                   <BellRing className="w-3 h-3 text-white" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ATOMS Transit</span>
                 <span className="text-[10px] text-slate-400 ml-auto">Now</span>
               </div>
               <h4 className="font-bold text-slate-900 text-xs mt-1">{formData.title || 'Notification Title'}</h4>
               <p className="text-slate-600 text-[11px] leading-tight mt-0.5">{formData.message || 'The notification message will appear here. Keep it short and engaging.'}</p>
             </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Compose Push Notification" size="md">
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Title</label>
            <input 
              type="text" 
              maxLength={40}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-rose-500 focus:outline-none" 
              placeholder="e.g. Flash Sale! 20% Off"
            />
            <div className="text-[10px] text-right text-slate-400">{formData.title?.length || 0}/40</div>
          </div>
          
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Body</label>
             <textarea 
               maxLength={120}
               value={formData.message}
               onChange={e => setFormData({...formData, message: e.target.value})}
               className="w-full h-20 px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-rose-500 focus:outline-none resize-none"
               placeholder="Write a concise, engaging message..."
             ></textarea>
             <div className="text-[10px] text-right text-slate-400">{formData.message?.length || 0}/120</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Audience</label>
            <select 
              value={formData.targetSegment}
              onChange={e => setFormData({...formData, targetSegment: e.target.value})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-rose-500 focus:outline-none"
            >
              <option value="All Users">All Registered Users</option>
              <option value="DU Candidates">Dhaka University Candidates</option>
              <option value="RU Candidates">Rajshahi University Candidates</option>
              <option value="App Users">Mobile App Users</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Action</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-rose-500 focus:outline-none"
            >
              <option value="DRAFT">Save as Draft</option>
              <option value="SENT">Broadcast Now</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              className={`font-bold ${formData.status === 'SENT' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`} 
              onClick={handleSave}
            >
              {formData.status === 'SENT' ? <><Send className="w-4 h-4 mr-2" /> Send Broadcast</> : 'Save Draft'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
