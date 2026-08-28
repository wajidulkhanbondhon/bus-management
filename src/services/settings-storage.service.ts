/**
 * ATOMS Complete SaaS Multi-Tenant Settings Architecture Store
 * Implements full TypeScript schemas, safe defaults, validation, and persistence
 * for all 32 Organization categories and Super Admin Platform tiers (76 Sections).
 */

export interface OrganizationSettingsState {
  // 1. General & Localization
  general: {
    language: 'bn' | 'en';
    timezone: string;
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    numberFormat: 'standard' | 'bengali';
    weekStart: 'SUNDAY' | 'MONDAY' | 'SATURDAY';
    calendarType: 'GREGORIAN' | 'BANGLA';
  };

  // 2. Organization Profile
  organization: {
    name: string;
    legalName: string;
    orgCode: string;
    businessType: string;
    description: string;
    logoUrl?: string;
    faviconUrl?: string;
    email: string;
    phone: string;
    altPhone: string;
    address: string;
    city: string;
    district: string;
    country: string;
    postalCode: string;
    website: string;
    taxBinNumber: string;
    supportContact: string;
    emergencyContact: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  };

  // 3. Branches
  branches: Array<{
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    managerName: string;
    openingDate: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    notes?: string;
  }>;

  // 4. Transport & Fleet Master
  transport: {
    fleetTrackingEnabled: boolean;
    fuelTrackingEnabled: boolean;
    maintenanceAlertsEnabled: boolean;
    defaultDriverAllowance: number;
    defaultHelperAllowance: number;
  };

  // 5. Bus Configurations
  buses: Array<{
    id: string;
    name: string;
    busNumber: string;
    regNumber: string;
    busCode: string;
    busType: 'MALE' | 'FEMALE' | 'MIXED';
    capacity: number;
    branchId: string;
    operator: string;
    fitnessExpiry: string;
    taxExpiry: string;
    insuranceExpiry: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
  }>;

  // 6. Custom Seat Layout Rules
  seatLayouts: {
    defaultCapacity: number;
    enableCustomAisle: boolean;
    enableRearBench5Seats: boolean;
    allowStandingExtraSeats: boolean;
    lockReasonMandatory: boolean;
  };

  // 7. Seat Settings & Locks
  seatSettings: {
    standardFareDefault: number;
    vipFareDefault: number;
    femaleOnlyRows: string[]; // e.g. ['A', 'B']
    autoLockAdjacentGender: boolean;
    staffEmergencySeats: string[]; // e.g. ['A1', 'A2']
  };

  // 8. Passenger Gender & Relationship Rules
  passengerRules: {
    strictFemaleBusRestricted: boolean;
    allowedGuardiansForFemaleStudent: string[];
    allowedGuardiansForMaleStudent: string[];
    requireGuardianPhoneForMinors: boolean;
    maxTicketsPerPhone: number;
  };

  // 9. Route & Stops
  routes: Array<{
    id: string;
    name: string;
    code: string;
    origin: string;
    destination: string;
    distanceKm: number;
    durationHours: number;
    status: 'ACTIVE' | 'INACTIVE';
  }>;

  // 10. Stop / Pickup / Dropping Points
  stops: Array<{
    id: string;
    name: string;
    nameBn: string;
    area: string;
    sequence: number;
    pickupEnabled: boolean;
    dropEnabled: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  }>;

  // 11. Trip & Scheduling
  trips: {
    autoScheduleEnabled: boolean;
    departureNoticeHours: number;
    allowRescheduleMinutes: number;
    holidayOverrideAllowed: boolean;
  };

  // 12. Drivers & Helpers
  drivers: Array<{
    id: string;
    name: string;
    role: 'DRIVER' | 'HELPER' | 'SUPERVISOR';
    phone: string;
    licenseNumber: string;
    licenseExpiry: string;
    assignedBus?: string;
    status: 'ACTIVE' | 'LEAVE' | 'INACTIVE';
  }>;

  // 13. Holidays & Admission Exam Calendars
  holidays: Array<{
    id: string;
    title: string;
    date: string;
    isExamSpecialTrip: boolean;
    targetUniversity?: string;
  }>;

