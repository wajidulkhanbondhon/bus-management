'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────
//  Types
// ──────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

// ──────────────────────────────────────────
//  Context
// ──────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ──────────────────────────────────────────
//  Provider
// ──────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const duration = opts.duration ?? 4000;
    setToasts(prev => [...prev, { ...opts, id, duration }]);
    // Auto-dismiss
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((title: string, desc?: string) =>
    toast({ variant: 'success', title, description: desc }), [toast]);
  const error = useCallback((title: string, desc?: string) =>
    toast({ variant: 'error', title, description: desc }), [toast]);
  const warning = useCallback((title: string, desc?: string) =>
    toast({ variant: 'warning', title, description: desc }), [toast]);
  const info = useCallback((title: string, desc?: string) =>
    toast({ variant: 'info', title, description: desc }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ──────────────────────────────────────────
//  Per-toast item (with progress bar)
// ──────────────────────────────────────────
const variantStyles: Record<ToastVariant, {
  container: string;
  icon: React.ReactNode;
  bar: string;
}> = {
  success: {
    container: 'border-emerald-200 dark:border-emerald-700/50 bg-white dark:bg-slate-900',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    bar: 'bg-emerald-500',
  },
  error: {
    container: 'border-red-200 dark:border-red-700/50 bg-white dark:bg-slate-900',
    icon: <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
    bar: 'bg-red-500',
  },
  warning: {
    container: 'border-amber-200 dark:border-amber-700/50 bg-white dark:bg-slate-900',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    bar: 'bg-amber-500',
  },
  info: {
    container: 'border-blue-200 dark:border-blue-700/50 bg-white dark:bg-slate-900',
    icon: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
    bar: 'bg-blue-500',
  },
};

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const { container, icon, bar } = variantStyles[toast.variant];

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => dismiss(toast.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative w-full max-w-sm pointer-events-auto overflow-hidden',
        'rounded-xl border shadow-lg shadow-slate-900/10 dark:shadow-slate-950/40',
        'transition-all duration-300 ease-out',
        container,
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-2 opacity-0 scale-95'
      )}
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4 pr-10">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        aria-label="বন্ধ করুন"
        className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className={cn('h-0.5 w-full overflow-hidden', bar)}>
        <div
          className="h-full w-full origin-left"
          style={{
            animation: `atoms-toast-shrink ${toast.duration ?? 4000}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  Container (portal to body)
// ──────────────────────────────────────────
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>,
    document.body
  );
}
