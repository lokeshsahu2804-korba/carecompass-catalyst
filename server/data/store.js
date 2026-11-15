import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, 'care_data.json');

const DEFAULT_PROFILE = {
  id: 'elderly-01',
  name: 'Eleanor Vance',
  preferredName: 'Grandma Eleanor',
  age: 78,
  pin: '1234',
  emergencyPhone: '911',
  caretakerName: 'Sarah Vance (Daughter)',
  caretakerPhone: '(555) 382-9912',
  caretakerEmail: 'sarah.vance.care@gmail.com',
  caretakerPasscode: '9876',
  bloodType: 'O-Positive',
  allergies: ['Penicillin', 'Sulfa drugs'],
  primaryCondition: 'Type 2 Diabetes & Mild Hypertension',
  doctorName: 'Dr. Robert Chen',
  doctorPhone: '(555) 742-1088',
};

const DEFAULT_MEDICATIONS = [
  {
    id: 'med-01',
    name: 'Lisinopril',
    genericName: 'Lisinopril HCTZ',
    dosage: '10mg',
    form: 'tablet',
    frequency: 'Once daily (Morning)',
    timeSlots: ['morning'],
    scheduledTimes: ['08:00 AM'],
    instructions: 'Take 1 tablet every morning with a full glass of water.',
    simpleGuidance: 'Take this with a cool glass of water right when you wake up to keep your heart calm and steady.',
    purpose: 'Blood Pressure Management',
    pillColor: 'bg-rose-500 text-white',
    pillShape: 'Round tablet with score mark',
    pillCount: 24,
    refillAt: 7,
    isActive: true,
  },
  {
    id: 'med-02',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    dosage: '500mg',
    form: 'tablet',
    frequency: 'Twice daily (Breakfast & Dinner)',
    timeSlots: ['morning', 'evening'],
    scheduledTimes: ['08:00 AM', '07:00 PM'],
    instructions: 'Take 1 tablet with meals to minimize stomach upset.',
    simpleGuidance: 'Take this with your morning toast and evening dinner to keep your tummy feeling happy and sugar level.',
    purpose: 'Type 2 Diabetes Control',
    pillColor: 'bg-emerald-500 text-white',
    pillShape: 'Oval white coated tablet',
    pillCount: 46,
    refillAt: 10,
    isActive: true,
  },
  {
    id: 'med-03',
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    dosage: '1000 IU',
    form: 'capsule',
    frequency: 'Once daily (Lunch)',
    timeSlots: ['afternoon'],
    scheduledTimes: ['12:30 PM'],
    instructions: 'Take 1 softgel capsule with lunch.',
    simpleGuidance: 'Take this little golden pill with your lunch to keep your bones strong and sunny.',
    purpose: 'Bone Strength & Immunity',
    pillColor: 'bg-amber-400 text-slate-900',
    pillShape: 'Small translucent yellow softgel',
    pillCount: 60,
    refillAt: 14,
    isActive: true,
  },
  {
    id: 'med-04',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    dosage: '20mg',
    form: 'tablet',
    frequency: 'Once daily (Bedtime)',
    timeSlots: ['bedtime'],
    scheduledTimes: ['08:30 PM'],
    instructions: 'Take 1 tablet at bedtime with or without food.',
    simpleGuidance: 'Take this before your bedtime story or warm tea to protect your blood vessels while you rest peacefully.',
    purpose: 'Cholesterol & Heart Health',
    pillColor: 'bg-sky-500 text-white',
    pillShape: 'Oval film-coated tablet',
    pillCount: 18,
    refillAt: 5,
    isActive: true,
  },
];