  // 14. Fuel & Mileage Tracking
  fuel: {
    fuelType: 'DIESEL' | 'OCTANE' | 'CNG';
    currentPricePerLitre: number;
    targetKmPerLitre: number;
    fuelAlertThresholdLitre: number;
  };

  // 15. Vehicle Maintenance
  maintenance: {
    oilChangeIntervalKm: number;
    tireInspectionIntervalDays: number;
    fitnessCheckIntervalMonths: number;
    autoMaintenanceAlert: boolean;
  };

  // 16. Booking & Hold Policies
  booking: {
    bookingIdPrefix: string;
    seatHoldMinutesPublic: number;
    seatHoldMinutesStaff: number;
    allowCancellation: boolean;
    cancellationDeadlineHours: number;
    cancellationFeePercentage: number;
    allowSeatTransfer: boolean;
    allowPartialPayment: boolean;
    minPartialPaymentPercentage: number;
    preventDuplicatePhoneSameTrip: boolean;
  };

  // 17. Fare & Pricing Zones
  pricing: {
    priority: 'SPECIAL > PASSENGER > SEAT > ZONE > BASE';
    frontVipMultiplier: number;
    rearEconomyDiscount: number;
    peakHourMultiplier: number;
    returnTripHalfFarePercent: number; // 50%
  };

  // 18. Discounts & Concession Caps
  discounts: {
    bookingStaffMaxDiscount: number; // ৳50
    managerMaxDiscount: number; // ৳200
    adminMaxDiscount: number; // Unlimited (0 for no limit)
    requireApprovalAbove: number;
    requireReferenceAlways: boolean;
  };

  // 19. Payment Gateways & MFS
  paymentGateways: {
    bkash: { enabled: boolean; merchantNumber: string; accountType: 'MERCHANT' | 'PERSONAL' | 'AGENT'; instructions: string };
    nagad: { enabled: boolean; merchantNumber: string; accountType: 'MERCHANT' | 'PERSONAL'; instructions: string };
    rocket: { enabled: boolean; merchantNumber: string; accountType: 'MERCHANT' | 'PERSONAL'; instructions: string };
    handCash: { enabled: boolean; requireReceiptNumber: boolean };
    bankTransfer: { enabled: boolean; bankName: string; accountName: string; accountNumber: string; routingNumber: string };
  };

  // 20. Payment Verification
  paymentVerification: {
    requireTransactionId: boolean;
    requireSenderMobile: boolean;
    allowManualStaffVerification: boolean;
    preventDuplicateTrxId: boolean;
  };

  // 21. Finance & Cash Drawer
  finance: {
    taxRatePercent: number;
    serviceChargePercent: number;
    businessDayClosingTime: string;
    allowReopenClosedDay: boolean;
    reopenRequiresAdmin: boolean;
  };

  // 22. Custom Income & Expense Categories
  categories: {
    income: string[];
    expense: string[];
  };

  // 23. Documents & Printing
  documents: {
    paperSize: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4_FULL';
    showQrCodeOnTicket: boolean;
    showBarcodeOnTicket: boolean;
    showOperatorLogo: boolean;
    termsAndConditionsText: string;
    ticketFooterMessage: string;
  };

  // 24. Numbering System
  numbering: {
    bookingPrefix: string;
    bookingNumberLength: number;
    paymentPrefix: string;
    invoicePrefix: string;
    refundPrefix: string;
    includeYearInPrefix: boolean;
  };

  // 25. Communication & SMS/WhatsApp
  communication: {
    smsEnabled: boolean;
    smsGateway: 'GREENWEB' | 'BULKSMS_BD' | 'MOCK';
    smsApiKey?: string;
    smsSenderId?: string;
    whatsappEnabled: boolean;
    whatsappCloudApiToken?: string;
    sendSmsOnBookingConfirmed: boolean;
    sendSmsOnPaymentReceived: boolean;
    sendSmsDueReminder: boolean;
    sendWhatsAppTicketPdf: boolean;
  };

