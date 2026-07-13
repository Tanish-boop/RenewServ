'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Phone,
  MapPin,
  Calendar,
  Upload,
  MessageSquare,
  ShieldCheck,
  FileCheck,
  Activity,
  Menu,
  X,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  ChevronLeft,
  Building,
  User,
  Mail,
  RefreshCw,
  Award,
  Users,
  BarChart3,
  HardDrive,
  Laptop,
  Cpu,
  Server,
  Tv,
  Printer,
  Battery,
  Smartphone,
  Network,
  Database,
  Building2,
  Factory,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Radio,
  Car,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function EWastePage() {
  const router = useRouter();
  
  // Session states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load current user session
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  // Analytics Tracker Callback (mock for GA/Meta)
  const trackCTA = (ctaName: string, additionalData: any = {}) => {
    console.log(`[Analytics Event] CTA_CLICKED: ${ctaName}`, additionalData);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'E-Waste',
        event_label: ctaName,
        ...additionalData
      });
    }
  };

  // State for Wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Form Fields State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [wasteType, setWasteType] = useState<string[]>([]);
  const [quantity, setQuantity] = useState('Under 50 kg');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9 AM - 1 PM)');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  // Form Validation
  const validateStep = (step: number) => {
    if (step === 1) {
      if (!contactPerson.trim()) return 'Contact person name is required.';
      if (!phone.trim() || phone.length < 10) return 'Please enter a valid phone number.';
      if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
      if (!location.trim()) return 'Location is required.';
    }
    if (step === 2) {
      if (wasteType.length === 0) return 'Please select at least one waste type category.';
    }
    if (step === 3) {
      if (!address.trim()) return 'Pickup address is required.';
      if (!preferredDate) return 'Please select a preferred pickup date.';
    }
    return '';
  };

  const handleNextStep = () => {
    const errorMsg = validateStep(wizardStep);
    if (errorMsg) {
      setWizardError(errorMsg);
      return;
    }
    setWizardError('');
    trackCTA(`Wizard_Step_${wizardStep}_Next`);
    setWizardStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardError('');
    setWizardStep((prev) => prev - 1);
  };

  const handleCheckboxChange = (type: string) => {
    setWasteType((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Simulate file upload
  const handleSimulatedUpload = () => {
    const mockFiles = [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=600&q=80'
    ];
    const nextImage = mockFiles[Math.min(uploadedImages.length, mockFiles.length - 1)];
    const uniqueImg = `${nextImage}?rand=${Math.floor(Math.random() * 1000)}`;
    setUploadedImages([...uploadedImages, uniqueImg]);
    trackCTA('Wizard_Add_Sample_Image');
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // Wizard Submit
  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardLoading(true);
    setWizardError('');

    try {
      const res = await fetch('/api/e-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactPerson,
          phone,
          email,
          location,
          wasteType: wasteType.join(', '),
          quantity,
          address,
          preferredDate,
          preferredTime,
          images: uploadedImages,
          message
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setWizardSuccess(true);
      trackCTA('Wizard_Submit_Success');
    } catch (err: any) {
      setWizardError(err.message || 'Something went wrong. Please try again.');
      trackCTA('Wizard_Submit_Failed', { error: err.message });
    } finally {
      setWizardLoading(false);
    }
  };

  // Scroll to request form helper
  const scrollToForm = () => {
    const formElement = document.getElementById('pickup-wizard');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Counter states (Configurable values)
  const impactCounters = {
    clients: 140,
    tons: 850,
    pickups: 1250,
    certificates: 1120,
    carbon: 3200,
    projects: 420
  };

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
    trackCTA('FAQ_Toggle', { index: idx });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-green-100 antialiased">
      
      {/* JSON-LD Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://www.renewserv.com/#organization',
                'name': 'Renewserv',
                'url': 'https://www.renewserv.com',
                'logo': 'https://www.renewserv.com/logo.png',
                'contactPoint': {
                  '@type': 'ContactPoint',
                  'telephone': '+91-9765539107',
                  'contactType': 'customer service',
                  'areaServed': 'IN',
                  'availableLanguage': ['en', 'hi', 'mr']
                }
              },
              {
                '@type': 'Service',
                '@id': 'https://www.renewserv.com/e-waste/#service',
                'name': 'E-Waste Management & Recycling',
                'provider': {
                  '@id': 'https://www.renewserv.com/#organization'
                },
                'description': 'Responsible collection, certified recycling, secure data destruction, IT Asset Disposal, and EPR compliance solutions.',
                'areaServed': {
                  '@type': 'Country',
                  'name': 'India'
                }
              },
              {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                  {
                    '@type': 'ListItem',
                    'position': 1,
                    'name': 'Home',
                    'item': 'https://www.renewserv.com'
                  },
                  {
                    '@type': 'ListItem',
                    'position': 2,
                    'name': 'E-Waste Management',
                    'item': 'https://www.renewserv.com/e-waste'
                  }
                ]
              }
            ]
          })
        }}
      />

      {/* Header wrapper */}
      <div className="sticky top-0 z-50">
        {/* Top Banner */}
        <div className="bg-slate-900 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
          ⚡ Solar Platform &amp; Certified E-Waste Management &amp; Recycling Solutions. Book corporate pickup today!
        </div>

        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <img src="/logo.png" alt="Renewserv Logo" className="h-14 w-auto object-contain" />
            </div>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="/" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Home</a>
              <a href="/#why-us" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">About</a>
              <a href="/#services" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Services</a>
              <a href="#" className="text-sm font-semibold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1">
                E-Waste <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">New</span>
              </a>
              <a href="#industries" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Industries</a>
              <a href="#footer" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (currentUser.role === 'TECHNICIAN') router.push('/technician');
                      else if (['ROOT_OWNER', 'OWNER'].includes(currentUser.role)) router.push('/admin');
                      else router.push('/dashboard');
                      trackCTA('Header_Dashboard');
                    }}
                    className="px-4 py-2 text-xs sm:text-sm rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-sm transition-all cursor-pointer"
                  >
                    My Dashboard
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    router.push('/?login=true');
                    trackCTA('Header_Login');
                  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
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
            <a href="/" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-605 py-1 transition-colors">Home</a>
            <a href="/#why-us" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-605 py-1 transition-colors">About</a>
            <a href="/#services" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-605 py-1 transition-colors">Services</a>
            <a href="#" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-green-700 py-1 transition-colors flex items-center gap-1.5">
              E-Waste <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">New</span>
            </a>
            <a href="#industries" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-605 py-1 transition-colors">Industries</a>
            <a href="#footer" onClick={() => setShowMobileMenu(false)} className="block text-sm font-semibold text-slate-700 hover:text-green-655 py-1 transition-colors">Contact</a>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center bg-slate-900 text-white overflow-hidden border-b border-slate-800">
        {/* Background Image / Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/40 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.1),transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />

        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-bold backdrop-blur-xs">
              ✓ CPCB Authorized &amp; ISO Certified Recycler
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
              E-Waste Management &amp; <br />
              <span className="text-green-400">Circular Economy Solutions</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
              Helping organizations responsibly manage electronic waste through certified recycling, secure data destruction, IT Asset Disposal (ITAD) and strict EPR compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button 
                onClick={() => { scrollToForm(); trackCTA('Hero_Book_Pickup'); }}
                className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-sm transition-all shadow-md cursor-pointer"
              >
                Book Pickup
              </button>
              <button 
                onClick={() => { scrollToForm(); trackCTA('Hero_Consultation'); }}
                className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold text-sm transition-all cursor-pointer"
              >
                Free Consultation
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-extrabold text-lg text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="text-green-400 w-5.5 h-5.5" />
              Corporate Recycling Partner
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Renewserv provides comprehensive e-waste compliance, zero-landfill documentation, and secure disposal services for Indian businesses.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-4 h-4 shrink-0" /> CPCB/MPCB Form-2 &amp; Green Certificates</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-4 h-4 shrink-0" /> NIST-compliant Secure Data Erasure</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-4 h-4 shrink-0" /> Pan-India collection and reverse logistics</li>
            </ul>
            <button 
              onClick={() => { scrollToForm(); trackCTA('Hero_Quick_Callback'); }}
              className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
            >
              Request Call Back →
            </button>
          </div>
        </div>
      </section>

      {/* About E-Waste & Circular Economy */}
      <section className="px-4 sm:px-6 py-16 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Understanding E-Waste &amp; Circular Economy</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Why professional IT asset disposal and government-compliant recycling matter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-green-500 transition-colors">
            <h4 className="font-extrabold text-slate-900 text-base">What is E-Waste?</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Discarded electronic devices (computers, servers, phones, components). If left unmanaged, toxic heavy metals like lead and mercury pose severe ecological hazards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-green-500 transition-colors">
            <h4 className="font-extrabold text-slate-900 text-base">Why Recycle?</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Recycling extracts reusable secondary raw materials (copper, gold, aluminum) while preventing toxic runoff into landfills and groundwater reserves.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-green-500 transition-colors">
            <h4 className="font-extrabold text-slate-900 text-base">Circular Economy</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              A closed-loop system where electronic waste products are disassembled, processed, and channeled back into manufacturing, conserving natural capital.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-green-500 transition-colors">
            <h4 className="font-extrabold text-slate-900 text-base">Government Compliance</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              E-Waste (Management) Rules mandate producers and bulk consumers to route discard through authorized channels with proper filings.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-lg">Looking for E-Waste Consultation?</h4>
            <p className="text-slate-400 text-xs">Our regulatory consultants will audit your waste streams free of charge.</p>
          </div>
          <button 
            onClick={() => { scrollToForm(); trackCTA('About_Consultation'); }}
            className="px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer"
          >
            Get Free Consultation
          </button>
        </div>
      </section>

      {/* Sustainability Solutions Section */}
      <section className="px-4 sm:px-6 py-16 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sustainability Solutions</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
              Explore our comprehensive clean energy and ecological recycling verticals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active: Solar Services */}
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4 hover:border-amber-400/50 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-amber-400 px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">Solar Vertical</span>
                  <span className="text-xs text-green-400 font-bold">Active</span>
                </div>
                <h3 className="font-bold text-lg text-white">Solar Services</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Enterprise rooftop washing, voltage checks, structural re-fitting, diagnostics, and AMC contracts across housing societies in Pune.
                </p>
              </div>
              <button 
                onClick={() => { router.push('/'); trackCTA('Solutions_Solar_Go'); }}
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Go to Solar →
              </button>
            </div>

            {/* Active: E-Waste Management */}
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4 hover:border-green-500/50 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-green-400 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">E-Waste Vertical</span>
                  <span className="text-xs text-green-400 font-bold">Active</span>
                </div>
                <h3 className="font-bold text-lg text-white">E-Waste Management</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Secure logistics, authorized processing, NIST data destruction, and official CPCB Form-2/Green certificate compliance mapping.
                </p>
              </div>
              <button 
                onClick={() => { scrollToForm(); trackCTA('Solutions_EWaste_Go'); }}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Book Pickup Now →
              </button>
            </div>

            {/* Active: ITAD & Data Destruction */}
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4 hover:border-green-500/50 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-green-400 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">Security Vertical</span>
                  <span className="text-xs text-green-400 font-bold">Active</span>
                </div>
                <h3 className="font-bold text-lg text-white">IT Asset Disposal (ITAD)</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Enterprise-grade data shredding, hard-drive degaussing, software-level sanitization, and structured material recovery.
                </p>
              </div>
              <button 
                onClick={() => { scrollToForm(); trackCTA('Solutions_ITAD_Go'); }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-655 text-white font-extrabold text-xs rounded-lg border border-slate-600 transition-colors cursor-pointer"
              >
                Learn More →
              </button>
            </div>
          </div>

          <div className="pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">Future Sustainability Offerings (Coming Soon)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                'Battery Waste',
                'Plastic Waste',
                'Solar Panel Recycle',
                'Circular Economy',
                'ESG Consulting',
                'Carbon Management'
              ].map((serv, idx) => (
                <div key={idx} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-center">
                  <span className="block text-xs font-bold text-slate-400">{serv}</span>
                  <span className="text-[9px] text-green-400/80 font-medium">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section id="industries" className="px-4 sm:px-6 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Industries We Serve</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            We provide specialized electronic asset collection, regulatory Form-2 logs, and certified destruction services tailored to the requirements of each industry vertical.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              name: 'IT Companies', 
              desc: 'Secure sanitization of old corporate workstations, notebooks, and hardware decommissioning.',
              icon: Laptop 
            },
            { 
              name: 'Banking & Finance', 
              desc: 'High-security NIST-compliant data erasure, audit trails, and strict compliance logs.',
              icon: Building2 
            },
            { 
              name: 'Manufacturing & Plants', 
              desc: 'Responsible disposal of heavy industrial electrical scrap, control panels, and automation boards.',
              icon: Factory 
            },
            { 
              name: 'Hospitals & Medical', 
              desc: 'Compliant decommissioning of retired electronic diagnostic machinery and monitoring equipment.',
              icon: Stethoscope 
            },
            { 
              name: 'Schools & Universities', 
              desc: 'Safe, sustainable clearing of outdated computer lab terminals, projectors, and audio setups.',
              icon: GraduationCap 
            },
            { 
              name: 'Government Organizations', 
              desc: 'Official Form-2 records, central pollutant compliance, and zero-landfill auditing.',
              icon: Building 
            },
            { 
              name: 'Telecom Providers', 
              desc: 'Recycling of cellular network switches, old transceivers, cabling networks, and routers.',
              icon: Radio 
            },
            { 
              name: 'Enterprise Data Centers', 
              desc: 'Bulk disposal of server cabinet blades, network arrays, and certified disk shredding.',
              icon: Database 
            }
          ].map((ind, idx) => {
            const IconComponent = ind.icon;
            return (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-green-600 hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl w-fit">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">{ind.name}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <button 
            onClick={() => { scrollToForm(); trackCTA('Industries_Corporate_Partner'); }}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Become Corporate Partner
          </button>
        </div>
      </section>

      {/* Accepted Items Grid */}
      <section className="px-4 sm:px-6 py-20 bg-slate-950 text-white border-b border-slate-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Accepted Electronics</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              We collect and process a wide range of redundant enterprise technology assets, networking infrastructure, and clinical electrical hardware.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {[
              { item: 'Laptops & PCs', desc: 'Workstations, Notebooks', icon: Laptop },
              { item: 'Enterprise Servers', desc: 'Blade Cabinets, Racks', icon: Server },
              { item: 'CPUs & Processors', desc: 'Silicon Boards, Motherboards', icon: Cpu },
              { item: 'Storage Systems', desc: 'Hard Drives, SAN, SSDs', icon: HardDrive },
              { item: 'Office Electronics', desc: 'Monitors, Printers, Scanners', icon: Tv },
              { item: 'UPS & Power Banks', desc: 'Lead Acid Batteries', icon: Battery },
              { item: 'Network Hardware', desc: 'Switches, Routers, Hubs', icon: Network },
              { item: 'Telecom Gear', desc: 'Transceivers, Fiber Lines', icon: Radio },
              { item: 'Industrial Controllers', desc: 'PLC Systems, Control Boards', icon: Settings },
              { item: 'Medical Equipment', desc: 'Lab Devices, Monitors', icon: Activity },
              { item: 'Mobile Systems', desc: 'Smartphones, Tablets', icon: Smartphone },
              { item: 'Datastore Modules', desc: 'Backup Arrays, Tape Vaults', icon: Database }
            ].map((itm, idx) => {
              const IconComp = itm.icon;
              return (
                <div key={idx} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 hover:border-green-500/50 hover:bg-slate-900/80 transition duration-300">
                  <div className="mx-auto w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-green-400">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-sm font-extrabold text-white">{itm.item}</span>
                    <span className="block text-[10px] text-slate-500 font-medium">{itm.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <button 
              onClick={() => { scrollToForm(); trackCTA('Accepted_Download_Brochure'); }}
              className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer"
            >
              Download Full Inventory Catalog PDF
            </button>
          </div>
        </div>
      </section>

      {/* Recycling Process Infographic */}
      <section className="px-4 sm:px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Recycling Process Timeline</h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              We manage a transparent, fully tracked chain of custody from initial corporate booking to final compliance certification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Phase 1: Intake & Logistics */}
            <div className="space-y-6 relative">
              <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-green-800">Phase 1: Scheduling & Intake</span>
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-green-100 relative">
                {[
                  { step: '1', title: 'Request Pickup', desc: 'Log on to the digital portal or call support to submit inventory manifests.', icon: FileCheck },
                  { step: '2', title: 'Audits & Consultation', desc: 'Free regulatory compliance survey and inventory valuation.', icon: Users },
                  { step: '3', title: 'Commercial Valuation', desc: 'Transparent asset appraisal matching circular commodity rates.', icon: FileText },
                  { step: '4', title: 'Scheduling & Dispatch', desc: 'Secure transit vehicle lock-in and arrival date scheduling.', icon: Calendar }
                ].map((st, idx) => {
                  return (
                    <div key={idx} className="relative bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-green-600 hover:bg-white transition duration-300">
                      <div className="absolute -left-[27px] top-6 w-3.5 h-3.5 rounded-full bg-green-500 border-4 border-white shadow-sm" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                          {st.step}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{st.title}</h4>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase 2: Processing & Data Security */}
            <div className="space-y-6">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-350">Phase 2: Secure Processing</span>
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-slate-200 relative">
                {[
                  { step: '5', title: 'Physical Collection', desc: 'Physical load verify matching inventory checklist at your facility.', icon: Upload },
                  { step: '6', title: 'GPS Tracked Transit', desc: 'Materials are transported in locked containers with live tracking.', icon: MapPin },
                  { step: '7', title: 'Logistics Sorting', desc: 'Sorting materials by element type and precious metal grades.', icon: Activity },
                  { step: '8', title: 'Certified Data Wiping', desc: 'NIST SP 800-88 compliant degaussing or physical shredding.', icon: Lock }
                ].map((st, idx) => {
                  return (
                    <div key={idx} className="relative bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-green-600 hover:bg-white transition duration-300">
                      <div className="absolute -left-[27px] top-6 w-3.5 h-3.5 rounded-full bg-slate-700 border-4 border-white shadow-sm" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                          {st.step}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{st.title}</h4>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase 3: Compliance & Recovery */}
            <div className="space-y-6">
              <div className="p-3.5 bg-green-900 text-white rounded-xl text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-green-300">Phase 3: Material Recycling</span>
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-green-800 relative">
                {[
                  { step: '9', title: 'Eco-Friendly Refining', desc: 'Disassembling parts for pollution-free material recovery.', icon: RefreshCw },
                  { step: '10', title: 'Circular Commodity Recovery', desc: 'Precious metal extraction and channeling back to factories.', icon: Award },
                  { step: '11', title: 'Compliance Green Certs', desc: 'Issuance of MPCB/CPCB Form-2 and ecological certificates.', icon: ShieldCheck },
                  { step: '12', title: 'Enterprise SLA Lock-In', desc: 'Annual agreements to secure ongoing corporate waste audits.', icon: CheckCircle }
                ].map((st, idx) => {
                  return (
                    <div key={idx} className="relative bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-green-600 hover:bg-white transition duration-300">
                      <div className="absolute -left-[27px] top-6 w-3.5 h-3.5 rounded-full bg-green-800 border-4 border-white shadow-sm" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-950 text-green-400 flex items-center justify-center font-bold text-xs">
                          {st.step}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{st.title}</h4>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Impact Dashboard */}
      <section className="py-16 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Our Environmental Impact</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Real-time ecological savings generated by our recycling programs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              { title: 'Clients Served', val: impactCounters.clients, suffix: '+' },
              { title: 'Tons Recycled', val: impactCounters.tons, suffix: 't' },
              { title: 'Pickups Completed', val: impactCounters.pickups, suffix: '+' },
              { title: 'Certificates Sent', val: impactCounters.certificates, suffix: '+' },
              { title: 'Carbon Saved', val: impactCounters.carbon, suffix: ' kg' },
              { title: 'Projects Finished', val: impactCounters.projects, suffix: '+' }
            ].map((stat, idx) => (
              <div key={idx} className="p-5 bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-green-400 block">
                  {stat.val}{stat.suffix}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">
                  {stat.title}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center max-w-2xl mx-auto">
            <span className="text-xs text-green-300 font-bold">💡 Every ton of e-waste recycled prevents approximately 3.7 tons of CO2 emissions.</span>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="px-4 sm:px-6 py-16 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Trust &amp; Credibility</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Why corporate procurement and compliance heads verify and select Renewserv.
          </p>
        </div>

        {/* Certifications Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <span className="text-3xl block">📜</span>
            <h4 className="font-extrabold text-xs text-slate-900">CPCB Authorized</h4>
            <p className="text-slate-500 text-[10px]">Strictly adhering to central pollution control guidelines</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <span className="text-3xl block">🛡️</span>
            <h4 className="font-extrabold text-xs text-slate-900">ISO 27001 Certified</h4>
            <p className="text-slate-500 text-[10px]">Information security protocols for data erasure</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <span className="text-3xl block">♻️</span>
            <h4 className="font-extrabold text-xs text-slate-900">Form-2 Dispatched</h4>
            <p className="text-slate-500 text-[10px]">Legally binding transfer documentation logged</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <span className="text-3xl block">🏢</span>
            <h4 className="font-extrabold text-xs text-slate-900">Audit Ready</h4>
            <p className="text-slate-500 text-[10px]">Fully traceable chain-of-custody reporting</p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
            <p className="text-slate-655 text-slate-600 text-xs italic leading-relaxed">
              "Renewserv has managed our hardware decommissioning seamlessly. The data wiping certificates were shared within 48 hours of pickup. Truly professional team."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs text-slate-600">IT</div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Vikram Deshmukh</span>
                <span className="block text-[10px] text-slate-500">IT Infrastructure Head, Synechron Pune</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
            <p className="text-slate-600 text-xs italic leading-relaxed">
              "EPR compliance audits used to take months of back-and-forth registry updates. Renewserv's automated annual documentation support has completely solved our pain point."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs text-slate-600">CO</div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Anjali Kulkarni</span>
                <span className="block text-[10px] text-slate-500">Compliance &amp; Legal Director, Cosmos Bank</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become Our Corporate Partner */}
      <section className="py-16 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Become Our Corporate Recycling Partner</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Unlock prioritized, recurring logistics, audits, and tailored annual maintenance contracts (AMC) for complete IT asset retirement.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Annual Collection Contracts', desc: 'Lock in predictable collection cycles' },
                { title: 'Monthly Pickup Plans', desc: 'Ideal for rapidly growing enterprises' },
                { title: 'EPR Compliance Support', desc: 'Registry filings and annual audits' },
                { title: 'Secure Data Destruction', desc: 'Shredding and crypto erasure certificates' },
                { title: 'Recycling Certificates', desc: 'Traceable pollution audit certificates' },
                { title: 'Account Manager', desc: 'Single point of contact for dispatching' }
              ].map((ben, idx) => (
                <div key={idx} className="flex gap-2">
                  <CheckCircle className="text-green-400 w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-white">{ben.title}</span>
                    <span className="block text-[10px] text-slate-400">{ben.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:max-w-md p-6 bg-slate-800 border border-slate-700 rounded-2xl text-center space-y-4">
            <span className="text-[10px] uppercase font-black text-green-400 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">Partnership Program</span>
            <h3 className="font-extrabold text-lg text-white">Streamline Asset Retirement</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Contact our sales lead division to draft a custom SLA agreement tailored to your compliance guidelines.
            </p>
            <button
              onClick={() => { scrollToForm(); trackCTA('Corporate_Partner_Request'); }}
              className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs shadow transition-all cursor-pointer"
            >
              Request Partnership SLA
            </button>
          </div>
        </div>
      </section>

      {/* Multi-Step Request Pickup Wizard */}
      <section id="pickup-wizard" className="px-4 sm:px-6 py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-xl mx-auto space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl relative">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Request E-Waste Pickup</h2>
            <p className="text-slate-500 text-xs">Complete the wizard below. We will send a digital quote and compliance brief.</p>
          </div>

          {/* Progress Indicator */}
          {!wizardSuccess && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Step {wizardStep} of 5</span>
                <span>{Math.round((wizardStep / 5) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${(wizardStep / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {wizardError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{wizardError}</span>
            </div>
          )}

          {wizardSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Request Submitted Successfully!</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                Your E-Waste pickup request has been processed. A customer agent will call you in the next 2 hours to confirm logistics and quote estimates.
              </p>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setWizardSuccess(false);
                  setCompanyName('');
                  setContactPerson('');
                  setPhone('');
                  setEmail('');
                  setLocation('');
                  setWasteType([]);
                  setQuantity('Under 50 kg');
                  setAddress('');
                  setPreferredDate('');
                  setUploadedImages([]);
                  setMessage('');
                  trackCTA('Wizard_Reset');
                }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleWizardSubmit} className="space-y-6">
              
              {/* Step 1: Company Details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-1.5 border-slate-100">Step 1: Contact Details</h4>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 text-slate-600 block">Company / Organization Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Acme Corporation" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Contact Person Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Ramesh Deshmukh" 
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          placeholder="e.g. 9765539107" 
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="e.g. ramesh@acme.com" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Location / City *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Pune, Maharashtra" 
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Waste Type & Quantity */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-1.5 border-slate-100">Step 2: Waste Type &amp; Quantity</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Select Waste Categories (Select multiple) *</label>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      {[
                        'IT Assets (PCs, Laptops)',
                        'Servers & Networking',
                        'Storage (Hard Disks, SSDs)',
                        'Telecom Equipment',
                        'Medical/Lab Electronics',
                        'UPS & Batteries',
                        'Industrial Scrap',
                        'Other Electronics'
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                          <input 
                            type="checkbox"
                            checked={wasteType.includes(item)}
                            onChange={() => handleCheckboxChange(item)}
                            className="w-4 h-4 accent-green-600 rounded"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-bold text-slate-600 block">Estimated Quantity</label>
                    <select 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                    >
                      <option value="Under 50 kg">Under 50 kg</option>
                      <option value="50 - 200 kg">50 - 200 kg</option>
                      <option value="200 - 1000 kg">200 - 1000 kg</option>
                      <option value="1 Ton +">1 Ton +</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Address & Date */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-1.5 border-slate-100">Step 3: Address &amp; Logistics</h4>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Full Pickup Address *</label>
                    <textarea 
                      placeholder="Enter the complete building, floor, street details" 
                      rows={3}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Preferred Pickup Date *</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          required
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Preferred Time Slot</label>
                      <select 
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                      >
                        <option value="Morning (9 AM - 1 PM)">Morning (9 AM - 1 PM)</option>
                        <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Upload Images */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-1.5 border-slate-100">Step 4: Upload E-Waste Images</h4>
                  
                  <div className="p-6 border-2 border-dashed border-slate-300 hover:border-green-500/80 rounded-xl text-center space-y-3 transition-colors bg-slate-50">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Drag images of your hardware inventory here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG formats. Max file size 5MB.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulatedUpload}
                      className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      + Add Sample Inventory Photo
                    </button>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-black text-slate-400">Selected files ({uploadedImages.length})</span>
                      <div className="grid grid-cols-3 gap-3">
                        {uploadedImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-20 bg-slate-100 group">
                            <img src={imgUrl} alt="E-waste item preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-1.5 border-slate-100">Step 5: Review Details</h4>
                  
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200 text-xs text-left">
                    <div className="grid grid-cols-2 gap-y-2.5">
                      <div>
                        <span className="text-slate-400 block font-bold">COMPANY</span>
                        <span className="text-slate-900 font-bold">{companyName || 'Individual'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">CONTACT PERSON</span>
                        <span className="text-slate-900 font-bold">{contactPerson}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">PHONE &amp; EMAIL</span>
                        <span className="text-slate-900 font-bold">{phone} / {email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">LOCATION</span>
                        <span className="text-slate-900 font-bold">{location}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-bold">CATEGORIES</span>
                        <span className="text-slate-900 font-bold">{wasteType.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">QUANTITY</span>
                        <span className="text-slate-900 font-bold">{quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">PICKUP DATE &amp; TIME</span>
                        <span className="text-slate-900 font-bold">{preferredDate} ({preferredTime})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-bold">PICKUP ADDRESS</span>
                        <span className="text-slate-900 font-bold leading-normal">{address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 text-slate-600 block">Additional Instructions / Notes</label>
                    <textarea 
                      placeholder="e.g. gate security instructions, elevator status, loading dock availability" 
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Wizard Navigation */}
              <div className="flex justify-between gap-3 border-t pt-4 border-slate-100">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                )}
                
                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={wizardLoading}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {wizardLoading ? 'Submitting...' : 'Submit Pickup Request'}
                  </button>
                )}
              </div>

            </form>
          )}

        </div>
      </section>

      {/* Accordion FAQs */}
      <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">E-Waste Compliance FAQs</h2>
          <p className="text-slate-655 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Quick compliance details for corporate administration managers.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Do you issue formal recycling certificates for audit compliance?',
              a: 'Yes, Renewserv issues official CPCB/MPCB-authorized Form-2 recycling certificates along with detailed destruction manifests, confirming green disposal for your corporate ESG audits.'
            },
            {
              q: 'How do you guarantee secure data wiping on servers and laptops?',
              a: 'We offer certified software-level degaussing (NIST SP 800-88 compliant cryptographic wipe) and physical disk shredding at our recycling facilities. A data destruction report is dispatched immediately post-destruction.'
            },
            {
              q: 'What happens to the recovered materials?',
              a: 'Electronic components undergo chemical refining and mechanical shredding to extract secondary raw materials like copper, aluminum, and precious metals (gold, silver) to channel back into circular supply loops.'
            },
            {
              q: 'Is there a minimum pickup weight requirement?',
              a: 'For commercial housing societies and small offices in Pune/PCMC, we collect from 50 kg onwards. Large industrial lots and servers have no limits, and we manage multi-ton container dispatches.'
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-slate-950 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <span className="text-green-500 font-extrabold">{faqOpen === idx ? '−' : '+'}</span>
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Downloads Section */}
      <section className="py-16 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Resource Downloads</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Get our compliance briefs and company prospectus documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { file: 'Company Profile', size: '2.4 MB', desc: 'Overview of Renewserv platforms &amp; services.' },
              { file: 'E-Waste Brochure', size: '1.8 MB', desc: 'Technical documentation of sorting facilities.' },
              { file: 'Compliance Guide', size: '3.1 MB', desc: 'Handbook on Form-2 and CPCB recycling laws.' },
              { file: 'EPR Information', size: '1.2 MB', desc: 'Extended Producer Responsibility registry details.' }
            ].map((res, idx) => (
              <div key={idx} className="p-5 bg-slate-850 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col justify-between space-y-4 hover:border-green-500/50 transition-colors">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                    <FileText className="w-5.5 h-5.5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-white" dangerouslySetInnerHTML={{ __html: res.file }} />
                  <p className="text-slate-400 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: res.desc }} />
                </div>
                <div className="pt-2 flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-[10px] text-slate-500 font-bold">{res.size}</span>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); trackCTA(`Download_${res.file}`); alert(`Downloading ${res.file} PDF...`); }}
                    className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    Download <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-slate-950 text-slate-400 border-t border-slate-900 py-12 px-4 sm:px-6 text-center text-xs sm:text-sm">
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

      {/* Floating Book Pickup Widget (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <a 
          href="https://wa.me/919765539107" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => trackCTA('Floating_WhatsApp')}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 text-slate-950 rounded-full shadow-2xl flex items-center justify-center text-xl transition-all hover:scale-105"
          title="Contact via WhatsApp"
        >
          💬
        </a>
        <button 
          onClick={() => { scrollToForm(); trackCTA('Floating_Book_Pickup'); }}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-lg shadow-2xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          ♻️ Book Pickup
        </button>
      </div>

    </div>
  );
}
