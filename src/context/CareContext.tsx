import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ElderlyProfile,
  Medication,
  ScheduledDose,
  AdherenceRecord,
  DoctorAppointment,
  EmailPreviewItem,
  UserRole,
} from '../types';
import {
  DEMO_ELDERLY_PROFILE,
  DEMO_MEDICATIONS,
  DEMO_SCHEDULED_DOSES,
  DEMO_ADHERENCE_HISTORY,
  DEMO_APPOINTMENTS,
} from '../utils/demoData';
import {
  fetchCareState,
  addMedicationApi,
  updateMedicationApi,
  deleteMedicationApi,
  recordAdherenceApi,
  addAppointmentApi,
  deleteAppointmentApi,
  resetCareStateApi,
} from '../utils/api';

interface CareContextType {
  profile: ElderlyProfile;
  medications: Medication[];
  todayDoses: ScheduledDose[];
  adherenceHistory: AdherenceRecord[];
  appointments: DoctorAppointment[];
  emailLogs: EmailPreviewItem[];
  currentRole: UserRole;
  isBackendSynced: boolean;
  setRole: (role: UserRole) => void;
  loginWithPasscode: (passcode: string) => { success: boolean; role?: UserRole; message: string };
  logout: () => void;
  markDoseTaken: (doseId: string, method?: 'elderly_pin_pad' | 'email_1click' | 'caretaker_override') => void;
  markDoseMissed: (doseId: string) => void;
  updateGuidance: (medId: string, guidance: string) => void;
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  addAppointment: (appt: Omit<DoctorAppointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<DoctorAppointment>) => void;
  deleteAppointment: (id: string) => void;
  recordSentEmail: (email: EmailPreviewItem) => void;
  resetDemoData: () => void;
}

const CareContext = createContext<CareContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'carecompass_profile',
  MEDS: 'carecompass_medications',
  DOSES: 'carecompass_doses',
  ADHERENCE: 'carecompass_adherence',
  APPOINTMENTS: 'carecompass_appointments',
  EMAILS: 'carecompass_emails',
  ROLE: 'carecompass_role',
};

