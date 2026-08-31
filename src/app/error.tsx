'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>

        {/* Text */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            কিছু একটা ভুল হয়েছে!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            এই পেজটি লোড করতে সমস্যা হচ্ছে। দয়া করে আবার চেষ্টা করুন অথবা হোম পেজে ফিরে যান।
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-left text-rose-600 dark:text-rose-400 overflow-auto max-h-32 font-mono">
              {error.message}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            আবার চেষ্টা করুন
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            হোম পেজ
          </a>
        </div>

        {/* Digest */}
        {error?.digest && (
          <p className="text-[10px] text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
