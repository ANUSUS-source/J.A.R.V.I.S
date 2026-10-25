import React, { useState, useRef, useEffect } from 'react';
import { HospitalChatMessage, EmergencyTriageAlert } from '../types/hospital';
import { HospitalWayfinderCard } from './HospitalWayfinderCard';
import { EmergencyDoctorAlert } from './EmergencyDoctorAlert';
import { jarvisVoice } from '../utils/speechEngine';
import { soundFx } from '../utils/audioEffects';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  HeartPulse,
  Sparkles,
  MapPin,
  Siren,
  HelpCircle,
  RotateCcw,
  Stethoscope,
  ChevronRight,
  Brain,
  Calendar,
  Clock,
  Zap,
  Radio,
  Sliders,
  AlertOctagon,
  ShieldAlert,
  Activity,
  Compass,
} from 'lucide-react';

interface HospitalVoiceChatProps {
  messages: HospitalChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  soundEnabled: boolean;
  onViewOnMap?: (floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4') => void;
  onDismissAlert?: () => void;
  activeAlert?: EmergencyTriageAlert | null;
  onTriggerSos?: () => void;
  onOpenVoiceStudio?: () => void;
  dispatchedDoctorsCount?: number;
}

interface ChipItem {
  label: string;
  query: string;
  category: 'hospital' | 'emergency' | 'personal' | 'research';
}

const UNIFIED_QUICK_CHIPS: ChipItem[] = [
  {
    label: '🚑 Sudden chest pain & breathlessness',
    query: "I'm having severe acute chest pain and finding it hard to breathe",
    category: 'emergency',
  },
  {
    label: '♿ Where is a wheelchair?',
    query: 'Where can I get a wheelchair for a patient?',
    category: 'hospital',
  },
  {
    label: '📅 Plan my daily schedule & prioritize',
    query: 'Jarvis, please help me plan and organize an optimal daily schedule with focus blocks and priorities.',
    category: 'personal',
  },
  {
    label: '💊 Pharmacy & painkillers',
    query: 'Where is the pharmacy to buy painkillers and medicine?',
    category: 'hospital',
  },
  {
    label: '🧠 Feeling very dizzy & faint',
    query: 'I am not feeling well, I feel very dizzy and might faint',
    category: 'emergency',
  },
  {
    label: '💡 Creative problem-solving advice',
    query: 'Jarvis, I need your creative problem-solving expertise to resolve an operational bottleneck. What strategies do you suggest?',
    category: 'personal',
  },
  {
    label: '🔬 MRI & X-Ray radiology suite',
    query: 'Where is the MRI and X-ray radiology department located?',
    category: 'hospital',
  },
  {
    label: '⏰ Remind me to review patient metrics',
    query: 'Jarvis, remind me to audit ICU and cardiology patient recovery metrics this afternoon.',
    category: 'personal',
  },
  {
    label: '👶 Pediatric ER & Children’s Ward',
    query: 'Where is the pediatric clinic and children emergency ward?',
    category: 'hospital',
  },
  {
    label: '🩸 Blood test & Phlebotomy lab',
    query: 'Where is the blood draw and clinical lab testing department?',
    category: 'hospital',
  },
  {
    label: '🔬 Research cardiac triage latency',
    query: 'Jarvis, provide an executive research synthesis on how rapid doctor paging impacts patient outcomes.',
    category: 'research',
  },
];

export const HospitalVoiceChat: React.FC<HospitalVoiceChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  soundEnabled,
  onViewOnMap,
  onDismissAlert,
  activeAlert,
  onTriggerSos,
  onOpenVoiceStudio,
  dispatchedDoctorsCount = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [activeChipFilter, setActiveChipFilter] = useState<'ALL' | 'EMERGENCY' | 'HOSPITAL' | 'PERSONAL'>('ALL');
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, activeAlert]);

  // Subscribe to speech synthesis state
  useEffect(() => {
    const unsub = jarvisVoice.subscribeState((speaking) => {
      setIsSpeakingAudio(speaking);
    });
    return unsub;
  }, []);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          if (soundEnabled) soundFx.playHeartbeatBeep();
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInputText(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, [soundEnabled]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const toSend = inputText.trim();
    setInputText('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onSendMessage(toSend);
  };

  const handleReplayAudio = (msg: HospitalChatMessage) => {
    if (!soundEnabled) return;
    const textToSpeak = msg.spokenBriefing || msg.content;
    soundFx.playHospitalChime();
    setTimeout(() => {
      jarvisVoice.speak(textToSpeak, undefined, true);
    }, 300);
  };

  const filteredChips = UNIFIED_QUICK_CHIPS.filter((chip) => {
    if (activeChipFilter === 'ALL') return true;
    if (activeChipFilter === 'EMERGENCY') return chip.category === 'emergency';
    if (activeChipFilter === 'HOSPITAL') return chip.category === 'hospital';
    if (activeChipFilter === 'PERSONAL') return chip.category === 'personal' || chip.category === 'research';
    return true;
  });

  const voiceName = jarvisVoice.getVoiceName();

  return (
    <div className="w-full bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-[0_10px_50px_rgba(6,182,212,0.12)] flex flex-col h-[780px] lg:h-[820px] backdrop-blur-xl overflow-hidden relative transition-all">
      {/* 1. TOP INTEGRATED TRIAGE & AUDIO STATUS HEADER */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
        {/* Left: Identity and Subsystem Status */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <HeartPulse className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white font-orbitron tracking-wide flex items-center gap-2">
                <span>VOICE COMM-LINK & CLINICAL TRIAGE</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                COMMAND BOX
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className="text-cyan-400 font-semibold">VERBAL MALE AI</span>
              <span>•</span>
              <span className="text-emerald-400">WAYFINDING & DOCTOR DISPATCH</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-400">ST. JUDE ATRIUM KIOSK 1</span>
            </p>
          </div>
        </div>

        {/* Center: Live Audio Waveform Visualizer */}
        <div className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
          <span className="text-[11px] text-slate-400">
            {isSpeakingAudio ? (
              <span className="text-cyan-300 font-bold animate-pulse">JARVIS SPEAKING</span>
            ) : isListening ? (
              <span className="text-rose-400 font-bold animate-pulse">MIC LISTENING</span>
            ) : (
              <span className="text-slate-400">COMM-LINK READY</span>
            )}
          </span>
          <div className="flex items-center gap-1 h-5">
            {[40, 75, 55, 90, 60, 85, 45, 70].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeakingAudio
                    ? 'bg-cyan-400 animate-pulse'
                    : isListening
                    ? 'bg-rose-400 animate-bounce'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isSpeakingAudio || isListening ? `${h}%` : '25%',
                  animationDelay: `${i * 90}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Triage Status, Male Voice, and Rapid SOS */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Triage Level Status Badge */}
          {activeAlert ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950 border border-rose-500/70 text-rose-200 text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.35)]">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{activeAlert.severity} ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>TRIAGE: STANDBY</span>
            </div>
          )}

          {/* Active Voice Pill */}
          <button
            onClick={onOpenVoiceStudio}
            title="Configure Male Voice Synthesizer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[110px] font-semibold">{voiceName}</span>
            <Sliders className="w-3 h-3 text-slate-400" />
          </button>

          {/* Rapid SOS Trigger right inside the box header */}
          {onTriggerSos && (
            <button
              onClick={onTriggerSos}
              title="Trigger Instant Emergency Doctor Dispatch"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-bold text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all active:scale-95"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SOS DISPATCH</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PERSISTENT ACTIVE EMERGENCY ALERT BANNER (If Active) */}
      {activeAlert && (
        <div className="p-3 sm:p-4 bg-rose-950/40 border-b border-rose-500/40 shrink-0">
          <EmergencyDoctorAlert
            alert={activeAlert}
            onDismiss={onDismissAlert || (() => {})}
          />
        </div>
      )}

      {/* 3. EXPANSIVE FULL-WIDTH MESSAGE THREAD */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Meta Header */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {isUser ? 'Patient / Executive User' : 'J.A.R.V.I.S. Clinical & Executive AI'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {msg.timestamp}
                </span>
                {!isUser && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    MALE VOICE
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 sm:p-5 max-w-[95%] sm:max-w-[90%] text-xs sm:text-sm font-sans leading-relaxed shadow-xl ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 text-white font-medium rounded-tr-xs shadow-[0_4px_20px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-950/95 border border-slate-800/90 text-slate-100 rounded-tl-xs space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Spoken Audio Quote Box if assistant */}
                {!isUser && msg.spokenBriefing && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start justify-between gap-3 shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-900/50 text-cyan-300 shrink-0 mt-0.5">
                        <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-cyan-400" />
                          <span>VERBAL AUDIO BRIEFING (MALE SYNTHESIZER):</span>
                        </div>
                        <p className="text-xs sm:text-sm text-cyan-100 italic font-medium leading-relaxed">
                          "{msg.spokenBriefing}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReplayAudio(msg)}
                      title="Replay Male Voice Audio"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-900/70 hover:bg-cyan-800 text-cyan-200 text-xs font-mono transition-colors shrink-0 border border-cyan-500/30"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Replay</span>
                    </button>
                  </div>
                )}

                {/* If there is a Location Result, show the Hospital Wayfinder Card! */}
                {msg.locationResult && (
                  <HospitalWayfinderCard
                    location={msg.locationResult}
                    onViewOnMap={onViewOnMap}
                  />
                )}

                {/* Main Content Body with Monospace HUD syntax */}
                <div className="whitespace-pre-wrap font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200">
                  {msg.content}
                </div>

                {/* Metadata tag */}
                {!isUser && msg.source && (
                  <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">ENGINE: {msg.source}</span>
                    <span className="text-cyan-400/90 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      VERBAL COMM-LINK ACTIVE
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-[85%]">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-400">
              <span>J.A.R.V.I.S. SYNTHESIZING RESPONSE...</span>
            </div>
            <div className="rounded-2xl rounded-tl-xs p-4 bg-slate-950 border border-cyan-500/40 text-cyan-300 flex items-center gap-3 shadow-lg">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs sm:text-sm font-mono">
                Consulting clinical waypoints, triage protocols, and personal assistant core...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. CATEGORIZED QUICK PROMPT CHIPS */}
      <div className="px-4 pt-2.5 pb-2 bg-slate-950/80 border-t border-slate-800/90 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1.5 font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>ONE-TOUCH DIRECTIVES & TRIAGE TRIGGERS:</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveChipFilter('ALL')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeChipFilter === 'ALL'
                  ? 'bg-cyan-600 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveChipFilter('EMERGENCY')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeChipFilter === 'EMERGENCY'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-rose-300'
              }`}
            >
              🚨 Triage / SOS
            </button>
            <button
              onClick={() => setActiveChipFilter('HOSPITAL')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeChipFilter === 'HOSPITAL'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-emerald-300'
              }`}
            >
              ♿ Wayfinding
            </button>
            <button
              onClick={() => setActiveChipFilter('PERSONAL')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeChipFilter === 'PERSONAL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-blue-300'
              }`}
            >
              ⚡ Executive Plan
            </button>
          </div>
        </div>

        {/* Horizontally scrollable chip row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSendMessage(chip.query);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all text-left font-sans shrink-0 active:scale-95 ${
                chip.category === 'emergency'
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-200 hover:bg-rose-900/80 hover:border-rose-400'
                  : chip.category === 'personal'
                  ? 'bg-blue-950/70 border-blue-500/60 text-blue-200 hover:bg-blue-900/80 hover:border-blue-400'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-200 hover:bg-slate-850'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. BOTTOM VOICE COMMAND DECK & TEXT INPUT */}
      <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2.5 sm:gap-3">
          {/* Prominent Glowing Microphone Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={handleToggleListening}
              title={isListening ? 'Stop Listening' : 'Speak to Jarvis (Microphone)'}
              className={`relative p-3 sm:p-3.5 rounded-2xl border transition-all shrink-0 ${
                isListening
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-slate-900 text-cyan-400 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850 shadow-md'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 ring-2 ring-slate-950 animate-ping" />
              )}
            </button>
          )}

          {/* Large Wide Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice... Speak your request now...'
                  : 'Ask Jarvis: "Where is the wheelchair?", "I have chest pain", or "Plan my daily schedule"...'
              }
              disabled={isLoading}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3 sm:py-3.5 pl-4 pr-12 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>

          {/* Send Action Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 text-slate-950 font-bold hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(6,182,212,0.35)] transition-all active:scale-95 shrink-0"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </form>

        {/* Sub-bar Information */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{soundEnabled ? 'Verbal Speech Enabled (Male Voice)' : 'Verbal Speech Muted'}</span>
          </span>
          <span className="hidden sm:inline text-slate-400">
            Press <strong className="text-slate-300">Enter</strong> to send • Tap <strong className="text-cyan-400">Mic</strong> to speak
          </span>
          <span>KIOSK 1 // ST. JUDE METROPOLITAN</span>
        </div>
      </div>
    </div>
  );
};
