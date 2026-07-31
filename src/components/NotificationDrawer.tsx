import React from 'react';
import { X, Bell, CheckCircle2, Clock, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Smart Notifications</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-semibold">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
                  !n.read 
                    ? 'bg-slate-800/90 border-cyan-500/40 shadow-sm' 
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed">{n.message}</p>
                {n.tokenNumber && (
                  <span className="inline-block mt-1 font-mono text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    Token: {n.tokenNumber}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
