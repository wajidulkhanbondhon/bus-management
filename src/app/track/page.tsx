'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Search, ArrowRight, Bus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TrackSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/track/${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">বুকিং স্ট্যাটাস ও টাইমার ট্র্যাক করুন</h1>
        <p className="text-xs text-slate-400">
          আপনার বুকিং রেফারেন্স কোড (যেমন: BK-20260827-10024) অথবা মোবাইল নম্বর প্রবেশ করান।
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                বুকিং নম্বর বা মোবাইল নম্বর
              </label>
              <Input
                type="text"
                placeholder="BK-20260827-XXXXX অথবা 017XXXXXXXX"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white font-mono text-sm placeholder:text-slate-500"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
            >
              <Search className="w-4 h-4 mr-1.5" />
              স্ট্যাটাস খুঁজুন
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
