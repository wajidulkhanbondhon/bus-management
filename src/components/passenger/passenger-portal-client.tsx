'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Timer,
  PhoneCall,
  GraduationCap,
  FileText,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  CreditCard,
  ChevronRight,
  LogOut,
  RefreshCw,
  KeyRound,
  Lock,
  Smartphone,
  Copy,
  Check,
  Building2,
  Home,
  Utensils,
  Ticket,
  Eye,
  EyeOff,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  PlusCircle,
  Key,
  UserCheck,
  Clock3,
  Send,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/lib/context';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { getBookingByTrackingNumber } from '@/services/booking.service';
import { BkashLogo, NagadLogo } from '@/components/booking/payment-brand-icons';
import {
  hasRegisteredPin,
  getStoredPin,
  savePassengerPin,
  generateWhatsAppPinUrl,
  lookupPassengerByPhone,
  checkHasExistingBookings
} from '@/services/passenger-directory.service';

// ═══════════════════════════════════════════════════════════════
// 1. OFFICIAL BRAND SVG ICONS (WHATSAPP, SMS, ROCKET)
// ═══════════════════════════════════════════════════════════════

export function OfficialWhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#25D366" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 8C15.163 8 8 15.163 8 24C8 27.026 8.847 29.855 10.316 32.263L8.684 38.316L14.895 36.711C17.228 38.037 19.921 38.8 22.8 38.8C31.637 38.8 38.8 31.637 38.8 22.8C38.8 13.963 31.637 8 24 8ZM32.421 28.526C32.074 29.505 30.695 30.347 29.747 30.558C29.095 30.705 28.242 30.821 25.379 29.632C21.726 28.116 19.368 24.4 19.179 24.158C19.011 23.916 17.653 22.105 17.653 20.242C17.653 18.379 18.6 17.474 18.947 17.116C19.295 16.758 19.716 16.653 20.063 16.653C20.347 16.653 20.589 16.663 20.8 16.674C21.084 16.684 21.284 16.695 21.474 17.147C21.716 17.726 22.295 19.147 22.368 19.295C22.442 19.442 22.484 19.642 22.389 19.832C22.295 20.021 22.232 20.105 22.084 20.274C21.937 20.442 21.779 20.653 21.642 20.789C21.484 20.947 21.326 21.116 21.505 21.421C21.684 21.726 22.305 22.737 23.211 23.547C24.379 24.589 25.326 24.916 25.663 25.053C26 25.189 26.2 25.158 26.379 24.947C26.558 24.737 27.147 24.042 27.358 23.747C27.568 23.453 27.779 23.495 28.063 23.6C28.347 23.705 29.895 24.474 30.211 24.632C30.526 24.789 30.737 24.863 30.811 24.989C30.884 25.116 30.884 25.726 30.537 26.705L32.421 28.526Z"
        fill="white"
      />
    </svg>
  );
}

export function OfficialSmsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="14" fill="#0284C7" />
      <path
        d="M13 16C13 14.3431 14.3431 13 16 13H32C33.6569 13 35 14.3431 35 16V27C35 28.6569 33.6569 30 32 30H20.4142L15.7071 34.7071C15.0771 35.3371 14 34.8909 14 34V30H16C14.3431 30 13 28.6569 13 27V16Z"
        fill="white"
      />
      <circle cx="20" cy="21.5" r="1.75" fill="#0284C7" />
      <circle cx="24" cy="21.5" r="1.75" fill="#0284C7" />
      <circle cx="28" cy="21.5" r="1.75" fill="#0284C7" />
    </svg>
  );
}

export function RocketLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="45" height="45" rx="10" fill="#8C3494" />
      <path
        d="M22.5 8C22.5 8 17 14 17 22C17 25 18.5 27.5 20.5 29L19 36L22.5 33L26 36L24.5 29C26.5 27.5 28 25 28 22C28 14 22.5 8 22.5 8Z"
        fill="white"
      />
      <circle cx="22.5" cy="20" r="2.5" fill="#8C3494" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. BANGLADESHI VALIDATION HELPERS & SECURITY LOGIC
// ═══════════════════════════════════════════════════════════════

export function validateBdPhoneNumber(phone: string): { isValid: boolean; message: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return { isValid: false, message: 'মোবাইল নম্বর লিখুন' };
  }
  if (!cleanPhone.startsWith('01')) {
    return { isValid: false, message: 'বাংলাদেশি নম্বর 01 দিয়ে শুরু হতে হবে' };
  }
  if (cleanPhone.length < 3) {
    return { isValid: false, message: 'অপারেটর কোড লিখুন (যেমন: 017, 018, 019)' };
  }
  
  const operatorDigit = cleanPhone.charAt(2);
  const validOperators = ['3', '4', '5', '6', '7', '8', '9'];
  if (!validOperators.includes(operatorDigit)) {
    return { isValid: false, message: 'সঠিক অপারেটর কোড দিন (013 - 019)' };
  }
  
  if (cleanPhone.length < 11) {
    return { isValid: false, message: `১১ ডিজিট পূর্ণ করুন (বাকি ${11 - cleanPhone.length} ডিজিট)` };
  }
  if (cleanPhone.length > 11) {
    return { isValid: false, message: 'মোবাইল নম্বর ১১ ডিজিটের বেশি হতে পারবে না' };
  }

  return { isValid: true, message: 'বৈধ মোবাইল নম্বর' };
}

export function validateSecurityPin(pin: string): { isValid: boolean; isWeak: boolean; message: string } {
  if (!pin || pin.length < 4) {
    return { isValid: false, isWeak: false, message: '৪ ডিজিটের পিন লিখুন' };
  }
  
  const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123'];
  const isWeak = weakPins.includes(pin);

  return {
    isValid: true,
    isWeak,
    message: isWeak ? 'সহজ পিন (অনুমোদিত কিন্তু পরিবর্তন বাঞ্ছনীয়)' : 'শক্তিশালী পিন'
  };
}

interface PassengerPortalProps {
  initialPhoneOrCode?: string;
}

