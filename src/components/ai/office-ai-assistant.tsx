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
  Layers,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';
import { AIAvatar } from './ai-avatar';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  confidence?: 'FACT' | 'CALCULATED' | 'ESTIMATE' | 'FORECAST' | 'RECOMMENDATION';
  dataCards?: Array<{ title: string; value: string; badge: string }>;
  toolsUsed?: string[];
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
}

export function OfficeAIAssistant() {
  const { language } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: language === 'bn'
        ? 'আসসালামু আলাইকুম! আমি **ATOMS অফিস এআই বিজনেস কো-পাইলট** 🏢। আজকের সেলস, ৩০ দিনের প্রফিট-মার্জিন, বাস বহর পারফরম্যান্স, বা ডে ক্লোজিং সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।'
        : 'Hello! I am the **ATOMS Office AI Business Copilot** 🏢. Ask about today sales, 30-day profit margins, bus rankings, or financial audits.',
      confidence: 'FACT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [actionConfirmModal, setActionConfirmModal] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { labelBn: '📊 আজকের সেলস দেখাও', labelEn: 'Show today sales', prompt: 'আজকে sales কত?' },
    { labelBn: '📈 গত ৩০ দিনের বিজনেস রিপোর্ট', labelEn: '30-day business report', prompt: 'গত ৩০ দিনের sales analyse করো' },
    { labelBn: '🚌 সবচেয়ে লাভজনক বাস কোনটি?', labelEn: 'Most profitable bus?', prompt: 'কোন bus সবচেয়ে বেশি লাভ করেছে?' },
    { labelBn: '💵 এই মাসের প্রফিট ও মার্জিন', labelEn: 'Profit and margin', prompt: 'এই মাসে profit কত এবং মার্জিন কত?' },
    { labelBn: '🧠 সমস্যা ও স্মার্ট ইনসাইটস', labelEn: 'Smart business insights', prompt: 'কোন সমস্যা বা ইনসাইট আছে?' }
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
          context: 'OFFICE_AI'
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        confidence: data.confidence,
        dataCards: data.data_cards,
        toolsUsed: data.tools_used,
        actionPreview: data.action_preview,
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

  const handleFeedback = async (msgId: string, isHelpful: boolean) => {
    setFeedbackGiven(prev => ({ ...prev, [msgId]: isHelpful ? 'up' : 'down' }));
    try {
      await fetch('http://127.0.0.1:8000/api/v1/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, is_helpful: isHelpful })
      });
    } catch (e) {
      console.warn('Failed to record feedback:', e);
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
      {/* Top Header (Light & Dark Dual Mode) */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent dark:from-indigo-950/60 dark:via-slate-900/80 dark:to-blue-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <AIAvatar variant="office" size="md" isThinking={isLoading} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'অফিস এআই বিজনেস কো-পাইলট' : 'Office AI Business Copilot'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 border border-blue-200 dark:border-indigo-400/30 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold">
                ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {language === 'bn' ? 'ডাটাবেজ ভিত্তিক লাইভ সেলস, প্রফিট-মার্জিন ও পরিচালনা অডিট' : 'Live Verified Financials, Fleet Profitability & Audit Engine'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero-Hallucination Safe
          </span>
        </div>
      </div>

      {/* Quick Prompts Bar (Light & Dark Dual Mode) */}
      <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-indigo-600/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-indigo-500/50 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            {language === 'bn' ? qp.labelBn : qp.labelEn}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
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
                    : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs backdrop-blur-md'
                }`}
              >
                {/* Confidence Badge for AI Responses */}
                {msg.sender === 'ai' && msg.confidence && (
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
                <div className="whitespace-pre-wrap font-sans space-y-1.5">
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
                      className="mt-1 text-xs font-black rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      কনফার্মেশন ও সম্পাদন করুন
                    </Button>
                  </div>
                )}
              </div>

              {/* Message Footer: Timestamp, Copy, Feedback */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-1">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          feedbackGiven[msg.id] === 'up' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          feedbackGiven[msg.id] === 'down' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs text-slate-500 dark:text-slate-300">
            <AIAvatar variant="office" size="sm" isThinking={true} />
            <div className="flex items-center gap-2.5 p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-indigo-500/30 shadow-md">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-cyan-400" />
              <span className="font-medium text-slate-700 dark:text-slate-200">ডাটাবেজ ও টুলস থেকে রিয়েল-টাইম তথ্য বিশ্লেষণ হচ্ছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar (Light & Dark Dual Mode) */}
      <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={language === 'bn' ? 'অফিস এআই-কে জিজ্ঞাসা করুন (e.g. আজকের সেলস কত?)...' : 'Ask Office AI...'}
          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-indigo-500/50 shadow-inner"
        />
        <Button
          variant="primary"
          onClick={() => handleSend()}
          disabled={isLoading || !inputPrompt.trim()}
          className="px-5 font-black rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Confirmation Modal */}
      {actionConfirmModal && (
        <Modal
          isOpen={!!actionConfirmModal}
          onClose={() => setActionConfirmModal(null)}
          title="অপারেশন কনফার্মেশন ও নিরাপত্তা অনুমোদন"
        >
          <div className="space-y-4 p-2 text-xs">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-500/40 space-y-2">
              <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">
                {actionConfirmModal.confirmation_prompt}
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {actionConfirmModal.impact}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setActionConfirmModal(null)}>
                বাতিল
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmAction} className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
                হ্যাঁ, নিশ্চিত করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
