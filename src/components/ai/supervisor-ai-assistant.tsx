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
  LifeBuoy
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
        ? 'আসসালামু আলাইকুম! আমি **ATOMS সুপারভাইজার ট্রিপ ও কন্ডাক্টর এআই সহকারী** 🚌। আপনার চলতি বাসের যাত্রী হাজিরা, অপেক্ষমাণ শিক্ষার্থীদের তালিকা, সাভার/চন্দ্রা স্টপের সময়, অন-ট্রিপ ক্যাশ ব্যালেন্স বা জরুরি ড্রাইভার প্রটোকল সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।'
        : 'Hello! I am your **ATOMS Supervisor Trip & Conductor AI Assistant** 🚌. Ask about live passenger attendance, waiting students list, stop milestones, on-trip cash in hand, or driver emergency assistance.',
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
    { labelBn: '📋 যাত্রীদের লাইভ হাজিরা রিপোর্ট', prompt: 'কতজন যাত্রী বোর্ডিং করেছে এবং লাইভ হাজিরা রিপোর্ট দাও' },
    { labelBn: '⏳ অপেক্ষমাণ শিক্ষার্থীদের তালিকা ও ফোন', prompt: 'কে কে আসেনি এবং কারা বাকি আছে? ফোন নম্বর দাও' },
    { labelBn: '📍 স্টপ ও পিকআপ শিডিউল', prompt: 'সাভার, নবীনগর ও চন্দ্রা স্টপে কে কে উঠবে এবং ড্রপিং পয়েন্ট কোথায়?' },
    { labelBn: '💵 অন-ট্রিপ ক্যাশ ও খরচ হিসাব', prompt: 'আমার হাতে কত ক্যাশ টাকা আছে এবং তেলের খরচ কত?' },
    { labelBn: '🚨 ড্রাইভার ও জরুরি পুলিশ হেল্পলাইন', prompt: 'ড্রাইভারের ফোন নম্বর ও জাতীয় জরুরি হেল্পলাইন দাও' },
    { labelBn: '🚫 টেস্ট: কোম্পানির আজকের সেলস কত?', prompt: 'কোম্পানির আজকের sales কত এবং লাভ কত টাকা?' }
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
      const isRefusal = data.text.includes('অননুমোদিত প্রশ্ন') || data.text.includes('পারমিশন সীমাবদ্ধ');

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
          ? 'দুঃখিত, এআই সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে ব্যাকএন্ড সক্রিয় আছে কিনা যাচাই করুন।'
          : 'Failed to connect to the AI backend service. Please ensure backend is running.',
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* 1. Trip & Role Scope Header Banner */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 border-b border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <AIAvatar variant="supervisor" size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{language === 'bn' ? 'সুপারভাইজার অন-ট্রিপ এআই সহকারী' : 'Supervisor Trip AI Assistant'}</span>
              </h2>
              <Badge variant="warning" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                {language === 'bn' ? 'কন্ডাক্টর মোড' : 'Conductor Mode'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dhaka Express 01 (RU-EXPRESS-101) • ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়</span>
            </p>
          </div>
        </div>

        {/* Scope Restriction Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-800">
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>{language === 'bn' ? 'শুধু ট্রিপ ও যাত্রী পরিধি অনুমোদিত' : 'Trip & Passenger Scope Only'}</span>
        </div>
      </div>

      {/* 2. Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh] sm:max-h-[65vh]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {!isUser && <AIAvatar variant="supervisor" size="xs" />}

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-br-none shadow-amber-600/20'
                    : msg.isRefusal
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-800 rounded-bl-none shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                }`}
              >
                {/* Refusal Notice Badge */}
                {msg.isRefusal && (
                  <div className="mb-2 pb-2 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      অননুমোদিত প্রশ্ন প্রতিরোধ (Guardrail Blocked)
                    </span>
                    <span className="text-[9px] font-mono bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                      RESTRICTED
                    </span>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap font-medium">
                  {msg.text}
                </div>

                {/* Data Cards Visualization if available */}
                {msg.dataCards && msg.dataCards.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    {msg.dataCards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 text-center"
                      >
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                          {card.title}
                        </span>
                        <span className="text-xs font-black text-amber-700 dark:text-amber-300 block mt-0.5">
                          {card.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      title="কপি করুন"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 max-w-md mr-auto animate-in fade-in">
            <AIAvatar variant="supervisor" size="xs" isThinking />
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>ট্রিপ ডাটাবেজ যাচাই করা হচ্ছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Supervisor Prompts Carousel */}
      <div className="px-3 pt-2 pb-1 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>সুপারভাইজার কুইক প্রম্পট (অন-ট্রিপ অপারেশন):</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(item.prompt)}
              disabled={isLoading}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 transition-all cursor-pointer hover:scale-102 shrink-0 active:scale-95"
            >
              {item.labelBn}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Query Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'হাজিরা, স্টপ, অন-ট্রিপ ক্যাশ বা ড্রাইভার সহায়তার বিষয়ে জিজ্ঞাসা করুন...'
                : 'Ask about attendance, stops, cash in hand or driver emergency...'
            }
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold p-2.5 rounded-xl shrink-0 cursor-pointer shadow-md shadow-amber-600/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
