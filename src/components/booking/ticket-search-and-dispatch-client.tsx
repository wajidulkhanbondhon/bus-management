'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Ticket,
  Printer,
  FileText,
  Phone,
  User,
  Bus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaymentReceiptModal } from './payment-receipt';
import { OfficialWhatsAppIcon } from '@/components/passenger/passenger-portal-client';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface Props {
  initialBookings: any[];
}

export function TicketSearchAndDispatchClient({ initialBookings }: Props) {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<any | null>(null);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return initialBookings.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return initialBookings.filter((b) => {
      const bNum = (b.booking_number || b.bookingNumber || '').toLowerCase();
      const name = (b.contact_name || b.contactName || b.passengers?.[0]?.passenger_name || b.passengers?.[0]?.passengerName || '').toLowerCase();
      const phone = (b.contact_phone || b.contactPhone || b.passengers?.[0]?.passenger_phone || b.passengers?.[0]?.passengerPhone || '').toLowerCase();
      const bus = (b.trip?.bus?.busNumber || b.trip?.bus?.bus_number || '').toLowerCase();
      return bNum.includes(q) || name.includes(q) || phone.includes(q) || bus.includes(q);
    });
  }, [initialBookings, searchQuery]);

  const generateWhatsAppTicketUrl = (b: any) => {
    const phone = b.contact_phone || b.contactPhone || b.passengers?.[0]?.passenger_phone || b.passengers?.[0]?.passengerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;
    const bNum = b.booking_number || b.bookingNumber || 'BK';
    const name = b.contact_name || b.contactName || b.passengers?.[0]?.passenger_name || 'Passenger';
    const seats = (b.seats || []).map((s: any) => s.seat_number || s.seat?.seatNumber || s.seat_id).join(', ');
    const destination = b.trip?.targetUniversity || b.trip?.route?.destination || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
    const fare = b.net_amount || b.netAmount || 0;

    const message = `🚌 *অ্যাটমস ট্রানজিট - ভর্তি স্পেশাল টিকিট রসিদ*\n\n` +
      `আসসালামু আলাইকুম ${name},\n` +
      `আপনার বাস টিকিট সফলভাবে নিশ্চিত হয়েছে:\n\n` +
      `📌 *বুকিং নম্বর:* ${bNum}\n` +
      `📍 *গন্তব্য:* ${destination}\n` +
      `💺 *সিট:* ${seats}\n` +
      `💰 *মোট ভাড়া:* ৳${fare} (পরিশোধিত)\n\n` +
      `লাইভ টিকিট ও ট্র্যাকিং লিঙ্ক:\nhttps://atoms-transit.vercel.app/track/${encodeURIComponent(bNum)}\n\n` +
      `যাত্রা শুভ হোক!`;

    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400">
                Ticket Dispatch Console
              </span>
              <Badge variant="primary" className="text-[10px] font-bold">
                A4 & Thermal Print
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === 'bn' ? 'টিকিট অনুসন্ধান, রি-প্রিন্ট ও হোয়াটসঅ্যাপ প্রেরণ' : 'Ticket Search, Print & WhatsApp Dispatch'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/bookings/quick">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold">
              ⚡ {language === 'bn' ? 'কুইক বুকিং' : 'Quick Booking'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="w-6 h-6 text-blue-600 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder={language === 'bn' ? 'যাত্রীর ফোন নম্বর (017..), বুকিং আইডি (BK-..) বা নাম দিয়ে খুঁজুন...' : 'Search by phone number, booking number, or passenger name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-13 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-base font-bold text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              {language === 'bn' ? 'অনুসন্ধানের ফলাফল:' : 'Results Found:'}{' '}
              <strong className="text-slate-900 dark:text-white font-mono">{searchResults.length}</strong> টি টিকিট
            </span>
            <span className="font-mono text-[11px]">
              {language === 'bn' ? 'এক ক্লিকে WhatsApp মেসেজ ও সরাসরি A4 টিকিট' : '1-Click WhatsApp Dispatch & A4 Ticket Print'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Search Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {searchResults.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Ticket className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-base text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'কোনো টিকিট পাওয়া যায়নি' : 'No matching ticket records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'bn' ? 'সঠিক ফোন নম্বর বা বুকিং নম্বর দিয়ে পুনরায় চেষ্টা করুন।' : 'Try verifying the phone number or booking number.'}
            </p>
          </div>
        ) : (
          searchResults.map((b) => {
            const bNum = b.booking_number || b.bookingNumber || 'BK';
            const name = b.contact_name || b.contactName || b.passengers?.[0]?.passenger_name || b.passengers?.[0]?.passengerName || 'Passenger';
            const phone = b.contact_phone || b.contactPhone || b.passengers?.[0]?.passenger_phone || b.passengers?.[0]?.passengerPhone || '—';
            const busNum = b.trip?.bus?.busNumber || b.trip?.bus?.bus_number || 'COACH';
            const destination = b.trip?.targetUniversity || b.trip?.route?.destination || 'ভর্তি পরীক্ষা কেন্দ্র';
            const netAmt = b.net_amount ?? b.netAmount ?? 0;
            const dueAmt = b.due_amount ?? b.dueAmount ?? 0;
            const seats = (b.seats || []).map((s: any) => s.seat_number || s.seat?.seatNumber || s.seat_id).join(', ');

            return (
              <Card key={b.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="bg-slate-50/70 dark:bg-slate-850/50 p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-600" />
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">{bNum}</span>
                  </div>
                  <Badge variant={b.booking_status === 'CONFIRMED' ? 'success' : 'warning'} className="text-[10px] font-bold">
                    {b.booking_status || 'CONFIRMED'}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">{name}</h3>
                      <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white block leading-none">
                        {formatCurrency(netAmt)}
                      </span>
                      {dueAmt > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600">Due: {formatCurrency(dueAmt)}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600">✓ Paid</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5 font-medium">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>🚌 বাস ও রুট:</span>
                      <span className="font-bold">{busNum} ➔ {destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>💺 নির্বাচিত সিট:</span>
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">{seats || '—'}</span>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBookingForReceipt(b)}
                      className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
                      <span>{language === 'bn' ? 'রসিদ / প্রিন্ট' : 'Print'}</span>
                    </Button>

                    <a
                      href={generateWhatsAppTicketUrl(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <OfficialWhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <Link href={`/track/${encodeURIComponent(bNum)}`} className="col-span-2 sm:col-span-1">
                      <Button size="sm" variant="outline" className="w-full rounded-xl text-xs font-bold border-blue-200 text-blue-700 dark:text-blue-300 hover:bg-blue-50 cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        <span>A4 টিকিট</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Receipt Modal */}
      {selectedBookingForReceipt && (
        <PaymentReceiptModal
          isOpen={true}
          onClose={() => setSelectedBookingForReceipt(null)}
          booking={selectedBookingForReceipt}
          autoPrint={false}
        />
      )}
    </div>
  );
}