export const CareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ElderlyProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : DEMO_ELDERLY_PROFILE;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDS);
    return saved ? JSON.parse(saved) : DEMO_MEDICATIONS;
  });

  const [todayDoses, setTodayDoses] = useState<ScheduledDose[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOSES);
    return saved ? JSON.parse(saved) : DEMO_SCHEDULED_DOSES;
  });

  const [adherenceHistory, setAdherenceHistory] = useState<AdherenceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADHERENCE);
    return saved ? JSON.parse(saved) : DEMO_ADHERENCE_HISTORY;
  });

  const [appointments, setAppointments] = useState<DoctorAppointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : DEMO_APPOINTMENTS;
  });

  const [emailLogs, setEmailLogs] = useState<EmailPreviewItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg-ethereal-lisinopril-demo',
        timestamp: '08:00 AM',
        recipient: 'sarah.vance.care@gmail.com',
        subject: 'Medication Reminder: Eleanor Vance - Lisinopril (08:00 AM)',
        previewUrl: 'https://ethereal.email/messages/simulated-lisinopril-preview',
        type: 'reminder',
        medicationName: 'Lisinopril',
        verificationToken: 'simulated-token-lisinopril',
      },
    ];
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'unauthenticated';
  });

  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(false);

  // Sync with real backend store on mount
  useEffect(() => {
    let isMounted = true;
    async function initFromBackend() {
      try {
        const state = await fetchCareState();
        if (isMounted && state) {
          if (state.profile) setProfile(state.profile);
          if (state.medications && state.medications.length > 0) setMedications(state.medications);
          if (state.todayDoses && state.todayDoses.length > 0) setTodayDoses(state.todayDoses);
          if (state.adherenceHistory) setAdherenceHistory(state.adherenceHistory);
          if (state.appointments) setAppointments(state.appointments);
          setIsBackendSynced(true);
        }
      } catch (err) {
        console.warn('[CareContext] Backend sync fallback to local storage:', err);
        if (isMounted) setIsBackendSynced(false);
      }
    }

    initFromBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDS, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOSES, JSON.stringify(todayDoses));
  }, [todayDoses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADHERENCE, JSON.stringify(adherenceHistory));
  }, [adherenceHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
  }, [currentRole]);

  // Authentication logic for dual-role passcode ecosystem
  const loginWithPasscode = (passcode: string) => {
    const cleanPass = passcode.trim();
    if (cleanPass === profile.pin) {
      setCurrentRole('elderly');
      return { success: true, role: 'elderly' as UserRole, message: `Welcome Grandma ${profile.preferredName}!` };
    }
    if (cleanPass === profile.caretakerPasscode) {
      setCurrentRole('caretaker');
      return { success: true, role: 'caretaker' as UserRole, message: 'Welcome back, Caretaker Sarah!' };
    }
    return { success: false, message: 'Incorrect passcode. Try 1234 for Elderly or 9876 for Caretaker.' };
  };

  const logout = () => {
    setCurrentRole('unauthenticated');
  };

  const markDoseTaken = (
    doseId: string,
    method: 'elderly_pin_pad' | 'email_1click' | 'caretaker_override' = 'elderly_pin_pad'
  ) => {
    const dose = todayDoses.find((d) => d.id === doseId || d.medicationId === doseId);
    if (!dose) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    // Optimistically update today's dose
    setTodayDoses((prev) =>
      prev.map((d) =>
        d.id === dose.id ? { ...d, status: 'taken', takenAt: timeStr, takenMethod: method } : d
      )
    );

    // Optimistically append to adherence log
    const newRecord: AdherenceRecord = {
      id: `adh-${Date.now()}`,
      date: todayDate,
      time: timeStr,
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      status: 'taken',
      loggedAt: nowIso,
      method,
    };
    setAdherenceHistory((prev) => [newRecord, ...prev]);

    // Optimistically decrement pill count
    setMedications((prev) =>
      prev.map((m) => (m.id === dose.medicationId ? { ...m, pillCount: Math.max(0, m.pillCount - 1) } : m))
    );

    // Persist to backend server
    recordAdherenceApi(dose.id, method).catch((err) =>
      console.warn('[CareContext] Adherence backend sync warning:', err)
    );
  };

  const markDoseMissed = (doseId: string) => {
    const dose = todayDoses.find((d) => d.id === doseId);
    if (!dose) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    setTodayDoses((prev) =>
      prev.map((d) => (d.id === doseId ? { ...d, status: 'missed' } : d))
    );

    const newRecord: AdherenceRecord = {
      id: `adh-missed-${Date.now()}`,
      date: todayDate,
      time: timeStr,
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      status: 'missed',
      loggedAt: nowIso,
      method: 'caretaker_override',
    };
    setAdherenceHistory((prev) => [newRecord, ...prev]);
  };

  const updateGuidance = (medId: string, guidance: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, simpleGuidance: guidance } : m))
    );
    setTodayDoses((prev) =>
      prev.map((d) => (d.medicationId === medId ? { ...d, simpleGuidance: guidance } : d))
    );
    updateMedicationApi(medId, { simpleGuidance: guidance }).catch((err) =>
      console.warn('[CareContext] Update guidance sync warning:', err)
    );
  };

  const addMedication = (med: Omit<Medication, 'id'>) => {
    const newId = `med-${Date.now()}`;
    const newMed: Medication = {
      ...med,
      id: newId,
    };
    setMedications((prev) => [...prev, newMed]);

    // Automatically create a scheduled dose for today so the elder sees it immediately
    const firstTime = newMed.scheduledTimes[0] || '12:00 PM';
    const firstSlot = newMed.timeSlots[0] || 'morning';
    const newDose: ScheduledDose = {
      id: `dose-${Date.now()}`,
      medicationId: newId,
      medicationName: newMed.name,
      dosage: newMed.dosage,
      timeSlot: firstSlot,
      scheduledTime: firstTime,
      status: 'pending',
      pillColor: newMed.pillColor || 'bg-teal-500 text-white',
      pillShape: newMed.pillShape || 'Round tablet',
      instructions: newMed.instructions,
      simpleGuidance: newMed.simpleGuidance || 'Take with water as directed.',
    };
    setTodayDoses((prev) => [...prev, newDose]);

    // Persist to backend server
    addMedicationApi(med).catch((err) =>
      console.warn('[CareContext] Add medication backend sync warning:', err)
    );
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    setTodayDoses((prev) =>
      prev.map((d) =>
        d.medicationId === id
          ? {
              ...d,
              medicationName: updates.name || d.medicationName,
              dosage: updates.dosage || d.dosage,
              instructions: updates.instructions || d.instructions,
              simpleGuidance: updates.simpleGuidance || d.simpleGuidance,
            }
          : d
      )
    );

    // Persist to backend server
    updateMedicationApi(id, updates).catch((err) =>
      console.warn('[CareContext] Update medication backend sync warning:', err)
    );
  };

  const deleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setTodayDoses((prev) => prev.filter((d) => d.medicationId !== id));

    // Persist to backend server
    deleteMedicationApi(id).catch((err) =>
      console.warn('[CareContext] Delete medication backend sync warning:', err)
    );
  };

  const addAppointment = (appt: Omit<DoctorAppointment, 'id'>) => {
    const newId = `appt-${Date.now()}`;
    const newAppt: DoctorAppointment = {
      ...appt,
      id: newId,
    };
    setAppointments((prev) => [...prev, newAppt]);

    // Persist to backend server
    addAppointmentApi(appt).catch((err) =>
      console.warn('[CareContext] Add appointment backend sync warning:', err)
    );
  };

  const updateAppointment = (id: string, updates: Partial<DoctorAppointment>) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    // Persist to backend server
    deleteAppointmentApi(id).catch((err) =>
      console.warn('[CareContext] Delete appointment backend sync warning:', err)
    );
  };

  const recordSentEmail = (email: EmailPreviewItem) => {
    setEmailLogs((prev) => [email, ...prev]);
  };

  const resetDemoData = () => {
    setProfile(DEMO_ELDERLY_PROFILE);
    setMedications(DEMO_MEDICATIONS);
    setTodayDoses(DEMO_SCHEDULED_DOSES);
    setAdherenceHistory(DEMO_ADHERENCE_HISTORY);
    setAppointments(DEMO_APPOINTMENTS);
    setEmailLogs([
      {
        id: 'msg-ethereal-lisinopril-demo',
        timestamp: '08:00 AM',
        recipient: 'sarah.vance.care@gmail.com',
        subject: 'Medication Reminder: Eleanor Vance - Lisinopril (08:00 AM)',
        previewUrl: 'https://ethereal.email/messages/simulated-lisinopril-preview',
        type: 'reminder',
        medicationName: 'Lisinopril',
        verificationToken: 'simulated-token-lisinopril',
      },
    ]);
    setCurrentRole('unauthenticated');
    localStorage.clear();

    // Persist reset to backend server
    resetCareStateApi().catch((err) =>
      console.warn('[CareContext] Reset backend sync warning:', err)
    );
  };

  return (
    <CareContext.Provider
      value={{
        profile,
        medications,
        todayDoses,
        adherenceHistory,
        appointments,
        emailLogs,
        currentRole,
        isBackendSynced,
        setRole: setCurrentRole,
        loginWithPasscode,
        logout,
        markDoseTaken,
        markDoseMissed,
        updateGuidance,
        addMedication,
        updateMedication,
        deleteMedication,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        recordSentEmail,
        resetDemoData,
      }}
    >
      {children}
    </CareContext.Provider>
  );
};

export const useCare = (): CareContextType => {
  const context = useContext(CareContext);
  if (!context) {
    throw new Error('useCare must be used within a CareProvider');
  }
  return context;
};
