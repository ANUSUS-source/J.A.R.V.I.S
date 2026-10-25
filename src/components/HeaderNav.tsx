import React from 'react';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import {
  Shield,
  Activity,
  Volume2,
  VolumeX,
  Tv,
  Palette,
  Terminal,
  FileCode,
  Radar,
  Network,
} from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'cockpit' | 'hud' | 'prompts' | 'radar' | 'topology';
  setActiveTab: (tab: 'cockpit' | 'hud' | 'prompts' | 'radar' | 'topology') => void;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  setThemeColor: (color: 'cyan' | 'amber' | 'emerald' | 'crimson') => void;
  scanlinesEnabled: boolean;
  setScanlinesEnabled: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  callsign: string;
  showBlueprintModal?: boolean;
  setShowBlueprintModal?: (val: boolean) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  themeColor,
  setThemeColor,
  scanlinesEnabled,
  setScanlinesEnabled,
  soundEnabled,
  setSoundEnabled,
  autoSpeak,
  setAutoSpeak,
  callsign,
  showBlueprintModal,
  setShowBlueprintModal,
}) => {
  const handleTabChange = (tab: 'cockpit' | 'hud' | 'prompts' | 'radar' | 'topology') => {
    soundFx.playClick();
    setActiveTab(tab);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundFx.enabled = next;
    setSoundEnabled(next);
    if (!next) {
      soundFx.stopAll();
      jarvisVoice.stop();
    } else {
      soundFx.playClick();
    }
  };

  const handleToggleScanlines = () => {
    soundFx.playClick();
    setScanlinesEnabled(!scanlinesEnabled);
  };

  const handleToggleAutoSpeak = () => {
    soundFx.playClick();
    setAutoSpeak(!autoSpeak);
  };

  const themeColorsList: Array<{ id: 'cyan' | 'amber' | 'emerald' | 'crimson'; label: string; bg: string }> = [
    { id: 'cyan', label: 'Stark Blue', bg: 'bg-cyan-500' },
    { id: 'amber', label: 'Mark XLII Gold', bg: 'bg-amber-500' },
    { id: 'emerald', label: 'Stealth Matrix', bg: 'bg-emerald-500' },
    { id: 'crimson', label: 'Alert Protocol', bg: 'bg-rose-500' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-sm tracking-widest text-white">
                  J.A.R.V.I.S.
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-cyan-500/30 text-cyan-400 font-bold">
                  TACTICAL OS V8.4
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>ONLINE // COMMANDER: {callsign.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Quick HUD Switches on Mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded border text-xs ${
                soundEnabled ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleToggleScanlines}
              className={`p-1.5 rounded border text-xs ${
                scanlinesEnabled ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-500'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Tab Switcher */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabChange('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'cockpit'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-cyan-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            JARVIS COCKPIT
          </button>

          <button
            onClick={() => handleTabChange('hud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'hud'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            AI CHAT TERMINAL
          </button>

          <button
            onClick={() => handleTabChange('prompts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            PROMPT ARCHITECT
          </button>

          <button
            onClick={() => handleTabChange('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'radar'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            RADAR
          </button>

          <button
            onClick={() => handleTabChange('topology')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'topology'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            TOPOLOGY
          </button>

          {setShowBlueprintModal && (
            <button
              onClick={() => {
                soundFx.playHologramPing();
                setShowBlueprintModal(!showBlueprintModal);
              }}
              title="Compare with Original Reference Photo"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-colors whitespace-nowrap"
            >
              📷 PHOTO REF
            </button>
          )}
        </nav>

        {/* HUD Toggles & Color Themes (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme Color Dots */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800">
            {themeColorsList.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  soundFx.playClick();
                  setThemeColor(t.id);
                }}
                title={`Switch HUD Theme: ${t.label}`}
                className={`w-3.5 h-3.5 rounded-full ${t.bg} transition-all ${
                  themeColor === t.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundEnabled ? 'Click to Mute All Sound' : 'Sound is Muted (Click to Unmute)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              soundEnabled
                ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                : 'border-rose-500/50 text-rose-300 bg-rose-500/10'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span className="text-[10px] font-bold">{soundEnabled ? 'SOUND ON' : 'SOUND MUTED'}</span>
          </button>

          {/* Scanline CRT Toggle */}
          <button
            onClick={handleToggleScanlines}
            title={scanlinesEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              scanlinesEnabled
                ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                : 'border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="text-[10px]">CRT</span>
          </button>

          {/* Voice Auto-Speak Toggle */}
          <button
            onClick={handleToggleAutoSpeak}
            title={autoSpeak ? 'Disable Vocal Comm-Link Auto-Speak' : 'Enable Vocal Comm-Link Auto-Speak'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              autoSpeak
                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                : 'border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px]">VOICE</span>
          </button>
        </div>
      </div>
    </header>
  );
};
