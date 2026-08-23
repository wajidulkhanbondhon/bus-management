'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

export const translations = {
  en: {
    appName: 'ATOMS Admission Transport',
    tagline: 'Internal Office & Terminal Management System',
    liveSalesMonitor: 'LIVE SALES MONITOR',
    dhakaHq: 'DHAKA HQ ADMISSION TRANSIT',
    dashboardTitle: 'Admission Desk Overview',
    dashboardSubtitle: 'Real-time live progressive sales, student passenger inventory, payment reconciliation, and active admission bus fleet telemetry.',
    newBooking: '+ New Booking',
    dayClosing: 'Day Closing',
    grossSales: 'Gross Sales',
    discounts: 'Discounts',
    netSales: "Today's Net",
    collected: 'Collected',
    due: 'Still Due',
    occupancy: 'Occupancy',
    seatsSold: 'sold',
    seatsTotal: 'seats',
    liveProgressiveSales: 'Live Progressive Sales (Cumulative)',
    liveProgressiveSubtitle: "Today's cumulative sales and collections progression across business hours",
    paymentMethods: 'Payment Methods',
    paymentSubtitle: 'Collections by gateway & cash',
    activeTripsFleet: "Active Today's Trips & Fleet Telemetry",
    activeTripsSubtitle: 'Live seat status, sales volume, and visual seat map navigation per trip',
    recentTransactions: 'Recent Desk Transactions',
    liveActivityFeed: 'Live Activity Feed',
    quickActions: 'Quick Actions',
    businessDayOpen: 'Business Day Open',
    allBuses: 'All Buses',
    createBus: 'Create Bus',
    seatBuilder: 'Custom Seat Builder',
    trips: "Today's Trips",
    scheduleTrip: 'Schedule Trip',
    allBookings: 'All Bookings',
    todaysSales: "Today's Sales",
    progressiveSales: 'Progressive Sales',
    allPayments: 'All Payments',
    duePayments: 'Due Payments',
    refunds: 'Refunds',
    financialLedger: 'Financial Ledger',
    reports: 'Reports Hub',
    staffRoles: 'Staff & Roles',
    auditLogs: 'Audit Logs',
    settings: 'System Settings',
    seatMap: 'Interactive Seat Map',
    selectSeats: 'Select Seats',
    lockSeat: 'Lock Seat',
    unlockSeat: 'Unlock Seat',
    available: 'Available',
    booked: 'Booked',
    held: 'Held',
    locked: 'Locked',
    femaleOnly: 'Female Only',
    maleOnly: 'Male Only',
    mixedBus: 'Mixed Bus',
    femaleBus: 'Female Bus',
    maleBus: 'Male Bus',
    door: 'Entry Door',
    driver: 'Driver Cabin',
    frontWindshield: 'Front Windshield & Cabin',
    rearSeats: 'Rear Passenger Seats (Row K)',
    fareZones: 'Fare Zones (A-E, F-H, I-J, K)',
    studentName: 'Student / Passenger Name',
    phone: 'Contact Mobile',
    gender: 'Gender',
    passengerType: 'Passenger Category',
    student: 'Admission Student',
    guardian: 'Accompanying Guardian',
    father: 'Father',
    brother: 'Brother',
    mother: 'Mother',
    sister: 'Sister',
    payMethod: 'Payment Channel',
    paidAmount: 'Paid Amount',
    dueAmount: 'Due Balance',
    confirmBooking: 'Confirm & Generate Ticket Invoice',
    printTicket: 'Print Ticket / PDF',
    matched: 'MATCHED',
    short: 'SHORT',
    excess: 'EXCESS',
    expectedCollections: 'Expected Collections',
    actualCash: 'Actual Counted Cash',
    variance: 'Variance / Difference',
    saveLayout: 'Save Layout to Database',
    quickPresets: 'Quick Seating Presets',
    reopenDay: 'Reopen Day (Admin)',
    switchRole: 'Fast RBAC Switcher',
    searchPlaceholder: 'Search buses, bookings, tickets, students, payments (Ctrl+K)...',
    globalSearch: 'Global Search',
    searchResults: 'Search Results',
    noResultsFound: 'No results found',
    editBus: 'Edit Bus',
    deleteBus: 'Delete Bus',
    confirmDelete: 'Are you sure you want to delete this bus?',
    deleteWarning: 'This action will remove the bus from the fleet roster permanently.',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    routeOrigin: 'Route Origin (From)',
    routeDestination: 'Route Destination (To)',
    targetUniversity: 'Target University / Exam Center',
    optional: 'Optional',
    extraSeat: 'Add Extra / Overload Seat',
    extraSeatsCount: 'Extra / Overload Seats',
    routeRevenueChart: 'Route-wise Revenue Breakdown',
    routeRevenueSubtitle: 'Revenue comparison across university admission routes',
    passengerDemographics: 'Passenger Demographics & Gender',
    passengerDemographicsSubtitle: 'Students vs Guardians, Male vs Female distribution',
    fleetOccupancyChart: 'Fleet Seat Occupancy Ratio',
    fleetOccupancySubtitle: 'Sold vs available vs locked seat ratio per bus'
  },
  bn: {
    appName: 'অ্যাটমস অ্যাডমিশন ট্রান্সপোর্ট',
    tagline: 'অ্যাডমিশন শিক্ষার্থী বাস ও অফিস ম্যানেজমেন্ট সিস্টেম',
    liveSalesMonitor: 'লাইভ সেলস মনিটর',
    dhakaHq: 'ঢাকা হেডকোয়ার্টার্স অ্যাডমিশন ট্রানজিট',
    dashboardTitle: 'অ্যাডমিশন ডেস্ক ড্যাশবোর্ড',
    dashboardSubtitle: 'রিয়েল-টাইম লাইভ প্রোগ্রেসিভ সেলস, সিট ইনভেন্টরি, টাকা কালেকশন, বকেয়া হিসাব এবং বাসের লাইভ মনিটরিং।',
    newBooking: '+ নতুন সিট বুকিং',
    dayClosing: 'ডে ক্লোজিং (হিসাব মেলানো)',
    grossSales: 'মোট টিকিট মূল্য',
    discounts: 'অনুমোদিত ছাড়',
    netSales: 'আজকের নেট সেলস',
    collected: 'মোট জমা (কালেকশন)',
    due: 'বকেয়া রয়েছে',
    occupancy: 'যাত্রী পূর্ণতা',
    seatsSold: 'বিক্রিত সিট',
    seatsTotal: 'মোট সিট',
    liveProgressiveSales: 'লাইভ প্রোগ্রেসিভ সেলস (ঘণ্টা অনুযায়ী মোট বিক্রি)',
    liveProgressiveSubtitle: 'আজকের কার্যদিবসে প্রতি ঘণ্টায় মোট বিক্রি ও জমার লাইভ চার্ট',
    paymentMethods: 'পেমেন্ট মাধ্যম সমূহ',
    paymentSubtitle: 'বিকাশ, নগদ, রকেট ও ক্যাশ কালেকশন',
    activeTripsFleet: 'আজকের শিডিউল বাস ও সিট স্ট্যাটাস',
    activeTripsSubtitle: 'সরাসরি সিট ম্যাপ দেখে সিট নির্বাচন ও বুকিং করুন',
    recentTransactions: 'সাম্প্রতিক লেনদেন সমূহ',
    liveActivityFeed: 'লাইভ অফিস অ্যাক্টিভিটি ফিড',
    quickActions: 'কুইক অ্যাকশনস',
    businessDayOpen: 'অফিস ডে খোলা আছে',
    allBuses: 'সব বাস তালিকা',
    createBus: 'নতুন বাস যুক্ত করুন',
    seatBuilder: 'কাস্টম সিট বিল্ডার (৪০/৪৫/৫০ সিট)',
    trips: 'আজকের ট্রিপ সমূহ',
    scheduleTrip: 'নতুন ট্রিপ শিডিউল',
    allBookings: 'সকল বুকিং ও টিকিট',
    todaysSales: 'আজকের মোট বিক্রি',
    progressiveSales: 'প্রোগ্রেসিভ সেলস চার্ট',
    allPayments: 'জমা হওয়া পেমেন্ট',
    duePayments: 'বকেয়া পেমেন্ট কালেকশন',
    refunds: 'রিফান্ড ও ফেরত হিসাব',
    financialLedger: 'অ্যাকাউন্টিং লেজার',
    reports: 'রিপোর্টস ও অ্যানালিটিক্স',
    staffRoles: 'স্টাফ ও পারমিশন',
    auditLogs: 'অডিট লগ ও নিরাপত্তা রেকর্ড',
    settings: 'সিস্টেম সেটিংস',
    seatMap: 'ইন্টারেক্টিভ সিট ম্যাপ',
    selectSeats: 'সিট নির্বাচন করুন',
    lockSeat: 'সিট লক করুন',
    unlockSeat: 'সিট আনলক করুন',
    available: 'খালি (Available)',
    booked: 'বুকড (Booked)',
    held: 'হোল্ড (১০ মিনিট)',
    locked: 'লকড (ইমার্জেন্সি/ভিআইপি)',
    femaleOnly: 'শুধু মেয়েদের জন্য',
    maleOnly: 'শুধু ছেলেদের জন্য',
    mixedBus: 'মিক্সড বাস (উভয়)',
    femaleBus: 'সম্পূর্ণ মেয়েদের বাস',
    maleBus: 'সম্পূর্ণ ছেলেদের বাস',
    door: 'বাসের দরজা',
    driver: 'ড্রাইভার কেবিন',
    frontWindshield: 'সামনের উইন্ডশিল্ড ও কেবিন',
    rearSeats: 'পেছনের সিট (কে-রো / K-Row)',
    fareZones: 'সিট ভাড়া জোন (A-E, F-H, I-J, K)',
    studentName: 'শিক্ষার্থী / যাত্রীর নাম',
    phone: 'মোবাইল নম্বর',
    gender: 'লিঙ্গ (ছেলে/মেয়ে)',
    passengerType: 'যাত্রীর ক্যাটাগরি',
    student: 'ভর্তি পরীক্ষার্থী শিক্ষার্থী',
    guardian: 'সাথে আসা অভিভাবক',
    father: 'বাবা (Father)',
    brother: 'আপন ভাই (Brother)',
    mother: 'মা (Mother)',
    sister: 'আপন বোন (Sister)',
    payMethod: 'পেমেন্ট মেথড (বিকাশ/নগদ/ক্যাশ)',
    paidAmount: 'পরিশোধিত টাকা',
    dueAmount: 'বকেয়া টাকা',
    confirmBooking: 'বুকিং নিশ্চিত করুন ও টিকিট প্রিন্ট নিন',
    printTicket: 'টিকিট প্রিন্ট / PDF',
    matched: 'মিলে গেছে (Matched)',
    short: 'ঘাটতি আছে (Short)',
    excess: 'উদ্বৃত্ত (Excess)',
    expectedCollections: 'হিসাব অনুযায়ী প্রত্যাশিত কালেকশন',
    actualCash: 'ক্যাশ ড্রয়ারে গোনা টাকা',
    variance: 'পার্থক্য / অমিল',
    saveLayout: 'লেআউট ডাটাবেসে সেভ করুন',
    quickPresets: 'দ্রুত সিট প্রিসেট নির্বাচন',
    reopenDay: 'দিন পুনরায় খুলুন (অ্যাডমিন)',
    switchRole: 'দ্রুত রোল পরিবর্তন করুন',
    searchPlaceholder: 'বাস, বুকিং, টিকিট, শিক্ষার্থী, পেমেন্ট সার্চ করুন (Ctrl+K)...',
    globalSearch: 'গ্লোবাল সার্চ',
    searchResults: 'সার্চ ফলাফল',
    noResultsFound: 'কোনো তথ্য পাওয়া যায়নি',
    editBus: 'বাস তথ্য এডিট করুন',
    deleteBus: 'বাস মুছে ফেলুন',
    confirmDelete: 'আপনি কি নিশ্চিতভাবে এই বাসটি মুছে ফেলতে চান?',
    deleteWarning: 'মুছে ফেললে এই বাসটি রোস্টার তালিকা থেকে স্থায়ীভাবে অপসারিত হবে।',
    cancel: 'বাতিল',
    saveChanges: 'পরিবর্তন সেভ করুন',
    routeOrigin: 'কোথা থেকে (Origin)',
    routeDestination: 'কোথায় যাবে (Destination)',
    targetUniversity: 'কোন ইউনিভার্সিটির জন্য (Target University)',
    optional: 'ঐচ্ছিক (অপশনাল)',
    extraSeat: 'অতিরিক্ত সিট যুক্ত করুন',
    extraSeatsCount: 'অতিরিক্ত / ওভারলোড সিট',
    routeRevenueChart: 'রুট অনুযায়ী মোট রাজস্ব বিশ্লেষণ',
    routeRevenueSubtitle: 'বিশ্ববিদ্যালয় ভর্তি রুটগুলোর আয় ও টিকিট বিক্রির তুলনামূলক গ্রাফ',
    passengerDemographics: 'যাত্রী ও শিক্ষার্থী ডেমোগ্রাফিক্স',
    passengerDemographicsSubtitle: 'ছাত্র ও ছাত্রী পরীক্ষার্থী এবং অভিভাবক অনুপাত',
    fleetOccupancyChart: 'বাসের সিট পূরণ ও অকুপেন্সি অনুপাত',
    fleetOccupancySubtitle: 'প্রতিটি বাসের বিক্রিত, খালি ও লক করা সিটের তুলনামূলক চার্ট'
  }
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: typeof translations.bn;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedLang = localStorage.getItem('atoms_language') as Language;
    if (savedLang) setLanguageState(savedLang);

    const savedTheme = localStorage.getItem('atoms_theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('atoms_language', lang);
  };

  const setTheme = (thm: Theme) => {
    setThemeState(thm);
    localStorage.setItem('atoms_theme', thm);
    if (thm === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