const DEFAULT_DOSES = [
  {
    id: 'dose-today-01',
    medicationId: 'med-01',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    timeSlot: 'morning',
    scheduledTime: '08:00 AM',
    status: 'taken',
    takenAt: '08:12 AM',
    pillColor: 'bg-rose-500 text-white',
    pillShape: 'Round tablet with score mark',
    instructions: 'Take with full glass of water',
    simpleGuidance: 'Take this with a cool glass of water right when you wake up to keep your heart calm and steady.',
    takenMethod: 'elderly_pin_pad',
  },
  {
    id: 'dose-today-02',
    medicationId: 'med-02',
    medicationName: 'Metformin',
    dosage: '500mg',
    timeSlot: 'morning',
    scheduledTime: '08:00 AM',
    status: 'taken',
    takenAt: '08:14 AM',
    pillColor: 'bg-emerald-500 text-white',
    pillShape: 'Oval white coated tablet',
    instructions: 'Take with breakfast',
    simpleGuidance: 'Take this with your morning toast to keep your tummy feeling happy.',
    takenMethod: 'elderly_pin_pad',
  },
  {
    id: 'dose-today-03',
    medicationId: 'med-03',
    medicationName: 'Vitamin D3',
    dosage: '1000 IU',
    timeSlot: 'afternoon',
    scheduledTime: '12:30 PM',
    status: 'pending',
    pillColor: 'bg-amber-400 text-slate-900',
    pillShape: 'Small translucent yellow softgel',
    instructions: 'Take with lunch',
    simpleGuidance: 'Take this little golden pill with your lunch to keep your bones strong and sunny.',
  },
  {
    id: 'dose-today-04',
    medicationId: 'med-02',
    medicationName: 'Metformin',
    dosage: '500mg',
    timeSlot: 'evening',
    scheduledTime: '07:00 PM',
    status: 'pending',
    pillColor: 'bg-emerald-500 text-white',
    pillShape: 'Oval white coated tablet',
    instructions: 'Take with dinner',
    simpleGuidance: 'Take this with your warm dinner soup to keep your blood sugar steady through the night.',
  },
  {
    id: 'dose-today-05',
    medicationId: 'med-04',
    medicationName: 'Atorvastatin',
    dosage: '20mg',
    timeSlot: 'bedtime',
    scheduledTime: '08:30 PM',
    status: 'pending',
    pillColor: 'bg-sky-500 text-white',
    pillShape: 'Oval film-coated tablet',
    instructions: 'Take before sleep',
    simpleGuidance: 'Take this before bedtime to protect your blood vessels while you rest peacefully.',
  },
];

const DEFAULT_ADHERENCE = [
  {
    id: 'adh-01',
    date: '2026-11-14',
    time: '08:10 AM',
    medicationId: 'med-01',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    status: 'taken',
    loggedAt: '2026-11-14T08:10:00.000Z',
    method: 'elderly_pin_pad',
  },
  {
    id: 'adh-02',
    date: '2026-11-14',
    time: '08:10 AM',
    medicationId: 'med-02',
    medicationName: 'Metformin',
    dosage: '500mg',
    status: 'taken',
    loggedAt: '2026-11-14T08:10:00.000Z',
    method: 'elderly_pin_pad',
  },
];

const DEFAULT_APPOINTMENTS = [
  {
    id: 'appt-01',
    doctorName: 'Dr. Robert Chen',
    specialty: 'Cardiologist',
    clinicName: 'St. Jude Heart & Vascular Center',
    date: '2026-11-18',
    time: '10:30 AM',
    location: 'Suite 402, 1200 Mercy Parkway, San Jose, CA',
    phone: '(555) 742-1088',
    reason: '6-Month Hypertension & Cardiovascular Checkup',
    preparationList: [
      'Bring morning blood pressure log from the past 2 weeks',
      'Bring current pill organizer with Lisinopril and Atorvastatin',
      'Wear short sleeves for blood pressure check',
      'No fasting required for this visit',
    ],
    status: 'upcoming',
  },
  {
    id: 'appt-02',
    doctorName: 'Dr. Emily Patel',
    specialty: 'Endocrinologist',
    clinicName: 'Valley Metabolic Health Institute',
    date: '2026-11-25',
    time: '02:00 PM',
    location: 'Building B, 850 Blossom Hill Rd, Los Gatos, CA',
    phone: '(555) 901-4432',
    reason: 'Quarterly HbA1c Diabetes Review',
    preparationList: [
      'Fast for 8 hours prior to blood draw (water is fine)',
      'Bring home blood glucose monitor for data sync',
      'List any symptoms of hypoglycemia or dizziness',
    ],
    status: 'upcoming',
  },
];

