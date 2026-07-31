import React from 'react';
import { 
  Building2, 
  UserCheck, 
  Activity, 
  Tv, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  Bell, 
  Sun, 
  Moon, 
  Eye, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { Hospital, UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  hospitals: Hospital[];
  selectedHospitalId: string;
  onHospitalChange: (id: string) => void;
  unreadNotifCount: number;
  onToggleNotifDrawer: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  hospitals,
  selectedHospitalId,
  onHospitalChange,
  unreadNotifCount,
  onToggleNotifDrawer,
  isHighContrast,
  onToggleHighContrast,
  isAudioEnabled,
  onToggleAudio,
  onOpenBooking,
}) => {
  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  const roles: { id: UserRole; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'patient', label: 'Patient Portal', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'display_board', label: 'Hospital TV Board', icon: <Tv className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'elderly', label: 'Elderly Helper', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'family', label: 'Family Tracker', icon: <Users className="w-4 h-4" /> },
    { id: 'admin_doctor', label: 'Doctor / Admin Portal', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <header className={`sticky top-0 z-40 border-b shadow-sm transition-colors ${
      isHighContrast ? 'bg-black text-yellow-300 border-yellow-500' : 'bg-slate-900 text-slate-100 border-slate-800'
    }`}>
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  SmartCare <span className="text-cyan-400 font-medium text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800">AI Token System</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Real-Time Queue, AI Arrival & Smart Tokens</p>
            </div>
          </div>

          {/* Hospital Selector Dropdown */}
          <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/80 text-xs">
            <Building2 className="w-4 h-4 text-cyan-400 ml-2 mr-1" />
            <select
              value={selectedHospitalId}
              onChange={(e) => onHospitalChange(e.target.value)}
              className="bg-transparent text-slate-200 font-medium py-1 px-2 focus:outline-none cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-slate-200">
                  {h.name} ({h.location.split(',')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Book Appointment Button */}
            <button
              onClick={onOpenBooking}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-cyan-200" />
              <span>Book Appointment</span>
            </button>

            {/* High Contrast Toggle */}
            <button
              onClick={onToggleHighContrast}
              title="Toggle Large / High Contrast Elderly Mode"
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                isHighContrast 
                  ? 'bg-yellow-400 text-black border-yellow-300 font-bold' 
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Eye className="w-4 h-4 text-yellow-400" />
              <span className="hidden lg:inline">{isHighContrast ? 'Standard Mode' : 'High Contrast'}</span>
            </button>

            {/* Voice Sound Toggle */}
            <button
              onClick={onToggleAudio}
              title="Toggle Audio Voice Announcements"
              className={`p-2 rounded-lg border text-xs flex items-center transition-all ${
                isAudioEnabled 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isAudioEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            </button>

            {/* Notification Drawer Button */}
            <button
              onClick={onToggleNotifDrawer}
              className="relative p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
              title="Smart Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Role Navigation Tab Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 py-1.5">
          {roles.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
                {r.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {r.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
