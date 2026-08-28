'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  ShieldAlert,
  Server,
  FileJson,
  FileSpreadsheet,
  Layers,
  Archive,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fastApiClient } from '@/lib/api-client';
import { useApp } from '@/lib/context';

interface DbStats {
  success: boolean;
  database_type: string;
  timestamp: string;
  tables: Record<string, number>;
  total_records: number;
}

export function DatabaseBackupClient() {
  const { language } = useApp();
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fastApiClient.get<DbStats>('/api/v1/backup/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch database statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportJson = async () => {
    setExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fastApiClient.get<any>('/api/v1/backup/export');
      if (res.success && res.data) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(res.data, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `atoms-bus-backup-${timestamp}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setSuccessMessage(
          language === 'bn'
            ? 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!'
            : 'Complete database backup JSON exported and downloaded successfully!'
        );
      } else {
        setErrorMessage(res.error || 'Failed to export backup.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error exporting database.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(
      language === 'bn'
        ? 'সতর্কতা: ব্যাকআপ ফাইল ইমপোর্ট করলে নতুন ও বর্তমান ডেটা সিঙ্ক ও রিস্টোর হবে। আপনি কি নিশ্চিত?'
        : 'Warning: Importing will restore and synchronize database records from the backup file. Proceed?'
    )) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('atoms_access_token') : null;

      const response = await fetch(`${API_URL}/api/v1/backup/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setImportResult(result);
        setSuccessMessage(
          language === 'bn'
            ? `ডাটাবেজ সফলভাবে রিস্টোর হয়েছে! মোট ${result.total_restored}টি রেকর্ড প্রসেস করা হয়েছে।`
            : `Database successfully restored! Total ${result.total_restored} records processed.`
        );
        fetchStats();
      } else {
        setErrorMessage(result.detail || result.error || 'Import failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during import.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-transparent dark:from-slate-800/60 dark:via-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'ডাটাবেজ এক্সপোর্ট ও ইমপোর্ট (Backup & Migration)' : 'Database Backup & Hosting Migration'}
              </CardTitle>
              <Badge variant="primary" className="text-[10px] font-mono">
                {stats?.database_type || 'SQL DB'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'হোস্টিং পরিবর্তন বা ব্যাকআপের জন্য সম্পূর্ণ ডাটা ১-ক্লিকে এক্সপোর্ট ও যেকোনো সময় ইমপোর্ট করে রিস্টোর করুন'
                : 'Safely export all system data to JSON archives and restore seamlessly when switching hosting providers.'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="rounded-xl gap-1.5 font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh Stats'}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Alerts */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Table Records Breakdown Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              {language === 'bn' ? 'ডাটাবেজের বর্তমান টেবিল ও রেকর্ড সংখ্যা' : 'Current Database Records by Table'}
            </span>
            <span className="font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {stats ? `মোট রেকর্ড: ${stats.total_records.toLocaleString()}` : 'গণনা হচ্ছে...'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats?.tables &&
              Object.entries(stats.tables).map(([table, count]) => (
                <div
                  key={table}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                >
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate uppercase">
                    {table.replace(/_/g, ' ')}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Action Cards: 1-Click Export & 1-Click Import */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Export Card */}
          <div className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ এক্সপোর্ট' : 'Export Full JSON Backup'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'bn' ? 'সকল বাস, ট্রিপ, টিকিট ও বুকিং ডেটা' : 'All fleets, trips, seats & payments'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? 'একটি সম্পূর্ণ .json ব্যাকআপ ফাইল তৈরি হবে যা যেকোনো সময় রিস্টোর বা নতুন সার্ভারে মাইগ্রেশন করতে ব্যবহার করা যাবে।'
                : 'Generates a structured JSON archive of all relational tables ready for disaster recovery or migration.'}
            </p>

            <Button
              onClick={handleExportJson}
              disabled={exporting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl gap-2 shadow-md shadow-indigo-600/20"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
              <span>
                {exporting
                  ? (language === 'bn' ? 'এক্সপোর্ট হচ্ছে...' : 'Exporting Backup...')
                  : (language === 'bn' ? 'ব্যাকআপ ডাউনলোড করুন (.json)' : 'Download Full Backup (.json)')}
              </span>
            </Button>
          </div>

          {/* Import Card */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ব্যাকআপ ফাইল থেকে রিস্টোর / ইমপোর্ট' : 'Restore from Backup Archive'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'bn' ? 'অন্য হোস্টিং থেকে ডাটা প্রতিস্থাপন' : 'Restore database state instantly'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? 'পূর্বে ডাউনলোড করা .json ব্যাকআপ ফাইল আপলোড করুন। এটি স্বয়ংক্রিয়ভাবে ডাটাবেজের সাথে সিঙ্ক করে ডেটা পুনরুদ্ধার করবে।'
                : 'Upload a previously exported .json backup file to restore table structures, users, buses, trips and bookings.'}
            </p>

            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={importing}
                className="hidden"
                id="backup-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                disabled={importing}
                onClick={() => document.getElementById('backup-file-upload')?.click()}
                className="w-full border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-black rounded-xl gap-2 cursor-pointer"
              >
                <Upload className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                <span>
                  {importing
                    ? (language === 'bn' ? 'রিস্টোর হচ্ছে...' : 'Restoring Database...')
                    : (language === 'bn' ? 'ব্যাকআপ ফাইল আপলোড ও রিস্টোর' : 'Upload & Restore Backup (.json)')}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Migration Best Practices Callout */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
          <Server className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">
              {language === 'bn' ? 'হোস্টিং পরিবর্তনের নিয়মাবলী (Hosting Migration Guide)' : 'Zero Data-Loss Migration Guide'}
            </span>
            <p>
              {language === 'bn'
                ? '১) বর্তমান হোস্টিং থেকে "Download Full Backup" বাটনে ক্লিক করে ফাইলটি সংরক্ষণ করুন। ২) নতুন হোস্টিংয়ে প্রজেক্ট রান করে "Upload & Restore" বাটনে ফাইলটি আপলোড করলেই পূর্বের সমস্ত ডাটা হুবহু ফিরে পাবেন।'
                : '1) Export full backup before initiating server migration. 2) Start clean application on new hosting and upload the exported JSON archive to restore complete operational records.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
