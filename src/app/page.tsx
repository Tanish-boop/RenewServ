'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sun, 
  Check, 
  MapPin, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Droplet, 
  Wrench, 
  Activity, 
  Calendar,
  User, 
  Lock, 
  Mail, 
  Phone,
  AlertCircle,
  LogOut,
  X,
  HelpCircle,
  MessageSquare,
  FileCheck,
  Menu
} from 'lucide-react';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Registration Verification States
  const [regStep, setRegStep] = useState<'details' | 'verify'>('details');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);
  const [developerLogs, setDeveloperLogs] = useState<any>({ smsLogs: [], emailLogs: [] });
  const [developerLogsLoading, setDeveloperLogsLoading] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Coverage Checker State
  const [pincode, setPincode] = useState('');
  const [coverageResult, setCoverageResult] = useState<{ status: 'success' | 'fail' | null; message: string }>({
    status: null,
    message: ''
  });

  // Load current user session on mount
  useEffect(() => {
    fetchSession();
    if (searchParams.get('login') === 'true') {
      setShowAuthModal(true);
      setAuthTab('login');
    }
    if (typeof window !== 'undefined') {
      setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, [searchParams]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setCurrentUser(null);
    router.refresh();
  };

  const checkCoverage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pincode.trim();
    if (!trimmed || trimmed.length !== 6) {
      setCoverageResult({ status: 'fail', message: 'कृपया 6 अंकों का सही पिनकोड दर्ज करें (Please enter a valid 6-digit pin code).' });
      return;
    }

    const isSupportedPincode = (pin: string) => {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) return false;
      const num = parseInt(pin, 10);
      if (num >= 411001 && num <= 411062) return true;
      if (pin.startsWith('410') || pin.startsWith('412')) return true;
      return false;
    };
    
    if (isSupportedPincode(trimmed)) {
      setCoverageResult({
        status: 'success',
        message: '✓ We service your area! You can book your solar service now.'
      });
    } else {
      setCoverageResult({
        status: 'fail',
        message: 'We are expanding soon to your area! We currently cover Pune City (411001-411062) & surrounding outskirts starting with 410/412.'
      });
    }
  };

  const fetchSimulatedLogs = async () => {
    setDeveloperLogsLoading(true);
    try {
      const url = email.trim()
        ? `/api/auth/me/simulated-logs?email=${encodeURIComponent(email.trim())}`
        : '/api/auth/me/simulated-logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDeveloperLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeveloperLogsLoading(false);
    }
  };

  const handleCloseAuthModal = async () => {
    if (regStep === 'verify') {
      await fetch('/api/auth/login', { method: 'DELETE' });
      setCurrentUser(null);
    }
    setShowAuthModal(false);
    setAuthError('');
    setRegStep('details');
    setEmailOtp('');
    setPhoneOtp('');
    setVerifyError('');
    setVerifySuccess('');
    setForgotStep('email');
    setForgotOtp('');
    setNewPassword('');
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      const res = await fetch('/api/auth/verify-email/resend', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend email OTP');
      setVerifySuccess('Email verification code resent successfully!');
      fetchSimulatedLogs();
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResendPhone = async () => {
    setResendingPhone(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend mobile OTP');
      setVerifySuccess('Mobile OTP resent successfully!');
      fetchSimulatedLogs();
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setResendingPhone(false);
    }
  };

  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');
    setVerifyLoading(true);

    try {
      const emailRes = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode: emailOtp.trim() }),
      });
      const emailData = await emailRes.json();
      if (!emailRes.ok) throw new Error(emailData.error || 'Email verification failed');

      setVerifySuccess('Verification successful! Redirecting...');
      await fetchSession();
      setTimeout(() => {
        setShowAuthModal(false);
        setRegStep('details');
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Please check your OTP code.');
      fetchSimulatedLogs();
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authTab === 'forgot') {
        if (forgotStep === 'email') {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
          setForgotStep('otp');
          setAuthError('Reset code sent! Check sandbox logs or email.');
          fetchSimulatedLogs();
        } else {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), otpCode: forgotOtp, newPassword }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to reset password');
          setAuthTab('login');
          setAuthError('Password reset successful! Please login.');
          setForgotStep('email');
          setForgotOtp('');
          setNewPassword('');
        }
        return;
      }

      if (authTab === 'login') {
        const identifier = email.trim();
        if (!identifier.includes('@')) {
          const cleanP = identifier.replace(/\D/g, '');
          if (cleanP.length !== 10) {
            throw new Error('Mobile number must be exactly 10 digits.');
          }
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        setShowAuthModal(false);
        fetchSession();
        
        if (data.role === 'TECHNICIAN') {
          router.push('/technician');
        } else if (['ROOT_OWNER', 'OWNER'].includes(data.role)) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        const cleanP = phone.replace(/\D/g, '');
        if (cleanP.length !== 10) {
          throw new Error('Mobile number must be exactly 10 digits.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: cleanP, password }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        
        setRegStep('verify');
        fetchSimulatedLogs();
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const navigateToBooking = (serviceKey: string = 'PANEL_CLEANING') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_service', serviceKey);
    }
    if (currentUser) {
      router.push('/book');
    } else {
      setAuthTab('login');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 antialiased">
      
      {/* Sticky Banner + Header wrapper — both scroll-fixed together */}
      <div className="sticky top-0 z-50">

        {/* Top Banner - always visible */}
        <div className="bg-slate-900 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
          ⚡ Solar Panel Cleaning, Health Checks &amp; Reinstallation in Pune &amp; PCMC. Book at just <strong className="text-amber-400 font-bold">₹99</strong>!
        </div>


      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Renewserv Logo" className="h-14 w-auto object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Home</a>
            <a href="#why-us" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">About</a>
            <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Services</a>
            <a href="/e-waste" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors flex items-center gap-1">
              E-Waste <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">New</span>
            </a>
            <a href="/e-waste#industries" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Industries</a>
            <a href="#footer" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (currentUser.role === 'TECHNICIAN') router.push('/technician');
                    else if (['ROOT_OWNER', 'OWNER'].includes(currentUser.role)) router.push('/admin');
                    else router.push('/dashboard');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm transition-all"
                >
                  My Dashboard ({currentUser.role === 'ROOT_OWNER' ? 'Founder' : currentUser.role === 'OWNER' ? 'Owner' : currentUser.role})
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setShowAuthModal(true); setAuthTab('login'); }}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-slate-355 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-sm transition-all"
              >
                Sign In / Register
              </button>
            )}

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        </header>

        {showMobileMenu && (
          <div className="md:hidden bg-white border-b border-slate-200 py-3 px-4 shadow-inner space-y-2.5">
            <a href="#" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1 transition-colors">Home</a>
            <a href="#why-us" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1 transition-colors">About</a>
            <a href="#services" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1 transition-colors">Services</a>
            <a href="/e-waste" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-600 py-1 transition-colors flex items-center gap-1.5">
              E-Waste <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">New</span>
            </a>
            <a href="/e-waste#industries" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-600 py-1 transition-colors">Industries</a>
            <a href="#footer" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-blue-600 py-1 transition-colors">Contact</a>
          </div>
        )}
      </div>

      {/* 1. Hero Section - Full Background Image */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center border-b border-slate-800 overflow-hidden">
        
        {/* Background Image */}
        <img
          src="/hero_bg.png"
          alt="Solar panel cleaning technician on Pune rooftop"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark gradient overlay — strong on left, fading right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-900/75 to-slate-900/30" />
        {/* Extra bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Content Layer */}
        <div className="relative z-10 w-full px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            
            {/* Left Hero Content */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold backdrop-blur-sm">
                ✓ Pune &amp; PCMC Area Service
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg">
                Restore Your Solar Power <br className="hidden sm:inline" />
                <span className="text-amber-400">By Up To 35% Instantly</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Dirty panels reduce electricity generation. Book an expert site checkup and professional soft-water wash today. Senior citizen friendly booking.
              </p>
              
              {/* Quick Action Booking & Coverage Box */}
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl max-w-md mx-auto lg:mx-0 space-y-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Check Area Availability</span>
                <form onSubmit={checkCoverage} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit Pincode (e.g. 411038)" 
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all"
                  >
                    Verify
                  </button>
                </form>

                {coverageResult.status !== null && (
                  <div className={`p-3 rounded-lg text-xs font-semibold ${
                    coverageResult.status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {coverageResult.message}
                  </div>
                )}

                <button 
                  onClick={() => navigateToBooking('SITE_INSPECTION')}
                  className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Book Solar Health Check (₹99)
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Quick Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <ShieldCheck className="w-4 h-4 text-green-400" /> Verified Technicians
                </span>
                <span className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8/5 Star Rating
                </span>
                <span className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <FileCheck className="w-4 h-4 text-blue-400" /> GST Invoice Provided
                </span>
              </div>
            </div>

            {/* Right Hero - Floating Stats Card */}
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl space-y-6">
                <h3 className="font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3">Real Restored Generation (Pune Site)</h3>
                
                <div className="space-y-4">
                  {/* Dirty Panel metric */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-semibold">
                      <span className="text-red-600">Dirty Solar Panels (Before Cleaning)</span>
                      <span className="text-slate-600 font-bold">140V (50%)</span>
                    </div>
                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>

                  {/* Cleaned Panel metric */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-semibold">
                      <span className="text-green-700">Clean Solar Panels (After Cleaning)</span>
                      <span className="text-green-700 font-bold">230V (98%)</span>
                    </div>
                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 text-xs sm:text-sm text-blue-800 leading-relaxed">
                  <ShieldCheck className="w-6 h-6 shrink-0 text-blue-600 mt-0.5" />
                  <span><strong>Senior Citizen Guarantee:</strong> Friendly technicians handle complete roof climbing and setup safety. You don't have to step onto the terrace!</span>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-xl font-black text-blue-600">35%</div>
                    <div className="text-[10px] text-slate-500 font-medium">Avg. Boost</div>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <div className="text-xl font-black text-blue-600">4.8★</div>
                    <div className="text-[10px] text-slate-500 font-medium">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-blue-600">₹99</div>
                    <div className="text-[10px] text-slate-500 font-medium">Book Fee</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Services Section */}
      <section id="services" className="px-4 sm:px-6 py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Our Services</h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">Professional operations to maintain and clean your solar installation safely.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 - Panel Cleaning */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-amber-400 transition-all group cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between" onClick={() => navigateToBooking('PANEL_CLEANING')}>
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Starting ₹99</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Solar Panel Cleaning</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Purified water wash with scratch-free brushes. Removes dust, droppings & soot to restore peak efficiency.
                </p>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1 group-hover:bg-amber-500">
                  Book Now →
                </button>
              </div>
            </div>

            {/* Card 2 - Removal & Reinstallation */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-amber-400 transition-all group cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between" onClick={() => navigateToBooking('SYSTEM_DISMANTLING')}>
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-505 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Starting ₹1,499</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Panel Removal & Reinstallation</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Safe dismantling, rewiring, and secure re-installation for rooftop repairs, renovations or relocation.
                </p>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1 group-hover:bg-amber-500">
                  Book Now →
                </button>
              </div>
            </div>

            {/* Card 3 - Health Check */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-amber-400 transition-all group cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between" onClick={() => navigateToBooking('SITE_INSPECTION')}>
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-505 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Starting ₹199</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Solar Health Check</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Voltage output diagnosis, wiring safety check, degradation audit & official digital inspection report.
                </p>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1 group-hover:bg-amber-500">
                  Book Now →
                </button>
              </div>
            </div>

            {/* Card 4 - Annual Maintenance Plan */}
            <div className="p-6 rounded-2xl bg-white border border-amber-400/30 space-y-3 hover:border-amber-400 transition-all group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between" onClick={() => navigateToBooking('AMC_PLAN')}>
              <div className="absolute top-2 right-2 bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</div>
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-505 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Yearly Plan</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Annual Maintenance Plan</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  4 scheduled cleanings/year, priority callouts, structure checks & free diagnostics when output drops.
                </p>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1 group-hover:bg-amber-500">
                  Book Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 E-Waste Section */}
      <section id="e-waste-preview" className="px-4 sm:px-6 py-12 bg-green-50/10 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="p-6 sm:p-8 rounded-2xl bg-green-50/70 border-2 border-green-300 shadow-md shadow-green-600/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-300 text-green-800 text-[10px] font-extrabold uppercase tracking-wider w-fit mx-auto md:mx-0">
                <ShieldCheck className="w-3.5 h-3.5" /> Sustainability Division
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  E-Waste Management &amp; Recycling
                </h3>
                <p className="text-green-800 text-xs sm:text-sm font-bold tracking-wide">
                  Responsible Collection • Secure Disposal • Certified Recycling • EPR Compliance
                </p>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                Ensure certified IT asset retirement, NIST-compliant disk wiping, and CPCB audit readiness for your retired enterprise hardware.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0 text-center">
              <button
                onClick={() => router.push('/e-waste')}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Explore E-Waste Division <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How It Works</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">Book solar service in 3 simple steps without complex tech jargon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 font-bold flex items-center justify-center text-lg mx-auto border border-amber-400/20">1</div>
              <h3 className="font-bold text-lg text-white">Book Expert Visit (₹99)</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Select service, enter pincode, and pay ₹99 online booking fee to secure dispatch.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 font-bold flex items-center justify-center text-lg mx-auto border border-amber-400/20">2</div>
              <h3 className="font-bold text-lg text-white">Inspection & Price Quote</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Technician checks output voltages. Admin sends a transparent, itemized quotation to your portal.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 font-bold flex items-center justify-center text-lg mx-auto border border-amber-400/20">3</div>
              <h3 className="font-bold text-lg text-white">Restore & Clear</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Pay 50% advance to start work. Post-cleaning, verify the restored outputs and pay remaining invoice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section id="why-us" className="px-4 sm:px-6 py-16 max-w-6xl mx-auto border-b border-slate-200">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Why Housing Societies Trust Us</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">We focus on safety, honesty, and verified results for every Pune customer.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-5 border border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">100%</span>
            <h4 className="font-bold text-sm text-slate-900">Verified Techs</h4>
            <p className="text-slate-500 text-[11px]">Thoroughly background-checked technicians only.</p>
          </div>

          <div className="p-5 border border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">Soft</span>
            <h4 className="font-bold text-sm text-slate-900">Purified Water</h4>
            <p className="text-slate-500 text-[11px]">Prevents scaling and white stains on panel glass.</p>
          </div>

          <div className="p-5 border border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">Escrow</span>
            <h4 className="font-bold text-sm text-slate-900">Payment Safety</h4>
            <p className="text-slate-500 text-[11px]">Funds released only after job completion verification.</p>
          </div>

          <div className="p-5 border border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">₹99</span>
            <h4 className="font-bold text-sm text-slate-900">Booking Adjust</h4>
            <p className="text-slate-500 text-[11px]">Your checkup fee is credited back in the final bill.</p>
          </div>
        </div>
      </section>

      {/* 5. Before/After comparison - Full Image Showcase */}
      <section className="py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Before &amp; After Results</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">See the dramatic difference our professional solar cleaning makes — real panels, real Pune homes.</p>
          </div>

          {/* Hero Wide Split Comparison */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl h-64 sm:h-96 md:h-[440px] bg-slate-800 group">
            <img
              src="/solar_hero_comparison.png"
              alt="Solar panel before and after cleaning split comparison"
              className="w-full h-full object-cover"
            />
            {/* Overlay labels */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Before Cleaning
            </div>
            <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
              After Cleaning
            </div>
            {/* Center Divider Badge */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-amber-400 shadow-xl flex items-center justify-center font-black text-slate-800 text-base">
                ⟺
              </div>
            </div>
            {/* Bottom stat strip */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent px-5 py-4 flex justify-between items-end">
              <div className="text-red-400 text-xs font-bold">⚡ 50% Output (Dirty)</div>
              <div className="text-green-400 text-xs font-bold">⚡ 98% Output (Clean) ↑</div>
            </div>
          </div>

          {/* Two Individual Photo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Panel Removal & Reinstallation Card */}
            <div className="rounded-2xl overflow-hidden border border-blue-700/50 bg-slate-800 shadow-lg">
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src="/panel_reinstallation.png"
                  alt="Solar panel removal and reinstallation service"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  🔧 Panel Removal &amp; Reinstallation
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-extrabold text-sm">Safe Dismantling &amp; Re-mounting</div>
                  <div className="text-blue-300 text-xs mt-0.5">For renovations, repairs or rooftop relocation</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Service Type</span>
                  <span className="text-blue-405 font-extrabold">From ₹1,499</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Safe Dismantling', 'Frame Alignment', 'Rewiring', 'Full Reinstallation'].map(tag => (
                    <span key={tag} className="text-[10px] bg-blue-900/40 text-blue-350 px-2 py-0.5 rounded-full border border-blue-800/50">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Panel Card */}
            <div className="rounded-2xl overflow-hidden border border-green-700/50 bg-slate-800 shadow-lg">
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src="/solar_panel_clean.png"
                  alt="Clean solar panels after professional cleaning"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                <div className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  ✨ Solar Panel Cleaning
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-extrabold text-sm">Professional Cleaning Service</div>
                  <div className="text-green-300 text-xs mt-0.5">Purified RO wash to restore up to 98% output</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Power Output</span>
                  <span className="text-green-400 font-extrabold">230V / 98% ↑</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Dust-free Glass', 'Purified Water Wash', 'Chemical-free', 'Peak Efficiency'].map(tag => (
                    <span key={tag} className="text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full border border-green-800/50">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-800 rounded-2xl border border-slate-700">
            <div>
              <div className="text-white font-extrabold text-base">📈 Average 35% output boost after one cleaning</div>
              <div className="text-slate-400 text-xs mt-0.5">Results verified on Pune residential &amp; society rooftops by our technicians.</div>
            </div>
            <button
              onClick={() => navigateToBooking('PANEL_CLEANING')}
              className="shrink-0 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm transition-all shadow-lg hover:shadow-amber-400/20 flex items-center gap-2"
            >
              Book Cleaning Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="px-4 sm:px-6 py-16 max-w-6xl mx-auto border-b border-slate-200">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Client Reviews from Pune</h2>
          <p className="text-slate-600 text-sm sm:text-base">What housing society committee members and homeowners say about our work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center text-amber-500 gap-1"><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /></div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              "We cleaned our society's 15kW rooftop solar in Kothrud. The technicians were verified, wore safety ropes, and finished everything within 3 hours. The output jumped by 32%."
            </p>
            <div className="font-bold text-xs text-slate-900">- Shirish Gokhale (Kothrud Society, Pune)</div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center text-amber-500 gap-1"><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /></div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              "Being a senior citizen, I cannot climb onto the roof. The technician Ramesh took photos before and after the wash, tested the inverter outputs, and sent the report. Outstanding honesty!"
            </p>
            <div className="font-bold text-xs text-slate-900">- Mrs. Prabha Kulkarni (Aundh, Pune)</div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center text-amber-500 gap-1"><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /></div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              "Highly professional service. They use purified soft water to prevent chemical scaling. Very clear pricing structure. The ₹99 fee was adjusted in the final bill."
            </p>
            <div className="font-bold text-xs text-slate-900">- Rahul Deshmukh (Wakad, PCMC)</div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section id="faq" className="px-4 sm:px-6 py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-sm sm:text-base">Everything you need to know about booking and safety.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Q: Is the ₹99 booking fee refundable?</h4>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                The ₹99 fee is collected to arrange and conduct the site inspection and is therefore treated as a separate service charge from the final quotation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Q: Why do you use purified water?</h4>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Borewell or hard tap water leaves white calcium stains (scaling) on panels which permanently blocks sunlight. We wash using Reverse-Osmosis (RO) soft water to protect your glass panels.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Q: How do you verify the output improvement?</h4>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Our technician measures the voltage outputs at the inverter before cleaning and after cleaning. These values are recorded in your digital Solar Health Check file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Call to Action */}
      <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Ready to Restore Your Solar Power Output?</h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Book your Solar Health Check now. Get a detailed output report and verified panel cleaning quotation.
        </p>
        <button 
          onClick={() => navigateToBooking('SITE_INSPECTION')}
          className="px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow hover:shadow-md transition-all inline-flex items-center gap-2"
        >
          Book Solar Health Check Now
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-450 border-t border-slate-800 py-12 px-4 sm:px-6 text-center text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Renewserv Logo" className="h-12 w-auto object-contain" />
            <span className="text-slate-500">© 2026. Pune, Maharashtra, India.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center gap-3 justify-between">
        <div>
          <span className="text-[10px] text-slate-500 block">Health Check Booking Fee</span>
          <span className="font-bold text-slate-900 text-sm">₹99 Only</span>
        </div>
        <button 
          onClick={() => navigateToBooking('SITE_INSPECTION')}
          className="px-5 py-3 rounded-lg bg-blue-600 text-white font-bold text-xs"
        >
          Book Now
        </button>
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-6">
            <button 
              onClick={handleCloseAuthModal}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            {regStep === 'details' ? (
              <>
                {/* Tab Swappers */}
                {authTab !== 'forgot' && (
                  <div className="flex border-b border-slate-200 text-sm">
                    <button 
                      onClick={() => { setAuthTab('login'); setAuthError(''); }}
                      className={`flex-1 pb-3 text-center font-bold transition-all relative ${
                        authTab === 'login' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Sign In
                      {authTab === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600" />}
                    </button>
                    <button 
                      onClick={() => { setAuthTab('register'); setAuthError(''); }}
                      className={`flex-1 pb-3 text-center font-bold transition-all relative ${
                        authTab === 'register' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Register
                      {authTab === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600" />}
                    </button>
                  </div>
                )}

                {authTab === 'forgot' && (
                  <div className="text-center space-y-1">
                    <h4 className="font-extrabold text-lg text-slate-900">
                      {forgotStep === 'email' ? 'Forgot Password?' : 'Reset Password'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {forgotStep === 'email' 
                        ? 'Enter your registered email address to receive a 6-digit reset code.' 
                        : 'Enter the 6-digit code and your new password below.'}
                    </p>
                  </div>
                )}

                {authError && (
                  <div className={`p-3.5 rounded-lg border text-xs sm:text-sm flex gap-2 ${
                    authError.includes('successful') || authError.includes('sent')
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-750'
                  }`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authTab === 'forgot' ? (
                    forgotStep === 'email' ? (
                      /* Step 1: Input Email */
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-600">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="email" 
                            placeholder="john@example.com" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Step 2: Input OTP & New Password */
                      <>
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-600">6-Digit Code (OTP)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 123456" 
                            required
                            maxLength={6}
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm font-semibold tracking-widest text-center"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-600">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </>
                    )
                  ) : (
                    /* Default login/register fields */
                    <>
                      {authTab === 'register' && (
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-600">Full Name (पूरा नाम)</label>
                          <div className="relative">
                            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="e.g. Ramesh Deshmukh" 
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-600">
                          {authTab === 'login' ? 'Email or Mobile Number' : 'Email Address'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder={authTab === 'login' ? "john@example.com or 9765539107" : "john@example.com"} 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      {authTab === 'register' && (
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-bold text-slate-600">Mobile Number (10 digits)</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="tel" 
                              placeholder="9765539107" 
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600">Password</label>
                          {authTab === 'login' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuthTab('forgot');
                                setForgotStep('email');
                                setAuthError('');
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-750 transition"
                            >
                              Forgot Password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow hover:shadow-md transition-all flex items-center justify-center"
                  >
                    {authLoading ? 'Verifying...' : authTab === 'forgot' ? (forgotStep === 'email' ? 'Send Reset OTP' : 'Reset Password') : authTab === 'login' ? 'Sign In' : 'Create Account'}
                  </button>

                  {authTab === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setAuthError('');
                        setForgotStep('email');
                        setForgotOtp('');
                        setNewPassword('');
                      }}
                      className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      ← Back to Sign In
                    </button>
                  )}
                </form>

                {/* Developer Sandbox in Forgot Password Modal */}
                {isLocalhost && authTab === 'forgot' && forgotStep === 'otp' && developerLogs && developerLogs.emailLogs?.length > 0 && (
                  <div className="p-3 bg-slate-900 text-slate-300 rounded-xl space-y-2 border border-slate-700 text-left mt-4">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-black text-amber-400">Developer Sandbox Logs</span>
                      <button
                        type="button"
                        onClick={fetchSimulatedLogs}
                        disabled={developerLogsLoading}
                        className="text-[9px] hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded"
                      >
                        Refresh Logs
                      </button>
                    </div>
                    <div className="text-[10px] space-y-1.5 max-h-24 overflow-y-auto font-mono text-left font-sans">
                      {developerLogs.emailLogs?.slice(0, 1).map((log: any) => (
                        <div key={log.id} className="text-amber-300">
                          📨 Reset Email OTP: <span className="text-white font-bold">{log.body.match(/\b\d{6}\b/)?.[0] || log.body}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleVerifyRegister} className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-lg text-slate-900">Account Verification Required</h4>
                  <p className="text-xs text-slate-500">Please verify your credentials to confirm your bookings.</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl text-left leading-normal">
                  ⚡ Verification OTP code sent successfully! Check your inbox or copy from the sandbox logger below.
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 text-slate-600">Verify Email (Enter OTP)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456" 
                      required
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-sm font-semibold tracking-widest text-center"
                    />
                  </div>
                </div>

                {verifyError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-750 text-xs text-left">
                    {verifyError}
                  </div>
                )}

                {verifySuccess && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs text-left">
                    {verifySuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow transition-all flex items-center justify-center"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify OTP & Activate'}
                </button>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    className="w-full py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition"
                  >
                    {resendingEmail ? 'Resending...' : 'Resend Email'}
                  </button>
                </div>

                {/* Developer Sandbox in Register Modal */}
                {isLocalhost && developerLogs && (developerLogs.smsLogs?.length > 0 || developerLogs.emailLogs?.length > 0) && (
                  <div className="p-3 bg-slate-900 text-slate-300 rounded-xl space-y-2 border border-slate-700 text-left">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-black text-amber-400">Developer Sandbox Logs</span>
                      <button
                        type="button"
                        onClick={fetchSimulatedLogs}
                        disabled={developerLogsLoading}
                        className="text-[9px] hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded"
                      >
                        Refresh Logs
                      </button>
                    </div>
                    <div className="text-[10px] space-y-1.5 max-h-24 overflow-y-auto font-mono text-left">
                      {developerLogs.emailLogs?.slice(0, 1).map((log: any) => (
                        <div key={log.id} className="text-amber-300">
                          📨 Email OTP: <span className="text-white font-bold">{log.body.match(/\b\d{6}\b/)?.[0] || log.body}</span>
                        </div>
                      ))}
                      {developerLogs.smsLogs?.slice(0, 1).map((log: any) => (
                        <div key={log.id} className="text-green-400">
                          💬 SMS OTP: <span className="text-white font-bold">{log.body.match(/\b\d{6}\b/)?.[0] || log.body}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
        Loading...
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
