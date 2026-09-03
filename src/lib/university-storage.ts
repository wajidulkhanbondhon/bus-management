'use client';

export interface UniversityItem {
  id: string;
  nameBn: string;
  nameEn: string;
  cluster: 'GENERAL' | 'ENGG' | 'AGRI' | 'MED' | 'SCIENCE_TECH' | 'PRIVATE' | 'SPECIAL' | 'OTHER';
  district?: string;
  isCustom?: boolean;
  units?: string[];
}

export const RU_UNITS = [
  'A Unit (মানবিক, আইন, সামাজিক বিজ্ঞান ও চারুকলা)',
  'B Unit (ব্যবসায় শিক্ষা ও আইবিএ)',
  'C Unit (বিজ্ঞান, কৃষি ও প্রকৌশল)'
];

export const DU_UNITS = [
  'Ka / A Unit (বিজ্ঞান অনুষদ)',
  'Kha / B Unit (কলা, আইন ও সামাজিক বিজ্ঞান অনুষদ)',
  'Ga / C Unit (ব্যবসায় শিক্ষা অনুষদ)',
  'Cha Unit (চারুকলা অনুষদ)',
  'IBA (ইনস্টিটিউট অব বিজনেস অ্যাডমিনিস্ট্রেশন)'
];

export const JU_UNITS = [
  'A Unit (গাণিতিক ও পদার্থ বিষয়ক অনুষদ)',
  'B Unit (সমাজবিজ্ঞান ও আইন অনুষদ)',
  'C Unit (কলা ও মানবিক অনুষদ)',
  'C1 Unit (নাট্যতত্ত্ব ও চারুকলা বিভাগ)',
  'D Unit (জীববিজ্ঞান অনুষদ)',
  'E Unit (বিজনেস স্টাডিজ অনুষদ)',
  'IBA-JU (ইনস্টিটিউট অব বিজনেস অ্যাডমিনিস্ট্রেশন)'
];

export const CU_UNITS = [
  'A Unit (বিজ্ঞান অনুষদ ও মেরিন সায়েন্স)',
  'B Unit (কলা ও মানবিক অনুষদ)',
  'B1 Unit (উপ-ইউনিট: নাট্যকলা, সঙ্গীত ও চারুকলা)',
  'C Unit (ব্যবসায় প্রশাসন অনুষদ)',
  'D Unit (সম্মিলিত / সামাজিক বিজ্ঞান অনুষদ)',
  'D1 Unit (উপ-ইউনিট: শারীরিক শিক্ষা ও ক্রীড়া বিজ্ঞান)'
];

export const GST_UNITS = [
  'A Unit (বিজ্ঞান অনুষদ)',
  'B Unit (মানবিক অনুষদ)',
  'C Unit (বাণিজ্য / ব্যবসায় শিক্ষা অনুষদ)'
];

export const BUET_UNITS = [
  'Ka Group (প্রকৌশল ও নগর ও অঞ্চল পরিকল্পনা)',
  'Kha Group (প্রকৌশল, নগর পরিকল্পনা ও স্থাপত্য/আর্কিটেকচার)'
];

export const ENGG_UNITS = [
  'Ka Group (প্রকৌশল ও নগর ও অঞ্চল পরিকল্পনা)',
  'Kha Group (প্রকৌশল, নগর পরিকল্পনা ও স্থাপত্য/আর্কিটেকচার)'
];

export const AGRI_UNITS = [
  'Agri Combined Cluster Unit (কৃষি গুচ্ছ সমন্বিত ইউনিট)'
];

export const MED_UNITS = [
  'MBBS Medical (সরকারি ও বেসরকারি মেডিকেল কলেজ)',
  'BDS Dental (বিডিএস ডেন্টাল কলেজ ও ডেন্টাল ইউনিট)',
  'AFMC / AMC (আর্মড ফোর্সেস মেডিকেল কলেজ)'
];

export const DEFAULT_FALLBACK_UNITS = [
  'A Unit (বিজ্ঞান)',
  'B Unit (মানবিক / কলা)',
  'C Unit (বাণিজ্য / ব্যবসা)',
  'D Unit (সম্মিলিত / পরিবর্তন)',
  'Engineering Group',
  'Medical / Dental'
];

