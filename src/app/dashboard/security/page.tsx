'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Slash, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApp } from '@/lib/context';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  is_blocked: boolean;
  created_at: string;
  blocked_by: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string;
  severity: string;
  details: string;
  created_at: string;
}

export default function SecurityDashboardPage() {
  const { language } = useApp();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSecurityData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      const ipsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/security/blocked-ips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ipsRes.ok) {
        setBlockedIPs(await ipsRes.json());
      } else {
        setError('Failed to fetch IPs');
      }

      const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/security/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleUnblock = async (ip: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/security/unblock/${ip}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSecurityData();
      } else {
        alert('Failed to unblock IP');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            {language === 'bn' ? 'সিকিউরিটি ও ফায়ারওয়াল প্যানেল' : 'Security & Firewall Panel'}
          </h1>
          <p className="text-slate-500">
            {language === 'bn' ? 'সিস্টেমের ঝুঁকি এবং ব্লক করা আইপি পরিচালনা করুন' : 'Manage system threats and blocked IPs'}
          </p>
        </div>
        <button 
          onClick={fetchSecurityData}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked IPs */}
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600">
            <Slash size={20} />
            {language === 'bn' ? 'ব্লক করা আইপি সমূহ (ফায়ারওয়াল)' : 'Blocked IPs (Firewall)'}
          </h2>
          <div className="space-y-3">
            {blockedIPs.filter(ip => ip.is_blocked).map((ip) => (
              <div key={ip.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-mono font-bold">{ip.ip_address}</div>
                  <div className="text-xs text-slate-500">{ip.reason} (By: {ip.blocked_by})</div>
                </div>
                <button 
                  onClick={() => handleUnblock(ip.ip_address)}
                  className="bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold rounded-lg hover:bg-emerald-200"
                >
                  Unblock
                </button>
              </div>
            ))}
            {blockedIPs.filter(ip => ip.is_blocked).length === 0 && (
              <div className="text-center p-8 text-slate-400">
                <ShieldCheck size={48} className="mx-auto mb-2 opacity-50" />
                No active blocks
              </div>
            )}
          </div>
        </div>

        {/* Security Events */}
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-600">
            <Activity size={20} />
            {language === 'bn' ? 'রিয়েল-টাইম থ্রেট লগ' : 'Real-time Threat Logs'}
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {events.map((event) => (
              <div key={event.id} className="p-3 bg-slate-50 border rounded-lg border-l-4" 
                   style={{ borderLeftColor: event.severity === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm flex items-center gap-1">
                    {event.severity === 'HIGH' && <AlertTriangle size={14} className="text-red-500" />}
                    {event.event_type}
                  </div>
                  <div className="text-xs text-slate-400">{new Date(event.created_at).toLocaleTimeString()}</div>
                </div>
                <div className="text-xs text-slate-600 mt-1">IP: {event.ip_address}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{event.details}</div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center p-8 text-slate-400">
                <ShieldCheck size={48} className="mx-auto mb-2 opacity-50" />
                No threats detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
