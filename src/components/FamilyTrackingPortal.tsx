import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Activity, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  MapPin,
  Building2,
  Sparkles
} from 'lucide-react';
import { Appointment, Doctor, Department } from '../types';

interface FamilyTrackingPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
}

export const FamilyTrackingPortal: React.FC<FamilyTrackingPortalProps> = ({
  appointments,
  doctors,
  departments,
}) => {
  const [searchToken, setSearchToken] = useState<string>('CARD-104');
  const [searchPin, setSearchPin] = useState<string>('4821');

  const [searchedAppointment, setSearchedAppointment] = useState<Appointment | null>(
    appointments.find(a => a.tokenNumber === 'CARD-104') || appointments[0] || null
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const found = appointments.find(
      a => a.tokenNumber.toUpperCase() === searchToken.trim().toUpperCase()
    );

    if (found) {
      if (searchPin && found.familyAccessPin !== searchPin.trim()) {
        setErrorMessage('Incorrect Family Access PIN. Please verify ticket PIN.');
        return;
      }
      setSearchedAppointment(found);
    } else {
      setErrorMessage(`Token ${searchToken} not found in live queue database.`);
    }
  };

  const doctor = doctors.find(d => d.id === searchedAppointment?.doctorId) || doctors[0];
  const department = departments.find(d => d.id === searchedAppointment?.departmentId) || departments[0];

  const steps = [
    { title: 'Appointment Confirmed', desc: 'Digital Token Generated', done: true },
    { title: 'Arrived at OPD', desc: 'Checked in at Lounge', done: searchedAppointment?.status !== 'confirmed' },
    { title: 'In Live Queue', desc: 'Waiting in Lounge Area', done: searchedAppointment?.status === 'in_queue' || searchedAppointment?.status === 'serving' || searchedAppointment?.status === 'completed' },
    { title: 'In Consultation Room', desc: `In ${doctor?.roomNumber}`, done: searchedAppointment?.status === 'serving' || searchedAppointment?.status === 'completed' },
    { title: 'Completed & Prescription', desc: 'Discharge & Pharmacy Ready', done: searchedAppointment?.status === 'completed' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Family Patient Tracking Portal</h2>
            <p className="text-xs text-slate-400">Track your family member's live token, consultation status & discharge progress remotely.</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Token (e.g. CARD-104)"
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            required
            className="bg-slate-800 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 w-36 uppercase focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="PIN (e.g. 4821)"
            value={searchPin}
            onChange={(e) => setSearchPin(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 w-28 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Track Live Status</span>
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Tracked Appointment View */}
      {searchedAppointment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Live Status & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Banner */}
            <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  TOKEN: {searchedAppointment.tokenNumber}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  searchedAppointment.status === 'serving' ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse' :
                  searchedAppointment.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  {searchedAppointment.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Patient Name</p>
                  <p className="font-bold text-white text-base">{searchedAppointment.patientName}</p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Department</p>
                  <p className="font-bold text-slate-200 text-sm">{department?.name}</p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Doctor Assigned</p>
                  <p className="font-bold text-cyan-300 text-sm">{doctor?.name}</p>
                </div>
              </div>

              {/* Consultation Progress Timeline */}
              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6">Patient Consultation Journey</h4>
                
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                  {steps.map((st, idx) => (
                    <div key={idx} className="relative flex items-start space-x-3">
                      <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                        st.done ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-600'
                      }`}>
                        {st.done && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div>
                        <h5 className={`text-sm font-bold ${st.done ? 'text-white' : 'text-slate-500'}`}>{st.title}</h5>
                        <p className="text-xs text-slate-400">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Doctor & Room Info */}
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Doctor & Room Location</h4>
              
              <div className="flex items-center space-x-4">
                <img src={doctor?.photo} alt={doctor?.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40" />
                <div>
                  <h5 className="font-bold text-white text-sm">{doctor?.name}</h5>
                  <p className="text-xs text-slate-400">{doctor?.qualification}</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1">Location: {doctor?.roomNumber}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recommended Arrival:</span>
                  <span className="font-bold text-white">{searchedAppointment.recommendedArrivalTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Est. Wait Time:</span>
                  <span className="font-bold text-emerald-400">~{searchedAppointment.estimatedWaitMins} Mins</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