export const DEFAULT_UNIVERSITIES: UniversityItem[] = [
  { id: 'RU', nameBn: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', nameEn: 'Rajshahi University (RU)', cluster: 'GENERAL', district: 'রাজশাহী', units: RU_UNITS },
  { id: 'DU', nameBn: 'ঢাকা বিশ্ববিদ্যালয় (DU)', nameEn: 'Dhaka University (DU)', cluster: 'GENERAL', district: 'ঢাকা', units: DU_UNITS },
  { id: 'CU', nameBn: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', nameEn: 'Chittagong University (CU)', cluster: 'GENERAL', district: 'চট্টগ্রাম', units: CU_UNITS },
  { id: 'JU', nameBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)', nameEn: 'Jahangirnagar University (JU)', cluster: 'GENERAL', district: 'সাভার, ঢাকা', units: JU_UNITS },
  { id: 'GST', nameBn: 'জিএসটি গুচ্ছ (GST Cluster - ২৪ বিশ্ববিদ্যালয়)', nameEn: 'GST Cluster (24 Universities)', cluster: 'GENERAL', district: 'সারাদেশ', units: GST_UNITS },
  { id: 'BUET', nameBn: 'বুয়েট (BUET)', nameEn: 'BUET Engineering', cluster: 'ENGG', district: 'ঢাকা', units: BUET_UNITS },
  { id: 'ENGG', nameBn: 'ইঞ্জিনিয়ারিং গুচ্ছ (RUET, CUET, KUET)', nameEn: 'Engg Cluster (CKRUET)', cluster: 'ENGG', district: 'রাজশাহী/খুলনা/চট্টগ্রাম', units: ENGG_UNITS },
  { id: 'KUET', nameBn: 'কুয়েট খুলনা (KUET)', nameEn: 'KUET Khulna', cluster: 'ENGG', district: 'খুলনা', units: ENGG_UNITS },
  { id: 'RUET', nameBn: 'রুয়েট রাজশাহী (RUET)', nameEn: 'RUET Rajshahi', cluster: 'ENGG', district: 'রাজশাহী', units: ENGG_UNITS },
  { id: 'CUET', nameBn: 'চুয়েট চট্টগ্রাম (CUET)', nameEn: 'CUET Chittagong', cluster: 'ENGG', district: 'চট্টগ্রাম', units: ENGG_UNITS },
  { id: 'SUST', nameBn: 'সাস্ট সিলেট (SUST)', nameEn: 'SUST Sylhet', cluster: 'SCIENCE_TECH', district: 'সিলেট', units: ['A Unit (Science & Tech)', 'B Unit (Social Science & Arts)'] },
  { id: 'AGRI', nameBn: 'কৃষি গুচ্ছ (Agri Cluster - ৯ বিশ্ববিদ্যালয়)', nameEn: 'Agri Universities Cluster', cluster: 'AGRI', district: 'সারাদেশ', units: AGRI_UNITS },
  { id: 'BAU', nameBn: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU)', nameEn: 'BAU Mymensingh', cluster: 'AGRI', district: 'ময়মনসিংহ', units: AGRI_UNITS },
  { id: 'MED', nameBn: 'মেডিকেল ও ডেন্টাল (Medical & Dental)', nameEn: 'Medical & Dental Colleges', cluster: 'MED', district: 'সারাদেশ', units: MED_UNITS },
  { id: 'JNU', nameBn: 'জগন্নাথ বিশ্ববিদ্যালয় (JnU)', nameEn: 'Jagannath University (JnU)', cluster: 'GENERAL', district: 'ঢাকা', units: ['A Unit (বিজ্ঞান)', 'B Unit (কলা ও আইন)', 'C Unit (বাণিজ্য)', 'D Unit (সামাজিক বিজ্ঞান)', 'E Unit (চারুকলা)'] },
  { id: 'BUP', nameBn: 'বিইউপি (BUP)', nameEn: 'Bangladesh University of Professionals (BUP)', cluster: 'SPECIAL', district: 'মিরপুর, ঢাকা', units: ['FASS (কলা ও সমাজবিজ্ঞান)', 'FBS (বিজনেস স্টাডিজ)', 'FST (বিজ্ঞান ও প্রযুক্তি)', 'FSSS (নিরাপত্তা ও কৌশলগত বিদ্যা)'] },
  { id: 'IU', nameBn: 'ইসলামী বিশ্ববিদ্যালয় কুষ্টিয়া (IU)', nameEn: 'Islamic University (IU)', cluster: 'GENERAL', district: 'কুষ্টিয়া', units: ['A Unit (বিজ্ঞান ও প্রযুক্তি)', 'B Unit (কলা ও সামাজিক বিজ্ঞান)', 'C Unit (ব্যবসায় প্রশাসন)', 'D Unit (ধর্মতত্ত্ব ও ইসলামিক স্টাডিজ)'] },
  { id: 'COU', nameBn: 'কুমিল্লা বিশ্ববিদ্যালয় (CoU)', nameEn: 'Comilla University (CoU)', cluster: 'GENERAL', district: 'কুমিল্লা', units: GST_UNITS },
  { id: 'BRUR', nameBn: 'বেগম রোকেয়া বিশ্ববিদ্যালয় (BRUR)', nameEn: 'Begum Rokeya University (BRUR)', cluster: 'GENERAL', district: 'রংপুর', units: GST_UNITS },
  { id: 'PSTU', nameBn: 'পটুয়াখালী বিজ্ঞান ও প্রযুক্তি (PSTU)', nameEn: 'Patuakhali Science & Tech Univ (PSTU)', cluster: 'SCIENCE_TECH', district: 'পটুয়াখালী', units: GST_UNITS },
  { id: 'HSTU', nameBn: 'হাজী দানেশ বিজ্ঞান ও প্রযুক্তি (HSTU)', nameEn: 'Hajee Danesh Science & Tech (HSTU)', cluster: 'SCIENCE_TECH', district: 'দিনাজপুর', units: GST_UNITS },
  { id: 'MBSTU', nameBn: 'মওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি (MBSTU)', nameEn: 'Mawlana Bhashani Science & Tech (MBSTU)', cluster: 'SCIENCE_TECH', district: 'টাঙ্গাইল', units: GST_UNITS },
  { id: 'NSTU', nameBn: 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি (NSTU)', nameEn: 'Noakhali Science & Tech Univ (NSTU)', cluster: 'SCIENCE_TECH', district: 'নোয়াখালী', units: GST_UNITS },
  { id: 'JUST', nameBn: 'যশোর বিজ্ঞান ও প্রযুক্তি (JUST)', nameEn: 'Jashore Science & Tech Univ (JUST)', cluster: 'SCIENCE_TECH', district: 'যশোর', units: GST_UNITS },
  { id: 'BSMRSTU', nameBn: 'বশেমুরবিপ্রবি গোপালগঞ্জ (BSMRSTU)', nameEn: 'Bangabandhu Science & Tech (BSMRSTU)', cluster: 'SCIENCE_TECH', district: 'গোপালগঞ্জ', units: GST_UNITS }
];

const STORAGE_KEY = 'custom_universities_v1';

export function getStoredUniversities(): UniversityItem[] {
  if (typeof window === 'undefined') return DEFAULT_UNIVERSITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UNIVERSITIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored universities', e);
  }
  return DEFAULT_UNIVERSITIES;
}

export function saveStoredUniversities(universities: UniversityItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(universities));
  } catch (e) {
    console.error('Failed to save universities', e);
  }
}

