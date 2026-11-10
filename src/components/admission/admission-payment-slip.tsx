'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Printer, Scissors, GraduationCap, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { QRCodeView } from '@/components/common/qr-code';
import { BarcodeView } from '@/components/common/barcode';
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  OrganizationSettingsState,
  fetchOrganizationSettingsFromBackend,
  getStoredOrganizationSettings,
} from '@/services/settings-storage.service';
import {
  SHEET_ID,
  THERMAL_W_PX,
  ensureSheetPageSize,
  useSheetPageSize,
  useSheetViewZoom,
  useTicketFit,
  type PaperMode,
} from '@/lib/ticket-print';
import type { AdmissionOrder } from '@/types/admission';

interface AdmissionPaymentSlipProps {
  order: AdmissionOrder;
  initialPaperMode?: PaperMode;
}

const METHOD_LABEL: Record<string, string> = {
  HAND_CASH: 'নগদ (Cash)',
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
  BANK_TRANSFER: 'Bank Transfer',
};

function SlipHalf({
  order,
  copyType,
  orgName,
  orgPhone,
  orgAddress,
}: {
  order: AdmissionOrder;
  copyType: 'STUDENT' | 'OFFICE';
  orgName: string;
  orgPhone: string;
  orgAddress: string;
}) {
  const isStudent = copyType === 'STUDENT';
  const latestPayment = order.payments?.find((p) => p.payment_type !== 'REFUND') || order.payments?.[0];
  const methodLabel = latestPayment ? (METHOD_LABEL[latestPayment.method] || latestPayment.method) : 'নগদ / বকেয়া';

  const statusBadge =
    order.payment_status === 'PAID'
      ? { label: 'PAID / পরিশোধিত', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400' }
      : order.payment_status === 'PARTIAL'
      ? { label: 'PARTIAL / আংশিক', cls: 'bg-amber-100 text-amber-800 border-amber-400' }
      : order.payment_status === 'REFUNDED'
      ? { label: 'REFUNDED / ফেরত', cls: 'bg-purple-100 text-purple-800 border-purple-400' }
      : { label: 'DUE / বকেয়া', cls: 'bg-rose-100 text-rose-800 border-rose-400' };

  const qrPayload = `SLIP:${order.slip_number}|NAME:${order.student_name}|PHONE:${order.student_phone}|NET:${order.net_payable}|PAID:${order.paid_amount}|DUE:${order.due_amount}`;

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white text-slate-900">
      {/* Header Band */}
      <div
        className={`px-5 py-3 flex items-center justify-between border-b ${
          isStudent
            ? 'bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white border-indigo-800'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight leading-tight">{orgName}</div>
            <div className="text-[10px] text-white/80 font-medium">
              ভর্তি ফরম সার্ভিস ও পেমেন্ট স্লিপ {orgPhone ? `• ${orgPhone}` : ''}
            </div>
            {orgAddress && <div className="text-[9.5px] text-white/70">{orgAddress}</div>}
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
              isStudent ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-900'
            }`}
          >
            {isStudent ? 'STUDENT PAYMENT COPY' : 'OFFICE RECORD COPY'}
          </span>
          <div className="font-mono text-xs font-black mt-1">{order.slip_number}</div>
          <div className="text-[10px] text-white/80 font-mono">{formatDateTime(order.created_at)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Student & Status Strip */}
        <div className="grid grid-cols-12 gap-3 items-start bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="col-span-8 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div>
              <span className="text-slate-500 font-semibold">শিক্ষার্থীর নাম: </span>
              <span className="font-black text-slate-900">{order.student_name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">মোবাইল: </span>
              <span className="font-mono font-bold text-slate-900">{order.student_phone}</span>
            </div>
            {(order.hsc_roll || order.ssc_roll) && (
              <div>
                <span className="text-slate-500 font-semibold">রোল (HSC/SSC): </span>
                <span className="font-mono font-bold">
                  {order.hsc_roll || '—'} / {order.ssc_roll || '—'}
                </span>
              </div>
            )}
            {(order.hsc_board || order.hsc_year) && (
              <div>
                <span className="text-slate-500 font-semibold">বোর্ড ও সাল: </span>
                <span className="font-semibold">
                  {order.hsc_board || '—'} {order.hsc_year ? `(${order.hsc_year})` : ''}
                </span>
              </div>
            )}
            {order.guardian_phone && (
              <div>
                <span className="text-slate-500 font-semibold">অভিভাবক: </span>
                <span className="font-mono">{order.guardian_phone}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 font-semibold">পেমেন্ট মাধ্যম: </span>
              <span className="font-bold">{methodLabel}</span>
            </div>
          </div>

          <div className="col-span-4 flex items-center justify-end gap-3">
            <div className="text-right space-y-1">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded border ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
              <div className="text-[10px] text-slate-500 font-mono">
                মোট ফরম: <strong className="text-slate-900">{order.items.length} টি</strong>
              </div>
            </div>
            <QRCodeView value={qrPayload} size={52} includeMargin={false} />
          </div>
        </div>

        {/* Forms Table */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
              <th className="py-1.5 px-2 text-left font-bold w-7">#</th>
              <th className="py-1.5 px-2 text-left font-bold">বিশ্ববিদ্যালয় (University)</th>
              <th className="py-1.5 px-2 text-left font-bold">ইউনিট / বিভাগ</th>
              <th className="py-1.5 px-2 text-right font-bold">ভর্তি ফি</th>
              <th className="py-1.5 px-2 text-right font-bold">সার্ভিস চার্জ</th>
              <th className="py-1.5 px-2 text-right font-bold">মোট</th>
              {!isStudent && <th className="py-1.5 px-2 text-center font-bold">স্ট্যাটাস</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-1.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                <td className="py-1.5 px-2 font-bold text-slate-900">{item.university_name}</td>
                <td className="py-1.5 px-2 text-slate-700">{item.unit_name}</td>
                <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.govt_fee)}</td>
                <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.service_charge)}</td>
                <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(item.subtotal)}
                </td>
                {!isStudent && (
                  <td className="py-1.5 px-2 text-center font-mono text-[10px]">
                    {item.application_status}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Signature Footer */}
        <div className="grid grid-cols-12 gap-3 pt-2 border-t border-slate-200 items-end">
          <div className="col-span-7 space-y-1.5">
            {order.notes && (
              <p className="text-[10px] text-slate-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                <strong>নোট:</strong> {order.notes}
              </p>
            )}
            <p className="text-[9.5px] text-slate-500 leading-snug">
              * বিঃদ্রঃ আবেদন সম্পন্ন হওয়ার পর এসএমএস বা কাউন্টার থেকে ইউজার আইডি ও পাসওয়ার্ড সংগ্রহ করুন। স্লিপটি সংরক্ষণ করুন।
            </p>
            <div className="flex items-center justify-between pt-3 pr-6">
              <div className="text-center">
                <div className="w-28 border-t border-slate-400 pt-0.5 text-[9.5px] font-semibold text-slate-600">
                  শিক্ষার্থীর স্বাক্ষর
                </div>
              </div>
              <div className="text-center">
                <div className="w-28 border-t border-slate-400 pt-0.5 text-[9.5px] font-semibold text-slate-600">
                  কাউন্টার/অফিস স্বাক্ষর
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>মোট বিশ্ববিদ্যালয় ফি:</span>
              <span className="font-mono font-semibold">{formatCurrency(order.total_govt_fee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>মোট সার্ভিস চার্জ:</span>
              <span className="font-mono font-semibold">{formatCurrency(order.total_service_charge)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>ছাড় (Discount):</span>
                <span className="font-mono font-semibold">-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-900 border-t border-slate-300 pt-1">
              <span>সর্বমোট প্রদেয় (Net):</span>
              <span className="font-mono">{formatCurrency(order.net_payable)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>জমা (Paid):</span>
              <span className="font-mono">{formatCurrency(order.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-black text-rose-600">
              <span>বকেয়া (Due):</span>
              <span className="font-mono">{formatCurrency(order.due_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdmissionPaymentSlip({ order, initialPaperMode = 'STANDARD_A4' }: AdmissionPaymentSlipProps) {
  const [paperMode, setPaperMode] = useState<PaperMode>(initialPaperMode);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettingsState>(DEFAULT_ORGANIZATION_SETTINGS);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrgSettings(getStoredOrganizationSettings());
    fetchOrganizationSettingsFromBackend().then((s) => {
      if (s) setOrgSettings(s);
    });
  }, []);

  useSheetPageSize(paperMode);
  useSheetViewZoom(viewportRef, 1.05);
  useTicketFit(canvasRef, paperMode === 'STANDARD_A4', [order.id, order.items.length, paperMode]);

  const orgName = orgSettings.organization?.name || 'ATOMS Admission Service';
  const orgPhone = orgSettings.organization?.phone || '';
  const orgAddress = orgSettings.organization?.address || '';

  const handlePrint = () => {
    ensureSheetPageSize(paperMode);
    setTimeout(() => window.print(), 80);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaperMode('STANDARD_A4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              paperMode === 'STANDARD_A4'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            A4 ডুয়াল কপি (Student + Office)
          </button>
          <button
            type="button"
            onClick={() => setPaperMode('THERMAL_80MM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              paperMode === 'THERMAL_80MM'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            80mm থার্মাল রিসিট
          </button>
        </div>

        <Button onClick={handlePrint} variant="primary" size="md" className="font-bold rounded-xl shadow-md">
          <Printer className="w-4 h-4 mr-2" />
          স্লিপ প্রিন্ট করুন
        </Button>
      </div>

      {/* Printable Area */}
      <div className="flex justify-center overflow-x-auto pb-2 ticket-print-outer">
        <div ref={viewportRef} className="ticket-sheet-viewport">
          <div
            ref={sheetRef}
            id={SHEET_ID}
            data-paper-mode={paperMode}
            className="printable-payment-receipt bg-white text-slate-900 shadow-xl rounded-xl border border-slate-200 mx-auto"
            style={
              paperMode === 'THERMAL_80MM'
                ? { width: THERMAL_W_PX, minHeight: 'auto', padding: '12px' }
                : undefined
            }
          >
            <div ref={canvasRef} className="ticket-canvas p-5">
              {paperMode === 'STANDARD_A4' ? (
                <div className="space-y-4">
                  {/* Top: Student Payment Copy */}
                  <SlipHalf
                    order={order}
                    copyType="STUDENT"
                    orgName={orgName}
                    orgPhone={orgPhone}
                    orgAddress={orgAddress}
                  />

                  {/* Cut Line */}
                  <div className="flex items-center gap-2 py-1 text-slate-400">
                    <Scissors className="w-4 h-4 shrink-0" />
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">
                      এখান থেকে কেটে শিক্ষার্থীকে পেমেন্ট কপি দিন (CUT HERE)
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                  </div>

                  {/* Bottom: Office Copy */}
                  <SlipHalf
                    order={order}
                    copyType="OFFICE"
                    orgName={orgName}
                    orgPhone={orgPhone}
                    orgAddress={orgAddress}
                  />
                </div>
              ) : (
                /* 80mm Thermal Receipt Mode */
                <div className="space-y-2.5 text-[11px] font-sans text-slate-950">
                  <div className="text-center border-b border-dashed border-slate-400 pb-2">
                    <div className="font-black text-sm">{orgName}</div>
                    <div className="text-[10px]">ভর্তি ফরম পেমেন্ট স্লিপ</div>
                    {orgPhone && <div className="text-[10px] font-mono">{orgPhone}</div>}
                    <div className="font-mono font-black text-xs mt-1">{order.slip_number}</div>
                    <div className="text-[9.5px] font-mono">{formatDateTime(order.created_at)}</div>
                  </div>

                  <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-[10.5px]">
                    <div><strong>নাম:</strong> {order.student_name}</div>
                    <div><strong>ফোন:</strong> <span className="font-mono">{order.student_phone}</span></div>
                    {order.hsc_roll && <div><strong>HSC রোল:</strong> <span className="font-mono">{order.hsc_roll}</span></div>}
                    <div><strong>স্ট্যাটাস:</strong> {order.payment_status}</div>
                  </div>

                  <div className="border-b border-dashed border-slate-400 pb-2 space-y-1">
                    {order.items.map((item, i) => (
                      <div key={item.id} className="flex justify-between gap-2 text-[10.5px]">
                        <span className="flex-1">
                          {i + 1}. {item.university_name} ({item.unit_name})
                        </span>
                        <span className="font-mono font-bold shrink-0">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-0.5 text-[11px] border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between">
                      <span>বিশ্ববিদ্যালয় ফি:</span>
                      <span className="font-mono">{formatCurrency(order.total_govt_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>সার্ভিস চার্জ:</span>
                      <span className="font-mono">{formatCurrency(order.total_service_charge)}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                      <div className="flex justify-between">
                        <span>ছাড়:</span>
                        <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                      <span>সর্বমোট:</span>
                      <span className="font-mono">{formatCurrency(order.net_payable)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>জমা (Paid):</span>
                      <span className="font-mono">{formatCurrency(order.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-black">
                      <span>বকেয়া (Due):</span>
                      <span className="font-mono">{formatCurrency(order.due_amount)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center pt-1 space-y-1">
                    <BarcodeView value={order.slip_number} height={28} />
                    <p className="text-[9px] text-center text-slate-600">
                      ধন্যবাদ! স্লিপটি সংরক্ষণ করুন।
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
