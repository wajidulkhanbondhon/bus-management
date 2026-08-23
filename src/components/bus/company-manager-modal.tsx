'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveStoredCompanies } from '@/lib/company-storage';

interface CompanyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: string[];
  onUpdateCompanies: (updated: string[]) => void;
  language?: 'bn' | 'en';
}

export function CompanyManagerModal({
  isOpen,
  onClose,
  companies,
  onUpdateCompanies,
  language = 'bn'
}: CompanyManagerModalProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCompanyName.trim();
    if (!cleanName) return;

    if (companies.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
      setError(language === 'bn' ? 'এই কোম্পানির নাম ইতিমধ্যে তালিকায় রয়েছে!' : 'Company already exists!');
      return;
    }

    const updated = [...companies, cleanName];
    onUpdateCompanies(updated);
    saveStoredCompanies(updated);
    setNewCompanyName('');
    setError('');
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(companies[index]);
    setError('');
  };

  const handleSaveEdit = (index: number) => {
    const clean = editingText.trim();
    if (!clean) return;

    if (companies.some((c, i) => i !== index && c.toLowerCase() === clean.toLowerCase())) {
      setError(language === 'bn' ? 'এই নামের আরেকটি কোম্পানি ইতিমধ্যে রয়েছে!' : 'Another company has this name!');
      return;
    }

    const updated = [...companies];
    updated[index] = clean;
    onUpdateCompanies(updated);
    saveStoredCompanies(updated);
    setEditingIndex(null);
    setEditingText('');
    setError('');
  };

  const handleDelete = (index: number) => {
    if (companies.length <= 1) {
      setError(language === 'bn' ? 'কমপক্ষে একটি কোম্পানি তালিকায় থাকতে হবে।' : 'At least one company must remain.');
      return;
    }
    const updated = companies.filter((_, i) => i !== index);
    onUpdateCompanies(updated);
    saveStoredCompanies(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'বাস কোম্পানি ব্যবস্থাপনা (Add/Edit/Delete)' : 'Manage Transport Companies'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'কোম্পানি এন্ট্রি, এডিট ও ডিলিট করুন' : 'Add, edit or remove transport operators'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Company Form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {language === 'bn' ? '✨ নতুন কোম্পানির নাম যুক্ত করুন:' : 'Add New Company:'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: নাবিল পরিবহন, স্টার লাইন ইত্যাদি' : 'e.g. Nabil Paribahan, Star Line'}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="submit" variant="primary" size="sm" className="font-bold px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              {language === 'bn' ? 'যোগ করুন' : 'Add'}
            </Button>
          </div>
          {error && <p className="text-xs font-bold text-rose-600 animate-in fade-in">{error}</p>}
        </form>

        {/* Companies List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block pt-2">
            {language === 'bn' ? `বর্তমান কোম্পানির তালিকা (${companies.length}টি)` : `Current Companies (${companies.length})`}
          </span>

          {companies.map((comp, idx) => (
            <div key={idx} className="pt-2 flex items-center justify-between gap-2 group">
              {editingIndex === idx ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 text-slate-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(idx)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black font-mono text-slate-500 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {comp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title={language === 'bn' ? 'এডিট করুন' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold px-5">
            {language === 'bn' ? 'সম্পন্ন (Done)' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
