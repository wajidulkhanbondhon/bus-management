'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Smartphone,
  KeyRound,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';
import Image from 'next/image';

export default function SecuritySettingsPage() {
  const { language } = useApp();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');

  const secretKey = 'JBSWY3DPEHPK3PXP';

  const handleEnable2FA = () => {
    setIsSetupModalOpen(true);
    setSetupStep(1);
    setVerificationCode('');
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      setIs2FAEnabled(true);
      setIsSetupModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Security Settings
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'অ্যাকাউন্ট সিকিউরিটি ও 2FA' : 'Account Security & 2FA'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'bn' ? 'আপনার অ্যাকাউন্টের নিরাপত্তা জোরদার করুন টু-ফ্যাক্টর অথেনটিকেশনের মাধ্যমে।' : 'Enhance your account security with Two-Factor Authentication.'}
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${is2FAEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Two-Factor Authentication (2FA)
                {is2FAEnabled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 uppercase text-[9px] px-2 py-0.5">Enabled</Badge>
                ) : (
                  <Badge className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 uppercase text-[9px] px-2 py-0.5">Disabled</Badge>
                )}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-lg">
                Add an extra layer of security to your account. Once enabled, you'll need to enter a time-based code from an authenticator app (like Google Authenticator or Authy) when signing in.
              </p>
            </div>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            {is2FAEnabled ? (
              <Button variant="outline" onClick={() => setIs2FAEnabled(false)} className="w-full md:w-auto border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20 font-bold">
                Disable 2FA
              </Button>
            ) : (
              <Button variant="primary" onClick={handleEnable2FA} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25">
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 opacity-60">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-slate-500 mt-1">Last changed 3 months ago. We recommend changing it every 6 months.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto font-bold">Update Password</Button>
        </div>
      </Card>

      {/* 2FA Setup Modal */}
      <Modal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} title="Setup Two-Factor Authentication" size="md">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-[300px] flex flex-col rounded-b-2xl">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 px-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${stepColor(setupStep, 1)}`}>1</div>
            <div className={`h-1 flex-1 mx-2 rounded-full ${setupStep >= 2 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${stepColor(setupStep, 2)}`}>2</div>
            <div className={`h-1 flex-1 mx-2 rounded-full ${setupStep >= 3 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${stepColor(setupStep, 3)}`}>3</div>
          </div>

          {setupStep === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Download an Authenticator App</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Download and install <strong className="text-slate-700 dark:text-slate-300">Google Authenticator</strong> or <strong className="text-slate-700 dark:text-slate-300">Authy</strong> on your mobile device.
              </p>
              <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={() => setSetupStep(2)}>Next Step</Button>
            </div>
          )}

          {setupStep === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Scan the QR Code</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Open your authenticator app and scan this QR code. If you can't scan it, you can enter the text code below manually.
              </p>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/ATOMS%20Transit:admin@atoms.com?secret=${secretKey}&issuer=ATOMS%20Transit`} 
                  alt="2FA QR Code" 
                  width={160}
                  height={160}
                  className="w-40 h-40" 
                />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg flex items-center justify-between w-full max-w-sm border border-slate-200 dark:border-slate-700">
                <code className="text-sm font-mono font-bold tracking-widest text-slate-700 dark:text-slate-300">{secretKey}</code>
                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setSetupStep(1)}>Back</Button>
                <Button variant="primary" className="flex-1 bg-blue-600 text-white font-bold" onClick={() => setSetupStep(3)}>Next Step</Button>
              </div>
            </div>
          )}

          {setupStep === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Verify Code</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Enter the 6-digit code generated by your authenticator app to confirm setup.
              </p>
              
              <input 
                type="text" 
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-48 text-center text-3xl tracking-[0.5em] font-mono font-bold bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-3 focus:outline-none focus:border-blue-500"
              />

              <div className="flex gap-3 w-full pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSetupStep(2)}>Back</Button>
                <Button 
                  variant="primary" 
                  disabled={verificationCode.length !== 6}
                  className="flex-1 bg-blue-600 text-white font-bold disabled:opacity-50" 
                  onClick={handleVerify}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function stepColor(current: number, step: number) {
  if (current > step) return 'bg-blue-500 text-white';
  if (current === step) return 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 dark:bg-blue-900/50';
  return 'bg-slate-200 text-slate-500 dark:bg-slate-800';
}
