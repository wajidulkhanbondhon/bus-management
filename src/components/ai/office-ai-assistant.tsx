'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  DollarSign,
  Bus,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Check,
  Lock,
  DownloadCloud,
  Layers,
  ArrowRight,
  Zap,
  Activity,
  Shield,
  Users,
  Ticket,
  Calculator,
  ShieldAlert,
  Mic,
  Paperclip,
  Volume2,
  FileText,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';
import { AIAvatar } from './ai-avatar';

export type OfficeSubRole = 'SUPER_ADMIN' | 'MANAGER' | 'BOOKING_STAFF' | 'ACCOUNTANT';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  confidence?: 'FACT' | 'CALCULATED' | 'ESTIMATE' | 'FORECAST' | 'RECOMMENDATION';
  dataCards?: Array<{ title: string; value: string; badge: string }>;
  toolsUsed?: string[];
  isRefusal?: boolean;
  actionPreview?: {
    action_type: string;
    trip_id: string;
    seat_id: string;
    lock_reason: string;
    summary: string;
    impact: string;
    confirmation_prompt: string;
  };
  timestamp: string;
  downloadUrl?: string;
}

interface RoleConfig {
  id: OfficeSubRole;
  nameBn: string;
  nameEn: string;
  designationBn: string;
  icon: React.ElementType;
  colorClass: string;
  badgeClass: string;
  scopeDescBn: string;
  prompts: Array<{ labelBn: string; prompt: string }>;
}

const OFFICE_ROLES_CONFIG: Record<OfficeSubRole, RoleConfig> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    nameBn: 'সুপার অ্যাডমিন',
    nameEn: 'Super Admin',
    designationBn: 'ডিরেক্টর / শীর্ষ নির্বাহী',
    icon: Shield,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    scopeDescBn: 'পূর্ণ অ্যাক্সেস: ৩০ দিনের P&L, ভর্তি বাস চাহিদা পূর্বাভাস, প্রফিট মার্জিন %, ফ্লিট ও অডিট',
    prompts: [
      { labelBn: '📈 ভর্তি পরীক্ষার বাস চাহিদা পূর্বাভাস', prompt: 'আসন্ন ঢাবি ভর্তি পরীক্ষায় কয়টি বাস লাগবে এবং ছাত্রী কোচ কতটি?' },
      { labelBn: '📊 আজকের সার্বিক সেলস ও সংগ্রহ', prompt: 'আজকে sales কত এবং কালেকশন কত?' },
      { labelBn: '💵 ৩০ দিনের লাভ-ক্ষতি ও মার্জিন (P&L)', prompt: 'গত ৩০ দিনের profit কত এবং মার্জিন কত?' },
      { labelBn: '🚌 বাস বহর পারফরম্যান্স ও লাভ', prompt: 'কোন bus সবচেয়ে বেশি লাভ করেছে?' },
      { labelBn: '🧠 অডিট ইনসাইটস ও বিজনেস সুপারিশ', prompt: 'কোন সমস্যা বা ইনসাইট আছে?' }
    ]
  },
  MANAGER: {
    id: 'MANAGER',
    nameBn: 'অপারেশনস ম্যানেজার',
    nameEn: 'Operations Manager',
    designationBn: 'রুট ও বাস ফ্লিট ম্যানেজার',
    icon: Users,
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    scopeDescBn: 'রুট অপারেশনস: পরীক্ষার বাস চাহিদা ও ফ্লিট ক্যাপাসিটি, অকুপেন্সি রেট, ট্রিপ শিডিউল',
    prompts: [
      { labelBn: '📈 ভর্তি বাসের চাহিদা ও ফ্লিট পূর্বাভাস', prompt: 'আসন্ন ভর্তি পরীক্ষায় কয়টি বাস লাগবে এবং ছাত্রী কোচ কতটি?' },
      { labelBn: '🚌 বাসের অকুপেন্সি রেট ও পারফরম্যান্স', prompt: 'বাস বহরের অকুপেন্সি রেট ও পারফরম্যান্স দেখাও' },
      { labelBn: '🎟️ আজকের মোট বিক্রিত আসন', prompt: 'আজকে কতটি সিট বিক্রি হয়েছে এবং সেলস কত?' },
      { labelBn: '📈 গত ৩০ দিনের সেলস রিপোর্ট', prompt: 'গত ৩০ দিনের বিক্রির রিপোর্ট বিশ্লেষণ করো' },
      { labelBn: '🚫 টেস্ট: কোম্পানির প্রফিট মার্জিন কত?', prompt: 'কোম্পানির নিট প্রফিট মার্জিন কত?' }
    ]
  },
  BOOKING_STAFF: {
    id: 'BOOKING_STAFF',
    nameBn: 'কাউন্টার বুকিং স্টাফ',
    nameEn: 'Booking Staff',
    designationBn: 'কাউন্টার ও টিকিট অপারেটর',
    icon: Ticket,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    scopeDescBn: 'কাউন্টার বুকিং: আসন অনুসন্ধান, টিকিট বুকিং স্ট্যাটাস ও কাউন্টার শিফট কালেকশন',
    prompts: [
      { labelBn: '🎟️ আজকের কাউন্টার টিকিট সেলস', prompt: 'আজকে কাউন্টার sales কত টাকা?' },
      { labelBn: '🚌 খালি সিট ও ট্রিপ অনুসন্ধান', prompt: 'আসন্ন ট্রিপগুলোতে কতটি সিট খালি আছে?' },
      { labelBn: '💳 আজকের আদায়কৃত ক্যাশ ও বকেয়া', prompt: 'আজকে কত টাকা আদায় হয়েছে এবং বকেয়া কত?' },
      { labelBn: '🚫 টেস্ট: কোম্পানির ৩০ দিনের লাভ কত?', prompt: 'গত ৩০ দিনের profit কত এবং কোম্পানির মার্জিন কত?' }
    ]
  },
  ACCOUNTANT: {
    id: 'ACCOUNTANT',
    nameBn: 'অ্যাকাউন্ট্যান্ট',
    nameEn: 'Accountant',
    designationBn: 'আর্থিক হিসাব ও ক্যাশিয়ার',
    icon: Calculator,
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    scopeDescBn: 'আর্থিক হিসাব: ডে-ক্লোজিং, ক্যাশ রিকনসিলিয়েশন, ফুয়েল ভাউচার ও P&L বিবরণী',
    prompts: [
      { labelBn: '💵 আজকের ডে-ক্লোজিং ও ক্যাশ হিসাব', prompt: 'আজকের সেলস, আদায়কৃত ক্যাশ ও বকেয়া হিসাব দেখাও' },
      { labelBn: '📊 গত ৩০ দিনের আর্থিক P&L বিবরণী', prompt: 'গত ৩০ দিনের profit & loss এবং অপারেটিং expense বিবরণী দাও' },
      { labelBn: '🧾 ফুয়েল ও পরিচালনা খরচ বিবরণী', prompt: 'গত ৩০ দিনে মোট কত টাকা expense হয়েছে?' },
      { labelBn: '🚫 টেস্ট: বাস রুট পরিবর্তন করো', prompt: 'ঢাকা টু রাজশাহী বাসের রুট পরিবর্তন করো' }
    ]
  }
};

