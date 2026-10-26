import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  MapPin,
  Radio,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Activity,
  Ticket,
  Calendar,
  Volume2,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface PatientWaitingTimeBoxProps {
  doctorName: string;
  specialty: string;
  department?: string;
  location: string;
  floorId?: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4';
  currentWaitingTime: string;
  queueLength?: number;
  tokenNumber?: string;
  priority?: 'CODE_RED' | 'CODE_AMBER' | 'CODE_YELLOW' | 'STANDARD' | 'URGENT' | 'CRITICAL' | 'MODERATE' | 'MILD';
  conditionTitle?: string;
  prepAdvice?: string[];
  pager?: string;
  onPageDoctor?: () => void;
  onViewOnMap?: (floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4') => void;
  compact?: boolean;
}

export const PatientWaitingTimeBox: React.FC<PatientWaitingTimeBoxProps> = ({
  doctorName,
  specialty,
  department = 'Clinical Outpatient Services',
  location,
  floorId = 'L1',
  currentWaitingTime,
  queueLength = 1,
  tokenNumber,
  priority = 'CODE_YELLOW',
  conditionTitle,
  prepAdvice = [
    'Remain seated in the designated consultation waiting lounge.',
    'Keep your ticket token number visible for the clinical attendant chime.',
    'Follow first-aid precautions until the attending physician conducts physical exam.',
  ],
  pager = 'PGR-612',
  onPageDoctor,
  onViewOnMap,
  compact = false,
}) => {
  const [token] = useState(() => {
    if (tokenNumber) return tokenNumber;
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `MED-${randomNum}`;
  });

  const [paged, setPaged] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePage = () => {
    setPaged(true);
    soundFx.playDoctorPagerAlert();
    if (onPageDoctor) {
      onPageDoctor();
    }
  };

  const isEmergency =
    priority === 'CODE_RED' ||
    priority === 'CODE_AMBER' ||
    priority === 'URGENT' ||
    priority === 'CRITICAL';

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden shadow-2xl relative ${
        isEmergency
          ? 'bg-gradient-to-br from-rose-950/90 via-slate-950/95 to-slate-900 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.25)]'
          : 'bg-gradient-to-br from-cyan-950/90 via-slate-950/95 to-slate-900 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
      }`}
    >
      {/* Top Banner Ribbon */}
      <div
        className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
          isEmergency
            ? 'bg-rose-900/40 border-rose-500/40 text-rose-200'
            : 'bg-cyan-950/80 border-cyan-500/30 text-cyan-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-black/50 border border-current text-xs">
            <Ticket className="w-3.5 h-3.5" />
          </div>
          <span className="font-orbitron font-bold text-xs tracking-wider text-white">
            PATIENT ADMISSION & LIVE WAITING TIME
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/60 font-mono text-[11px] text-cyan-300 font-bold border border-cyan-500/40">
            TOKEN: {token}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span
            className={`px-2 py-0.5 rounded-full font-bold ${
              isEmergency
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-cyan-500 text-slate-950'
            }`}
          >
            {priority.replace('_', ' ')}
          </span>
          <span className="text-slate-400 hidden sm:inline">
            CHECK-IN TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Main Wait Time & Queue Status Box */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Condition & Queue Hero Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
          {/* Big Prominent Waiting Time Metric Box */}
          <div className="sm:col-span-5 p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-cyan-400">
                <Clock className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
                ESTIMATED WAIT TIME
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>

            <div className="my-1">
              <div className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white tracking-wide flex items-baseline gap-1.5">
                <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                  {currentWaitingTime}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                <span>Queue Position:</span>
                <span className="text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Patient #{queueLength + 1}
                </span>
                <span className="text-slate-500">({queueLength} ahead)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Time in Queue:</span>
              <span className="text-cyan-300 font-bold">
                {Math.floor(elapsedSecs / 60)}m {elapsedSecs % 60}s
              </span>
            </div>
          </div>

          {/* Assigned Doctor & Facility Location Details */}
          <div className="sm:col-span-7 p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                <span>ASSIGNED ATTENDING PHYSICIAN</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ON-DUTY AVAILABLE
                </span>
              </div>

              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{doctorName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {pager}
                </span>
              </div>

              <div className="text-xs text-cyan-300 font-medium mt-0.5">
                {specialty}
              </div>

              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {department}
              </div>
            </div>

            {/* Room Location & Directions */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold">{location}</span>
              </div>

              {onViewOnMap && (
                <button
                  onClick={() => onViewOnMap(floorId)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline shrink-0"
                >
                  <span>Blueprints Map</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Condition Notice if Provided */}
        {conditionTitle && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 font-mono">Clinical Presentation:</span>
              <span className="font-bold text-white">{conditionTitle}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              TRIAGE RECORDED
            </span>
          </div>
        )}

        {/* Patient Instructions Checklist While Waiting */}
        {!compact && prepAdvice && prepAdvice.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PATIENT INSTRUCTIONS WHILE WAITING:</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-1">
              {prepAdvice.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Controls: Direct Pager & Floor Directions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Hospital Pager Telemetry: <strong className="text-slate-200">Synchronized</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                onClick={() => onViewOnMap(floorId)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show On Floor Map</span>
              </button>
            )}

            <button
              onClick={handlePage}
              disabled={paged}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                paged
                  ? 'bg-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95'
              }`}
            >
              {paged ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Physician Paged!</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Page Doctor Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
