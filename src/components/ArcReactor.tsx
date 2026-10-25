import React, { useState } from 'react';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import { Zap, Volume2, ShieldCheck, Flame } from 'lucide-react';

interface ArcReactorProps {
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  isSpeaking: boolean;
  onIgnite?: () => void;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ themeColor, isSpeaking, onIgnite }) => {
  const [outputPower, setOutputPower] = useState(98.6);
  const [temp, setTemp] = useState(33.4);
  const [isOvercharged, setIsOvercharged] = useState(false);

  const colorStyles = {
    cyan: {
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.45)]',
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      fill: '#06b6d4',
      bgGlow: 'bg-cyan-500/10',
    },
    amber: {
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.45)]',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      fill: '#f59e0b',
      bgGlow: 'bg-amber-500/10',
    },
    emerald: {
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.45)]',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      fill: '#10b981',
      bgGlow: 'bg-emerald-500/10',
    },
    crimson: {
      glow: 'shadow-[0_0_50px_rgba(239,68,68,0.45)]',
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      fill: '#f43f5e',
      bgGlow: 'bg-rose-500/10',
    },
  }[themeColor];

  const handleReactorClick = () => {
    soundFx.playArcReactorPowerUp();
    setIsOvercharged(true);
    setOutputPower((prev) => Math.min(100, +(prev + 0.8).toFixed(1)));
    setTemp((prev) => +(prev + 0.5).toFixed(1));

    jarvisVoice.speak('Arc Reactor Mark VIII operating at peak efficiency, Sir. All optical matrices aligned.');

    setTimeout(() => {
      setIsOvercharged(false);
    }, 1500);

    if (onIgnite) onIgnite();
  };

  return (
    <div className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border ${colorStyles.border} bg-slate-950/80 backdrop-blur-xl ${colorStyles.glow} transition-all duration-500`}>
      {/* Top HUD Badge */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 mb-3 border-b border-slate-800/80 pb-2">
        <span className="flex items-center gap-1.5 font-bold">
          <Zap className={`w-3.5 h-3.5 ${colorStyles.text} animate-pulse`} />
          ARC REACTOR CORE // MK-VIII
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorStyles.border} ${colorStyles.text} ${colorStyles.bgGlow}`}>
          {isSpeaking ? 'COMM-LINK ACTIVE' : 'NOMINAL 3.2 GJ'}
        </span>
      </div>

      {/* Main Interactive Reactor Graphic */}
      <div
        onClick={handleReactorClick}
        title="Click to power up Arc Reactor"
        className="group relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {/* Outer Static Calibration Marks */}
        <div className={`absolute inset-0 rounded-full border border-dashed ${colorStyles.border} opacity-50`} />

        {/* Outer Ring Rotating Clockwise */}
        <div className={`absolute inset-2 rounded-full border border-t-2 border-r-2 ${colorStyles.border} animate-spin-slow`} />

        {/* Middle Ring Counter-Clockwise with Segmented dashes */}
        <div className={`absolute inset-5 rounded-full border-2 border-dashed ${colorStyles.border} animate-spin-reverse-slow opacity-80`} />

        {/* 10 Arc Reactor Coils */}
        <div className="absolute inset-8 rounded-full flex items-center justify-center">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3.5 h-8 -top-1 origin-bottom rounded-xs transition-all duration-300 group-hover:scale-110"
              style={{
                transform: `rotate(${i * 36}deg) translateY(-24px)`,
                backgroundColor: isOvercharged ? colorStyles.fill : 'rgba(255,255,255,0.08)',
                boxShadow: isOvercharged ? `0 0 12px ${colorStyles.fill}` : 'none',
                border: `1px solid ${colorStyles.fill}`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>

        {/* Inner Glowing Core */}
        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
            isSpeaking || isOvercharged ? 'scale-110' : 'scale-100'
          }`}
          style={{
            background: `radial-gradient(circle, ${colorStyles.fill} 0%, rgba(3,7,18,0.9) 70%)`,
            boxShadow: `0 0 ${isSpeaking ? '40px' : '22px'} ${colorStyles.fill}`,
          }}
        >
          {/* Triangular Core Inset (Iron Man signature) */}
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              backgroundColor: '#ffffff',
              boxShadow: `0 0 15px #ffffff`,
              opacity: 0.95,
            }}
          />

          <span className="text-[10px] font-bold text-slate-950 mt-1 font-orbitron tracking-tighter">
            {outputPower}%
          </span>
        </div>

        {/* Pulsing Acoustic Waveform Indicator when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-36 h-36 rounded-full border border-dashed ${colorStyles.text} animate-ping opacity-30`} />
            <div className={`w-44 h-44 rounded-full border ${colorStyles.text} animate-ping opacity-20`} style={{ animationDuration: '1.5s' }} />
          </div>
        )}
      </div>

      {/* Real-Time Telemetry Stats below reactor */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center">
        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            OUTPUT
          </div>
          <div className="text-xs font-bold font-orbitron text-slate-200 mt-0.5">{outputPower}%</div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            CORE TEMP
          </div>
          <div className="text-xs font-bold font-orbitron text-slate-200 mt-0.5">{temp}°C</div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            FLUX
          </div>
          <div className="text-xs font-bold font-orbitron text-slate-200 mt-0.5">3.2 GJ</div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-mono mt-3 text-center flex items-center gap-1">
        <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
        Click core to cycle ignition pulse & voice diagnostics
      </div>
    </div>
  );
};
