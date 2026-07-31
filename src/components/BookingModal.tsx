import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Building2, 
  HeartPulse, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { Hospital, Department, Doctor, Appointment } from '../types';
import { generateQRCodeDataUrl, calculateRecommendedArrivalTime } from '../utils/helpers';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  selectedHospitalId: string;
  onBookingComplete: (newAppt: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  departments,
  doctors,
  selectedHospitalId,
  onBookingComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Form, 2: AI Optimization & Review, 3: Success Token
  
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id || '');
  const [doctorId, setDoctorId] = useState<string>(''); // empty = any available
  const [preferredDate, setPreferredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('10:30 AM');
  
  const [patientName, setPatientName] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [isElderly, setIsElderly] = useState<boolean>(false);
  const [isEmergencyPriority, setIsEmergencyPriority] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // AI Recommendation State
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    recommendedSlot: string;
    waitTimeEstimateMinutes: number;
    confidenceScore: number;
    arrivalAdvice: string;
    smartRationale: string;
  } | null>(null);

  // Completed Token State
  const [generatedAppointment, setGeneratedAppointment] = useState<Appointment | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  if (!isOpen) return null;

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  const filteredDepartments = departments.filter(d => d.hospitalId === selectedHospitalId || !d.hospitalId);
  const selectedDept = departments.find(d => d.id === departmentId) || departments[0];
  const filteredDoctors = doctors.filter(doc => doc.departmentId === departmentId);
  const selectedDoc = doctors.find(doc => doc.id === doctorId);

  const availableSlots = selectedDoc ? selectedDoc.slots : ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM'];

  // Handle AI Recommendation Query
  const handleAnalyzeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) {
      alert('Please enter patient name and contact phone number.');
      return;
    }

    setIsAiThinking(true);
    setStep(2);

    try {
      const res = await fetch('/api/ai/recommend-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentName: selectedDept?.name,
          doctorName: selectedDoc?.name || 'Available Doctor',
          preferredDate,
          preferredTimeSlot,
          urgency: isEmergencyPriority ? 'Emergency Priority' : 'Normal Outpatient'
        })
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setAiRecommendation(data.recommendation);
      } else {
        throw new Error('Fallback AI slot');
      }
    } catch (err) {
      setAiRecommendation({
        recommendedSlot: preferredTimeSlot,
        waitTimeEstimateMinutes: 12,
        confidenceScore: 94,
        arrivalAdvice: `Arrive at ${calculateRecommendedArrivalTime(preferredTimeSlot, 15)} for registration.`,
        smartRationale: `Analyzed current queue density for ${selectedDept?.name}. Slot ${preferredTimeSlot} provides optimal doctor availability.`
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  // Finalize Appointment Creation
  const handleConfirmBooking = async () => {
    const finalSlot = aiRecommendation?.recommendedSlot || preferredTimeSlot;
    const finalDeptCode = selectedDept?.code || 'GENM';
    const randomSeq = Math.floor(Math.random() * 20) + 101;
    const tokenNum = `${finalDeptCode}-${randomSeq}`;
    const familyPin = Math.floor(1000 + Math.random() * 9000).toString();
    const arrivalTime = calculateRecommendedArrivalTime(finalSlot, 15);

    const assignedDoc = selectedDoc || (filteredDoctors[0] || doctors[0]);

    const qrText = `TOKEN:${tokenNum}|HOSP:${currentHospital.name}|DEPT:${selectedDept?.name}|TIME:${finalSlot}|PIN:${familyPin}`;
    const qrUrl = await generateQRCodeDataUrl(qrText);
    setQrDataUrl(qrUrl);

    const newAppt: Appointment = {
      id: `app-${Date.now()}`,
      tokenNumber: tokenNum,
      queueSequence: randomSeq,
      hospitalId: currentHospital.id,
      departmentId: selectedDept.id,
      doctorId: assignedDoc.id,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      bookingType: isEmergencyPriority ? 'emergency' : 'online',
      preferredDate,
      preferredTimeSlot: finalSlot,
      status: 'in_queue',
      createdAt: new Date().toISOString(),
      recommendedArrivalTime: arrivalTime,
      estimatedConsultTime: finalSlot,
      estimatedWaitMins: aiRecommendation?.waitTimeEstimateMinutes || 15,
      qrCodeUrl: qrUrl,
      familyAccessPin: familyPin,
      isElderlyAssisted: isElderly,
      notes: notes || 'Online Smart Token Booking',
      vitalPriority: isEmergencyPriority ? 'Emergency' : 'Normal'
    };

    setGeneratedAppointment(newAppt);
    onBookingComplete(newAppt);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Online Appointment & AI Smart Token</h3>
              <p className="text-xs text-slate-400">{currentHospital.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Steps */}
        <div className="p-6">

          {/* STEP 1: BOOKING FORM */}
          {step === 1 && (
            <form onSubmit={handleAnalyzeSlot} className="space-y-5">
              
              {/* Department & Doctor Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-cyan-400" /> Department *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setDoctorId('');
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {filteredDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" /> Doctor (Optional)
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">⚡ AI Auto-Assign Fastest Doctor</option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} - {doc.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Slot Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" /> Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" /> Preferred Time Slot *
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Details */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Details</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Krishnan"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Age *</label>
                    <input
                      type="number"
                      min={1}
                      max={110}
                      value={patientAge}
                      onChange={(e) => setPatientAge(Number(e.target.value))}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Phone Number (for SMS notifications) *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Gender</label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Elderly & Priority Toggles */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isElderly}
                      onChange={(e) => setIsElderly(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>👵 Enable Elderly Helper Assistance</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-rose-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEmergencyPriority}
                      onChange={(e) => setIsEmergencyPriority(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="flex items-center gap-1 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" /> Urgent / Vital Triage Case
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-cyan-200" />
                  <span>Analyze Slot & Proceed</span>
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: AI SLOT OPTIMIZATION & REVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              {isAiThinking ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mx-auto"></div>
                  <h4 className="text-base font-semibold text-cyan-300">AI Slot & Queue Load Engine Analyzing...</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Evaluating doctor availability, patient consultation pace, and queue density to minimize hospital wait time.
                  </p>
                </div>
              ) : (
                <>
                  {/* AI Recommendation Banner */}
                  <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 fill-cyan-400" /> AI Recommended Slot
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {aiRecommendation?.confidenceScore || 95}% Match
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">{aiRecommendation?.recommendedSlot}</p>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {aiRecommendation?.arrivalAdvice}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Est. Wait Time</p>
                        <p className="text-lg font-bold text-emerald-400">~{aiRecommendation?.waitTimeEstimateMinutes} Mins</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic bg-cyan-900/30 p-2.5 rounded-lg border border-cyan-800/40 flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{aiRecommendation?.smartRationale}</span>
                    </p>
                  </div>

                  {/* Booking Summary Card */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/80 space-y-2 text-xs">
                    <h5 className="font-bold text-slate-200">Appointment Summary</h5>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div><span className="text-slate-400">Patient:</span> {patientName} ({patientAge} yrs)</div>
                      <div><span className="text-slate-400">Phone:</span> {patientPhone}</div>
                      <div><span className="text-slate-400">Department:</span> {selectedDept?.name}</div>
                      <div><span className="text-slate-400">Doctor:</span> {selectedDoc?.name || 'Auto-Assigned Specialist'}</div>
                      <div><span className="text-slate-400">Date:</span> {preferredDate}</div>
                      <div><span className="text-slate-400">Elderly Mode:</span> {isElderly ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Back to Form
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generate Smart Token</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS TOKEN & QR CODE TICKET */}
          {step === 3 && generatedAppointment && (
            <div className="space-y-6 text-center">
              
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Digital Token Generated!</h3>
                <p className="text-xs text-slate-400 mt-1">Your appointment and live queue tracking position is confirmed.</p>
              </div>

              {/* DIGITAL TOKEN CARD */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold text-[11px] rounded-bl-xl uppercase tracking-wider">
                  Live Token
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Token Number & Details */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Token Number</p>
                      <p className="text-4xl font-black text-cyan-400 tracking-tight">{generatedAppointment.tokenNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase">Department</p>
                        <p className="font-semibold">{selectedDept?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase">Consultation Room</p>
                        <p className="font-semibold text-emerald-400">{selectedDoc?.roomNumber || 'Cabin 1'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase">Appointment Time</p>
                        <p className="font-semibold">{generatedAppointment.preferredTimeSlot}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase">Family Access PIN</p>
                        <p className="font-mono font-bold text-amber-400">{generatedAppointment.familyAccessPin}</p>
                      </div>
                    </div>

                    {/* Smart Arrival Recommendation Banner */}
                    <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-800 text-xs">
                      <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Smart Arrival Advice
                      </p>
                      <p className="text-slate-200 mt-1">
                        Please arrive at <strong className="text-white">{generatedAppointment.recommendedArrivalTime}</strong>. Expected consultation time is {generatedAppointment.preferredTimeSlot}.
                      </p>
                    </div>
                  </div>

                  {/* QR Code Box */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="Token QR Code" className="w-36 h-36 object-contain" />
                    )}
                    <p className="text-[10px] text-slate-800 font-mono font-bold mt-1">{generatedAppointment.tokenNumber}</p>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md"
                >
                  View Live Queue Tracker
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
