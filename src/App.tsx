/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BookingModal } from './components/BookingModal';
import { LiveQueueTracker } from './components/LiveQueueTracker';
import { HospitalDisplayBoard } from './components/HospitalDisplayBoard';
import { ElderlyHelperMode } from './components/ElderlyHelperMode';
import { FamilyTrackingPortal } from './components/FamilyTrackingPortal';
import { AdminDoctorPortal } from './components/AdminDoctorPortal';
import { NotificationDrawer } from './components/NotificationDrawer';

import { 
  INITIAL_HOSPITALS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_NOTIFICATIONS 
} from './data/initialData';

import { 
  Hospital, 
  Department, 
  Doctor, 
  Appointment, 
  NotificationItem, 
  UserRole 
} from './types';

import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  speakAnnouncement, 
  generateQRCodeDataUrl 
} from './utils/helpers';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  
  const [hospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(INITIAL_HOSPITALS[0].id);
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);

  // Persistent Appointments & Notifications
  const [appointments, setAppointments] = useState<Appointment[]>(() => 
    loadFromLocalStorage('appointments', INITIAL_APPOINTMENTS)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => 
    loadFromLocalStorage('notifications', INITIAL_NOTIFICATIONS)
  );

  // UI state
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);

  // Save state updates to LocalStorage
  useEffect(() => {
    saveToLocalStorage('appointments', appointments);
  }, [appointments]);

  useEffect(() => {
    saveToLocalStorage('notifications', notifications);
  }, [notifications]);

  // Helper to add notification
  const addNotification = (title: string, message: string, tokenNumber: string = '', type: NotificationItem['type'] = 'confirmation') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      appointmentId: '',
      tokenNumber,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Handle new appointment booking
  const handleBookingComplete = (newAppt: Appointment) => {
    setAppointments(prev => [newAppt, ...prev]);
    addNotification(
      'Appointment Confirmed',
      `Your token ${newAppt.tokenNumber} is confirmed for ${newAppt.preferredTimeSlot}.`,
      newAppt.tokenNumber,
      'token_gen'
    );
  };

  // Handle appointment rescheduling
  const handleRescheduleAppointment = (id: string, newSlot: string, newDate: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addNotification(
          'Appointment Rescheduled',
          `Token ${a.tokenNumber} has been rescheduled to ${newDate} at ${newSlot}.`,
          a.tokenNumber,
          'rescheduled'
        );
        return {
          ...a,
          preferredTimeSlot: newSlot,
          preferredDate: newDate,
          status: 'rescheduled',
        };
      }
      return a;
    }));
  };

  // Handle appointment cancellation
  const handleCancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addNotification(
          'Appointment Cancelled',
          `Token ${a.tokenNumber} was cancelled.`,
          a.tokenNumber,
          'rescheduled'
        );
        return { ...a, status: 'cancelled' };
      }
      return a;
    }));
  };

  // Admin Queue Action: Call Next Token
  const handleCallNextToken = (departmentId: string) => {
    setAppointments(prev => {
      const deptAppts = prev.filter(a => a.departmentId === departmentId);
      const currentlyServing = deptAppts.find(a => a.status === 'serving');
      const nextInQueue = deptAppts.find(a => a.status === 'in_queue');

      return prev.map(a => {
        if (currentlyServing && a.id === currentlyServing.id) {
          return { ...a, status: 'completed' };
        }
        if (nextInQueue && a.id === nextInQueue.id) {
          addNotification(
            'Your Turn is Next!',
            `Token ${a.tokenNumber} is now being called into the consultation room.`,
            a.tokenNumber,
            'serving'
          );
          if (isAudioEnabled) {
            speakAnnouncement(`Token ${a.tokenNumber}, please enter the consultation room`, 'en-US');
          }
          return { ...a, status: 'serving' };
        }
        return a;
      });
    });
  };

  // Admin Queue Action: Complete Consultation
  const handleCompleteConsultation = (appointmentId: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        addNotification(
          'Consultation Completed',
          `Token ${a.tokenNumber} consultation completed. Pharmacy prescription ready.`,
          a.tokenNumber,
          'completed'
        );
        return { ...a, status: 'completed' };
      }
      return a;
    }));

    // Update doctor consultation count
    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      setDoctors(prev => prev.map(doc => {
        if (doc.id === appt.doctorId) {
          return { ...doc, consultationsDoneToday: doc.consultationsDoneToday + 1 };
        }
        return doc;
      }));
    }
  };

  // Admin Action: Update Doctor Status
  const handleUpdateDoctorStatus = (doctorId: string, status: Doctor['status'], reason?: string) => {
    setDoctors(prev => prev.map(d => {
      if (d.id === doctorId) {
        return { ...d, status, statusReason: reason || `Doctor is currently ${status}` };
      }
      return d;
    }));
  };

  // Admin Action: Insert Emergency Token
  const handleInsertEmergencyToken = async (departmentId: string, patientName: string) => {
    const dept = departments.find(d => d.id === departmentId) || departments[0];
    const doc = doctors.find(d => d.departmentId === departmentId) || doctors[0];
    const tokenNum = `${dept.code}-EMG-${Math.floor(Math.random() * 89) + 10}`;

    const qrUrl = await generateQRCodeDataUrl(`EMERGENCY:${tokenNum}|PATIENT:${patientName}`);

    const emergencyAppt: Appointment = {
      id: `app-emg-${Date.now()}`,
      tokenNumber: tokenNum,
      queueSequence: 1,
      hospitalId: selectedHospitalId,
      departmentId,
      doctorId: doc.id,
      patientName,
      patientAge: 40,
      patientGender: 'Male',
      patientPhone: '+91 10800 00108',
      bookingType: 'emergency',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTimeSlot: 'NOW (Immediate)',
      status: 'in_queue',
      createdAt: new Date().toISOString(),
      recommendedArrivalTime: 'Immediate',
      estimatedConsultTime: 'Immediate',
      estimatedWaitMins: 0,
      qrCodeUrl: qrUrl,
      familyAccessPin: '9999',
      isElderlyAssisted: false,
      notes: '🚨 Front of queue emergency triage case',
      vitalPriority: 'Emergency',
    };

    setAppointments(prev => [emergencyAppt, ...prev]);
    addNotification(
      '🚨 Emergency Case Inserted',
      `Emergency token ${tokenNum} inserted at front of queue for ${patientName}.`,
      tokenNum,
      'reminder_10'
    );
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors ${
      isHighContrast ? 'bg-black text-yellow-300' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        hospitals={hospitals}
        selectedHospitalId={selectedHospitalId}
        onHospitalChange={setSelectedHospitalId}
        unreadNotifCount={unreadNotifCount}
        onToggleNotifDrawer={() => setIsNotifDrawerOpen(!isNotifDrawerOpen)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
        onOpenBooking={() => setIsBookingOpen(true)}
      />

      {/* Main Role Content Views */}
      <main className="pb-16">
        {currentRole === 'patient' && (
          <LiveQueueTracker
            appointments={appointments}
            doctors={doctors}
            departments={departments}
            onRescheduleAppointment={handleRescheduleAppointment}
            onCancelAppointment={handleCancelAppointment}
            onOpenBooking={() => setIsBookingOpen(true)}
          />
        )}

        {currentRole === 'display_board' && (
          <HospitalDisplayBoard
            appointments={appointments}
            doctors={doctors}
            departments={departments}
            isAudioEnabled={isAudioEnabled}
          />
        )}

        {currentRole === 'elderly' && (
          <ElderlyHelperMode
            hospitals={hospitals}
            departments={departments}
            doctors={doctors}
            selectedHospitalId={selectedHospitalId}
            onBookingComplete={handleBookingComplete}
            isHighContrast={isHighContrast}
          />
        )}

        {currentRole === 'family' && (
          <FamilyTrackingPortal
            appointments={appointments}
            doctors={doctors}
            departments={departments}
          />
        )}

        {currentRole === 'admin_doctor' && (
          <AdminDoctorPortal
            appointments={appointments}
            doctors={doctors}
            departments={departments}
            onCallNextToken={handleCallNextToken}
            onCompleteConsultation={handleCompleteConsultation}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            onInsertEmergencyToken={handleInsertEmergencyToken}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        hospitals={hospitals}
        departments={departments}
        doctors={doctors}
        selectedHospitalId={selectedHospitalId}
        onBookingComplete={handleBookingComplete}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

    </div>
  );
}
