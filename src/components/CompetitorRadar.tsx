import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audioEffects';
import { Radar, ShieldAlert, Target, Plus, Check, Eye } from 'lucide-react';

export interface Competitor {
  id: string;
  name: string;
  techStack: string;
  threatLevel: 'CRITICAL' | 'ELEVATED' | 'NOMINAL';
  distance: number; // 0.1 to 0.9 from center
  angle: number; // degrees 0 - 360
  vulnerability: string;
  counterTactic: string;
  completionScore: number;
}

const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: 'c1',
    name: 'Team ApexCognition',
    techStack: 'Next.js 15, FastAPI, LangGraph, Pinecone',
    threatLevel: 'CRITICAL',
    distance: 0.38,
    angle: 45,
    vulnerability: 'Complex multi-agent pipeline prone to 15s latency timeouts during live judging.',
    counterTactic: 'Emphasize our instantaneous sub-50ms reactive HUD and zero-failure reliability.',
    completionScore: 84,
  },
  {
    id: 'c2',
    name: 'NeuralHustle Devs',
    techStack: 'React, Firebase, OpenAI API, Tailwind',
    threatLevel: 'ELEVATED',
    distance: 0.65,
    angle: 140,
    vulnerability: 'Generic SaaS template styling; pitch lacks visceral real-time visual punch.',
    counterTactic: 'Demolish their visual presence with our animated sci-fi tactile terminal and voice link.',
    completionScore: 68,
  },
  {
    id: 'c3',
    name: 'ByteRunners Global',
    techStack: 'Flutter, Express, Supabase',
    threatLevel: 'NOMINAL',
    distance: 0.82,
    angle: 260,
    vulnerability: 'Struggling with cross-platform mobile demo deployment on stage.',
    counterTactic: 'Our web app works seamlessly anywhere with zero configuration.',
    completionScore: 52,
  },
  {
    id: 'c4',
    name: 'CyberSyndicate',
    techStack: 'Rust, WebAssembly, WebRTC',
    threatLevel: 'ELEVATED',
    distance: 0.52,
    angle: 310,
    vulnerability: 'Heavy tech complexity with minimal user empathy or business pitch narrative.',
    counterTactic: 'Bridge technical depth with our crisp 3-minute executive narrative hook.',
    completionScore: 76,
  },
];

interface CompetitorRadarProps {
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  onSelectCompetitor?: (c: Competitor) => void;
}

