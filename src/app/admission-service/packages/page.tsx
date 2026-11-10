'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import type { AdmissionFeePreset } from '@/types/admission';

export default function AdmissionPackagesPage() {
  const [presets, setPresets] = useState<AdmissionFeePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdmissionFeePreset | null>(null);

  const [universityName, setUniversityName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [govtFee, setGovtFee] = useState('1000');
  const [serviceCharge, setServiceCharge] = useState('100');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPresets = async () => {
    setLoading(true);
    const res = await fastApiClient.getAdmissionPresets(true);
    if (res.success && Array.isArray(res.data)) {
      setPresets(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setUniversityName('');
    setUnitName('');
    setGovtFee('1000');
    setServiceCharge('100');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (p: AdmissionFeePreset) => {
    setEditing(p);
    setUniversityName(p.university_name);
    setUnitName(p.unit_name);
    setGovtFee(String(p.default_govt_fee));
    setServiceCharge(String(p.default_service_charge));
    setNotes(p.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityName.trim() || !unitName.trim()) return;
    setSaving(true);
    const payload = {
      university_name: universityName.trim(),
      unit_name: unitName.trim(),
      default_govt_fee: Number(govtFee) || 0,
      default_service_charge: Number(serviceCharge) || 0,
      notes: notes.trim() || undefined,
    };

    const res = editing
      ? await fastApiClient.updateAdmissionPreset(editing.id, payload)
      : await fastApiClient.createAdmissionPreset(payload);
    setSaving(false);

    if (res.success) {
      setModalOpen(false);
      loadPresets();
    }
  };

  const toggleActive = async (p: AdmissionFeePreset) => {
    const res = await fastApiClient.updateAdmissionPreset(p.id, { is_active: !p.is_active });
    if (res.success) loadPresets();
  };

  const handleDelete = async (id: string) => {
    const res = await fastApiClient.deleteAdmissionPreset(id);
    if (res.success) loadPresets();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              বিশ্ববিদ্যালয় ও ফরম ফি প্রিসেট সেটআপ
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              কোন বিশ্ববিদ্যালয়ের কোন ইউনিটে কত সরকারি ফি ও সার্ভিস চার্জ তা এখানে সেট করে রাখুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admission-service/new">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              ফরম কাউন্টার
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={openCreate} className="rounded-xl font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            নতুন প্রিসেট যোগ করুন
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>সকল বিশ্ববিদ্যালয় ও ইউনিট তালিকা ({presets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">বিশ্ববিদ্যালয়</th>
                  <th className="px-5 py-3">ইউনিট / বিভাগ</th>
                  <th className="px-5 py-3 text-right">সরকারি ফি</th>
                  <th className="px-5 py-3 text-right">সার্ভিস চার্জ</th>
                  <th className="px-5 py-3 text-right">মোট</th>
                  <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                  <th className="px-5 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {presets.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{p.university_name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.unit_name}</td>
                    <td className="px-5 py-3 text-right font-mono">{formatCurrency(p.default_govt_fee)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(p.default_service_charge)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-black">
                      {formatCurrency(Number(p.default_govt_fee) + Number(p.default_service_charge))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button type="button" onClick={() => toggleActive(p)}>
                        <Badge variant={p.is_active ? 'success' : 'secondary'}>
                          {p.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> চালু
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> বন্ধ
                            </>
                          )}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="rounded-lg px-2 py-1">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'ফি প্রিসেট আপডেট করুন' : 'নতুন বিশ্ববিদ্যালয় ফি প্রিসেট'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="বিশ্ববিদ্যালয়ের নাম *"
            placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় (DU)"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            required
          />
          <Input
            label="ইউনিট / বিভাগ *"
            placeholder="যেমন: A ইউনিট (বিজ্ঞান)"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="সরকারি আবেদন ফি (৳)"
              type="number"
              min={0}
              value={govtFee}
              onChange={(e) => setGovtFee(e.target.value)}
            />
            <Input
              label="আমাদের সার্ভিস চার্জ (৳)"
              type="number"
              min={0}
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
            />
          </div>
          <Input
            label="নোট (ঐচ্ছিক)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              বাতিল
            </Button>
            <Button type="submit" variant="primary" disabled={saving} className="rounded-xl font-bold">
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

