'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/toast';

export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ColorTheme =
  | 'blue'
  | 'emerald'
  | 'indigo'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'teal'
  | 'cyan'
  | 'orange'
  | 'ruby'
  | 'fuchsia'
  | 'slate';

export interface ColorThemeMeta {
  id: ColorTheme;
  nameBn: string;
  nameEn: string;
  primaryHex: string;
  primaryClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  gradientClass: string;
}

export const colorThemesList: ColorThemeMeta[] = [
  {
    id: 'blue',
    nameBn: 'ক্লাসিক ওশান ব্লু (Ocean Blue)',
    nameEn: 'Classic Ocean Blue',
    primaryHex: '#2563eb',
    primaryClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-600 dark:text-blue-400',
    gradientClass: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'emerald',
    nameBn: 'এমারেল্ড গ্রিন (Emerald Green)',
    nameEn: 'Emerald Green',
    primaryHex: '#059669',
    primaryClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    gradientClass: 'from-emerald-600 to-teal-600'
  },
  {
    id: 'indigo',
    nameBn: 'রয়্যাল ইন্ডিগো (Royal Indigo)',
    nameEn: 'Royal Indigo',
    primaryHex: '#4f46e5',
    primaryClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    gradientClass: 'from-indigo-600 to-violet-600'
  },
  {
    id: 'rose',
    nameBn: 'ক্রিমসন রোজ (Crimson Rose)',
    nameEn: 'Crimson Rose',
    primaryHex: '#e11d48',
    primaryClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200 dark:border-rose-800',
    textClass: 'text-rose-600 dark:text-rose-400',
    gradientClass: 'from-rose-600 to-pink-600'
  },
  {
    id: 'amber',
    nameBn: 'সানসেট অ্যাম্বার (Sunset Amber)',
    nameEn: 'Sunset Amber',
    primaryHex: '#d97706',
    primaryClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-600 dark:text-amber-400',
    gradientClass: 'from-amber-600 to-orange-600'
  },
  {
    id: 'violet',
    nameBn: 'সাইবার ভায়োলেট (Cyber Violet)',
    nameEn: 'Cyber Violet',
    primaryHex: '#7c3aed',
    primaryClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-200 dark:border-purple-800',
    textClass: 'text-purple-600 dark:text-purple-400',
    gradientClass: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'teal',
    nameBn: 'ট্রানজিট টিল (Transit Teal)',
    nameEn: 'Transit Teal',
    primaryHex: '#0d9488',
    primaryClass: 'bg-teal-600 hover:bg-teal-700 text-white',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200 dark:border-teal-800',
    textClass: 'text-teal-600 dark:text-teal-400',
    gradientClass: 'from-teal-600 to-cyan-600'
  },
  {
    id: 'cyan',
    nameBn: 'স্কাই সায়ান (Electric Cyan)',
    nameEn: 'Electric Cyan',
    primaryHex: '#0284c7',
    primaryClass: 'bg-sky-600 hover:bg-sky-700 text-white',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-800',
    textClass: 'text-sky-600 dark:text-sky-400',
    gradientClass: 'from-sky-600 to-blue-600'
  },
  {
    id: 'orange',
    nameBn: 'ভিভিড অরেঞ্জ (Vivid Orange)',
    nameEn: 'Vivid Orange',
    primaryHex: '#ea580c',
    primaryClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200 dark:border-orange-800',
    textClass: 'text-orange-600 dark:text-orange-400',
    gradientClass: 'from-orange-600 to-amber-600'
  },
  {
    id: 'ruby',
    nameBn: 'ইম্পেরিয়াল রুবি (Imperial Ruby)',
    nameEn: 'Imperial Ruby',
    primaryHex: '#dc2626',
    primaryClass: 'bg-red-600 hover:bg-red-700 text-white',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-600 dark:text-red-400',
    gradientClass: 'from-red-600 to-rose-600'
  },
  {
    id: 'fuchsia',
    nameBn: 'রেডিয়েন্ট ফিউশিয়া (Radiant Fuchsia)',
    nameEn: 'Radiant Fuchsia',
    primaryHex: '#c026d3',
    primaryClass: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    borderClass: 'border-fuchsia-200 dark:border-fuchsia-800',
    textClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    gradientClass: 'from-fuchsia-600 to-pink-600'
  },
  {
    id: 'slate',
    nameBn: 'এক্সিকিউটিভ স্লেট (Executive Slate)',
    nameEn: 'Executive Slate',
    primaryHex: '#475569',
    primaryClass: 'bg-slate-700 hover:bg-slate-800 text-white',
    bgClass: 'bg-slate-100 dark:bg-slate-800/40',
    borderClass: 'border-slate-300 dark:border-slate-700',
    textClass: 'text-slate-700 dark:text-slate-300',
    gradientClass: 'from-slate-700 to-slate-900'
  }
];

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
    fleetOccupancySubtitle: 'Sold vs available vs locked seat ratio per bus',
    appearanceSettings: 'Appearance & Brand Theme Customization',
    brandColorTheme: 'Brand Accent Color Theme',
    navFontSize: 'Sidebar Navigation Font Size',
    headerFontSize: 'Top Navigation Bar Font Size',
    contentFontSize: 'Content & Tables Font Size',
    fontSmall: 'Compact / Small',
    fontNormal: 'Default / Normal',
    fontLarge: 'Large / Comfortable',
    fontExtraLarge: 'Extra Large / Accessible',
    // Landing Page Keys
    landingSpecialTag: 'University Admission Special Express Transit',
    landingHeroTitle1: 'Across Bangladesh',
    landingHeroTitle2: 'Admission Express',
    landingHeroTitle3: 'Bus Transit',
    landingHeroSubtitle: 'Direct, safe and guaranteed admission student bus service from Dhaka and major cities to all university campuses across Bangladesh.',
    landingTotalTrips: 'Active Trips',
    landingAvailableSeats: 'Available Seats',
    landingOpenTrips: 'Open for Booking',
    landingViewSeats: 'View Available Seats',
    landingUniversityInfo: 'University Admission Info',
    landingLiveRouteTracking: 'LIVE ROUTE TRACKING & TELEMETRY',
    landingShowMap: 'View Bangladesh Interactive Map',
    landingHideMap: 'Hide Map',
    landingFrom: 'Origin (From)',
    landingTo: 'Destination (To)',
    landingAllOrigins: 'All Origins',
    landingAllDestinations: 'All Destinations',
    landingBusType: 'Bus Category',
    landingAllBusesCategory: 'All Coaches',
    landingFemaleBusCategory: 'Female Only Coach',
    landingMaleBusCategory: 'Student / Male Coach',
    landingMixedBusCategory: 'Mixed Coach',
    landingDate: 'Departure Date',
    landingFilterReset: 'Reset Filter',
    landingBusesFound: 'coaches available',
    landingHowItWorks: 'How To Book Your Seat',
    landingHowSubtitle: 'Confirm your admission journey in 3 easy steps',
    landingStep1Title: 'Select Your Seat',
    landingStep1Desc: 'Choose your route and schedule, select an available seat on the interactive map, and submit student contact details.',
    landingStep2Title: 'Desk Call Verification',
    landingStep2Desc: 'Our central desk calls to verify student ID and gender seating allocation before activating your payment timer.',
    landingStep3Title: 'Instant PDF Ticket',
    landingStep3Desc: 'Pay securely via bKash, Nagad, or Counter Cash. Get an official QR-verified PDF ticket invoice immediately.',
    landingLiveBusSchedule: 'Live Admission Bus Schedule & Real-Time Seating',
    landingLiveBusSubtitle: 'Verified safety protocols, AC executive coaches, strict student security, and female-only zones.',
    landingBookingOpen: 'Booking Open',
    landingBookingFastFilling: 'Filling Fast!',
    landingBookingClosed: 'Sold Out',
    landingTrackBooking: 'Track Booking',
    landingSupervisorLogin: 'Supervisor Portal',
    landingOfficeDashboard: 'Office Desk',
    landingHelpline: 'Helpline: 01711-000001',
    landingThemeLight: 'Light Mode',
    landingThemeDark: 'Dark Mode',
    landingColorTheme: 'Color Palette',
    landingLanguage: 'Language',
    landingFaqTitle: 'Frequently Asked Questions (FAQ)',
    landingFaqSubtitle: 'Everything you need to know about admission transit booking',
    landingPreBookingModalTitle: 'Student Pre-Booking Request',
    landingPreBookingModalSubtitle: 'Lock your seat temporarily for verification',
    landingStudentNamePlaceholder: 'Enter student full name',
    landingPhonePlaceholder: '01XXXXXXXXX',
    landingGenderSelect: 'Select Gender',
    landingGenderMale: 'Male / Student (ছেলে)',
    landingGenderFemale: 'Female / Student (মেয়ে)',
    landingCategoryStudent: 'Admission Student (ভর্তি পরীক্ষার্থী)',
    landingCategoryGuardian: 'Accompanying Guardian (অভিভাবক)',
    landingSubmitPreBooking: 'Submit Booking Request & Start Verification',
    landingSubmitting: 'Submitting...',
    landingSuccessTitle: 'Pre-Booking Request Submitted Successfully!',
    landingSuccessSubtitle: 'Your booking code is',
    landingSuccessInstruction: 'Please keep your phone active. Our office desk representative will call you shortly to confirm your seat.'
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
    fleetOccupancySubtitle: 'প্রতিটি বাসের বিক্রিত, খালি ও লক করা সিটের তুলনামূলক চার্ট',
    appearanceSettings: 'অ্যাপিয়ারেন্স ও ব্র্যান্ড কালার কাস্টমাইজেশন',
    brandColorTheme: 'সিস্টেমের মূল ব্র্যান্ড কালার থিম (Accent Color)',
    navFontSize: 'ন্যাভিগেশন সাইডবারের ফন্ট সাইজ',
    headerFontSize: 'উপরের নেভিগেশন বার (হেডার) ফন্ট সাইজ',
    contentFontSize: 'ড্যাশবোর্ড ও কনটেন্টের ফন্ট সাইজ',
    fontSmall: 'ছোট / কম্প্যাক্ট (Small)',
    fontNormal: 'ডিফল্ট / স্ট্যান্ডার্ড (Normal)',
    fontLarge: 'বড় / কমফোর্টেবল (Large)',
    fontExtraLarge: 'এক্সট্রা লার্জ (Extra Large)',
    // Landing Page Keys
    landingSpecialTag: 'বিশ্ববিদ্যালয় ভর্তি স্পেশাল ট্রান্সপোর্ট সার্ভিস',
    landingHeroTitle1: 'বাংলাদেশ জুড়ে',
    landingHeroTitle2: 'অ্যাডমিশন এক্সপ্রেস',
    landingHeroTitle3: 'বাস সার্ভিস',
    landingHeroSubtitle: 'ঢাকা থেকে সকল বিশ্ববিদ্যালয়ে সরাসরি ও নিরাপদ বাস সার্ভিস। সিট পছন্দ করুন, ভেরিফিকেশনের পরে টিকিট নিশ্চিত করুন।',
    landingTotalTrips: 'চলমান শিডিউল',
    landingAvailableSeats: 'ফাঁকা সিট',
    landingOpenTrips: 'বুকিং ওপেন',
    landingViewSeats: 'এখনই সিট দেখুন',
    landingUniversityInfo: 'বিশ্ববিদ্যালয় ভর্তি তথ্য',
    landingLiveRouteTracking: 'লাইভ রুট ট্র্যাকিং ও টেলিমেট্রি',
    landingShowMap: 'বাংলাদেশ মানচিত্র দেখুন',
    landingHideMap: 'মানচিত্র লুকান',
    landingFrom: 'কোথা থেকে',
    landingTo: 'কোথায় যাবে',
    landingAllOrigins: 'সকল উৎস',
    landingAllDestinations: 'সকল গন্তব্য',
    landingBusType: 'বাসের ধরন',
    landingAllBusesCategory: 'সকল বাস',
    landingFemaleBusCategory: 'মহিলা বাস',
    landingMaleBusCategory: 'ছাত্র বাস',
    landingMixedBusCategory: 'মিক্সড বাস',
    landingDate: 'তারিখ',
    landingFilterReset: 'ফিল্টার রিসেট',
    landingBusesFound: 'টি বাস পাওয়া গেছে',
    landingHowItWorks: 'কীভাবে বুকিং করবেন?',
    landingHowSubtitle: 'তিনটি সহজ ধাপে আপনার সিট নিশ্চিত করুন',
    landingStep1Title: 'সিট বেছে নিন',
    landingStep1Desc: 'তালিকা থেকে আপনার রুট ও সময় নির্বাচন করুন, তারপর ফাঁকা সিট সিলেক্ট করে নাম ও ফোন নম্বর দিয়ে রিকোয়েস্ট পাঠান।',
    landingStep2Title: 'ভেরিফিকেশন',
    landingStep2Desc: 'আমাদের অফিস প্রতিনিধি ফোন দিয়ে আপনার তথ্য (ছেলে/মেয়ে, শিক্ষার্থী) যাচাই করবেন এবং পেমেন্ট টাইমার চালু করবেন।',
    landingStep3Title: 'পেমেন্ট ও টিকিট',
    landingStep3Desc: 'বিকাশ, নগদ বা ক্যাশ পেমেন্ট করে তাৎক্ষণিক কিউআর কোডসহ অফিসিয়াল পিডিএফ টিকিট ডাউনলোড করুন।',
    landingLiveBusSchedule: 'আজকের চলমান ভর্তি বাস ও লাইভ সিট স্ট্যাটাস',
    landingLiveBusSubtitle: 'অনলাইনে সরাসরি সিট ম্যাপ দেখে আপনার পছন্দের সিটটি সিলেক্ট করুন',
    landingBookingOpen: 'বুকিং চলছে',
    landingBookingFastFilling: 'শেষ হচ্ছে!',
    landingBookingClosed: 'বুকিং বন্ধ',
    landingTrackBooking: 'বুকিং ট্র্যাক',
    landingSupervisorLogin: 'সুপারভাইজার পোর্টাল',
    landingOfficeDashboard: 'অফিস ড্যাশবোর্ড',
    landingHelpline: 'হেল্পলাইন: 01711-000001',
    landingThemeLight: 'লাইট মোড',
    landingThemeDark: 'ডার্ক মোড',
    landingColorTheme: 'কালার থিম',
    landingLanguage: 'ভাষা (Language)',
    landingFaqTitle: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ)',
    landingFaqSubtitle: 'ভর্তি এক্সপ্রেস বাস সার্ভিস সম্পর্কিত জরুরি তথ্যাবলি',
    landingPreBookingModalTitle: 'ভর্তি পরীক্ষার্থী সিট বুকিং রিকোয়েস্ট',
    landingPreBookingModalSubtitle: 'আপনার তথ্য দিয়ে সিটটি সাময়িকভাবে লক করুন',
    landingStudentNamePlaceholder: 'শিক্ষার্থী বা যাত্রীর পূর্ণ নাম',
    landingPhonePlaceholder: '০১৭XXXXXXXX',
    landingGenderSelect: 'লিঙ্গ নির্বাচন করুন',
    landingGenderMale: 'ছেলে / ছাত্র (Male)',
    landingGenderFemale: 'মেয়ে / ছাত্রী (Female)',
    landingCategoryStudent: 'ভর্তি পরীক্ষার্থী শিক্ষার্থী',
    landingCategoryGuardian: 'অভিভাবক (Guardian)',
    landingSubmitPreBooking: 'বুকিং রিকোয়েস্ট পাঠান ও ভেরিফিকেশন শুরু করুন',
    landingSubmitting: 'রিকোয়েস্ট পাঠানো হচ্ছে...',
    landingSuccessTitle: 'বুকিং রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে!',
    landingSuccessSubtitle: 'আপনার বুকিং ট্র্যাকিং কোড',
    landingSuccessInstruction: 'অনুগ্রহ করে আপনার ফোনটি সচল রাখুন। কিছুক্ষণের মধ্যেই আমাদের অফিস প্রতিনিধি কল দিয়ে সিট নিশ্চিত করবেন।'
  }
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (color: ColorTheme) => void;
  navFontSize: FontSize;
  setNavFontSize: (size: FontSize) => void;
  headerFontSize: FontSize;
  setHeaderFontSize: (size: FontSize) => void;
  contentFontSize: FontSize;
  setContentFontSize: (size: FontSize) => void;
  currentColor: ColorThemeMeta;
  customLogos: Record<string, string>;
  setCustomLogo: (key: string, url: string) => void;
  resetCustomLogo: (key: string) => void;
  resetAllCustomLogos: () => void;
  t: typeof translations.bn;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');
  const [theme, setThemeState] = useState<Theme>('light');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('blue');
  const [navFontSize, setNavFontSizeState] = useState<FontSize>('base');
  const [headerFontSize, setHeaderFontSizeState] = useState<FontSize>('base');
  const [contentFontSize, setContentFontSizeState] = useState<FontSize>('base');
  const [customLogos, setCustomLogosState] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLang = (localStorage.getItem('atoms_language') as Language) || 'bn';
    setLanguageState(savedLang);
    document.documentElement.setAttribute('lang', savedLang);

    const savedTheme = (localStorage.getItem('atoms_theme') as Theme) || 'light';
    setThemeState(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    const savedColor = (localStorage.getItem('atoms_color_theme') as ColorTheme) || 'blue';
    setColorThemeState(savedColor);
    document.documentElement.setAttribute('data-color-theme', savedColor);

    const savedNavFont = (localStorage.getItem('atoms_nav_font_size') as FontSize) || 'base';
    setNavFontSizeState(savedNavFont);

    const savedHeaderFont = (localStorage.getItem('atoms_header_font_size') as FontSize) || 'base';
    setHeaderFontSizeState(savedHeaderFont);

    const savedContentFont = (localStorage.getItem('atoms_content_font_size') as FontSize) || 'base';
    setContentFontSizeState(savedContentFont);

    try {
      const savedLogos = localStorage.getItem('atoms_payment_logos');
      if (savedLogos) {
        setCustomLogosState(JSON.parse(savedLogos));
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('atoms_language', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  const setTheme = (thm: Theme) => {
    setThemeState(thm);
    localStorage.setItem('atoms_theme', thm);
    if (thm === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  const setColorTheme = (color: ColorTheme) => {
    setColorThemeState(color);
    localStorage.setItem('atoms_color_theme', color);
    document.documentElement.setAttribute('data-color-theme', color);
  };

  const setNavFontSize = (size: FontSize) => {
    setNavFontSizeState(size);
    localStorage.setItem('atoms_nav_font_size', size);
  };

  const setHeaderFontSize = (size: FontSize) => {
    setHeaderFontSizeState(size);
    localStorage.setItem('atoms_header_font_size', size);
  };

  const setContentFontSize = (size: FontSize) => {
    setContentFontSizeState(size);
    localStorage.setItem('atoms_content_font_size', size);
  };

  const setCustomLogo = (key: string, url: string) => {
    setCustomLogosState((prev) => {
      const next = { ...prev, [key]: url };
      localStorage.setItem('atoms_payment_logos', JSON.stringify(next));
      return next;
    });
  };

  const resetCustomLogo = (key: string) => {
    setCustomLogosState((prev) => {
      const next = { ...prev };
      delete next[key];
      localStorage.setItem('atoms_payment_logos', JSON.stringify(next));
      return next;
    });
  };

  const resetAllCustomLogos = () => {
    setCustomLogosState({});
    localStorage.removeItem('atoms_payment_logos');
  };

  const currentColor = colorThemesList.find((c) => c.id === colorTheme) || colorThemesList[0];
  const t = translations[language] || translations.bn;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        colorTheme,
        setColorTheme,
        navFontSize,
        setNavFontSize,
        headerFontSize,
        setHeaderFontSize,
        contentFontSize,
        setContentFontSize,
        currentColor,
        customLogos,
        setCustomLogo,
        resetCustomLogo,
        resetAllCustomLogos,
        t
      }}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
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

export const AppProvider = AppContextProvider;
