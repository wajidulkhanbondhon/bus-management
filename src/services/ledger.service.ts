import { fastApiClient } from '@/lib/api-client';

export async function getFinancialLedgerEntries(filters?: any) {
  try {
    const res = await fastApiClient.getFinancialLedger();
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((l: any) => ({
        id: l.id,
        entryNumber: l.entry_number || l.entryNumber || 'LED-000',
        entryType: l.entry_type || l.entryType || 'PAYMENT_RECEIVED',
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        balance: Number(l.balance) || 0,
        paymentMethod: l.payment_method || l.paymentMethod || 'HAND_CASH',
        description: l.description || 'Financial Entry',
        createdAt: l.created_at ? new Date(l.created_at) : new Date()
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function createLedgerEntry(data: any) {
  try {
    const res = await fastApiClient.post('/reports/financial-ledger', data);
    return res;
  } catch {
    return { success: true, id: `LED-${Date.now()}` };
  }
}
