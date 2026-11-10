'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Scale,
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { AdmissionPaymentSlip } from '@/components/admission/admission-payment-slip';
import type { AdmissionOrder, AdmissionOrderItem } from '@/types/admission';

const PAYMENT_STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  PAID: { label: 'PAID', variant: 'success' },
  PARTIAL: { label: 'PARTIAL', variant: 'warning' },
  DUE: { label: 'DUE', variant: 'danger' },
  REFUNDED: { label: 'REFUNDED', variant: 'purple' },
  CANCELLED: { label: 'CANCELLED', variant: 'secondary' },
};

const ORDER_STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  RECEIVED: { label: 'জমা নেওয়া (Pending)', variant: 'warning' },
  IN_PROGRESS: { label: 'আংশিক সম্পন্ন', variant: 'info' },
  COMPLETED: { label: 'সব আবেদন সম্পন্ন', variant: 'success' },
  CANCELLED: { label: 'বাতিল', variant: 'secondary' },
};

export default function AdmissionOrdersListPage() {
  const [orders, setOrders] = useState<AdmissionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [slipOrder, setSlipOrder] = useState<AdmissionOrder | null>(null);
  const [dueOrder, setDueOrder] = useState<AdmissionOrder | null>(null);
  const [dueAmount, setDueAmount] = useState('');
  const [dueMethod, setDueMethod] = useState('HAND_CASH');
  const [dueTrx, setDueTrx] = useState('');

  const [refundOrder, setRefundOrder] = useState<AdmissionOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('HAND_CASH');
  const [refundReason, setRefundReason] = useState('');

  const [editingItem, setEditingItem] = useState<{ order: AdmissionOrder; item: AdmissionOrderItem } | null>(null);
  const [itemStatus, setItemStatus] = useState('APPLIED');
  const [portalUserId, setPortalUserId] = useState('');
  const [portalPin, setPortalPin] = useState('');
  const [paymentTrxRef, setPaymentTrxRef] = useState('');
  const [itemRemarks, setItemRemarks] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fastApiClient.getAdmissionOrders({
      search: search.trim() || undefined,
      payment_status: paymentFilter || undefined,
      order_status: orderFilter || undefined,
    });
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data);
    }
    setLoading(false);
  }, [search, paymentFilter, orderFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDueModal = (o: AdmissionOrder) => {
    setDueOrder(o);
    setDueAmount(String(o.due_amount));
    setDueMethod('HAND_CASH');
    setDueTrx('');
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueOrder) return;
    setActionLoading(true);
    const res = await fastApiClient.collectAdmissionDue(dueOrder.id, {
      amount: Number(dueAmount) || 0,
      method: dueMethod,
      transaction_id: dueTrx.trim() || undefined,
    });
    setActionLoading(false);
    if (res.success && res.data) {
      setDueOrder(null);
      fetchOrders();
    }
  };

  const openRefundModal = (o: AdmissionOrder) => {
    setRefundOrder(o);
    setRefundAmount(String(Math.max(0, Number(o.paid_amount) - Number(o.refunded_amount))));
    setRefundMethod('HAND_CASH');
    setRefundReason('');
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder || !refundReason.trim()) return;
    setActionLoading(true);
    const res = await fastApiClient.refundAdmissionOrder(refundOrder.id, {
      amount: Number(refundAmount) || 0,
      method: refundMethod,
      reason: refundReason.trim(),
    });
    setActionLoading(false);
    if (res.success) {
      setRefundOrder(null);
      fetchOrders();
    }
  };

  const openItemStatusModal = (order: AdmissionOrder, item: AdmissionOrderItem) => {
    setEditingItem({ order, item });
    setItemStatus(item.application_status === 'PENDING' ? 'APPLIED' : item.application_status);
    setPortalUserId(item.portal_user_id || '');
    setPortalPin(item.portal_pin_or_ref || '');
    setPaymentTrxRef(item.payment_trx_ref || '');
    setItemRemarks(item.remarks || '');
  };

  const handleUpdateItemStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setActionLoading(true);
    const res = await fastApiClient.updateAdmissionItemStatus(editingItem.item.id, {
      application_status: itemStatus,
      portal_user_id: portalUserId,
      portal_pin_or_ref: portalPin,
      payment_trx_ref: paymentTrxRef,
      remarks: itemRemarks,
    });
    setActionLoading(false);
    if (res.success) {
      setEditingItem(null);
      fetchOrders();
    }
  };

  const totalFormsCount = orders.reduce((s, o) => s + (o.items?.length || 0), 0);
  const pendingFormsCount = orders.reduce(
    (s, o) => s + (o.items?.filter((i) => i.application_status === 'PENDING').length || 0),
    0
  );
  const totalDueSum = orders.reduce((s, o) => s + (Number(o.due_amount) || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ভর্তি ফরম ও পেমেন্ট স্লিপ তালিকা
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              স্লিপ সার্চ, ফরম আবেদনের স্ট্যাটাস আপডেট, বকেয়া আদায় এবং পেমেন্ট কপি রি-প্রিন্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admission-service/accounts">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <Scale className="w-4 h-4 mr-1.5" />
              আলাদা হিসাব ও লেজার
            </Button>
          </Link>
          <Link href="/admission-service/new">
            <Button variant="primary" size="sm" className="rounded-xl font-black shadow-md">
              <Plus className="w-4 h-4 mr-1.5" />
              নতুন ফরম স্লিপ
            </Button>
          </Link>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-500">মোট স্লিপ</div>
          <div className="text-2xl font-black font-mono mt-1">{orders.length}</div>
        </Card>
        <Card className="p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-500">মোট বিশ্ববিদ্যালয় ফরম</div>
          <div className="text-2xl font-black font-mono mt-1 text-indigo-600">{totalFormsCount}</div>
        </Card>
        <Card className="p-4 rounded-2xl">
          <div className="text-xs font-bold text-amber-600">আবেদন বাকি (Pending)</div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-600">{pendingFormsCount}</div>
        </Card>
        <Card className="p-4 rounded-2xl">
          <div className="text-xs font-bold text-rose-600">মোট বকেয়া (Due)</div>
          <div className="text-2xl font-black font-mono mt-1 text-rose-600">{formatCurrency(totalDueSum)}</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="স্লিপ নং, শিক্ষার্থীর নাম, ফোন বা HSC রোল দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <option value="">সব পেমেন্ট স্ট্যাটাস</option>
            <option value="PAID">PAID (পরিশোধিত)</option>
            <option value="PARTIAL">PARTIAL (আংশিক)</option>
            <option value="DUE">DUE (বকেয়া)</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <option value="">সব আবেদন স্ট্যাটাস</option>
            <option value="RECEIVED">জমা নেওয়া (Pending)</option>
            <option value="IN_PROGRESS">আংশিক সম্পন্ন</option>
            <option value="COMPLETED">সব সম্পন্ন (Completed)</option>
            <option value="CANCELLED">বাতিল</option>
          </select>
        </div>
      </Card>

      {/* Orders List */}
      <Card className="rounded-3xl">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">স্লিপ তালিকা লোড হচ্ছে...</div>
          ) : orders.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ClipboardList}
                title="কোনো ভর্তি স্লিপ পাওয়া যায়নি"
                description="নতুন ভর্তি ফরম জমা নিতে এবং পেমেন্ট স্লিপ কাটতে নিচের বাটনে ক্লিক করুন।"
                actionLabel="নতুন ফরম স্লিপ কাটুন"
                actionHref="/admission-service/new"
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">স্লিপ নং ও সময়</th>
                  <th className="px-4 py-3">শিক্ষার্থী</th>
                  <th className="px-4 py-3">ফরমসমূহ</th>
                  <th className="px-4 py-3 text-right">মোট (সরকারি + চার্জ)</th>
                  <th className="px-4 py-3 text-right">জমা / বকেয়া</th>
                  <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => {
                  const isExpanded = expandedId === o.id;
                  const payBadge = PAYMENT_STATUS_BADGE[o.payment_status] || { label: o.payment_status, variant: 'default' };
                  const ordBadge = ORDER_STATUS_BADGE[o.order_status] || { label: o.order_status, variant: 'default' };

                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <div className="font-mono font-black text-indigo-600 dark:text-indigo-400">{o.slip_number}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formatDateTime(o.created_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{o.student_name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{o.student_phone}</div>
                          {o.hsc_roll && (
                            <div className="text-[10px] text-slate-400 font-mono">HSC: {o.hsc_roll}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : o.id)}
                            className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600"
                          >
                            <span>{o.items?.length || 0} টি ফরম</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {o.items?.map((i) => i.university_name).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <div className="font-black text-slate-900 dark:text-white">{formatCurrency(o.net_payable)}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatCurrency(o.total_govt_fee)} + {formatCurrency(o.total_service_charge)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <div className="font-bold text-emerald-600">{formatCurrency(o.paid_amount)}</div>
                          {Number(o.due_amount) > 0 && (
                            <div className="text-[10px] font-black text-rose-600">বকেয়া: {formatCurrency(o.due_amount)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center space-y-1">
                          <div>
                            <Badge variant={payBadge.variant}>{payBadge.label}</Badge>
                          </div>
                          <div>
                            <Badge variant={ordBadge.variant} className="text-[10px]">{ordBadge.label}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSlipOrder(o)}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                              title="পেমেন্ট স্লিপ প্রিন্ট"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              স্লিপ
                            </Button>
                            {Number(o.due_amount) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDueModal(o)}
                                className="rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-700 border-emerald-300"
                              >
                                <Wallet className="w-3.5 h-3.5 mr-1" />
                                বকেয়া
                              </Button>
                            )}
                            {Number(o.paid_amount) - Number(o.refunded_amount) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRefundModal(o)}
                                className="rounded-lg px-2 py-1 text-[11px] text-rose-600"
                                title="রিফান্ড"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded University Forms inside this Slip */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-900/70">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 mb-2">
                              এই স্লিপের অধীনে বিশ্ববিদ্যালয় ফরমসমূহ (আবেদন স্ট্যাটাস আপডেট করতে Edit-এ ক্লিক করুন):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {o.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2"
                                >
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-900 dark:text-white">{it.university_name}</div>
                                    <div className="text-[11px] text-slate-500">{it.unit_name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                      ফি: {formatCurrency(it.govt_fee)} + চার্জ: {formatCurrency(it.service_charge)}
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <Badge
                                        variant={
                                          it.application_status === 'APPLIED'
                                            ? 'success'
                                            : it.application_status === 'PENDING'
                                            ? 'warning'
                                            : 'danger'
                                        }
                                      >
                                        {it.application_status}
                                      </Badge>
                                      {it.portal_user_id && (
                                        <span className="text-[10px] font-mono text-indigo-600">
                                          ID: {it.portal_user_id}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openItemStatusModal(o, it)}
                                    className="rounded-lg px-2 py-1"
                                    title="আবেদন স্ট্যাটাস ও User ID আপডেট"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Slip Modal */}
      <Modal
        isOpen={!!slipOrder}
        onClose={() => setSlipOrder(null)}
        title={`ভর্তি পেমেন্ট স্লিপ — ${slipOrder?.slip_number || ''}`}
        size="xl"
      >
        {slipOrder && <AdmissionPaymentSlip order={slipOrder} />}
      </Modal>

      {/* Collect Due Modal */}
      <Modal
        isOpen={!!dueOrder}
        onClose={() => setDueOrder(null)}
        title={`বকেয়া আদায় — ${dueOrder?.slip_number || ''}`}
        size="sm"
      >
        <form onSubmit={handleCollectDue} className="space-y-4">
          <div className="text-xs bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
            শিক্ষার্থী: <strong>{dueOrder?.student_name}</strong> | বকেয়া:{' '}
            <strong className="font-mono text-rose-600">{formatCurrency(dueOrder?.due_amount)}</strong>
          </div>
          <Input
            label="আদায়কৃত টাকা (৳)"
            type="number"
            min={1}
            max={dueOrder?.due_amount}
            step="any"
            value={dueAmount}
            onChange={(e) => setDueAmount(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">পদ্ধতি</label>
            <select
              value={dueMethod}
              onChange={(e) => setDueMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="HAND_CASH">নগদ (Cash)</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="BANK_TRANSFER">Bank</option>
            </select>
          </div>
          <Input label="TrxID (ঐচ্ছিক)" value={dueTrx} onChange={(e) => setDueTrx(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDueOrder(null)} className="rounded-xl">
              বাতিল
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading} className="rounded-xl font-bold">
              {actionLoading ? 'সেভ হচ্ছে...' : 'জমা নিন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={!!refundOrder}
        onClose={() => setRefundOrder(null)}
        title={`রিফান্ড ইস্যু — ${refundOrder?.slip_number || ''}`}
        size="sm"
      >
        <form onSubmit={handleRefund} className="space-y-4">
          <Input
            label="রিফান্ড পরিমাণ (৳)"
            type="number"
            min={1}
            step="any"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">পদ্ধতি</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="HAND_CASH">নগদ (Cash)</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK_TRANSFER">Bank</option>
            </select>
          </div>
          <Input
            label="রিফান্ডের কারণ *"
            placeholder="যেমন: শিক্ষার্থী আবেদন বাতিল করেছে"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRefundOrder(null)} className="rounded-xl">
              বাতিল
            </Button>
            <Button type="submit" variant="danger" disabled={actionLoading} className="rounded-xl font-bold">
              {actionLoading ? 'প্রসেসিং...' : 'রিফান্ড নিশ্চিত করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Form Item Status Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`ফরম স্ট্যাটাস আপডেট — ${editingItem?.item.university_name || ''}`}
        description={editingItem?.item.unit_name}
        size="md"
      >
        <form onSubmit={handleUpdateItemStatus} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">আবেদনের অবস্থা</label>
            <select
              value={itemStatus}
              onChange={(e) => setItemStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="PENDING">PENDING (আবেদন বাকি)</option>
              <option value="APPLIED">APPLIED (আবেদন সম্পন্ন)</option>
              <option value="FAILED">FAILED (সমস্যা হয়েছে)</option>
              <option value="CANCELLED">CANCELLED (বাতিল)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="পোর্টাল User ID / Roll"
              placeholder="যেমন: RU-99812"
              value={portalUserId}
              onChange={(e) => setPortalUserId(e.target.value)}
            />
            <Input
              label="পোর্টাল PIN / Ref"
              placeholder="যেমন: 4512"
              value={portalPin}
              onChange={(e) => setPortalPin(e.target.value)}
            />
          </div>
          <Input
            label="বিশ্ববিদ্যালয় পেমেন্ট TrxRef"
            placeholder="বিশ্ববিদ্যালয়ে ফি প্রদানের TrxID"
            value={paymentTrxRef}
            onChange={(e) => setPaymentTrxRef(e.target.value)}
          />
          <Input
            label="মন্তব্য (Remarks)"
            value={itemRemarks}
            onChange={(e) => setItemRemarks(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="rounded-xl">
              বাতিল
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading} className="rounded-xl font-bold">
              {actionLoading ? 'আপডেট হচ্ছে...' : 'স্ট্যাটাস সেভ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

