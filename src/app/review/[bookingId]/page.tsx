'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  CheckCircle2, 
  MessageSquareCode, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Heart,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewPageProps {
  params: Promise<{ bookingId: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review states
  const [ratingService, setRatingService] = useState<number>(0);
  const [ratingTechnician, setRatingTechnician] = useState<number>(0);
  const [hoveredService, setHoveredService] = useState<number>(0);
  const [hoveredTechnician, setHoveredTechnician] = useState<number>(0);
  const [comment, setComment] = useState('');

  // Target GBP review link
  const googleReviewLink = 'https://search.google.com/local/writereview?placeid=ChIJu3c2W-vCwj0R2gV0E0a5U6E';

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const res = await fetch(`/api/checkout/${bookingId}`);
      if (!res.ok) {
        throw new Error('Booking checkout session not found.');
      }
      const data = await res.json();
      setBookingData(data);

      const isCompleted = data.booking.status === 'COMPLETED' || data.booking.status === 'WORK_COMPLETED';
      const isPaid = data.booking.bookingFeePaid || data.payments.some((p: any) => p.status === 'SUCCESS');

      if (!isCompleted || !isPaid) {
        setErrorMsg('Reviews can only be submitted for completed and fully paid solar services.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not verify service completion criteria.');
    } finally {
      setLoading(false);
    }
  };

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingService === 0 || ratingTechnician === 0) {
      setErrorMsg('Please select a star rating for both service and technician.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/checkout/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratingService,
          ratingTechnician,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSuccessMsg('Thank you for sharing your feedback with us!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRedirect = async () => {
    // Save a mock/placeholder internal 5-star review first for stats, then redirect
    setSubmitting(true);
    try {
      await fetch(`/api/checkout/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratingService,
          ratingTechnician,
          comment: 'Excellent rating left on Google Business Profile.',
        }),
      });
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      window.open(googleReviewLink, '_blank');
      setSuccessMsg('Thank you for your rating! We have redirected you to our Google Business Profile page.');
    } catch (err) {
      console.error(err);
      window.open(googleReviewLink, '_blank');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  const isHighRating = ratingService >= 4 && ratingTechnician >= 4;
  const isSelectionDone = ratingService > 0 && ratingTechnician > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-100 py-12 px-4 relative overflow-hidden">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Navigation Banner */}
        <div className="flex items-center justify-between mb-12">
          <div className="text-2xl font-bold text-sky-450 tracking-tight">
            Renew<span className="text-slate-100">serv</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-200">Share Feedback</span>
          </div>
        </div>

        {/* Status Error Container */}
        {errorMsg && !successMsg ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/15 border border-red-550/30 p-6 rounded-2xl text-center space-y-4"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
            <h2 className="text-lg font-bold text-slate-200">Review Check Failed</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {errorMsg}
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-2.5 rounded-xl transition duration-150 text-xs uppercase"
            >
              Back to Dashboard
            </button>
          </motion.div>
        ) : successMsg ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center space-y-6 backdrop-blur-md"
          >
            <div className="p-4 bg-emerald-500/15 text-emerald-450 rounded-full w-fit mx-auto border border-emerald-500/25">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-200">Feedback Submitted Successfully</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {successMsg}
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-8 py-3 rounded-xl transition duration-150 text-xs uppercase"
            >
              Go to Dashboard
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-md space-y-8"
          >
            <div className="text-center space-y-2">
              <Heart className="w-10 h-10 text-rose-500 mx-auto fill-rose-500" />
              <h2 className="text-xl font-bold text-slate-200">How was your Solar service?</h2>
              <p className="text-xs text-slate-450 leading-normal">
                Your feedback helps us maintain premium standards and allocate rewards for top performing technicians.
              </p>
            </div>

            <div className="space-y-6">
              {/* Star Rating 1: Overall Service */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-350 block">Rate our Solar Cleaning Service</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = (hoveredService || ratingService) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredService(star)}
                        onMouseLeave={() => setHoveredService(0)}
                        onClick={() => setRatingService(star)}
                        className="p-1 focus:outline-none transition"
                      >
                        <Star className={`w-8 h-8 ${isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating 2: Technician Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-350 block">Rate our Technician's Professionalism</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = (hoveredTechnician || ratingTechnician) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredTechnician(star)}
                        onMouseLeave={() => setHoveredTechnician(0)}
                        onClick={() => setRatingTechnician(star)}
                        className="p-1 focus:outline-none transition"
                      >
                        <Star className={`w-8 h-8 ${isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic UI Section */}
            <AnimatePresence mode="wait">
              {isSelectionDone && (
                <motion.div
                  key={isHighRating ? 'high' : 'low'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-800/80 pt-6"
                >
                  {isHighRating ? (
                    /* 4-5 Stars UI: Google Business Redirect Card */
                    <div className="bg-sky-500/10 border border-sky-550/20 p-6 rounded-xl text-center space-y-4">
                      <h3 className="text-sm font-bold text-sky-350">We'd love a Google Review!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Since you had an exceptional experience, please take 30 seconds to support a local service team by posting a review on Google!
                      </p>
                      <button
                        onClick={handleGoogleRedirect}
                        disabled={submitting}
                        className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition duration-150 text-xs uppercase flex items-center justify-center gap-2 mx-auto"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Review us on Google <ExternalLink className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* 1-3 Stars UI: Internal Form feedback */
                    <form onSubmit={handleInternalSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-350 block mb-2">How can we improve our service?</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Please let us know what went wrong, so we can make it right..."
                          className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 h-24"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-6 py-3.5 rounded-xl transition duration-150 text-xs uppercase flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Submit Feedback <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

      </div>
    </main>
  );
}
