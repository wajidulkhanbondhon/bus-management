/**
 * Passenger Directory & Phone Number Lookup Service
 * Provides instant auto-suggestion of passenger names, gender, and student details
 * when typing mobile numbers in the booking wizard and counter desk.
 */

export interface DirectoryPassenger {
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  passengerType: 'STUDENT' | 'GUARDIAN';
  admissionId?: string;
  institution?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
}

// Built-in recurring admission candidate & student directory
export const DEFAULT_PASSENGER_DIRECTORY: DirectoryPassenger[] = [
  {
    name: 'তানভীর আহমেদ (Tanvir Ahmed)',
    phone: '01711223344',
    gender: 'MALE',
    passengerType: 'STUDENT',
    admissionId: 'DU-A-2026-8812',
    institution: 'Dhaka College',
    guardianPhone: '01711998877',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'সুমাইয়া আক্তার (Sumaiya Akter)',
    phone: '01811223344',
    gender: 'FEMALE',
    passengerType: 'STUDENT',
    admissionId: 'DU-KA-9901',
    institution: 'Viqarunnisa Noon College',
    guardianPhone: '01811001122',
    guardianRelationship: 'MOTHER'
  },
  {
    name: 'মাহমুদুল হাসান (Mahmudul Hasan)',
    phone: '01911223344',
    gender: 'MALE',
    passengerType: 'STUDENT',
    admissionId: 'RU-C-4521',
    institution: 'Notre Dame College',
    guardianPhone: '01911998811',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'নুসরাত জাহান (Nusrat Jahan)',
    phone: '01755443322',
    gender: 'FEMALE',
    passengerType: 'STUDENT',
    admissionId: 'JU-D-1029',
    institution: 'Holy Cross College',
    guardianPhone: '01755990011',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'সাদিয়া ইসলাম (Sadia Islam)',
    phone: '01611223344',
    gender: 'FEMALE',
    passengerType: 'STUDENT',
    admissionId: 'GST-A-7731',
    institution: 'Rajuk Uttara Model College',
    guardianPhone: '01611887766',
    guardianRelationship: 'MOTHER'
  },
  {
    name: 'আরিফুল ইসলাম (Ariful Islam)',
    phone: '01511223344',
    gender: 'MALE',
    passengerType: 'STUDENT',
    admissionId: 'BUET-ARCH-304',
    institution: 'Dhaka Residential Model College',
    guardianPhone: '01511990022',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'ফারহানা ইয়াসমিন (Farhana Yasmin)',
    phone: '01311223344',
    gender: 'FEMALE',
    passengerType: 'STUDENT',
    admissionId: 'CU-B-6102',
    institution: 'Chittagong College',
    guardianPhone: '01311889900',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'রফিকুল ইসলাম (Rafiqul Islam - Guardian)',
    phone: '01711998877',
    gender: 'MALE',
    passengerType: 'GUARDIAN',
    guardianRelationship: 'FATHER'
  },
  {
    name: 'শিরিন আক্তার (Shirin Akter - Guardian)',
    phone: '01811001122',
    gender: 'FEMALE',
    passengerType: 'GUARDIAN',
    guardianRelationship: 'MOTHER'
  }
];

/**
 * Searches the passenger directory by phone number (supports partial and full matching)
 */
export function lookupPassengerByPhone(phoneNumber: string): DirectoryPassenger | null {
  if (!phoneNumber) return null;
  const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');
  if (cleanPhone.length < 5) return null;

  // 1. Check local storage cache if available
  let localCache: DirectoryPassenger[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('atoms_passenger_history');
      if (saved) {
        localCache = JSON.parse(saved);
      }
    } catch {
      localCache = [];
    }
  }

  const allRecords = [...localCache, ...DEFAULT_PASSENGER_DIRECTORY];

  // Try exact match first
  const exact = allRecords.find(p => p.phone.replace(/[\s\-\+]/g, '') === cleanPhone);
  if (exact) return exact;

  // If 8 or more digits entered, try startsWith or endsWith
  if (cleanPhone.length >= 8) {
    const partial = allRecords.find(p => {
      const pClean = p.phone.replace(/[\s\-\+]/g, '');
      return pClean.includes(cleanPhone) || cleanPhone.includes(pClean);
    });
    if (partial) return partial;
  }

  return null;
}

/**
 * Saves a new passenger record into the local history directory for future auto-suggestions
 */
export function recordPassengerInDirectory(passenger: DirectoryPassenger) {
  if (typeof window === 'undefined' || !passenger.phone || !passenger.name) return;
  try {
    const cleanPhone = passenger.phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.length < 11) return;

    let existing: DirectoryPassenger[] = [];
    const saved = localStorage.getItem('atoms_passenger_history');
    if (saved) {
      existing = JSON.parse(saved);
    }

    const filtered = existing.filter(p => p.phone.replace(/[\s\-\+]/g, '') !== cleanPhone);
    filtered.unshift(passenger);

    // Keep up to 200 most recent records
    const trimmed = filtered.slice(0, 200);
    localStorage.setItem('atoms_passenger_history', JSON.stringify(trimmed));
  } catch {
    // Ignore localStorage write error
  }
}

