import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../../utils/audioEffects';
import { jarvisVoice } from '../../utils/speechEngine';
import {
  Gamepad2,
  X,
  Play,
  RotateCcw,
  Trophy,
  Target,
  Zap,
  ShieldAlert,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type GameAppType = 'ARC_DEFENSE' | 'REFLEX_TRAINER' | 'CYBER_BREACH';

interface GameSubsystemProps {
  onClose: () => void;
  onSendMessage: (text: string) => void;
  soundEnabled?: boolean;
}

interface Drone {
  id: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const GameSubsystem: React.FC<GameSubsystemProps> = ({
  onClose,
  onSendMessage,
  soundEnabled = true,
}) => {
  const [activeGame, setActiveGame] = useState<GameAppType>('ARC_DEFENSE');

  // ARC DEFENSE GAME STATE
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('jarvis_game_high_score')) || 1200;
    } catch {
      return 1200;
    }
  });
  const [coreHealth, setCoreHealth] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(true);

  const dronesRef = useRef<Drone[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const laserBeamRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const nextDroneId = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(Date.now());

  // REFLEX TRAINER STATE
  const [activeTargetIndex, setActiveTargetIndex] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [reflexScore, setReflexScore] = useState<number>(0);
  const [targetSpawnTime, setTargetSpawnTime] = useState<number>(0);
  const [isReflexRunning, setIsReflexRunning] = useState<boolean>(false);

  // CYBER BREACH STATE
  const [hexGrid, setHexGrid] = useState<string[]>([]);
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [breachTimeLeft, setBreachTimeLeft] = useState<number>(30);
  const [isBreached, setIsBreached] = useState<boolean | null>(null);

  // Switch Game
  const handleSwitchGame = (game: GameAppType) => {
    if (soundEnabled) soundFx.playClick();
    setActiveGame(game);
  };

  // --- 1. ARC DEFENSE GAME ENGINE ---
  const restartArcDefense = () => {
    setCoreHealth(100);
    setGameScore(0);
    setIsGameOver(false);
    setIsGameRunning(true);
    dronesRef.current = [];
    particlesRef.current = [];
    if (soundEnabled) soundFx.playArcReactorPowerUp();
  };

  useEffect(() => {
    if (activeGame !== 'ARC_DEFENSE') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localRunning = true;

    const spawnDrone = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Spawn on perimeter
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(canvas.width, canvas.height) / 1.5;
      const x = centerX + Math.cos(spawnAngle) * spawnDist;
      const y = centerY + Math.sin(spawnAngle) * spawnDist;

      // Calculate direction towards center
      const angle = Math.atan2(centerY - y, centerX - x);
      const speed = 1.2 + Math.random() * 1.5;

      dronesRef.current.push({
        id: nextDroneId.current++,
        x,
        y,
        speed,
        angle,
        radius: 10 + Math.random() * 4,
      });
    };

    const render = () => {
      if (!localRunning) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.fillStyle = 'rgba(2, 8, 20, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar rings
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      [60, 120, 180, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Center Arc Reactor Target
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Reactor core inner ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Spawn drones periodically
      if (isGameRunning && !isGameOver && Date.now() - lastSpawnTime.current > 900) {
        spawnDrone();
        lastSpawnTime.current = Date.now();
      }

      // Update & Render Laser Beam
      if (laserBeamRef.current) {
        const { x, y, time } = laserBeamRef.current;
        const elapsed = Date.now() - time;
        if (elapsed < 120) {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00f0ff';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
        } else {
          laserBeamRef.current = null;
        }
      }

      // Update & Render Drones
      dronesRef.current.forEach((drone) => {
        if (!isGameOver) {
          drone.x += Math.cos(drone.angle) * drone.speed;
          drone.y += Math.sin(drone.angle) * drone.speed;
        }

        // Check if drone hit Arc Reactor
        const distToCenter = Math.hypot(drone.x - centerX, drone.y - centerY);
        if (distToCenter < 28 && !isGameOver) {
          // Drone detonated on core!
          setCoreHealth((prev) => {
            const next = Math.max(0, prev - 15);
            if (next <= 0) {
              setIsGameOver(true);
              if (soundEnabled) soundFx.playClick();
              if (soundEnabled) jarvisVoice.speak('Arc Reactor compromised! Defense matrix offline, Sir.');
            }
            return next;
          });
          // Remove drone & add explosion particles
          drone.radius = 0;
          for (let p = 0; p < 15; p++) {
            particlesRef.current.push({
              x: drone.x,
              y: drone.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              alpha: 1,
              color: '#f43f5e',
            });
          }
        }

        // Draw Drone
        if (drone.radius > 0) {
          ctx.save();
          ctx.fillStyle = '#f43f5e';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#f43f5e';
          ctx.beginPath();
          ctx.arc(drone.x, drone.y, drone.radius, 0, Math.PI * 2);
          ctx.fill();

          // Heading line
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(drone.x, drone.y);
          ctx.lineTo(drone.x + Math.cos(drone.angle) * 12, drone.y + Math.sin(drone.angle) * 12);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Filter out destroyed drones
      dronesRef.current = dronesRef.current.filter((d) => d.radius > 0);

      // Update & Render Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      localRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeGame, isGameOver, isGameRunning, soundEnabled]);

  // Click on Canvas to shoot Repulsor Beam
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (soundEnabled) soundFx.playRadarPing();
    laserBeamRef.current = { x: clickX, y: clickY, time: Date.now() };

    // Check hit collision with drones
    let hitCount = 0;
    dronesRef.current.forEach((drone) => {
      const dist = Math.hypot(drone.x - clickX, drone.y - clickY);
      if (dist < drone.radius + 22) {
        drone.radius = 0; // destroyed!
        hitCount++;

        // Spawn explosion particles
        for (let i = 0; i < 18; i++) {
          particlesRef.current.push({
            x: clickX,
            y: clickY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            alpha: 1,
            color: '#00f0ff',
          });
        }
      }
    });

    if (hitCount > 0) {
      const addedPoints = hitCount * 100;
      setGameScore((prev) => {
        const next = prev + addedPoints;
        if (next > highScore) {
          setHighScore(next);
          try {
            localStorage.setItem('jarvis_game_high_score', String(next));
          } catch {}
        }
        return next;
      });
    }
  };

  // --- 2. REFLEX TRAINER LOGIC ---
  const startReflexTrainer = () => {
    setIsReflexRunning(true);
    setReactionTimes([]);
    setReflexScore(0);
    spawnReflexTarget();
    if (soundEnabled) soundFx.playHologramPing();
  };

  const spawnReflexTarget = () => {
    const nextIdx = Math.floor(Math.random() * 9);
    setActiveTargetIndex(nextIdx);
    setTargetSpawnTime(Date.now());
  };

  const handleTargetClick = (index: number) => {
    if (!isReflexRunning || index !== activeTargetIndex) return;
    const elapsed = Date.now() - targetSpawnTime;
    if (soundEnabled) soundFx.playClick();

    setReactionTimes((prev) => [...prev, elapsed]);
    setReflexScore((prev) => prev + Math.max(10, 500 - elapsed));

    if (reactionTimes.length >= 7) {
      setIsReflexRunning(false);
      setActiveTargetIndex(null);
      if (soundEnabled) jarvisVoice.speak('Reflex assessment completed, Sir. Exceptional target acquisition.');
    } else {
      spawnReflexTarget();
    }
  };

  const avgReflex =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : null;

  // --- 3. CYBER BREACH PUZZLE ---
  useEffect(() => {
    if (activeGame === 'CYBER_BREACH') {
      resetCyberBreach();
    }
  }, [activeGame]);

  const resetCyberBreach = () => {
    const hexPool = ['7A', '1C', 'E9', '55', 'BD', 'FF', '00', 'A2', '3F', '6C'];
    const shuffled: string[] = [];
    for (let i = 0; i < 16; i++) {
      shuffled.push(hexPool[Math.floor(Math.random() * hexPool.length)]);
    }
    setHexGrid(shuffled);

    // Pick 3 target keys
    const seq = [
      shuffled[Math.floor(Math.random() * 5)],
      shuffled[5 + Math.floor(Math.random() * 5)],
      shuffled[10 + Math.floor(Math.random() * 5)],
    ];
    setTargetSequence(seq);
    setUserSequence([]);
    setBreachTimeLeft(25);
    setIsBreached(null);
  };

  const handleHexClick = (val: string) => {
    if (isBreached !== null) return;
    if (soundEnabled) soundFx.playClick();

    const next = [...userSequence, val];
    setUserSequence(next);

    // Check match
    const currentTarget = targetSequence[next.length - 1];
    if (val !== currentTarget) {
      setIsBreached(false);
      if (soundEnabled) jarvisVoice.speak('Cipher mismatch. Cryptographic lockdown initiated.');
      return;
    }

    if (next.length === targetSequence.length) {
      setIsBreached(true);
      if (soundEnabled) soundFx.playHologramPing();
      if (soundEnabled) jarvisVoice.speak('Firewall breached. Classified Stark overrides unlocked.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-mono select-none">
      <div className="max-w-5xl w-full h-[88vh] hud-panel rounded-2xl border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-cyan-500/40 bg-cyan-950/80">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-5 h-5 text-cyan-300 animate-pulse" />
            <div>
              <span className="font-orbitron font-bold text-xs sm:text-sm text-white tracking-wider block">
                SUBSYSTEM: [GAME] STARK TACTICAL COMBAT &amp; SIMULATION MATRIX
              </span>
              <span className="text-[10px] text-cyan-400">
                ACTIVE COMPETITION OVERCLOCK // 3 RUNNABLE SIMULATION GAMES
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game App Tabs */}
        <div className="px-3 py-2 bg-black/70 border-b border-cyan-500/30 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ARC_DEFENSE', label: 'ARC_DEFENSE.exe', icon: Zap, desc: 'Tower Defense Repulsor Game' },
            { id: 'REFLEX_TRAINER', label: 'NEURAL_REFLEX_TRAINER.exe', icon: Target, desc: 'Millisecond Aim Test' },
            { id: 'CYBER_BREACH', label: 'CYBER_WARFARE_BREACH.exe', icon: ShieldAlert, desc: 'Cryptographic Decryption' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchGame(tab.id as GameAppType)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] font-black'
                    : 'border-slate-800 bg-black/60 text-slate-400 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. ARC DEFENSE GAME VIEW */}
        {activeGame === 'ARC_DEFENSE' && (
          <div className="flex-1 p-3 flex flex-col bg-black/90 overflow-hidden relative">
            {/* Top Game Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-white font-bold font-orbitron">
                  SCORE: <span className="text-cyan-300">{gameScore}</span>
                </span>
                <span className="text-slate-400 font-bold font-orbitron">
                  HIGH SCORE: <span className="text-amber-400">{highScore}</span>
                </span>
              </div>

              {/* Core Health Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">ARC CORE HEALTH:</span>
                <div className="w-32 h-3.5 bg-black rounded border border-cyan-500/40 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      coreHealth > 50 ? 'bg-emerald-400' : coreHealth > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${coreHealth}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-cyan-300">{coreHealth}%</span>
              </div>

              <button
                onClick={restartArcDefense}
                className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restart</span>
              </button>
            </div>

            {/* Playable Canvas Container */}
            <div className="flex-1 relative flex items-center justify-center bg-[#020814] rounded-xl overflow-hidden border border-cyan-500/30">
              <canvas
                ref={canvasRef}
                width={760}
                height={460}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair"
              />

              {/* Game Over Overlay */}
              {isGameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                  <span className="text-2xl font-black font-orbitron text-rose-500 tracking-widest drop-shadow-[0_0_15px_#f43f5e]">
                    ARC CORE COMPROMISED
                  </span>
                  <p className="text-xs text-slate-300">
                    Final Tactical Score: <span className="text-cyan-300 font-bold">{gameScore}</span> points
                  </p>
                  <button
                    onClick={restartArcDefense}
                    className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.6)] cursor-pointer"
                  >
                    Reboot Defense Matrix
                  </button>
                </div>
              )}

              {/* Instructions watermark */}
              <div className="absolute bottom-2 left-2 text-[9px] text-cyan-600/70 pointer-events-none">
                CLICK / TAP TO FIRE REPULSOR CANNON AT INCOMING HOSTILE DRONES
              </div>
            </div>
          </div>
        )}

        {/* 2. NEURAL REFLEX TRAINER */}
        {activeGame === 'REFLEX_TRAINER' && (
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/80 space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold font-orbitron text-white">NEURAL TARGET REFLEX ACQUISITION</h4>
              <p className="text-xs text-slate-400">Click glowing nodes as rapidly as possible to calibrate reaction speed</p>
            </div>

            <div className="flex items-center gap-6 text-xs font-orbitron">
              <span>SCORE: <strong className="text-cyan-300">{reflexScore}</strong></span>
              <span>AVG SPEED: <strong className="text-emerald-300">{avgReflex ? `${avgReflex} ms` : '--'}</strong></span>
              <span>ROUNDS: <strong className="text-white">{reactionTimes.length} / 8</strong></span>
            </div>

            {/* 3x3 Target Grid */}
            <div className="grid grid-cols-3 gap-3 w-72 h-72">
              {Array.from({ length: 9 }).map((_, i) => {
                const isTarget = activeTargetIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleTargetClick(i)}
                    className={`rounded-2xl border transition-all duration-100 flex items-center justify-center cursor-pointer ${
                      isTarget
                        ? 'bg-rose-500 border-white shadow-[0_0_30px_#f43f5e] scale-105 animate-pulse'
                        : 'bg-black/60 border-cyan-500/20 hover:border-cyan-500/50'
                    }`}
                  >
                    <Target className={`w-6 h-6 ${isTarget ? 'text-white' : 'text-slate-700'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={startReflexTrainer}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
              >
                {isReflexRunning ? 'Restart Test' : 'Start Reflex Benchmark'}
              </button>
            </div>
          </div>
        )}

        {/* 3. CYBER BREACH PUZZLE */}
        {activeGame === 'CYBER_BREACH' && (
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/80 space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold font-orbitron text-white">STARK CRYPTOGRAPHIC FIREWALL BREACH</h4>
              <p className="text-xs text-slate-400">Match the target sequence to decrypt classified mainframe overrides</p>
            </div>

            {/* Target Sequence */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black border border-cyan-500/40">
              <span className="text-[10px] text-slate-400">TARGET CIPHER:</span>
              {targetSequence.map((hex, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-lg font-bold font-orbitron text-xs ${
                    userSequence[i] === hex
                      ? 'bg-emerald-500 text-black shadow-[0_0_10px_#10b981]'
                      : 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                  }`}
                >
                  {hex}
                </span>
              ))}
            </div>

            {/* Hexadecimal Grid */}
            <div className="grid grid-cols-4 gap-2 w-72">
              {hexGrid.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHexClick(val)}
                  className="h-12 rounded-lg bg-black border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 font-orbitron font-bold text-xs hover:bg-cyan-950/60 active:scale-95 cursor-pointer shadow-sm transition-all"
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Result Status */}
            {isBreached === true && (
              <div className="text-center p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs animate-in fade-in">
                ✓ FIREWALL BREACHED! STARK OVERRIDE CODE: <strong>STARK-ALPHA-8849</strong>
              </div>
            )}
            {isBreached === false && (
              <div className="text-center p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs animate-in fade-in">
                ✕ CIPHER MISMATCH // BUFFER CORRUPTED
              </div>
            )}

            <button
              onClick={resetCyberBreach}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Generate New Cipher
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 border-t border-cyan-500/30 bg-black/90 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-cyan-400">TACTICAL GAME MATRIX // OVERCLOCKING AT 98% PROCESSOR LOAD</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-cyan-500 text-black font-bold text-xs cursor-pointer"
          >
            Close Game Subsystem
          </button>
        </div>
      </div>
    </div>
  );
};
