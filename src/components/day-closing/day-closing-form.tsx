'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Receipt,
  CreditCard,
  History,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { submitDayClosingAction, reopenDayAction } from '@/actions/day-closing.actions';

interface Props {
  summary: any;
  currentUser?: any;
}

export function DayClosingForm({ summary, currentUser }: Props) {
  const router = useRouter();
  const { date, isClosed, existingClosing, metrics, methodSummaries } = summary;

  // State for actual amounts entered by cashier
  const [actualValues, setActualValues] = useState<Record<string, number>>({
    BKASH: existingClosing?.summaries?.find((s: any) => s.method === 'BKASH')?.actualAmount ?? methodSummaries?.BKASH?.expectedAmount ?? 0,
    NAGAD: existingClosing?.summaries?.find((s: any) => s.method === 'NAGAD')?.actualAmount ?? methodSummaries?.NAGAD?.expectedAmount ?? 0,
    ROCKET: existingClosing?.summaries?.find((s: any) => s.method === 'ROCKET')?.actualAmount ?? methodSummaries?.ROCKET?.expectedAmount ?? 0,
    HAND_CASH: existingClosing?.summaries?.find((s: any) => s.method === 'HAND_CASH')?.actualAmount ?? methodSummaries?.HAND_CASH?.expectedAmount ?? 0,
    BANK_TRANSFER: existingClosing?.summaries?.find((s: any) => s.method === 'BANK_TRANSFER')?.actualAmount ?? methodSummaries?.BANK_TRANSFER?.expectedAmount ?? 0
  });


  const [closingNotes, setClosingNotes] = useState(existingClosing?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Reopen Modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  const methodsList = [
    { key: 'HAND_CASH', label: 'Physical Hand Cash (Cashier Drawer)', isCash: true },
    { key: 'BKASH', label: 'bKash Merchant Account Balance', isCash: false },
    { key: 'NAGAD', label: 'Nagad Counter Account Balance', isCash: false },
    { key: 'ROCKET', label: 'Rocket DBBL Balance', isCash: false },
    { key: 'BANK_TRANSFER', label: 'Bank Direct Deposit', isCash: false }
  ];

  const handleActualChange = (methodKey: string, val: number) => {
    setActualValues(prev => ({
      ...prev,
      [methodKey]: val
    }));
  };

  const handleCloseDaySubmit = async () => {
    setIsSubmitting(true);
    try {
      const methodActuals = Object.entries(actualValues).map(([method, actualAmount]) => ({
        method: method as any,
        actualAmount: Number(actualAmount)
      }));

      const res = await submitDayClosingAction({
        closingDate: date,
        actualTotalCash: Number(actualValues.HAND_CASH || 0),
        methodActuals,
        notes: closingNotes
      });

      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to close business day');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenSubmit = async () => {
    if (!existingClosing || !reopenReason) return;
    setIsReopening(true);
    try {
      const res = await reopenDayAction(existingClosing.id, reopenReason);
      if (res.success) {
        setIsReopenModalOpen(false);
        router.refresh();
      } else {
        alert(res.error || 'Failed to reopen business day');
      }
    } finally {
      setIsReopening(false);
    }
  };

  // Calculate totals
  const totalActual = Object.values(actualValues).reduce((sum, v) => sum + Number(v || 0), 0);
  const totalExpected = metrics.expectedCollected;
  const overallDiff = totalActual - totalExpected;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              FINANCIAL RECONCILIATION
            </span>
            <Badge variant={isClosed ? 'danger' : 'success'}>
              {isClosed ? 'Business Day Closed & Locked' : 'Day Open for Settlements'}
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            End-of-Day Closing & Cash Balance Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare calculated digital & cash collection expectations against physical drawer balances.
          </p>
        </div>

        {isClosed && (
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={() => setIsReopenModalOpen(true)}
              className="font-bold"
            >
              <Unlock className="w-4 h-4 mr-1.5" />
              Reopen Day (Admin)
            </Button>
          </div>
        )}
      </div>

      {/* Expected Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-slate-50">
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Gross Sales</span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
            {formatCurrency(metrics.expectedGrossSales)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{metrics.bookingCount} Bookings</span>
        </Card>

        <Card className="p-4 bg-slate-50">
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Discounts Given</span>
          <div className="text-xl font-bold text-purple-700 font-mono mt-0.5">
            {formatCurrency(metrics.expectedDiscount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Approved concessions</span>
        </Card>

        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <span className="text-[10px] text-emerald-800 font-bold uppercase font-mono">Expected Collections</span>
          <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
            {formatCurrency(metrics.expectedCollected)}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">{metrics.paymentCount} Receipts</span>
        </Card>

        <Card className="p-4 bg-rose-50/60 border-rose-200">
          <span className="text-[10px] text-rose-800 font-bold uppercase font-mono">Customer Due Remaining</span>
          <div className="text-xl font-bold text-rose-600 font-mono mt-0.5">
            {formatCurrency(metrics.expectedDue)}
          </div>
          <span className="text-[10px] text-rose-500 mt-0.5 block">Outstanding balance</span>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Card className="shadow-xs">
        <CardHeader>
          <div>
            <CardTitle>Payment Method Reconciliation (Expected vs Actual)</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Cashier verifies actual cash in drawer and statement balances</p>
          </div>
          <Badge variant="primary">{formatDate(date)}</Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Channel / Payment Method</th>
                <th className="px-4 py-3 text-center">Trx Count</th>
                <th className="px-4 py-3 text-right">Expected Amount</th>
                <th className="px-4 py-3 text-right">Actual Counted Amount</th>
                <th className="px-4 py-3 text-right">Variance / Difference</th>
                <th className="px-5 py-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {methodsList.map((m) => {
                const expected = methodSummaries[m.key]?.expectedAmount || 0;
                const trxCount = methodSummaries[m.key]?.trxCount || 0;
                const actual = actualValues[m.key] ?? expected;
                const diff = actual - expected;

                return (
                  <tr key={m.key} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{m.label}</div>
                      <span className="text-[10px] font-mono text-slate-400">{m.key}</span>
                    </td>

                    <td className="px-4 py-4 text-center font-mono text-slate-600">
                      {trxCount}
                    </td>

                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(expected)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {isClosed ? (
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(actual)}</span>
                      ) : (
                        <input
                          type="number"
                          value={actual}
                          onChange={e => handleActualChange(m.key, Number(e.target.value))}
                          className="w-32 px-2.5 py-1.5 text-right font-mono font-bold text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-mono font-bold">
                      {diff === 0 ? (
                        <span className="text-slate-400">৳0 (Exact)</span>
                      ) : diff < 0 ? (
                        <span className="text-rose-600 flex items-center justify-end gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          -{formatCurrency(Math.abs(diff))}
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center justify-end gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{formatCurrency(diff)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Badge variant={diff === 0 ? 'success' : (diff < 0 ? 'danger' : 'warning')}>
                        {diff === 0 ? 'MATCHED' : (diff < 0 ? 'SHORT' : 'EXCESS')}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-mono text-xs font-bold border-t-2 border-slate-800">
              <tr>
                <td className="px-5 py-3.5">TOTAL COLLECTION BALANCE</td>
                <td className="px-4 py-3.5 text-center">{metrics.paymentCount}</td>
                <td className="px-4 py-3.5 text-right text-emerald-400">{formatCurrency(totalExpected)}</td>
                <td className="px-4 py-3.5 text-right text-white">{formatCurrency(totalActual)}</td>
                <td className="px-4 py-3.5 text-right">
                  {overallDiff === 0 ? (
                    <span className="text-emerald-400">৳0 (Matched)</span>
                  ) : overallDiff < 0 ? (
                    <span className="text-rose-400">-{formatCurrency(Math.abs(overallDiff))} SHORT</span>
                  ) : (
                    <span className="text-amber-400">+{formatCurrency(overallDiff)} EXCESS</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Badge variant={overallDiff === 0 ? 'success' : 'danger'}>
                    {overallDiff === 0 ? 'BALANCED' : 'VARIANCE DETECTED'}
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Cashier Notes & Submit Close Action */}
      {!isClosed && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              label="Cashier Reconciliation Notes / Discrepancy Statement"
              placeholder="e.g. Verified physical counter cash against receipt register. All bKash TrxIDs verified."
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Safety Notice:</span> Closing the business day creates an immutable financial ledger snapshot.
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCloseDaySubmit}
                isLoading={isSubmitting}
                className="font-bold shadow-lg shadow-blue-500/20"
              >
                <Lock className="w-4 h-4 mr-1.5" />
                Close Business Day & Lock Ledger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reopen Modal for Admin */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Admin Reopen Business Day"
        description="Reopening a closed day requires executive justification and creates an immutable audit trail entry"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Reopening"
            placeholder="e.g. Correcting cashier manual entry error for bKash receipt #0042"
            value={reopenReason}
            onChange={e => setReopenReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReopenModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReopenSubmit}
              isLoading={isReopening}
              disabled={!reopenReason}
            >
              Confirm Reopen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