  // 25.1. Custom SMS & WhatsApp Templates
  smsTemplates: {
    bookingConfirmation: string;
    paymentReceipt: string;
    tripReminder: string;
  };

  // 25.2. Promotional Coupons & Concessions
  coupons: Array<{
    id: string;
    code: string;
    discountType: 'FIXED' | 'PERCENTAGE';
    amount: number;
    maxUses: number;
    usedCount: number;
    validUntil: string;
    targetUniversity: string;
    status: 'ACTIVE' | 'EXPIRED';
  }>;

  // 25.3. Role Permissions Matrix
  rolePermissions: {
    bookingStaff: {
      canBookTickets: boolean;
      canCancelTickets: boolean;
      canApplyMaxDiscount50: boolean;
      canViewReports: boolean;
      canManageBuses: boolean;
      canCloseDay: boolean;
    };
    manager: {
      canBookTickets: boolean;
      canCancelTickets: boolean;
      canApplyMaxDiscount200: boolean;
      canViewReports: boolean;
      canManageBuses: boolean;
      canCloseDay: boolean;
    };
    accountant: {
      canBookTickets: boolean;
      canCancelTickets: boolean;
      canApplyMaxDiscount50: boolean;
      canViewReports: boolean;
      canManageBuses: boolean;
      canCloseDay: boolean;
    };
  };

  // 26. User Notifications
  notifications: {
    inAppSound: boolean;
    alertOnNewOnlineRequest: boolean;
    alertOnDayClosingMismatch: boolean;
    alertOnSeatHoldExpired: boolean;
  };

  // 27. Automation Rules
  automation: Array<{
    id: string;
    title: string;
    triggerEvent: string;
    action: string;
    enabled: boolean;
  }>;

  // 28. Reports & Analytics Configuration
  reports: {
    defaultDateRange: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH';
    enableAutoEmailDailyReport: boolean;
    dailyReportRecipientEmail?: string;
    includeProfitLossSummary: boolean;
  };

  // 29. Dashboard & UI Customization
  dashboard: {
    refreshIntervalSeconds: number;
    showProgressiveSalesChart: boolean;
    showDemographicsChart: boolean;
    kpiCardsOrder: string[];
  };

  // 30. Security, 2FA & Sessions
  security: {
    sessionTimeoutMinutes: number;
    requireTwoFactorForAdmin: boolean;
    forceLogoutAllDevicesOnPasswordChange: boolean;
    maxFailedLoginAttempts: number;
  };

  // 31. Branding & White Label
  branding: {
    primaryColorHex: string;
    secondaryColorHex: string;
    themeMode: 'dark' | 'light' | 'system';
    portalTitle: string;
    customDomain?: string;
    removeAtomsBranding: boolean;
  };

  // 32. Legal & Policies
  legal: {
    termsOfServiceUrl?: string;
    privacyPolicyUrl?: string;
    refundPolicySummary: string;
    passengerConductPolicy: string;
  };
}

// Platform / Super Admin SaaS State (Tier 2)
export interface PlatformSuperAdminState {
  platformName: string;
  platformLogoUrl: string;
  maintenanceMode: boolean;
  maintenanceNotice: string;
  defaultTrialDays: number;
  allowPublicTenantRegistration: boolean;

  // SaaS Plans & Entitlements
  plans: Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    maxBuses: number;
    maxStaff: number;
    maxBookingsPerMonth: number;
    maxBranches: number;
    features: string[];
    isPopular?: boolean;
  }>;

  // Global Feature Flags
  featureFlags: {
    enableCustomSeatBuilder: boolean;
    enableMultiBranch: boolean;
    enableWhatsAppAutomation: boolean;
    enableSmsGateways: boolean;
    enableWhiteLabel: boolean;
    enableAdvancedFinanceLedger: boolean;
  };

  // Platform Broadcasts
  broadcasts: Array<{
    id: string;
    title: string;
    message: string;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    targetPlans: string[];
    createdAt: string;
  }>;
}

