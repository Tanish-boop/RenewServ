'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  User, 
  Phone, 
  CheckSquare, 
  Square,
  Navigation,
  LogOut,
  Star,
  Activity,
  Droplet
} from 'lucide-react';

export default function TechnicianPortal() {
  const router = useRouter();

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Attendance Status
  const [attendance, setAttendance] = useState<any>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Tasks & Diagnostics
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [submittingJobStatus, setSubmittingJobStatus] = useState(false);

  // Diagnostic Form inputs
  const [findings, setFindings] = useState('');
  const [panelCondition, setPanelCondition] = useState('DIRTY_DEGRADED');
  const [outputVoltage, setOutputVoltage] = useState('');
  const [efficiencyBefore, setEfficiencyBefore] = useState('');
  const [efficiencyAfter, setEfficiencyAfter] = useState('');
  const [diagError, setDiagError] = useState('');

  useEffect(() => {
    fetchSessionAndData();
  }, [router]);

  const fetchSessionAndData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.user) {
        router.push('/?login=true');
        return;
      }

      if (data.user.role !== 'TECHNICIAN') {
        if (data.user.role === 'CLIENT') {
          router.push('/dashboard');
        } else {
          router.push('/admin');
        }
        return;
      }

      setCurrentUser(data.user);
      setLoadingUser(false);

      // Fetch attendance check-in status
      const attRes = await fetch('/api/technician/attendance');
      const attData = await attRes.json();
      setAttendance(attData.attendance);

      // Fetch active tasks
      const bookingsRes = await fetch('/api/technician/assignments');
      const bookingsData = await bookingsRes.json();
      setAssignedBookings(bookingsData);

      if (bookingsData.length > 0) {
        setSelectedBooking((prev: any) => {
          if (prev) {
            const found = bookingsData.find((b: any) => b.id === prev.id);
            if (found) return found;
          }
          return bookingsData[0];
        });
      }
    } catch (err) {
      router.push('/?login=true');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  const handleAttendanceToggle = async () => {
    setSubmittingAttendance(true);
    const action = attendance ? 'CHECK_OUT' : 'CHECK_IN';

    try {
      const res = await fetch('/api/technician/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          gpsLatitude: '18.5204',
          gpsLongitude: '73.8567'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Attendance logging failed');

      fetchSessionAndData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const updateJobStatus = async (status: string) => {
    setSubmittingJobStatus(true);
    setDiagError('');

    try {
      const payload: any = {
        bookingId: selectedBooking.id,
        status
      };

      if (status === 'INSPECTION_COMPLETED') {
        if (!outputVoltage || !efficiencyBefore || !efficiencyAfter || !findings.trim()) {
          throw new Error('Please fill in all diagnostic checkup inputs before submitting.');
        }
        payload.findings = findings;
        payload.panelCondition = panelCondition;
        payload.outputVoltage = outputVoltage;
        payload.efficiencyBefore = efficiencyBefore;
        payload.efficiencyAfter = efficiencyAfter;
      }

      const res = await fetch('/api/technician/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update task status');

      // Clear form
      setFindings('');
      setOutputVoltage('');
      setEfficiencyBefore('');
      setEfficiencyAfter('');

      // Refresh list
      fetchSessionAndData();
    } catch (err: any) {
      setDiagError(err.message || 'Error processing request.');
    } finally {
      setSubmittingJobStatus(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-650">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="mt-4 font-semibold text-sm">Loading Technician Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Renewserv Logo" className="h-14 w-auto object-contain" />
            <span className="font-extrabold text-lg text-slate-905">Tech</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-550">Expert: <strong className="text-slate-800 font-bold">{currentUser.name}</strong></span>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-505 hover:text-slate-900 transition-all border border-slate-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-6">
        
        {/* Attendance Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Attendance & Availablity</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2.5 h-2.5 rounded-full ${attendance ? 'bg-green-500 animate-ping' : 'bg-slate-350'}`} />
              <span className="text-sm font-bold text-slate-900">
                {attendance ? 'You are CHECKED IN (Online & Available)' : 'You are checked out (Offline)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Must check in online to receive assignments inside Kothrud / Pune.</p>
          </div>

          <button
            onClick={handleAttendanceToggle}
            disabled={submittingAttendance}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-extrabold text-sm transition-all min-h-[48px] shadow-sm ${
              attendance 
                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submittingAttendance ? 'Logging...' : attendance ? 'Check Out Offline' : 'Check In Online'}
          </button>
        </div>

        {/* Dash split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
          
          {/* Active Job list */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-500 tracking-wide uppercase px-1">Assigned Cleaning Tasks</h3>
            
            {assignedBookings.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs">
                No solar panel cleaning tasks assigned at this moment.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {assignedBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => { setSelectedBooking(b); setDiagError(''); }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBooking?.id === b.id
                        ? 'bg-blue-50/20 border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-2 font-bold uppercase tracking-wider">
                      <span className="font-mono text-slate-400">#{b.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        b.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 mb-2">
                      {b.serviceType === 'SYSTEM_DISMANTLING' ? 'Panel Removal & Reinstallation' :
                       b.serviceType === 'SITE_INSPECTION' ? 'Solar Health Check' :
                       'Solar Panel Cleaning'}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-550 text-left">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.address.addressLine}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.scheduledDate} ({b.scheduledTime})</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job execution checklist */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-500 tracking-wide uppercase px-1">Task Operations Checklist</h3>

            {selectedBooking ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
                
                {/* Client info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono block">Booking: {selectedBooking.id}</span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedBooking.serviceType === 'SYSTEM_DISMANTLING' ? 'Solar Panel Removal & Reinstallation' :
                       selectedBooking.serviceType === 'SITE_INSPECTION' ? 'Solar Health Check' :
                       'Solar Panel Cleaning'}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      Client Name: {selectedBooking.user.profile.name} | Phone: {selectedBooking.user.profile.phone}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Address Pincode</span>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                      {selectedBooking.address.postalCode}
                    </span>
                  </div>
                </div>

                {diagError && (
                  <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-755 text-xs sm:text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{diagError}</span>
                  </div>
                )}

                {/* Operations checklist form */}
                <div className="space-y-4 text-left">
                  <h4 className="font-extrabold text-sm text-slate-900">Service Pipeline Status</h4>
                  
                  <div className="space-y-3">
                    {/* Step 1: Start Travel */}
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="mt-1">
                        {['TECHNICIAN_ON_THE_WAY', 'INSPECTION_COMPLETED', 'QUOTE_SENT', 'APPROVED', 'WORK_STARTED', 'COMPLETED'].includes(selectedBooking.status) ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Navigation className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">Dispatch & Travel Status</span>
                        <p className="text-[11px] text-slate-500">Tap start travel when starting journey to Kothrud / Pune rooftop site.</p>
                        
                        {selectedBooking.status === 'ASSIGNED' && (
                          <button
                            onClick={() => updateJobStatus('TECHNICIAN_ON_THE_WAY')}
                            disabled={submittingJobStatus}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all min-h-[40px]"
                          >
                            Start Travel Now
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Diagnostic values */}
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="mt-1">
                        {['INSPECTION_COMPLETED', 'QUOTE_SENT', 'APPROVED', 'WORK_STARTED', 'COMPLETED'].includes(selectedBooking.status) ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Activity className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">Solar Health Check (Diagnostic Inputs)</span>
                        <p className="text-[11px] text-slate-500">Measure output voltage values at the inverter unit, log generation status, and submit.</p>

                        {selectedBooking.status === 'TECHNICIAN_ON_THE_WAY' ? (
                          <div className="space-y-4 border-t border-slate-200 pt-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Rooftop Panel Condition</label>
                                <select 
                                  value={panelCondition} 
                                  onChange={(e) => setPanelCondition(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-350 bg-white text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
                                >
                                  <option value="DIRTY_DEGRADED">Dirty / Power Output loss</option>
                                  <option value="BROKEN_GLASS">Broken Glass / Damage</option>
                                  <option value="GOOD_CONDITION">Good / Clean (Needs diagnostics)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Output Voltage (Volt)</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 195" 
                                  value={outputVoltage}
                                  onChange={(e) => setOutputVoltage(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Generation Efficiency Before wash (%)</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 50" 
                                  value={efficiencyBefore}
                                  onChange={(e) => setEfficiencyBefore(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Est. Generation Efficiency After wash (%)</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 95" 
                                  value={efficiencyAfter}
                                  onChange={(e) => setEfficiencyAfter(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600">Technician Diagnostic Findings</label>
                              <textarea 
                                placeholder="Describe structural health, dust thickness, chemical stains..." 
                                rows={2}
                                value={findings}
                                onChange={(e) => setFindings(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-350 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs resize-none"
                              />
                            </div>

                            <button
                              onClick={() => updateJobStatus('INSPECTION_COMPLETED')}
                              disabled={submittingJobStatus}
                              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all min-h-[40px]"
                            >
                              Submit Diagnostic Report
                            </button>
                          </div>
                        ) : selectedBooking.inspectionReport ? (
                          <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
                            <div>Voltage: <strong className="text-slate-800">{selectedBooking.inspectionReport.outputVoltage} V</strong></div>
                            <div>Before/After efficiency: <strong className="text-slate-800">{selectedBooking.inspectionReport.efficiencyBefore}% ➔ {selectedBooking.inspectionReport.efficiencyAfter}%</strong></div>
                            <div>Findings: <strong className="text-slate-800">{selectedBooking.inspectionReport.findings}</strong></div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Step 3: Start work */}
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="mt-1">
                        {['WORK_STARTED', 'COMPLETED'].includes(selectedBooking.status) ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Droplet className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">Rooftop Cleaning Execution</span>
                        <p className="text-[11px] text-slate-505">Once client approves quote and pays 50% advance, tap start work to commence washing.</p>
                        
                        {selectedBooking.status === 'APPROVED' && (
                          <button
                            onClick={() => updateJobStatus('WORK_STARTED')}
                            disabled={submittingJobStatus}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all min-h-[40px]"
                          >
                            Start Work Now
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Complete Job */}
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="mt-1">
                        {selectedBooking.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <CheckSquare className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">Job Completion & Release</span>
                        <p className="text-[11px] text-slate-505">Click to confirm cleaning completion. This collects the remaining invoice from client and triggers the double-entry escrow release.</p>
                        
                        {selectedBooking.status === 'WORK_STARTED' && (
                          <button
                            onClick={() => updateJobStatus('COMPLETED')}
                            disabled={submittingJobStatus}
                            className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm transition-all min-h-[40px]"
                          >
                            Mark Job Completed
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-dashed border-slate-200 bg-white text-center text-slate-400 text-xs">
                Select an active solar cleaning task from the list to display details.
              </div>
            )}
          </div>

        </div>
      </main>
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-4 sm:px-6 text-center text-xs sm:text-sm mt-12 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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
