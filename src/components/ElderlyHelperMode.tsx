import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Printer, 
  Volume2, 
  UserPlus, 
  PhoneCall, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  HelpCircle,
  Clock,
  Eye
} from 'lucide-react';
import { Appointment, Hospital, Department, Doctor } from '../types';
import { generateQRCodeDataUrl, speakAnnouncement, calculateRecommendedArrivalTime } from '../utils/helpers';

interface ElderlyHelperModeProps {
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  selectedHospitalId: string;
  onBookingComplete: (newAppt: Appointment) => void;
  isHighContrast: boolean;
}

export const ElderlyHelperMode: React.FC<ElderlyHelperModeProps> = ({
  hospitals,
  departments,
  doctors,
  selectedHospitalId,
  onBookingComplete,
  isHighContrast,
}) => {
  const [patientName, setPatientName] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number>(68);
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id || '');
  const [notes, setNotes] = useState<string>('Reception Walk-In Assist');

  const [generatedSlip, setGeneratedSlip] = useState<{
    appointment: Appointment;
    qrUrl: string;
  } | null>(null);

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  const selectedDept = departments.find(d => d.id === departmentId) || departments[0];

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) {
      alert('Please enter patient name.');
      return;
    }

    const assignedDoc = doctors.find(d => d.departmentId === departmentId) || doctors[0];
    const deptCode = selectedDept?.code || 'CARD';
    const seq = Math.floor(Math.random() * 20) + 101;
    const tokenNum = `${deptCode}-${seq}`;
    const familyPin = Math.floor(1000 + Math.random() * 9000).toString();
    const timeSlot = '10:45 AM';

    const qrText = `TOKEN:${tokenNum}|PATIENT:${patientName}|HOSP:${selectedHospital.name}|ROOM:${assignedDoc.roomNumber}`;
    const qrUrl = await generateQRCodeDataUrl(qrText);

    const newAppt: Appointment = {
      id: `app-elderly-${Date.now()}`,
      tokenNumber: tokenNum,
      queueSequence: seq,
      hospitalId: selectedHospital.id,
      departmentId: selectedDept.id,
      doctorId: assignedDoc.id,
      patientName,
      patientAge,
      patientGender: 'Male',
      patientPhone: patientPhone || '+91 98400 00000',
      bookingType: 'reception_walkin',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTimeSlot: timeSlot,
      status: 'in_queue',
      createdAt: new Date().toISOString(),
      recommendedArrivalTime: '10:30 AM',
      estimatedConsultTime: timeSlot,
      estimatedWaitMins: 15,
      qrCodeUrl: qrUrl,
      familyAccessPin: familyPin,
      isElderlyAssisted: true,
      notes,
    };

    setGeneratedSlip({ appointment: newAppt, qrUrl });
    onBookingComplete(newAppt);

    // Speak Tamil Voice Announcement automatically
    const tamilText = `டோக்கன் எண் ${tokenNum} பதிவு செய்யப்பட்டது. அறை எண் ${assignedDoc.roomNumber} க்கு செல்லவும்.`;
    speakAnnouncement(tamilText, 'ta-IN');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className={`p-6 rounded-3xl border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
        isHighContrast ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-2xl ${isHighContrast ? 'bg-black text-yellow-300' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Elderly Helper & Reception Desk Mode</h2>
            <p className={`text-xs mt-1 ${isHighContrast ? 'text-black font-semibold' : 'text-slate-400'}`}>
              Large font display, reception-assisted registration, printed physical token slip, and bilingual voice announcements in Tamil & English.
            </p>
          </div>
        </div>

        {/* Voice Announcement Test Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => speakAnnouncement('Welcome to SmartCare Hospital Elderly Assistance Desk.', 'en-US')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>English Voice 🗣️</span>
          </button>

          <button
            onClick={() => speakAnnouncement('ஸ்மார்ட்கேர் மருத்துவமனை முதியோர் உதவி மையத்திற்கு வரவேற்கிறோம்.', 'ta-IN')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Volume2 className="w-4 h-4 text-slate-950" />
            <span>தமிழ் குரல் 🗣️</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Receptionist Registration Form */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          isHighContrast ? 'bg-yellow-100 text-black border-yellow-400' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex items-center space-x-2 border-b pb-4 border-slate-800">
            <UserPlus className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-extrabold">Reception Walk-In Registration</h3>
          </div>

          <form onSubmit={handleRegisterWalkIn} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Patient Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Shanmugam M."
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white text-base font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Age *</label>
                <input
                  type="number"
                  min={1}
                  max={110}
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white text-base font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Attendant / Family Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98400 12345"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-base font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-base shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>Print Token & Announce in Tamil</span>
            </button>
          </form>
        </div>

        {/* Right Column: Printed Thermal Token Receipt Preview */}
        <div className="space-y-6">
          {generatedSlip ? (
            <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 font-mono border-4 border-slate-200 relative overflow-hidden">
              
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 space-y-1">
                <h4 className="text-xl font-black uppercase tracking-tight">{selectedHospital.name}</h4>
                <p className="text-xs text-slate-600 font-bold">OPD Walk-In Token Slip</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleString()}</p>
              </div>

              {/* Big Token Number */}
              <div className="text-center py-4 bg-slate-100 rounded-2xl border border-slate-300">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest block">TOKEN NUMBER</span>
                <p className="text-5xl font-black text-slate-950 tracking-tight my-1">{generatedSlip.appointment.tokenNumber}</p>
                <p className="text-xs text-emerald-700 font-bold">Family PIN: {generatedSlip.appointment.familyAccessPin}</p>
              </div>

              {/* Patient & Room Details */}
              <div className="space-y-2 text-xs font-semibold text-slate-800 border-b-2 border-dashed border-slate-300 pb-4">
                <p><strong>Patient:</strong> {generatedSlip.appointment.patientName} ({generatedSlip.appointment.patientAge} Yrs)</p>
                <p><strong>Department:</strong> {selectedDept?.name}</p>
                <p><strong>Consultation Room:</strong> Cabin 1 - Ground Floor</p>
                <p><strong>Recommended Arrival:</strong> {generatedSlip.appointment.recommendedArrivalTime}</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <img src={generatedSlip.qrUrl} alt="Thermal QR" className="w-36 h-36 object-contain" />
                <p className="text-[10px] text-slate-500 mt-1">Scan for Live Queue Mobile Tracking</p>
              </div>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Thermal Ticket</span>
              </button>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 text-slate-400">
              <Printer className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="font-bold text-white text-base">Printed Token Ticket Preview</h4>
              <p className="text-xs max-w-xs mx-auto">
                Fill the reception walk-in form on the left to generate and print a physical QR ticket slip for elderly patients.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
