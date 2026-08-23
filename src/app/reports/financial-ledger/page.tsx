import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFinancialLedgerEntries } from '@/services/ledger.service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ExportActions } from '@/components/reports/export-actions';

export const revalidate = 0;

export default async function FinancialLedgerPage() {
  const entries = await getFinancialLedgerEntries({ limit: 100 });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Double-Entry Accounting</Badge>
            <span className="text-xs font-mono text-slate-500">IMMUTABLE EVENT-SOURCED AUDIT LEDGER</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">General Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete debits, credits, balance records, and transaction origins for accounting integration.
          </p>
        </div>

        <ExportActions reportData={entries} filename="ATOMS_Financial_Ledger" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3.5">Entry #</th>
                <th className="px-4 py-3.5">Type / Event</th>
                <th className="px-4 py-3.5">Description & Origin</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5 text-right text-rose-400">Debit (BDT)</th>
                <th className="px-4 py-3.5 text-right text-emerald-400">Credit (BDT)</th>
                <th className="px-4 py-3.5 text-right">Balance</th>
                <th className="px-5 py-3.5 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/60 font-mono">
                  <td className="px-5 py-3.5 font-bold text-blue-600">{entry.entryNumber}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={
                      entry.entryType === 'SALE' ? 'primary' :
                      entry.entryType === 'PAYMENT_RECEIVED' ? 'success' :
                      entry.entryType === 'DISCOUNT' ? 'purple' :
                      entry.entryType === 'REFUND_ISSUED' ? 'danger' : 'default'
                    }>
                      {entry.entryType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 font-sans font-medium text-slate-800 max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3.5">
                    {entry.paymentMethod ? (
                      <Badge variant="outline">{entry.paymentMethod}</Badge>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    {formatCurrency(entry.balance)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-400 font-normal">
                    {formatDateTime(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
