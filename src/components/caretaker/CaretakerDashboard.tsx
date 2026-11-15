import React, { useState, useEffect } from 'react';
import { useCare } from '../../context/CareContext';
import { Medication, TimeSlot } from '../../types';
import { checkMedicationInteractions, sendMissedDoseEscalation } from '../../utils/api';
import { EmailInspector } from './EmailInspector';
import {
  Pill,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Clock,
  Loader2,
  ClipboardList,
  Mail,
  UserCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const CaretakerDashboard: React.FC = () => {
  const {
    profile,
    medications,
    todayDoses,
    adherenceHistory,
    appointments,
    addMedication,
    updateMedication,
    deleteMedication,
    addAppointment,
    deleteAppointment,
    markDoseMissed,
    recordSentEmail,
  } = useCare();

  const [activeTab, setActiveTab] = useState<'meds' | 'adherence' | 'appointments' | 'ai-safety' | 'email-sim'>('meds');

  // Medication Modal State
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [medFormData, setMedFormData] = useState({
    name: '',
    dosage: '',
    form: 'tablet' as Medication['form'],
    frequency: 'Once daily',
    timeSlot: 'morning' as TimeSlot,
    scheduledTime: '08:00 AM',
    instructions: '',
    simpleGuidance: '',
    purpose: '',
    pillColor: 'bg-teal-500 text-white',
    pillShape: 'Round tablet',
    pillCount: 30,
    refillAt: 7,
  });

  // Appointment Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptFormData, setApptFormData] = useState({
    doctorName: '',
    specialty: '',
    clinicName: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    location: '',
    phone: '',
    reason: '',
    preparationList: ['Bring current medication list', 'Arrive 15 minutes early'],
  });
  const [newPrepItem, setNewPrepItem] = useState('');

  // AI Safety Analysis State
  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [escalatingDoseId, setEscalatingDoseId] = useState<string | null>(null);

  // Auto-run AI interaction analysis when opening AI safety tab
  useEffect(() => {
    if (activeTab === 'ai-safety' && !aiReport) {
      runInteractionCheck();
    }
  }, [activeTab]);

  const runInteractionCheck = async () => {
    try {
      setLoadingAi(true);
      const data = await checkMedicationInteractions(
        medications.map((m) => ({ name: m.name, dosage: m.dosage, instructions: m.instructions }))
      );
      setAiReport(data);
    } catch (err) {
      console.error('Failed to run interaction check:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Open modal for adding medication
  const handleOpenAddMed = () => {
    setEditingMedId(null);
    setMedFormData({
      name: '',
      dosage: '',
      form: 'tablet',
      frequency: 'Once daily (Morning)',
      timeSlot: 'morning',
      scheduledTime: '08:00 AM',
      instructions: 'Take 1 tablet with water.',
      simpleGuidance: 'Take this pill with water in the morning.',
      purpose: 'Cardiovascular Care',
      pillColor: 'bg-teal-500 text-white',
      pillShape: 'Round tablet',
      pillCount: 30,
      refillAt: 7,
    });
    setShowMedModal(true);
  };

  // Open modal for editing medication
  const handleOpenEditMed = (med: Medication) => {
    setEditingMedId(med.id);
    setMedFormData({
      name: med.name,
      dosage: med.dosage,
      form: med.form,
      frequency: med.frequency,
      timeSlot: med.timeSlots[0] || 'morning',
      scheduledTime: med.scheduledTimes[0] || '08:00 AM',
      instructions: med.instructions,
      simpleGuidance: med.simpleGuidance,
      purpose: med.purpose,
      pillColor: med.pillColor,
      pillShape: med.pillShape,
      pillCount: med.pillCount,
      refillAt: med.refillAt,
    });
    setShowMedModal(true);
  };

  // Save medication
  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medFormData.name.trim() || !medFormData.dosage.trim()) return;

    if (editingMedId) {
      updateMedication(editingMedId, {
        name: medFormData.name,
        dosage: medFormData.dosage,
        form: medFormData.form,
        frequency: medFormData.frequency,
        timeSlots: [medFormData.timeSlot],
        scheduledTimes: [medFormData.scheduledTime],
        instructions: medFormData.instructions,
        simpleGuidance: medFormData.simpleGuidance,
        purpose: medFormData.purpose,
        pillColor: medFormData.pillColor,
        pillShape: medFormData.pillShape,
        pillCount: Number(medFormData.pillCount),
        refillAt: Number(medFormData.refillAt),
      });
    } else {
      addMedication({
        name: medFormData.name,
        dosage: medFormData.dosage,
        form: medFormData.form,
        frequency: medFormData.frequency,
        timeSlots: [medFormData.timeSlot],
        scheduledTimes: [medFormData.scheduledTime],
        instructions: medFormData.instructions,
        simpleGuidance: medFormData.simpleGuidance,
        purpose: medFormData.purpose,
        pillColor: medFormData.pillColor,
        pillShape: medFormData.pillShape,
        pillCount: Number(medFormData.pillCount),
        refillAt: Number(medFormData.refillAt),
        isActive: true,
      });
    }
    setShowMedModal(false);
  };

  // Save appointment
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptFormData.doctorName.trim()) return;

    addAppointment({
      doctorName: apptFormData.doctorName,
      specialty: apptFormData.specialty,
      clinicName: apptFormData.clinicName,
      date: apptFormData.date,
      time: apptFormData.time,
      location: apptFormData.location,
      phone: apptFormData.phone,
      reason: apptFormData.reason,
      preparationList: apptFormData.preparationList,
      status: 'upcoming',
    });
    setShowApptModal(false);
  };

  const handleAddPrepItem = () => {
    if (newPrepItem.trim()) {
      setApptFormData((prev) => ({
        ...prev,
        preparationList: [...prev.preparationList, newPrepItem.trim()],
      }));
      setNewPrepItem('');
    }
  };

  // Simulate missed dose escalation
  const handleSimulateMissedDose = async (doseId: string) => {
    const dose = todayDoses.find((d) => d.id === doseId);
    if (!dose) return;

    try {
      setEscalatingDoseId(doseId);
      markDoseMissed(doseId);

      const res = await sendMissedDoseEscalation({
        recipient: profile.caretakerEmail,
        patientName: profile.name,
        medicationName: dose.medicationName,
        dosage: dose.dosage,
        scheduledTime: dose.scheduledTime,
        minutesOverdue: 45,
      });

      if (res && res.data) {
        recordSentEmail({
          id: res.data.messageId || `msg-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          recipient: res.data.recipient || profile.caretakerEmail,
          subject: res.data.subject,
          previewUrl: res.data.previewUrl,
          type: 'missed_escalation',
          medicationName: dose.medicationName,
        });
      }
    } catch (err) {
      console.error('Failed to dispatch escalation:', err);
    } finally {
      setEscalatingDoseId(null);
    }
  };

  // Calculate adherence rate metrics
  const totalLogged = adherenceHistory.length;
  const totalTaken = adherenceHistory.filter((a) => a.status === 'taken').length;
  const adherenceRate = totalLogged > 0 ? Math.round((totalTaken / totalLogged) * 100) : 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Caretaker Header Bar */}
      <section
        aria-label="Caretaker Command Center Overview"
        className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-bold">
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              <span>Primary Caretaker Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Caretaker Command Center: {profile.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Monitoring adherence, prescription schedules, doctor appointments, and AI interaction safety for{' '}
              <strong>Eleanor Vance ({profile.age} yrs)</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Overall Adherence Rate</span>
              <span className="text-3xl font-black text-emerald-400">{adherenceRate}%</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Active Medications</span>
              <span className="text-3xl font-black text-teal-400">{medications.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation (WCAG AAA keyboard accessible) */}
      <nav aria-label="Caretaker Dashboard Views" className="border-b border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            id="tab-meds"
            aria-selected={activeTab === 'meds'}
            aria-controls="panel-meds"
            onClick={() => setActiveTab('meds')}
            className={`touch-target px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center space-x-2 border-2 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              activeTab === 'meds'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Pill className="w-5 h-5" aria-hidden="true" />
            <span>Medication Management ({medications.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-adherence"
            aria-selected={activeTab === 'adherence'}
            aria-controls="panel-adherence"
            onClick={() => setActiveTab('adherence')}
            className={`touch-target px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center space-x-2 border-2 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              activeTab === 'adherence'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
            <span>Adherence & Escalation Log</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-appointments"
            aria-selected={activeTab === 'appointments'}
            aria-controls="panel-appointments"
            onClick={() => setActiveTab('appointments')}
            className={`touch-target px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center space-x-2 border-2 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              activeTab === 'appointments'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Calendar className="w-5 h-5" aria-hidden="true" />
            <span>Doctor Appointments ({appointments.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-ai-safety"
            aria-selected={activeTab === 'ai-safety'}
            aria-controls="panel-ai-safety"
            onClick={() => setActiveTab('ai-safety')}
            className={`touch-target px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center space-x-2 border-2 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              activeTab === 'ai-safety'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-300" aria-hidden="true" />
            <span>Gemini AI Clinical Safety</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-email-sim"
            aria-selected={activeTab === 'email-sim'}
            aria-controls="panel-email-sim"
            onClick={() => setActiveTab('email-sim')}
            className={`touch-target px-5 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center space-x-2 border-2 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none ${
              activeTab === 'email-sim'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Mail className="w-5 h-5 text-teal-300" aria-hidden="true" />
            <span>Live Email & 1-Click Simulator</span>
          </button>
        </div>
      </nav>

      {/* TAB 1: Medication Management (CRUD) */}
      {activeTab === 'meds' && (
        <section
          id="panel-meds"
          role="tabpanel"
          aria-labelledby="tab-meds"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Active Prescription Regimen</h2>
              <p className="text-sm text-slate-300">
                Add, modify dosage, or review refill requirements for Eleanor's medications.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddMed}
              aria-label="Add a new medication to Eleanor's schedule"
              className="touch-target px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl transition flex items-center space-x-2 shadow-lg shadow-teal-500/20 focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>Add New Medication</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {medications.map((med) => (
              <div
                key={med.id}
                className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-white">{med.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 font-mono text-teal-300 font-bold">
                        {med.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{med.purpose}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditMed(med)}
                      aria-label="Edit medication"
                      className="touch-target px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1.5 text-xs font-bold border border-slate-700 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedication(med.id)}
                      aria-label="Delete medication"
                      className="touch-target px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-rose-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-bold border border-slate-700 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Frequency & Times:</span>
                    <span className="font-semibold text-white">
                      {med.frequency} ({med.scheduledTimes.join(', ')})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Instructions:</span>
                    <span className="text-right font-medium text-slate-200 max-w-[65%]">
                      {med.instructions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                    <span>Remaining Inventory:</span>
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded ${
                        med.pillCount <= med.refillAt
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {med.pillCount} pills left {med.pillCount <= med.refillAt && '• REFILL NEEDED'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-teal-950/40 rounded-xl border border-teal-800/50 text-xs flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-teal-200 italic">"{med.simpleGuidance}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: Adherence & Escalation Monitor */}
      {activeTab === 'adherence' && (
        <section
          id="panel-adherence"
          role="tabpanel"
          aria-labelledby="tab-adherence"
          className="space-y-6"
        >
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Today's Real-Time Dose Status</h2>
                <p className="text-sm text-slate-300">
                  Track doses logged by Eleanor or through the 1-Click email system.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayDoses.map((dose) => (
                <div
                  key={dose.id}
                  className={`p-5 rounded-2xl border-2 space-y-3 ${
                    dose.status === 'taken'
                      ? 'bg-emerald-950/40 border-emerald-500/70'
                      : dose.status === 'missed'
                      ? 'bg-rose-950/40 border-rose-500/70'
                      : 'bg-slate-950 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">{dose.medicationName}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        dose.status === 'taken'
                          ? 'bg-emerald-900 text-emerald-300'
                          : dose.status === 'missed'
                          ? 'bg-rose-900 text-rose-300'
                          : 'bg-amber-900/80 text-amber-300'
                      }`}
                    >
                      {dose.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Dosage: <strong>{dose.dosage}</strong></div>
                    <div>Scheduled: <strong>{dose.scheduledTime}</strong></div>
                    {dose.takenAt && <div>Taken at: <strong className="text-emerald-400">{dose.takenAt}</strong></div>}
                  </div>

                  {/* Simulate Missed Dose Escalation Trigger */}
                  {dose.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleSimulateMissedDose(dose.id)}
                      disabled={escalatingDoseId === dose.id}
                      aria-label={`Simulate missed dose escalation for ${dose.medicationName}`}
                      className="touch-target w-full py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      {escalatingDoseId === dose.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>Simulate Missed Dose Escalation</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Historical Log */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white">Adherence Verification History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Medication</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/80">
                    {adherenceHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-300">
                          {rec.date} {rec.time}
                        </td>
                        <td className="p-3 font-bold text-white">{rec.medicationName}</td>
                        <td className="p-3 font-mono text-slate-300">{rec.dosage}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              rec.status === 'taken'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {rec.method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: Doctor Appointments Manager */}
      {activeTab === 'appointments' && (
        <section
          id="panel-appointments"
          role="tabpanel"
          aria-labelledby="tab-appointments"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Doctor Appointments & Preparation</h2>
              <p className="text-sm text-slate-300">
                Manage upcoming clinic visits and checklist preparation for Eleanor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApptModal(true)}
              aria-label="Schedule a new doctor appointment"
              className="touch-target px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl transition flex items-center space-x-2 shadow-lg shadow-teal-500/20 focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>Add Appointment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{appt.doctorName}</h3>
                    <p className="text-xs text-teal-400 font-semibold">{appt.specialty}</p>
                    <p className="text-xs text-slate-400">{appt.clinicName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                      {appt.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteAppointment(appt.id)}
                      aria-label={`Delete appointment with ${appt.doctorName}`}
                      className="touch-target p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-white transition"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="text-white font-bold flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>
                      {appt.date} at {appt.time}
                    </span>
                  </div>
                  <div className="text-slate-300">Location: {appt.location}</div>
                  <div className="text-slate-300">Phone: {appt.phone}</div>
                  <div className="text-slate-400 pt-1">Reason: {appt.reason}</div>
                </div>

                {/* Preparation Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>Preparation Checklist:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {appt.preparationList.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: Gemini AI Clinical Safety & Interaction Checker */}
      {activeTab === 'ai-safety' && (
        <section
          id="panel-ai-safety"
          role="tabpanel"
          aria-labelledby="tab-ai-safety"
          className="space-y-6"
        >
          <div className="bg-slate-900 border-2 border-indigo-700/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-bold mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <span>Google Gemini 2.5 Flash Clinical Analysis</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Medication Interaction & Clinical Safety Advisor
                </h2>
                <p className="text-sm text-slate-300">
                  Automated contraindication checks across Eleanor's active prescription regimen.
                </p>
              </div>

              <button
                type="button"
                onClick={runInteractionCheck}
                disabled={loadingAi}
                aria-label="Re-analyze medication interactions with Gemini AI"
                className="touch-target px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:outline-none"
              >
                {loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>Re-Analyze with Gemini</span>
              </button>
            </div>

            {loadingAi ? (
              <div className="p-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" aria-hidden="true" />
                <p className="text-lg font-bold text-white">
                  Google Gemini AI is reviewing Eleanor's medication list for drug & food interactions...
                </p>
              </div>
            ) : aiReport ? (
              <div className="space-y-6">
                {/* Overall Risk Card */}
                <div
                  className={`p-6 rounded-2xl border-2 flex items-start space-x-4 ${
                    aiReport.overallRisk === 'high'
                      ? 'bg-rose-950/70 border-rose-500'
                      : aiReport.overallRisk === 'moderate'
                      ? 'bg-amber-950/70 border-amber-500'
                      : 'bg-emerald-950/70 border-emerald-500'
                  }`}
                >
                  <ShieldAlert className="w-8 h-8 text-white shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white">Overall Regimen Risk:</span>
                      <span className="text-sm uppercase font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white border border-white/20">
                        {aiReport.overallRisk}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 mt-1">{aiReport.summary}</p>
                  </div>
                </div>

                {/* Interactions List */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white">Detected Drug-Drug Interactions:</h3>
                  {aiReport.interactions && aiReport.interactions.length > 0 ? (
                    aiReport.interactions.map((interaction: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">
                            {interaction.drugsInvolved.join(' + ')}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 capitalize">
                            {interaction.severity} Severity
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{interaction.description}</p>
                        <p className="text-xs text-teal-300 font-semibold">
                          Recommendation: {interaction.guidance}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400">
                      No adverse drug-drug interactions detected.
                    </div>
                  )}
                </div>

                {/* Food Warnings & Timing Advice Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Food & Dietary Precautions</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {aiReport.foodWarnings?.map((warning: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-teal-300 flex items-center space-x-2">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>Chronotherapy & Timing Optimization</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {aiReport.timingAdvice?.map((advice: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-teal-400 font-bold">•</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* TAB 5: Live Email & 1-Click Simulator */}
      {activeTab === 'email-sim' && (
        <section
          id="panel-email-sim"
          role="tabpanel"
          aria-labelledby="tab-email-sim"
        >
          <EmailInspector />
        </section>
      )}

      {/* MODAL: Add / Edit Medication */}
      {showMedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="med-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <h3 id="med-modal-title" className="text-2xl font-black text-white">
              {editingMedId ? 'Edit Medication' : 'Add New Medication'}
            </h3>

            <form onSubmit={handleSaveMedication} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={medFormData.name}
                  onChange={(e) => setMedFormData({ ...medFormData, name: e.target.value })}
                  placeholder="e.g. Lisinopril"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={medFormData.dosage}
                    onChange={(e) => setMedFormData({ ...medFormData, dosage: e.target.value })}
                    placeholder="e.g. 10mg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Form</label>
                  <select
                    value={medFormData.form}
                    onChange={(e) => setMedFormData({ ...medFormData, form: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-400 focus:outline-none"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="liquid">Liquid</option>
                    <option value="inhaler">Inhaler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Time Slot</label>
                  <select
                    value={medFormData.timeSlot}
                    onChange={(e) => setMedFormData({ ...medFormData, timeSlot: e.target.value as TimeSlot })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-400 focus:outline-none"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    required
                    value={medFormData.scheduledTime}
                    onChange={(e) => setMedFormData({ ...medFormData, scheduledTime: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Prescription Instructions</label>
                <textarea
                  rows={2}
                  value={medFormData.instructions}
                  onChange={(e) => setMedFormData({ ...medFormData, instructions: e.target.value })}
                  placeholder="Take 1 tablet with full glass of water..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Gemini Comfort Guidance (Senior 1-Sentence Advice)
                </label>
                <input
                  type="text"
                  value={medFormData.simpleGuidance}
                  onChange={(e) => setMedFormData({ ...medFormData, simpleGuidance: e.target.value })}
                  placeholder="Take this pill with water in the morning..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-teal-300 text-sm focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Doctor Appointment */}
      {showApptModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="appt-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <h3 id="appt-modal-title" className="text-2xl font-black text-white">
              Schedule Doctor Appointment
            </h3>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={apptFormData.doctorName}
                    onChange={(e) => setApptFormData({ ...apptFormData, doctorName: e.target.value })}
                    placeholder="Dr. Robert Chen"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Specialty</label>
                  <input
                    type="text"
                    required
                    value={apptFormData.specialty}
                    onChange={(e) => setApptFormData({ ...apptFormData, specialty: e.target.value })}
                    placeholder="Cardiologist"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinic Name & Location</label>
                <input
                  type="text"
                  required
                  value={apptFormData.clinicName}
                  onChange={(e) => setApptFormData({ ...apptFormData, clinicName: e.target.value })}
                  placeholder="St. Jude Heart & Vascular Center"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={apptFormData.date}
                    onChange={(e) => setApptFormData({ ...apptFormData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={apptFormData.time}
                    onChange={(e) => setApptFormData({ ...apptFormData, time: e.target.value })}
                    placeholder="10:30 AM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Preparation Checklist</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newPrepItem}
                    onChange={(e) => setNewPrepItem(e.target.value)}
                    placeholder="Add checklist item..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:border-teal-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrepItem}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-xs"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {apptFormData.preparationList.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-xs flex items-center space-x-1.5">
                      <span>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
