import React from 'react';
import { useCare } from '../../context/CareContext';
import { HealthCheckResponse } from '../../utils/api';
import { Heart, Server, ShieldCheck, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  healthStatus: HealthCheckResponse | null;
  healthLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ healthStatus, healthLoading }) => {
  const { currentRole, profile, logout, isBackendSynced } = useCare();

  return (
    <header role="banner" className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Mission */}
        <div className="flex items-center space-x-3.5">
          <div
            className="w-12 h-12 rounded-2xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/10"
            aria-hidden="true"
          >
            <Heart className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl font-black tracking-tight text-white">CareCompass</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                Catalyst 2026
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300">Elderly Care & Medication Management Platform</p>
          </div>
        </div>

        {/* Status Indicators & Role Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Backend API & Cloud Run telemetry */}
          <div
            className="hidden md:flex items-center space-x-2 text-xs bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl"
            role="status"
            aria-label="Cloud Run Backend API connection status"
          >
            <Server className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-slate-300">Cloud Run:</span>
            {healthLoading ? (
              <span className="text-amber-400 font-semibold">Connecting...</span>
            ) : healthStatus ? (
              <span className="text-emerald-400 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" aria-hidden="true" />
                Live (Port {healthStatus.port})
              </span>
            ) : (
              <span className="text-rose-400 font-bold">Offline</span>
            )}
          </div>

          {/* Backend DB Synced badge */}
          <div
            className="hidden sm:flex items-center space-x-1.5 text-xs bg-emerald-950/70 border border-emerald-800/80 px-3 py-2 rounded-xl text-emerald-200"
            role="status"
            aria-label="Backend Database Synchronization status"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse" aria-hidden="true" />
            <span className="font-semibold">{isBackendSynced ? 'Backend DB Synced' : 'Cloud DB Connected'}</span>
          </div>

          {/* Gemini AI active badge */}
          <div
            className="hidden lg:flex items-center space-x-1.5 text-xs bg-indigo-950/70 border border-indigo-800/80 px-3 py-2 rounded-xl text-indigo-200"
            role="status"
            aria-label="Gemini AI Assistant status"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span className="font-semibold">Gemini 2.5 Flash Assistant</span>
          </div>

          {/* Active Role Indicator & Switch Button */}
          {currentRole !== 'unauthenticated' && (
            <div className="flex items-center space-x-2.5">
              <div
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs"
                role="status"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <span className="text-slate-200 font-bold capitalize">
                  {currentRole === 'elderly' ? `👵 ${profile.preferredName}` : `🩺 Caretaker (${profile.caretakerName.split(' ')[0]})`}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Lock screen or switch user role"
                className="touch-target px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition flex items-center space-x-1.5 text-xs font-semibold focus-visible:ring-4 focus-visible:ring-teal-400 focus-visible:outline-none"
              >
                <LogOut className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span className="hidden sm:inline">Lock / Switch</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