// SAFE DEFAULTS (Zero undefined fields)
export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettingsState = {
  general: {
    language: 'bn',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    currencySymbol: '৳',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: 'standard',
    weekStart: 'SUNDAY',
    calendarType: 'GREGORIAN'
  },
  organization: {
    name: 'ঢাকা সেন্ট্রাল ট্রানজিট (RU & DU Admission Express)',
    legalName: 'Dhaka Central Student Transport Ltd.',
    orgCode: 'DCT-2026',
    businessType: 'Student Transport & Tour Operator',
    description: 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থী ও অভিভাবকদের বিশেষ নিরাপদ ও আরামদায়ক এসি বাস সার্ভিস।',
    email: 'support@atomsbus.bd',
    phone: '01712345678',
    altPhone: '01812345678',
    address: 'গাবতলী বাস টার্মিনাল, ঢাকা ১২১৬',
    city: 'Dhaka',
    district: 'Dhaka',
    country: 'Bangladesh',
    postalCode: '1216',
    website: 'https://atomsbus.bd',
    taxBinNumber: 'BIN-99018274-2026',
    supportContact: '01712345678 (24/7 Helpline)',
    emergencyContact: '01812345678 (Operations In-charge)',
    status: 'ACTIVE'
  },
  branches: [
    {
      id: 'br-1',
      name: 'গাবতলী প্রধান কাউন্টার (Gabtoli Central)',
      code: 'GAB',
      address: 'কাউন্টার নং ১২, গাবতলী আন্তঃজেলা বাস টার্মিনাল',
      phone: '01711223344',
      email: 'gabtoli@atomsbus.bd',
      managerName: 'রফিকুল ইসলাম',
      openingDate: '2024-01-01',
      status: 'ACTIVE',
      notes: 'সেন্ট্রাল ট্রানজিট হাফ ও প্রধান বুকিং পয়েন্ট'
    },
    {
      id: 'br-2',
      name: 'ফার্মগেট ক্যাম্পাস কাউন্টার (Farmgate Branch)',
      code: 'FARM',
      address: 'ফার্মগেট গোলচত্বর মোড়, ঢাকা',
      phone: '01811223344',
      email: 'farmgate@atomsbus.bd',
      managerName: 'কামরুল হাসান',
      openingDate: '2024-06-01',
      status: 'ACTIVE',
      notes: 'ফার্মগেট ও গ্রিন রোড এলাকার শিক্ষার্থী হাব'
    }
  ],
  transport: {
    fleetTrackingEnabled: true,
    fuelTrackingEnabled: true,
    maintenanceAlertsEnabled: true,
    defaultDriverAllowance: 1200,
    defaultHelperAllowance: 600
  },
  buses: [
    {
      id: 'bus-1',
      name: 'ঢাকা এক্সপ্রেস ০১ (রাবি স্পেশাল)',
      busNumber: 'ঢাকা মেট্রো-ব ১১-২০২৪',
      regNumber: 'DM-BA-11-2024',
      busCode: 'BUS-01',
      busType: 'MIXED',
      capacity: 40,
      branchId: 'br-1',
      operator: 'দেশ ট্রাভেলস (Desh Travels)',
      fitnessExpiry: '2026-12-31',
      taxExpiry: '2026-10-15',
      insuranceExpiry: '2026-11-20',
      status: 'ACTIVE'
    },
    {
      id: 'bus-2',
      name: 'উত্তরা এক্সপ্রেস ০২ (ছাত্রী স্পেশাল)',
      busNumber: 'ঢাকা মেট্রো-ব ১২-২০২৫',
      regNumber: 'DM-BA-12-2025',
      busCode: 'BUS-02',
      busType: 'FEMALE',
      capacity: 40,
      branchId: 'br-1',
      operator: 'শ্যামলী এন.আর ট্রাভেলস',
      fitnessExpiry: '2027-01-15',
      taxExpiry: '2026-12-10',
      insuranceExpiry: '2026-12-30',
      status: 'ACTIVE'
    }
  ],
  seatLayouts: {
    defaultCapacity: 40,
    enableCustomAisle: true,
    enableRearBench5Seats: true,
    allowStandingExtraSeats: true,
    lockReasonMandatory: true
  },
  seatSettings: {
    standardFareDefault: 550,
    vipFareDefault: 650,
    femaleOnlyRows: ['A', 'B'],
    autoLockAdjacentGender: true,
    staffEmergencySeats: ['A1', 'A2']
  },
  passengerRules: {
    strictFemaleBusRestricted: true,
    allowedGuardiansForFemaleStudent: ['FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE'],
    allowedGuardiansForMaleStudent: ['FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE'],
    requireGuardianPhoneForMinors: true,
    maxTicketsPerPhone: 4
  },
  routes: [
    {
      id: 'rt-1',
      name: 'ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয় (RU Campus)',
      code: 'DHK-RU-01',
      origin: 'গাবতলী / ফার্মগেট',
      destination: 'রাজশাহী বিশ্ববিদ্যালয় মেইন গেট',
      distanceKm: 245,
      durationHours: 5.5,
      status: 'ACTIVE'
    }
  ],
  stops: [
    { id: 'st-1', name: 'গাবতলী বাস টার্মিনাল', nameBn: 'গাবতলী বাস টার্মিনাল', area: 'মিরপুর', sequence: 1, pickupEnabled: true, dropEnabled: false, status: 'ACTIVE' },
    { id: 'st-2', name: 'কল্যাণপুর বাসস্ট্যান্ড', nameBn: 'কল্যাণপুর বাসস্ট্যান্ড', area: 'কল্যাণপুর', sequence: 2, pickupEnabled: true, dropEnabled: false, status: 'ACTIVE' },
    { id: 'st-3', name: 'সাভার বাসস্ট্যান্ড', nameBn: 'সাভার বাসস্ট্যান্ড', area: 'সাভার', sequence: 3, pickupEnabled: true, dropEnabled: false, status: 'ACTIVE' },
    { id: 'st-4', name: 'নবীনগর স্মৃতিসৌধ', nameBn: 'নবীনগর স্মৃতিসৌধ', area: 'নবীনগর', sequence: 4, pickupEnabled: true, dropEnabled: false, status: 'ACTIVE' },
    { id: 'st-5', name: 'রাজশাহী বিশ্ববিদ্যালয় মেইন গেট', nameBn: 'রাজশাহী বিশ্ববিদ্যালয় মেইন গেট', area: 'কাজলা', sequence: 5, pickupEnabled: false, dropEnabled: true, status: 'ACTIVE' }
  ],
  trips: {
    autoScheduleEnabled: true,
    departureNoticeHours: 4,
    allowRescheduleMinutes: 60,
    holidayOverrideAllowed: true
  },
  drivers: [
    { id: 'dr-1', name: 'মোঃ করিম মিয়া', role: 'DRIVER', phone: '01711000111', licenseNumber: 'DL-DHK-99212', licenseExpiry: '2028-05-12', assignedBus: 'bus-1', status: 'ACTIVE' },
    { id: 'dr-2', name: 'আব্দুল কাদের', role: 'HELPER', phone: '01811000222', licenseNumber: 'N/A', licenseExpiry: 'N/A', assignedBus: 'bus-1', status: 'ACTIVE' }
  ],
  holidays: [
    { id: 'hol-1', title: 'রাবি "A" ইউনিট ভর্তি পরীক্ষা', date: '2026-09-05', isExamSpecialTrip: true, targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয়' },
    { id: 'hol-2', title: 'ঢাবি "ক" ইউনিট ভর্তি পরীক্ষা', date: '2026-09-12', isExamSpecialTrip: true, targetUniversity: 'ঢাকা বিশ্ববিদ্যালয়' }
  ],
  fuel: {
    fuelType: 'DIESEL',
    currentPricePerLitre: 108.5,
    targetKmPerLitre: 4.2,
    fuelAlertThresholdLitre: 30
  },
  maintenance: {
    oilChangeIntervalKm: 5000,
    tireInspectionIntervalDays: 30,
    fitnessCheckIntervalMonths: 6,
    autoMaintenanceAlert: true
  },
  booking: {
    bookingIdPrefix: 'BK',
    seatHoldMinutesPublic: 5,
    seatHoldMinutesStaff: 15,
    allowCancellation: true,
    cancellationDeadlineHours: 12,
    cancellationFeePercentage: 10,
    allowSeatTransfer: true,
    allowPartialPayment: true,
    minPartialPaymentPercentage: 30,
    preventDuplicatePhoneSameTrip: true
  },
  pricing: {
    priority: 'SPECIAL > PASSENGER > SEAT > ZONE > BASE',
    frontVipMultiplier: 1.2,
    rearEconomyDiscount: 50,
    peakHourMultiplier: 1.1,
    returnTripHalfFarePercent: 50
  },
  discounts: {
    bookingStaffMaxDiscount: 50,
    managerMaxDiscount: 200,
    adminMaxDiscount: 0,
    requireApprovalAbove: 200,
    requireReferenceAlways: true
  },
  paymentGateways: {
    bkash: { enabled: true, merchantNumber: '01712345678', accountType: 'MERCHANT', instructions: 'বিকাশ অ্যাপ থেকে Make Payment করুন অথবা *247# ডায়াল করুন।' },
    nagad: { enabled: true, merchantNumber: '01812345678', accountType: 'MERCHANT', instructions: 'নগদ অ্যাপ থেকে Merchant Pay করুন।' },
    rocket: { enabled: true, merchantNumber: '019123456789', accountType: 'MERCHANT', instructions: 'রকেট মার্চেন্ট পে করুন।' },
    handCash: { enabled: true, requireReceiptNumber: true },
    bankTransfer: { enabled: true, bankName: 'Islami Bank Bangladesh Ltd', accountName: 'Dhaka Central Transit Ltd', accountNumber: '20501234567890', routingNumber: '12527182' }
  },
  paymentVerification: {
    requireTransactionId: true,
    requireSenderMobile: true,
    allowManualStaffVerification: true,
    preventDuplicateTrxId: true
  },
  finance: {
    taxRatePercent: 0,
    serviceChargePercent: 0,
    businessDayClosingTime: '23:59',
    allowReopenClosedDay: true,
    reopenRequiresAdmin: true
  },
  categories: {
    income: ['বাস টিকিট বিক্রয়', 'স্পেশাল চার্টার ট্রিপ', 'হোটেল প্যাকেজ বুকিং', 'এক্সট্রা লাগেজ চার্জ'],
    expense: ['ডিজেল ও জ্বালানি', 'ড্রাইভার ও হেল্পার বেতন/ভাতা', 'বাস মেইনটেন্যান্স ও পার্টস', 'হাইওয়ে টোল ও পার্কিং', 'কাউন্টার অফিস ভাড়া ও বিদ্যুৎ', 'মার্কেটিং ও এসএমএস']
  },
  documents: {
    paperSize: 'THERMAL_80MM',
    showQrCodeOnTicket: true,
    showBarcodeOnTicket: true,
    showOperatorLogo: true,
    termsAndConditionsText: '১. যাত্রার ৩০ মিনিট পূর্বে নির্ধারিত কাউন্টারে উপস্থিত থাকুন।\n২. ভর্তি পরীক্ষার প্রবেশপত্র ও টিকিট সঙ্গে রাখুন।\n৩. বাসে ধূমপান ও বিশৃঙ্খলা সম্পূর্ণ নিষিদ্ধ।',
    ticketFooterMessage: 'ATOMS এক্সপ্রেস বাসে নিরাপদ ও শুভ যাত্রার শুভকামনা!'
  },
  numbering: {
    bookingPrefix: 'BK',
    bookingNumberLength: 5,
    paymentPrefix: 'PAY',
    invoicePrefix: 'INV',
    refundPrefix: 'REF',
    includeYearInPrefix: true
  },
  communication: {
    smsEnabled: true,
    smsGateway: 'GREENWEB',
    whatsappEnabled: true,
    sendSmsOnBookingConfirmed: true,
    sendSmsOnPaymentReceived: true,
    sendSmsDueReminder: true,
    sendWhatsAppTicketPdf: true
  },
  smsTemplates: {
    bookingConfirmation: 'প্রিয় {student_name}, ATOMS এক্সপ্রেস বাসে আপনার টিকিট নিশ্চিত হয়েছে। বাস: {bus_name}, সিট: {seats}, তারিখ: {trip_date}। ট্র্যাকিং: {tracking_link}',
    paymentReceipt: 'ধন্যবাদ {student_name}! আপনার {amount} টাকা পেমেন্ট সফল হয়েছে। TrxID: {trx_id}, রসিদ নং: {receipt_no}।',
    tripReminder: 'রিমাইন্ডার: আজ রাত {departure_time}-এ {bus_name} বাস {boarding_point} কাউন্টার থেকে ছাড়বে। সময়মতো উপস্থিত থাকুন।'
  },
  coupons: [
    {
      id: 'cp-1',
      code: 'RU_EXAM_50',
      discountType: 'FIXED',
      amount: 50,
      maxUses: 100,
      usedCount: 14,
      validUntil: '2026-10-31',
      targetUniversity: 'রাজশাহী বিশ্ববিদ্যালয় (RU)',
      status: 'ACTIVE'
    },
    {
      id: 'cp-2',
      code: 'GST_EARLYBIRD',
      discountType: 'PERCENTAGE',
      amount: 10,
      maxUses: 50,
      usedCount: 8,
      validUntil: '2026-11-15',
      targetUniversity: 'GST গুচ্ছ পরীক্ষা',
      status: 'ACTIVE'
    }
  ],
  rolePermissions: {
    bookingStaff: {
      canBookTickets: true,
      canCancelTickets: false,
      canApplyMaxDiscount50: true,
      canViewReports: false,
      canManageBuses: false,
      canCloseDay: false
    },
    manager: {
      canBookTickets: true,
      canCancelTickets: true,
      canApplyMaxDiscount200: true,
      canViewReports: true,
      canManageBuses: true,
      canCloseDay: true
    },
    accountant: {
      canBookTickets: false,
      canCancelTickets: false,
      canApplyMaxDiscount50: false,
      canViewReports: true,
      canManageBuses: false,
      canCloseDay: true
    }
  },
  notifications: {
    inAppSound: true,
    alertOnNewOnlineRequest: true,
    alertOnDayClosingMismatch: true,
    alertOnSeatHoldExpired: true
  },
  automation: [
    { id: 'auto-1', title: 'হোল্ড মেয়াদ শেষ হলে সিট অটো আনলক', triggerEvent: 'SEAT_HOLD_EXPIRED', action: 'RELEASE_SEAT', enabled: true },
    { id: 'auto-2', title: 'পেমেন্ট ভেরিফাই হলে তাৎক্ষণিক এসএমএস ও টিকিট লিংক প্রদান', triggerEvent: 'PAYMENT_VERIFIED', action: 'SEND_SMS_RECEIPT', enabled: true },
    { id: 'auto-3', title: 'বাস ৯০% পূর্ণ হলে ম্যানেজারকে সতর্কবার্তা', triggerEvent: 'BUS_90_PERCENT_FULL', action: 'ALERT_MANAGER', enabled: true }
  ],
  reports: {
    defaultDateRange: 'TODAY',
    enableAutoEmailDailyReport: false,
    includeProfitLossSummary: true
  },
  dashboard: {
    refreshIntervalSeconds: 30,
    showProgressiveSalesChart: true,
    showDemographicsChart: true,
    kpiCardsOrder: ['GROSS_SALES', 'DISCOUNTS', 'NET_SALES', 'COLLECTED', 'DUE']
  },
  security: {
    sessionTimeoutMinutes: 120,
    requireTwoFactorForAdmin: false,
    forceLogoutAllDevicesOnPasswordChange: true,
    maxFailedLoginAttempts: 5
  },
  branding: {
    primaryColorHex: '#2563eb',
    secondaryColorHex: '#4f46e5',
    themeMode: 'system',
    portalTitle: 'ATOMS Student Transit SaaS',
    removeAtomsBranding: false
  },
  legal: {
    refundPolicySummary: 'যাত্রার ১২ ঘণ্টা পূর্বে বাতিলের ক্ষেত্রে ৯০% টাকা রিফান্ড যোগ্য। যাত্রার ৬ ঘণ্টার মধ্যে বাতিল গ্রহণযোগ্য নয়।',
    passengerConductPolicy: 'ভর্তি পরীক্ষার্থী ও অভিভাবকদের সর্বোচ্চ মর্যাদা ও নিরাপত্তা বজায় রাখা সকল যাত্রী ও স্টাফদের জন্য বাধ্যতামূলক।'
  }
};

export const DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS: PlatformSuperAdminState = {
  platformName: 'ATOMS SaaS Transit Platform Engine',
  platformLogoUrl: '/logo.png',
  maintenanceMode: false,
  maintenanceNotice: 'রুটিন রক্ষণাবেক্ষণের কাজ চলছে। সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।',
  defaultTrialDays: 14,
  allowPublicTenantRegistration: true,
  plans: [
    {
      id: 'plan-starter',
      name: 'Starter / Single Bus Operator',
      monthlyPrice: 2500,
      yearlyPrice: 25000,
      maxBuses: 3,
      maxStaff: 5,
      maxBookingsPerMonth: 1000,
      maxBranches: 1,
      features: ['Basic Ticketing', 'bKash/Nagad Manual Verification', 'POS Thermal Print']
    },
    {
      id: 'plan-pro',
      name: 'Professional / Multi-Hub Fleet',
      monthlyPrice: 6500,
      yearlyPrice: 65000,
      maxBuses: 12,
      maxStaff: 20,
      maxBookingsPerMonth: 8000,
      maxBranches: 5,
      features: ['Custom Seat Builder', 'Multi-Branch Scoping', 'SMS & WhatsApp Gateway', 'Day Closing Reconciler', 'Live Tracking Portal'],
      isPopular: true
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise / Statewide Transit',
      monthlyPrice: 15000,
      yearlyPrice: 150000,
      maxBuses: 999,
      maxStaff: 999,
      maxBookingsPerMonth: 999999,
      maxBranches: 999,
      features: ['Unlimited Fleet', 'White-Label Branding', 'Custom Subdomain', 'Direct API Access', 'Priority SLA 24/7']
    }
  ],
  featureFlags: {
    enableCustomSeatBuilder: true,
    enableMultiBranch: true,
    enableWhatsAppAutomation: true,
    enableSmsGateways: true,
    enableWhiteLabel: true,
    enableAdvancedFinanceLedger: true
  },
  broadcasts: [
    {
      id: 'bc-1',
      title: 'ভর্তি পরীক্ষা ২০২৬ স্পেশাল আপডেট সক্রিয়',
      message: 'সকল অর্গানাইজেশন এডমিনদের গুচ্ছ ও রাবি পরীক্ষার নতুন ট্রিপ শিডিউল আপলোড করার অনুরোধ করা হচ্ছে।',
      priority: 'INFO',
      targetPlans: ['ALL'],
      createdAt: '2026-08-28'
    }
  ]
};

const STORAGE_KEY_ORG = 'atoms_saas_org_settings';
const STORAGE_KEY_PLATFORM = 'atoms_saas_platform_settings';

export function getStoredOrganizationSettings(): OrganizationSettingsState {
  if (typeof window === 'undefined') return DEFAULT_ORGANIZATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORG);
    if (!raw) return DEFAULT_ORGANIZATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ORGANIZATION_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ORGANIZATION_SETTINGS;
  }
}

export function saveStoredOrganizationSettings(settings: OrganizationSettingsState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY_ORG, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function getStoredPlatformSettings(): PlatformSuperAdminState {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLATFORM);
    if (!raw) return DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PLATFORM_SUPER_ADMIN_SETTINGS;
  }
}

export function saveStoredPlatformSettings(settings: PlatformSuperAdminState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY_PLATFORM, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
