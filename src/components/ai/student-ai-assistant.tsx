'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  Phone,
  Ticket,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check
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
  timestamp: string;
}

export function StudentAIAssistant() {
  const { language } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: language === 'bn'
        ? 'আসসালামু আলাইকুম! আমি আপনার **ভর্তি বাস পার্সোনাল অ্যাসিস্ট্যান্ট** 🎓। আপনার বাস ছাড়ার সময়, সিট নম্বর, পিকআপ পয়েন্ট বা বকেয়া ভাড়ার ব্যাপারে যেকোনো প্রশ্ন করতে পারেন।'
        : 'Hello! I am your **Admission Bus Personal Transport Assistant** 🎓. You can ask about your bus schedule, seat number, boarding point, or dues.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [studentPhone, setStudentPhone] = useState('01712345678');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { labelBn: '🚌 আমার বাস কখন ছাড়বে?', prompt: 'আমার bus কখন ছাড়বে এবং পিকআপ পয়েন্ট কোথায়?' },
    { labelBn: '💺 আমার সিট নম্বর কত?', prompt: 'আমার seat কোনটা?' },
    { labelBn: '💳 আমার কত টাকা বকেয়া আছে?', prompt: 'আমার কত টাকা due আছে?' },
    { labelBn: '👥 বাবা/ভাই কি ছাত্রী বাসে যেতে পারবে?', prompt: 'আমার বাবা বা ভাই কি যেতে পারবে? guardian rules বলো।' },
    { labelBn: '🎟️ অন্য কোনো বাস খালি আছে?', prompt: 'রাজশাহী বাসের আর কোনো সিট খালি আছে?' }
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
          context: 'STUDENT_AI',
          student_phone: studentPhone
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const fallbackMsg: Message = {
        id: `fallback-${Date.now()}`,
        sender: 'ai',
        text: 'দুঃখিত, তথ্য যাচাই করতে সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে চেষ্টা করুন বা হেল্পলাইনে কল করুন।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
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
    <div className="flex flex-col h-[750px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AIAvatar variant="student" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'স্টুডেন্ট এআই ট্রান্সপোর্ট সহকারী' : 'Student AI Transport Assistant'}
              </h2>
              <Badge variant="success" className="text-[10px] font-mono">STUDENT SECURE</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ভর্তি স্পেশাল ট্রিপ, সিট ও পিকআপ লোকেশন হেল্পার
            </p>
          </div>
        </div>

        {/* Mobile Number Indicator */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <input
            type="text"
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
            placeholder="আপনার মোবাইল নম্বর"
            className="w-28 bg-transparent focus:outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
          >
            {qp.labelBn}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <AIAvatar variant="student" size="sm" />
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed inline-block shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                    : 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-1">
                  {msg.text}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs text-slate-500">
            <AIAvatar variant="student" size="sm" isThinking={true} />
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>আপনার বাস ও সিট তথ্য অনুসন্ধান করা হচ্ছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="আপনার প্রশ্ন লিখুন (e.g. আমার বাস কখন ছাড়বে?)..."
          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <Button
          variant="primary"
          onClick={() => handleSend()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-4 font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
