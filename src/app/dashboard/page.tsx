'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  LogOut,
  Star,
  Phone,
  MessageSquare,
  Wrench,
  Shield,
  Droplet,
  UserCheck,
  Activity,
  Plus,
  Trash2,
  X,
  PhoneCall
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'invoices' | 'support' | 'profile'>('home');
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Tracking states (used in modal)
  const [trackingStatus, setTrackingStatus] = useState<string>('');
  const [trackingTech, setTrackingTech] = useState<string>('');
  const [trackingRating, setTrackingRating] = useState<number>(5.0);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Support Request State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Action state
  const [approvingQuote, setApprovingQuote] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Verification & Preference states
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentMsg, setEmailSentMsg] = useState('');

  // Email OTP specific states
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailOtpSuccess, setEmailOtpSuccess] = useState('');

  // Rooftop Solar Cleanliness Auditor states
  const [auditorCapacity, setAuditorCapacity] = useState<number>(3);
  const [auditorMonths, setAuditorMonths] = useState<number>(3);

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Developer Simulator State
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'bot', text: '👋 *Renewserv WhatsApp Chatbot Simulator* ☀️\n\nType any message like *Hi*, *Track*, *Pay Now*, or *Invoice* to test the WhatsApp automation in real time.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [developerLogs, setDeveloperLogs] = useState<any>({ smsLogs: [], emailLogs: [] });
  const [developerLogsLoading, setDeveloperLogsLoading] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    fetchSessionAndData();
    if (typeof window !== 'undefined') {
      setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, [router]);

  // Clean up SSE stream on unmount or tracking target change
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    if (showTrackingModal && selectedBooking && ['ASSIGNED', 'TECHNICIAN_ON_THE_WAY', 'INSPECTION_COMPLETED', 'QUOTE_SENT', 'APPROVED', 'WORK_STARTED'].includes(selectedBooking.status)) {
      setTrackingLoading(true);
      eventSource = new EventSource(`/api/bookings/track/${selectedBooking.id}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error('SSE Error:', data.error);
            return;
          }
          
          setTrackingStatus(data.status);
          if (data.technician) setTrackingTech(data.technician);
          if (data.rating) setTrackingRating(data.rating);
          
          // Update local bookings array status as well
          setBookings(prevBookings => 
            prevBookings.map(b => b.id === data.bookingId ? { ...b, status: data.status } : b)
          );
          
          // Update selected booking status
          setSelectedBooking((prevSelected: any) => {
            if (prevSelected && prevSelected.id === data.bookingId) {
              return { ...prevSelected, status: data.status };
            }
            return prevSelected;
          });
        } catch (e) {
          console.error('Parsing SSE message failed:', e);
        } finally {
          setTrackingLoading(false);
        }
      };

      eventSource.onerror = () => {
        setTrackingLoading(false);
        if (eventSource) eventSource.close();
      };
    } else {
      if (selectedBooking) {
        setTrackingStatus(selectedBooking.status);
        setTrackingTech(selectedBooking.technicianAssignments?.[0]?.technician?.user?.profile?.name || '');
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [selectedBooking, showTrackingModal]);

  const fetchSessionAndData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/?login=true');
        return;
      }
      
      setCurrentUser(data.user);
      setLoadingUser(false);
      
      // Fetch user bookings
      const bookingsRes = await fetch('/api/bookings');
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);
      fetchSimulatedLogs();
    } catch (err) {
      router.push('/?login=true');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  const startEditing = () => {
    setEditName(currentUser?.name || '');
    setEditPhone(currentUser?.phone || '');
    setIsEditingProfile(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setEditSuccess('Profile updated successfully!');
      await fetchSessionAndData();
      setTimeout(() => {
        setIsEditingProfile(false);
        setEditSuccess('');
      }, 1500);
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setEditLoading(false);
    }
  };

  const handleApproveQuote = async (bookingId: string) => {
    setApprovingQuote(true);
    setActionMessage('');
    
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'APPROVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve quote');
      setActionMessage('Quote approved! Advance payment successfully simulated.');
      fetchSessionAndData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Error approving quote.');
    } finally {
      setApprovingQuote(false);
    }
  };

  const handleResendEmailVerification = async () => {
    setResendingEmail(true);
    setEmailSentMsg('');
    try {
      const res = await fetch('/api/auth/verify-email/resend', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend link');
      setEmailSentMsg('Verification OTP code sent successfully! Check your inbox.');
      fetchSimulatedLogs();
    } catch (err: any) {
      setEmailSentMsg(err.message || 'Error resending link.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_OTP' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSuccess('6-digit OTP code dispatched successfully!');
      fetchSimulatedLogs();
    } catch (err: any) {
      setOtpError(err.message || 'Error dispatching OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setOtpVerifying(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_OTP', otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      setOtpSuccess('Phone number verified successfully!');
      setTimeout(() => {
        setShowPhoneOtpModal(false);
        fetchSessionAndData();
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailOtpVerifying(true);
    setEmailOtpError('');
    setEmailOtpSuccess('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode: emailOtpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify email OTP');
      setEmailOtpSuccess('Email verified successfully!');
      setTimeout(() => {
        setShowEmailOtpModal(false);
        fetchSessionAndData();
      }, 1500);
    } catch (err: any) {
      setEmailOtpError(err.message || 'Verification failed.');
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const fetchSimulatedLogs = async () => {
    setDeveloperLogsLoading(true);
    try {
      const res = await fetch('/api/auth/me/simulated-logs');
      const data = await res.json();
      if (res.ok) {
        setDeveloperLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeveloperLogsLoading(false);
    }
  };

  const handleSendWhatsappMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;
    
    const userMsgText = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { role: 'user', text: userMsgText, time: timeStr }]);
    setChatInput('');
    setChatSending(true);

    try {
      const cleanPhone = currentUser?.phone || '9876543210';
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: `whatsapp:+91${cleanPhone}`,
          Body: userMsgText
        })
      });

      const xmlText = await res.text();
      const match = xmlText.match(/<Message>([\s\S]*?)<\/Message>/);
      const responseText = match ? match[1] : xmlText;

      setChatMessages(prev => [...prev, { role: 'bot', text: responseText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      await fetchSimulatedLogs();
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Error dispatching message to webhook endpoint.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportLoading(true);
    setSupportSuccess('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'GENERAL',
          subject: 'Customer Dashboard Callback Request',
          message: supportMessage.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to submit callback request.');
      setSupportSuccess('Callback request submitted successfully! Support will call you within 15 minutes.');
      setSupportMessage('');
    } catch (err: any) {
      setSupportSuccess('Failed to submit request. Please call directly.');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleBookServiceType = (serviceKey: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_service', serviceKey);
    }
    router.push('/book');
  };

  // Helper to map DB service codes to clean Hindi/English customer labels
  const getCleanServiceName = (type: string) => {
    switch (type) {
      case 'PANEL_CLEANING': return '🧼 Solar Panel Cleaning';
      case 'HEALTH_CHECK': return '⚡ Solar Health Check';
      case 'REMOVAL_REINSTALL': return '🔧 Solar Panel Removal & Reinstallation';
      case 'AMC_PLAN': return '📅 Annual Maintenance Plan';
      default: return type;
    }
  };

  // Helper to check what timeline step is active
  const getTimelineStep = (status: string) => {
    const steps = [
      'PENDING',
      'ASSIGNED',
      'TECHNICIAN_ON_THE_WAY',
      'INSPECTION_COMPLETED',
      'QUOTE_SENT',
      'APPROVED',
      'WORK_STARTED',
      'COMPLETED'
    ];
    return steps.indexOf(status);
  };

  const timelineSteps = [
    { key: 'PENDING', label: 'Booking Placed' },
    { key: 'ASSIGNED', label: 'Technician Assigned' },
    { key: 'TECHNICIAN_ON_THE_WAY', label: 'On The Way' },
    { key: 'INSPECTION_COMPLETED', label: 'Inspected' },
    { key: 'QUOTE_SENT', label: 'Quoted' },
    { key: 'APPROVED', label: 'Scheduled' },
    { key: 'WORK_STARTED', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="mt-4 font-semibold text-sm">Loading Customer Portal...</span>
      </div>
    );
  }

  // Find active non-completed bookings to display tracker
  const activeBooking = bookings.find(b => b.status !== 'COMPLETED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased pb-20 md:pb-6">
      
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium w-full z-50">
        ⚡ Solar Panel Cleaning, Health Checks &amp; Reinstallation in Pune &amp; PCMC. Book at just <strong className="text-amber-400 font-bold">₹99</strong>!
      </div>

      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm hidden md:block">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img src="/logo.png" alt="Renewserv Logo" className="h-14 md:h-16 w-auto object-contain transition-all duration-350" />
          </div>

          <nav className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('home')}
              className={`text-sm font-bold transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`text-sm font-bold transition-colors ${activeTab === 'services' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              My Services
            </button>
            <button 
              onClick={() => setActiveTab('invoices')}
              className={`text-sm font-bold transition-colors ${activeTab === 'invoices' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Invoices
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`text-sm font-bold transition-colors ${activeTab === 'support' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Support
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
            >
              Profile
            </button>
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-red-650 bg-slate-100 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm md:hidden flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('home')}>
          <img src="/logo.png" alt="Renewserv Logo" className="h-14 sm:h-16 w-auto object-contain transition-all duration-350" />
        </div>

        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-slate-655 flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        
        {/* ==================== TAB: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Welcoming Header */}
            <div className="bg-gradient-to-r from-amber-400/20 to-blue-500/10 p-6 rounded-2xl border border-slate-200 text-left">
              <h2 className="font-black text-slate-950 text-2xl">
                {currentUser.name === 'Founder / Root Owner' || currentUser.name === 'Founder Tanish'
                  ? 'hello Founder Tanish'
                  : `Hello, ${currentUser.name || 'Customer'}`}
              </h2>
              <p className="text-slate-650 text-sm mt-1 font-medium">
                How can we help you today?
              </p>
              
              <button 
                onClick={() => {
                  document.getElementById('choose-service')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center gap-2"
              >
                <span>BOOK SERVICE NOW</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* My Active Service Section (Only if booking exists) */}
            {activeBooking && (
              <div className="bg-white p-5 rounded-2xl border-2 border-blue-550 border-blue-600 shadow-md space-y-4 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active Booking
                    </span>
                    <h3 className="font-black text-slate-950 text-base mt-1">
                      {getCleanServiceName(activeBooking.serviceType)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    ID: RNW-{activeBooking.createdAt.slice(2,4)}-{activeBooking.id.slice(0,5).toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-extrabold text-blue-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 shrink-0 animate-pulse text-amber-500" />
                      {activeBooking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Date</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {new Date(activeBooking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setSelectedBooking(activeBooking);
                      setShowTrackingModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-black shadow-sm transition-all"
                  >
                    Track Service
                  </button>
                  {activeBooking.quote && (
                    <button 
                      onClick={() => setActiveTab('invoices')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
                    >
                      View Quote / Invoice
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('support')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            )}

            {/* Service Selection Cards */}
            <div id="choose-service" className="space-y-4 text-left">
              <h3 className="font-extrabold text-slate-900 text-lg">Choose Solar Service</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD 1: SOLAR CLEANING */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-450 hover:border-amber-400 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">🧼</span>
                      <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Starting ₹99
                      </span>
                    </div>
                    <h4 className="font-black text-slate-950 text-base">Solar Panel Cleaning</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Deep pressure water and chemical-free cleaning. Boosts solar generation efficiency instantly by removing dust, bird droppings, and grime.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBookServiceType('PANEL_CLEANING')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    Book Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 2: REMOVAL & REINSTALLATION */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-450 hover:border-amber-400 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">Wrench🔧</span>
                      <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Starting ₹1,499
                      </span>
                    </div>
                    <h4 className="font-black text-slate-950 text-base">Solar Panel Removal & Reinstallation</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Safe dismantling and secure re-installation of panels. Perfect for roof repair, waterproofing, panel alignment, or relocation.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBookServiceType('REMOVAL_REINSTALL')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    Book Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 3: HEALTH CHECK */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-450 hover:border-amber-400 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">⚡</span>
                      <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Starting ₹199
                      </span>
                    </div>
                    <h4 className="font-black text-slate-950 text-base">Solar Health Check</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Diagnostic tests, voltage wire checks, structure inspection, and detailed generation audit report by certified solar engineers.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBookServiceType('HEALTH_CHECK')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    Book Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD 4: ANNUAL MAINTENANCE PLAN */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-450 hover:border-amber-400 transition-all flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Yearly Plan
                      </span>
                    </div>
                    <h4 className="font-black text-slate-950 text-base">Annual Maintenance Plan</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Peace of mind year-round. Includes 4 scheduled cleanings, priority structure checks, and free diagnostic callouts when generation drops.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBookServiceType('AMC_PLAN')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    Book Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Support Direct Assistance */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 text-left shadow-lg">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">Direct Helpline</span>
                <h4 className="font-extrabold text-base text-white">Speak Directly With Support</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Renewserv is Pune's local solar partner. If you have custom systems, queries, or need direct booking assistance, connect with us now.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a 
                  href="tel:+919765539107" 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-extrabold rounded-lg text-xs transition shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call Support (+91 9765539107)
                </a>
                <a 
                  href="https://wa.me/919765539107?text=Hi%20Renewserv" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* WHY CHOOSE RENEWSERV FEATURE GRID */}
            <div className="space-y-4 text-left">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Why Choose Renewserv?</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Professional service. Transparent pricing. Happy homes.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Verified Technicians */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                    🛡️
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">Verified Technicians</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">Trained & background verified experts</p>
                  </div>
                </div>

                {/* 2. Transparent Pricing */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                    ₹
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">Transparent Pricing</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">No hidden charges. What we quote, is what you pay.</p>
                  </div>
                </div>

                {/* 3. WhatsApp Support */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366]">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.85-4.417 9.854-9.842.002-2.628-1.02-5.1-2.875-6.956C17.18 1.85 14.716.826 12.01.825c-5.432 0-9.855 4.416-9.859 9.841a9.78 9.78 0 0 0 1.484 5.148l-1.01 3.692 3.784-.992zm11.705-4.705c-.322-.161-1.902-.937-2.196-1.042-.294-.105-.508-.158-.722.162-.215.32-.829 1.042-1.016 1.253-.187.21-.374.237-.696.075-.322-.161-1.36-.5-2.59-1.597-.957-.852-1.602-1.905-1.79-2.226-.188-.322-.02-.496.141-.656.145-.143.322-.375.483-.562.161-.188.215-.322.322-.536.107-.215.053-.402-.026-.562-.078-.161-.722-1.737-.99-2.38-.261-.627-.525-.541-.722-.551l-.615-.008c-.215 0-.563.08-0.857.4-.294.32-1.124 1.097-1.124 2.678 0 1.58 1.15 3.11 1.31 3.324.161.214 2.264 3.458 5.484 4.851.766.331 1.363.528 1.83.676.77.244 1.47.21 2.023.128.618-.093 1.902-.777 2.169-1.488.267-.711.267-1.319.187-1.438-.079-.12-.293-.181-.615-.343z"/>
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">WhatsApp Support</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">Real-time updates and easy support</p>
                  </div>
                </div>

                {/* 4. Before & After Photos */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                    📷
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">Before & After Photos</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">See the difference we bring</p>
                  </div>
                </div>

                {/* 5. GST Invoice */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                    📄
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">GST Invoice</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">Get proper invoice for every service</p>
                  </div>
                </div>

                {/* 6. Service Warranty */}
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                    🛡️
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-extrabold text-slate-900">Service Warranty</h4>
                    <p className="text-[9px] text-slate-550 text-slate-500 leading-normal">Assured quality and peace of mind</p>
                  </div>
                </div>
              </div>
            </div>

            {/* REAL RESULTS BEFORE/AFTER DISPLAY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Real Results You Can See</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Dust-free panels. More power. More savings.</p>
                </div>
                <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100 shrink-0 self-start sm:self-center">
                  📈 Upto 20% More Power Output*
                </div>
              </div>

              {/* Before/After Image split display */}
              <div 
                className="relative rounded-xl overflow-hidden border border-slate-200 h-64 md:h-[380px] bg-slate-900 cursor-zoom-in group/img hover:border-slate-350 transition-all"
                onClick={() => setActiveLightboxImage('/solar_hero_comparison.png')}
              >
                <img 
                  src="/solar_hero_comparison.png" 
                  alt="Solar panels before and after cleaning comparison" 
                  className="w-full h-full object-cover"
                />
                
                {/* Labels overlay */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                  Before Cleaning (Dirty panels &amp; terrace)
                </div>
                
                <div className="absolute top-3 right-3 bg-green-600/90 text-white text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                  After Cleaning (Clean panels &amp; terrace)
                </div>

                {/* Vertical Split Indicator */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white border-2 border-amber-400 shadow-md flex items-center justify-center font-black text-slate-800 text-sm">
                    ⟺
                  </div>
                </div>

                {/* Bottom stat bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent px-4 py-3 flex justify-between items-end">
                  <div className="text-red-400 text-[10px] font-bold">⚡ 50% Output (Before)</div>
                  <div className="text-green-400 text-[10px] font-bold">⚡ 98% Output (After) ↑</div>
                </div>
              </div>

              {/* Individual Photo Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clean Panel Card */}
                <div className="rounded-xl overflow-hidden border border-green-200 bg-white shadow-sm">
                  <div 
                    className="relative h-44 overflow-hidden cursor-zoom-in group/img"
                    onClick={() => setActiveLightboxImage('/solar_panel_clean.png')}
                  >
                    <img
                      src="/solar_panel_clean.png"
                      alt="Clean solar panels after professional cleaning"
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded">View Full Image</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                      ✨ Solar Panel Cleaning
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white font-bold text-xs">Professional Cleaning</div>
                      <div className="text-green-300 text-[10px]">RO Soft Water Wash</div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Power Output</span>
                      <span className="text-green-600 font-bold">230V / 98% ↑</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['RO Soft Water', 'Dust Removal', 'Output Test'].map(t => (
                        <span key={t} className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel Reinstallation Card */}
                <div className="rounded-xl overflow-hidden border border-blue-200 bg-white shadow-sm">
                  <div 
                    className="relative h-44 overflow-hidden cursor-zoom-in group/img"
                    onClick={() => setActiveLightboxImage('/panel_reinstallation.png')}
                  >
                    <img
                      src="/panel_reinstallation.png"
                      alt="Solar panel removal and reinstallation service"
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded">View Full Image</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    <div className="absolute top-2 left-2 bg-blue-650 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                      🔧 Removal &amp; Reinstallation
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white font-bold text-xs">Safe Dismantling &amp; Mounting</div>
                      <div className="text-blue-300 text-[10px]">For repairs, renovations or relocate</div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Service Cost</span>
                      <span className="text-blue-600 font-bold">From ₹1,499</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Safe Handling', 'Frame Alignment', 'Rewiring'].map(t => (
                        <span key={t} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-green-700 font-extrabold">
                <span>✅</span>
                <span>Solar panels cleaned by Renewserv technician in Pune</span>
              </div>
            </div>

            {/* WHAT OUR CUSTOMERS SAY */}
            <div className="space-y-4 text-left pb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">What Our Customers Say</h3>
                <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ⭐ 4.8/5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Review 1 */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex text-amber-400 text-sm font-bold">
                      ★★★★★
                    </div>
                    <p className="text-xs text-slate-755 text-slate-700 italic leading-relaxed">
                      "Great service! My panels look new and performance has definitely improved."
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                      AV
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold">Amit Verma</strong>
                      <span className="text-[10px] text-slate-500 block">Wakad, Pune</span>
                    </div>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex text-amber-400 text-sm font-bold">
                      ★★★★★
                    </div>
                    <p className="text-xs text-slate-755 text-slate-700 italic leading-relaxed">
                      "Technician was punctual and very professional. Highly recommended."
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                      PP
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold">Priya Patil</strong>
                      <span className="text-[10px] text-slate-500 block">Hinjewadi, Pune</span>
                    </div>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex text-amber-400 text-sm font-bold">
                      ★★★★★
                    </div>
                    <p className="text-xs text-slate-755 text-slate-700 italic leading-relaxed">
                      "Easy booking, timely service and clear communication. Happy with Renewserv!"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                      RD
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold">Rohan Deshmukh</strong>
                      <span className="text-[10px] text-slate-500 block">Kothrud, Pune</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </div>
        )}

        {/* ==================== TAB: SERVICES (BOOKINGS LIST) ==================== */}
        {activeTab === 'services' && (
          <div className="space-y-4 text-left">
            <h2 className="font-black text-slate-950 text-xl">My Solar Bookings</h2>
            
            {bookings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-3">
                <p className="text-xs">You have no active or completed solar bookings yet.</p>
                <button 
                  onClick={() => handleBookServiceType('PANEL_CLEANING')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow"
                >
                  Book Solar Cleaning (₹99)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const isCompleted = booking.status === 'COMPLETED';
                  const needsApproval = booking.status === 'QUOTE_SENT';
                  
                  return (
                    <div key={booking.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">
                            Booking ID: RNW-{booking.createdAt.slice(2,4)}-{booking.id.slice(0,5).toUpperCase()}
                          </span>
                          <h3 className="font-extrabold text-slate-950 text-sm mt-0.5">
                            {getCleanServiceName(booking.serviceType)}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isCompleted ? 'bg-green-55 bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-450 block">Scheduled Date</span>
                          <strong className="text-slate-800">
                            {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 block">Time Slot</span>
                          <strong className="text-slate-800">{booking.scheduledTime}</strong>
                        </div>
                        {booking.inspectionReport?.findings && (
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-450 block">Inspection Findings</span>
                            <strong className="text-blue-600 line-clamp-1">{booking.inspectionReport.findings}</strong>
                          </div>
                        )}
                      </div>

                      {/* Diagnostic image preview if completed */}
                      {isCompleted && booking.jobImages?.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-450 block mb-1.5 font-medium">Before &amp; After Work Photos (Click to Enlarge)</span>
                          <div className="flex flex-wrap gap-2.5">
                            {booking.jobImages.map((img: any) => (
                              <div 
                                key={img.id}
                                className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 hover:border-blue-500 transition-all hover:scale-[1.03]"
                                onClick={() => setActiveLightboxImage(img.encryptedUrl || img.url)}
                              >
                                <img 
                                  src={img.encryptedUrl || 'https://via.placeholder.com/150'}
                                  alt="Solar Panel Clean"
                                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded-md">View</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
                        <button 
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowTrackingModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Track Progress
                        </button>
                        
                        {needsApproval && (
                          <button 
                            onClick={() => handleApproveQuote(booking.id)}
                            disabled={approvingQuote}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-black transition"
                          >
                            {approvingQuote ? 'Paying...' : 'Approve & Pay Advance'}
                          </button>
                        )}
                        
                        {isCompleted && (
                          <button 
                            onClick={() => setActiveTab('invoices')}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200"
                          >
                            Download Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: INVOICES ==================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-4 text-left">
            <h2 className="font-black text-slate-950 text-xl">GST Invoices & Receipts</h2>
            
            {bookings.filter(b => b.quote || b.status === 'COMPLETED').length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
                <p className="text-xs">No invoices or billing receipts found yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.filter(b => b.quote || b.status === 'COMPLETED').map((booking) => {
                  const isPaid = booking.status === 'COMPLETED';
                  const amount = booking.quote?.totalAmount || 99;
                  
                  return (
                    <div key={booking.id} className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">
                            Invoice #INV-26-{booking.id.slice(0,4).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Service: {getCleanServiceName(booking.serviceType)} | Date: {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Amount</span>
                          <strong className="text-slate-900 text-sm">₹{amount}</strong>
                        </div>
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Mock PDF download triggered for Invoice #INV-26-${booking.id.slice(0,4).toUpperCase()}`);
                          }}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black transition"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: SUPPORT ==================== */}
        {activeTab === 'support' && (
          <div className="space-y-6 text-left">
            <h2 className="font-black text-slate-950 text-xl">Support Helpline</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Request Callback form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-base">Request Instant Callback</h3>
                <p className="text-xs text-slate-600">
                  Enter your question below. A Renewserv support representative or supervisor will call you back on your registered phone number ending in <strong className="text-slate-955 text-slate-950">*{currentUser.phone?.slice(-4)}</strong>.
                </p>

                <form onSubmit={handleCreateSupportTicket} className="space-y-3">
                  <textarea 
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your issue or custom solar panels requirement..."
                    rows={4}
                    required
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50 focus:bg-white resize-none"
                  />
                  
                  {supportSuccess && (
                    <p className="text-xs text-green-700 font-semibold">{supportSuccess}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={supportLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                  >
                    {supportLoading ? 'Submitting...' : 'Request Call Back'}
                  </button>
                </form>
              </div>

              {/* Direct helpline information */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">Direct Contact Info</h3>
                  <p className="text-xs text-slate-650">
                    Feel free to write to us or call our operational desk directly for immediate resolutions.
                  </p>
                  
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <span>Support desk: <strong className="text-slate-900">+91 9765539107</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Bot Support: <strong className="text-slate-900">+91 9765539107</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Email support: <strong className="text-slate-900">support@renewserv.com</strong></span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-amber-400 text-xs uppercase tracking-wider">WhatsApp Bot Cheat Sheet</h4>
                  <p className="text-[11px] text-slate-400">
                    Send commands to our official bot number to trigger automated actions:
                  </p>
                  <ul className="text-[11px] space-y-1.5 text-slate-200">
                    <li>💬 <strong>Hi</strong> - Greeting menu</li>
                    <li>🧼 <strong>Book Service</strong> - Starts booking flow</li>
                    <li>📍 <strong>Track Service</strong> - Live progress tracking</li>
                    <li>📄 <strong>Invoice</strong> - Downloads recent invoices</li>
                    <li>📞 <strong>Support</strong> - Support callback request</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-slate-950 text-xl">My Profile Details</h2>
              {!isEditingProfile && (
                <button
                  onClick={startEditing}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
            
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-sm">Update Profile Details</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 text-slate-600">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 text-slate-600">Mobile Phone Number</label>
                    <input 
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                    />
                  </div>
                </div>

                {editError && (
                  <p className="text-xs text-red-600 font-semibold">{editError}</p>
                )}
                {editSuccess && (
                  <p className="text-xs text-green-600 font-semibold">{editSuccess}</p>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition-all"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold rounded-lg text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {(currentUser.profile?.name || currentUser.name || 'U').slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base">
                      {currentUser.profile?.name || currentUser.name || 'Renewserv Customer'}
                    </h3>
                    <p className="text-xs text-slate-500">Registered Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <strong className="text-slate-800">{currentUser.email}</strong>
                      {currentUser.emailVerified ? (
                        <span className="text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-red-50 text-red-750 px-2 py-0.5 rounded-full">Unverified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mobile Phone</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <strong className="text-slate-800">+91 {currentUser.phone}</strong>
                      {currentUser.phoneVerified ? (
                        <span className="text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-red-50 text-red-750 px-2 py-0.5 rounded-full">Unverified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Saved addresses / Details info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-slate-950 text-sm">Solar Installation Coverage</h3>
              <p className="text-xs text-slate-600">
                We currently support installation and servicing locations in Pune City (pincodes <strong>411001 to 411062</strong>) and surrounding outskirts/PMR areas starting with <strong>410 or 412</strong>. You can enter or update your address directly during booking.
              </p>
            </div>
          </div>
        )}

        {/* ==================== DEVELOPER SANDBOX SECTION ==================== */}
        {isLocalhost && (
          <div className="mt-12 p-6 rounded-2xl bg-slate-950 text-slate-100 border border-slate-850 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>🔧 Local Developer Sandbox (SMS & WhatsApp Simulation)</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Since real SMS gateways are mock-logged in local mode, you can copy verification OTPs, click links, and chat with the WhatsApp bot right here.
                </p>
              </div>
              <button 
                onClick={fetchSimulatedLogs}
                disabled={developerLogsLoading}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-all flex items-center gap-1.5"
              >
                {developerLogsLoading ? 'Refreshing...' : '🔄 Refresh Logs'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COLUMN 1: Simulated Inbox */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulated Message Inbox</h4>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {/* SMS Logs */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2">SMS Logs (OTPs)</span>
                    {developerLogs.smsLogs?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-900/50 border border-slate-850">No simulated SMS messages found.</p>
                    ) : (
                      <div className="space-y-2">
                        {developerLogs.smsLogs?.map((log: any) => (
                          <div key={log.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-850 text-left space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>To: {log.to}</span>
                              <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200">{log.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Email Logs */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Email Logs (Verification Links)</span>
                    {developerLogs.emailLogs?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-900/50 border border-slate-850">No simulated emails found.</p>
                    ) : (
                      <div className="space-y-2">
                        {developerLogs.emailLogs?.map((log: any) => {
                          // Extract token if present
                          const tokenMatch = log.body.match(/token=([a-f0-9]+)/);
                          const token = tokenMatch ? tokenMatch[1] : '';
                          const verifyUrl = token ? `/api/auth/verify-email?token=${token}` : null;

                          return (
                            <div key={log.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-850 text-left space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>To: {log.to}</span>
                                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5">{log.subject}</p>
                              
                              {verifyUrl ? (
                                <div className="pt-1">
                                  <a 
                                    href={verifyUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-extrabold transition-all"
                                  >
                                    🔗 Click to Verify Email
                                  </a>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 whitespace-pre-wrap">{log.body}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* COLUMN 2: WhatsApp Chatbot Simulator */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Bot Simulator</h4>
                
                <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col bg-slate-900 text-left h-[300px]">
                  {/* Chat window Header */}
                  <div className="bg-slate-850 p-3 flex items-center gap-2 border-b border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <span className="text-xs font-extrabold text-white block leading-tight">Renewserv Support Bot</span>
                      <span className="text-[9px] text-slate-500">Online</span>
                    </div>
                  </div>

                  {/* Messages scroll area */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`max-w-[85%] rounded-lg p-2.5 text-xs ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white self-end rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 self-start rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <span className="block text-[8px] text-slate-400 text-right mt-1">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat input box */}
                  <form onSubmit={handleSendWhatsappMessage} className="p-2 bg-slate-850 border-t border-slate-850 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type 'Hi', 'Track', 'Pay Now'..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatSending}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      type="submit"
                      disabled={chatSending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Navigation Bar for Mobile Users */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden grid grid-cols-5 text-center py-2 px-1 shadow-lg">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-450 text-slate-500'}`}
        >
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'services' ? 'text-blue-600' : 'text-slate-450 text-slate-500'}`}
        >
          <span className="text-lg">🛠️</span>
          <span>Services</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('home');
            setTimeout(() => {
              document.getElementById('choose-service')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-12 h-12 bg-amber-400 text-slate-950 font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[9px] font-black text-slate-800 mt-1">Book</span>
        </button>

        <button 
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'invoices' ? 'text-blue-600' : 'text-slate-450 text-slate-500'}`}
        >
          <span className="text-lg">📄</span>
          <span>Invoices</span>
        </button>

        <button 
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'support' ? 'text-blue-600' : 'text-slate-450 text-slate-500'}`}
        >
          <span className="text-lg">📞</span>
          <span>Support</span>
        </button>
      </div>

      {/* Real-time Tracking Modal (Urban Company style overlay) */}
      {showTrackingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] text-left">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-455 block">LIVE SERVICE TRACKER</span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">
                  ID: RNW-{selectedBooking.createdAt.slice(2,4)}-{selectedBooking.id.slice(0,5).toUpperCase()}
                </h3>
              </div>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 bg-slate-200 hover:bg-slate-305 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              
              {/* Technician details card */}
              {trackingTech ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {trackingTech.slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned Technician</span>
                    <strong className="text-slate-900 text-sm block">{trackingTech}</strong>
                    <span className="text-xs text-amber-500 flex items-center gap-0.5 font-bold mt-0.5">
                      ⭐ {trackingRating.toFixed(1)} Rating
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs italic text-center">
                  Finding best Pune service technician for you...
                </div>
              )}

              {/* Status warning banner or details */}
              {selectedBooking.status === 'QUOTE_SENT' && selectedBooking.quote && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 space-y-3">
                  <h4 className="font-extrabold text-sm text-green-800">Job Inspected: Action Required</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    The technician has audited your solar system. 
                    {selectedBooking.inspectionReport?.findings && (
                      <span className="block mt-1 bg-white p-2 rounded border border-green-150">
                        <strong>Findings:</strong> {selectedBooking.inspectionReport.findings}
                      </span>
                    )}
                  </p>
                  
                  {actionMessage && (
                    <div className="p-2.5 rounded bg-white text-green-700 text-xs font-bold border border-green-200">
                      {actionMessage}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleApproveQuote(selectedBooking.id)}
                      disabled={approvingQuote}
                      className="w-full px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold transition-all"
                    >
                      {approvingQuote ? 'Paying Advance...' : `Approve & Pay Advance (₹${((selectedBooking.quote.totalAmount - 99) / 2).toFixed(0)})`}
                    </button>
                  </div>
                </div>
              )}

              {/* Simple Timeline tracking */}
              <div className="space-y-4 text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Timeline</h4>
                
                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timelineSteps.map((step, idx) => {
                    const currentActiveIdx = getTimelineStep(selectedBooking.status);
                    const isCompletedStep = idx < currentActiveIdx;
                    const isActiveStep = idx === currentActiveIdx;
                    const isFutureStep = idx > currentActiveIdx;

                    return (
                      <div key={step.key} className="flex gap-4 items-start relative pl-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 ${
                          isCompletedStep ? 'bg-green-500 text-white' : 
                          isActiveStep ? 'bg-blue-600 text-white animate-pulse' : 
                          'bg-slate-200 text-slate-400'
                        }`}>
                          {isCompletedStep ? '✓' : idx + 1}
                        </div>
                        <div className="pt-0.5">
                          <span className={`text-xs font-bold ${
                            isCompletedStep ? 'text-slate-500' :
                            isActiveStep ? 'text-blue-600 font-extrabold' :
                            'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Phone OTP Modal Overlay */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Verify Mobile Phone Number</h3>
              <button 
                onClick={() => setShowPhoneOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-slate-650 text-xs leading-relaxed">
              We have dispatched a 6-digit OTP code to your registered mobile number ending in <strong className="text-slate-900">*{currentUser.phone?.slice(-4)}</strong>. Please check your console or SMS logger.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enter OTP Code</label>
              <input 
                type="text"
                placeholder="e.g. 123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center tracking-[0.75em] text-lg font-extrabold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-705 text-xs font-semibold rounded-lg">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                {otpSuccess}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSendPhoneOtp}
                disabled={otpSending}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                {otpSending ? 'Resending...' : 'Resend OTP'}
              </button>
              <button
                onClick={handleVerifyPhoneOtp}
                disabled={otpVerifying || otpCode.length !== 6}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {otpVerifying ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email OTP Modal Overlay */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Verify Email Address</h3>
              <button 
                onClick={() => setShowEmailOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-slate-650 text-xs leading-relaxed">
              We have sent a 6-digit verification code to your registered email address <strong className="text-slate-900">{currentUser.email}</strong>. Please check your spam folder or console logs.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enter Verification Code</label>
              <input 
                type="text"
                placeholder="e.g. 123456"
                maxLength={6}
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center tracking-[0.75em] text-lg font-extrabold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {emailOtpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-705 text-xs font-semibold rounded-lg">
                {emailOtpError}
              </div>
            )}

            {emailOtpSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                {emailOtpSuccess}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleResendEmailVerification}
                disabled={resendingEmail}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                {resendingEmail ? 'Resending...' : 'Resend Code'}
              </button>
              <button
                onClick={handleVerifyEmailOtp}
                disabled={emailOtpVerifying || emailOtpCode.length !== 6}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {emailOtpVerifying ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-6 text-center text-xs sm:text-sm mt-12 w-full">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <img src="/logo.png" alt="Renewserv Logo" className="h-12 md:h-14 w-auto object-contain transition-all duration-300" />
            <span className="text-slate-500">© 2026. Pune, Maharashtra, India.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {activeLightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-full transition-all cursor-pointer"
            onClick={() => setActiveLightboxImage(null)}
          >
            <span className="sr-only">Close</span>
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeLightboxImage} 
              alt="Enlarged preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
