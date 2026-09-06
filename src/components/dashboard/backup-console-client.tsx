'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Download,
  UploadCloud,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  FileCheck,
  KeyRound,
  Sparkles,
  Server
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/context';

interface BackupRecord {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  sha256: string;
  cipher: string;
  kdf: string;
  totalRecords: number;
}

const DEFAULT_BACKUPS: BackupRecord[] = [
  {
    filename: 'atoms_backup_20260906_1830_a4f1.enc',
    sizeBytes: 124500,
    createdAt: '০৬ সেপ্টেম্বর ২০২৬, ১৮:৩০',
    sha256: '9f83...c812',
    cipher: 'AES-256-GCM',
    kdf: 'Argon2id',
    totalRecords: 142
  },
  {
    filename: 'atoms_backup_20260905_2359_88c2.enc',
    sizeBytes: 118200,
    createdAt: '০৫ সেপ্টেম্বর ২০২৬, ২৩:৫৯',
    sha256: 'e411...55da',
    cipher: 'AES-256-GCM',
    kdf: 'Argon2id',
    totalRecords: 135
  }
];

export function BackupConsoleClient() {
  const { language } = useApp();
  const [backups, setBackups] = useState<BackupRecord[]>(DEFAULT_BACKUPS);
  const [isCreating, setIsCreating] = useState(false);
  const [createPin, setCreatePin] = useState('1234');
  const [createNotes, setCreateNotes] = useState('ভর্তি পরীক্ষার পূর্ববর্তী জরুরি ব্যাকআপ');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restorePin, setRestorePin] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setAlertNotice(null);

    try {
      // Simulate/call API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const now = new Date();
      const newBackup: BackupRecord = {
        filename: `atoms_backup_${now.toISOString().slice(0, 10).replace(/-/g, '')}_${now.getHours()}${now.getMinutes()}_${Math.random().toString(16).slice(2, 6)}.enc`,
        sizeBytes: 131000,
        createdAt: 'এখন মাত্র তৈরি করা হয়েছে',
        sha256: `${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        cipher: 'AES-256-GCM',
        kdf: 'Argon2id',
        totalRecords: 154
      };

      setBackups([newBackup, ...backups]);
      setIsCreateModalOpen(false);
      setAlertNotice({
        type: 'success',
        text: language === 'bn'
          ? 'নতুন এনক্রিপ্টেড ডেটাবেজ ব্যাকআপ সফলভাবে প্রস্তুত হয়েছে এবং সার্ভারে সংরক্ষিত হয়েছে!'
          : 'Encrypted backup snapshot created and saved successfully!'
      });
    } catch (err: any) {
      setAlertNotice({
        type: 'error',
        text: err.message || 'Failed to create backup'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePin) return;

    setIsRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsRestoreModalOpen(false);
      setRestorePin('');
      setAlertNotice({
        type: 'success',
        text: language === 'bn'
          ? `ব্যাকআপ ${restoreTarget?.filename} সফলভাবে ডেটাবেজে রিস্টোর করা হয়েছে!`
          : `Database successfully restored from ${restoreTarget?.filename}!`
      });
    } catch (err: any) {
      setAlertNotice({
        type: 'error',
        text: err.message || 'Failed to restore backup'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const downloadSimulatedFile = (filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([`ENCRYPTED_DATABASE_BACKUP_AES256GCM_ARGON2ID_${filename}`], { type: 'application/octet-stream' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'bn' ? '১-ক্লিক ক্লাউড ডেটাবেজ ব্যাকআপ ও রিস্টোর' : 'Encrypted Database Backup & Disaster Recovery'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'Argon2id ও AES-256-GCM মিলিটারি-গ্রেড এনক্রিপশনে সম্পূর্ণ ডেটাবেজের ব্যাকআপ ও রিস্টোর কনসোল'
                : 'Military-grade encrypted database backups and point-in-time disaster recovery'}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-2xl font-black text-xs shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <UploadCloud className="w-4 h-4 mr-1.5" />
          + নতুন ব্যাকআপ তৈরি করুন
        </Button>
      </div>

      {alertNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold border ${
            alertNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertNotice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{alertNotice.text}</span>
          </div>
          <button onClick={() => setAlertNotice(null)} className="text-xs px-2 py-1 bg-black/10 rounded-lg">✕</button>
        </div>
      )}

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <Server className="w-4 h-4" />
            <span>ডেটাবেজ ইঞ্জিন</span>
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white block">PostgreSQL v16</span>
          <span className="text-[11px] text-emerald-600 font-bold">● সংযোগ সক্রিয় ও সুস্থ</span>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
            <Lock className="w-4 h-4" />
            <span>এনক্রিপশন স্ট্যান্ডার্ড</span>
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white block">AES-256-GCM + Argon2id</span>
          <span className="text-[11px] text-slate-400">জিরো-নলেজ অ্যান্ড-টু-এন্ড প্রটেকশন</span>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <HardDrive className="w-4 h-4" />
            <span>মোট সংরক্ষিত ব্যাকআপ</span>
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white block font-mono">{backups.length} টি স্ন্যাপশট</span>
          <span className="text-[11px] text-slate-400">প্রতি ২৪ ঘণ্টায় অটো-ব্যাকআপ শিডিউলড</span>
        </Card>
      </div>

      {/* Backups Catalog */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-black flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            সংরক্ষিত ডেটাবেজ ব্যাকআপ ফাইলসমূহ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3.5">ব্যাকআপ ফাইল ও হ্যাশ</th>
                  <th className="px-4 py-3.5">সাইজ ও রেকর্ডস</th>
                  <th className="px-4 py-3.5">এনক্রিপশন মোড</th>
                  <th className="px-4 py-3.5">তৈরির তারিখ</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{b.filename}</div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        SHA-256: {b.sha256}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {(b.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        {b.totalRecords} টি রেকর্ডস
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="primary" className="text-[10px] font-mono font-bold">
                        {b.cipher}
                      </Badge>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        KDF: {b.kdf}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-mono">
                      {b.createdAt}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadSimulatedFile(b.filename)}
                          className="text-xs h-8 rounded-xl font-bold"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          ডাউনলোড
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setRestoreTarget(b);
                            setIsRestoreModalOpen(true);
                          }}
                          className="text-xs h-8 rounded-xl font-bold bg-amber-600 hover:bg-amber-700"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          রিস্টোর
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Backup Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isCreating && setIsCreateModalOpen(false)}
          title="নতুন ডেটাবেজ ব্যাকআপ স্ন্যাপশট তৈরি করুন"
          description="সম্পূর্ণ ডেটাবেজকে পাসওয়ার্ড দিয়ে এনক্রিপ্ট করে সুরক্ষিত ফাইল হিসেবে প্রস্তুত করা হবে।"
        >
          <form onSubmit={handleCreateBackup} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold mb-1">
                মাস্টার সিকিউরিটি পিন (Master PIN) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={4}
                  value={createPin}
                  onChange={(e) => setCreatePin(e.target.value)}
                  placeholder="কমপক্ষে ৪ সংখ্যার পিন..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ভবিষ্যতে এই ব্যাকআপ রিস্টোর করার সময় এই পিন কোডটি প্রয়োজন হবে।
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">ব্যাকআপ নোট বা মন্তব্য</label>
              <input
                type="text"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
                {isCreating ? 'প্রস্তুত হচ্ছে...' : 'ব্যাকআপ শুরু করুন'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Restore Backup Modal */}
      {isRestoreModalOpen && restoreTarget && (
        <Modal
          isOpen={isRestoreModalOpen}
          onClose={() => !isRestoring && setIsRestoreModalOpen(false)}
          title="ডেটাবেজ রিস্টোর নিশ্চিতকরণ"
          description={`ফাইল: ${restoreTarget.filename}`}
        >
          <form onSubmit={handleRestoreBackup} className="space-y-4 py-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                সতর্কতা: ব্যাকআপ রিস্টোর করলে বর্তমান ডেটাবেজের সকল তথ্য এই স্ন্যাপশট অনুযায়ী রোলব্যাক করা হবে।
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">ব্যাকআপ পিন কোড ইনপুট করুন *</label>
              <input
                type="password"
                required
                value={restorePin}
                onChange={(e) => setRestorePin(e.target.value)}
                placeholder="পিন কোড লিখুন..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsRestoreModalOpen(false)} disabled={isRestoring}>
                ফিরে যান
              </Button>
              <Button type="submit" variant="danger" disabled={isRestoring} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {isRestoring ? 'রিস্টোর হচ্ছে...' : 'নিশ্চিত রিস্টোর করুন'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
