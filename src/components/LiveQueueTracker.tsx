import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserCheck, 
  Clock, 
  Users, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  XCircle, 
  QrCode, 
  Sparkles, 
  ChevronRight, 
  Stethoscope,
  Info,
  CheckCircle2,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { Appointment, Doctor, Department } from '../types';
import { calculateQueueProgress } from '../utils/helpers';

interface LiveQueueTrackerProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  onRescheduleAppointment: (id: string, newSlot: string, newDate: string) => void;
  onCancelAppointment: (id: string) => void;
  onOpenBooking: () => void;
}

export const LiveQueueTracker: React.FC<LiveQueueTrackerProps> = ({
  appointments,
  doctors,
  departments,
  onRescheduleAppointment,
  onCancelAppointment,
  onOpenBooking,
}) => {
  // Active selected token to view
  const activeAppointments = appointments.filter(a => a.status === 'in_queue' || a.status === 'serving');
  const [selectedTokenId, setSelectedTokenId] = useState<string>(
    activeAppointments[0]?.id || appointments[0]?.id || ''
  );

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState<string>('02:00 PM');

  // AI Prediction state for active token
  const [aiPredicting, setAiPredicting] = useState<boolean>(false);
  const [livePrediction, setLivePrediction] = useState<{
    predictedWaitMins: number;
    queuePaceStatus: string;
    arrivalRecommendation: string;
    aiInsight: string;
  } | null>(null);

  const currentAppt = appointments.find(a => a.id === selectedTokenId) || activeAppointments[0] || appointments[0];
  const doctor = doctors.find(d => d.id === currentAppt?.doctorId) || doctors[0];
  const department = departments.find(dep => dep.id === currentAppt?.departmentId) || departments[0];

  // Calculate live queue metrics for selected department/doctor
  const deptAppointments = appointments.filter(
    a => a.departmentId === currentAppt?.departmentId && (a.status === 'serving' || a.status === 'in_queue')
  );
  
  const servingAppt = appointments.find(
    a => a.departmentId === currentAppt?.departmentId && a.status === 'serving'
  );

  const currentTokenBeingServed = servingAppt?.tokenNumber || 'CARD-102';
  
  // Find queue sequence ahead
  const patientsAhead = currentAppt
    ? Math.max(0, deptAppointments.findIndex(a => a.id === currentAppt.id))
    : 0;

  const nextAppt = deptAppointments[patientsAhead > 0 ? patientsAhead - 1 : 0] || deptAppointments[0];
  const nextTokenNumber = nextAppt && nextAppt.id !== servingAppt?.id ? nextAppt.tokenNumber : 'CARD-103';

  // Fetch AI Prediction when selected token or queue changes
  useEffect(() => {
    if (!currentAppt) return;

    let isMounted = true;
    setAiPredicting(true);

    fetch('/api/ai/predict-wait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientsAhead,
        doctorAvgTimeMins: doctor?.avgConsultTimeMins || 12,
        doctorStatus: doctor?.status || 'busy',
        emergencyCases: currentAppt.vitalPriority === 'Emergency' ? 1 : 0,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.prediction) {
          setLivePrediction(data.prediction);
        }
      })
      .catch(() => {
        if (isMounted) {
          const calcWait = patientsAhead * (doctor?.avgConsultTimeMins || 12);
          setLivePrediction({
            predictedWaitMins: calcWait,
            queuePaceStatus: doctor?.status === 'on_break' ? 'Slight Delay (Break)' : 'On Schedule',
            arrivalRecommendation: `Please arrive at ${currentAppt.recommendedArrivalTime}. Your expected consultation is at ${currentAppt.preferredTimeSlot}.`,
            aiInsight: `Doctor consulting at avg ${doctor?.avgConsultTimeMins} mins per patient.`
          });
        }
      })
      .finally(() => {
        if (isMounted) setAiPredicting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentAppt?.id, patientsAhead, doctor?.status]);

  if (!currentAppt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <UserCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Active Token Found</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          You don't have an active appointment token booked yet. Book a new appointment to track real-time live queue.
        </p>
        <button
          onClick={onOpenBooking}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20"
        >
          Book Online Appointment
        </button>
      </div>
    );
  }

  const progressPct = calculateQueueProgress(
    servingAppt ? servingAppt.queueSequence : 1,
    currentAppt.queueSequence,
    deptAppointments.length + 2
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Token Switcher Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> Live Real-Time Queue Tracker
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Token Tracker: {currentAppt.tokenNumber}</h2>
          <p className="text-xs text-slate-400">{department?.name} • {doctor?.name} ({doctor?.roomNumber})</p>
        </div>

        {/* Token Switcher Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">My Tokens:</span>
          {appointments.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedTokenId(a.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                a.id === currentAppt.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {a.tokenNumber} ({a.status})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Queue Display Cards (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Metric Highlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Current Token Served */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shadow-lg text-center relative overflow-hidden">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Now Serving</span>
              <p className="text-2xl font-black text-cyan-300 tracking-tight my-1 animate-pulse">{currentTokenBeingServed}</p>
              <p className="text-[11px] text-slate-400 font-medium">{doctor?.roomNumber}</p>
            </div>

            {/* Next Token */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Token</span>
              <p className="text-2xl font-black text-slate-200 tracking-tight my-1">{nextTokenNumber}</p>
              <p className="text-[11px] text-slate-400 font-medium">In Waiting Line</p>
            </div>

            {/* Patients Ahead */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Patients Ahead</span>
              <p className="text-2xl font-black text-amber-300 tracking-tight my-1">{patientsAhead}</p>
              <p className="text-[11px] text-slate-400 font-medium">People before you</p>
            </div>

            {/* Est. Wait Time */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Est. Wait Time</span>
              <p className="text-2xl font-black text-emerald-300 tracking-tight my-1">
                ~{livePrediction?.predictedWaitMins ?? (patientsAhead * 12)} m
              </p>
              <p className="text-[11px] text-slate-400 font-medium">AI Calculated</p>
            </div>

          </div>

          {/* Smart Arrival Recommendation Card */}
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border border-cyan-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 fill-cyan-400" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-cyan-200 flex items-center gap-2">
                    Smart Arrival Recommendation
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-700">
                    {livePrediction?.queuePaceStatus || 'On Schedule'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white bg-slate-950/60 p-3 rounded-xl border border-cyan-900/50">
                  {livePrediction?.arrivalRecommendation || `Please arrive at ${currentAppt.recommendedArrivalTime}. Your expected consultation time is ${currentAppt.preferredTimeSlot}.`}
                </p>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{livePrediction?.aiInsight || "AI continuously monitors consultation speed and emergency entries."}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Queue Progress Bar & Doctor Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Queue Flow Progress</span>
                <span className="text-cyan-400">{progressPct}% Complete</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-md shadow-cyan-500/50"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Cabin Opened</span>
                <span>Serving {currentTokenBeingServed}</span>
                <span>Your Token {currentAppt.tokenNumber}</span>
              </div>
            </div>

            {/* Doctor Status Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center space-x-4">
              <img 
                src={doctor.photo} 
                alt={doctor.name} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-white">{doctor.name}</h5>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    doctor.status === 'available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    doctor.status === 'busy' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    doctor.status === 'on_break' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {doctor.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{doctor.qualification} • {doctor.roomNumber}</p>
                <p className="text-[11px] text-cyan-300 font-medium mt-1">
                  Status: {doctor.statusReason || 'In Cabin - Active Consultations'}
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Digital Token Summary & Actions */}
        <div className="space-y-6">
          
          {/* Token Card */}
          <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Patient Ticket</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                PIN: {currentAppt.familyAccessPin}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400">Patient Name</p>
              <p className="text-base font-bold text-white">{currentAppt.patientName} ({currentAppt.patientAge} yrs)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <p className="text-[10px] text-slate-400">Time Slot</p>
                <p className="font-bold text-slate-200">{currentAppt.preferredTimeSlot}</p>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <p className="text-[10px] text-slate-400">Booking Type</p>
                <p className="font-bold text-slate-200 capitalize">{currentAppt.bookingType}</p>
              </div>
            </div>

            {/* QR Code Container */}
            {currentAppt.qrCodeUrl && (
              <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center">
                <img src={currentAppt.qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain" />
                <p className="text-[10px] text-slate-900 font-mono font-bold mt-1">{currentAppt.tokenNumber}</p>
              </div>
            )}

            {/* Reschedule & Cancel Action Buttons */}
            <div className="pt-2 space-y-2 border-t border-slate-800">
              <button
                onClick={() => setRescheduleModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reschedule Appointment</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this appointment token?')) {
                    onCancelAppointment(currentAppt.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-800/60 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Cancel Appointment</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-lg text-white">Reschedule Token {currentAppt.tokenNumber}</h4>
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Date</label>
              <input 
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Time Slot</label>
              <select
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
              >
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="03:00 PM">03:00 PM</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRescheduleAppointment(currentAppt.id, newSlot, newDate);
                  setRescheduleModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