export function PassengerPortalClient({ initialPhoneOrCode = '' }: PassengerPortalProps) {
  const { language, theme, t } = useApp();
  const { success, error, info } = useToast();

  // Mode: 'login_or_set' (main smart entry) vs 'sms_ticket' (direct 1-click ticket download)
  const [accessMode, setAccessMode] = useState<'smart_flow' | 'sms_ticket'>('smart_flow');

  // Phone input & auto-detection
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passengerNameInput, setPassengerNameInput] = useState('');
  
  // Login PIN states
  const [loginPinDigits, setLoginPinDigits] = useState<string[]>(['', '', '', '']);
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Set New PIN states (for first-time & offline counter ticket buyers)
  const [newCreatedPinDigits, setNewCreatedPinDigits] = useState<string[]>(['', '', '', '']);
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(['', '', '', '']);
  const [showCreatedPin, setShowCreatedPin] = useState(false);

  // Direct SMS ticket code
  const [ticketCodeInput, setTicketCodeInput] = useState(initialPhoneOrCode);

  // Security & Lockout System
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Authenticated State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Dashboard Tab
  const [activeTab, setActiveTab] = useState<'tickets' | 'accommodation' | 'payment_gateway' | 'circulars' | 'support'>('tickets');

  // Modals
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [directTicketData, setDirectTicketData] = useState<any>(null);
  const [forgotPinModalOpen, setForgotPinModalOpen] = useState(false);

  // WhatsApp PIN Backup Modal State
  const [whatsappBackupModalOpen, setWhatsappBackupModalOpen] = useState(false);
  const [backupData, setBackupData] = useState<{ phone: string; pin: string; name: string; waUrl: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // OTP Reset State
  const [otpChannel, setOtpChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [newResetPinDigits, setNewResetPinDigits] = useState<string[]>(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('4892');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Payment Gateway Slot State
  const [selectedGateway, setSelectedGateway] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [trxIdInput, setTrxIdInput] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Refs for Login PIN
  const loginPinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Refs for Set New PIN
  const newCreatedPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Refs for Confirm PIN
  const confirmPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Segmented input refs for OTP
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Segmented input refs for New PIN inside OTP modal
  const newResetPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Real-time Phone Validation & PIN Status
  const phoneValidation = validateBdPhoneNumber(phoneInput);
  const currentLoginPinStr = loginPinDigits.join('');
  const createdPinStr = newCreatedPinDigits.join('');
  const confirmPinStr = confirmPinDigits.join('');

  // Check if current phone already has a registered PIN
  const [isPinRegisteredForPhone, setIsPinRegisteredForPhone] = useState(false);
  const [hasExistingBookingsForPhone, setHasExistingBookingsForPhone] = useState(false);

  // Update registration and booking status whenever phone input changes
  useEffect(() => {
    if (phoneValidation.isValid) {
      const isReg = hasRegisteredPin(phoneInput);
      setIsPinRegisteredForPhone(isReg);
      const hasBk = checkHasExistingBookings(phoneInput);
      setHasExistingBookingsForPhone(hasBk);

      // Auto-suggest name if known
      const dirMatch = lookupPassengerByPhone(phoneInput);
      if (dirMatch && !passengerNameInput) {
        setPassengerNameInput(dirMatch.name);
      }
    } else {
      setIsPinRegisteredForPhone(false);
      setHasExistingBookingsForPhone(false);
    }
  }, [phoneInput, phoneValidation.isValid, passengerNameInput]);

  // Lockout Countdown Timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => setLockoutSeconds(lockoutSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  // Check saved session on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('atoms_passenger_phone');
    const savedPin = localStorage.getItem('atoms_passenger_pin');
    if (savedPhone && savedPin && !isAuthenticated) {
      setPhoneInput(savedPhone);
      setLoginPinDigits(savedPin.split('').slice(0, 4));
      handleAuthenticate(savedPhone, savedPin, true);
    }
  }, [isAuthenticated]);

  // Handle Login PIN Input Digits
  const handleLoginPinDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...loginPinDigits];
    newPin[index] = cleanDigit;
    setLoginPinDigits(newPin);

    if (cleanDigit && index < 3) {
      loginPinInputRefs[index + 1].current?.focus();
    }
  };

  const handleLoginPinDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !loginPinDigits[index] && index > 0) {
      loginPinInputRefs[index - 1].current?.focus();
    }
  };

  const handleLoginPinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasteData) return;
    const digits = pasteData.split('');
    const newPin = ['', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 4) newPin[i] = d;
    });
    setLoginPinDigits(newPin);
    loginPinInputRefs[Math.min(digits.length, 3)].current?.focus();
  };

  // Handle Set New PIN Submit (For First-time Users & Offline Counter Ticket Buyers)
  const handleSetNewPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValidation.isValid) {
      error(language === 'bn' ? 'মোবাইল নম্বর ত্রুটি' : 'Invalid Phone', phoneValidation.message);
      return;
    }

    if (!passengerNameInput.trim()) {
      error(language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter Your Name', language === 'bn' ? 'যাত্রী বা শিক্ষার্থীর নাম আবশ্যক।' : 'Passenger name is required.');
      return;
    }

    if (createdPinStr.length !== 4) {
      error(language === 'bn' ? '৪ ডিজিট পিন দিন' : 'Enter 4-digit PIN', language === 'bn' ? '৪-সংখ্যার নতুন পিন নির্ধারণ করুন।' : '4-digit PIN required.');
      return;
    }

    if (createdPinStr !== confirmPinStr) {
      error(language === 'bn' ? 'পিন মিলেনি' : 'PIN Mismatch', language === 'bn' ? 'দুই ঘরের পিন নম্বর একই হতে হবে।' : 'New PIN and Confirm PIN must match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Save PIN and profile
      savePassengerPin(phoneInput, createdPinStr, passengerNameInput.trim());
      setIsPinRegisteredForPhone(true);

      // 2. Generate WhatsApp backup link
      const waUrl = generateWhatsAppPinUrl(phoneInput, createdPinStr, passengerNameInput.trim());
      setBackupData({
        phone: phoneInput,
        pin: createdPinStr,
        name: passengerNameInput.trim(),
        waUrl
      });
      setWhatsappBackupModalOpen(true);

      success(
        language === 'bn' ? 'পিন সফলভাবে সেট হয়েছে!' : 'PIN Created Successfully!',
        language === 'bn' ? 'আপনার WhatsApp-এ পিন ব্যাকআপ পাঠানো হয়েছে।' : 'WhatsApp PIN backup has been prepared.'
      );

      // 3. Authenticate and load dashboard
      await handleAuthenticate(phoneInput, createdPinStr);
    } catch {
      error(language === 'bn' ? 'পিন সেট ব্যর্থ' : 'Failed to set PIN', language === 'bn' ? 'পুনরায় চেষ্টা করুন।' : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN Authentication (Full Dashboard Access)
  const handleAuthenticate = async (phone: string, pin: string, isAuto: boolean = false) => {
    if (lockoutSeconds > 0) {
      error(
        language === 'bn' ? 'অ্যাকাউন্ট সাময়িক লক' : 'Account Temporarily Locked',
        language === 'bn' ? `অনুগ্রহ করে ${lockoutSeconds} সেকেন্ড অপেক্ষা করুন।` : `Please wait ${lockoutSeconds} seconds.`
      );
      return;
    }

    const phoneCheck = validateBdPhoneNumber(phone);
    if (!phoneCheck.isValid) {
      if (!isAuto) error(language === 'bn' ? 'মোবাইল নম্বর ত্রুটি' : 'Invalid Phone', phoneCheck.message);
      return;
    }

    if (pin.length !== 4) {
      if (!isAuto) error(language === 'bn' ? 'পিন ত্রুটি' : 'Invalid PIN', language === 'bn' ? '৪-সংখ্যার সঠিক পিন দিন।' : '4-digit PIN required.');
      return;
    }

    // Verify stored PIN if registered
    const storedPin = getStoredPin(phone);
    if (storedPin && storedPin !== pin && !isAuto) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutSeconds(60);
        error(
          language === 'bn' ? 'নিরাপত্তা লক সক্রিয়' : 'Security Lockout Activated',
          language === 'bn' ? '৫ বার ভুল পিন দেওয়ায় ৬০ সেকেন্ডের জন্য লক করা হয়েছে।' : '5 failed attempts. Locked for 60 seconds.'
        );
      } else {
        error(
          language === 'bn' ? 'ভুল পিন দিয়েছেন' : 'Incorrect PIN',
          language === 'bn' ? `সঠিক ৪-সংখ্যার পিন লিখুন। (বাকি সুযোগ: ${5 - newAttempts} বার)` : `Please check PIN. (${5 - newAttempts} attempts left)`
        );
      }
      return;
    }

    setLoading(true);

    try {
      const data = await getBookingByTrackingNumber(phone);
      const formattedData = data || getMockPassengerData(phone, passengerNameInput);

      setBookingData(formattedData);
      setIsAuthenticated(true);
      setFailedAttempts(0);
      localStorage.setItem('atoms_passenger_phone', phone);
      localStorage.setItem('atoms_passenger_pin', pin);

      if (!isAuto) {
        success(
          language === 'bn' ? 'লগইন সফল' : 'Login Successful',
          language === 'bn' ? `স্বাগতম, ${formattedData.contact_name}!` : `Welcome, ${formattedData.contact_name}!`
        );
      }
    } catch {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutSeconds(60);
        error(
          language === 'bn' ? 'নিরাপত্তা লক সক্রিয়' : 'Security Lockout Activated',
          language === 'bn' ? '৫ বার ভুল পিন দেওয়ায় ৬০ সেকেন্ডের জন্য লক করা হয়েছে।' : '5 failed attempts. Locked for 60 seconds.'
        );
      } else {
        error(
          language === 'bn' ? 'লগইন ব্যর্থ' : 'Authentication Failed',
          language === 'bn' ? `ভুল পিন বা মোবাইল নম্বর। (বাকি সুযোগ: ${5 - newAttempts} বার)` : `Invalid PIN or phone. (${5 - newAttempts} attempts left)`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct SMS Ticket Download (No Dashboard Access)
  const handleDirectTicketFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = ticketCodeInput.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      error(language === 'bn' ? 'সঠিক টিকিট কোড দিন' : 'Invalid Code', language === 'bn' ? 'পেমেন্ট মেসেজের কোডটি লিখুন।' : 'Enter valid ticket code.');
      return;
    }

    setLoading(true);
    try {
      const data = await getBookingByTrackingNumber(cleanCode);
      const ticketResult = data || getMockPassengerData(cleanCode);
      setDirectTicketData(ticketResult);
      setTicketModalOpen(true);
      success(language === 'bn' ? 'টিকিট পাওয়া গেছে' : 'Ticket Found', language === 'bn' ? 'অফিসিয়াল ই-টিকিট ডাউনলোড করুন।' : 'Ready to download verified ticket.');
    } catch {
      error(language === 'bn' ? 'টিকিট পাওয়া যায়নি' : 'Ticket Not Found', language === 'bn' ? 'পেমেন্ট মেসেজের কোডটি সঠিকভাবে লিখুন।' : 'Check payment SMS ticket code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Request OTP with Validation
  const handleSendOtp = () => {
    const phoneCheck = validateBdPhoneNumber(phoneInput);
    if (!phoneCheck.isValid) {
      error(language === 'bn' ? 'মোবাইল নম্বর ত্রুটি' : 'Invalid Phone', phoneCheck.message);
      return;
    }

    const sampleOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(sampleOtp);
    setOtpSent(true);
    setOtpCountdown(60);

    const channelName = otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    success(
      language === 'bn' ? `${channelName}-এ ওটিপি পাঠানো হয়েছে` : `OTP Sent via ${channelName}`,
      language === 'bn' ? `আপনার মোবাইল নম্বরে ৪-সংখ্যার ওটিপি কোড পাঠানো হয়েছে (ডেমো কোড: ${sampleOtp})` : `Demo verification OTP is: ${sampleOtp}`
    );
  };

  // Handle Verify OTP & Reset PIN
  const handleVerifyOtpAndResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    const newPinStr = newResetPinDigits.join('');

    if (enteredOtp !== generatedOtp) {
      error(language === 'bn' ? 'ভুল ওটিপি কোড' : 'Invalid OTP', language === 'bn' ? 'সঠিক ৪-সংখ্যার ওটিপি কোড দিন।' : 'Please enter valid OTP.');
      return;
    }

    if (newPinStr.length !== 4) {
      error(language === 'bn' ? 'নতুন পিন দিন' : 'Enter New PIN', language === 'bn' ? '৪-সংখ্যার নতুন সিকিউরিটি পিন দিন।' : '4-digit PIN is required.');
      return;
    }

    // Save newly reset PIN
    savePassengerPin(phoneInput, newPinStr, passengerNameInput || 'শিক্ষার্থী');
    setIsPinRegisteredForPhone(true);
    setForgotPinModalOpen(false);
    setOtpSent(false);
    setOtpDigits(['', '', '', '']);
    setNewResetPinDigits(['', '', '', '']);

    // Generate WhatsApp backup link
    const waUrl = generateWhatsAppPinUrl(phoneInput, newPinStr, passengerNameInput || 'শিক্ষার্থী');
    setBackupData({
      phone: phoneInput,
      pin: newPinStr,
      name: passengerNameInput || 'শিক্ষার্থী',
      waUrl
    });
    setWhatsappBackupModalOpen(true);

    success(
      language === 'bn' ? 'পিন সফলভাবে পরিবর্তন হয়েছে!' : 'PIN Reset Successfully!',
      language === 'bn' ? 'নতুন পিন দিয়ে লগইন সম্পন্ন হয়েছে।' : 'Logged in with your new PIN.'
    );

    handleAuthenticate(phoneInput, newPinStr);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('atoms_passenger_phone');
    localStorage.removeItem('atoms_passenger_pin');
    setIsAuthenticated(false);
    setBookingData(null);
    setPhoneInput('');
    setLoginPinDigits(['', '', '', '']);
    info(language === 'bn' ? 'লগআউট সম্পন্ন' : 'Logged Out', language === 'bn' ? 'আপনার সেশন নিরাপদে শেষ হয়েছে।' : 'Logged out safely.');
  };

  // Handle Print Ticket
  const handlePrintTicket = () => {
    window.print();
  };

  // Mock consistent ticket data generator with accurate accommodation and supervisor states
  const getMockPassengerData = (identifier: string, nameFallback?: string) => {
    const dirInfo = lookupPassengerByPhone(identifier);
    const resolvedName = nameFallback || dirInfo?.name || 'সাকিব আল হাসান (Sakib Al Hasan)';

    return {
      booking_number: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-88412`,
      contact_name: resolvedName,
      contact_phone: identifier.startsWith('01') ? identifier : '01712345678',
      passenger_type: dirInfo?.passengerType || 'STUDENT',
      student_id: dirInfo?.admissionId || 'RU-A-2026-90412',
      institution: dirInfo?.institution || 'Notre Dame College, Dhaka',
      guardian_phone: dirInfo?.guardianPhone || '01711998877',
      boarding_point: 'Dhaka Gabtoli Inter-District Terminal (Platform-4)',
      payment_status: 'PAID',
      booking_status: 'CONFIRMED',
      total_fare: 650.0,
      paid_amount: 650.0,
      due_amount: 0.0,
      has_accommodation: true, // Controlled by trip package
      seats: [
        {
          id: 'seat-1',
          seat_number: 'A1',
          fare: 650.0,
          seat_type: 'VIP Front'
        }
      ],
      trip: {
        id: 'trip-ru-01',
        trip_code: 'TRIP-RU-2026-001',
        bus_name: 'Rajshahi University Admission Express 01',
        bus_number: 'DHAKA-METRO-BA-14-9988',
        package_type: 'ACCOMMODATION_INCLUDED', // 'TRANSIT_ONLY' or 'ACCOMMODATION_INCLUDED'
        departure_date: '2026-09-02',
        departure_time: '2026-09-02T22:30:00',
        route: {
          origin: 'Dhaka Gabtoli',
          destination: 'Rajshahi University Campus',
          exam_center: 'RU Unit-A (Science Faculty Building)'
        },
        supervisor: {
          name: 'মোঃ কবির হোসেন (Md. Kabir Hossain)',
          phone: '01711002233',
          whatsapp: '01711002233',
          status: 'ASSIGNED'
        }
      },
      accommodation: {
        package_name: 'অফিসিয়াল ভর্তি শিক্ষার্থী আবাসন ও রেস্ট লাউঞ্জ',
        hotel_name: 'অ্যাটমস বিশ্ববিদ্যালয় ক্যাম্পাস লাউঞ্জ ও রেসিডেন্স',
        room_type: 'এসি ডিলাক্স ডরমিটরি (১ম তলা - ছাত্র জোন)',
        check_in: '০৩ সেপ্টেম্বর, ভোর ০৫:০০',
        check_out: '০৪ সেপ্টেম্বর, দুপুর ১২:০০',
        amenities: ['এসি রুম', 'ওয়াই-ফাই', 'সকালের নাস্তা', 'পরীক্ষা হলে ড্রপ', 'সার্বক্ষণিক সিকিউরিটি'],
        location_address: 'কাজলা গেট সংলগ্ন, রাজশাহী বিশ্ববিদ্যালয়',
        contact_person: 'ক্যাম্পাস কোঅর্ডিনেটর: ০১৭৫৫-০০৪৪১১'
      }
    };
  };

  // Check if current trip has accommodation enabled (strictly only show if trip package has accommodation)
  const hasAccommodation = Boolean(bookingData?.has_accommodation || bookingData?.accommodation);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ═══════ 1. PORTAL HEADER ═══════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            {language === 'bn' ? 'সিকিউর প্যাসেঞ্জার সেলফ-সার্ভিস পোর্টাল' : 'Secure Passenger Self-Service Portal'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'bn' ? 'প্যাসেঞ্জার টিকিট ও সার্ভিস ড্যাশবোর্ড' : 'Passenger Ticket & Services Portal'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'সুরক্ষিত ৪-সংখ্যার পিন দিয়ে আপনার নিশ্চিত সিট, ডিজিটাল টিকিট, সুপারভাইজার তথ্য ও পেমেন্ট হিস্ট্রি দেখুন।'
              : 'Access your verified coach tickets, supervisor desk, and admission alerts with 4-digit PIN security.'}
          </p>
        </div>

        {isAuthenticated && bookingData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAuthenticate(phoneInput, currentLoginPinStr || '1234', true)}
              className="text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              {language === 'bn' ? 'লগআউট' : 'Logout'}
            </Button>
          </div>
        )}
      </div>

      {/* ═══════ 2. STREAMLINED PROGRESSIVE LOGIN VIEW (WHEN NOT LOGGED IN) ═══════ */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto py-4 space-y-6"
        >
          {accessMode === 'smart_flow' ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900/95 backdrop-blur-md overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${isPinRegisteredForPhone ? 'from-blue-600 via-indigo-600 to-blue-500' : 'from-indigo-600 via-purple-600 to-pink-500'}`} />
              
              <CardHeader className="text-center pb-2 pt-6">
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner ${isPinRegisteredForPhone ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'}`}>
                  {isPinRegisteredForPhone ? <Lock className="w-6 h-6" /> : <Key className="w-6 h-6" />}
                </div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
                  {isPinRegisteredForPhone
                    ? (language === 'bn' ? 'স্টুডেন্ট ড্যাশবোর্ড লগইন' : 'Student Dashboard Login')
                    : phoneValidation.isValid
                    ? (language === 'bn' ? '৪-ডিজিটের সিকিউরিটি পিন সেট করুন' : 'Set Your 4-Digit Security PIN')
                    : (language === 'bn' ? 'শিক্ষার্থী ও প্যাসেঞ্জার পোর্টাল' : 'Passenger & Student Portal')}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {isPinRegisteredForPhone
                    ? (language === 'bn' ? 'আপনার ৪-সংখ্যার গোপন পিন দিয়ে সুরক্ষিতভাবে ড্যাশবোর্ডে প্রবেশ করুন।' : 'Enter your 4-digit secret PIN to access your dashboard.')
                    : phoneValidation.isValid
                    ? (language === 'bn' ? 'আপনার অ্যাকাউন্ট নিরাপদ রাখতে ও টিকিট দেখতে একটি ৪-সংখ্যার গোপন পিন দিন।' : 'Create your 4-digit PIN to securely access tickets & live bus tracking.')
                    : (language === 'bn' ? 'আপনার মোবাইল নম্বর দিয়ে সরাসরি টিকিট, সিট ও লাইভ বাস ট্র্যাকিং দেখুন।' : 'Enter mobile number to access your confirmed seats and tickets.')}
                </p>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-5">
                {lockoutSeconds > 0 && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-pulse">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                    <div>
                      <span className="font-bold block">নিরাপত্তা লক সক্রিয়</span>
                      অতিরিক্ত ভুল পিন দেওয়ায় সাময়িক লক। বাকি সময়: <span className="font-mono font-bold">{lockoutSeconds}</span> সেকেন্ড।
                    </div>
                  </div>
                )}

                {/* 1. Mobile Number Step */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Mobile Number (11-digit)'}
                    </label>
                    {phoneTouched && (
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${
                        phoneValidation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {phoneValidation.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {phoneValidation.message}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2">
                      <span>🇧🇩</span>
                      <span>+88</span>
                    </div>
                    <Input
                      type="tel"
                      maxLength={11}
                      placeholder="017XXXXXXXX"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneTouched(true);
                        setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 11));
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      className={`font-mono text-sm pl-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all ${
                        phoneTouched && !phoneValidation.isValid
                          ? 'border-amber-400 focus-visible:ring-amber-400'
                          : phoneTouched && phoneValidation.isValid
                          ? 'border-emerald-500 focus-visible:ring-emerald-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* 2. CASE A: PHONE VALID & PIN ALREADY REGISTERED -> SHOW 4-DIGIT LOGIN PIN */}
                {phoneValidation.isValid && isPinRegisteredForPhone && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAuthenticate(phoneInput, currentLoginPinStr);
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {language === 'bn' ? '৪-সংখ্যার গোপন পিন (PIN)' : '4-Digit Secret PIN'}
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowLoginPin(!showLoginPin)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                          >
                            {showLoginPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showLoginPin ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'দেখান' : 'Show')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setForgotPinModalOpen(true)}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {language === 'bn' ? 'পিন ভুলে গেছেন? (OTP)' : 'Forgot PIN? (OTP)'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={loginPinInputRefs[idx]}
                            type={showLoginPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={1}
                            value={loginPinDigits[idx]}
                            onChange={(e) => handleLoginPinDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleLoginPinDigitKeyDown(idx, e)}
                            onPaste={handleLoginPinPaste}
                            className="w-full h-14 text-center font-mono font-black text-2xl rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                          />
                        ))}
                      </div>

                      {failedAttempts > 0 && failedAttempts < 5 && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold text-center flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ভুল পিন দিয়েছেন। আর সুযোগ বাকি আছে: {5 - failedAttempts} বার
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || lockoutSeconds > 0 || currentLoginPinStr.length !== 4}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 shadow-lg shadow-blue-600/25 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {loading
                        ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                        : (language === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Unlock Dashboard')}
                    </Button>
                  </form>
                )}

                {/* 3. CASE B: PHONE VALID & NO PIN REGISTERED YET (FIRST-TIME OR COUNTER BUYER) -> SHOW SET PIN FORM */}
                {phoneValidation.isValid && !isPinRegisteredForPhone && (
                  <form onSubmit={handleSetNewPinSubmit} className="space-y-4 pt-2">
                    {/* Notice Banner */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {hasExistingBookingsForPhone
                          ? 'কাউন্টার বুকিং পাওয়া গেছে!'
                          : 'প্রথমবার প্রবেশের জন্য পিন সেট করুন'}
                      </div>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                        {hasExistingBookingsForPhone
                          ? 'আপনার পূর্বে কাউন্টার থেকে কাটা টিকিট সুরক্ষিত রাখতে ও ড্যাশবোর্ডে দেখতে একটি ৪-সংখ্যার গোপন পিন সেট করুন।'
                          : 'আপনার নিজস্ব ৪-সংখ্যার পিন তৈরি করুন। পিন সেট করার সাথে সাথে ব্যাকআপ কপি আপনার WhatsApp-এ পাঠিয়ে দেওয়া হবে।'}
                      </p>
                    </div>

                    {/* Passenger Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {language === 'bn' ? 'যাত্রী / শিক্ষার্থীর পূর্ণ নাম' : 'Passenger / Student Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="যেমন: তানভীর আহমেদ"
                          value={passengerNameInput}
                          onChange={(e) => setPassengerNameInput(e.target.value)}
                          className="pl-9 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* 4-digit PIN setup */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {language === 'bn' ? '৪-সংখ্যার নতুন পিন দিন' : 'Set 4-Digit Security PIN'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCreatedPin(!showCreatedPin)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          {showCreatedPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showCreatedPin ? 'লুকান' : 'দেখান'}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={newCreatedPinRefs[idx]}
                            type={showCreatedPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={1}
                            value={newCreatedPinDigits[idx]}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(-1);
                              const newP = [...newCreatedPinDigits];
                              newP[idx] = val;
                              setNewCreatedPinDigits(newP);
                              if (val && idx < 3) newCreatedPinRefs[idx + 1].current?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !newCreatedPinDigits[idx] && idx > 0) {
                                newCreatedPinRefs[idx - 1].current?.focus();
                              }
                            }}
                            className="w-full h-12 text-center font-mono font-black text-xl rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Confirm PIN */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {language === 'bn' ? 'পিন পুনরায় লিখুন (Confirm PIN)' : 'Confirm PIN'}
                        </label>
                        {confirmPinStr.length === 4 && (
                          <span className={`text-[10px] font-bold ${
                            createdPinStr === confirmPinStr ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {createdPinStr === confirmPinStr ? '✓ পিন মিলেছে' : '✕ পিন মিলেনি'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={confirmPinRefs[idx]}
                            type={showCreatedPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={1}
                            value={confirmPinDigits[idx]}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(-1);
                              const newP = [...confirmPinDigits];
                              newP[idx] = val;
                              setConfirmPinDigits(newP);
                              if (val && idx < 3) confirmPinRefs[idx + 1].current?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !confirmPinDigits[idx] && idx > 0) {
                                confirmPinRefs[idx - 1].current?.focus();
                              }
                            }}
                            className="w-full h-12 text-center font-mono font-black text-xl rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !passengerNameInput.trim() || createdPinStr.length !== 4 || createdPinStr !== confirmPinStr}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3.5 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {loading
                        ? (language === 'bn' ? 'সংরক্ষণ ও প্রবেশ করা হচ্ছে...' : 'Saving & Logging In...')
                        : (language === 'bn' ? 'পিন সেট করুন ও ড্যাশবোর্ডে প্রবেশ করুন' : 'Save PIN & Open Dashboard')}
                    </Button>
                  </form>
                )}

                {/* 4. Quick Demo PIN Helper */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === 'bn' ? 'দ্রুত ডেমো স্টুডেন্ট টেস্ট:' : 'Quick Demo Student Test:'}</span>
                    <span className="font-mono text-blue-500 font-bold">PIN: 1234</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput('01712345678');
                      setPhoneTouched(true);
                      setPassengerNameInput('তানভীর আহমেদ');
                      savePassengerPin('01712345678', '1234', 'তানভীর আহমেদ');
                      setIsPinRegisteredForPhone(true);
                      setLoginPinDigits(['1', '2', '3', '4']);
                      handleAuthenticate('01712345678', '1234');
                    }}
                    className="w-full text-[11px] font-mono p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-between"
                  >
                    <span>📱 01712345678 (তানভীর - রাবি ইউনিট-A)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 5. Switch to Direct SMS Ticket Code Mode */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setAccessMode('sms_ticket')}
                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'শুধু ১টি টিকিট ডাউনলোড করতে চান? SMS কোড দিন' : 'Want direct 1-ticket download via SMS code?'}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* DIRECT SMS TICKET DOWNLOAD MODE */
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900/95 backdrop-blur-md overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500" />
              <CardHeader className="text-center pb-2 pt-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner mb-2">
                  <Ticket className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সরাসরি টিকিট ডাউনলোড' : 'Direct Ticket Download'}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'পেমেন্ট নিশ্চিতকরণের পর আপনার SMS বা WhatsApp মেসেজে পাঠানো সিকিউর টিকিট কোডটি লিখুন।'
                    : 'Enter the unique ticket code sent in your payment confirmation SMS/WhatsApp.'}
                </p>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-4">
                <form onSubmit={handleDirectTicketFetch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'bn' ? 'ইউনিক টিকিট কোড / পেমেন্ট মেসেজ কোড' : 'Unique Ticket Code / Payment Code'}
                    </label>
                    <Input
                      type="text"
                      placeholder="যেমন: BK-20260828-88412 বা TKT-8841-99"
                      value={ticketCodeInput}
                      onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                      className="font-mono text-sm uppercase bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading || ticketCodeInput.trim().length < 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {loading
                      ? (language === 'bn' ? 'টিকিট অনুসন্ধান চলছে...' : 'Searching Ticket...')
                      : (language === 'bn' ? 'টিকিট দেখুন ও ডাউনলোড করুন' : 'View & Download Ticket')}
                  </Button>
                </form>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setAccessMode('smart_flow')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>{language === 'bn' ? 'সম্পূর্ণ স্টুডেন্ট ড্যাশবোর্ড লগইন-এ ফিরে যান' : 'Back to Full Student Dashboard Login'}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* ═══════ 3. AUTHENTICATED DASHBOARD ═══════ */}
      {isAuthenticated && bookingData && (
        <div className="space-y-6">
          {/* Top Passenger Profile Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                    {bookingData.passenger_type === 'STUDENT' ? 'ভর্তি পরীক্ষার্থী' : 'অভিভাবক'}
                  </span>
                  <span className="font-mono text-xs text-blue-200">
                    {bookingData.booking_number}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {bookingData.contact_name}
                </h2>

                <div className="flex flex-wrap gap-4 text-xs text-blue-100 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-300" />
                    {bookingData.contact_phone}
                  </span>
                  {bookingData.student_id && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                      রোল: {bookingData.student_id}
                    </span>
                  )}
                  {bookingData.institution && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                      {bookingData.institution}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                <div className="space-y-0.5 md:text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">
                    {language === 'bn' ? 'বুকিং স্ট্যাটাস' : 'Booking Status'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-black text-sm px-3 py-1 rounded-full bg-emerald-500 text-white shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'কনফার্মড ও ভেরিফাইড' : 'CONFIRMED'}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDirectTicketData(bookingData);
                    setTicketModalOpen(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs backdrop-blur-sm"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'bn' ? 'প্রিন্ট PDF' : 'Print PDF'}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Accommodation strictly only shows if enabled for this bus) */}
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-3 px-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'tickets'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4" />
              {language === 'bn' ? 'আমার টিকিট ও সিট' : 'My Tickets & Seats'}
            </button>

            {/* Render Accommodation tab ONLY if package includes accommodation */}
            {hasAccommodation && (
              <button
                onClick={() => setActiveTab('accommodation')}
                className={`pb-3 px-2 flex items-center gap-1.5 transition-all ${
                  activeTab === 'accommodation'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-500" />
                {language === 'bn' ? 'অফিসিয়াল আবাসন ও হোস্টেল' : 'Official Accommodation'}
              </button>
            )}

            <button
              onClick={() => setActiveTab('payment_gateway')}
              className={`pb-3 px-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'payment_gateway'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              {language === 'bn' ? 'পেমেন্ট ও বকেয়া গেটওয়ে' : 'Payment Gateway Slot'}
            </button>

            <button
              onClick={() => setActiveTab('circulars')}
              className={`pb-3 px-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'circulars'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              {language === 'bn' ? 'ভর্তি পরীক্ষার নোটিশ' : 'Exam Circulars'}
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`pb-3 px-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'support'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <OfficialWhatsAppIcon className="w-4 h-4" />
              {language === 'bn' ? 'সুপারভাইজার ও হেল্পডেস্ক' : 'Supervisor Desk'}
            </button>
          </div>

          {/* TAB 1: TICKETS & SEATS */}
          {activeTab === 'tickets' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Trip & Coach Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {bookingData.trip?.trip_code}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {bookingData.trip?.bus_name}
                      </h3>
                    </div>
                    <Badge variant="primary" className="text-xs">
                      {bookingData.trip?.bus_number}
                    </Badge>
                  </div>

                  <CardContent className="p-5 space-y-5">
                    {/* Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {language === 'bn' ? 'যাত্রা শুরুর স্থান' : 'Origin / Boarding'}
                        </span>
                        <div className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {bookingData.trip?.route?.origin}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {bookingData.boarding_point}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {language === 'bn' ? 'গন্তব্য ও কেন্দ্র' : 'Destination / Exam Center'}
                        </span>
                        <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {bookingData.trip?.route?.destination}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {bookingData.trip?.route?.exam_center}
                        </p>
                      </div>
                    </div>

                    {/* Time & Seats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400">{language === 'bn' ? 'যাত্রার তারিখ' : 'Date'}</span>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {formatDate(bookingData.trip?.departure_date)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400">{language === 'bn' ? 'ছাড়ার সময়' : 'Time'}</span>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {formatTime(bookingData.trip?.departure_time)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400">{language === 'bn' ? 'নির্ধারিত সিট' : 'Seats'}</span>
                        <div className="font-black text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {(bookingData.seats || []).map((s: any) => s.seat_number).join(', ')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400">{language === 'bn' ? 'মোট ভাড়া' : 'Total Fare'}</span>
                        <div className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(bookingData.total_fare)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Quick Cards */}
              <div className="space-y-6">
                {/* Supervisor Desk */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <OfficialWhatsAppIcon className="w-4 h-4" />
                      {language === 'bn' ? 'বাস সুপারভাইজার ডেস্ক' : 'Bus Supervisor Desk'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {bookingData.trip?.supervisor?.name}
                      </div>
                      <div className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {bookingData.trip?.supervisor?.phone}
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/88${bookingData.trip?.supervisor?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <OfficialWhatsAppIcon className="w-4 h-4" />
                      {language === 'bn' ? 'সুপারভাইজারকে WhatsApp করুন' : 'Message on WhatsApp'}
                    </a>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 2: OFFICIAL ACCOMMODATION PACKAGE (ONLY IF APPLICABLE) */}
          {hasAccommodation && activeTab === 'accommodation' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-full w-fit mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'অ্যাটমস ট্রান্সপোর্ট নিজস্ব আবাসন ব্যবস্থা' : 'ATOMS Official Transport Accommodation'}
                  </div>
                  <h3 className="text-xl font-black">
                    {bookingData.accommodation?.package_name || 'অফিসিয়াল ভর্তি শিক্ষার্থী আবাসন ও রেস্ট লাউঞ্জ'}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1 max-w-xl">
                    {language === 'bn'
                      ? 'ভর্তি পরীক্ষার্থী ও অভিভাবকদের সুবিধার্থে বাসের সাথেই ক্যাম্পাস সংলগ্ন নিজস্ব নিরাপদ হোটেল ও হোস্টেল সুবিধা অন্তর্ভুক্ত।'
                      : 'Safe, verified, transport-accompanied hostel stay next to university exam halls for students and guardians.'}
                  </p>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'bn' ? 'নির্ধারিত আবাসন কেন্দ্র' : 'Assigned Residence'}
                      </span>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-indigo-500" />
                        {bookingData.accommodation?.hotel_name}
                      </div>
                      <p className="text-xs text-slate-500">
                        {bookingData.accommodation?.room_type}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'bn' ? 'চেক-ইন ও চেক-আউট সময়' : 'Stay Schedule'}
                      </span>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        চেক-ইন: {bookingData.accommodation?.check_in}
                      </div>
                      <div className="text-xs text-slate-500">
                        চেক-আউট: {bookingData.accommodation?.check_out}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        {language === 'bn' ? 'বুকিং স্ট্যাটাস' : 'Booking Status'}
                      </span>
                      <div className="font-black text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'bn' ? 'আবাসন কনফার্মড' : 'Room Confirmed'}
                      </div>
                      <p className="text-[11px] text-emerald-600">
                        {language === 'bn' ? 'বাসের সাথে রুম সংরক্ষিত আছে' : 'Guaranteed Bed Reserved'}
                      </p>
                    </div>
                  </div>

                  {/* Included Services */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'bn' ? 'আবাসনে অন্তর্ভুক্ত সুবিধাসমূহ' : 'Included Transit Amenities'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: ShieldCheck, title: 'আলাদা ফ্লোর', desc: 'ছাত্র ও ছাত্রীদের আলাদা রুম' },
                        { icon: Utensils, title: 'খাবার ব্যবস্থা', desc: 'পুষ্টিকর সকাল ও রাতের মিল' },
                        { icon: Bus, title: 'পরীক্ষা হল এসকর্ট', desc: 'সকালে বাসে করে সরাসরি কেন্দ্রে ড্রপ' },
                        { icon: ShieldCheck, title: 'সুপারভাইজার গার্ড', desc: 'সার্বক্ষণিক দায়িত্বপ্রাপ্ত স্টাফ' },
                      ].map((am, idx) => {
                        const Icon = am.icon;
                        return (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">{am.title}</div>
                            <div className="text-[10px] text-slate-500">{am.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 3: PAYMENT GATEWAY */}
          {activeTab === 'payment_gateway' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    {language === 'bn' ? 'মডুলার পেমেন্ট গেটওয়ে স্লট' : 'Modular Payment Gateway Slot'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('BKASH')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedGateway === 'BKASH'
                          ? 'border-[#E2136E] bg-[#E2136E]/10 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      <BkashLogo className="w-8 h-8" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">bKash Merchant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway('NAGAD')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedGateway === 'NAGAD'
                          ? 'border-[#F7941D] bg-[#F7941D]/10 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      <NagadLogo className="w-8 h-8" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Nagad Direct</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway('ROCKET')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        selectedGateway === 'ROCKET'
                          ? 'border-[#8C3494] bg-[#8C3494]/10 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      <RocketLogo className="w-8 h-8" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Rocket Pay</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">মার্চেন্ট পেমেন্ট নম্বর:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">01700-112233</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('01700112233');
                            setCopiedNumber(true);
                            setTimeout(() => setCopiedNumber(false), 2000);
                          }}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 hover:text-slate-900"
                        >
                          {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        পেমেন্ট TrxID লিখুন
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="যেমন: 9K8L7M6N"
                          value={trxIdInput}
                          onChange={(e) => setTrxIdInput(e.target.value.toUpperCase())}
                          className="font-mono uppercase bg-white dark:bg-slate-900"
                        />
                        <Button
                          variant="primary"
                          disabled={paymentSubmitting || !trxIdInput.trim()}
                          onClick={() => {
                            setPaymentSubmitting(true);
                            setTimeout(() => {
                              setPaymentSubmitting(false);
                              setTrxIdInput('');
                              success('পেমেন্ট রিকোয়েস্ট জমা হয়েছে', 'আমাদের অ্যাকাউন্ট টিম ৫ মিনিটে ভেরিফাই করবে।');
                            }, 1000);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
                        >
                          {paymentSubmitting ? 'যাচাই হচ্ছে...' : 'জমা দিন'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: EXAM CIRCULARS */}
          {activeTab === 'circulars' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                  <GraduationCap className="w-5 h-5" />
                  <span>রাজশাহী বিশ্ববিদ্যালয় ভর্তি পরীক্ষা ২০২৬ (ইউনিট-A)</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>• পরীক্ষার তারিখ: ০৩ সেপ্টেম্বর ২০২৬, সকাল ১০:০০ টা।</p>
                  <p>• কেন্দ্রে প্রবেশ: সকাল ০৯:০০ টার মধ্যে হলে উপস্থিত থাকতে হবে।</p>
                  <p>• প্রয়োজনীয় কাগজপত্র: মূল প্রবেশপত্র, রেজিস্ট্রেশন কার্ড ও বলপেন।</p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 5: SUPERVISOR & SUPPORT */}
          {activeTab === 'support' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <OfficialWhatsAppIcon className="w-5 h-5" />
                  <span>সুপারভাইজার ও জরুরি হেল্পডেস্ক</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">বাস সুপারভাইজার:</span>
                    <div className="font-bold text-slate-900 dark:text-white">{bookingData.trip?.supervisor?.name}</div>
                    <div className="font-mono text-blue-600 font-bold">{bookingData.trip?.supervisor?.phone}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">কেন্দ্রীয় হেল্পলাইন (২৪/৭):</span>
                    <div className="font-bold text-slate-900 dark:text-white">ATOMS Central Customer Care</div>
                    <div className="font-mono text-emerald-600 font-bold">09612-445566</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ═══════ 4. WHATSAPP PIN BACKUP MODAL ═══════ */}
      <AnimatePresence>
        {whatsappBackupModalOpen && backupData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#25D366]/20 text-[#25D366] mx-auto flex items-center justify-center ring-8 ring-[#25D366]/10 animate-bounce">
                  <OfficialWhatsAppIcon className="w-8 h-8" />
                </div>
                <Badge variant="success" className="px-3 py-1 text-xs">
                  পিন সফলভাবে তৈরি হয়েছে
                </Badge>
                <h3 className="font-black text-xl text-slate-900 dark:text-white">
                  হোয়াটসঅ্যাপে আপনার পিন সেভ করুন!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  স্বাগতম <strong className="text-slate-900 dark:text-white">{backupData.name}</strong>! আপনার গোপন পিন কোড যেন কখনো হারিয়ে না যায়, তাই এটি আপনার WhatsApp চ্যাটে সেভ করে রাখার ব্যবস্থা করা হয়েছে।
                </p>
              </div>

              {/* PIN Info Display Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">মোবাইল নম্বর:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{backupData.phone}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">গোপন সিকিউরিটি পিন:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-wider">
                      {backupData.pin}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(backupData.pin);
                        setCopiedPin(true);
                        setTimeout(() => setCopiedPin(false), 2000);
                      }}
                      className="p-1 rounded bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 border border-emerald-300 shadow-sm"
                    >
                      {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <a
                  href={backupData.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsappBackupModalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-lg shadow-[#25D366]/25 transition-all"
                >
                  <OfficialWhatsAppIcon className="w-4 h-4" />
                  <span>📲 WhatsApp-এ পিন মেসেজ সংরক্ষণ করুন</span>
                </a>

                <Button
                  variant="outline"
                  onClick={() => setWhatsappBackupModalOpen(false)}
                  className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 py-3"
                >
                  ড্যাশবোর্ডে এগিয়ে যান
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════ 5. FORGOT PIN & OTP RESET MODAL ═══════ */}
      <AnimatePresence>
        {forgotPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => {
                  setForgotPinModalOpen(false);
                  setOtpSent(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 mx-auto flex items-center justify-center mb-2 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  {language === 'bn' ? 'পিন রিসেট ও ওটিপি ভেরিফিকেশন' : 'Reset 4-Digit Security PIN'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'bn' ? 'আপনার নম্বরে পাঠানো ৪-সংখ্যার ওটিপি কোড দিয়ে নতুন পিন সেট করুন।' : 'Verify OTP to reset your security PIN.'}
                </p>
              </div>

              {!otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Mobile Number (11-digit)'}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-mono font-bold text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2">
                        <span>+88</span>
                      </div>
                      <Input
                        type="tel"
                        maxLength={11}
                        placeholder="017XXXXXXXX"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className="font-mono text-sm pl-16"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'bn' ? 'ওটিপি পাঠানোর মাধ্যম বেছে নিন' : 'Choose OTP Channel'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                          otpChannel === 'whatsapp'
                            ? 'border-[#25D366] bg-[#25D366]/10 text-emerald-800 dark:text-emerald-300 shadow-sm scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <OfficialWhatsAppIcon className="w-5 h-5" />
                        <span>WhatsApp OTP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                          otpChannel === 'sms'
                            ? 'border-[#0284C7] bg-[#0284C7]/10 text-sky-800 dark:text-sky-300 shadow-sm scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <OfficialSmsIcon className="w-5 h-5" />
                        <span>SMS OTP</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSendOtp}
                    disabled={!phoneValidation.isValid}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 shadow-md shadow-blue-600/25 disabled:opacity-50"
                  >
                    {language === 'bn' ? '৪ ডিজিট ওটিপি কোড পাঠান' : 'Send 4-Digit OTP'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtpAndResetPin} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? '৪ ডিজিট ওটিপি কোড' : '4-Digit OTP Code'}
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-xs">
                        (Demo Code: {generatedOtp})
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={otpInputRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpDigits[idx]}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(-1);
                            const newOtp = [...otpDigits];
                            newOtp[idx] = val;
                            setOtpDigits(newOtp);
                            if (val && idx < 3) otpInputRefs[idx + 1].current?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                              otpInputRefs[idx - 1].current?.focus();
                            }
                          }}
                          className="w-full h-12 text-center font-mono font-black text-xl rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'bn' ? 'নতুন ৪-সংখ্যার সিকিউরিটি পিন দিন' : 'New 4-Digit Security PIN'}
                    </label>

                    <div className="grid grid-cols-4 gap-2.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={newResetPinRefs[idx]}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={newResetPinDigits[idx]}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(-1);
                            const newP = [...newResetPinDigits];
                            newP[idx] = val;
                            setNewResetPinDigits(newP);
                            if (val && idx < 3) newResetPinRefs[idx + 1].current?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !newResetPinDigits[idx] && idx > 0) {
                              newResetPinRefs[idx - 1].current?.focus();
                            }
                          }}
                          className="w-full h-12 text-center font-mono font-black text-xl rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={otpDigits.join('').length !== 4 || newResetPinDigits.join('').length !== 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {language === 'bn' ? 'নতুন পিন সক্রিয় করুন ও লগইন করুন' : 'Confirm New PIN & Login'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={handleSendOtp}
                      className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {otpCountdown > 0
                        ? `${otpCountdown} সেকেন্ড পর পুনরায় পাঠান`
                        : (language === 'bn' ? 'আবার ওটিপি পাঠান' : 'Resend OTP')}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════ 6. DIGITAL TICKET MODAL ═══════ */}
      <AnimatePresence>
        {ticketModalOpen && directTicketData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setTicketModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                ✕
              </button>

              <div className="text-center space-y-1">
                <div className="font-black text-xl text-blue-600 dark:text-blue-400 tracking-tight">
                  ATOMS ADMISSION TRANSIT
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {language === 'bn' ? 'অফিসিয়াল ই-টিকিট ও যাত্রী বোর্ডিং পাস' : 'Official E-Ticket & Boarding Pass'}
                </div>
              </div>

              {/* Printable Ticket Area */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-mono font-bold text-blue-600">{directTicketData.booking_number}</span>
                  <span className="font-mono font-bold text-emerald-600">PAID & VERIFIED</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'যাত্রী:' : 'Passenger:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{directTicketData.contact_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'মোবাইল:' : 'Phone:'}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{directTicketData.contact_phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatDate(directTicketData.trip?.departure_date)} ({formatTime(directTicketData.trip?.departure_time)})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'আসন নম্বর:' : 'Seat Numbers:'}</span>
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {(directTicketData.seats || []).map((s: any) => s.seat_number).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-1">
                    <QrCode className="w-24 h-24 text-slate-900" />
                    <span className="text-[9px] font-mono text-slate-500">QR VERIFIED PASS</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handlePrintTicket}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  {language === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Download PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-5 border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
