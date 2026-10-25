import React from 'react';
import {
  HeartPulse,
  Volume2,
  VolumeX,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Building2,
  Activity,
  Mic,
  Zap,
  Sparkles,
  Sliders,
  Radio,
  Brain,
} from 'lucide-react';
import { jarvisVoice } from '../utils/speechEngine';

interface HospitalHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerSos: () => void;
  activeDispatchesCount: number;
  onOpenVoiceStudio?: () => void;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onTriggerSos,
  activeDispatchesCount,
  onOpenVoiceStudio,
}) => {
  const [currentTime, setCurrentTime] = React.useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const voiceName = jarvisVoice.getVoiceName();

  return (
    <header className="border-b border-cyan-950 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_20px_rgba(6,182,212,0.1)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Unified Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.35)]">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-base sm:text-lg tracking-wider text-white">
                  J.A.R.V.I.S.
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  DUAL-CORE OS
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  ST. JUDE METRO // TRAUMA LVL 1
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                <span className="text-cyan-400 font-semibold">EXECUTIVE ASSISTANT</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">HOSPITAL MEDINAV CARE</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1 text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  KIOSK 1 & MOBILE
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Emergency SOS Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onTriggerSos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SOS ALERT</span>
            </button>
          </div>
        </div>

        {/* Live Metrics, Voice Studio Trigger, Sound, and SOS (Desktop & Tablet) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3">
          {/* Active Doctor Dispatch Badge or Roster Status */}
          {activeDispatchesCount > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <Activity className="w-4 h-4 text-rose-400 animate-spin" />
              <span>{activeDispatchesCount} DOCTOR{activeDispatchesCount > 1 ? 'S' : ''} DISPATCHED</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>6 DOCTORS ON-CALL</span>
            </div>
          )}

          {/* Male Voice Studio Trigger */}
          <button
            onClick={onOpenVoiceStudio}
            title="Configure Jarvis Male Voice, Pitch & Rate"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-cyan-300 text-xs font-mono transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline truncate max-w-[120px] font-semibold">{voiceName}</span>
            <span className="sm:hidden font-semibold">VOICE</span>
            <Sliders className="w-3 h-3 text-slate-400" />
          </button>

          {/* Time Display */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          {/* Voice / Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Verbal Audio Responses' : 'Enable Verbal Voice Responses'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              soundEnabled
                ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-slate-700 text-slate-400 bg-slate-900'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold hidden xs:inline">SPEECH ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold hidden xs:inline">MUTED</span>
              </>
            )}
          </button>

          {/* Instant Emergency SOS Doctor Dispatch Trigger (Desktop) */}
          <button
            onClick={onTriggerSos}
            title="Emergency Doctor Dispatch & Siren: Instantly alerts ER Trauma & Cardiology"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-bold text-xs shadow-[0_0_16px_rgba(244,63,94,0.4)] transition-all active:scale-95"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>RAPID SOS DISPATCH</span>
          </button>
        </div>
      </div>
    </header>
  );
};
