import React, { useState, useEffect } from 'react';
import { soundFx } from '../utils/audioEffects';
import { Timer, AlertTriangle, Play, Pause, RotateCcw, CheckSquare, Square, Zap, Bug, Sparkles, Network } from 'lucide-react';

interface WarRoomSprintProps {
  onQuickAction: (actionText: string) => void;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
}

export const WarRoomSprint: React.FC<WarRoomSprintProps> = ({ onQuickAction, themeColor }) => {
  // 4 hour default hackathon emergency sprint (4 * 3600 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4 * 3600 - 18);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [milestones, setMilestones] = useState([
    { id: 1, text: 'Core Engine & Scaffolding', done: true },
    { id: 2, text: 'Real-time Optical Visual HUD', done: true },
    { id: 3, text: 'API Failure Mock Fallback', done: true },
    { id: 4, text: 'Competitor Differentiator Vector', done: false },
    { id: 5, text: '3-Minute Winning Pitch Script', done: false },
  ]);

  useEffect(() => {
    let interval: any;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    soundFx.playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    soundFx.playClick();
    setSecondsRemaining(4 * 3600);
  };

  const toggleMilestone = (id: number) => {
    soundFx.playClick();
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    );
  };

  const completedCount = milestones.filter((m) => m.done).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  const quickDirectives = [
    {
      title: 'Emergency 401 / API Bypass',
      icon: Bug,
      prompt: 'Jarvis, the API returned a 401 error and the judge demo is in 2 hours. Generate the emergency mock sandbox bypass handler immediately.',
      badge: 'HOTFIX',
    },
    {
      title: '3-Minute Winning Pitch Hook',
      icon: Sparkles,
      prompt: 'Jarvis, generate our 3-minute executive pitch deck hook for the hackathon judges. Emphasize our real-time interactive visual architecture over competitor slides.',
      badge: 'PITCH',
    },
    {
      title: 'Competitor Vulnerability Audit',
      icon: AlertTriangle,
      prompt: 'Jarvis, execute a comprehensive vulnerability scan on our hackathon competitors. Where are their architectural failure points and how do we exploit them?',
      badge: 'RADAR',
    },
    {
      title: 'System Topology Blueprint',
      icon: Network,
      prompt: 'Jarvis, draw out our full system architecture and data flow using high-density ASCII node boxes so judges can see our engineering rigor.',
      badge: 'ARCH',
    },
  ];

  return (
    <div className="relative flex flex-col p-4 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-200">
          <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>WAR-ROOM SPRINT CONTROL</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/40 text-amber-400">
          COUNTDOWN ACTIVE
        </span>
      </div>

      {/* Countdown Timer Display */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-3 gap-3">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            HACKATHON / SPRINT TIME REMAINING
          </div>
          <div className="text-2xl sm:text-3xl font-black font-orbitron text-amber-400 tracking-wider">
            {formatTime(secondsRemaining)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono font-bold transition-all"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'HOLD' : 'RESUME'}
          </button>
          <button
            onClick={resetTimer}
            title="Reset to 4 Hours"
            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sprint Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>SPRINT COMPLETION VECTOR</span>
          <span className="text-cyan-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checkpoints Checklist */}
      <div className="space-y-1.5 mb-4">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          CRITICAL MILESTONES
        </div>
        {milestones.map((m) => (
          <div
            key={m.id}
            onClick={() => toggleMilestone(m.id)}
            className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono cursor-pointer border transition-colors ${
              m.done
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {m.done ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className={m.done ? 'line-through opacity-80' : ''}>{m.text}</span>
            </div>
            <span className="text-[10px] font-bold opacity-60">
              {m.done ? 'READY' : 'PENDING'}
            </span>
          </div>
        ))}
      </div>

      {/* Tactical Quick Directives */}
      <div>
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          TACTICAL DIRECTIVE SHORTCUTS
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickDirectives.map((d, idx) => {
            const Icon = d.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  soundFx.playHologramPing();
                  onQuickAction(d.prompt);
                }}
                className="group flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-left transition-all"
              >
                <div className="p-1 rounded bg-slate-800 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 transition-colors mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {d.title}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded border border-slate-700 text-slate-400">
                      {d.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    Click to execute through J.A.R.V.I.S.
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
