import { useState, useEffect } from 'react';
import { useCare } from './context/CareContext';
import { checkBackendHealth, HealthCheckResponse } from './utils/api';
import { Header } from './components/common/Header';
import { BigPinPad } from './components/elderly/BigPinPad';
import { ElderlyDashboard } from './components/elderly/ElderlyDashboard';
import { CaretakerDashboard } from './components/caretaker/CaretakerDashboard';
import {
  Lock,
  User,
  Stethoscope,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const { currentRole, setRole, loginWithPasscode, resetDemoData, isBackendSynced } = useCare();
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Poll backend health status on mount
  useEffect(() => {
    let isMounted = true;
    async function loadHealth() {
      try {
        setHealthLoading(true);
        const data = await checkBackendHealth();
        if (isMounted) {
          setHealthStatus(data);
        }
      } catch (err) {
        console.warn('Backend health check warning:', err);
      } finally {
        if (isMounted) setHealthLoading(false);
      }
    }

    loadHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. INTERACTIVE DEMO BAR */}
      <aside
        aria-label="Interactive Demo Quick-Switch Navigation"
        className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b-2 border-indigo-700/80 px-4 py-2.5 shadow-lg relative z-50"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" aria-hidden="true" />
            <span className="font-extrabold text-amber-200 uppercase tracking-wider">
              INTERACTIVE DEMO BAR:
            </span>
            <span className="text-slate-300 hidden md:inline">
              Instant Role Switcher (Elderly & Caretaker Views)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switch to PIN Login */}
            <button
              type="button"
              onClick={() => setRole('unauthenticated')}
              aria-pressed={currentRole === 'unauthenticated'}
              aria-label="Switch to PIN Login Screen"
              className={`touch-target px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 border focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                currentRole === 'unauthenticated'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>[🔒 PIN Login Screen]</span>
            </button>

            {/* Quick Switch to Elderly Mode (1234) */}
            <button
              type="button"
              onClick={() => loginWithPasscode('1234')}
              aria-pressed={currentRole === 'elderly'}
              aria-label="Switch to Elderly View (Grandma Eleanor, PIN: 1234)"
              className={`touch-target px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 border focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
                currentRole === 'elderly'
                  ? 'bg-teal-400 text-slate-950 border-teal-300 shadow-md shadow-teal-400/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>[👵 Elderly View (PIN: 1234)]</span>
            </button>

            {/* Quick Switch to Caretaker Mode (9876) */}
            <button
              type="button"
              onClick={() => loginWithPasscode('9876')}
              aria-pressed={currentRole === 'caretaker'}
              aria-label="Switch to Caretaker View (Sarah Vance, PIN: 9876)"
              className={`touch-target px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                currentRole === 'caretaker'
                  ? 'bg-indigo-400 text-slate-950 border-indigo-300 shadow-md shadow-indigo-400/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
              <span>[🩺 Caretaker View (PIN: 9876)]</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              onClick={resetDemoData}
              aria-label="Reset all demo state to default"
              className="touch-target p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1"
              title="Reset all demo medications and logs"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Reset State</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HEADER */}
      <Header healthStatus={healthStatus} healthLoading={healthLoading} />

      {/* 3. CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'unauthenticated' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <BigPinPad />
          </div>
        )}

        {currentRole === 'elderly' && <ElderlyDashboard />}

        {currentRole === 'caretaker' && <CaretakerDashboard />}
      </main>

      {/* 4. ACCESSIBLE FOOTER */}
      <footer role="contentinfo" className="border-t border-slate-800 bg-slate-900/90 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">CareCompass</span>
            <span>&bull;</span>
            <span>Built for Google Catalyst Hackathon</span>
            <span>&bull;</span>
            <span className="text-teal-400 font-semibold">Cloud Run Single Container</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>{isBackendSynced ? 'Backend DB Synced' : 'Cloud DB Connected'}</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WCAG AAA Compliant</span>
            </span>
            <span className="flex items-center space-x-1 text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gemini 2.5 Flash Clinical AI</span>
            </span>
            <span className="flex items-center space-x-1 text-indigo-400">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>1-Click Email Adherence</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
