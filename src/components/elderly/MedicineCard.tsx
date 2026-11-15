import React, { useState } from 'react';
import { ScheduledDose } from '../../types';
import { useCare } from '../../context/CareContext';
import { getSimpleGuidance } from '../../utils/api';
import { CheckCircle2, Clock, Sparkles, Volume2, Pill, Loader2 } from 'lucide-react';

interface MedicineCardProps {
  dose: ScheduledDose;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ dose }) => {
  const { markDoseTaken, updateGuidance } = useCare();
  const [loadingAi, setLoadingAi] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  const isTaken = dose.status === 'taken';

  const handleMarkTaken = () => {
    if (!isTaken) {
      markDoseTaken(dose.id, 'elderly_pin_pad');
    }
  };

  const handleAskGemini = async () => {
    try {
      setLoadingAi(true);
      const res = await getSimpleGuidance(
        dose.medicationName,
        dose.dosage,
        dose.instructions,
        'Senior health management'
      );
      if (res.simpleGuidance) {
        updateGuidance(dose.medicationId, res.simpleGuidance);
      }
    } catch (err) {
      console.error('Failed to refresh AI guidance:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSpeakAloud = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToRead = `${dose.medicationName}, ${dose.dosage}. Scheduled for ${dose.scheduledTime}. ${dose.simpleGuidance || dose.instructions}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9; // gentle and slow for senior comprehension
      utterance.onstart = () => setSpeechActive(true);
      utterance.onend = () => setSpeechActive(false);
      utterance.onerror = () => setSpeechActive(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <article
      role="listitem"
      aria-label={`${dose.medicationName} ${dose.dosage}, scheduled for ${dose.scheduledTime}, status: ${dose.status}`}
      className={`rounded-3xl border-3 p-5 sm:p-7 transition-all duration-300 shadow-xl ${
        isTaken
          ? 'bg-slate-900/90 border-emerald-500/80 shadow-emerald-950/20'
          : 'bg-slate-900 border-teal-500/80 shadow-teal-950/20 hover:border-teal-400'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Medicine Information & Visual Pill Shape */}
        <div className="flex items-start space-x-4 sm:space-x-5">
          {/* Large Pill Icon with High-Contrast Indicator */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 shrink-0 ${
              isTaken
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                : 'bg-teal-950/90 border-teal-400 text-teal-300'
            }`}
            aria-hidden="true"
          >
            {isTaken ? (
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" />
            ) : (
              <Pill className="w-10 h-10 sm:w-12 sm:h-12 text-teal-300" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {dose.medicationName}
              </h3>
              <span className="text-base sm:text-lg font-bold px-3 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                {dose.dosage}
              </span>
              <span className="text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {dose.pillShape}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm sm:text-base">
              <Clock className="w-4 h-4 text-teal-400" aria-hidden="true" />
              <span>Scheduled: {dose.scheduledTime}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{dose.instructions}</span>
            </div>

            {/* AI Comfort Guidance Box */}
            <div className="pt-2">
              <div className="bg-slate-950 border-2 border-teal-900/90 rounded-2xl p-3.5 sm:p-4 text-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 text-teal-400 text-xs sm:text-sm font-bold">
                    <Sparkles className="w-4 h-4 text-teal-300" aria-hidden="true" />
                    <span>Gemini Care Guidance:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Read Aloud accessibility feature */}
                    <button
                      type="button"
                      onClick={handleSpeakAloud}
                      aria-label={`Read instructions aloud for ${dose.medicationName}`}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition flex items-center space-x-1 ${
                        speechActive
                          ? 'bg-teal-600 text-slate-950 border-teal-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{speechActive ? 'Speaking...' : 'Read Aloud'}</span>
                    </button>

                    {/* Ask Gemini to Explain Simply button */}
                    <button
                      type="button"
                      onClick={handleAskGemini}
                      disabled={loadingAi}
                      aria-label={`Ask Gemini AI to explain instructions simply for ${dose.medicationName}`}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 transition flex items-center space-x-1"
                    >
                      {loadingAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                      )}
                      <span>Explain Simply</span>
                    </button>
                  </div>
                </div>
                <p className="text-base sm:text-lg font-medium text-teal-100 italic leading-snug">
                  "{dose.simpleGuidance || 'Take with water as directed by your caregiver.'}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Massive 1-Tap Action Button (WCAG AAA Touch Target) */}
        <div className="shrink-0 flex items-center justify-end w-full md:w-auto">
          {isTaken ? (
            <div
              role="status"
              aria-label={`${dose.medicationName} already taken at ${dose.takenAt || 'earlier today'}`}
              className="w-full md:w-auto px-8 py-5 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-200 font-black text-xl sm:text-2xl flex items-center justify-center space-x-3 shadow-lg shadow-emerald-900/30"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              <div>
                <span className="block leading-none">Taken ✓</span>
                <span className="text-xs text-emerald-300 font-medium block mt-1">
                  Logged at {dose.takenAt || 'Today'}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleMarkTaken}
              aria-label={`Mark ${dose.medicationName} ${dose.dosage} as taken for ${dose.scheduledTime}`}
              className="touch-target w-full md:w-auto min-h-[72px] px-8 sm:px-10 py-5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:bg-teal-300 text-slate-950 font-black text-xl sm:text-2xl shadow-xl shadow-teal-500/25 border-3 border-teal-300 transition-all transform active:scale-95 flex items-center justify-center space-x-3 focus-visible:ring-4 focus-visible:ring-teal-300 focus-visible:outline-none"
            >
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
              <span>Tap to Mark as Taken</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

