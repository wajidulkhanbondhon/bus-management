'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  GitBranch,
  Bus,
  Grid3X3,
  Users,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
  Percent,
  Coins,
  Receipt,
  FileText,
  Printer,
  Bell,
  Sparkles,
  Search,
  Lock,
  Download,
  Upload,
  Globe,
  Activity,
  Award,
  SlidersHorizontal,
  Wrench,
  Fuel,
  Send,
  Workflow,
  BarChart3,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Check,
  Clock,
  Phone,
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  Tag,
  KeyRound,
  MessageSquare,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Monitor,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  OrganizationSettingsState,
  DEFAULT_ORGANIZATION_SETTINGS,
  getStoredOrganizationSettings,
  saveStoredOrganizationSettings
} from '@/services/settings-storage.service';
import { DatabaseBackupClient } from './database-backup-client';
import { AppearanceSettingsClient } from './appearance-settings-client';
import { PaymentLogosSettingsClient } from './payment-logos-settings-client';
import { LandingControlClient } from './landing-control-client';
import { useApp } from '@/lib/context';

interface Props {
  initialSettings?: any;
  currentUser?: any;
}

export function SettingsCenterView({ initialSettings, currentUser }: Props) {
  const { language, t } = useApp();

  // Active Setting Category Section
  const [activeSection, setActiveSection] = useState<string>('general');

  // Live Settings Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings State Store
  const [orgSettings, setOrgSettings] = useState<OrganizationSettingsState>(DEFAULT_ORGANIZATION_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Branch CRUD Modals & Form State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    managerName: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Stop / Boarding Point CRUD Form State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [stopForm, setStopForm] = useState({
    nameBn: '',
    area: '',
    sequence: 1,
    pickupEnabled: true,
    dropEnabled: true
  });

  // Coupon CRUD Form State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'FIXED' as 'FIXED' | 'PERCENTAGE',
    amount: 50,
    maxUses: 100,
    validUntil: '2026-12-31',
    targetUniversity: 'সকল বিশ্ববিদ্যালয় (All)'
  });

  // Fare Zone CRUD Form State
  const [isFareZoneModalOpen, setIsFareZoneModalOpen] = useState(false);
  const [editingFareZoneId, setEditingFareZoneId] = useState<string | null>(null);
  const [fareZoneForm, setFareZoneForm] = useState({
    nameBn: '',
    basePrice: 550,
    rowsStr: 'A, B, C',
    description: ''
  });

  // Payment Account CRUD Form State
  const [isPaymentAccountModalOpen, setIsPaymentAccountModalOpen] = useState(false);
  const [editingPaymentAccountId, setEditingPaymentAccountId] = useState<string | null>(null);
  const [paymentAccountForm, setPaymentAccountForm] = useState({
    name: '',
    type: 'BKASH' as 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH',
    accountNumber: '',
    accountType: 'MERCHANT' as 'MERCHANT' | 'PERSONAL' | 'AGENT' | 'CURRENT',
    instructions: '',
    enabled: true
  });

  // Guardian Add Form State
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [guardianForm, setGuardianForm] = useState({
    nameBn: '',
    relationshipCode: '',
    allowedForFemaleBus: true,
    allowedForMaleBus: true
  });

  // Category Tag Add State
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  useEffect(() => {
    setOrgSettings(getStoredOrganizationSettings());
  }, []);

  const triggerAutoSave = (updated: OrganizationSettingsState, message?: string) => {
    setOrgSettings(updated);
    saveStoredOrganizationSettings(updated);
    setSaveMessage(message || (language === 'bn' ? '✓ সেটিংস সংরক্ষিত হয়েছে!' : '✓ Settings saved!'));
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveAll = () => {
    saveStoredOrganizationSettings(orgSettings);
    setSaveMessage(language === 'bn' ? '✓ সকল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : '✓ All settings successfully saved!');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleExportSettings = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orgSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `atoms-bus-settings-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- WEEKLY HOLIDAYS TOGGLE ---
  const toggleWeeklyHoliday = (day: string) => {
    const current = orgSettings.general.weeklyHolidays || [];
    const exists = current.includes(day);
    const updatedHolidays = exists ? current.filter(d => d !== day) : [...current, day];
    const updated = {
      ...orgSettings,
      general: {
        ...orgSettings.general,
        weeklyHolidays: updatedHolidays
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ সাপ্তাহিক ছুটি আপডেট হয়েছে!' : '✓ Weekly holidays updated!');
  };

  // --- BRANCH CRUD HANDLERS ---
  const handleOpenAddBranch = () => {
    setEditingBranchId(null);
    setBranchForm({
      name: '',
      code: '',
      address: '',
      phone: '',
      managerName: '',
      status: 'ACTIVE'
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: any) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      managerName: branch.managerName,
      status: branch.status || 'ACTIVE'
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = () => {
    if (!branchForm.name.trim() || !branchForm.code.trim()) return;

    let updatedBranches = [...orgSettings.branches];
    if (editingBranchId) {
      updatedBranches = updatedBranches.map(b =>
        b.id === editingBranchId ? { ...b, ...branchForm } : b
      );
    } else {
      updatedBranches.push({
        id: `br-${Date.now()}`,
        ...branchForm,
        email: '',
        openingDate: new Date().toISOString().slice(0, 10),
        notes: ''
      });
    }

    const updated = { ...orgSettings, branches: updatedBranches };
    triggerAutoSave(updated, language === 'bn' ? '✓ শাখা সফলভাবে আপডেট করা হয়েছে!' : '✓ Branch updated successfully!');
    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = (id: string) => {
    if (orgSettings.branches.length <= 1) {
      alert(language === 'bn' ? 'কমপক্ষে একটি প্রধান শাখা থাকতে হবে।' : 'At least one main branch is required.');
      return;
    }
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই শাখাটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this branch?')) return;

    const updatedBranches = orgSettings.branches.filter(b => b.id !== id);
    const updated = { ...orgSettings, branches: updatedBranches };
    triggerAutoSave(updated, language === 'bn' ? '✓ শাখা মুছে ফেলা হয়েছে।' : '✓ Branch deleted.');
  };

  // --- STOP / BOARDING POINT CRUD HANDLERS ---
  const handleOpenAddStop = () => {
    setEditingStopId(null);
    setStopForm({
      nameBn: '',
      area: '',
      sequence: orgSettings.stops.length + 1,
      pickupEnabled: true,
      dropEnabled: true
    });
    setIsStopModalOpen(true);
  };

  const handleOpenEditStop = (stop: any) => {
    setEditingStopId(stop.id);
    setStopForm({
      nameBn: stop.nameBn || stop.name,
      area: stop.area || '',
      sequence: stop.sequence || 1,
      pickupEnabled: !!stop.pickupEnabled,
      dropEnabled: !!stop.dropEnabled
    });
    setIsStopModalOpen(true);
  };

  const handleSaveStop = () => {
    if (!stopForm.nameBn.trim()) return;

    let updatedStops = [...orgSettings.stops];
    if (editingStopId) {
      updatedStops = updatedStops.map(s =>
        s.id === editingStopId ? { ...s, name: stopForm.nameBn, nameBn: stopForm.nameBn, area: stopForm.area, sequence: Number(stopForm.sequence), pickupEnabled: stopForm.pickupEnabled, dropEnabled: stopForm.dropEnabled } : s
      );
    } else {
      updatedStops.push({
        id: `st-${Date.now()}`,
        name: stopForm.nameBn,
        nameBn: stopForm.nameBn,
        area: stopForm.area,
        sequence: Number(stopForm.sequence),
        pickupEnabled: stopForm.pickupEnabled,
        dropEnabled: stopForm.dropEnabled,
        status: 'ACTIVE'
      });
    }

    updatedStops.sort((a, b) => a.sequence - b.sequence);
    const updated = { ...orgSettings, stops: updatedStops };
    triggerAutoSave(updated, language === 'bn' ? '✓ বোর্ডিং পয়েন্ট সফলভাবে সেভ হয়েছে!' : '✓ Boarding stop saved successfully!');
    setIsStopModalOpen(false);
  };

  const handleDeleteStop = (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই বোর্ডিং পয়েন্টটি ডিলিট করতে চান?' : 'Are you sure you want to delete this stop?')) return;
    const updatedStops = orgSettings.stops.filter(s => s.id !== id);
    const updated = { ...orgSettings, stops: updatedStops };
    triggerAutoSave(updated, language === 'bn' ? '✓ পয়েন্ট মুছে ফেলা হয়েছে।' : '✓ Stop deleted.');
  };

  // --- FARE ZONES CRUD HANDLERS ---
  const handleOpenAddFareZone = () => {
    setEditingFareZoneId(null);
    setFareZoneForm({
      nameBn: '',
      basePrice: 550,
      rowsStr: 'A, B',
      description: ''
    });
    setIsFareZoneModalOpen(true);
  };

  const handleSaveFareZone = () => {
    if (!fareZoneForm.nameBn.trim()) return;
    const rowsArray = fareZoneForm.rowsStr.split(',').map(r => r.trim().toUpperCase()).filter(Boolean);

    let updatedZones = [...(orgSettings.fareZones || [])];
    if (editingFareZoneId) {
      updatedZones = updatedZones.map(z =>
        z.id === editingFareZoneId ? { ...z, nameBn: fareZoneForm.nameBn, name: fareZoneForm.nameBn, basePrice: Number(fareZoneForm.basePrice), rows: rowsArray, description: fareZoneForm.description } : z
      );
    } else {
      updatedZones.push({
        id: `fz-${Date.now()}`,
        name: fareZoneForm.nameBn,
        nameBn: fareZoneForm.nameBn,
        basePrice: Number(fareZoneForm.basePrice),
        rows: rowsArray,
        description: fareZoneForm.description
      });
    }

    const updated = { ...orgSettings, fareZones: updatedZones };
    triggerAutoSave(updated, language === 'bn' ? '✓ সিট ফেয়ার জোন সেভ হয়েছে!' : '✓ Seat fare zone saved!');
    setIsFareZoneModalOpen(false);
  };

  const handleDeleteFareZone = (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই ফেয়ার জোনটি ডিলিট করতে চান?' : 'Are you sure you want to delete this fare zone?')) return;
    const updatedZones = (orgSettings.fareZones || []).filter(z => z.id !== id);
    const updated = { ...orgSettings, fareZones: updatedZones };
    triggerAutoSave(updated, language === 'bn' ? '✓ ফেয়ার জোন মুছে ফেলা হয়েছে।' : '✓ Fare zone removed.');
  };

  // --- GUARDIAN RULES CRUD HANDLERS ---
  const handleOpenAddGuardian = () => {
    setGuardianForm({
      nameBn: '',
      relationshipCode: '',
      allowedForFemaleBus: true,
      allowedForMaleBus: true
    });
    setIsGuardianModalOpen(true);
  };

  const handleSaveGuardian = () => {
    if (!guardianForm.nameBn.trim()) return;
    const code = (guardianForm.relationshipCode || guardianForm.nameBn).toUpperCase().replace(/\s+/g, '_');
    const newG = {
      id: `g-${Date.now()}`,
      nameBn: guardianForm.nameBn,
      nameEn: guardianForm.nameBn,
      relationshipCode: code,
      allowedForFemaleBus: guardianForm.allowedForFemaleBus,
      allowedForMaleBus: guardianForm.allowedForMaleBus
    };

    const currentGuardians = orgSettings.passengerRules.allowedGuardians || [];
    const updated = {
      ...orgSettings,
      passengerRules: {
        ...orgSettings.passengerRules,
        allowedGuardians: [...currentGuardians, newG]
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ নতুন অভিভাবক সম্পর্ক যুক্ত হয়েছে!' : '✓ Guardian relation added!');
    setIsGuardianModalOpen(false);
  };

  const handleDeleteGuardian = (id: string) => {
    const currentGuardians = orgSettings.passengerRules.allowedGuardians || [];
    const updated = {
      ...orgSettings,
      passengerRules: {
        ...orgSettings.passengerRules,
        allowedGuardians: currentGuardians.filter(g => g.id !== id)
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ সম্পর্ক মুছে ফেলা হয়েছে।' : '✓ Relation removed.');
  };

  // --- DYNAMIC ROLE PERMISSION TOGGLE ---
  const toggleRolePermission = (role: 'bookingStaff' | 'manager' | 'accountant', permissionKey: string) => {
    const currentRolePerms = (orgSettings.rolePermissions as any)?.[role] || {};
    const updated = {
      ...orgSettings,
      rolePermissions: {
        ...orgSettings.rolePermissions,
        [role]: {
          ...currentRolePerms,
          [permissionKey]: !currentRolePerms[permissionKey]
        }
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ পারমিশন আপডেট হয়েছে!' : '✓ Permission updated!');
  };

  // --- PAYMENT ACCOUNTS CRUD HANDLERS ---
  const handleOpenAddPaymentAccount = () => {
    setEditingPaymentAccountId(null);
    setPaymentAccountForm({
      name: '',
      type: 'BKASH',
      accountNumber: '',
      accountType: 'MERCHANT',
      instructions: '',
      enabled: true
    });
    setIsPaymentAccountModalOpen(true);
  };

  const handleSavePaymentAccount = () => {
    if (!paymentAccountForm.name.trim() || !paymentAccountForm.accountNumber.trim()) return;

    let currentAccounts = orgSettings.paymentGateways.customAccounts || [];
    if (editingPaymentAccountId) {
      currentAccounts = currentAccounts.map(a =>
        a.id === editingPaymentAccountId ? { ...a, ...paymentAccountForm } : a
      );
    } else {
      currentAccounts.push({
        id: `acc-${Date.now()}`,
        ...paymentAccountForm
      });
    }

    const updated = {
      ...orgSettings,
      paymentGateways: {
        ...orgSettings.paymentGateways,
        customAccounts: currentAccounts
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ পেমেন্ট একাউন্ট সেভ হয়েছে!' : '✓ Payment account saved!');
    setIsPaymentAccountModalOpen(false);
  };

  const handleDeletePaymentAccount = (id: string) => {
    const currentAccounts = orgSettings.paymentGateways.customAccounts || [];
    const updated = {
      ...orgSettings,
      paymentGateways: {
        ...orgSettings.paymentGateways,
        customAccounts: currentAccounts.filter(a => a.id !== id)
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ পেমেন্ট একাউন্ট মুছে ফেলা হয়েছে।' : '✓ Payment account removed.');
  };

  const togglePaymentAccountStatus = (id: string) => {
    const currentAccounts = orgSettings.paymentGateways.customAccounts || [];
    const updated = {
      ...orgSettings,
      paymentGateways: {
        ...orgSettings.paymentGateways,
        customAccounts: currentAccounts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ একাউন্ট স্ট্যাটাস আপডেট হয়েছে!' : '✓ Account status toggled!');
  };

  // --- COUPONS CRUD HANDLERS ---
  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      discountType: 'FIXED',
      amount: 50,
      maxUses: 100,
      validUntil: '2026-12-31',
      targetUniversity: 'সকল বিশ্ববিদ্যালয় (All)'
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = () => {
    if (!couponForm.code.trim()) return;

    let updatedCoupons = [...(orgSettings.coupons || [])];
    if (editingCouponId) {
      updatedCoupons = updatedCoupons.map(c =>
        c.id === editingCouponId ? { ...c, ...couponForm, code: couponForm.code.toUpperCase().trim() } : c
      );
    } else {
      updatedCoupons.push({
        id: `cp-${Date.now()}`,
        code: couponForm.code.toUpperCase().trim(),
        discountType: couponForm.discountType,
        amount: Number(couponForm.amount),
        maxUses: Number(couponForm.maxUses),
        usedCount: 0,
        validUntil: couponForm.validUntil,
        targetUniversity: couponForm.targetUniversity,
        status: 'ACTIVE'
      });
    }

    const updated = { ...orgSettings, coupons: updatedCoupons };
    triggerAutoSave(updated, language === 'bn' ? '✓ কুপন কোড সফলভাবে যুক্ত হয়েছে!' : '✓ Coupon code added successfully!');
    setIsCouponModalOpen(false);
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই কুপন কোডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this coupon?')) return;
    const updatedCoupons = (orgSettings.coupons || []).filter(c => c.id !== id);
    const updated = { ...orgSettings, coupons: updatedCoupons };
    triggerAutoSave(updated, language === 'bn' ? '✓ কুপন মুছে ফেলা হয়েছে।' : '✓ Coupon deleted.');
  };

  // --- INCOME & EXPENSE TAGS CRUD ---
  const handleAddIncomeCategory = () => {
    if (!newIncomeCategory.trim()) return;
    if (orgSettings.categories.income.includes(newIncomeCategory.trim())) return;
    const updated = {
      ...orgSettings,
      categories: {
        ...orgSettings.categories,
        income: [...orgSettings.categories.income, newIncomeCategory.trim()]
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ নতুন আয় ক্যাটাগরি যোগ হয়েছে!' : '✓ New income tag added!');
    setNewIncomeCategory('');
  };

  const handleDeleteIncomeCategory = (tag: string) => {
    const updated = {
      ...orgSettings,
      categories: {
        ...orgSettings.categories,
        income: orgSettings.categories.income.filter(t => t !== tag)
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ আয় ক্যাটাগরি ডিলিট হয়েছে।' : '✓ Income tag removed.');
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCategory.trim()) return;
    if (orgSettings.categories.expense.includes(newExpenseCategory.trim())) return;
    const updated = {
      ...orgSettings,
      categories: {
        ...orgSettings.categories,
        expense: [...orgSettings.categories.expense, newExpenseCategory.trim()]
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ নতুন ব্যয় ক্যাটাগরি যোগ হয়েছে!' : '✓ New expense tag added!');
    setNewExpenseCategory('');
  };

  const handleDeleteExpenseCategory = (tag: string) => {
    const updated = {
      ...orgSettings,
      categories: {
        ...orgSettings.categories,
        expense: orgSettings.categories.expense.filter(t => t !== tag)
      }
    };
    triggerAutoSave(updated, language === 'bn' ? '✓ ব্যয় ক্যাটাগরি ডিলিট হয়েছে।' : '✓ Expense tag removed.');
  };

  // Operational Settings Categories
  const categories = [
    { id: 'general', nameBn: '১. সাধারণ, ভাষা ও টাইমজোন (Dynamic)', nameEn: '1. General, Language & Timezone', icon: Globe },
    { id: 'organization', nameBn: '২. প্রতিষ্ঠান পরিচিতি ও যোগাযোগ', nameEn: '2. Profile & Contacts', icon: Building2 },
    { id: 'branches', nameBn: '৩. শাখা ও কাউন্টার হাব (Add/Edit/Delete)', nameEn: '3. Branches & Counters', icon: GitBranch },
    { id: 'fare_zones', nameBn: '৪. জায়গাভেদে সিট ভাড়া ও ফেয়ার জোন (Add/Edit/Delete)', nameEn: '4. Zone Fare Rates', icon: Coins },
    { id: 'passenger_rules', nameBn: '৫. অভিভাবক সম্পর্ক রুলস (Add/Delete)', nameEn: '5. Guardian Eligibility', icon: Users },
    { id: 'role_permissions', nameBn: '৬. স্টাফ রোল পারমিশন ম্যাট্রিক্স (Dynamic)', nameEn: '6. Role Permissions Matrix', icon: KeyRound },
    { id: 'stops', nameBn: '৭. বোর্ডিং ও ড্রপিং পয়েন্ট (Add/Edit/Delete)', nameEn: '7. Boarding & Dropping Points', icon: MapPin },
    { id: 'coupons', nameBn: '৮. কুপন ও প্রমো কোড ইঞ্জিন (Add/Delete)', nameEn: '8. Coupons & Promo Engine', icon: Tag },
    { id: 'payments', nameBn: '৯. পেমেন্ট গেটওয়ে ও মার্চেন্ট একাউন্ট (Add/Edit/Delete)', nameEn: '9. Payment Gateways & Accounts', icon: CreditCard },
    { id: 'booking', nameBn: '১০. টিকিট বুকিং ও হোল্ড টাইমার (Minutes/Seconds)', nameEn: '10. Booking & Hold Rules', icon: Receipt },
    { id: 'discounts', nameBn: '১১. ছাড় ও রোল-ভিত্তিক লিমিট', nameEn: '11. Discounts & Limits', icon: Percent },
    { id: 'finance', nameBn: '১২. অর্থ, ক্যাশ ড্রয়ার ও ডে ক্লোজিং', nameEn: '12. Finance & Day Closing', icon: Coins },
    { id: 'categories', nameBn: '১৩. আয় ও ব্যয় ক্যাটাগরি (Add/Delete)', nameEn: '13. Income & Expense Tags', icon: Layers },
    { id: 'documents', nameBn: '১৪. ডকুমেন্ট ও থার্মাল পিওএস প্রিন্ট', nameEn: '14. Documents & Thermal Print', icon: Printer },
    { id: 'sms_templates', nameBn: '১৫. কাস্টম এসএমএস টেমপ্লেট বিল্ডার', nameEn: '15. SMS Template Builder', icon: MessageSquare },
    { id: 'fuel', nameBn: '১৬. ফুয়েল ও মাইলেজ ক্যালকুলেটর', nameEn: '16. Fuel & Mileage Rules', icon: Fuel },
    { id: 'communication', nameBn: '১৭. এসএমএস ও হোয়াটসঅ্যাপ গেটওয়ে', nameEn: '17. SMS & WhatsApp API', icon: Send },
    { id: 'security', nameBn: '১৮. নিরাপত্তা, পাসওয়ার্ড ও সেশন (Minutes)', nameEn: '18. Security & Session', icon: ShieldCheck },
    { id: 'appearance', nameBn: '১৯. থিম ও কালার কাস্টমাইজেশন', nameEn: '19. Appearance & Themes', icon: Sparkles },
    { id: 'payment_logos', nameBn: '২০. পেমেন্ট ব্র্যান্ড লোগো সেটিংস', nameEn: '20. Payment Brand Logos', icon: CreditCard },
    { id: 'database_backup', nameBn: '২১. ডাটাবেজ ব্যাকআপ ও মাইগ্রেশন', nameEn: '21. Database Backup & Restore', icon: Database },
    { id: 'landing_control', nameBn: '২২. ল্যান্ডিং পেজ ও পাবলিক পোর্টাল কন্ট্রোল', nameEn: '22. Landing Page & Public Portal Control', icon: Monitor }
  ];

  // Filter Categories by Search Query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => c.nameBn.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.id.includes(q));
  }, [searchQuery, categories]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'বাস ম্যানেজমেন্ট ও অপারেশন সেটিংস' : 'Bus Operations Settings Center'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'ডাইনামিক রোল পারমিশন, জোনভিত্তিক সিট ভাড়া, পেমেন্ট মার্চেন্ট, ভাষা ও টাইমজোন নিয়ন্ত্রণ কক্ষ'
                  : 'Dynamic configuration for role permissions, zone fares, merchant accounts, and multi-language controls'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              {saveMessage}
            </span>
          )}

          <Button variant="outline" size="sm" onClick={handleExportSettings} className="font-bold rounded-xl text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {language === 'bn' ? 'ব্যাকআপ JSON' : 'Export JSON'}
          </Button>

          <Button variant="primary" size="sm" onClick={handleSaveAll} className="font-black shadow-md shadow-blue-500/25 rounded-xl text-xs">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {language === 'bn' ? 'সকল পরিবর্তন সেভ করুন' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Settings Grid: Left Nav + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'সেটিংস খুঁজুন (e.g. fare, permission, bKash)...' : 'Search settings...'}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-2xs"
            />
          </div>

          {/* Navigation List */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-h-[750px] overflow-y-auto space-y-1 scrollbar-thin">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeSection === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveSection(cat.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Settings Content Module */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: General & Localization (DYNAMIC LANGUAGES & TIMEZONES) */}
          {activeSection === 'general' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '১. সাধারণ, বহুভাষা, টাইমজোন ও ছুটির দিন সেটিংস' : '1. General, Languages, Timezone & Holidays'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Language Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">সিস্টেম ভাষা (System Language)</label>
                    <select
                      value={orgSettings.general.language}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, language: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="bn">বাংলা (Bengali - Official Default)</option>
                      <option value="en">English (US - English)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="fr">Français (French)</option>
                      <option value="es">Español (Spanish)</option>
                    </select>
                  </div>

                  {/* Timezone Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টাইমজোন (Timezone Selector)</label>
                    <select
                      value={orgSettings.general.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, timezone: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="Asia/Dhaka">Asia/Dhaka (BST +06:00 - Bangladesh)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30 - India)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +04:00 - UAE)</option>
                      <option value="Asia/Riyadh">Asia/Riyadh (AST +03:00 - Saudi Arabia)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Europe/London">Europe/London (GMT/BST - UK)</option>
                      <option value="America/New_York">America/New_York (EST - USA)</option>
                    </select>
                  </div>

                  {/* Currency Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">মুদ্রা (Currency Selection)</label>
                    <select
                      value={orgSettings.general.currency}
                      onChange={(e) => {
                        const cur = e.target.value;
                        const symbolMap: Record<string, string> = { BDT: '৳', USD: '$', EUR: '€', GBP: '£', INR: '₹', SAR: '﷼', AED: 'د.إ' };
                        setOrgSettings({
                          ...orgSettings,
                          general: {
                            ...orgSettings.general,
                            currency: cur,
                            currencySymbol: symbolMap[cur] || '৳'
                          }
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="BDT">BDT (৳ - বাংলাদেশী টাকা)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="SAR">SAR (﷼ - Saudi Riyal)</option>
                      <option value="AED">AED (د.إ - UAE Dirham)</option>
                    </select>
                  </div>

                  {/* Currency Symbol Custom Input */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">মুদ্রার প্রতীক (Currency Symbol)</label>
                    <input
                      type="text"
                      value={orgSettings.general.currencySymbol}
                      onChange={(e) => setOrgSettings({ ...orgSettings, general: { ...orgSettings.general, currencySymbol: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-base"
                    />
                  </div>
                </div>

                {/* Weekly Holidays Selection */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">সাপ্তাহিক ছুটির দিন নির্বাচন (Weekly Off-Days):</span>
                    <span className="text-[11px] text-slate-500">ক্লিক করে সক্রিয়/নিষ্ক্রিয় করুন</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { code: 'FRIDAY', nameBn: 'শুক্রবার (Friday)' },
                      { code: 'SATURDAY', nameBn: 'শনিবার (Saturday)' },
                      { code: 'SUNDAY', nameBn: 'রবিবার (Sunday)' },
                      { code: 'THURSDAY', nameBn: 'বৃহস্পতিবার (Thursday)' }
                    ].map((d) => {
                      const isSelected = (orgSettings.general.weeklyHolidays || []).includes(d.code);
                      return (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() => toggleWeeklyHoliday(d.code)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{d.nameBn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 2: Organization Profile */}
          {activeSection === 'organization' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '২. প্রতিষ্ঠান পরিচিতি ও হেল্পলাইন' : '2. Organization Profile'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">প্রতিষ্ঠানের নাম (Display Name)</label>
                    <input
                      type="text"
                      value={orgSettings.organization.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, name: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">হটলাইন / হেল্পলাইন নম্বর</label>
                    <input
                      type="text"
                      value={orgSettings.organization.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, phone: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">জরুরী যোগাযোগ নম্বর (Emergency)</label>
                    <input
                      type="text"
                      value={orgSettings.organization.emergencyContact}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, emergencyContact: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">হেড অফিস ঠিকানা</label>
                    <input
                      type="text"
                      value={orgSettings.organization.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organization: { ...orgSettings.organization, address: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 3: Branches (FULL CRUD) */}
          {activeSection === 'branches' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '৩. কাউন্টার ও ব্রাঞ্চ হাব' : '3. Branch Management'}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{orgSettings.branches.length} টি কাউন্টার</Badge>
                  <Button size="sm" variant="primary" onClick={handleOpenAddBranch} className="font-bold rounded-xl text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? 'নতুন কাউন্টার যোগ করুন' : 'Add Counter'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  {orgSettings.branches.map((br, idx) => (
                    <div key={br.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{br.name}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">{br.code}</span>
                        </div>
                        <p className="text-slate-500 mt-1 font-mono text-xs">{br.address} • ম্যানেজার: {br.managerName} ({br.phone})</p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditBranch(br)} className="h-8 px-2.5 font-bold rounded-xl">
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteBranch(br.id)} className="h-8 px-2.5 font-bold rounded-xl">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 4: Dynamic Fare by Seat Zones (NEW FULL CRUD) */}
          {activeSection === 'fare_zones' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '৪. জায়গাভেদে ও জোনভিত্তিক সিট ভাড়া কনফিগারেশন' : '4. Zone Fare Rates'}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{(orgSettings.fareZones || []).length} টি ফেয়ার জোন</Badge>
                  <Button size="sm" variant="primary" onClick={handleOpenAddFareZone} className="font-bold rounded-xl text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? 'নতুন জোন তৈরি' : 'Add Fare Zone'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  {(orgSettings.fareZones || []).map((fz, idx) => (
                    <div key={fz.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{fz.nameBn}</span>
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900">
                            ৳{fz.basePrice}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1 font-mono text-[11px] flex items-center gap-2">
                          <span>প্রযোজ্য রো: {fz.rows.join(', ')}</span>
                          {fz.description && <span>• {fz.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button size="sm" variant="danger" onClick={() => handleDeleteFareZone(fz.id)} className="h-8 px-2.5 font-bold rounded-xl">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 5: Dynamic Guardian Eligibility (NEW FULL CRUD) */}
          {activeSection === 'passenger_rules' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>{language === 'bn' ? '৫. অনুমোদিত অভিভাবক সম্পর্ক ও সিটিং রুলস' : '5. Guardian Eligibility Rules'}</span>
                </CardTitle>
                <Button size="sm" variant="primary" onClick={handleOpenAddGuardian} className="font-bold rounded-xl text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'নতুন সম্পর্ক যোগ' : 'Add Relationship'}
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">ছাত্রী কোচে অনুমোদিত অভিভাবক তালিকা:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(orgSettings.passengerRules.allowedGuardians || []).map((g, idx) => (
                      <div key={g.id || idx} className="p-3 bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-pink-600" />
                          <span className="font-bold text-pink-900 dark:text-pink-200">{g.nameBn}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGuardian(g.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 6: Dynamic Role Permissions Matrix (NEW INTERACTIVE TOGGLES) */}
          {activeSection === 'role_permissions' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '৬. ডাইনামিক স্টাফ ও রোল পারমিশন ম্যাট্রিক্স (Interactive Switch)' : '6. Interactive Role Permissions Matrix'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs overflow-x-auto">
                <p className="text-slate-500 dark:text-slate-400">
                  নিচের সুইচগুলোতে ক্লিক করে সরাসরি স্টাফ, ম্যানেজার এবং একাউন্ট্যান্টদের ক্ষমতা চালু বা বন্ধ করতে পারেন:
                </p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-3">অনুমোদিত ফিচার / অ্যাকশন</th>
                      <th className="p-3 text-center">বুকিং স্টাফ</th>
                      <th className="p-3 text-center">কাউন্টার ম্যানেজার</th>
                      <th className="p-3 text-center">একাউন্ট্যান্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {[
                      { key: 'canBookTickets', label: 'টিকিট কাটা ও বুকিং করা' },
                      { key: 'canCancelTickets', label: 'টিকিট বাতিল ও রিফান্ড অনুমোদন' },
                      { key: 'canApplyMaxDiscount50', label: 'সর্বোচ্চ ৫০ টাকা ছাড় দেওয়া' },
                      { key: 'canApplyMaxDiscount200', label: 'সর্বোচ্চ ২০০ টাকা ছাড় অনুমোদন' },
                      { key: 'canViewReports', label: 'দৈনিক লাভ/ক্ষতি ও সেলস রিপোর্ট দেখা' },
                      { key: 'canManageBuses', label: 'বাস ও রুট ম্যানেজ করা' },
                      { key: 'canCloseDay', label: 'ডে ক্লোজিং সম্পন্ন ও লেনদেন লক করা' }
                    ].map((row) => {
                      const staffPerm = !!(orgSettings.rolePermissions?.bookingStaff as any)?.[row.key];
                      const mgrPerm = !!(orgSettings.rolePermissions?.manager as any)?.[row.key];
                      const accPerm = !!(orgSettings.rolePermissions?.accountant as any)?.[row.key];

                      return (
                        <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{row.label}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRolePermission('bookingStaff', row.key)}
                              className="cursor-pointer inline-flex items-center"
                            >
                              {staffPerm ? (
                                <Badge variant="success" className="cursor-pointer">✓ সক্রিয়</Badge>
                              ) : (
                                <Badge variant="default" className="cursor-pointer opacity-50">✕ বন্ধ</Badge>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRolePermission('manager', row.key)}
                              className="cursor-pointer inline-flex items-center"
                            >
                              {mgrPerm ? (
                                <Badge variant="success" className="cursor-pointer">✓ সক্রিয়</Badge>
                              ) : (
                                <Badge variant="default" className="cursor-pointer opacity-50">✕ বন্ধ</Badge>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRolePermission('accountant', row.key)}
                              className="cursor-pointer inline-flex items-center"
                            >
                              {accPerm ? (
                                <Badge variant="success" className="cursor-pointer">✓ সক্রিয়</Badge>
                              ) : (
                                <Badge variant="default" className="cursor-pointer opacity-50">✕ বন্ধ</Badge>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* SECTION 7: Stops & Boarding Points (FULL CRUD) */}
          {activeSection === 'stops' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '৭. বোর্ডিং ও ড্রপিং পয়েন্ট ড্রপডাউন' : '7. Boarding & Dropping Points'}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{orgSettings.stops.length} টি পয়েন্ট নিবন্ধিত</Badge>
                  <Button size="sm" variant="primary" onClick={handleOpenAddStop} className="font-bold rounded-xl text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? 'নতুন পয়েন্ট যোগ করুন' : 'Add Stop'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-2">
                  {orgSettings.stops.map((st, i) => (
                    <div key={st.id || i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold w-6 text-center text-blue-600">{st.sequence}.</span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{st.nameBn}</span>
                          <span className="text-[11px] text-slate-500 ml-2">({st.area})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {st.pickupEnabled && <Badge variant="primary">PICKUP</Badge>}
                        {st.dropEnabled && <Badge variant="success">DROP</Badge>}
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditStop(st)} className="h-7 px-2 font-bold rounded-lg ml-2">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteStop(st.id)} className="h-7 px-2 font-bold rounded-lg">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 8: Coupons & Promo Engine */}
          {activeSection === 'coupons' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'bn' ? '৮. ভর্তি পরীক্ষা স্পেশাল কুপন ও প্রমো কোড' : '8. Promo Coupons Engine'}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{(orgSettings.coupons || []).length} টি সক্রিয় কুপন</Badge>
                  <Button size="sm" variant="primary" onClick={handleOpenAddCoupon} className="font-bold rounded-xl text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {language === 'bn' ? 'নতুন কুপন কোড তৈরি' : 'Create Coupon'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  {(orgSettings.coupons || []).map((cp, idx) => (
                    <div key={cp.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            {cp.code}
                          </span>
                          <Badge variant="success">
                            {cp.discountType === 'FIXED' ? `৳${cp.amount} ছাড়` : `${cp.amount}% ছাড়`}
                          </Badge>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {cp.targetUniversity}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1.5 font-mono text-[11px]">
                          ব্যবহার: {cp.usedCount} / {cp.maxUses} বার • মেয়াদ: {cp.validUntil}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button size="sm" variant="danger" onClick={() => handleDeleteCoupon(cp.id)} className="h-8 px-2.5 font-bold rounded-xl">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 9: Dynamic Payment Gateways & Custom Accounts (NEW FULL CRUD & TOGGLE) */}
          {activeSection === 'payments' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '৯. পেমেন্ট গেটওয়ে ও মার্চেন্ট একাউন্ট কনফিগ (Add/Edit/Delete)' : '9. Payment Gateways & Accounts'}</span>
                </CardTitle>
                <Button size="sm" variant="primary" onClick={handleOpenAddPaymentAccount} className="font-bold rounded-xl text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {language === 'bn' ? 'নতুন একাউন্ট যোগ' : 'Add Account'}
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3">
                  {(orgSettings.paymentGateways.customAccounts || []).map((acc, idx) => (
                    <div key={acc.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{acc.name}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold">{acc.type}</span>
                          <span className="font-mono text-xs text-slate-500 font-bold">[{acc.accountType}]</span>
                        </div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                          নম্বর/একাউন্ট: <span className="text-blue-600 dark:text-blue-400">{acc.accountNumber}</span>
                        </div>
                        {acc.instructions && <p className="text-slate-500 text-[11px] mt-0.5">{acc.instructions}</p>}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => togglePaymentAccountStatus(acc.id)}
                          className="cursor-pointer"
                        >
                          {acc.enabled ? <Badge variant="success">সক্রিয় (Active)</Badge> : <Badge variant="default">নিষ্ক্রিয় (Off)</Badge>}
                        </button>
                        <Button size="sm" variant="danger" onClick={() => handleDeletePaymentAccount(acc.id)} className="h-7 px-2 font-bold rounded-lg">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 10: Booking & Hold Policies (EXPLICIT TIME UNITS) */}
          {activeSection === 'booking' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '১০. টিকিট বুকিং ও সিট হোল্ড টাইমার (মিনিট / সেকেন্ড উল্লেখ)' : '10. Booking & Hold Rules'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">অনলাইন পাবলিক সিট হোল্ড উইন্ডো (মিনিট / Minutes)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={orgSettings.booking.seatHoldMinutesPublic}
                        onChange={(e) => setOrgSettings({ ...orgSettings, booking: { ...orgSettings.booking, seatHoldMinutesPublic: Number(e.target.value) } })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      />
                      <span className="font-bold text-slate-500 shrink-0">মিনিট (Min)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">শিক্ষার্থী অনলাইনে সিট সিলেক্ট করলে সর্বোচ্চ ৫ মিনিট লক থাকবে</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5">কাউন্টার স্টাফ সিট হোল্ড উইন্ডো (মিনিট / Minutes)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={orgSettings.booking.seatHoldMinutesStaff}
                        onChange={(e) => setOrgSettings({ ...orgSettings, booking: { ...orgSettings.booking, seatHoldMinutesStaff: Number(e.target.value) } })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      />
                      <span className="font-bold text-slate-500 shrink-0">মিনিট (Min)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">কাউন্টার বুকিংয়ের সময় সর্বোচ্চ ১৫ মিনিট হোল্ড থাকবে</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 11: Discounts & Caps */}
          {activeSection === 'discounts' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  <span>{language === 'bn' ? '১১. ছাড় ও কমিশন নীতিমালা' : '11. Role-Based Discount Limits'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">বুকিং স্টাফ লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-blue-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.discounts.bookingStaffMaxDiscount}
                        onChange={(e) => setOrgSettings({ ...orgSettings, discounts: { ...orgSettings.discounts, bookingStaffMaxDiscount: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">সর্বোচ্চ ৫০ টাকা পর্যন্ত ছাড় দিতে পারবে</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ম্যানেজার লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-purple-600">৳</span>
                      <input
                        type="number"
                        value={orgSettings.discounts.managerMaxDiscount}
                        onChange={(e) => setOrgSettings({ ...orgSettings, discounts: { ...orgSettings.discounts, managerMaxDiscount: Number(e.target.value) } })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border rounded-xl font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">সর্বোচ্চ ২০০ টাকা পর্যন্ত ছাড় দিতে পারবে</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">এডমিন লিমিট</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-emerald-600">৳</span>
                      <input
                        type="text"
                        disabled
                        value="আনলিমিটেড (Full)"
                        className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-mono font-bold text-slate-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">অনুমোদন সাপেক্ষে সম্পূর্ণ ছাড় প্রযোজ্য</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 12: Finance & Day Closing */}
          {activeSection === 'finance' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '১২. অর্থ, ক্যাশ ড্রয়ার ও ডে ক্লোজিং হিসাব' : '12. Finance & Day Closing'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">দৈনিক হিসাব ক্লোজিং টাইম (Business Closing Time)</label>
                    <input
                      type="time"
                      value={orgSettings.finance.businessDayClosingTime}
                      onChange={(e) => setOrgSettings({ ...orgSettings, finance: { ...orgSettings.finance, businessDayClosingTime: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 dark:text-blue-200 block">ক্লোজিং-পরবর্তী এডিট লক</span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400">ডে ক্লোজিং সম্পন্ন হলে স্টাফরা আর পুরনো দিনের লেনদেন সংশোধন করতে পারবে না</span>
                    </div>
                    <Badge variant="primary">লক সক্রিয়</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 13: Income & Expense Categories */}
          {activeSection === 'categories' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'bn' ? '১৩. আয় ও ব্যয় ক্যাটাগরি ব্যবস্থাপনা (Add / Delete Tags)' : '13. Income & Expense Categories'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Income Categories */}
                  <div className="space-y-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-sm">আয় ক্যাটাগরি (Income Tags):</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIncomeCategory}
                        onChange={(e) => setNewIncomeCategory(e.target.value)}
                        placeholder="নতুন আয় ট্যাগ (e.g. পার্সেল বুকিং)..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                      />
                      <Button size="sm" variant="primary" onClick={handleAddIncomeCategory} className="font-bold rounded-xl text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> যোগ
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {orgSettings.categories.income.map((cat, idx) => (
                        <div key={idx} className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteIncomeCategory(cat)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Categories */}
                  <div className="space-y-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block text-sm">ব্যয় ক্যাটাগরি (Expense Tags):</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newExpenseCategory}
                        onChange={(e) => setNewExpenseCategory(e.target.value)}
                        placeholder="নতুন ব্যয় ট্যাগ (e.g. রোড ক্লিনার ভাতা)..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                      />
                      <Button size="sm" variant="danger" onClick={handleAddExpenseCategory} className="font-bold rounded-xl text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> যোগ
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {orgSettings.categories.expense.map((cat, idx) => (
                        <div key={idx} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpenseCategory(cat)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 14: Documents & Thermal Printing */}
          {activeSection === 'documents' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>{language === 'bn' ? '১৪. ডকুমেন্ট ও থার্মাল পিওএস প্রিন্ট সেটিংস' : '14. Documents & Thermal Print'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">ডিফল্ট প্রিন্ট সাইজ (POS Paper Format)</label>
                    <select
                      value={orgSettings.documents.paperSize}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, paperSize: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="THERMAL_80MM">৮০ মিমি থার্মাল পিওএস রসিদ (POS 80mm Receipt - Recommended)</option>
                      <option value="THERMAL_58MM">৫৮ মিমি পোর্টেবল ব্লুটুথ প্রিন্টার (POS 58mm)</option>
                      <option value="A4_FULL">এ৪ স্ট্যান্ডার্ড পূর্ণ পৃষ্ঠা ইনভয়েস (A4 Document)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টিকিটে কিউআর কোড (Live QR Code)</label>
                    <select
                      value={orgSettings.documents.showQrCodeOnTicket ? 'YES' : 'NO'}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, showQrCodeOnTicket: e.target.value === 'YES' } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="YES">হ্যাঁ - বাসের সুপারভাইজার স্ক্যানিংয়ের জন্য কিউআর কোড থাকবে</option>
                      <option value="NO">না - কিউআর কোড লুকানো থাকবে</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">টিকিটের শর্তাবলী ও নোটিশ (Terms & Conditions)</label>
                    <textarea
                      rows={3}
                      value={orgSettings.documents.termsAndConditionsText}
                      onChange={(e) => setOrgSettings({ ...orgSettings, documents: { ...orgSettings.documents, termsAndConditionsText: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 15: SMS Template Builder */}
          {activeSection === 'sms_templates' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '১৫. কাস্টম এসএমএস ও হোয়াটসঅ্যাপ টেমপ্লেট বিল্ডার' : '15. SMS Template Builder'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">১. টিকিট নিশ্চিতকরণ এসএমএস টেমপ্লেট (Booking Confirmation)</label>
                    <textarea
                      rows={3}
                      value={orgSettings.smsTemplates?.bookingConfirmation || ''}
                      onChange={(e) => setOrgSettings({ ...orgSettings, smsTemplates: { ...orgSettings.smsTemplates, bookingConfirmation: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
                    />
                    <div className="flex gap-1.5 mt-1 text-[10px] text-slate-400">
                      <span>ট্যাগসমূহ:</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">{'{student_name}'}</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">{'{bus_name}'}</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">{'{seats}'}</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">{'{trip_date}'}</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">{'{tracking_link}'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">২. পেমেন্ট রসিদ এসএমএস টেমপ্লেট (Payment Receipt)</label>
                    <textarea
                      rows={2}
                      value={orgSettings.smsTemplates?.paymentReceipt || ''}
                      onChange={(e) => setOrgSettings({ ...orgSettings, smsTemplates: { ...orgSettings.smsTemplates, paymentReceipt: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">৩. যাত্রা শুরুর রিমাইন্ডার এসএমএস (Trip Reminder)</label>
                    <textarea
                      rows={2}
                      value={orgSettings.smsTemplates?.tripReminder || ''}
                      onChange={(e) => setOrgSettings({ ...orgSettings, smsTemplates: { ...orgSettings.smsTemplates, tripReminder: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 16: Fuel & Mileage Rules */}
          {activeSection === 'fuel' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-amber-600" />
                  <span>{language === 'bn' ? '১৬. ফুয়েল ও ট্রিপ মাইলেজ অটো-ক্যালকুলেটর' : '16. Fuel & Mileage Rules'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">বর্তমান ডিজেল প্রতি লিটার দর (৳)</label>
                    <input
                      type="number"
                      value={orgSettings.fuel.currentPricePerLitre}
                      onChange={(e) => setOrgSettings({ ...orgSettings, fuel: { ...orgSettings.fuel, currentPricePerLitre: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5">টার্গেট মাইলেজ (কিমি / লিটার)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={orgSettings.fuel.targetKmPerLitre}
                      onChange={(e) => setOrgSettings({ ...orgSettings, fuel: { ...orgSettings.fuel, targetKmPerLitre: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 17: SMS & WhatsApp Gateways */}
          {activeSection === 'communication' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'bn' ? '১৭. এসএমএস ও হোয়াটসঅ্যাপ অটোমেশন গেটওয়ে' : '17. SMS & WhatsApp Automation'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Greenweb SMS Gateway</span>
                      <Badge variant="success">CONNECTED</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 block">বুকিং নিশ্চিত হলে পরীক্ষার্থীর মোবাইলে তৎক্ষণাৎ SMS পৌঁছে যায়।</span>
                  </div>

                  <div className="p-4 bg-green-50/50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-800 dark:text-green-300">WhatsApp Cloud API</span>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 block">শিক্ষার্থীর হোয়াটসঅ্যাপে সরাসরি টিকিট PDF এবং লাইভ বাস ট্র্যাকিং লিংক প্রদান।</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 18: Security & Session (EXPLICIT MINUTES) */}
          {activeSection === 'security' && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <span>{language === 'bn' ? '১৮. নিরাপত্তা, পাসওয়ার্ড ও সেশন ম্যানেজমেন্ট' : '18. Security & Session Management'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">সেশন টাইমআউট (মিনিট / Minutes)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={orgSettings.security.sessionTimeoutMinutes}
                        onChange={(e) => setOrgSettings({ ...orgSettings, security: { ...orgSettings.security, sessionTimeoutMinutes: Number(e.target.value) } })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                      />
                      <span className="font-bold text-slate-500 shrink-0">মিনিট (Min)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5">সর্বোচ্চ ভুল পাসওয়ার্ড লিমিট (Login Attempts)</label>
                    <input
                      type="number"
                      value={orgSettings.security.maxFailedLoginAttempts}
                      onChange={(e) => setOrgSettings({ ...orgSettings, security: { ...orgSettings.security, maxFailedLoginAttempts: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 19: Appearance & Themes */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <AppearanceSettingsClient />
            </div>
          )}

          {/* SECTION 20: Payment Brand Logos */}
          {activeSection === 'payment_logos' && (
            <div className="space-y-6">
              <PaymentLogosSettingsClient />
            </div>
          )}

          {/* SECTION 21: Database Backup & Hosting Migration */}
          {activeSection === 'database_backup' && (
            <div className="space-y-6">
              <DatabaseBackupClient />
            </div>
          )}

          {/* SECTION 22: Landing Page & Public Portal Control */}
          {activeSection === 'landing_control' && (
            <div className="space-y-6">
              <LandingControlClient />
            </div>
          )}
        </div>
      </div>

      {/* --- BRANCH MODAL (ADD & EDIT) --- */}
      {isBranchModalOpen && (
        <Modal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          title={editingBranchId ? (language === 'bn' ? 'শাখা / কাউন্টার সম্পাদনা করুন' : 'Edit Branch Counter') : (language === 'bn' ? 'নতুন কাউন্টার যোগ করুন' : 'Add New Counter Branch')}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">শাখার নাম *</label>
              <input
                type="text"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="e.g. গাবতলী প্রধান কাউন্টার"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">শাখা কোড *</label>
                <input
                  type="text"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. GAB"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="01711223344"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">কাউন্টার ম্যানেজার নাম</label>
              <input
                type="text"
                value={branchForm.managerName}
                onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                placeholder="e.g. রফিকুল ইসলাম"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">কাউন্টার ঠিকানা</label>
              <input
                type="text"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="e.g. কাউন্টার নং ১২, গাবতলী আন্তঃজেলা টার্মিনাল"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsBranchModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveBranch} className="font-bold">
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Branch'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- STOP MODAL (ADD & EDIT) --- */}
      {isStopModalOpen && (
        <Modal
          isOpen={isStopModalOpen}
          onClose={() => setIsStopModalOpen(false)}
          title={editingStopId ? (language === 'bn' ? 'বোর্ডিং পয়েন্ট সম্পাদনা' : 'Edit Boarding Stop') : (language === 'bn' ? 'নতুন বোর্ডিং পয়েন্ট যোগ করুন' : 'Add Boarding Stop')}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">পয়েন্টের নাম (বাংলা) *</label>
              <input
                type="text"
                value={stopForm.nameBn}
                onChange={(e) => setStopForm({ ...stopForm, nameBn: e.target.value })}
                placeholder="e.g. কল্যাণপুর বাসস্ট্যান্ড"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">এলাকা / জোন</label>
                <input
                  type="text"
                  value={stopForm.area}
                  onChange={(e) => setStopForm({ ...stopForm, area: e.target.value })}
                  placeholder="e.g. কল্যাণপুর"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">রুট ক্রমিক নম্বর (Sequence)</label>
                <input
                  type="number"
                  value={stopForm.sequence}
                  onChange={(e) => setStopForm({ ...stopForm, sequence: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stopForm.pickupEnabled}
                  onChange={(e) => setStopForm({ ...stopForm, pickupEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">পিকআপ পয়েন্ট হিসেবে সক্রিয় (Pickup Allowed)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stopForm.dropEnabled}
                  onChange={(e) => setStopForm({ ...stopForm, dropEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">ড্রপিং পয়েন্ট হিসেবে সক্রিয় (Drop Allowed)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsStopModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveStop} className="font-bold">
                {language === 'bn' ? 'পয়েন্ট সেভ করুন' : 'Save Stop'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- FARE ZONE MODAL (ADD & EDIT) --- */}
      {isFareZoneModalOpen && (
        <Modal
          isOpen={isFareZoneModalOpen}
          onClose={() => setIsFareZoneModalOpen(false)}
          title={language === 'bn' ? 'নতুন ফেয়ার জোন তৈরি' : 'Create Fare Zone'}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">জোনের নাম (বাংলা) *</label>
              <input
                type="text"
                value={fareZoneForm.nameBn}
                onChange={(e) => setFareZoneForm({ ...fareZoneForm, nameBn: e.target.value })}
                placeholder="e.g. মিডল স্ট্যান্ডার্ড সিট (F-H Row)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">ভাড়ার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  value={fareZoneForm.basePrice}
                  onChange={(e) => setFareZoneForm({ ...fareZoneForm, basePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">প্রযোজ্য সিট রো (কমা দিয়ে)</label>
                <input
                  type="text"
                  value={fareZoneForm.rowsStr}
                  onChange={(e) => setFareZoneForm({ ...fareZoneForm, rowsStr: e.target.value })}
                  placeholder="e.g. F, G, H"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">বিবরণ / সুবিধা</label>
              <input
                type="text"
                value={fareZoneForm.description}
                onChange={(e) => setFareZoneForm({ ...fareZoneForm, description: e.target.value })}
                placeholder="e.g. সাধারণ আরামদায়ক আসন"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsFareZoneModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveFareZone} className="font-bold">
                {language === 'bn' ? 'জোন সেভ করুন' : 'Save Zone'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- GUARDIAN MODAL (ADD) --- */}
      {isGuardianModalOpen && (
        <Modal
          isOpen={isGuardianModalOpen}
          onClose={() => setIsGuardianModalOpen(false)}
          title={language === 'bn' ? 'নতুন অভিভাবক সম্পর্ক যোগ' : 'Add Guardian Relationship'}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">সম্পর্কের নাম (বাংলা) *</label>
              <input
                type="text"
                value={guardianForm.nameBn}
                onChange={(e) => setGuardianForm({ ...guardianForm, nameBn: e.target.value })}
                placeholder="e.g. মামা / চাচা (Uncle)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianForm.allowedForFemaleBus}
                  onChange={(e) => setGuardianForm({ ...guardianForm, allowedForFemaleBus: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600"
                />
                <span className="font-bold text-pink-900 dark:text-pink-200">ছাত্রী কোচে সিট বরাদ্দ অনুমতি পাবে</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsGuardianModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveGuardian} className="font-bold">
                {language === 'bn' ? 'সম্পর্ক যুক্ত করুন' : 'Add Relationship'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- PAYMENT ACCOUNT MODAL (ADD & EDIT) --- */}
      {isPaymentAccountModalOpen && (
        <Modal
          isOpen={isPaymentAccountModalOpen}
          onClose={() => setIsPaymentAccountModalOpen(false)}
          title={language === 'bn' ? 'পেমেন্ট / ব্যাংক একাউন্ট কনফিগ' : 'Configure Payment Account'}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">একাউন্টের নাম *</label>
              <input
                type="text"
                value={paymentAccountForm.name}
                onChange={(e) => setPaymentAccountForm({ ...paymentAccountForm, name: e.target.value })}
                placeholder="e.g. বিকাশ মার্চেন্ট ২ / ডাচ বাংলা ব্যাংক"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">পদ্ধতি (Method)</label>
                <select
                  value={paymentAccountForm.type}
                  onChange={(e) => setPaymentAccountForm({ ...paymentAccountForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                >
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                  <option value="BANK">ব্যাংক (Bank Account)</option>
                  <option value="CASH">হাতে নগদ (Cash Counter)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">একাউন্টের ধরণ</label>
                <select
                  value={paymentAccountForm.accountType}
                  onChange={(e) => setPaymentAccountForm({ ...paymentAccountForm, accountType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                >
                  <option value="MERCHANT">মার্চেন্ট (Merchant)</option>
                  <option value="PERSONAL">পার্সোনাল (Personal)</option>
                  <option value="AGENT">এজেন্ট (Agent)</option>
                  <option value="CURRENT">কারেন্ট একাউন্ট (Bank Current)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">একাউন্ট / মোবাইল নম্বর *</label>
              <input
                type="text"
                value={paymentAccountForm.accountNumber}
                onChange={(e) => setPaymentAccountForm({ ...paymentAccountForm, accountNumber: e.target.value })}
                placeholder="01712345678 বা 20501234567890"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">পেমেন্ট নির্দেশনা (Instructions)</label>
              <input
                type="text"
                value={paymentAccountForm.instructions}
                onChange={(e) => setPaymentAccountForm({ ...paymentAccountForm, instructions: e.target.value })}
                placeholder="e.g. বিকাশ অ্যাপ থেকে Make Payment করুন"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsPaymentAccountModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePaymentAccount} className="font-bold">
                {language === 'bn' ? 'একাউন্ট সেভ করুন' : 'Save Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- COUPON MODAL (ADD & EDIT) --- */}
      {isCouponModalOpen && (
        <Modal
          isOpen={isCouponModalOpen}
          onClose={() => setIsCouponModalOpen(false)}
          title={editingCouponId ? (language === 'bn' ? 'কুপন সম্পাদনা' : 'Edit Coupon') : (language === 'bn' ? 'নতুন কুপন কোড তৈরি করুন' : 'Create New Promo Coupon')}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">কুপন কোড (Promo Code) *</label>
              <input
                type="text"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. RU_EXAM_50"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-black tracking-wider text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">ছাড়ের ধরণ</label>
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                >
                  <option value="FIXED">নির্দিষ্ট টাকা (Fixed BDT ৳)</option>
                  <option value="PERCENTAGE">শতকরা হার (Percentage %)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">ছাড়ের পরিমাণ *</label>
                <input
                  type="number"
                  value={couponForm.amount}
                  onChange={(e) => setCouponForm({ ...couponForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">সর্বোচ্চ ব্যবহার লিমিট</label>
                <input
                  type="number"
                  value={couponForm.maxUses}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">মেয়াদ উত্তীর্ণের তারিখ</label>
                <input
                  type="date"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">প্রযোজ্য বিশ্ববিদ্যালয় / টার্গেট রুট</label>
              <input
                type="text"
                value={couponForm.targetUniversity}
                onChange={(e) => setCouponForm({ ...couponForm, targetUniversity: e.target.value })}
                placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় (RU)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCouponModalOpen(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCoupon} className="font-bold">
                {language === 'bn' ? 'কুপন সেভ করুন' : 'Save Coupon'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
