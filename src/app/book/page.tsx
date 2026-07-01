'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  MapPin, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Wrench,
  Activity,
  Check
} from 'lucide-react';

export default function BookService() {
  const router = useRouter();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Stepper state
  const [step, setStep] = useState(2); // 2 = Address, 3 = Payment, 4 = Success
  
  // Booking Form fields
  const [serviceType, setServiceType] = useState('PANEL_CLEANING');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [isEmergency, setIsEmergency] = useState(false);
  const [gpsCoords, setGpsCoords] = useState('');

  // Page states
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState('');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('selected_service') : null;
    if (saved) {
      setServiceType(saved);
      localStorage.removeItem('selected_service');
    }

    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/?login=true');
        } else {
          setCurrentUser(data.user);
        }
        setLoadingUser(false);
      })
      .catch(() => {
        router.push('/?login=true');
        setLoadingUser(false);
      });
  }, [router]);

  const validateDetails = () => {
    if (!addressLine.trim()) {
      setCoverageError('Please enter your full solar installation address.');
      return false;
    }
    if (!postalCode.trim() || postalCode.length < 6) {
      setCoverageError('Please enter a valid 6-digit pin code.');
      return false;
    }
    if (!scheduledDate) {
      setCoverageError('Please select a service date.');
      return false;
    }
    setCoverageError('');
    return true;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!validateDetails()) return;
      
      setCheckingCoverage(true);
      setCoverageError('');
      
      const trimmed = postalCode.trim();
      const isPunePin = ['411', '412', '410'].some(prefix => trimmed.startsWith(prefix)) && trimmed.length === 6;
      
      if (!isPunePin) {
        setCoverageError('Sorry! We do not cover this area code yet. Pune and surrounding Pune areas (starting with 411, 412, 410) only.');
        setCheckingCoverage(false);
        return;
      }
      
      if (!gpsCoords) {
        setGpsCoords(`${18.5204 + Math.random() * 0.05}, ${73.8567 + Math.random() * 0.05}`);
      }
      
      setCheckingCoverage(false);
      setStep(3);
    }
  };

  const handleBookingSubmit = async () => {
    setPaymentLoading(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          scheduledDate,
          scheduledTime,
          addressLabel: 'Home Installation',
          addressLine,
          postalCode,
          gpsCoords,
          isEmergency
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setCreatedBookingId(data.bookingId);
      setStep(4);
    } catch (err: any) {
      setBookingError(err.message || 'Payment processing failed. Try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="mt-4 font-semibold text-sm">Verifying Session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Renewserv Logo" className="h-14 w-auto object-contain" />
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Stepper Progress Bar */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">
              <span className={step >= 2 ? 'text-blue-600 font-extrabold' : ''}>1. Address &amp; Time</span>
              <span className={step >= 3 ? 'text-blue-600 font-extrabold' : ''}>2. Pay Booking Fee</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                step === 2 ? 'w-1/2' : 'w-full'
              }`} />
            </div>
          </div>
        )}

        {/* STEP 2: Address & Schedule */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Enter Address &amp; Time</h2>
              <p className="text-slate-500 text-sm">Tell us where the solar panels are located and choose a slot.</p>
            </div>

            {coverageError && (
              <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-755 flex gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{coverageError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Installation Address</label>
                <textarea 
                  placeholder="Flat/House No., Building Name, Street Address, Land-mark" 
                  rows={3}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">6-digit Postal Pincode</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 411038" 
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Preferred Service Date</label>
                  <input 
                    type="date" 
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Preferred Time Window</label>
                  <select 
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-350 bg-white text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="09:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:00 AM">11:00 AM - 01:00 PM</option>
                    <option value="01:00 PM">01:00 PM - 03:00 PM</option>
                    <option value="03:00 PM">03:00 PM - 05:00 PM</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 mt-4">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold text-slate-900">Same-Day Emergency?</span>
                    <p className="text-[10px] text-slate-500">Dispatch technician within 4 hours (+₹50)</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-5 h-5 text-blue-600 accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3.5 rounded-lg border border-slate-350 hover:bg-slate-55 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1 min-h-[52px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <button 
                onClick={handleNextStep}
                disabled={checkingCoverage}
                className="px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center gap-1 min-h-[52px]"
              >
                {checkingCoverage ? 'Verifying Coverage...' : 'Proceed to Payment'}
                {!checkingCoverage && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Pay Booking Fee</h2>
              <p className="text-slate-500 text-sm">To verify slot booking, we collect a refundable ₹99 inspection fee.</p>
            </div>

            {bookingError && (
              <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-750 flex gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-sm sm:text-base">
                <div className="space-y-0.5 text-left">
                  <span className="font-extrabold text-slate-900">Health Check Booking Fee</span>
                  <div className="text-slate-555 text-[11px]">Adjusted in the final cleaning bill</div>
                </div>
                <span className="font-extrabold text-slate-900">₹99.00</span>
              </div>

              {isEmergency && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-xs sm:text-sm">
                  <span className="text-slate-650">Emergency Surcharge</span>
                  <span className="font-semibold text-slate-800">+₹50.00</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm sm:text-base font-bold">
                <span className="text-slate-700">Total Payable Now</span>
                <span className="text-blue-600 text-lg sm:text-xl font-extrabold">₹{isEmergency ? 149.00 : 99.00}</span>
              </div>
            </div>

            {/* Simulated UPI Checkout environment */}
            <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 bg-white space-y-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <CreditCard className="w-4 h-4 text-blue-600" />
                SECURE UPI PAYMENTS (GPAY / PHONEPE MOCK)
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Clicking confirm simulates a successful UPI collection request. The ₹{isEmergency ? 149 : 99} fee will be recorded in the ledger escrow system immediately.
              </p>
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <button 
                onClick={() => setStep(2)}
                disabled={paymentLoading}
                className="px-6 py-3.5 rounded-lg border border-slate-350 hover:bg-slate-55 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1 min-h-[52px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <button 
                onClick={handleBookingSubmit}
                disabled={paymentLoading}
                className="px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base flex-1 flex items-center justify-center gap-2 min-h-[52px]"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Pay & Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto border border-green-200">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Booking Confirmed!</h2>
              <p className="text-slate-555 text-sm max-w-xs mx-auto">
                We have registered your booking. Booking reference code:
              </p>
              <div className="font-mono text-xs bg-slate-50 px-3.5 py-2 rounded-lg inline-block border border-slate-200 text-slate-700">
                {createdBookingId}
              </div>
            </div>

            <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
              We are assigning a verified cleaning technician. You can track their arrival live from your dashboard.
            </p>

            <div className="pt-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm inline-flex items-center justify-center gap-1.5 min-h-[52px]"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-6 text-center text-xs sm:text-sm mt-12 w-full">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <img src="/logo.png" alt="Renewserv Logo" className="h-12 w-auto object-contain" />
            <span className="text-slate-500">© 2026. Pune, Maharashtra, India.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span className="text-slate-500">WhatsApp: +91 9657331331</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
