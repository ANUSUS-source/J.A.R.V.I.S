import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import {
  Terminal,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  Cpu,
  Brain,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

interface HudTerminalProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  callsign: string;
  autoSpeak: boolean;
  learnedMemories?: string[];
  onDeleteMemory?: (index: number) => void;
  onAddMemory?: (rule: string) => void;
}

export const HudTerminal: React.FC<HudTerminalProps> = ({
  messages,
  onSendMessage,
  isLoading,
  themeColor,
  callsign,
  autoSpeak,
  learnedMemories = [],
  onDeleteMemory,
  onAddMemory,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/10',
      inputBorder: 'focus:border-cyan-400',
      buttonBg: 'bg-cyan-600 hover:bg-cyan-500 text-black',
    },
    amber: {
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      bgGlow: 'bg-amber-500/10',
      inputBorder: 'focus:border-amber-400',
      buttonBg: 'bg-amber-600 hover:bg-amber-500 text-black',
    },
    emerald: {
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
      inputBorder: 'focus:border-emerald-400',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-black',
    },
    crimson: {
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      bgGlow: 'bg-rose-500/10',
      inputBorder: 'focus:border-rose-400',
      buttonBg: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
  }[themeColor];

  // Subscribe to speech state
  useEffect(() => {
    const unsub = jarvisVoice.subscribeState((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recognition init
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    soundFx.playHologramPing();
    const recognition = jarvisVoice.createAdvancedRecognition({
      onStart: () => setIsRecording(true),
      onInterim: (text) => setInputText(text),
      onFinal: (text) => {
        setIsRecording(false);
        if (text.trim()) {
          setInputText(text);
          soundFx.playClick();
        }
      },
      onError: () => setIsRecording(false),
      onEnd: () => setIsRecording(false),
    });

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    soundFx.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopyMessage = (id: string, text: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakComm = (text: string) => {
    soundFx.playClick();
    if (isSpeaking) {
      jarvisVoice.stop();
    } else {
      jarvisVoice.speak(text, undefined, true);
    }
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    if (onAddMemory) {
      onAddMemory(newRuleInput.trim());
      soundFx.playClick();
      setNewRuleInput('');
    }
  };

  // Pre-made training & quick queries
  const trainingSuggestions = [
    'Jarvis, remember: our tech stack is Next.js 15 & PyTorch',
    'Jarvis, learn: always include an execution shortcut in directives',
    'Jarvis, change my callsign to Commander',
    'Jarvis, change theme to Amber Gold',
  ];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border ${colorStyles.border} bg-slate-950/90 backdrop-blur-xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[620px]'
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300 ml-2 flex items-center gap-1.5">
            <Terminal className={`w-3.5 h-3.5 ${colorStyles.text}`} />
            J.A.R.V.I.S. OPTICAL HUD INTERFACE // LIVE COMM-LINK
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Learned Neural Memories Badge Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowMemoryDrawer(!showMemoryDrawer);
            }}
            title="Inspect & Teach J.A.R.V.I.S. Neural Directives"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/50 bg-purple-950/40 text-purple-300 hover:bg-purple-500/20 text-[10px] font-mono font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>LEARNED MEMORY ({learnedMemories.length})</span>
            {showMemoryDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Audio Waveform visualization */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/40">
              <span className="w-1 h-3 bg-cyan-400 animate-pulse" />
              <span className="w-1 h-4 bg-cyan-300 animate-bounce" />
              <span className="w-1 h-2 bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-300 ml-1">AUDIO STREAMING</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize HUD' : 'Expand HUD'}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* LEARNED NEURAL MEMORIES DRAWER (When opened) */}
      {showMemoryDrawer && (
        <div className="p-3 bg-purple-950/20 border-b border-purple-500/30 text-xs font-mono space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              COGNITIVE NEURAL WEIGHTS &amp; ACTIVE LEARNED DIRECTIVES
            </span>
            <span className="text-slate-400">All instructions taught in chat are injected into Gemini core</span>
          </div>

          {/* List of learned memories */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {learnedMemories.length === 0 ? (
              <div className="text-[11px] text-slate-400 p-2 rounded bg-black/40 border border-slate-800 text-center">
                No custom directives learned yet. Teach J.A.R.V.I.S. by typing <em>"Jarvis, remember: [rule]"</em> or add one below!
              </div>
            ) : (
              learnedMemories.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-purple-500/30 text-[11px] text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">#{idx + 1}</span>
                    <span>{rule}</span>
                  </div>
                  {onDeleteMemory && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onDeleteMemory(idx);
                      }}
                      title="Delete learned directive"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Add Directive Box */}
          <form onSubmit={handleAddCustomRule} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newRuleInput}
              onChange={(e) => setNewRuleInput(e.target.value)}
              placeholder="Teach J.A.R.V.I.S. a new memory/rule directly..."
              className="flex-1 bg-black/80 px-2.5 py-1 rounded-lg border border-purple-500/40 text-[11px] text-white focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={!newRuleInput.trim()}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-40"
            >
              <Plus className="w-3 h-3" /> Teach Rule
            </button>
          </form>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="font-bold tracking-wider uppercase">
                  {isUser ? `COMMANDER [${callsign}]` : 'J.A.R.V.I.S. MAINFRAME'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.source && (
                  <span className="px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-400 text-[9px]">
                    {msg.source}
                  </span>
                )}
              </div>

              <div
                className={`group relative max-w-[95%] sm:max-w-[90%] rounded-xl p-3 border transition-all ${
                  isUser
                    ? 'bg-slate-900/90 border-slate-700 text-slate-100 rounded-br-none'
                    : 'bg-black/80 border-cyan-500/30 text-cyan-100 rounded-bl-none shadow-[0_0_20px_rgba(6,182,212,0.05)]'
                }`}
              >
                {/* Action buttons on message hover */}
                {!isUser && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSpeakComm(msg.content)}
                      title={isSpeaking ? 'Mute Speech' : 'Play British Vocal Briefing'}
                      className="p-1 rounded bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-white"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      title="Copy HUD Block"
                      className="p-1 rounded bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-white"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Message Content: preserving whitespace & box characters */}
                <div className="whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] sm:text-xs">
                  {renderHudContent(msg.content)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono animate-pulse">
            <Cpu className="w-4 h-4 animate-spin-slow" />
            <span>CALCULATING TACTICAL HUD TELEMETRY // MATRIX COMPILING...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Training Directives */}
      <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] font-mono text-purple-400 whitespace-nowrap flex items-center gap-1">
          <Brain className="w-3 h-3" /> TEACH:
        </span>
        {trainingSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playClick();
              setInputText(s);
            }}
            className="px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white bg-purple-950/20 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-800/80 bg-slate-900/40 rounded-b-2xl flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleRecording}
          title={isRecording ? 'Listening (Click to stop)' : 'Voice Dictation (Talk to JARVIS)'}
          className={`p-2.5 rounded-xl border transition-all ${
            isRecording
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Enter directive or teach a rule: "Jarvis, remember: [instruction]"...`}
          className={`flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none ${colorStyles.inputBorder} transition-colors`}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colorStyles.buttonBg}`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Helper to highlight HUD components nicely
function renderHudContent(text: string) {
  const lines = text.split('\n');

  return lines.map((line, index) => {
    const isSystemHeader = line.includes('[SYSTEM RUNTIME:');
    const isBoxBorder = line.startsWith('┌') || line.startsWith('├') || line.startsWith('└');
    const isSubsystem = line.includes('◈ ACTIVE SUBSYSTEMS') || line.includes('◈ ACTION DIRECTIVES');
    const isCommLink = line.includes('◈ AUDIO COMM-LINK');
    const isNeuralAdaptation = line.includes('◈ NEURAL ADAPTATION') || line.includes('[✓]');
    const isDirectiveNum = /^\s*\[\d+\]/.test(line);

    if (isSystemHeader) {
      return (
        <div key={index} className="text-cyan-400 font-bold tracking-wider py-0.5">
          {line}
        </div>
      );
    }
    if (isBoxBorder) {
      return (
        <div key={index} className="text-cyan-500/70 select-none">
          {line}
        </div>
      );
    }
    if (isNeuralAdaptation) {
      return (
        <div key={index} className="text-purple-400 font-bold tracking-wide my-0.5 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/20">
          {line}
        </div>
      );
    }
    if (isSubsystem) {
      return (
        <div key={index} className="text-amber-400 font-bold tracking-wide mt-2 mb-1">
          {line}
        </div>
      );
    }
    if (isCommLink) {
      return (
        <div key={index} className="text-emerald-400 font-bold tracking-wide mt-2 mb-1">
          {line}
        </div>
      );
    }
    if (isDirectiveNum) {
      return (
        <div key={index} className="text-slate-200 pl-2 text-cyan-300">
          {line}
        </div>
      );
    }

    return (
      <div key={index} className="leading-snug">
        {line}
      </div>
    );
  });
}
