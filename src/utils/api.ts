import {
  MedicationInteractionReport,
  ElderlyProfile,
  Medication,
  ScheduledDose,
  AdherenceRecord,
  DoctorAppointment,
} from '../types';

export interface CarePlatformState {
  profile: ElderlyProfile;
  medications: Medication[];
  todayDoses: ScheduledDose[];
  adherenceHistory: AdherenceRecord[];
  appointments: DoctorAppointment[];
  lastUpdated?: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  cloudRunReady: boolean;
  environment: string;
  port: number;
  features: {
    geminiAiAssistant: boolean;
    emailReminders: boolean;
    wcagAaaAccessibility: boolean;
    dualRolePasscodeAuth: boolean;
  };
}

/**
 * Checks backend health and Cloud Run connectivity
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Calls Gemini AI to generate simple comforting elderly guidance for a medication
 */
export async function getSimpleGuidance(
  medicationName: string,
  dosage: string,
  instructions: string,
  purpose: string
): Promise<{ simpleGuidance: string; generatedWith: string }> {
  const response = await fetch('/api/ai/guidance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicationName, dosage, instructions, purpose }),
  });
  if (!response.ok) {
    throw new Error('Failed to retrieve AI guidance');
  }
  return response.json();
}

/**
 * Calls Gemini AI to analyze drug and food interactions
 */
export async function checkMedicationInteractions(
  medications: Array<{ name: string; dosage: string; instructions: string }>
): Promise<MedicationInteractionReport> {
  const response = await fetch('/api/ai/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medications }),
  });
  if (!response.ok) {
    throw new Error('Failed to analyze interactions');
  }
  return response.json();
}

/**
 * Triggers a live reminder email with 1-click adherence link (uses Ethereal fallback for demo)
 */
export async function sendDoseEmailReminder(params: {
  recipient?: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  simpleGuidance: string;
  medId: string;
  doseId: string;
}) {
  const response = await fetch('/api/reminders/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to dispatch reminder email');
  }
  return response.json();
}

/**
 * Dispatches a missed dose escalation email to caretaker
 */
export async function sendMissedDoseEscalation(params: {
  recipient?: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  minutesOverdue?: number;
}) {
  const response = await fetch('/api/reminders/escalate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to dispatch escalation email');
  }
  return response.json();
}

/**
 * Dispatches an appointment reminder email with preparation checklist
 */
export async function sendAppointmentEmailReminder(params: {
  recipient?: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  date: string;
  time: string;
  location: string;
  reason: string;
  preparationList: string[];
}) {
  const response = await fetch('/api/reminders/appointment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to dispatch appointment reminder email');
  }
  return response.json();
}

/**
 * Simulates triggering the 1-click adherence link from an email
 */
export async function verifyAdherenceViaApi(medId: string, doseId: string, token: string): Promise<boolean> {
  const response = await fetch(
    `/api/reminders/verify-adherence?medId=${encodeURIComponent(medId)}&doseId=${encodeURIComponent(doseId)}&token=${encodeURIComponent(token)}`
  );
  return response.ok;
}

/**
 * =========================================================================
 * BACKEND PERSISTENCE & REST CRUD API HELPERS (/api/care/*)
 * =========================================================================
 */

/**
 * Fetches the entire care state from the backend server
 */
export async function fetchCareState(): Promise<CarePlatformState> {
  const response = await fetch('/api/care/state');
  if (!response.ok) {
    throw new Error(`Failed to fetch care state: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
}

/**
 * Persists a new medication to the server
 */
export async function addMedicationApi(med: Partial<Medication>): Promise<Medication> {
  const response = await fetch('/api/care/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(med),
  });
  if (!response.ok) {
    throw new Error(`Failed to add medication: ${response.status}`);
  }
  const result = await response.json();
  return result.medication;
}

/**
 * Updates an existing medication on the server
 */
export async function updateMedicationApi(id: string, updates: Partial<Medication>): Promise<Medication> {
  const response = await fetch(`/api/care/medications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update medication: ${response.status}`);
  }
  const result = await response.json();
  return result.medication;
}

/**
 * Deletes a medication from the server
 */
export async function deleteMedicationApi(id: string): Promise<boolean> {
  const response = await fetch(`/api/care/medications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Records adherence on the server
 */
export async function recordAdherenceApi(
  targetId: string,
  method: string = 'caretaker_dashboard'
): Promise<AdherenceRecord> {
  const response = await fetch('/api/care/adherence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doseId: targetId, method }),
  });
  if (!response.ok) {
    throw new Error(`Failed to record adherence: ${response.status}`);
  }
  const result = await response.json();
  return result.adherenceRecord;
}

/**
 * Adds a new medical appointment on the server
 */
export async function addAppointmentApi(appt: Partial<DoctorAppointment>): Promise<DoctorAppointment> {
  const response = await fetch('/api/care/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appt),
  });
  if (!response.ok) {
    throw new Error(`Failed to add appointment: ${response.status}`);
  }
  const result = await response.json();
  return result.appointment;
}

/**
 * Updates preparation checklist items for an appointment
 */
export async function updateAppointmentChecklistApi(
  id: string,
  preparationList: string[]
): Promise<DoctorAppointment> {
  const response = await fetch(`/api/care/appointments/${encodeURIComponent(id)}/checklist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preparationList }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update appointment checklist: ${response.status}`);
  }
  const result = await response.json();
  return result.appointment;
}

/**
 * Deletes an appointment from the server
 */
export async function deleteAppointmentApi(id: string): Promise<boolean> {
  const response = await fetch(`/api/care/appointments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Resets server data store to initial demo state
 */
export async function resetCareStateApi(): Promise<CarePlatformState> {
  const response = await fetch('/api/care/reset', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset backend state: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
}