// In-Memory state with JSON file persistence
class CareDataStore {
  constructor() {
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[CareStore] Could not read existing store file, using defaults:', err.message);
    }
    return {
      profile: { ...DEFAULT_PROFILE },
      medications: [...DEFAULT_MEDICATIONS],
      todayDoses: [...DEFAULT_DOSES],
      adherenceHistory: [...DEFAULT_ADHERENCE],
      appointments: [...DEFAULT_APPOINTMENTS],
      lastUpdated: new Date().toISOString(),
    };
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[CareStore] Safe persistence warning (e.g. read-only container):', err.message);
    }
  }

  getState() {
    return this.state;
  }

  // Medication CRUD
  addMedication(medData) {
    const id = `med-${Date.now()}`;
    const newMed = {
      ...medData,
      id,
      isActive: true,
      pillCount: Number(medData.pillCount) || 30,
      refillAt: Number(medData.refillAt) || 7,
    };
    this.state.medications.push(newMed);

    // Create corresponding scheduled dose for today
    const firstTime = (newMed.scheduledTimes && newMed.scheduledTimes[0]) || '08:00 AM';
    const firstSlot = (newMed.timeSlots && newMed.timeSlots[0]) || 'morning';
    const newDose = {
      id: `dose-${Date.now()}`,
      medicationId: id,
      medicationName: newMed.name,
      dosage: newMed.dosage,
      timeSlot: firstSlot,
      scheduledTime: firstTime,
      status: 'pending',
      pillColor: newMed.pillColor || 'bg-teal-500 text-white',
      pillShape: newMed.pillShape || 'Round tablet',
      instructions: newMed.instructions || '',
      simpleGuidance: newMed.simpleGuidance || 'Take with water as directed.',
    };
    this.state.todayDoses.push(newDose);

    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return newMed;
  }

  updateMedication(id, updates) {
    const idx = this.state.medications.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    this.state.medications[idx] = {
      ...this.state.medications[idx],
      ...updates,
    };

    // Update corresponding dose names
    this.state.todayDoses = this.state.todayDoses.map((d) =>
      d.medicationId === id
        ? {
            ...d,
            medicationName: updates.name || d.medicationName,
            dosage: updates.dosage || d.dosage,
            instructions: updates.instructions || d.instructions,
            simpleGuidance: updates.simpleGuidance || d.simpleGuidance,
          }
        : d
    );

    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return this.state.medications[idx];
  }

  deleteMedication(id) {
    const exists = this.state.medications.some((m) => m.id === id);
    if (!exists) return false;

    this.state.medications = this.state.medications.filter((m) => m.id !== id);
    this.state.todayDoses = this.state.todayDoses.filter((d) => d.medicationId !== id);

    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return true;
  }

  // Adherence
  markDoseTaken(doseId, method = 'elderly_pin_pad') {
    const dose = this.state.todayDoses.find((d) => d.id === doseId || d.medicationId === doseId);
    if (!dose) return null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    dose.status = 'taken';
    dose.takenAt = timeStr;
    dose.takenMethod = method;

    const record = {
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

    this.state.adherenceHistory.unshift(record);

    // Decrement pill count
    const med = this.state.medications.find((m) => m.id === dose.medicationId);
    if (med && med.pillCount > 0) {
      med.pillCount -= 1;
    }

    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return record;
  }

  // Appointments
  addAppointment(apptData) {
    const newAppt = {
      ...apptData,
      id: `appt-${Date.now()}`,
      status: 'upcoming',
      preparationList: Array.isArray(apptData.preparationList)
        ? apptData.preparationList
        : ['Bring current medication list', 'Arrive 15 minutes early'],
    };
    this.state.appointments.push(newAppt);
    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return newAppt;
  }

  updateAppointment(id, updates) {
    const idx = this.state.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.state.appointments[idx] = {
      ...this.state.appointments[idx],
      ...updates,
    };
    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return this.state.appointments[idx];
  }

  deleteAppointment(id) {
    const exists = this.state.appointments.some((a) => a.id === id);
    if (!exists) return false;

    this.state.appointments = this.state.appointments.filter((a) => a.id !== id);
    this.state.lastUpdated = new Date().toISOString();
    this.save();
    return true;
  }

  reset() {
    this.state = {
      profile: { ...DEFAULT_PROFILE },
      medications: [...DEFAULT_MEDICATIONS],
      todayDoses: [...DEFAULT_DOSES],
      adherenceHistory: [...DEFAULT_ADHERENCE],
      appointments: [...DEFAULT_APPOINTMENTS],
      lastUpdated: new Date().toISOString(),
    };
    this.save();
    return this.state;
  }
}

export const careStore = new CareDataStore();