export function OfficeAIAssistant() {
  const { language } = useApp();
  const [activeRole, setActiveRole] = useState<OfficeSubRole>('SUPER_ADMIN');

  const currentRoleConfig = OFFICE_ROLES_CONFIG[activeRole];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: language === 'bn'
        ? `আসসালামু আলাইকুম! আমি **ATOMS অফিস এআই কো-পাইলট** 🏢। আপনি বর্তমানে **${currentRoleConfig.nameBn} (${currentRoleConfig.designationBn})** মোডে আছেন।\n\n📌 **অনুমোদিত পরিধি:** ${currentRoleConfig.scopeDescBn}।`
        : `Hello! I am the **ATOMS Office AI Copilot** 🏢 in **${currentRoleConfig.nameEn}** mode.\nScope: ${currentRoleConfig.scopeDescBn}.`,
      confidence: 'FACT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [actionConfirmModal, setActionConfirmModal] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multimodal & Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When active role changes, append a notification message indicating switch
  const handleRoleChange = (role: OfficeSubRole) => {
    if (role === activeRole) return;
    setActiveRole(role);
    const newConfig = OFFICE_ROLES_CONFIG[role];
    const switchNotice: Message = {
      id: `role-switch-${Date.now()}`,
      sender: 'ai',
      text: language === 'bn'
        ? `🔄 ভূমিকা পরিবর্তিত হয়ে **${newConfig.nameBn} (${newConfig.designationBn})** সেট করা হয়েছে।\n\n📌 **অনুমোদিত পরিধি:** ${newConfig.scopeDescBn}।`
        : `🔄 Role switched to **${newConfig.nameEn}**.`,
      confidence: 'FACT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, switchNotice]);
  };

  const startVoiceRecognition = () => {
    // @ts-expect-error
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("দুঃখিত, আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। Google Chrome ব্যবহার করুন।");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputPrompt(prev => prev + (prev ? " " : "") + transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  const playTTS = (id: string, text: string) => {
    if (isPlayingId === id) {
      window.speechSynthesis.cancel();
      setIsPlayingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting for reading
    const cleanText = text.replace(/[*_#`]/g, '').replace(/https?:\/\/[^\s]+/g, 'a link');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    
    utterance.onend = () => setIsPlayingId(null);
    utterance.onerror = () => setIsPlayingId(null);
    
    setIsPlayingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (promptToSend?: string) => {
    const query = promptToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: attachedFile ? `[Attached: ${attachedFile.name}]\n${query}` : query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      let res;
      if (attachedFile) {
        const formData = new FormData();
        formData.append('prompt', query);
        formData.append('context', 'OFFICE_AI');
        formData.append('role', activeRole);
        formData.append('file', attachedFile);
        
        res = await fetch('http://127.0.0.1:8000/api/v1/ai/multimodal-chat', {
          method: 'POST',
          body: formData
        });
        
        setAttachedFile(null); // clear file after send
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        res = await fetch('http://127.0.0.1:8000/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            context: 'OFFICE_AI',
            role: activeRole
          })
        });
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const isRefusal = data.text.includes('পারমিশন সীমাবদ্ধ') || data.text.includes('অননুমোদিত প্রশ্ন');

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        confidence: data.confidence,
        dataCards: data.data_cards,
        toolsUsed: data.tools_used,
        isRefusal: isRefusal,
        actionPreview: data.action_preview,
        downloadUrl: data.download_url,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: language === 'bn'
          ? 'আমি এখন সার্ভার থেকে তথ্যটি যাচাই করতে পারছি না। অনুগ্রহ করে ব্যাকএন্ড সংযোগ চেক করুন।'
          : 'Unable to verify data from the server right now. Please check backend connection.',
        confidence: 'FACT',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmAction = async () => {
    if (!actionConfirmModal) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/ai/action/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionConfirmModal.action_type,
          trip_id: actionConfirmModal.trip_id,
          seat_id: actionConfirmModal.seat_id,
          lock_reason: actionConfirmModal.lock_reason
        })
      });
      const data = await res.json();
      alert(data.message || 'অ্যাকশন সফলভাবে সম্পন্ন হয়েছে!');
      setActionConfirmModal(null);
    } catch (e) {
      alert('অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="flex flex-col h-[780px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl transition-colors duration-200">
      {/* 1. Top Header */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent dark:from-indigo-950/60 dark:via-slate-900/80 dark:to-blue-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <AIAvatar variant="office" size="md" isThinking={isLoading} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'অফিস এআই বিজনেস ও অপারেশন কো-পাইলট' : 'Office AI Business & Operations Copilot'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${currentRoleConfig.badgeClass}`}>
                {currentRoleConfig.nameEn.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {currentRoleConfig.scopeDescBn}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Role Scoped Safe
          </span>
        </div>
      </div>

      {/* 2. Office Sub-Role / Division Switcher Bar */}
      <div className="p-2.5 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1.5 flex items-center gap-1 font-mono uppercase">
          <Layers className="w-3.5 h-3.5" />
          <span>অফিস ডিভিশন:</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(Object.keys(OFFICE_ROLES_CONFIG) as OfficeSubRole[]).map((rKey) => {
            const r = OFFICE_ROLES_CONFIG[rKey];
            const Icon = r.icon;
            const isSelected = activeRole === rKey;

            return (
              <button
                key={rKey}
                type="button"
                onClick={() => handleRoleChange(rKey)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.nameBn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Role-Tailored Quick Prompts Bar */}
      <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
        {currentRoleConfig.prompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-indigo-600/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-indigo-500/50 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            {qp.labelBn}
          </button>
        ))}
      </div>

      {/* 4. Messages Viewport */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <AIAvatar variant="office" size="sm" />
            )}

            <div className={`max-w-[88%] sm:max-w-[78%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed inline-block shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs font-medium border border-blue-400/20 shadow-blue-600/20'
                    : msg.isRefusal
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-800 rounded-tl-xs shadow-sm'
                    : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs backdrop-blur-md'
                }`}
              >
                {/* Refusal Notice Badge */}
                {msg.isRefusal && (
                  <div className="mb-2 pb-2 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      অননুমোদিত প্রশ্ন প্রতিরোধ (Role Guardrail Blocked)
                    </span>
                    <span className="text-[9px] font-mono bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                      RESTRICTED
                    </span>
                  </div>
                )}

                {/* Confidence Badge for AI Responses */}
                {msg.sender === 'ai' && msg.confidence && !msg.isRefusal && (
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-[10px] font-black uppercase text-blue-600 dark:text-cyan-300 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                      CONFIDENCE: {msg.confidence}
                    </span>
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                        Tools: {msg.toolsUsed.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Markdown text rendered cleanly */}
                <div className="whitespace-pre-wrap font-sans space-y-1.5 font-medium">
                  {msg.text}
                </div>

                {/* Data Cards if present */}
                {msg.dataCards && msg.dataCards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {msg.dataCards.map((card, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                        <span className="text-[10px] text-slate-500 dark:text-indigo-300/80 font-bold block">{card.title}</span>
                        <span className="text-base font-black text-slate-900 dark:text-white font-mono">{card.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Confirmation Preview Button */}
                {msg.actionPreview && (
                  <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-500/40 text-left space-y-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">{msg.actionPreview.summary}</span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300/80 block">{msg.actionPreview.impact}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActionConfirmModal(msg.actionPreview)}
                      className="mt-1 text-xs font-black rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      কনফার্মেশন ও সম্পাদন করুন
                    </Button>
                  </div>
                )}

                {/* CSV Download Button */}
                {msg.downloadUrl && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href={msg.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-colors"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      রিপোর্ট ডাউনলোড করুন
                    </a>
                  </div>
                )}
              </div>

              {/* Message Footer: Timestamp, Copy, Feedback, TTS */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-1 mt-1">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => playTTS(msg.id, msg.text)}
                      className={`hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer ${isPlayingId === msg.id ? 'text-blue-600 dark:text-cyan-400' : ''}`}
                    >
                      <Volume2 className="w-3 h-3" />
                      {isPlayingId === msg.id ? 'থামান' : 'শুনুন'}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <AIAvatar variant="office" size="sm" isThinking={true} />
            <div className="p-4 rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{currentRoleConfig.nameBn} পারমিশন যাচাই ও ডাটাবেজ প্রসেসিং...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Message Input Bar */}
      <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        {/* Attached File Preview */}
        {attachedFile && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-indigo-950/30 rounded-xl border border-blue-200 dark:border-indigo-800/50 max-w-sm">
            <div className="flex items-center gap-2 overflow-hidden text-xs text-blue-800 dark:text-blue-300 font-medium">
              <FileText className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
              <span className="truncate">{attachedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-blue-200 dark:hover:bg-indigo-800 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* File Input (Hidden) & Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setAttachedFile(e.target.files[0]);
              }
            }}
            className="hidden"
            accept=".pdf,.csv,.xlsx,.jpg,.jpeg,.png,video/mp4"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl shrink-0 transition-colors cursor-pointer"
            title="Attach file (PDF, Image, CSV)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              isRecording 
                ? (language === 'bn' ? 'শুনছি...' : 'Listening...')
                : (language === 'bn'
                    ? `${currentRoleConfig.nameBn} সংক্রান্ত বিষয় জিজ্ঞাসা করুন...`
                    : `Ask queries relevant to ${currentRoleConfig.nameEn}...`)
            }
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isRecording ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-800 placeholder:text-rose-500' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}`}
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={startVoiceRecognition}
            disabled={isLoading || isRecording}
            className={`p-3 rounded-2xl shrink-0 transition-colors cursor-pointer ${isRecording ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 animate-pulse' : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          <Button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-2xl shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* 6. Controlled Action Confirmation Modal */}
      {actionConfirmModal && (
        <Modal
          isOpen={true}
          onClose={() => setActionConfirmModal(null)}
          title="অ্যাকশন সম্পাদনের পূর্বে চূড়ান্ত অনুমোদন"
        >
          <div className="space-y-4 p-2">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-700/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-950 dark:text-amber-200 block">{actionConfirmModal.summary}</span>
                <p className="text-amber-800 dark:text-amber-300 font-medium">{actionConfirmModal.impact}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিত যে এই পরিবর্তনটি সরাসরি সিস্টেমে কার্যকর করতে চান? এই অপারেশনের একটি স্থায়ী অডিট লগ সংরক্ষিত হবে।
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionConfirmModal(null)}
                className="text-xs font-bold"
              >
                বাতিল করুন
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAction}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white"
              >
                হ্যাঁ, অনুমোদন করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
