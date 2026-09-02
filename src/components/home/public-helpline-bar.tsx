'use client';

import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useApp } from '@/lib/context';

export function OfficialWhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.1-.476-.15-.676.15-.2.3-.776.98-.952 1.18-.176.2-.352.225-.653.075-.3-.15-1.267-.467-2.414-1.49-1.025-.913-1.718-2.04-1.92-2.385-.2-.345-.022-.532.128-.681.136-.134.3-.345.45-.52.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-1.002-2.23-.275-.584-.555-.505-.75-.515-.195-.01-.42-.01-.645-.01-.225 0-.59.085-.9.425-.31.34-1.184 1.157-1.184 2.822 0 1.665 1.213 3.274 1.383 3.5.17.225 2.387 3.645 5.782 5.112.808.349 1.439.557 1.93.714.812.258 1.551.222 2.136.135.651-.098 2.003-.82 2.284-1.61.282-.79.282-1.468.198-1.61-.085-.143-.285-.225-.586-.375zM12.04 2C6.545 2 2.08 6.464 2.08 11.958c0 1.986.58 3.843 1.583 5.409L2 22l4.786-1.571c1.516.924 3.29 1.448 5.254 1.448 5.495 0 9.96-4.464 9.96-9.958C22 6.464 17.535 2 12.04 2z" />
    </svg>
  );
}

export function PublicHelplineBar() {
  const { language, t } = useApp();

  return (
    <section className="py-8 border-t border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-transparent transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-5 py-2.5 rounded-full text-sm font-bold shadow-xs">
            <PhoneCall className="w-4 h-4 animate-pulse text-emerald-600 dark:text-emerald-400" />
            {t.landingHelpline || 'হেল্পলাইন: 01711-000001'}
          </div>
          <a
            href="https://wa.me/8801711000001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/60 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors shadow-xs cursor-pointer"
          >
            <OfficialWhatsAppIcon className="w-4 h-4" />
            {language === 'bn' ? 'WhatsApp-এ সহায়তা নিন' : 'WhatsApp Support'}
          </a>
        </div>
      </div>
    </section>
  );
}
