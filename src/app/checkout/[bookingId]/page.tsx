'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Building2, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  UploadCloud, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutPageProps {
  params: Promise<{ bookingId: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'upi_app' | 'qr_code' | null>('razorpay');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states for manual uploads
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bank Coordinates (Displayed for Bank Transfer option) loaded securely from server-side environment config
  const bankDetails = bookingData?.bankDetails || {
    holder: 'TANISH SHAILESH THAKARE',
    account: '5012348899',
    ifsc: 'KKBK0000811',
    bank: 'Kotak Mahindra Bank',
    upiId: '9765539107@ybl',
  };

  // UPI Deep Link constructor
  const upiUrl = `upi://pay?pa=${bankDetails.upiId}&pn=${encodeURIComponent(bankDetails.holder)}&am=99.00&cu=INR&tn=Booking-${bookingId.substring(0, 8)}`;

  // Fetch checkout details on mount
  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/checkout/${bookingId}`);
      if (!res.ok) {
        throw new Error('Failed to load checkout session');
      }
      const data = await res.json();
      setBookingData(data);
      setTimeRemaining(data.expiry.timeRemaining);
      
      // If payment is already successful, trigger confetti
      if (data.booking.bookingFeePaid || data.payments.some((p: any) => p.status === 'SUCCESS')) {
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 300);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not retrieve booking checkout details.');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Refresh data to trigger expiry transition on server
          fetchData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Trigger payment session retry
  const handleRetrySession = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/checkout/${bookingId}/retry`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to generate new payment session');
      }
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Retry initiation failed. Please try again.');
      setLoading(false);
    }
  };

  // Razorpay Checkout handler
  const handleRazorpayCheckout = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/checkout/${bookingId}/razorpay-order`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to initialize Razorpay checkout');
      }
      const orderData = await res.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Renewserv',
        description: 'Site Visit & Booking Fee',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment on the server via manual trigger or wait for webhook
          setLoading(true);
          try {
            // Mock immediate check or wait for API status
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await fetchData();
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: bookingData?.customer?.name,
          email: bookingData?.customer?.email,
          contact: bookingData?.customer?.phone,
        },
        notes: {
          bookingId: orderData.bookingId,
          paymentId: orderData.paymentId,
        },
        theme: {
          color: '#0284c7',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gateway initialization failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct UPI Details Upload handler
  const handleUpiReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!utr && !file) {
      setErrorMsg('Please enter a 12-digit UTR number or upload a screenshot.');
      return;
    }

    // UTR validation
    let normalizedUtr = '';
    if (utr) {
      normalizedUtr = utr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normalizedUtr.length < 8 || normalizedUtr.length > 18) {
        setErrorMsg('Invalid UTR. UTR must be between 8 and 18 alphanumeric characters.');
        return;
      }
    }

    setSubmitting(true);

    try {
      let screenshotUrl = '';
      let screenshotPublicId = '';

      // Upload file to Cloudinary if selected
      if (file) {
        // 1. Fetch Cloudinary signed upload credentials from server
        const credentialsRes = await fetch('/api/checkout/signed-upload');
        if (!credentialsRes.ok) {
          throw new Error('Failed to obtain secure file upload parameters.');
        }
        const creds = await credentialsRes.json();

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', creds.signature);
        formData.append('timestamp', creds.timestamp.toString());
        formData.append('api_key', creds.apiKey);
        formData.append('folder', creds.folder);

        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!cloudinaryRes.ok) {
          throw new Error('Receipt image upload to Cloudinary failed.');
        }

        const cloudData = await cloudinaryRes.json();
        screenshotUrl = cloudData.secure_url;
        screenshotPublicId = cloudData.public_id;
      }

      // 3. Submit payment details to backend API
      const payRes = await fetch(`/api/checkout/${bookingId}/pay-upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: normalizedUtr,
          screenshotUrl,
          screenshotPublicId,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || 'Failed to submit payment details.');
      }

      setSuccessMsg('Your transaction receipt has been submitted successfully for verification!');
      setUtr('');
      setFile(null);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 5 MB limit.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrorMsg('Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.');
        return;
      }
      setFile(selectedFile);
      setErrorMsg(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  const booking = bookingData?.booking;
  const isSessionExpired = bookingData?.expiry.isExpired;
  const isPaid = booking?.bookingFeePaid || bookingData?.payments.some((p: any) => p.status === 'SUCCESS');
  const isUnderVerification = bookingData?.payments.some((p: any) => p.status === 'UNDER_VERIFICATION');

  // Determine current step for visual timeline
  let activeTimelineStep = 2; // Payment Initiated
  if (isUnderVerification) activeTimelineStep = 4; // Verification
  if (isPaid) activeTimelineStep = 5; // Confirmed

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 relative overflow-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Decorative Soft Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Navigation Banner */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-bold text-sky-600 tracking-tight">
            Renew<span className="text-slate-800">serv</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Bookings</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-800 font-medium">Checkout</span>
          </div>
        </div>

        {/* 1. Booking Expiry Banner / Status Banner */}
        <AnimatePresence mode="wait">
          {isPaid ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-emerald-800">Payment Verified & Slot Confirmed!</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Your solar technician slot is locked. You can track assignment details on your dashboard.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <a 
                  href="/dashboard"
                  className="flex-1 md:flex-initial text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition duration-200 text-sm whitespace-nowrap"
                >
                  Go to Dashboard
                </a>
                <a 
                  href={`/api/invoices/${bookingId}/download`}
                  className="flex-1 md:flex-initial text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Download className="w-4 h-4" /> Invoice
                </a>
              </div>
            </motion.div>
          ) : isSessionExpired ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-650 text-red-600 rounded-full">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-800">Payment Session Expired</h2>
                  <p className="text-sm text-slate-655 text-slate-600 mt-1">
                    The 30-minute booking slot lock has expired. Your technician coordinates have been released.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleRetrySession}
                className="w-full md:w-auto bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2"
              >
                Generate New Session
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-600 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  Secure your slot. Payment session expires in:
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-sky-700 bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200">
                {formatTime(timeRemaining)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Visual Payment Timeline */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-6 text-center">
            Booking & Payment Progress
          </h3>
          <div className="flex items-center justify-between relative max-w-lg mx-auto">
            {/* Timeline connectors */}
            <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-4 -z-10" />
            <div 
              className="absolute left-0 h-0.5 bg-sky-600 top-4 -z-10 transition-all duration-500" 
              style={{ width: `${((activeTimelineStep - 1) / 4) * 100}%` }}
            />
            
            {/* Steps */}
            {[
              { step: 1, label: 'Slot Reserved' },
              { step: 2, label: 'Initiated' },
              { step: 3, label: 'Receipt' },
              { step: 4, label: 'Verification' },
              { step: 5, label: 'Confirmed' }
            ].map((node) => {
              const isDone = node.step < activeTimelineStep;
              const isActive = node.step === activeTimelineStep;
              
              return (
                <div key={node.step} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone ? 'bg-sky-600 text-white' : 
                    isActive ? 'bg-sky-500 text-white ring-4 ring-sky-100' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {node.step}
                  </div>
                  <span className={`text-[10px] mt-2 font-medium ${
                    isActive ? 'text-sky-655 text-sky-600 font-semibold' : 'text-slate-550 text-slate-505 text-slate-500'
                  }`}>
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta Grid - Booking Summary & Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Booking Summary Panel */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex-1">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                Booking Summary
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500">Service Plan</label>
                  <p className="text-sm font-semibold text-sky-600 mt-0.5">
                    {booking?.serviceType || 'Solar Health check'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Scheduled Date</label>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {booking?.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Preferred Time Slot</label>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {booking?.scheduledTime || 'Morning Slot'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-505 text-slate-500">Reference ID</label>
                  <p className="text-sm font-mono text-slate-500 mt-0.5">
                    #{bookingId.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-sky-655 text-sky-600">₹99.00</span>
                </div>
                <div className="mt-4 p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-sky-700 leading-normal">
                    Secure checkout. 256-bit SSL encryption.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Action Cards */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Wording Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-605 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Site Fee Wording:</strong> The ₹99 Site Visit Fee covers technician scheduling and site inspection services and is charged separately from the final service quotation.
              </p>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-800 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Payment Method Cards */}
            {!isPaid && !isSessionExpired && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-705 text-slate-700">
                  Select Payment Option
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Razorpay Checkout */}
                  <div 
                    onClick={() => setSelectedMethod('razorpay')}
                    className={`border rounded-xl p-4 cursor-pointer flex items-center gap-3.5 transition-all duration-200 ${
                      selectedMethod === 'razorpay' ? 
                      'border-sky-505 border-sky-500 bg-sky-50 shadow-sm' : 
                      'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${
                      selectedMethod === 'razorpay' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-805 text-slate-800">Razorpay Online</h4>
                      <p className="text-[11px] text-slate-505 text-slate-500 mt-0.5">Cards, Netbanking, Wallets</p>
                    </div>
                  </div>

                  {/* Card 2: UPI Apps Redirect */}
                  <div 
                    onClick={() => setSelectedMethod('upi_app')}
                    className={`border rounded-xl p-4 cursor-pointer flex items-center gap-3.5 transition-all duration-200 ${
                      selectedMethod === 'upi_app' ? 
                      'border-sky-505 border-sky-500 bg-sky-50 shadow-sm' : 
                      'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${
                      selectedMethod === 'upi_app' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">UPI Apps</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pay via GPay, PhonePe, Paytm</p>
                    </div>
                  </div>

                  {/* Card 3: Scan QR Code */}
                  <div 
                    onClick={() => setSelectedMethod('qr_code')}
                    className={`border rounded-xl p-4 cursor-pointer flex items-center gap-3.5 transition-all duration-200 ${
                      selectedMethod === 'qr_code' ? 
                      'border-sky-505 border-sky-500 bg-sky-50 shadow-sm' : 
                      'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${
                      selectedMethod === 'qr_code' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Scan QR Code</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Instant checkout from mobile</p>
                    </div>
                  </div>
                </div>

                {/* Selected Method Details Panels */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mt-6">
                  
                  {/* razorpay container */}
                  {selectedMethod === 'razorpay' && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500 mb-6">
                        Complete your payment online using our secure card, netbanking, and wallet partner.
                      </p>
                      <button
                        onClick={handleRazorpayCheckout}
                        disabled={submitting}
                        className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Pay Online ₹99 <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  )}

                  {/* upi_app container */}
                  {selectedMethod === 'upi_app' && (
                    <div className="space-y-6">
                      <div className="text-center py-2">
                        <p className="text-xs text-slate-500 mb-4">
                          Deep-link redirect to Google Pay, PhonePe, Paytm, or BHIM. This works on mobile devices.
                        </p>
                        <a
                          href={upiUrl}
                          className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl transition duration-200 text-sm inline-flex items-center justify-center gap-2"
                        >
                          Launch Payment App <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verification Details (Secure)
                        </h4>
                        <form onSubmit={handleUpiReceiptSubmit} className="space-y-4">
                          <div>
                            <label className="text-xs text-slate-500 block mb-2 font-medium">12-Digit UTR Number</label>
                            <input 
                              type="text"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              placeholder="e.g. 123456789012"
                              className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-2 font-medium">Upload screenshot receipt (PDF, JPG, PNG, max 5MB)</label>
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                              <input 
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <UploadCloud className="w-8 h-8 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {file ? file.name : 'Select receipt file to upload'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {submitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Submit Details for Verification'
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* qr_code container */}
                  {selectedMethod === 'qr_code' && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center text-center">
                        <p className="text-xs text-slate-500 mb-4">
                          Scan this QR code using GPay, PhonePe, Paytm, or BHIM to complete the site visit transfer.
                        </p>
                        <div className="bg-white p-3 rounded-2xl mb-2 flex items-center justify-center border border-slate-100 shadow-sm">
                          <img 
                            src="/tanish_qr.jpg"
                            alt="Payment QR Code" 
                            className="w-44 h-auto max-h-64 object-contain rounded-lg"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 mt-2">
                          UPI ID: <span className="font-mono text-sky-600">{bankDetails.upiId}</span>
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verification Details (Secure)
                        </h4>
                        <form onSubmit={handleUpiReceiptSubmit} className="space-y-4">
                          <div>
                            <label className="text-xs text-slate-500 block mb-2 font-medium">12-Digit UTR Number</label>
                            <input 
                              type="text"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              placeholder="e.g. 123456789012"
                              className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-2 font-medium">Upload screenshot receipt (PDF, JPG, PNG, max 5MB)</label>
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                              <input 
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <UploadCloud className="w-8 h-8 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {file ? file.name : 'Select receipt file to upload'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {submitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Submit Details for Verification'
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Under Verification banner */}
            {!isPaid && isUnderVerification && (
              <div className="bg-sky-50 border border-sky-100 p-6 rounded-2xl text-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-slate-800 mb-2">Payment Verification In Progress</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  We have received your receipt submission. Our billing desk is verifying the details with the bank. 
                  Your booking slot is temporarily reserved. We will update you via Email/WhatsApp shortly.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
