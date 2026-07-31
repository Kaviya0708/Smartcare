export type DoctorStatus = 'available' | 'busy' | 'on_break' | 'emergency';

export type AppointmentStatus = 'confirmed' | 'in_queue' | 'serving' | 'completed' | 'cancelled' | 'rescheduled';

export type BookingType = 'online' | 'reception_walkin' | 'emergency';

export interface Hospital {
  id: string;
  name: string;
  location: string;
  phone: string;
  emergencyNumber: string;
  image: string;
  totalDepartments: number;
  activeDoctors: number;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string; // e.g. 'CARD', 'NEUR', 'ORTH'
  floor: string;
  avgConsultationMins: number;
  iconName: string;
  description: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  qualification: string;
  experienceYears: number;
  roomNumber: string;
  photo: string;
  status: DoctorStatus;
  statusReason?: string;
  avgConsultTimeMins: number;
  consultationsDoneToday: number;
  rating: number;
  availableDays: string[];
  slots: string[];
}

export interface Appointment {
  id: string;
  tokenNumber: string; // e.g. CARD-104
  queueSequence: number; // 1, 2, 3...
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  bookingType: BookingType;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // e.g. "10:30 AM"
  status: AppointmentStatus;
  createdAt: string; // ISO
  recommendedArrivalTime: string; // e.g. "10:15 AM"
  estimatedConsultTime: string; // e.g. "10:30 AM"
  estimatedWaitMins: number;
  qrCodeUrl?: string;
  familyAccessPin: string; // e.g. "4920"
  isElderlyAssisted: boolean;
  notes?: string;
  vitalPriority?: 'Normal' | 'High' | 'Emergency';
}

export interface NotificationItem {
  id: string;
  appointmentId: string;
  tokenNumber: string;
  title: string;
  message: string;
  type: 'confirmation' | 'token_gen' | 'reminder_30' | 'reminder_10' | 'turn_next' | 'serving' | 'completed' | 'rescheduled';
  timestamp: string;
  read: boolean;
}

export interface QueueAnalytics {
  totalAppointmentsToday: number;
  patientsServed: number;
  currentlyWaiting: number;
  avgWaitTimeMins: number;
  emergencyCasesToday: number;
  doctorEfficiencyPct: number;
}
