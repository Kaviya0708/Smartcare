import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  BarChart3, 
  Search, 
  Filter, 
  Megaphone,
  UserCheck,
  Building2,
  Stethoscope,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Appointment, Doctor, Department, QueueAnalytics } from '../types';
import { speakAnnouncement } from '../utils/helpers';

interface AdminDoctorPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  onCallNextToken: (departmentId: string) => void;
  onCompleteConsultation: (appointmentId: string) => void;
  onUpdateDoctorStatus: (doctorId: string, status: Doctor['status'], reason?: string) => void;
  onInsertEmergencyToken: (departmentId: string, patientName: string) => void;
}

export const AdminDoctorPortal: React.FC<AdminDoctorPortalProps> = ({
  appointments,
  doctors,
  departments,
  onCallNextToken,
  onCompleteConsultation,
  onUpdateDoctorStatus,
  onInsertEmergencyToken,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dept-card');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emergencyPatientName, setEmergencyPatientName] = useState<string>('');

  const currentDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const activeDoctor = doctors.find(d => d.departmentId === selectedDeptId) || doctors[0];

  const deptAppointments = appointments.filter(a => a.departmentId === selectedDeptId);
  const currentlyServing = deptAppointments.find(a => a.status === 'serving');
  const waitingQueue = deptAppointments.filter(a => a.status === 'in_queue');

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live analytics
  const totalServedToday = appointments.filter(a => a.status === 'completed').length;
  const totalWaitingNow = appointments.filter(a => a.status === 'in_queue').length;
  const avgWaitMins = Math.round(
    appointments.reduce((acc, curr) => acc + curr.estimatedWaitMins, 0) / (appointments.length || 1)
  );

  const handleTriggerEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyPatientName) return;
    onInsertEmergencyToken(selectedDeptId, emergencyPatientName);
    setEmergencyPatientName('');
    alert(`🚨 Emergency Token inserted at front of queue for ${emergencyPatientName}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Portal Header & Analytics Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Doctor & OPD Admin Command Portal</h2>
              <p className="text-xs text-slate-400">Live queue management, doctor availability controls, emergency overrides & queue analytics.</p>
            </div>
          </div>

          {/* Department Selector */}
          <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <Building2 className="w-4 h-4 text-cyan-400 ml-2" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent text-slate-200 font-bold text-xs py-1 px-2 focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Analytics Top Metric Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tokens Today</span>
            <p className="text-2xl font-black text-white mt-1">{appointments.length}</p>
            <p className="text-[11px] text-cyan-400 font-medium mt-0.5">Online + Reception Walk-in</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Completed Consultations</span>
            <p className="text-2xl font-black text-emerald-300 mt-1">{totalServedToday}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Patients Discharged</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Currently Waiting</span>
            <p className="text-2xl font-black text-amber-300 mt-1">{totalWaitingNow}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">In Lounge Queue</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Average Wait Time</span>
            <p className="text-2xl font-black text-cyan-300 mt-1">~{avgWaitMins} Mins</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">AI Slot Optimized</p>
          </div>

        </div>
      </div>

      {/* Main Department Doctor Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Cabin & Queue Controls (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Doctor Cabin Status & Controls */}
          <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <img src={activeDoctor?.photo} alt={activeDoctor?.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/50" />
                <div>
                  <h3 className="font-extrabold text-white text-base">{activeDoctor?.name}</h3>
                  <p className="text-xs text-slate-400">{currentDept?.name} • <strong className="text-emerald-400">{activeDoctor?.roomNumber}</strong></p>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-bold">Doctor Status:</span>
                <select
                  value={activeDoctor?.status}
                  onChange={(e) => onUpdateDoctorStatus(activeDoctor.id, e.target.value as any)}
                  className={`text-xs font-bold rounded-xl px-3 py-1.5 border focus:outline-none cursor-pointer ${
                    activeDoctor?.status === 'available' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    activeDoctor?.status === 'busy' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    activeDoctor?.status === 'on_break' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                    'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  <option value="available" className="bg-slate-900">AVAILABLE</option>
                  <option value="busy" className="bg-slate-900">BUSY WITH PATIENT</option>
                  <option value="on_break" className="bg-slate-900">ON BREAK</option>
                  <option value="emergency" className="bg-slate-900">EMERGENCY PROCEDURE</option>
                </select>
              </div>
            </div>

            {/* Currently Serving Box & Call Next Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Currently Serving Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">NOW IN CABIN</span>
                  {currentlyServing && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      PIN: {currentlyServing.familyAccessPin}
                    </span>
                  )}
                </div>

                {currentlyServing ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-cyan-300 font-mono tracking-tight">{currentlyServing.tokenNumber}</p>
                    <p className="text-sm font-bold text-white">{currentlyServing.patientName} ({currentlyServing.patientAge} yrs)</p>
                    <p className="text-xs text-slate-400">{currentlyServing.notes || 'Routine consultation'}</p>

                    <button
                      onClick={() => onCompleteConsultation(currentlyServing.id)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Consultation & Discharge</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-semibold">No patient currently inside cabin.</p>
                    <p className="text-[11px] text-slate-600">Click "Call Next Token" to advance queue.</p>
                  </div>
                )}
              </div>

              {/* Call Next Button & Queue Ahead Count */}
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Patients Waiting in Lounge:</span>
                    <strong className="text-amber-400 text-sm font-bold">{waitingQueue.length} Patients</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Token in Line:</span>
                    <strong className="text-white font-mono">{waitingQueue[0]?.tokenNumber || 'None'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onCallNextToken(selectedDeptId);
                    if (waitingQueue[0]) {
                      speakAnnouncement(`Token ${waitingQueue[0].tokenNumber}, please enter Cabin ${activeDoctor?.roomNumber || '1'}`, 'en-US');
                    }
                  }}
                  disabled={waitingQueue.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Megaphone className="w-5 h-5" />
                  <span>Call Next Token ({waitingQueue[0]?.tokenNumber || 'Queue Empty'})</span>
                </button>
              </div>

            </div>

          </div>

          {/* All Appointments Data Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h4 className="font-extrabold text-base text-white">All OPD Appointments ({filteredAppointments.length})</h4>

              {/* Search & Status Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name or token..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="in_queue">In Queue</option>
                  <option value="serving">Serving</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Token</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Time Slot</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-cyan-400">{app.tokenNumber}</td>
                      <td className="py-3 px-2 font-semibold text-white">
                        {app.patientName} <span className="text-slate-400 text-[10px]">({app.patientAge}y)</span>
                        {app.vitalPriority === 'Emergency' && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[9px] font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded">
                            EMERGENCY
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">{app.preferredTimeSlot}</td>
                      <td className="py-3 px-2 capitalize text-slate-400">{app.bookingType}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'serving' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          app.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          app.status === 'cancelled' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right space-x-1">
                        {app.status === 'in_queue' && (
                          <button
                            onClick={() => onCompleteConsultation(app.id)}
                            className="px-2 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold rounded-lg border border-emerald-800"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Right Column: Emergency Injection Override */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Queue Override</span>
            </div>

            <p className="text-xs text-slate-400">
              Insert a high-priority trauma/vital emergency token directly to the front of the live queue.
            </p>

            <form onSubmit={handleTriggerEmergency} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Trauma Case #102"
                  value={emergencyPatientName}
                  onChange={(e) => setEmergencyPatientName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Insert Front Emergency Token</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
