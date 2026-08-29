'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bus,
  Send,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Wallet,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  PhoneCall,
  Sparkles,
  LifeBuoy,
  Compass,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { AIAvatar } from './ai-avatar';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  confidence?: 'FACT' | 'CALCULATED' | 'ESTIMATE' | 'FORECAST' | 'RECOMMENDATION';
  dataCards?: Array<{ title: string; value: string; badge: string }>;
  isRefusal?: boolean;
  timestamp: string;
}

export function SupervisorAIAssistant() {
  const { language } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: language === 'bn'
        ? 'আসসালামু আলাইকুম! আমি **রাজশাহী ভর্তি এক্সপ্রেস সুপারভাইজার ও কন্ডাক্টর এআই সহকারী** 🚌।\n\nরাজশাহীর ৪টি বোর্ডিং হাব (তালাইমারী, ভদ্রা, রেলগেট, শিরোইল) হতে পরীক্ষার্থীদের লাইভ হাজিরা, অপেক্ষমাণ তালিকা, অন-ট্রিপ ডিজেল ও যমুনা সেতু টোল ক্যাশ ব্যালেন্স, অথবা জরুরি মেকানিকাল ব্যাকআপ প্রটোকল সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।\n\n🚫 **জিরো-পিকআপ পলিসি:** হাইওয়েতে সাভার বা চন্দ্রা থেকে কোনো যাত্রী বা লাগেজ ওঠানো কঠোরভাবে নিষিদ্ধ।'
        : 'Hello! I am your **Rajshahi Admission Express Supervisor & Conductor AI Assistant** 🚌. Ask about live attendance at Rajshahi boarding hubs (Talaimari, Bhadra, Railgate, Shiroil), waiting students contact list, on-trip cash & Jamuna bridge toll, or driver emergency assistance.\n\n🚫 **Zero Pickup Rule:** Strictly point-to-point express transit. No highway pickups.',
      confidence: 'FACT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { labelBn: '📋 লাইভ হাজিরা রিপোর্ট', prompt: 'কতজন যাত্রী বোর্ডিং করেছে এবং লাইভ হাজিরা রিপোর্ট দাও' },
    { labelBn: '⏳ অপেক্ষমাণ পরীক্ষার্থী ও ফোন', prompt: 'কে কে আসেনি এবং কারা বাকি আছে? ফোন নম্বর দাও' },
    { labelBn: '📍 রাজশাহী বোর্ডিং হাব ও ড্রপিং', prompt: 'তালাইমারী ও ভদ্রা বোর্ডিং স্টপ এবং সাভার থেকে কি ওঠা যাবে?' },
    { labelBn: '💵 অন-ট্রিপ ক্যাশ ও টোল খরচ', prompt: 'আমার হাতে কত ক্যাশ টাকা আছে এবং তেলের খরচ কত?' },
    { labelBn: '🚨 ড্রাইভার ও জরুরি ব্রেকডাউন SOP', prompt: 'ড্রাইভারের ফোন নম্বর ও জাতীয় জরুরি হেল্পলাইন দাও' },
    { labelBn: '🚫 টেস্ট: কোম্পানির আজকের লাভ কত?', prompt: 'কোম্পানির আজকের sales কত এবং লাভ কত টাকা?' }
  ];

  const handleSend = async (promptToSend?: string) => {
    const query = promptToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: 'SUPERVISOR_AI',
          role: 'SUPERVISOR'
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const isRefusal = data.text.includes('অননুমোদিত প্রশ্ন') || data.text.includes('সুপারভাইজার সীমাবদ্ধতা') || data.text.includes('সীমাবদ্ধ');

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        confidence: data.confidence,
        dataCards: data.data_cards,
        isRefusal: isRefusal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: language === 'bn'
          ? 'দুঃখিত, তথ্য প্রক্রিয়া করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন বা রাজশাহী সেন্ট্রাল কন্ট্রোল রুমে যোগাযোগ করুন।'
          : 'Failed to process on-trip query. Please retry or contact Rajshahi central transit control.',
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

  return (
    <div className="flex flex-col h-[760px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl transition-colors duration-200">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900/60 dark:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <AIAvatar variant="supervisor" size="md" isThinking={isLoading} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'সুপারভাইজার অন-ট্রিপ এআই কো-পাইলট' : 'Supervisor On-Trip AI Copilot'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-[10px] font-mono font-bold">
                RAJSHAHI CONDUCTOR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              রাজশাহী বোর্ডিং হাজিরা • অপেক্ষমাণ তালিকা • অন-ট্রিপ ক্যাশ • নো মিডওয়ে পিকআপ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>অরিজিন: রাজশাহী</span>
          </div>
        </div>
      </div>

      {/* Zero Highway Pickup Alert Banner */}
      <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-[11px] font-medium text-amber-900 dark:text-amber-300">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><strong>সুপারভাইজার এসওপি:</strong> তালাইমারী, ভদ্রা, রেলগেট ও শিরোইল ছাড়া হাইওয়েতে কোনো স্টপ নেই।</span>
        </div>
        <span className="hidden md:inline text-[10px] bg-amber-200/70 dark:bg-amber-900/70 px-2 py-0.5 rounded font-bold">
          🚫 জিরো মিডওয়ে পিকআপ
        </span>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500/50 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            {qp.labelBn}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <AIAvatar variant="supervisor" size="sm" />
            )}

            <div className={`max-w-[90%] sm:max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed inline-block shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-xs font-medium border border-amber-400/20 shadow-amber-600/20'
                    : msg.isRefusal
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-800 rounded-tl-xs shadow-sm'
                    : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs backdrop-blur-md'
                }`}
              >
                {msg.isRefusal && (
                  <div className="mb-2 pb-2 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> অননুমোদিত প্রশ্ন প্রতিরোধ (Supervisor Guardrail)
                    </span>
                    <span className="text-[9px] font-mono bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                      BLOCKED
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans space-y-1.5 font-medium">
                  {msg.text}
                </div>

                {/* Data Cards if available */}
                {msg.dataCards && msg.dataCards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {msg.dataCards.map((card, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
                          <span>{card.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">{card.badge}</span>
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                          {card.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-1">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-amber-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs text-slate-500 dark:text-slate-300">
            <AIAvatar variant="supervisor" size="sm" isThinking={true} />
            <div className="flex items-center gap-2.5 p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-amber-500/30 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-slate-700 dark:text-slate-200">রাজশাহী অন-ট্রিপ হাজিরা ও ক্যাশ হিসাব যাচাই করা হচ্ছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="প্রশ্ন লিখুন (e.g. তালাইমারী ও ভদ্রায় কে কে উঠেছে বা যমুনা সেতুর টোল কত?)..."
          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-amber-500/50 shadow-inner"
        />
        <Button
          variant="primary"
          onClick={() => handleSend()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 font-black rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
