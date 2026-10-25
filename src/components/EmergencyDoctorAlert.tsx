import React, { useEffect, useState } from 'react';
import { EmergencyTriageAlert } from '../types/hospital';
import {
  AlertTriangle,
  Siren,
  UserCheck,
  Radio,
  CheckCircle2,
  X,
  PhoneCall,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface EmergencyDoctorAlertProps {
  alert: EmergencyTriageAlert;
  onDismiss: () => void;
}

export const EmergencyDoctorAlert: React.FC<EmergencyDoctorAlertProps> = ({
  alert,
  onDismiss,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(75);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatEta = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCodeRed = alert.severity === 'CODE_RED';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-2xl relative overflow-hidden ${
        isCodeRed
          ? 'bg-gradient-to-br from-rose-950/90 via-slate-950/95 to-red-950/90 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
          : 'bg-gradient-to-br from-amber-950/90 via-slate-950/95 to-orange-950/90 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
      }`}
    >
      {/* Background Pulse Animation */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse" />

      {/* Alert Header */}
      <div className="flex items-start justify-between gap-3 relative z-10 pb-3 border-b border-rose-500/30">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border animate-bounce ${
              isCodeRed
                ? 'bg-rose-600 border-rose-300 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                : 'bg-amber-600 border-amber-300 text-white'
            }`}
          >
            <Siren className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isCodeRed
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {alert.severity.replace('_', ' ')}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                PAGED AT: {alert.timestamp}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{alert.headline}</span>
            </h3>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss Alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Alert Body */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
        {/* Left: Dispatched Doctors Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-rose-300">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              ON-CALL PHYSICIANS DISPATCHED (LIVE ROSTER):
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ARRIVING IN ~{formatEta(secondsRemaining)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {alert.doctorsDispatched.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-3 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-white">{doc.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold">
                      {doc.pager}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300 mt-0.5">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{doc.department}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    EN ROUTE TO KIOSK 1
                  </span>
                  <span className="text-slate-300 font-bold">ETA: {doc.etaMinutes || '1-2m'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reported Symptoms Tags */}
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 font-bold">
              REPORTED SYMPTOMS TRANSMITTED TO CLINICAL PAGER:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {alert.patientSymptoms.map((symp, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-rose-500/20 border border-rose-500/40 text-rose-200 font-semibold"
                >
                  ⚠ {symp}
                </span>
              ))}
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                📍 Location: Atrium Kiosk 1
              </span>
            </div>
          </div>
        </div>

        {/* Right: Immediate Patient Care Protocol */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-xl p-4 border border-rose-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>IMMEDIATE SAFETY ACTIONS:</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {alert.immediateCareAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-500/30 border border-rose-400/50 text-rose-300 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{advice}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Trauma Triage Logged
            </span>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors"
            >
              Medical Staff Arrived
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
