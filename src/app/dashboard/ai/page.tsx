'use client';

import React, { useEffect, useState } from 'react';
import { fastApiClient } from '@/lib/api-client';
import { Bot, ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, Search, BookOpen } from 'lucide-react';

export default function AiDashboardPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, eventsRes, blockedRes] = await Promise.all([
        fastApiClient.getAiRules(),
        fastApiClient.getSecurityEvents(),
        fastApiClient.getBlockedIps()
      ]);
      if (rulesRes.success) setRules(rulesRes.data || []);
      if (eventsRes.success) setEvents(eventsRes.data || []);
      if (blockedRes.success) setBlockedIps(blockedRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'block' | 'unblock') => {
    const res = action === 'block' 
      ? await fastApiClient.blockIp(id)
      : await fastApiClient.unblockIp(id);
      
    if (res.success) {
      fetchData();
    } else {
      alert(res.error || 'Failed to perform action');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading AI Data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Copilot & Security Dashboard</h1>
          <p className="text-slate-500">Manage autonomous learning rules and firewall security threats.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Security / Firewall Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Security Firewall & Warnings
            </h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              {blockedIps.filter(b => !b.is_blocked).length} Pending Warnings
            </span>
          </div>

          <div className="space-y-4">
            {blockedIps.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500">No security threats detected.</div>
            ) : (
              blockedIps.map(ip => (
                <div key={ip.id} className={`p-4 rounded-xl border ${ip.is_blocked ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{ip.ip_address}</span>
                        {!ip.is_blocked ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Warning Mode
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1 text-slate-600">{ip.reason}</p>
                      <div className="text-xs text-slate-400 mt-2">
                        Detected: {new Date(ip.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!ip.is_blocked && (
                        <button 
                          onClick={() => handleAction(ip.id, 'block')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Approve Block
                        </button>
                      )}
                      <button 
                        onClick={() => handleAction(ip.id, 'unblock')}
                        className="px-3 py-1.5 bg-white border hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        {ip.is_blocked ? 'Unblock IP' : 'Pardon / Ignore'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Rules Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Autonomous Data Learning
            </h2>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {rules.length} Insights Learned
            </span>
          </div>

          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500">No insights learned yet. AI scans every 4 hours.</div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="p-4 rounded-xl border bg-slate-50 border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Topic: {rule.topic_keywords}</h4>
                      <p className="text-sm mt-1 text-slate-600">{rule.content}</p>
                      <div className="flex gap-2 mt-3">
                        {rule.allowed_roles?.map((role: string) => (
                          <span key={role} className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
