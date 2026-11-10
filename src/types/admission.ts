export interface AdmissionFeePreset {
  id: string;
  tenant_id?: string | null;
  university_name: string;
  unit_name: string;
  default_govt_fee: number;
  default_service_charge: number;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionOrderItem {
  id: string;
  order_id: string;
  university_name: string;
  unit_name: string;
  govt_fee: number;
  service_charge: number;
  subtotal: number;
  application_status: 'PENDING' | 'APPLIED' | 'FAILED' | 'CANCELLED' | string;
  portal_user_id?: string | null;
  portal_pin_or_ref?: string | null;
  payment_trx_ref?: string | null;
  applied_by_id?: string | null;
  applied_at?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionPayment {
  id: string;
  order_id: string;
  receipt_number: string;
  payment_type: 'PAYMENT' | 'REFUND' | string;
  amount: number;
  method: string;
  transaction_id?: string | null;
  notes?: string | null;
  received_by_id?: string | null;
  created_at: string;
}

export interface AdmissionOrder {
  id: string;
  tenant_id?: string | null;
  slip_number: string;
  student_name: string;
  student_phone: string;
  guardian_phone?: string | null;
  ssc_roll?: string | null;
  hsc_roll?: string | null;
  ssc_board?: string | null;
  hsc_board?: string | null;
  hsc_year?: string | null;
  student_group?: string | null;
  notes?: string | null;
  total_govt_fee: number;
  total_service_charge: number;
  discount_amount: number;
  net_payable: number;
  paid_amount: number;
  due_amount: number;
  refunded_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'DUE' | 'REFUNDED' | 'CANCELLED' | string;
  order_status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  created_by_id?: string | null;
  created_at: string;
  updated_at: string;
  items: AdmissionOrderItem[];
  payments: AdmissionPayment[];
}

export interface AdmissionLedgerEntry {
  id: string;
  entry_number: string;
  entry_type: string;
  order_id?: string | null;
  payment_id?: string | null;
  debit: number;
  credit: number;
  payment_method?: string | null;
  description: string;
  created_by_id?: string | null;
  created_at: string;
}

export interface AdmissionDayClosing {
  id: string;
  closing_date: string;
  closed_by_id: string;
  total_slips: number;
  total_forms: number;
  expected_govt_fee: number;
  expected_service_income: number;
  expected_collected: number;
  expected_due: number;
  expected_refunds: number;
  actual_total_cash: number;
  cash_difference: number;
  reconcile_status: string;
  notes?: string | null;
  created_at: string;
}

export interface AdmissionAccountsSummary {
  total_slips: number;
  total_forms: number;
  pending_forms: number;
  applied_forms: number;
  total_govt_fee: number;
  total_service_charge: number;
  total_discount: number;
  net_service_profit: number;
  total_net_payable: number;
  total_collected: number;
  total_refunded: number;
  net_cash_collected: number;
  total_due: number;
  method_breakdown: Record<string, number>;
  university_breakdown: Array<{
    university_name: string;
    forms_count: number;
    applied_count: number;
    pending_count: number;
    govt_fee_total: number;
    service_charge_total: number;
    subtotal: number;
  }>;
}

