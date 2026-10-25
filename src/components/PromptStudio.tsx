import React, { useState } from 'react';
import { soundFx } from '../utils/audioEffects';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Play,
  Sparkles,
  Sliders,
  Share2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface PromptStudioProps {
  onLoadIntoTerminal: (promptText: string) => void;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
}

export const PromptStudio: React.FC<PromptStudioProps> = ({ onLoadIntoTerminal, themeColor }) => {
  const [competitionName, setCompetitionName] = useState('Global AI Hackathon');
  const [competitionType, setCompetitionType] = useState('Hackathon');
  const [callsign, setCallsign] = useState('Sir');
  const [focusArea, setFocusArea] = useState('Full-Stack Rapid Prototype & Winning Pitch Deck');
  const [visualDensity, setVisualDensity] = useState('High-Density Holographic ASCII HUD');
  const [personality, setPersonality] = useState('British Executive Sophistication & Lethal Competence');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate prompt
  const handleGenerate = async () => {
    soundFx.playHologramPing();
    setIsGenerating(true);

    try {
      const res = await fetch('/api/jarvis/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionName,
          competitionType,
          callsign,
          focusArea,
          visualDensity,
          personality,
        }),
      });

      const data = await res.json();
      if (data.prompt) {
        setGeneratedPrompt(data.prompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Preload default master prompt on first mount
  React.useEffect(() => {
    handleGenerate();
  }, []);

  const handleCopy = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundFx.playClick();
    const blob = new Blob([generatedPrompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JARVIS_${competitionName.replace(/\s+/g, '_')}_Master_Prompt.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestInTerminal = () => {
    soundFx.playHologramPing();
    onLoadIntoTerminal(
      `Jarvis, we just initialized the tactical prompt for ${competitionName}. Please provide your optical diagnostic briefing and confirm our readiness.`
    );
  };

  return (
    <div className="relative flex flex-col p-4 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              MASTER J.A.R.V.I.S. PROMPT ARCHITECT
            </h3>
            <p className="text-[10px] font-mono text-slate-400">
              Generate custom sci-fi screen visual prompts for ChatGPT, Claude, Cursor &amp; Ollama
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-600 text-xs font-mono text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Prompt'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-600 text-xs font-mono text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Save .md
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Competition Name & Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">TARGET ARENA / EVENT</label>
          <input
            type="text"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Competition Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">COMPETITION CATEGORY</label>
          <select
            value={competitionType}
            onChange={(e) => setCompetitionType(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="Hackathon">Hackathon (Fast Prototype & Demo)</option>
            <option value="ICPC">ICPC (Competitive Coding & Algo)</option>
            <option value="Startup Pitch">Startup Pitch (Judges & Traction)</option>
            <option value="Kaggle">Kaggle (ML / Data Science Sprint)</option>
            <option value="CTF">Capture The Flag (Cyber Security)</option>
          </select>
        </div>

        {/* Callsign */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">COMMANDER CALLSIGN</label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            placeholder="e.g. Sir, Boss, Tony"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Visual Density */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">SCREEN VISUAL DENSITY</label>
          <select
            value={visualDensity}
            onChange={(e) => setVisualDensity(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="High-Density Holographic ASCII HUD">High-Density Holographic ASCII HUD</option>
            <option value="Tactile Glassmorphic Telemetry">Tactile Glassmorphic Telemetry</option>
            <option value="War-Room Critical Matrix">War-Room Critical Matrix</option>
            <option value="Cyber Minimalist Terminal">Cyber Minimalist Terminal</option>
          </select>
        </div>

        {/* Primary Focus */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-mono text-slate-400 uppercase">PRIMARY OPERATIONAL FOCUS</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Cpu className="w-3.5 h-3.5 animate-spin-slow" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGenerating ? 'Compiling...' : 'Synthesize'}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Output Preview Box */}
      <div className="relative rounded-xl border border-slate-800 bg-black/90 p-3 overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 border-b border-slate-900 pb-1.5">
          <span>MASTER SYSTEM PROMPT (READY FOR DEPLOYMENT)</span>
          <span className="text-cyan-400 font-bold">{generatedPrompt.length} CHARS</span>
        </div>

        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 whitespace-pre-wrap select-all leading-relaxed">
          {generatedPrompt || 'Synthesizing your custom J.A.R.V.I.S. system prompt...'}
        </pre>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Pre-calibrated for all modern LLMs (Claude 3.7, ChatGPT 4o, Gemini 2.5/3.8, Ollama)
        </div>

        <button
          onClick={handleTestInTerminal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold transition-all"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          Test Drive in Live HUD
        </button>
      </div>
    </div>
  );
};
