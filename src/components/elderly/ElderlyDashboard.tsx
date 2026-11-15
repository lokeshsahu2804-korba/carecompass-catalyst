import React, { useState, useEffect } from 'react';
import { useCare } from '../../context/CareContext';
import { MedicineCard } from './MedicineCard';
import { TimeSlot } from '../../types';
import {
  Heart,
  PhoneCall,
  Sun,
  Sunset,
  Moon,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const ElderlyDashboard: React.FC = () => {
  const { profile, todayDoses, appointments } = useCare();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalDoses = todayDoses.length;
  const takenDoses = todayDoses.filter((d) => d.status === 'taken').length;
  const percentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const handleSendEmergencyAlert = () => {
    setEmergencyAlertSent(true);
    setTimeout(() => {
      // Auto close after notifying
      setEmergencyAlertSent(false);
      setShowEmergencyModal(false);
    }, 4000);
  };

  const timeSlots: Array<{ key: TimeSlot | 'all'; label: string; icon: any }> = [
    { key: 'all', label: "All Today's Doses", icon: Clock },
    { key: 'morning', label: 'Morning', icon: Sun },
    { key: 'afternoon', label: 'Afternoon', icon: Sun },
    { key: 'evening', label: 'Evening', icon: Sunset },
    { key: 'bedtime', label: 'Bedtime', icon: Moon },
  ];

  const filteredDoses =
    selectedSlot === 'all'
      ? todayDoses
      : todayDoses.filter((d) => d.timeSlot === selectedSlot);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Warm Ultra-Accessible Greeting Header */}
      <section
        aria-label="Daily Overview and Greeting"
        className="bg-slate-900 border-3 border-teal-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-950 border border-teal-500 text-teal-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>CareCompass High-Contrast Senior View</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Good day, {profile.preferredName}! 👋
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-teal-300 flex items-center space-x-2">
              <Clock className="w-6 h-6" aria-hidden="true" />
              <span>{formattedDate} • {formattedTime}</span>
            </p>
          </div>

          {/* Massive Emergency Button (WCAG AAA Touch Target) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              aria-label="Send emergency alert to caretaker"
              className="touch-target w-full sm:w-auto min-h-[68px] px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-400 text-white font-black text-xl sm:text-2xl border-3 border-rose-300 shadow-xl shadow-rose-900/40 transition-all transform active:scale-95 flex items-center justify-center space-x-3 focus-visible:ring-4 focus-visible:ring-rose-300 focus-visible:outline-none"
            >
              <AlertOctagon className="w-8 h-8 text-white animate-pulse" aria-hidden="true" />
              <span>Alert Family / Caretaker</span>
            </button>
          </div>
        </div>

        {/* Adherence Progress Bar */}
        <div className="mt-8 pt-6 border-t-2 border-slate-800">
          <div className="flex items-center justify-between mb-3 text-lg sm:text-xl font-black">
            <span className="text-white flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              <span>Today's Medicine Progress:</span>
            </span>
            <span className="text-teal-300 font-mono text-2xl">
              {takenDoses} of {totalDoses} taken ({percentage}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily medication progress: ${percentage}% completed`}
            className="w-full h-7 bg-slate-950 rounded-full border-2 border-slate-700 p-1 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>

          {percentage === 100 && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 font-bold text-center text-lg sm:text-xl flex items-center justify-center space-x-2">
              <Heart className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              <span>Wonderful job, Eleanor! You have taken all your medicines for today!</span>
            </div>
          )}
        </div>
      </section>

      {/* Time-of-Day Filter Buttons */}
      <section aria-label="Filter medications by time of day">
        <div className="flex flex-wrap gap-2.5 sm:gap-3.5" role="toolbar" aria-label="Time slots">
          {timeSlots.map((slot) => {
            const Icon = slot.icon;
            const isSelected = selectedSlot === slot.key;
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => setSelectedSlot(slot.key)}
                aria-pressed={isSelected}
                className={`touch-target px-5 py-3 rounded-2xl font-bold text-base sm:text-lg border-2 transition-all flex items-center space-x-2.5 focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/25 scale-105'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{slot.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Today's Medication Cards List */}
      <section aria-label="Today's Scheduled Medications" className="space-y-5">
        <h2 className="sr-only">Today's Scheduled Medications List</h2>
        <div role="list" className="space-y-5">
          {filteredDoses.length > 0 ? (
            filteredDoses.map((dose) => <MedicineCard key={dose.id} dose={dose} />)
          ) : (
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-12 text-center text-slate-300">
              <p className="text-2xl font-bold">No medicines scheduled for this time slot.</p>
              <button
                onClick={() => setSelectedSlot('all')}
                className="mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl"
              >
                Show All Today's Medicines
              </button>
            </div>
          )}
        </div>
      </section>

      {/* My Upcoming Doctor Visits Section for Eleanor */}
      <section
        aria-label="My Upcoming Doctor Visits"
        className="bg-slate-900 border-3 border-teal-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-14 h-14 rounded-2xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 shrink-0"
              aria-hidden="true"
            >
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                My Upcoming Doctor Visits ({appointments.length})
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Important medical appointments with simple, reassuring reminders.
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-700 w-fit">
            Caregiver Sarah Notified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" role="list" aria-label="Upcoming doctor appointments list">
          {appointments.map((appt) => (
            <article
              key={appt.id}
              role="listitem"
              aria-label={`Doctor appointment with ${appt.doctorName} on ${appt.date} at ${appt.time}`}
              className="bg-slate-950 border-2 border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-teal-400 transition shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">{appt.doctorName}</h3>
                  <span className="text-sm font-bold text-teal-400 block">{appt.specialty}</span>
                  <span className="text-xs text-slate-400">{appt.clinicName}</span>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                  {appt.status.toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-sm space-y-1">
                <div className="font-bold text-teal-300 flex items-center space-x-2 text-base">
                  <Clock className="w-4 h-4 text-teal-400" aria-hidden="true" />
                  <span>{appt.date} at {appt.time}</span>
                </div>
                <div className="text-slate-300">Location: {appt.location}</div>
                <div className="text-slate-400 font-medium pt-1">Reason: {appt.reason}</div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Things to remember for this visit:
                </span>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                  {appt.preparationList.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Emergency Alert Modal */}
      {showEmergencyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border-4 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-950 border-3 border-rose-500 text-rose-400 mx-auto flex items-center justify-center">
              <PhoneCall className="w-10 h-10 animate-bounce" aria-hidden="true" />
            </div>

            <div>
              <h3 id="emergency-dialog-title" className="text-3xl font-black text-white">
                Contact Family Caregiver
              </h3>
              <p className="text-lg text-slate-300 mt-2">
                Would you like to notify <strong>{profile.caretakerName}</strong> ({profile.caretakerPhone}) right now?
              </p>
            </div>

            {emergencyAlertSent ? (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-emerald-950 border-2 border-emerald-400 text-emerald-200 font-black text-xl"
              >
                ✓ Alert Sent to Sarah! She has been notified.
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendEmergencyAlert}
                  className="touch-target w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-2xl shadow-xl border-2 border-rose-400 transition transform active:scale-95"
                >
                  Yes, Send Urgent Alert!
                </button>

                <a
                  href={`tel:${profile.emergencyPhone}`}
                  className="touch-target block w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xl border-2 border-slate-600 transition"
                >
                  Dial Emergency Services ({profile.emergencyPhone})
                </a>

                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="touch-target w-full py-3 text-slate-400 hover:text-white font-bold text-lg"
                >
                  Cancel / Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