export function addStoredUniversity(newUni: UniversityItem): UniversityItem[] {
  const current = getStoredUniversities();
  let uniqueId = newUni.id.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  if (!uniqueId) {
    uniqueId = `UNI_${Date.now().toString().slice(-4)}`;
  }

  const existingIdx = current.findIndex(u => u.id.toUpperCase() === uniqueId);
  let updated: UniversityItem[];
  if (existingIdx > -1) {
    updated = current.map((u, idx) => idx === existingIdx ? { ...newUni, id: uniqueId, isCustom: true } : u);
  } else {
    updated = [{ ...newUni, id: uniqueId, isCustom: true }, ...current];
  }

  saveStoredUniversities(updated);
  return updated;
}

export function deleteStoredUniversity(id: string): UniversityItem[] {
  const current = getStoredUniversities();
  const updated = current.filter(u => u.id !== id);
  saveStoredUniversities(updated);
  return updated;
}

export function getUniversityUnits(uniNameOrId?: string, customList?: UniversityItem[]): string[] {
  if (!uniNameOrId) return DEFAULT_FALLBACK_UNITS;
  const list = customList || getStoredUniversities();
  const lower = uniNameOrId.toLowerCase().trim();

  // 1. Direct ID or Name Match
  const found = list.find(u =>
    u.id.toLowerCase() === lower ||
    u.nameBn.toLowerCase() === lower ||
    (u.nameEn && u.nameEn.toLowerCase() === lower) ||
    lower.includes(u.nameBn.toLowerCase()) ||
    (u.id.length >= 2 && lower.includes(`(${u.id.toLowerCase()})`))
  );

  if (found && found.units && found.units.length > 0) {
    return found.units;
  }

  // 2. Keyword-based matching
  if (lower.includes('রাবি') || lower.includes('রাজশাহী') || lower.includes('ru')) return RU_UNITS;
  if (lower.includes('ঢাবি') || lower.includes('ঢাকা') || lower.includes('du')) return DU_UNITS;
  if (lower.includes('জাবি') || lower.includes('জাহাঙ্গীরনগর') || lower.includes('ju')) return JU_UNITS;
  if (lower.includes('চবি') || lower.includes('চট্টগ্রাম') || lower.includes('cu')) return CU_UNITS;
  if (lower.includes('গুচ্ছ') || lower.includes('gst')) return GST_UNITS;
  if (lower.includes('বুয়েট') || lower.includes('buet')) return BUET_UNITS;
  if (lower.includes('ইঞ্জিনিয়ারিং') || lower.includes('রুয়েট') || lower.includes('কুয়েট') || lower.includes('চুয়েট') || lower.includes('ckruet')) return ENGG_UNITS;
  if (lower.includes('মেডিকেল') || lower.includes('dental') || lower.includes('mbbs') || lower.includes('med')) return MED_UNITS;
  if (lower.includes('কৃষি') || lower.includes('agri') || lower.includes('bau')) return AGRI_UNITS;

  return DEFAULT_FALLBACK_UNITS;
}

