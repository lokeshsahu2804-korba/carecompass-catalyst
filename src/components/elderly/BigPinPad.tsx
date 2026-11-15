import React, { useState, useEffect } from 'react';
import { useCare } from '../../context/CareContext';
import { Delete, KeyRound, Check, AlertCircle, Sparkles } from 'lucide-react';

interface BigPinPadProps {
  onSuccess?: () => void;
}

export const BigPinPad: React.FC<BigPinPadProps> = ({ onSuccess }) => {
  const { loginWithPasscode } = useCare();
  const [pin, setPin] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setFeedback(null);
    if (next.length === 4) {
      verifyPin(next);
    }
  };

  const handleClear = () => {
    setPin('');
    setFeedback(null);
  };

  const verifyPin = (codeToVerify: string) => {
    const result = loginWithPasscode(codeToVerify);
    if (result.success) {
      setFeedback({ message: result.message, isError: false });
      if (onSuccess) onSuccess();
    } else {
      setFeedback({ message: result.message, isError: true });
      // Shake / reset pin on error
      setTimeout(() => setPin(''), 1000);
    }
  };

  const handleSubmit = () => {
    if (pin.length === 0) return;
    verifyPin(pin);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <section
      aria-label="Shared Passcode Login"
      className="max-w-md w-full mx-auto bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 mb-4 shadow-lg">
        <KeyRound className="w-9 h-9" aria-hidden="true" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight">
        Welcome to CareCompass
      </h2>
      <p className="text-sm sm:text-base text-slate-300 text-center mt-1.5 mb-6">
        Tap your 4-digit PIN to access your care dashboard
      </p>

      {/* Screen Reader Live Feedback */}
      <div
        aria-live="polite"
        role="status"
        className="w-full min-h-[3rem] flex items-center justify-center mb-4"
      >
        {feedback ? (
          <div
            className={`w-full p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm sm:text-base font-bold ${
              feedback.isError
                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            }`}
          >
            {feedback.isError ? (
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
              <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        ) : (
          <span className="sr-only">
            {pin.length === 0
              ? 'No digits entered. Enter 4 digits.'
              : `${pin.length} digits entered out of 4.`}
          </span>
        )}
      </div>

      {/* 4-Digit Display Indicator */}
      <div
        className="flex justify-center items-center space-x-4 mb-8"
        aria-label={`PIN entered: ${pin.length} of 4 digits`}
      >
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = idx < pin.length;
          return (
            <div
              key={idx}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                isFilled
                  ? 'bg-teal-400 border-teal-300 scale-110 shadow-lg shadow-teal-500/40'
                  : 'bg-slate-950 border-slate-600'
              }`}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Tactile Big PIN Pad Grid */}
      <div
        className="grid grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-sm mb-6"
        role="group"
        aria-label="Tactile Numerical PIN Pad"
      >
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            aria-label={`Digit ${digit}`}
            className="touch-target min-h-[72px] bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white active:text-slate-950 text-3xl sm:text-4xl font-extrabold rounded-2xl border-2 border-slate-600/80 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear all entered digits"
          className="touch-target min-h-[72px] bg-slate-800 hover:bg-rose-900/60 active:bg-rose-700 text-rose-300 hover:text-white rounded-2xl border-2 border-slate-600/80 transition-all transform active:scale-95 flex flex-col items-center justify-center font-bold text-xs sm:text-sm focus-visible:ring-4 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <Delete className="w-6 h-6 mb-1" aria-hidden="true" />
          <span>Clear</span>
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          aria-label="Digit 0"
          className="touch-target min-h-[72px] bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white active:text-slate-950 text-3xl sm:text-4xl font-extrabold rounded-2xl border-2 border-slate-600/80 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          0
        </button>

        {/* Enter Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pin.length === 0}
          aria-label="Submit entered PIN"
          className={`touch-target min-h-[72px] rounded-2xl border-2 transition-all transform active:scale-95 flex flex-col items-center justify-center font-bold text-xs sm:text-sm focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none ${
            pin.length > 0
              ? 'bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
              : 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
          }`}
        >
          <Check className="w-6 h-6 mb-1" aria-hidden="true" />
          <span>Enter</span>
        </button>
      </div>

      {/* Role Explainer Card for Judges */}
      <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
        <div className="flex items-center space-x-1.5 text-teal-400 font-bold">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Hackathon Judge Credentials:</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-white font-bold block text-sm">👵 Elderly Mode</span>
            <span className="text-slate-300 font-mono text-xs">PIN: 1234</span>
            <span className="text-[11px] text-teal-300 block">Grandma Eleanor</span>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="text-white font-bold block text-sm">🩺 Caretaker Mode</span>
            <span className="text-slate-300 font-mono text-xs">PIN: 9876</span>
            <span className="text-[11px] text-indigo-300 block">Caretaker Sarah</span>
          </div>
        </div>
      </div>
    </section>
  );
};
