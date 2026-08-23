'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import { recordPaymentAction } from '@/actions/payment.actions';

interface Props {
  bookingId: string;
  bookingNumber: string;
  dueAmount: number;
}

export function CollectDueButton({ bookingId, bookingNumber, dueAmount }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(dueAmount);
  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'HAND_CASH' | 'BANK_TRANSFER'>('HAND_CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('Due balance settled at boarding counter');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await recordPaymentAction({
        bookingId,
        amount: Number(amount),
        method,
        transactionId: transactionId || undefined,
        notes
      });
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(res.error || 'Failed to collect payment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setIsOpen(true)} className="font-bold">
        <CreditCard className="w-3.5 h-3.5 mr-1" />
        Collect Due
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Collect Due Balance for ${bookingNumber}`}
        description={`Remaining Outstanding Due: ${formatCurrency(dueAmount)}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Collection Amount (BDT)"
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            max={dueAmount}
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Channel</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
            >
              <option value="HAND_CASH">Hand Cash at Counter</option>
              <option value="BKASH">bKash Merchant</option>
              <option value="NAGAD">Nagad Counter</option>
              <option value="ROCKET">Rocket DBBL</option>
              <option value="BANK_TRANSFER">Bank Deposit</option>
            </select>
          </div>

          {method !== 'HAND_CASH' && (
            <Input
              label="Transaction ID (TrxID)"
              placeholder="e.g. BKA9281928"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value.toUpperCase())}
              required
            />
          )}

          <Input
            label="Receipt Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="success" size="sm" onClick={handleSubmit} isLoading={isLoading} className="font-bold">
              Record Collection & Update Due
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