export const CompetitorRadar: React.FC<CompetitorRadarProps> = ({ themeColor, onSelectCompetitor }) => {
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [selected, setSelected] = useState<Competitor | null>(INITIAL_COMPETITORS[0]);
  const [isScanning, setIsScanning] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newStack, setNewStack] = useState('');
  const [newThreat, setNewThreat] = useState<'CRITICAL' | 'ELEVATED' | 'NOMINAL'>('ELEVATED');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef<number>(0);

  const themeFill = {
    cyan: '#06b6d4',
    amber: '#f59e0b',
    emerald: '#10b981',
    crimson: '#f43f5e',
  }[themeColor];

  // Draw Canvas Radar sweep loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 10;

      ctx.clearRect(0, 0, w, h);

      // Radar Background circle
      ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rings
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Sweeping beam
      const currentAngleRad = (angleRef.current * Math.PI) / 180;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `${themeFill}00`);
      gradient.addColorStop(1, `${themeFill}40`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, currentAngleRad - 0.45, currentAngleRad);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Beam lead line
      ctx.strokeStyle = themeFill;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(currentAngleRad) * radius, cy + Math.sin(currentAngleRad) * radius);
      ctx.stroke();
      ctx.restore();

      // Draw Competitor Blips
      competitors.forEach((c) => {
        const rad = (c.angle * Math.PI) / 180;
        const bx = cx + Math.cos(rad) * (radius * c.distance);
        const by = cy + Math.sin(rad) * (radius * c.distance);

        const isTarget = selected?.id === c.id;

        // Blip color based on threat
        const blipColor =
          c.threatLevel === 'CRITICAL'
            ? '#ef4444'
            : c.threatLevel === 'ELEVATED'
            ? '#f59e0b'
            : '#10b981';

        // Outer pulse circle
        ctx.strokeStyle = blipColor;
        ctx.lineWidth = isTarget ? 2 : 1;
        ctx.beginPath();
        ctx.arc(bx, by, isTarget ? 8 : 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = blipColor;
        ctx.beginPath();
        ctx.arc(bx, by, isTarget ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = isTarget ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(c.name.split(' ')[0], bx + 8, by + 3);
      });

      // Update angle
      angleRef.current = (angleRef.current + 1.6) % 360;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [competitors, selected, themeFill]);

  const handleSelect = (c: Competitor) => {
    soundFx.playClick();
    setSelected(c);
    if (onSelectCompetitor) onSelectCompetitor(c);
  };

  const handleTriggerScan = () => {
    soundFx.playRadarPing();
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 800);
  };

  const handleAddCompetitor = () => {
    if (!newTeamName.trim()) return;
    soundFx.playHologramPing();
    const newComp: Competitor = {
      id: `c_${Date.now()}`,
      name: newTeamName.trim(),
      techStack: newStack.trim() || 'Modern AI Stack',
      threatLevel: newThreat,
      distance: 0.4 + Math.random() * 0.45,
      angle: Math.floor(Math.random() * 360),
      vulnerability: 'Standard architectural pattern with standard AI prompt wrappers.',
      counterTactic: 'Deliver bespoke system intelligence with real-time visual presence and faster iteration.',
      completionScore: 60,
    };
    setCompetitors((prev) => [newComp, ...prev]);
    setSelected(newComp);
    setNewTeamName('');
    setNewStack('');
    setShowAddModal(false);
  };

  return (
    <div className="relative flex flex-col p-4 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-200">
          <Radar className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>COMPETITOR TELEMETRY RADAR</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScan}
            title="Perform 360 tactical re-scan"
            className="px-2 py-0.5 rounded text-[10px] font-mono border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            {isScanning ? 'PINGING...' : 'RE-SCAN'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            title="Log new competitor"
            className="p-1 rounded text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Radar Canvas + Competitor Dossier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Canvas Radar Container */}
        <div className="relative flex items-center justify-center p-1 bg-black/50 rounded-xl border border-slate-900 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            className="rounded-lg max-w-full aspect-square"
          />
          <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400">
            RANGE: 500M // 360° SWEEP
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400">
            {competitors.length} RIVALS TRACKED
          </div>
        </div>

        {/* Selected Competitor Dossier */}
        <div className="flex flex-col justify-between h-full bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 text-xs font-mono">
          {selected ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">TARGET IDENTIFIER</div>
                  <div className="text-sm font-bold text-white font-orbitron">{selected.name}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selected.threatLevel === 'CRITICAL'
                      ? 'border-red-500/40 text-red-400 bg-red-500/10'
                      : selected.threatLevel === 'ELEVATED'
                      ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                      : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  }`}
                >
                  THREAT: {selected.threatLevel}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">ESTIMATED STACK:</span>
                <p className="text-[11px] text-cyan-300 font-mono mt-0.5 truncate">{selected.techStack}</p>
              </div>

              <div className="p-2 rounded bg-red-950/20 border border-red-500/20">
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                  <ShieldAlert className="w-3 h-3" />
                  DETECTED VULNERABILITY:
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {selected.vulnerability}
                </p>
              </div>

              <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20">
                <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold">
                  <Target className="w-3 h-3" />
                  JARVIS COUNTER-TACTIC:
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {selected.counterTactic}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Select a target blip on the radar to inspect vulnerability telemetry
            </div>
          )}
        </div>
      </div>

      {/* Competitor Quick Selector Bar */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">TARGETS:</span>
        {competitors.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c)}
            className={`px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all border ${
              selected?.id === c.id
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between border border-cyan-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-2">
              <span>REGISTER COMPETITOR IN RADAR</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">TEAM / RIVAL NAME</label>
              <input
                type="text"
                placeholder="e.g. Project Matrix 9"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">KNOWN TECH STACK</label>
              <input
                type="text"
                placeholder="e.g. Next.js, Python, Supabase, Tailwind"
                value={newStack}
                onChange={(e) => setNewStack(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">THREAT SEVERITY</label>
              <div className="grid grid-cols-3 gap-2">
                {(['NOMINAL', 'ELEVATED', 'CRITICAL'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewThreat(t)}
                    className={`py-1 rounded text-[10px] font-mono border ${
                      newThreat === t
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompetitor}
              className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-black flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Lock Vector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
