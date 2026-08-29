'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  Lock,
  BadgePercent,
  Check,
  Plus,
  Edit2,
  Power,
  Trash2,
  Search,
  KeyRound,
  Mail,
  Phone,
  UserCheck,
  X,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { fastApiClient } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useApp } from '@/lib/context';

interface RolePermission {
  id: string;
  code?: string;
  name?: string;
  permission?: { code: string; name?: string; description?: string };
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions?: RolePermission[];
}

interface StaffUser {
  id: string;
  full_name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  is_active?: boolean;
  isActive?: boolean;
  discount_limit?: number;
  discountLimit?: number;
  created_at?: string;
  createdAt?: string | Date;
  role?: { id?: string; name: string; description?: string };
  _count?: { createdBookings?: number; receivedPayments?: number };
}

const FALLBACK_STAFF: StaffUser[] = [
  {
    id: 'usr-1',
    fullName: 'Kamrul Hasan (Director)',
    email: 'admin@transport.office',
    phone: '01711000001',
    isActive: true,
    discountLimit: 99999,
    createdAt: new Date(),
    role: { name: 'SUPER_ADMIN', description: 'Full System Control' },
    _count: { createdBookings: 12, receivedPayments: 10 }
  },
  {
    id: 'usr-2',
    fullName: 'Tariqul Islam (Operations Manager)',
    email: 'manager@transport.office',
    phone: '01811000002',
    isActive: true,
    discountLimit: 200,
    createdAt: new Date(),
    role: { name: 'MANAGER', description: 'Duty Manager' },
    _count: { createdBookings: 4, receivedPayments: 4 }
  },
  {
    id: 'usr-3',
    fullName: 'Rahim Chowdhury (Desk Officer)',
    email: 'staff@transport.office',
    phone: '01911000003',
    isActive: true,
    discountLimit: 50,
    createdAt: new Date(),
    role: { name: 'BOOKING_STAFF', description: 'Counter Desk Staff' },
    _count: { createdBookings: 24, receivedPayments: 24 }
  },
  {
    id: 'usr-4',
    fullName: 'Zubair Ahmed (Chief Cashier)',
    email: 'accountant@transport.office',
    phone: '01611000004',
    isActive: true,
    discountLimit: 0,
    createdAt: new Date(),
    role: { name: 'ACCOUNTANT', description: 'Chief Cashier' },
    _count: { createdBookings: 0, receivedPayments: 38 }
  }
];

const FALLBACK_ROLES: RoleItem[] = [
  {
    id: 'r-1',
    name: 'SUPER_ADMIN',
    description: 'Full System Control',
    permissions: [
      { id: 'p-1', permission: { code: 'dashboard:view' } },
      { id: 'p-2', permission: { code: 'booking:create' } },
      { id: 'p-3', permission: { code: 'seat:lock_unlock' } },
      { id: 'p-4', permission: { code: 'bus_trip:manage' } },
      { id: 'p-5', permission: { code: 'payment:collect' } }
    ]
  },
  {
    id: 'r-2',
    name: 'MANAGER',
    description: 'Duty Manager',
    permissions: [
      { id: 'p-1', permission: { code: 'dashboard:view' } },
      { id: 'p-2', permission: { code: 'booking:create' } },
      { id: 'p-3', permission: { code: 'seat:lock_unlock' } }
    ]
  },
  {
    id: 'r-3',
    name: 'BOOKING_STAFF',
    description: 'Counter Desk Staff',
    permissions: [
      { id: 'p-1', permission: { code: 'dashboard:view' } },
      { id: 'p-2', permission: { code: 'booking:create' } }
    ]
  },
  {
    id: 'r-4',
    name: 'ACCOUNTANT',
    description: 'Chief Cashier',
    permissions: [
      { id: 'p-1', permission: { code: 'dashboard:view' } },
      { id: 'p-5', permission: { code: 'payment:collect' } }
    ]
  }
];

