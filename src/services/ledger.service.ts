export async function getFinancialLedgerEntries(filters?: any) {
  return [
    {
      id: 'led-1',
      entryNumber: 'LED-20260827-00001',
      entryType: 'PAYMENT_RECEIVED',
      debit: 0,
      credit: 650,
      balance: 0,
      paymentMethod: 'BKASH',
      description: 'bKash Collection for Farhana Yasmin',
      createdAt: new Date()
    }
  ];
}

export async function createLedgerEntry(data: any) {
  return { success: true, id: `LED-${Date.now()}` };
}
