'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  // `mounted` guards against server/client mismatch — createPortal needs the DOM
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus management + Escape + scroll lock while open
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus into the dialog (close button is the first focusable element).
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      // Trap focus within the dialog
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that opened the modal
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  // Only render in the browser (avoids SSR/hydration mismatch entirely)
  if (!mounted || !isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'w-full',
    full: 'w-full',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'atoms-fade-in 0.2s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      {/* Glassmorphism backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative w-full flex flex-col max-h-[90vh] z-10',
          'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
          'rounded-2xl shadow-2xl',
          'border border-white/20 dark:border-slate-700/50',
          'ring-1 ring-slate-900/5 dark:ring-white/5',
          sizeClasses[size]
        )}
        style={{ animation: 'atoms-slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Top gradient accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.5), transparent)' }}
        />

        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-4 border-b border-slate-100/80 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/60 dark:bg-slate-800/40 rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="মোডাল বন্ধ করুন"
              className="p-1.5 rounded-lg transition-all duration-150 flex-shrink-0 mt-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer slot */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