/**
 * Checks if a specific phone number already has a registered 4-digit PIN
 */
export function hasRegisteredPin(phone: string): boolean {
  if (typeof window === 'undefined' || !phone) return false;
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.length < 11) return false;

  try {
    // 1. Check primary active session
    const activePhone = localStorage.getItem('atoms_passenger_phone');
    const activePin = localStorage.getItem('atoms_passenger_pin');
    if (activePhone && activePin && activePhone.replace(/[\s\-\+]/g, '') === cleanPhone) {
      return activePin.length === 4;
    }

    // 2. Check multi-user PIN registry
    const registryStr = localStorage.getItem('atoms_passenger_pins');
    if (registryStr) {
      const registry: Record<string, string> = JSON.parse(registryStr);
      if (registry[cleanPhone] && registry[cleanPhone].length === 4) {
        return true;
      }
    }
  } catch {
    // Ignore parse error
  }

  return false;
}

/**
 * Retrieves the registered PIN for a phone number if it exists
 */
export function getStoredPin(phone: string): string | null {
  if (typeof window === 'undefined' || !phone) return null;
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');

  try {
    const activePhone = localStorage.getItem('atoms_passenger_phone');
    const activePin = localStorage.getItem('atoms_passenger_pin');
    if (activePhone && activePin && activePhone.replace(/[\s\-\+]/g, '') === cleanPhone) {
      return activePin;
    }

    const registryStr = localStorage.getItem('atoms_passenger_pins');
    if (registryStr) {
      const registry: Record<string, string> = JSON.parse(registryStr);
      if (registry[cleanPhone]) return registry[cleanPhone];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Saves or updates a student/passenger PIN and creates/updates directory profile
 */
export function savePassengerPin(
  phone: string,
  pin: string,
  name?: string,
  meta?: Partial<DirectoryPassenger>
) {
  if (typeof window === 'undefined' || !phone || !pin) return;
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.length < 11 || pin.length !== 4) return;

  try {
    // 1. Update active session
    localStorage.setItem('atoms_passenger_phone', cleanPhone);
    localStorage.setItem('atoms_passenger_pin', pin);

    // 2. Update multi-user registry
    let registry: Record<string, string> = {};
    const registryStr = localStorage.getItem('atoms_passenger_pins');
    if (registryStr) {
      try {
        registry = JSON.parse(registryStr);
      } catch {
        registry = {};
      }
    }
    registry[cleanPhone] = pin;
    localStorage.setItem('atoms_passenger_pins', JSON.stringify(registry));

    // 3. Save to directory profile
    if (name) {
      recordPassengerInDirectory({
        name: name.trim(),
        phone: cleanPhone,
        gender: meta?.gender || 'MALE',
        passengerType: meta?.passengerType || 'STUDENT',
        admissionId: meta?.admissionId,
        institution: meta?.institution,
        guardianPhone: meta?.guardianPhone,
        guardianRelationship: meta?.guardianRelationship
      });
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generates an authentic WhatsApp web/app link to send PIN details to student's WhatsApp for secure backup
 */
export function generateWhatsAppPinUrl(phone: string, pin: string, name?: string): string {
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  // Format for Bangladesh (+880...)
  const bdNumber = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : `880${cleanPhone}`;

  const displayName = name?.trim() || 'শিক্ষার্থী';
  const message = `স্বাগতম ${displayName}! 🚌✨\n\nআপনার ATOMS এক্সপ্রেস শিক্ষার্থী পোর্টাল সফলভাবে সেট হয়েছে।\n📱 মোবাইল নম্বর: ${cleanPhone}\n🔐 গোপন পিন কোড: ${pin}\n\n⚠️ পিন নম্বরটি কাউকে শেয়ার করবেন না। এটি আপনার টিকিট ডাউনলোড ও বাস ট্র্যাকিং এর জন্য সংরক্ষিত রাখুন।\n\n🌐 লগইন করুন: https://atomsbus.bd/passenger`;

  return `https://wa.me/${bdNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Checks if there are mock or actual offline counter bookings associated with this phone
 */
export function checkHasExistingBookings(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.length < 11) return false;

  // Pre-configured default directory users all have demo counter bookings
  const isDefaultDir = DEFAULT_PASSENGER_DIRECTORY.some(
    p => p.phone.replace(/[\s\-\+]/g, '') === cleanPhone
  );
  if (isDefaultDir) return true;

  // Check locally saved bookings cache
  if (typeof window !== 'undefined') {
    try {
      const savedBookings = localStorage.getItem('atoms_offline_bookings');
      if (savedBookings) {
        const list = JSON.parse(savedBookings);
        return list.some((b: any) => b.contactPhone?.replace(/[\s\-\+]/g, '') === cleanPhone);
      }
    } catch {
      return false;
    }
  }

  // Any valid BD phone number can access their bookings
  return false;
}

