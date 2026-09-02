'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  MessageSquare,
  Bell,
  Settings,
  Power,
  Save,
  Send,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';

interface SmsTemplate {
  id: string;
  name: string;
  event: 'BOOKING_CONFIRM' | 'TRIP_REMINDER' | 'CANCELLATION' | 'PAYMENT_SUCCESS' | 'CUSTOM';
  message: string;
  isActive: boolean;
}

interface SmsLog {
  id: string;
  phone: string;
  event: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  sentAt: string;
}

const dummyTemplates: SmsTemplate[] = [
  { id: '1', name: 'Booking Confirmation', event: 'BOOKING_CONFIRM', message: 'আপনার টিকিট কনফার্ম হয়েছে! বুকিং #{bookingNo}, রুট: {route}, তারিখ: {date}। QR কোড: {qrLink}', isActive: true },
  { id: '2', name: 'Trip Reminder', event: 'TRIP_REMINDER', message: 'রিমাইন্ডার: আগামীকাল আপনার {route} ট্রিপ। বাস ছাড়বে {time} এ। বোর্ডিং পয়েন্ট: {boarding}', isActive: true },
  { id: '3', name: 'Cancellation Notice', event: 'CANCELLATION', message: 'আপনার বুকিং #{bookingNo} বাতিল করা হয়েছে। রিফান্ড ৩ কর্মদিবসের মধ্যে প্রসেস হবে।', isActive: true },
  { id: '4', name: 'Payment Success', event: 'PAYMENT_SUCCESS', message: 'পেমেন্ট সফল! ৳{amount} পেমেন্ট গ্রহণ করা হয়েছে। ট্রানজ্যাকশন ID: {txnId}', isActive: false },
];

const dummyLogs: SmsLog[] = [
  { id: '1', phone: '01711***456', event: 'Booking Confirm', status: 'DELIVERED', sentAt: '2 mins ago' },
  { id: '2', phone: '01822***789', event: 'Trip Reminder', status: 'DELIVERED', sentAt: '15 mins ago' },
  { id: '3', phone: '01933***123', event: 'Booking Confirm', status: 'FAILED', sentAt: '1 hour ago' },
  { id: '4', phone: '01644***321', event: 'Cancellation', status: 'DELIVERED', sentAt: '3 hours ago' },
  { id: '5', phone: '01555***654', event: 'Payment Success', status: 'PENDING', sentAt: '5 hours ago' },
];

export default function NotificationsPage() {
  const { language } = useApp();
  const [globalStatus, setGlobalStatus] = useState(true);
  const [templates, setTemplates] = useState<SmsTemplate[]>(dummyTemplates);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEvent, setNewEvent] = useState<SmsTemplate['event']>('CUSTOM');
  const [newMessage, setNewMessage] = useState('');

  const toggleTemplate = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMessage.trim()) return;
    setTemplates([{ id: Date.now().toString(), name: newName, event: newEvent, message: newMessage, isActive: true }, ...templates]);
    setIsCreateModalOpen(false);
    setNewName(''); setNewMessage('');
  };

  const delivered = dummyLogs.filter(l => l.status === 'DELIVERED').length;
  const failed = dummyLogs.filter(l => l.status === 'FAILED').length;

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border-teal-200 dark:border-teal-800">
              <Bell className="w-3.5 h-3.5 mr-1" />
              Communication
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'SMS ও নোটিফিকেশন সিস্টেম' : 'SMS & Notification System'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn' ? 'যাত্রীদের স্বয়ংক্রিয়ভাবে বুকিং কনফার্মেশন, ট্রিপ রিমাইন্ডার এবং পেমেন্ট রিসিট পাঠান।' : 'Send automated booking confirmations, trip reminders and payment receipts.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl font-black shadow-lg shadow-teal-500/25 px-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-none">
          <Plus className="w-5 h-5 mr-1.5" />
          {language === 'bn' ? 'নতুন টেমপ্লেট' : 'New Template'}
        </Button>
      </div>

      {/* Global Toggle */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${globalStatus ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${globalStatus ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-500'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${globalStatus ? 'text-teal-900 dark:text-teal-100' : 'text-slate-700'}`}>
              {language === 'bn' ? 'অটো-SMS স্ট্যাটাস' : 'Auto-SMS Status'}
            </h3>
            <p className={`text-xs mt-0.5 ${globalStatus ? 'text-teal-700 dark:text-teal-400/80' : 'text-slate-500'}`}>
              {globalStatus ? 'বুকিং হলে স্বয়ংক্রিয়ভাবে SMS যাচ্ছে।' : 'অটো SMS বন্ধ আছে।'}
            </p>
          </div>
        </div>
        <button onClick={() => setGlobalStatus(!globalStatus)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${globalStatus ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${globalStatus ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-teal-500">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {language === 'bn' ? 'আজ পাঠানো' : 'Sent Today'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{dummyLogs.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-emerald-600 uppercase font-mono flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {language === 'bn' ? 'ডেলিভার্ড' : 'Delivered'}</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">{delivered}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500">
          <span className="text-xs font-bold text-rose-600 uppercase font-mono flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {language === 'bn' ? 'ব্যর্থ' : 'Failed'}</span>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">{failed}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Templates */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{language === 'bn' ? 'SMS টেমপ্লেট' : 'SMS Templates'}</h3>
          {templates.map(t => (
            <Card key={t.id} className={`p-4 border-2 ${t.isActive ? 'border-teal-200 dark:border-teal-800' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">{t.event}</span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{t.name}</h4>
                </div>
                <button onClick={() => toggleTemplate(t.id)} className={`p-1.5 rounded-lg border ${t.isActive ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg font-mono leading-relaxed">{t.message}</p>
            </Card>
          ))}
        </div>

        {/* Live Log */}
        <div className="xl:col-span-3">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-slate-800 h-full">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-500" />
                {language === 'bn' ? 'SMS লগ (আজ)' : 'SMS Log (Today)'}
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">Live</Badge>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {dummyLogs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase
                        ${log.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                          log.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {log.sentAt}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{log.phone}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{log.event}</p>
                  </div>
                  {log.status === 'FAILED' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-lg">Retry</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={language === 'bn' ? 'নতুন SMS টেমপ্লেট' : 'New SMS Template'} size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">টেমপ্লেটের নাম</label>
            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Eid Special Greeting" className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ইভেন্ট</label>
            <select value={newEvent} onChange={e => setNewEvent(e.target.value as SmsTemplate['event'])} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <option value="BOOKING_CONFIRM">Booking Confirm</option>
              <option value="TRIP_REMINDER">Trip Reminder</option>
              <option value="CANCELLATION">Cancellation</option>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">মেসেজ</label>
            <textarea required rows={4} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Variables: {bookingNo}, {route}, {date}, {time}, {amount}" className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none font-mono" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl font-bold">বাতিল</Button>
            <Button type="submit" variant="primary" className="rounded-xl font-black px-6 bg-teal-500 hover:bg-teal-600 border-none text-white">সেভ করুন</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
