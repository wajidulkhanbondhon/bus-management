import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { prisma } from '@/lib/db';
import { Settings, Save, ShieldAlert, Globe, Clock, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Configuration</Badge>
          <span className="text-xs font-mono text-slate-500">OFFICE ENVIRONMENT SETTINGS</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">System & Policy Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure default seat hold timeouts, currency parameters, gender validation rules, and operating cutoff hours.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Parameters & Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs font-bold text-blue-600 block">{s.key}</span>
                <span className="font-bold text-slate-900 text-sm block font-mono">{s.value}</span>
                <p className="text-[11px] text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
            <span className="font-bold">Bangladesh Admission Season Policy Active:</span>
            <p className="text-blue-700">
              Timezone is locked to <span className="font-mono font-bold">Asia/Dhaka (UTC+6)</span>. Currency is locked to <span className="font-mono font-bold">BDT (৳)</span>. Concurrency hold TTL is active at 10 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
