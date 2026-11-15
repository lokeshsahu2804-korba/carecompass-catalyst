export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'snoozed';

export type UserRole = 'elderly' | 'caretaker' | 'unauthenticated';

export interface ElderlyProfile {
  id: string;
  name: string;
  preferredName: string;
  age: number;
  pin: string; // 4-digit PIN for simple elderly access
  avatarUrl?: string;
  emergencyPhone: string;
  caretakerName: string;
  caretakerPhone: string;
  caretakerEmail: string;
  caretakerPasscode: string; // Caretaker authentication passcode
  bloodType: string;
  allergies: string[];
  primaryCondition: string;
  doctorName: string;
  doctorPhone: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler';
  frequency: string;
  timeSlots: TimeSlot[];
  scheduledTimes: string[]; // e.g. ["08:00 AM"]
  instructions: string;
  simpleGuidance: string; // AI generated comforting 1-sentence elderly advice
  purpose: string;
  pillColor: string;
  pillShape: string;
  pillCount: number;
  refillAt: number;
  isActive: boolean;
  warnings?: string[];
}

export interface ScheduledDose {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  timeSlot: TimeSlot;
  scheduledTime: string; // formatted e.g. "08:00 AM"
  status: DoseStatus;
  takenAt?: string;
  pillColor: string;
  pillShape: string;
  instructions: string;
  simpleGuidance: string;
  takenMethod?: 'elderly_pin_pad' | 'email_1click' | 'caretaker_override';
}

export interface AdherenceRecord {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  status: 'taken' | 'missed';
  loggedAt: string;
  method: 'elderly_pin_pad' | 'email_1click' | 'caretaker_override';
}

export interface DoctorAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  location: string;
  phone: string;
  reason: string;
  preparationList: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface EmailPreviewItem {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  previewUrl: string;
  type: 'reminder' | 'missed_escalation' | 'appointment';
  medicationName?: string;
  verificationToken?: string;
}

export interface MedicationInteractionReport {
  overallRisk: 'low' | 'moderate' | 'high';
  summary: string;
  interactions: Array<{
    severity: 'minor' | 'moderate' | 'severe';
    drugsInvolved: string[];
    description: string;
    guidance: string;
  }>;
  foodWarnings: string[];
  timingAdvice: string[];
  timestamp: string;
}

