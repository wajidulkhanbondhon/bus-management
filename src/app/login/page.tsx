'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, Lock, Mail, KeyRound, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loginAction } from '@/actions/auth.actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@transport.office');
  const [password, setPassword] = useState('admin1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const res = await loginAction(formData);
    if (res.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleAutofill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin1234');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-blue-500/30">
            A
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ATOMS Admission Transport</h1>
          <p className="text-xs text-slate-400">Internal Office & Terminal Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-800 shadow-2xl bg-slate-950/80 text-slate-200">
          <CardContent className="p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-300 font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Office Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
              >
                Sign In to Terminal Desk
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Autofill Credentials */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Quick Demo Role Sign-In (Password: admin1234)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill('admin@transport.office')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 transition-colors"
                >
                  <span className="font-bold block text-white">Super Admin</span>
                  <span className="text-[10px] text-slate-400">Director</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill('manager@transport.office')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 transition-colors"
                >
                  <span className="font-bold block text-white">Manager</span>
                  <span className="text-[10px] text-slate-400">Supervisor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill('staff@transport.office')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 transition-colors"
                >
                  <span className="font-bold block text-white">Booking Staff</span>
                  <span className="text-[10px] text-slate-400">Counter Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill('accountant@transport.office')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 transition-colors"
                >
                  <span className="font-bold block text-white">Accountant</span>
                  <span className="text-[10px] text-slate-400">Cashier</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