export default function StaffPage() {
  const { language } = useApp();
  const [users, setUsers] = useState<StaffUser[]>(FALLBACK_STAFF);
  const [roles, setRoles] = useState<RoleItem[]>(FALLBACK_ROLES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [discountLimit, setDiscountLimit] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadStaffAndRoles = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fastApiClient.getStaff(),
        fastApiClient.getRoles()
      ]);

      if (staffRes.success && Array.isArray(staffRes.data) && staffRes.data.length > 0) {
        setUsers(staffRes.data);
      }
      if (rolesRes.success && Array.isArray(rolesRes.data) && rolesRes.data.length > 0) {
        setRoles(rolesRes.data);
      }
    } catch (err) {
      console.warn('API error fetching staff, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndRoles();
  }, []);

  const openAddModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSelectedRoleId(roles[2]?.id || '');
    setDiscountLimit(50);
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFullName(staff.full_name || staff.fullName || '');
    setEmail(staff.email || '');
    setPhone(staff.phone || '');
    setSelectedRoleId(staff.role?.id || '');
    setDiscountLimit(staff.discount_limit ?? staff.discountLimit ?? 0);
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password.trim() || 'staff1234',
        role_id: selectedRoleId || undefined,
        discount_limit: Number(discountLimit) || 0
      };

      const res = await fastApiClient.createStaff(payload);
      if (res.success) {
        setIsAddModalOpen(false);
        loadStaffAndRoles();
      } else {
        setErrorMsg(res.error || 'Failed to create staff account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        role_id: selectedRoleId || undefined,
        discount_limit: Number(discountLimit) || 0
      };

      const res = await fastApiClient.updateStaff(editingStaff.id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        loadStaffAndRoles();
      } else {
        setErrorMsg(res.error || 'Failed to update staff account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await fastApiClient.toggleStaffActive(id);
      loadStaffAndRoles();
    } catch (err) {
      console.error('Error toggling staff status:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const name = (u.full_name || u.fullName || '').toLowerCase();
    const mail = u.email.toLowerCase();
    const phoneNum = (u.phone || '').toLowerCase();
    const roleName = (u.role?.name || '').toLowerCase();
    return name.includes(q) || mail.includes(q) || phoneNum.includes(q) || roleName.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Access Governance</Badge>
            <span className="text-xs font-mono text-slate-500">ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'স্টাফ অ্যাকাউন্ট ও পারমিশন কন্ট্রোল' : 'Staff Accounts & Permissions'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কাউন্টার বুকিং স্টাফ, ম্যানেজার ও ক্যাশিয়ারের রোল, ডিসকাউন্ট লিমিট ও অ্যাকাউন্ট অ্যাক্টিভেশন ম্যানেজ করুন।
          </p>
        </div>

        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          {language === 'bn' ? 'নতুন স্টাফ যোগ করুন' : 'Add New Staff'}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="স্টাফের নাম, ইমেইল, ফোন নম্বর বা রোল দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <Card className="hidden md:block overflow-hidden border border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3.5">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            স্টাফ তালিকা ও পারমিশন স্ট্যাটাস ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Staff Name & Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Contact Phone</th>
                <th className="px-4 py-3 text-right">Discount Limit</th>
                <th className="px-4 py-3 text-center">Bookings</th>
                <th className="px-4 py-3 text-center">Payments</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredUsers.map((u) => {
                const isActive = u.is_active !== undefined ? u.is_active : (u.isActive !== undefined ? u.isActive : true);
                const limit = u.discount_limit !== undefined ? u.discount_limit : (u.discountLimit !== undefined ? u.discountLimit : 0);
                const name = u.full_name || u.fullName || 'Staff Member';
                const roleName = u.role?.name || 'BOOKING_STAFF';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={roleName === 'SUPER_ADMIN' ? 'purple' : (roleName === 'ACCOUNTANT' ? 'warning' : 'primary')}>
                        {roleName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {limit >= 99999 ? 'Unlimited' : `৳${limit}`}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-semibold">{u._count?.createdBookings || 0}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-semibold">{u._count?.receivedPayments || 0}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={isActive ? 'success' : 'danger'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                          }`}
                          title={isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile Card Grid View (Shown on small screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredUsers.map((u) => {
          const isActive = u.is_active !== undefined ? u.is_active : (u.isActive !== undefined ? u.isActive : true);
          const limit = u.discount_limit !== undefined ? u.discount_limit : (u.discountLimit !== undefined ? u.discountLimit : 0);
          const name = u.full_name || u.fullName || 'Staff Member';
          const roleName = u.role?.name || 'BOOKING_STAFF';

          return (
            <div
              key={u.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                </div>
                <Badge variant={isActive ? 'success' : 'danger'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">রোল:</span>
                  <Badge variant="primary" className="mt-0.5">
                    {roleName}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">ডিসকাউন্ট লিমিট:</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {limit >= 99999 ? 'Unlimited' : `৳${limit}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">মোবাইল:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{u.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">বুকিং / পেমেন্ট:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {u._count?.createdBookings || 0} / {u._count?.receivedPayments || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(u)}
                  className="text-xs h-8 gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  এডিট
                </Button>
                <Button
                  size="sm"
                  variant={isActive ? 'danger' : 'primary'}
                  onClick={() => handleToggleActive(u.id)}
                  className="text-xs h-8 gap-1"
                >
                  <Power className="w-3 h-3" />
                  {isActive ? 'ডিঅ্যাক্টিভেট' : 'অ্যাক্টিভেট'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permission Matrix Card */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 py-3.5">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            রোল পারমিশন ও ক্যাপাবিলিটি ম্যাট্রিক্স (RBAC Matrix)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r) => {
              const perms = r.permissions || [];
              return (
                <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{r.name}</span>
                    <Badge variant="purple">{perms.length} Perms</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.description || 'System operational role'}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {perms.slice(0, 5).map((p, idx) => {
                      const code = p.permission?.code || p.code || `perm-${idx}`;
                      return (
                        <span key={p.id || idx} className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono">
                          {code}
                        </span>
                      );
                    })}
                    {perms.length > 5 && (
                      <span className="text-[9px] text-slate-400 font-mono">+{perms.length - 5} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  নতুন স্টাফ অ্যাকাউন্ট তৈরি
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">স্টাফের পুরো নাম *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="যেমন: রহিম চৌধুরী"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ইমেইল অ্যাড্রেস *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="staff@transport.office"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">পাসওয়ার্ড</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="ডিফল্ট: staff1234"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">রোল অ্যাসাইন</label>
                    <select
                      value={selectedRoleId}
                      onChange={e => setSelectedRoleId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ডিসকাউন্ট লিমিট (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountLimit}
                      onChange={e => setDiscountLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5">
                    <Save className="w-4 h-4" />
                    {submitting ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-500" />
                  স্টাফ তথ্য ও রোল পরিবর্তন
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">স্টাফের পুরো নাম</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">রোল</label>
                    <select
                      value={selectedRoleId}
                      onChange={e => setSelectedRoleId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ডিসকাউন্ট লিমিট (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountLimit}
                      onChange={e => setDiscountLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5">
                    <Save className="w-4 h-4" />
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
