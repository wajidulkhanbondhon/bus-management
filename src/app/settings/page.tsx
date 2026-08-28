import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppearanceSettingsClient } from '@/components/settings/appearance-settings-client';
import { PaymentLogosSettingsClient } from '@/components/settings/payment-logos-settings-client';
import { Settings, Sliders, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = [
    { id: '1', key: 'DEFAULT_SEAT_HOLD_MINUTES', value: '10', description: 'Counter seat hold duration before auto-release' },
    { id: '2', key: 'PRE_BOOKING_TIMER_MINUTES', value: '15', description: 'Online pre-booking payment countdown window' },
    { id: '3', key: 'STRICT_GENDER_VALIDATION', value: 'true', description: 'Prevent adjacent male-female bookings on female coaches' },
    { id: '4', key: 'MAX_STUDENT_DISCOUNT_PERCENT', value: '25', description: 'Maximum allowed discount rate for verified student admissions' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Configuration & Customization</Badge>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">DISPLAY & SYSTEM PREFERENCES</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          Settings & Customization
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Customize navigation font sizes, content reading scales, color themes, payment gateway brand logos, and view operational security policies.
        </p>
      </div>

      {/* Dynamic Payment & Bank Logos Manager */}
      <PaymentLogosSettingsClient />

      {/* Font & Appearance Customizer Client */}
      <AppearanceSettingsClient />

      {/* System Policies */}
      <Card>
        <CardHeader>
          <CardTitle>System Parameters & Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block">{s.key}</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block font-mono">{s.value}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Bangladesh Admission Season Policy Active:
            </span>
            <p className="text-blue-700 dark:text-blue-300">
              Timezone is locked to <span className="font-mono font-bold">Asia/Dhaka (UTC+6)</span>. Currency is locked to <span className="font-mono font-bold">BDT (৳)</span>. Concurrency hold TTL is active at 10 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
