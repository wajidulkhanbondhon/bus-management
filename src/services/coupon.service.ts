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

// In-memory cache of coupons fetched from the backend. This is NOT a source
// of truth and never fabricates coupons — it only mirrors server data so the
// list view doesn't flash empty on refetch.
let cachedCoupons: MarketingCoupon[] | null = null;

const STORAGE_KEY = 'atoms_marketing_coupons';

function mapApiToCoupon(c: any): MarketingCoupon {
  return {
    id: c.id || '',
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

function readLocalCache(): MarketingCoupon[] {
  if (typeof window === 'undefined') return cachedCoupons || [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : (cachedCoupons || []);
  } catch {
    return cachedCoupons || [];
  }
}

function writeLocalCache(coupons: MarketingCoupon[]): void {
  cachedCoupons = coupons;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch {
      // ignore quota errors
    }
  }
}

export function getMarketingCoupons(): MarketingCoupon[] {
  return readLocalCache();
}

export function saveMarketingCoupons(coupons: MarketingCoupon[]): void {
  writeLocalCache(coupons);
}

export async function fetchMarketingCoupons(): Promise<MarketingCoupon[]> {
  const res = await fastApiClient.getCoupons();
  if (res.success && Array.isArray(res.data)) {
    const mapped = res.data.map(mapApiToCoupon);
    writeLocalCache(mapped);
    return mapped;
  }
  // On failure return whatever was previously cached (real server data only).
  return readLocalCache();
}

export async function createMarketingCoupon(data: Omit<MarketingCoupon, 'id' | 'usageCount' | 'createdAt'>): Promise<MarketingCoupon> {
  const res = await fastApiClient.createCoupon(mapCouponToApi(data));
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to create coupon');
  }
  const created = mapApiToCoupon(res.data);
  writeLocalCache([created, ...readLocalCache()]);
  return created;
}

export async function toggleCouponActive(couponId: string): Promise<MarketingCoupon[]> {
  const res = await fastApiClient.toggleCoupon(couponId);
  if (!res.success) {
    throw new Error(res.error || 'Failed to toggle coupon');
  }
  const updated = readLocalCache().map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
  writeLocalCache(updated);
  return updated;
}

export async function deleteMarketingCoupon(couponId: string): Promise<MarketingCoupon[]> {
  const res = await fastApiClient.deleteCoupon(couponId);
  if (!res.success) {
    throw new Error(res.error || 'Failed to delete coupon');
  }
  const updated = readLocalCache().filter(c => c.id !== couponId);
  writeLocalCache(updated);
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

export async function validateAndCalculateCoupon(
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

  // Coupon validity is decided by the backend only — the client never
  // fabricates or grants discounts from locally-stored data.
  const res = await fastApiClient.validateCoupon(cleanCode, grossAmount, targetUniversity);
  if (res.success && res.data && res.data.valid) {
    return {
      isValid: true,
      discountType: res.data.discount_type || 'FIXED',
      discountRate: res.data.discount_value || 0,
      calculatedDiscount: res.data.calculated_discount || 0,
      message: `✅ কুপন "${res.data.code}" সফলভাবে কার্যকর হয়েছে! (${res.data.discount_type === 'FIXED' ? `৳${res.data.discount_value} ছাড়` : `${res.data.discount_value}% শতাংশ ছাড়`})`
    };
  }

  const message = res.data?.message || res.error || 'এই কুপন কোডটি সঠিক নয় বা সিস্টেমের ডাটাবেজে পাওয়া যায়নি।';
  return {
    isValid: false,
    discountType: 'FIXED',
    discountRate: 0,
    calculatedDiscount: 0,
    message,
  };
}
