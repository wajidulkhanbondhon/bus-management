import { fastApiClient } from '@/lib/api-client';

export interface MarketingCoupon {
  id: string;
  code: string;
  title: string;
  campaignChannel: 'FACEBOOK' | 'CAMPUS_BOOTH' | 'LEAFLET' | 'STUDENT_REFERRAL' | 'SMS_CAMPAIGN' | 'SPECIAL_EVENT';
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountLimit?: number;
  targetUniversity?: string;
  expiryDate?: string;
  maxUsageLimit: number;
  usageCount: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

const DEFAULT_COUPONS: MarketingCoupon[] = [
  {
    id: 'coup-001',
    code: 'ADMISSION100',
    title: 'ভর্তি পরীক্ষা স্পেশাল ফেসবুক ক্যাম্পেইন',
    campaignChannel: 'FACEBOOK',
    discountType: 'FIXED',
    discountValue: 100,
    targetUniversity: 'ALL',
    maxUsageLimit: 500,
    usageCount: 28,
    isActive: true,
    notes: 'ফেসবুক পেজ ক্যাম্পেইন থেকে প্রাপ্ত শিক্ষার্থীদের জন্য',
    createdAt: new Date().toISOString()
  },
  {
    id: 'coup-002',
    code: 'CAMPUS50',
    title: 'ক্যাম্পাস বুথ প্রমোশন ডিসকাউন্ট',
    campaignChannel: 'CAMPUS_BOOTH',
    discountType: 'FIXED',
    discountValue: 50,
    targetUniversity: 'ALL',
    maxUsageLimit: 1000,
    usageCount: 64,
    isActive: true,
    notes: 'বিভিন্ন কলেজ ও কোচিং ক্যাম্পাসে লিফলেট ও বুথ অফার',
    createdAt: new Date().toISOString()
  },
  {
    id: 'coup-003',
    code: 'PROMO10',
    title: 'স্পেশাল ১০% মেগা প্রমো কোড',
    campaignChannel: 'SMS_CAMPAIGN',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountLimit: 150,
    targetUniversity: 'ALL',
    maxUsageLimit: 200,
    usageCount: 15,
    isActive: true,
    notes: 'রেজিস্টার্ড স্টুডেন্টদের এসএমএস অফার',
    createdAt: new Date().toISOString()
  },
  {
    id: 'coup-004',
    code: 'SPECIAL200',
    title: 'ভাই-বোন ও গ্রুপ ভর্তি স্পেশাল',
    campaignChannel: 'SPECIAL_EVENT',
    discountType: 'FIXED',
    discountValue: 200,
    targetUniversity: 'ALL',
    maxUsageLimit: 100,
    usageCount: 7,
    isActive: true,
    notes: 'বিশেষ বিবেচনা ও গ্রুপ আবেদনকারীদের জন্য',
    createdAt: new Date().toISOString()
  }
];

const STORAGE_KEY = 'atoms_marketing_coupons';

function mapApiToCoupon(c: any): MarketingCoupon {
  return {
    id: c.id || `coup-${Date.now()}`,
    code: c.code || '',
    title: c.title || '',
    campaignChannel: c.campaign_channel || c.campaignChannel || 'FACEBOOK',
    discountType: c.discount_type || c.discountType || 'FIXED',
    discountValue: Number(c.discount_value ?? c.discountValue ?? 0),
    minPurchaseAmount: c.min_purchase_amount ? Number(c.min_purchase_amount) : (c.minPurchaseAmount ? Number(c.minPurchaseAmount) : undefined),
    maxDiscountLimit: c.max_discount_limit ? Number(c.max_discount_limit) : (c.maxDiscountLimit ? Number(c.maxDiscountLimit) : undefined),
    targetUniversity: c.target_university || c.targetUniversity || 'ALL',
    expiryDate: c.expiry_date || c.expiryDate || undefined,
    maxUsageLimit: Number(c.max_usage_limit ?? c.maxUsageLimit ?? 500),
    usageCount: Number(c.usage_count ?? c.usageCount ?? 0),
    isActive: c.is_active !== undefined ? c.is_active : (c.isActive !== undefined ? c.isActive : true),
    notes: c.notes || undefined,
    createdAt: c.created_at || c.createdAt || new Date().toISOString()
  };
}

function mapCouponToApi(c: Partial<MarketingCoupon>): any {
  return {
    code: c.code?.trim().toUpperCase(),
    title: c.title?.trim(),
    campaign_channel: c.campaignChannel,
    discount_type: c.discountType,
    discount_value: c.discountValue,
    min_purchase_amount: c.minPurchaseAmount,
    max_discount_limit: c.maxDiscountLimit,
    target_university: c.targetUniversity,
    expiry_date: c.expiryDate,
    max_usage_limit: c.maxUsageLimit,
    notes: c.notes
  };
}

export function getMarketingCoupons(): MarketingCoupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function saveMarketingCoupons(coupons: MarketingCoupon[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.error('Failed to save coupons:', e);
  }
}

export async function fetchMarketingCoupons(): Promise<MarketingCoupon[]> {
  try {
    const res = await fastApiClient.getCoupons();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const mapped = res.data.map(mapApiToCoupon);
      saveMarketingCoupons(mapped);
      return mapped;
    }
  } catch (e) {
    console.warn('FastAPI coupons fetch failed, fallback to cache:', e);
  }
  return getMarketingCoupons();
}

