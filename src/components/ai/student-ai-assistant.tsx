'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
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
  Copy,
  Check,
  Zap,
  GraduationCap,
  FileText,
  Upload,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { AIAvatar } from './ai-avatar';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isRefusal?: boolean;
  dataCards?: Array<{ title: string; value: string; badge: string }>;
  timestamp: string;
}

interface AdmitCardScanResult {
  candidate_name: string;
  admission_roll: string;
  university_code: string;
  university_name: string;
  unit: string;
  exam_date: string;
  exam_time: string;
  exam_center: string;
  dropping_gate: string;
  verification_status: string;
  buffer_guidance: {
    recommended_departure_from_rajshahi: string;
    expected_campus_arrival: string;
    rest_and_revision_buffer_hours: number;
    rajshahi_boarding_points: string[];
    guarantee_message: string;
  };
  matched_trips: Array<{
    trip_id: string;
    trip_code: string;
    route_name: string;
    departure_date: string;
    departure_time: string;
    bus_name: string;
    bus_type: string;
    base_fare_bdt: number;
    available_seats_count: number;
    direct_transit: string;
  }>;
}

export function StudentAIAssistant() {
  const { language } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: language === 'bn'
        ? 'আসসালামু আলাইকুম! আমি আপনার **রাজশাহী ভর্তি স্পেশাল এক্সপ্রেস এআই সহকারী** 🎓।\n\nআমাদের সকল বাস শুধুমাত্র **রাজশাহী (তালাইমারী, ভদ্রা, রেলগেট, শিরোইল)** থেকে সরাসরি বিভিন্ন বিশ্ববিদ্যালয় ক্যাম্পাসের প্রধান গেটে যায়। মাঝপথে কোনো লোকাল পিকআপ নেই এবং পরীক্ষা শুরুর **৩ থেকে ৪ ঘণ্টা পূর্বে** নিরাপদ পৌঁছানোর বাফার গ্যারান্টি প্রদান করা হয়।'
        : 'Hello! I am your **Rajshahi-Origin Point-to-Point Admission Transport Assistant** 🎓. All buses strictly depart from Rajshahi directly to university campus gates (Zero Highway Pickups, 3-4 Hour Exam Buffer Guarantee).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [studentPhone, setStudentPhone] = useState('01712345678');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admit Card OCR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AdmitCardScanResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { labelBn: '🚌 আমার বাস কখন ছাড়বে?', prompt: 'আমার bus কখন ছাড়বে এবং পিকআপ পয়েন্ট কোথায়?' },
    { labelBn: '⏱️ জাবি পরীক্ষার জন্য কখন রওনা হবো?', prompt: 'রাজশাহী থেকে জেইউ ডি ইউনিটের পরীক্ষা দিতে কখন রওনা হবো?' },
    { labelBn: '👥 ছাত্রী বাসে অভিভাবক নিয়ম', prompt: 'ছাত্রী বাসে আমার ভাই বা বাবা কি যেতে পারবে? guardian rules বলো।' },
    { labelBn: '🚫 সাভার বা চন্দ্রা থেকে কি ওঠা যাবে?', prompt: 'মাঝপথে সাভার বা চন্দ্রা থেকে কি কাউকে উঠানো যাবে?' },
    { labelBn: '🎟️ রাজশাহী বাসের খালি সিট', prompt: 'রাজশাহী থেকে আর কোনো বাসের সিট খালি আছে?' },
    { labelBn: '🚫 টেস্ট: কোম্পানির লাভ কত?', prompt: 'আজকে অফিসের sales কত টাকা এবং কোম্পানির লাভ কত?' }
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
          role: 'STUDENT',
          student_phone: studentPhone
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const isRefusal = data.text.includes('অননুমোদিত প্রশ্ন') || data.text.includes('শিক্ষার্থী সীমাবদ্ধতা') || data.text.includes('সীমাবদ্ধ');

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        isRefusal: isRefusal,
        dataCards: data.data_cards,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const fallbackMsg: Message = {
        id: `fallback-${Date.now()}`,
        sender: 'ai',
        text: 'দুঃখিত, তথ্য যাচাই করতে সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে চেষ্টা করুন বা রাজশাহীর সেন্ট্রাল হেল্পলাইনে কল করুন (📞 ০১৭১২-৩৪৫৬৭৮)।',
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

  // Perform AI Admit Card Scan
  const handleScanAdmitCard = async (sampleType: string) => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('sample_type', sampleType);

      const res = await fetch('http://127.0.0.1:8000/api/v1/ai/scan-student-card', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('OCR Scan failed');
      }

      const data = await res.json();
      setScanResult({
        candidate_name: data.extracted_data.candidate_name,
        admission_roll: data.extracted_data.admission_roll,
        university_code: data.extracted_data.university_code,
        university_name: data.extracted_data.university_name,
        unit: data.extracted_data.unit,
        exam_date: data.extracted_data.exam_date,
        exam_time: data.extracted_data.exam_time,
        exam_center: data.extracted_data.exam_center,
        dropping_gate: data.extracted_data.dropping_gate,
        verification_status: data.extracted_data.verification_status,
        buffer_guidance: data.buffer_guidance,
        matched_trips: data.matched_trips || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-[760px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl transition-colors duration-200">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-transparent dark:from-emerald-950/60 dark:via-slate-900/80 dark:to-teal-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <AIAvatar variant="student" size="md" isThinking={isLoading} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'রাজশাহী ভর্তি এক্সপ্রেস এআই সহকারী' : 'Rajshahi Admission Express AI'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                RAJSHAHI ORIGIN EXPRESS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              সরাসরি ক্যাম্পাস গেটে ড্রপিং • নো মিডওয়ে পিকআপ • ৩-৪ ঘণ্টা রেস্ট বাফার
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Admit Card OCR Scanner Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>প্রবেশপত্র স্ক্যান (OCR)</span>
          </button>

          {/* Student Phone */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-2xs">
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="text"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="মোবাইল নম্বর"
              className="w-24 bg-transparent focus:outline-none text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Origin & Zero Pickup Indicator Banner */}
      <div className="px-4 py-2 bg-emerald-600/10 dark:bg-emerald-950/40 border-b border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-[11px] font-medium text-emerald-900 dark:text-emerald-300">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span><strong>রাজশাহী বোর্ডিং হাব:</strong> তালাইমারী • ভদ্রা • রেলগেট • শিরোইল টার্মিনাল</span>
        </div>
        <span className="hidden md:inline text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold">
          🛡️ হাইওয়েতে জিরো পিকআপ (Non-Stop)
        </span>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            {qp.labelBn}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <AIAvatar variant="student" size="sm" />
            )}

            <div className={`max-w-[90%] sm:max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed inline-block shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs font-medium border border-emerald-400/20 shadow-emerald-600/20'
                    : msg.isRefusal
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-2 border-rose-300 dark:border-rose-800 rounded-tl-xs shadow-sm'
                    : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs backdrop-blur-md'
                }`}
              >
                {msg.isRefusal && (
                  <div className="mb-2 pb-2 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      ⚠️ অননুমোদিত প্রশ্ন প্রতিরোধ (Student Guardrail)
                    </span>
                    <span className="text-[9px] font-mono bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                      RESTRICTED
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
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">{card.badge}</span>
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
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs text-slate-500 dark:text-slate-300">
            <AIAvatar variant="student" size="sm" isThinking={true} />
            <div className="flex items-center gap-2.5 p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-emerald-500/30 shadow-md">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-slate-700 dark:text-slate-200">রাজশাহী এক্সপ্রেস শিডিউল ও বাফার হিসাব করা হচ্ছে...</span>
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
          placeholder="প্রশ্ন লিখুন (e.g. জাবি ডি ইউনিটের পরীক্ষা দিতে কখন রাজশাহী থেকে রওনা হবো?)..."
          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-emerald-500/50 shadow-inner"
        />
        <Button
          variant="primary"
          onClick={() => handleSend()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 font-black rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Admit Card AI OCR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-transparent dark:from-emerald-950/50 dark:via-slate-900 dark:to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ভর্তি প্রবেশপত্র এআই স্ক্যানার ও রাজশাহী ট্রিপ ম্যাচিং
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Admit Card OCR Auto-Matching to Direct Rajshahi Express Trips
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Sample Admit Card Picker */}
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">
                  নমুনা প্রবেশপত্র নির্বাচন করুন অথবা ফাইল আপলোড করুন:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleScanAdmitCard('DU_SCIENCE')}
                    disabled={isScanning}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      ঢাকা বিশ্ববিদ্যালয় (DU)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      A ইউনিট (কার্জন হল গেট)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScanAdmitCard('JU_BIOLOGY')}
                    disabled={isScanning}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      জাহাঙ্গীরনগর (JU)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      D ইউনিট (ডেইরি গেট)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScanAdmitCard('MEDICAL')}
                    disabled={isScanning}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      মেডিকেল পরীক্ষা
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      DMC ও সলিমুল্লাহ ফটক
                    </div>
                  </button>
                </div>
              </div>

              {/* Scanning progress */}
              {isScanning && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-12 h-12">
                    <RefreshCw className="w-12 h-12 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <Sparkles className="w-5 h-5 text-teal-500 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      প্রবেশপত্র ওসিআর ও যাচাইকরণ চলছে...
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      রোল নম্বর, ইউনিট ও রাজশাহী এক্সপ্রেস ছাড়ার সেফ বাফার নির্ণয় করা হচ্ছে
                    </p>
                  </div>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && !isScanning && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Extracted Credentials Card */}
                  <div className="p-4.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/70 dark:border-emerald-800/70 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                          যাচাইকৃত প্রবেশপত্র তথ্য ({scanResult.university_code})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-200/80 dark:bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-100">
                        {scanResult.verification_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">পরীক্ষার্থীর নাম</span>
                        <span className="font-black text-slate-900 dark:text-white">{scanResult.candidate_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ভর্তি রোল নম্বর</span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{scanResult.admission_roll}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ইউনিট ও অনুষদ</span>
                        <span className="font-bold text-slate-900 dark:text-white">{scanResult.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">পরীক্ষার তারিখ ও সময়</span>
                        <span className="font-bold text-slate-900 dark:text-white">{scanResult.exam_date} ({scanResult.exam_time})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">সরাসরি ড্রপিং গেট</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">🏫 {scanResult.dropping_gate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Buffer Guidance */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>সুপারিশকৃত নিরাপদ রাজশাহী যাত্রা শিডিউল ({scanResult.buffer_guidance.rest_and_revision_buffer_hours} ঘণ্টা রেস্ট বাফার):</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 space-y-1">
                      <p>• <strong>রাজশাহী ছাড়ার সময়:</strong> {scanResult.buffer_guidance.recommended_departure_from_rajshahi}</p>
                      <p>• <strong>ক্যাম্পাস পৌঁছানো:</strong> {scanResult.buffer_guidance.expected_campus_arrival}</p>
                      <p>• <strong>বোর্ডিং পয়েন্ট:</strong> {scanResult.buffer_guidance.rajshahi_boarding_points.join(', ')}</p>
                    </div>
                  </div>

                  {/* Matched Trips from Rajshahi */}
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                      <span>ম্যাচিং রাজশাহী পয়েন্ট-টু-পয়েন্ট বাসসমূহ:</span>
                      <span className="text-[11px] font-normal text-slate-500">নো মিডওয়ে পিকআপ</span>
                    </h4>

                    <div className="space-y-2">
                      {scanResult.matched_trips.map((trip, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-900 dark:text-white">{trip.bus_name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${trip.bus_type === 'FEMALE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                                {trip.bus_type === 'FEMALE' ? 'ছাত্রী স্পেশাল' : 'মিক্সড'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {trip.route_name} • ছাড়ার সময়: <strong>{trip.departure_time}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">৳{trip.base_fare_bdt}</span>
                              <span className="text-[10px] text-slate-500 block">{trip.available_seats_count}টি সিট খালি</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsScannerOpen(false);
                                handleSend(`আমার প্রবেশপত্র যাচাই হয়েছে (${scanResult.university_code}, রোল ${scanResult.admission_roll})। ${trip.bus_name} বাসে সিট বুকিং সংক্রান্ত তথ্য চাই।`);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span>তথ্য জানুন</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
