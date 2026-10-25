import React, { useState, useEffect } from 'react';
import { jarvisVoice } from '../utils/speechEngine';
import { soundFx } from '../utils/audioEffects';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Check,
  X,
  User,
  Radio,
  Activity,
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [pitch, setPitch] = useState<number>(1.0);
  const [rate, setRate] = useState<number>(1.0);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const available = jarvisVoice.getAvailableMaleVoices();
        setVoices(available);
        setSelectedVoiceName(jarvisVoice.getVoiceName());
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectVoice = (voiceName: string) => {
    jarvisVoice.setVoiceByName(voiceName);
    setSelectedVoiceName(voiceName);
    soundFx.playClick();
  };

  const handleTestVoice = () => {
    setIsTesting(true);
    soundFx.playHospitalChime();
    const testPhrase =
      'Greetings. J.A.R.V.I.S. audio comm-link calibrated. Both executive productivity directives and hospital clinical triage protocols are fully synchronized. How may I be of assistance, sir?';

    jarvisVoice.speak(testPhrase, () => {
      setIsTesting(false);
    }, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>J.A.R.V.I.S. Audio & Male Voice Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  MALE VOICE STRICT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure verbal speech synthesis and acoustic comm-link parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Sound & Verbal Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                soundEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Verbal Voice Replies & Sound FX
              </div>
              <div className="text-[11px] text-slate-400">
                Jarvis automatically speaks out responses aloud in a male voice
              </div>
            </div>
          </div>

          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              soundEnabled
                ? 'bg-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        {/* Voice Selection List */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-cyan-400 font-bold flex items-center justify-between">
            <span>AVAILABLE MALE VOICES ON THIS DEVICE:</span>
            <span className="text-slate-400 text-[11px] font-normal">
              {voices.length} detected
            </span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {voices.length > 0 ? (
              voices.map((v) => {
                const isSelected =
                  v.name === selectedVoiceName ||
                  selectedVoiceName.includes(v.name.slice(0, 10));

                return (
                  <button
                    key={v.name}
                    onClick={() => handleSelectVoice(v.name)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold">{v.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1 rounded">
                        {v.lang}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                Default system British/Male voice selected. Web Speech API voices initializing...
              </div>
            )}
          </div>
        </div>

        {/* Pitch & Rate Controls */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
              <span>Speech Rate:</span>
              <span className="text-cyan-400 font-bold">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.1"
              value={rate}
              onChange={(e) => {
                const r = parseFloat(e.target.value);
                setRate(r);
                jarvisVoice.setVoiceRate(r);
              }}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
              <span>Voice Pitch:</span>
              <span className="text-cyan-400 font-bold">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={pitch}
              onChange={(e) => {
                const p = parseFloat(e.target.value);
                setPitch(p);
                jarvisVoice.setVoicePitch(p);
              }}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Test Speech Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">
            Male Voice Persona: British / Sophisticated
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestVoice}
              disabled={isTesting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Speaking Test...' : 'Test Male Voice'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
