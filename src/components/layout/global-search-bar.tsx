'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bus,
  Ticket,
  CalendarDays,
  User,
  CreditCard,
  X,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { searchGlobalAction } from '@/actions/search.actions';
import { GlobalSearchResult } from '@/services/search.service';
import { useApp } from '@/lib/context';
import { Badge } from '@/components/ui/badge';

export function GlobalSearchBar() {
  const router = useRouter();
  const { t, language } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult>({
    buses: [],
    bookings: [],
    trips: [],
    students: [],
    payments: []
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchContainerRef.current?.querySelector('input');
        input?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ buses: [], bookings: [], trips: [], students: [], payments: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      const res = await searchGlobalAction(query);
      setResults(res);
      setIsLoading(false);
      setIsOpen(true);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  const totalResults =
    results.buses.length +
    results.bookings.length +
    results.trips.length +
    results.students.length +
    results.payments.length;

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  return (
    <div ref={searchContainerRef} className="relative flex-1 max-w-lg mx-4">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9.5 pr-18 py-1.5 bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 shadow-2xs">
              Ctrl+K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
          {totalResults === 0 && !isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.noResultsFound} &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {/* Buses Section */}
              {results.buses.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <Bus className="w-3 h-3 text-purple-500" />
                    <span>{language === 'bn' ? 'বাস সমূহ' : 'Buses'}</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {results.buses.map((bus) => (
                      <button
                        key={bus.id}
                        onClick={() => handleSelect(bus.url)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {bus.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{bus.subtitle}</div>
                        </div>
                        <Badge variant="primary">{bus.badge}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings Section */}
              {results.bookings.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <Ticket className="w-3 h-3 text-blue-500" />
                    <span>{language === 'bn' ? 'বুকিং ও টিকিট' : 'Bookings & Tickets'}</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {results.bookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => handleSelect(booking.url)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {booking.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{booking.subtitle}</div>
                        </div>
                        <Badge variant={booking.badge === 'CONFIRMED' ? 'success' : 'warning'}>{booking.badge}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trips Section */}
              {results.trips.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <CalendarDays className="w-3 h-3 text-emerald-500" />
                    <span>{language === 'bn' ? 'ট্রিপ শিডিউল' : 'Trips'}</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {results.trips.map((trip) => (
                      <button
                        key={trip.id}
                        onClick={() => handleSelect(trip.url)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {trip.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{trip.subtitle}</div>
                        </div>
                        <Badge variant="info">{trip.badge}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Section */}
              {results.students.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <User className="w-3 h-3 text-amber-500" />
                    <span>{language === 'bn' ? 'শিক্ষার্থী / যাত্রী' : 'Students & Passengers'}</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {results.students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelect(student.url)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {student.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{student.subtitle}</div>
                        </div>
                        <Badge variant="default">{student.badge}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Section */}
              {results.payments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <CreditCard className="w-3 h-3 text-rose-500" />
                    <span>{language === 'bn' ? 'পেমেন্ট ও রসিদ' : 'Payments & Receipts'}</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {results.payments.map((payment) => (
                      <button
                        key={payment.id}
                        onClick={() => handleSelect(payment.url)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {payment.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{payment.subtitle}</div>
                        </div>
                        <Badge variant="success">{payment.badge}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
