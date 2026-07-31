import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Building2, 
  Clock, 
  Sparkles, 
  Activity, 
  Maximize2, 
  UserCheck, 
  Megaphone,
  Stethoscope
} from 'lucide-react';
import { Appointment, Doctor, Department } from '../types';
import { speakAnnouncement } from '../utils/helpers';

interface HospitalDisplayBoardProps {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  isAudioEnabled: boolean;
}

export const HospitalDisplayBoard: React.FC<HospitalDisplayBoardProps> = ({
  appointments,
  doctors,
  departments,
  isAudioEnabled,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [activeSpeechLang, setActiveSpeechLang] = useState<'ta-IN' | 'en-US'>('en-US');
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const filteredDepts = selectedDeptId === 'all' 
    ? departments 
    : departments.filter(d => d.id === selectedDeptId);

  // Trigger Voice Announcement for current token being served
  const handleTriggerVoice = (tokenNumber: string, docName: string, roomNum: string, deptName: string) => {
    fetch('/api/ai/speech-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenNumber,
        doctorName: docName,
        roomNumber: roomNum,
        departmentName: deptName
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.script) {
          const scriptText = activeSpeechLang === 'ta-IN' 
            ? data.script.tamilAnnouncement 
            : data.script.englishAnnouncement;
          speakAnnouncement(scriptText, activeSpeechLang);
          setLastAnnouncedToken(tokenNumber);
        } else {
          fallbackSpeech(tokenNumber, roomNum);
        }
      })
      .catch(() => {
        fallbackSpeech(tokenNumber, roomNum);
      });
  };

  const fallbackSpeech = (tokenNum: string, roomNum: string) => {
    const text = activeSpeechLang === 'ta-IN'
      ? `டோக்கன் எண் ${tokenNum}, அறை எண் ${roomNum} க்கு வரவும்.`
      : `Token ${tokenNum}, please proceed to ${roomNum}.`;
    speakAnnouncement(text, activeSpeechLang);
    setLastAnnouncedToken(tokenNum);
  };

  return (
    <div className={`transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
      
      {/* Board Header & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Hospital Waiting Lounge Display Board</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                LIVE BROADCAST
              </span>
            </div>
            <p className="text-xs text-slate-400">High Visibility Queue Screen for OPD Lounge & Waiting Area</p>
          </div>
        </div>

        {/* Filter Controls & Audio Settings */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Department Filter */}
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All OPD Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          {/* Voice Announcement Language Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveSpeechLang('en-US')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeSpeechLang === 'en-US' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              English 🗣️
            </button>
            <button
              onClick={() => setActiveSpeechLang('ta-IN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeSpeechLang === 'ta-IN' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ் 🗣️
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Toggle TV Fullscreen Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Grid of Department Live Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.map((dept) => {
          const doc = doctors.find(d => d.departmentId === dept.id) || doctors[0];
          const deptAppts = appointments.filter(a => a.departmentId === dept.id && (a.status === 'serving' || a.status === 'in_queue'));
          const serving = deptAppts.find(a => a.status === 'serving');
          const nextInLine = deptAppts.find(a => a.status === 'in_queue');

          const currentToken = serving?.tokenNumber || 'CARD-102';
          const nextToken = nextInLine?.tokenNumber || 'CARD-103';

          return (
            <div 
              key={dept.id} 
              className="bg-slate-900 border-2 border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-6 transition-all relative overflow-hidden"
            >
              
              {/* Department Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">{dept.code}</span>
                  <h3 className="font-extrabold text-lg text-white">{dept.name}</h3>
                  <p className="text-xs text-slate-400">{doc?.name} • <strong className="text-emerald-400">{doc?.roomNumber}</strong></p>
                </div>

                <button
                  onClick={() => handleTriggerVoice(currentToken, doc.name, doc.roomNumber, dept.name)}
                  className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all flex items-center justify-center group"
                  title="Announce Current Token Voice"
                >
                  <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Display Board Main Numbers */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* NOW SERVING TOKEN */}
                <div className="bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-950 border-2 border-cyan-500/80 rounded-2xl p-4 text-center shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase tracking-widest py-0.5">
                    Now Serving
                  </div>
                  <p className="text-4xl font-black text-cyan-300 tracking-tight mt-3 mb-1 font-mono drop-shadow-md">
                    {currentToken}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">{doc?.roomNumber}</p>
                </div>

                {/* NEXT TOKEN */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Next Token</span>
                  <p className="text-3xl font-black text-slate-200 tracking-tight mt-3 mb-1 font-mono">
                    {nextToken}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">Please be ready</p>
                </div>

              </div>

              {/* Status Footer */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Est. Wait: <strong className="text-white">~{doc.avgConsultTimeMins} mins</strong></span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  doc.status === 'available' ? 'bg-emerald-950 text-emerald-400' :
                  doc.status === 'busy' ? 'bg-amber-950 text-amber-400' :
                  'bg-rose-950 text-rose-400'
                }`}>
                  {doc.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Ticker Tape Announcement */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-300 overflow-hidden shadow-xl">
        <span className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider shrink-0">
          ANNOUNCEMENT
        </span>
        <div className="animate-marquee whitespace-nowrap overflow-hidden">
          <span>
            📢 Patients are requested to arrive 15 minutes before their recommended arrival time. Digital Token holders can track live queue status on their mobile phones using their QR code.
          </span>
        </div>
      </div>

    </div>
  );
};
