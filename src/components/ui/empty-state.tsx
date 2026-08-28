'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-blue-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-inner ring-8 ring-blue-500/5">
        <Icon className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="sm" className="rounded-xl font-bold gap-2 shadow-md shadow-blue-500/20">
                <span>{actionLabel}</span>
              </Button>
            </a>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              className="rounded-xl font-bold gap-2 shadow-md shadow-blue-500/20"
            >
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