export async function createMarketingCouponAsync(data: Omit<MarketingCoupon, 'id' | 'usageCount' | 'createdAt'>): Promise<MarketingCoupon> {
  try {
    const apiPayload = mapCouponToApi(data);
    const res = await fastApiClient.createCoupon(apiPayload);
    if (res.success && res.data) {
      const created = mapApiToCoupon(res.data);
      const current = getMarketingCoupons().filter(c => c.id !== created.id);
      const updated = [created, ...current];
      saveMarketingCoupons(updated);
      return created;
    }
  } catch (e) {
    console.warn('API coupon create failed, using local save:', e);
  }
  return createMarketingCoupon(data);
}

export function createMarketingCoupon(data: Omit<MarketingCoupon, 'id' | 'usageCount' | 'createdAt'>): MarketingCoupon {
  const coupons = getMarketingCoupons();
  const newCoupon: MarketingCoupon = {
    ...data,
    id: `coup-${Date.now()}`,
    code: data.code.trim().toUpperCase(),
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  const updated = [newCoupon, ...coupons];
  saveMarketingCoupons(updated);

  // Background API attempt
  fastApiClient.createCoupon(mapCouponToApi(data)).catch(() => {});
  return newCoupon;
}

export async function toggleCouponActiveAsync(couponId: string): Promise<MarketingCoupon[]> {
  try {
    await fastApiClient.toggleCoupon(couponId);
  } catch (e) {
    console.warn('API coupon toggle failed:', e);
  }
  return toggleCouponActive(couponId);
}

export function toggleCouponActive(couponId: string): MarketingCoupon[] {
  const coupons = getMarketingCoupons();
  const updated = coupons.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
  saveMarketingCoupons(updated);
  return updated;
}

export async function deleteMarketingCouponAsync(couponId: string): Promise<MarketingCoupon[]> {
  try {
    await fastApiClient.deleteCoupon(couponId);
  } catch (e) {
    console.warn('API coupon delete failed:', e);
  }
  return deleteMarketingCoupon(couponId);
}

export function deleteMarketingCoupon(couponId: string): MarketingCoupon[] {
  const coupons = getMarketingCoupons();
  const updated = coupons.filter(c => c.id !== couponId);
  saveMarketingCoupons(updated);
  return updated;
}

export interface CouponApplyResult {
  isValid: boolean;
  coupon?: MarketingCoupon;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountRate: number;
  calculatedDiscount: number;
  message: string;
}

export async function validateAndCalculateCouponAsync(
  code: string,
  grossAmount: number,
  targetUniversity?: string
): Promise<CouponApplyResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন।'
    };
  }

  try {
    const res = await fastApiClient.validateCoupon(cleanCode, grossAmount, targetUniversity);
    if (res.success && res.data && res.data.valid) {
      return {
        isValid: true,
        discountType: res.data.discount_type || 'FIXED',
        discountRate: res.data.discount_value || 0,
        calculatedDiscount: res.data.calculated_discount || 0,
        message: `✅ কুপন "${res.data.code}" সফলভাবে কার্যকর হয়েছে! (${res.data.discount_type === 'FIXED' ? `৳${res.data.discount_value} ছাড়` : `${res.data.discount_value}% শতাংশ ছাড়`})`
      };
    }
  } catch {
    // fallback to local calculation
  }

  return validateAndCalculateCoupon(code, grossAmount, targetUniversity);
}

export function validateAndCalculateCoupon(
  code: string,
  grossAmount: number,
  targetUniversity?: string
): CouponApplyResult {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন।'
    };
  }

  const coupons = getMarketingCoupons();
  const found = coupons.find(c => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: '❌ দুঃখিত, এই কুপন কোডটি সঠিক নয় বা সিস্টেমের ডাটাবেজে পাওয়া যায়নি।'
    };
  }

  if (!found.isActive) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: '❌ এই কুপন কোডটি বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে।'
    };
  }

  if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: '❌ এই কুপনটির মেয়াদের সময়সীমা শেষ হয়ে গেছে।'
    };
  }

  if (found.usageCount >= found.maxUsageLimit) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: '❌ এই কুপনের সর্বোচ্চ ব্যবহারের লিমিট পূর্ণ হয়ে গেছে।'
    };
  }

  if (found.minPurchaseAmount && grossAmount < found.minPurchaseAmount) {
    return {
      isValid: false,
      discountType: 'FIXED',
      discountRate: 0,
      calculatedDiscount: 0,
      message: `❌ এই কুপনটি পেতে ন্যূনতম ৳${found.minPurchaseAmount} টাকার টিকিট বুক করতে হবে।`
    };
  }

  // Calculate actual discount amount
  let calculatedDiscount = 0;
  if (found.discountType === 'FIXED') {
    calculatedDiscount = Math.min(found.discountValue, grossAmount);
  } else {
    calculatedDiscount = Math.round((grossAmount * found.discountValue) / 100);
    if (found.maxDiscountLimit && calculatedDiscount > found.maxDiscountLimit) {
      calculatedDiscount = found.maxDiscountLimit;
    }
  }

  return {
    isValid: true,
    coupon: found,
    discountType: found.discountType,
    discountRate: found.discountValue,
    calculatedDiscount,
    message: `✅ কুপন "${found.code}" সফলভাবে কার্যকর হয়েছে! (${found.discountType === 'FIXED' ? `৳${found.discountValue} ছাড়` : `${found.discountValue}% শতাংশ ছাড়`})`
  };
}
