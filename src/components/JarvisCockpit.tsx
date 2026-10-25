import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import { DocsSubsystem } from './subsystems/DocsSubsystem';
import { DeskSubsystem } from './subsystems/DeskSubsystem';
import { GameSubsystem } from './subsystems/GameSubsystem';
import { HandGestureController } from './HandGestureController';
import { ThreeIronManWorld, HologramPresetId, HOLOGRAM_PRESETS } from './ThreeIronManWorld';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Bot,
  Zap,
  Eye,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Radio,
  Clock,
  CloudSun,
  Send,
  X,
  Sparkles,
  FileText,
  Sliders,
  FolderTree,
  ShieldCheck,
  Brain,
  Trash2,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  Check,
  Flame,
  AlertTriangle,
  Settings,
  HelpCircle,
  Camera,
  CameraOff,
  Palette,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface JarvisCockpitProps {
  onOpenChat: () => void;
  isChatOpen: boolean;
  onSendMessage: (text: string) => void;
  lastAssistantMessage?: string;
  isGeneratingResponse?: boolean;
  onExecuteVoiceCommand?: (cmd: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: (forced?: boolean) => void;
  callsign: string;
  onUpdateCallsign: (newName: string) => void;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  onChangeTheme: (theme: 'cyan' | 'amber' | 'emerald' | 'crimson') => void;
  learnedMemories: string[];
  onDeleteMemory: (index: number) => void;
  onAddMemory: (rule: string) => void;
}

export const JarvisCockpit: React.FC<JarvisCockpitProps> = ({
  onOpenChat,
  isChatOpen,
  onSendMessage,
  lastAssistantMessage,
  isGeneratingResponse = false,
  onExecuteVoiceCommand,
  soundEnabled = true,
  onToggleSound,
  callsign,
  onUpdateCallsign,
  themeColor,
  onChangeTheme,
  learnedMemories,
  onDeleteMemory,
  onAddMemory,
}) => {
  // Modes & UI settings
  const [activeMode, setActiveMode] = useState<'DESK' | 'GAME' | 'WAR ROOM'>('DESK');
  const [animationActive, setAnimationActive] = useState<boolean>(true);
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [tempUserName, setTempUserName] = useState<string>(callsign);

  // Active Runnable Modals (DOCS, DESK, GAME, CTRL, XPLR, CHRM, CFG, EQ, MIC_HELP)
  const [activeSubsystemModal, setActiveSubsystemModal] = useState<
    'DOCS' | 'DESK' | 'GAME' | 'CTRL' | 'XPLR' | 'CHRM' | 'CFG' | 'EQ' | 'MIC_HELP' | null
  >(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [externalCameraCommand, setExternalCameraCommand] = useState<'START' | 'STOP' | null>(null);
  const [show3DAsideReactor, setShow3DAsideReactor] = useState<boolean>(true);
  const [isFullscreen3D, setIsFullscreen3D] = useState<boolean>(false);
  const [activeHologramPreset, setActiveHologramPreset] = useState<HologramPresetId>('mark-iii');

  // System Controls state (for CTRL modal)
  const [overclockLevel, setOverclockLevel] = useState<number>(85);
  const [fanSpeed, setFanSpeed] = useState<number>(2400);
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [firewallArmed, setFirewallArmed] = useState<boolean>(true);

  // Diagnostics Scan Progress state (for CHRM)
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const trackList = [
    'TRACK 01 // STARK_DRONE_AMBIENCE.WAV',
    'TRACK 02 // TACTICAL_HEURISTICS_PULSE.WAV',
    'TRACK 03 // ARC_REACTOR_HARMONIC.WAV',
  ];

  // Voice Command & Microphone States (Robust Multi-Layer Solution)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<string>('');
  const [micStatusText, setMicStatusText] = useState<string>('READY FOR INSTRUCTIONS');
  const [micError, setMicError] = useState<string | null>(null);
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState<boolean>(false);

  // Clock State
  const [timeString, setTimeString] = useState<string>('05:15:21 PM');
  const [dateString, setDateString] = useState<string>('MAY 5, 2026');
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  // Weather State
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [weatherCity, setWeatherCity] = useState<'JUAREZ, MEXICO' | 'NEW YORK, USA' | 'TOKYO, JAPAN'>('JUAREZ, MEXICO');

  // Chat inline & memory
  const [inlineChatInput, setInlineChatInput] = useState<string>('');
  const [newRuleInput, setNewRuleInput] = useState<string>('');
  const [showMemoryInChat, setShowMemoryInChat] = useState<boolean>(false);

  // Active Session Tasks State
  const [sessionTasks, setSessionTasks] = useState<Array<{ id: string; text: string; completed: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('jarvis_session_tasks');
      return saved
        ? JSON.parse(saved)
        : [
            { id: '1', text: 'Initialize Stark Cockpit & Optical Sensors', completed: true },
            { id: '2', text: 'Calibrate optical hand gesture recognition', completed: false },
            { id: '3', text: 'Define session tasks with J.A.R.V.I.S.', completed: false },
          ];
    } catch {
      return [
        { id: '1', text: 'Initialize Stark Cockpit & Optical Sensors', completed: true },
        { id: '2', text: 'Calibrate optical hand gesture recognition', completed: false },
        { id: '3', text: 'Define session tasks with J.A.R.V.I.S.', completed: false },
      ];
    }
  });
  const [newTaskInput, setNewTaskInput] = useState<string>('');
  const [conversationReplyInput, setConversationReplyInput] = useState<string>('');

  // Active Male Voice State & Switcher
  const [activeVoiceName, setActiveVoiceName] = useState<string>(() => jarvisVoice.getVoiceName());

  useEffect(() => {
    setActiveVoiceName(jarvisVoice.getVoiceName());
  }, []);

  const handleTestMaleVoice = () => {
    jarvisVoice.testVoiceSample();
    if (soundEnabled) soundFx.playClick();
    setActiveVoiceName(jarvisVoice.getVoiceName());
    setMicStatusText(`MALE VOICE ARMED: ${jarvisVoice.getVoiceName().toUpperCase()}`);
  };

  const handleCycleMaleVoice = () => {
    const maleVoices = jarvisVoice.getAvailableMaleVoices();
    if (maleVoices.length > 1) {
      const currentName = jarvisVoice.getVoiceName();
      const currentIdx = maleVoices.findIndex((v) => currentName.includes(v.name));
      const nextIdx = (currentIdx + 1) % maleVoices.length;
      jarvisVoice.setVoiceByName(maleVoices[nextIdx].name);
      setActiveVoiceName(jarvisVoice.getVoiceName());
      jarvisVoice.testVoiceSample();
      setMicStatusText(`SWITCHED VOICE: ${maleVoices[nextIdx].name.toUpperCase()}`);
    } else {
      handleTestMaleVoice();
    }
  };

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;

  // Theme styling definitions
  const themeStyles = {
    cyan: {
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_30px_rgba(0,240,255,0.4)]',
      border: 'border-cyan-500/50',
      coreGrad: 'from-cyan-400 to-blue-600',
      fill: '#00f0ff',
      accent: 'bg-cyan-500',
    },
    amber: {
      text: 'text-amber-400',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
      border: 'border-amber-500/50',
      coreGrad: 'from-amber-400 to-orange-600',
      fill: '#f59e0b',
      accent: 'bg-amber-500',
    },
    emerald: {
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
      border: 'border-emerald-500/50',
      coreGrad: 'from-emerald-400 to-teal-600',
      fill: '#10b981',
      accent: 'bg-emerald-500',
    },
    crimson: {
      text: 'text-rose-400',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.4)]',
      border: 'border-rose-500/50',
      coreGrad: 'from-rose-500 to-red-700',
      fill: '#f43f5e',
      accent: 'bg-rose-500',
    },
  }[themeColor];

  // Update Clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: !is24Hour,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateString(
        now
          .toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          .toUpperCase()
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  // Sync callsign
  useEffect(() => {
    setTempUserName(callsign);
  }, [callsign]);

  // Listen for auto-detected tasks from Gemini conversation
  useEffect(() => {
    const handleAddTasksEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ tasks: string[] }>;
      if (customEvent.detail?.tasks && Array.isArray(customEvent.detail.tasks)) {
        customEvent.detail.tasks.forEach((taskTitle) => {
          if (taskTitle && taskTitle.trim()) {
            handleAddTask(taskTitle.trim());
          }
        });
      }
    };
    window.addEventListener('jarvis_add_tasks', handleAddTasksEvent);
    return () => window.removeEventListener('jarvis_add_tasks', handleAddTasksEvent);
  }, []);

  // Session task action handlers
  const handleToggleTask = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setSessionTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      try {
        localStorage.setItem('jarvis_session_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddTask = (text: string) => {
    if (!text.trim()) return;
    if (soundEnabled) soundFx.playClick();
    const newTask = {
      id: `task-${Date.now()}`,
      text: text.trim(),
      completed: false,
    };
    setSessionTasks((prev) => {
      const updated = [...prev, newTask];
      try {
        localStorage.setItem('jarvis_session_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNewTaskInput('');
    setMicStatusText(`TASK ADDED: "${text.trim().toUpperCase()}"`);
  };

  const handleDeleteTask = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setSessionTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem('jarvis_session_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSendConversationReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationReplyInput.trim()) return;
    const replyText = conversationReplyInput.trim();
    if (soundEnabled) soundFx.playClick();

    // Auto-detect tasks from response
    const taskMatch = replyText.match(/(?:task|tasks|build|create|implement|do|make|work on)\s+(?:is|are|to)?\s*([^.]+)/i);
    if (taskMatch && taskMatch[1]) {
      handleAddTask(taskMatch[1].trim());
    }

    processVoiceInstruction(replyText);
    setConversationReplyInput('');
  };

  // Execute Voice / Text Instruction Logic & Dynamic System Actions
  const processVoiceInstruction = (transcript: string) => {
    const text = transcript.trim();
    if (!text) return;

    setLastExecutedCommand(text);
    setInterimTranscript('');
    setMicStatusText(`EXECUTING: "${text.toUpperCase()}"`);
    if (soundEnabled) soundFx.playClick();

    const lower = text.toLowerCase();

    // 1. Callsign changes
    const callsignMatch = text.match(/(?:call me|change (?:my )?callsign to|change (?:my )?name to|my name is)\s+([A-Za-z0-9_-]+)/i);
    if (callsignMatch && callsignMatch[1]) {
      const newName = callsignMatch[1].trim();
      onUpdateCallsign(newName);
      onAddMemory(`User prefers to be addressed as "${newName}".`);
      setMicStatusText(`COMMANDER PROFILE UPDATED TO: ${newName.toUpperCase()}`);
      if (soundEnabled) jarvisVoice.speak(`Understood. I will address you as ${newName} from now on.`);
      return;
    }

    // 2. Theme changes
    if (lower.includes('gold') || lower.includes('amber')) {
      onChangeTheme('amber');
      setMicStatusText('THEME SWITCHED TO MARK XLII GOLD');
      if (soundEnabled) jarvisVoice.speak('Mark forty-two gold telemetry armed.');
      return;
    }
    if (lower.includes('emerald') || lower.includes('green') || lower.includes('matrix theme')) {
      onChangeTheme('emerald');
      setMicStatusText('THEME SWITCHED TO STEALTH MATRIX EMERALD');
      if (soundEnabled) jarvisVoice.speak('Stealth matrix engaged.');
      return;
    }
    if (lower.includes('cyan') || lower.includes('blue') || lower.includes('stark theme')) {
      onChangeTheme('cyan');
      setMicStatusText('THEME SWITCHED TO STARK BLUE');
      if (soundEnabled) jarvisVoice.speak('Stark cyan telemetry restored.');
      return;
    }
    if (lower.includes('crimson') || lower.includes('red') || lower.includes('alert theme')) {
      onChangeTheme('crimson');
      setMicStatusText('THEME SWITCHED TO ALERT PROTOCOL CRIMSON');
      if (soundEnabled) jarvisVoice.speak('Alert protocol active.');
      return;
    }

    // 3. Operational Mode & Subsystem Instructions
    if (lower.includes('game') || lower.includes('overclock') || lower.includes('combat')) {
      setActiveMode('GAME');
      setActiveSubsystemModal('GAME');
      setOverclockLevel(98);
      setFanSpeed(3200);
      setMicStatusText('SYSTEM MODE: GAME COMBAT MATRIX ACTIVE');
      if (soundEnabled) jarvisVoice.speak('Game mode activated. Tactical combat and simulation matrix online.');
      return;
    }
    if (lower.includes('desk') || lower.includes('work mode') || lower.includes('tasks') || lower.includes('workspace')) {
      setActiveMode('DESK');
      setActiveSubsystemModal('DESK');
      setOverclockLevel(80);
      setFanSpeed(1800);
      setMicStatusText('SYSTEM MODE: DESK WORKSTATION ONLINE');
      if (soundEnabled) jarvisVoice.speak('Desk workstation online. Task board and code runner loaded.');
      return;
    }
    if (lower.includes('war room')) {
      setActiveMode('WAR ROOM');
      setOverclockLevel(90);
      setFanSpeed(2800);
      setMicStatusText('WAR-ROOM SPRINT MATRIX ACTIVE');
      if (soundEnabled) jarvisVoice.speak('War room sprint initiated.');
      return;
    }

    // 4. Sound Controls
    if (lower.includes('mute') || lower.includes('disable sound') || lower.includes('silence')) {
      if (onToggleSound) onToggleSound(false);
      setIsPlayingAudio(false);
      soundFx.stopAmbience();
      setMicStatusText('ALL SOUND MUTED');
      return;
    }
    if (lower.includes('enable sound') || lower.includes('unmute')) {
      if (onToggleSound) onToggleSound(true);
      setMicStatusText('AUDIO SOUND ARMED');
      return;
    }

    // 5. Open Subsystem Modals
    if (lower.includes('open docs') || lower.includes('documentation') || lower.includes('show docs') || lower.includes('blueprint')) {
      setActiveSubsystemModal('DOCS');
      setMicStatusText('OPENED TACTICAL DOCUMENTATION & BLUEPRINTS');
      if (soundEnabled) jarvisVoice.speak('Tactical documentation matrix loaded.');
      return;
    }
    if (lower.includes('system control') || lower.includes('control panel')) {
      setActiveSubsystemModal('CTRL');
      setMicStatusText('OPENED SYSTEM CONTROL PANEL');
      return;
    }
    if (lower.includes('open explorer') || lower.includes('show files') || lower.includes('storage')) {
      setActiveSubsystemModal('XPLR');
      setMicStatusText('OPENED SYSTEM STORAGE EXPLORER');
      return;
    }
    if (lower.includes('run diagnostic') || lower.includes('scan system') || lower.includes('health check')) {
      handleRunDiagnosticScan();
      return;
    }
    if (lower.includes('open settings') || lower.includes('open config')) {
      setActiveSubsystemModal('CFG');
      return;
    }
    if (lower.includes('open chat') || lower.includes('show chat')) {
      if (!isChatOpen) onOpenChat();
      setMicStatusText('AI CHATBOT OPENED');
      return;
    }
    if (lower.includes('close chat') || lower.includes('hide chat')) {
      if (isChatOpen) onOpenChat();
      setMicStatusText('AI CHATBOT DOCKED');
      return;
    }
    // Close / Power Down Camera Voice Commands
    if (
      lower.includes('close camera') ||
      lower.includes('turn off camera') ||
      lower.includes('turn off the camera') ||
      lower.includes('stop camera') ||
      lower.includes('shut down camera') ||
      lower.includes('shutdown camera') ||
      lower.includes('power down camera') ||
      lower.includes('power off camera') ||
      lower.includes('disable camera') ||
      lower.includes('disconnect camera') ||
      lower.includes('turn off webcam') ||
      lower.includes('close webcam') ||
      lower.includes('turn off optical') ||
      lower.includes('close optical') ||
      lower.includes('stop optical') ||
      lower.includes('camera off')
    ) {
      setExternalCameraCommand('STOP');
      setIsCameraModalOpen(false);
      setMicStatusText('OPTICAL CAMERA POWERED DOWN & DISCONNECTED');
      if (soundEnabled) {
        soundFx.playPowerDown();
        jarvisVoice.speak('Optical sensors powered down. Camera hardware released, sir.');
      }
      setTimeout(() => setExternalCameraCommand(null), 150);
      return;
    }

    if (lower.includes('open camera') || lower.includes('start camera') || lower.includes('launch camera') || lower.includes('camera') || lower.includes('optical')) {
      setExternalCameraCommand('START');
      setIsCameraModalOpen(true);
      setMicStatusText('OPTICAL CAMERA SENSORS OPENED');
      if (soundEnabled) soundFx.playArcReactorPowerUp();
      if (soundEnabled) jarvisVoice.speak('Visual optical sensors maximized. Camera mode engaged, sir.');
      setTimeout(() => setExternalCameraCommand(null), 150);
      return;
    }
    if (
      lower.includes('change hologram') ||
      lower.includes('change the hologram') ||
      lower.includes('switch hologram') ||
      lower.includes('next hologram')
    ) {
      const presets: HologramPresetId[] = ['mark-iii', 'mark-lxxxv', 'hulkbuster', 'arc-core', 'war-machine'];
      const nextIdx = (presets.indexOf(activeHologramPreset) + 1) % presets.length;
      const nextPreset = presets[nextIdx];
      setActiveHologramPreset(nextPreset);
      setShow3DAsideReactor(true);
      setMicStatusText(`HOLOGRAM CHANGED TO: ${nextPreset.toUpperCase()}`);
      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak(`Hologram projection switched to ${nextPreset.replace('-', ' ')}, sir.`);
      }
      return;
    }
    if (lower.includes('hulkbuster')) {
      setActiveHologramPreset('hulkbuster');
      setShow3DAsideReactor(true);
      setMicStatusText('HOLOGRAM: HULKBUSTER MK-XLIV ENGAGED');
      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak('Hulkbuster orbital armor hologram engaged, sir.');
      }
      return;
    }
    if (lower.includes('nano') || lower.includes('mark 85') || lower.includes('nanotech')) {
      setActiveHologramPreset('mark-lxxxv');
      setShow3DAsideReactor(true);
      setMicStatusText('HOLOGRAM: MARK 85 NANOTECH ENGAGED');
      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak('Mark 85 nanotech armor hologram engaged, sir.');
      }
      return;
    }
    if (lower.includes('arc reactor blueprint') || lower.includes('reactor core') || lower.includes('arc schematic')) {
      setActiveHologramPreset('arc-core');
      setShow3DAsideReactor(true);
      setMicStatusText('HOLOGRAM: ARC REACTOR BLUEPRINT ENGAGED');
      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak('Arc reactor MK-1 schematic blueprint loaded, sir.');
      }
      return;
    }
    if (lower.includes('war machine')) {
      setActiveHologramPreset('war-machine');
      setShow3DAsideReactor(true);
      setMicStatusText('HOLOGRAM: WAR MACHINE TACTICAL ENGAGED');
      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak('War Machine tactical armor hologram loaded, sir.');
      }
      return;
    }
    if (lower.includes('3d') || lower.includes('aside reactor') || lower.includes('mark 3') || lower.includes('mark iii') || lower.includes('hologram') || lower.includes('3d world')) {
      setShow3DAsideReactor(true);
      setMicStatusText('3D HOLOGRAPHIC MARK III ONLINE ASIDE REACTOR');
      if (soundEnabled) soundFx.playArcReactorPowerUp();
      if (soundEnabled) jarvisVoice.speak('Mark three holographic projection engaged beside the arc reactor, sir.');
      return;
    }
    if (lower.includes('new tab') || lower.includes('open new tab')) {
      try { window.open('https://google.com', '_blank', 'noopener,noreferrer'); } catch {}
      setMicStatusText('NEW BROWSER TAB PROTOCOL INITIATED');
      if (soundEnabled) jarvisVoice.speak('Launching new browser tab protocol, sir.');
      return;
    }
    if (lower.includes('youtube') || lower.includes('open youtube')) {
      try { window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer'); } catch {}
      setMicStatusText('YOUTUBE TACTICAL FEED OPENED');
      if (soundEnabled) jarvisVoice.speak('Accessing YouTube tactical feed, sir.');
      return;
    }
    if (lower.includes('play music') || lower.includes('play audio')) {
      handleMediaPlayToggle();
      return;
    }

    // 6. Memory & Learning instruction check
    const rememberMatch = text.match(/(?:remember that|learn that|from now on|please note that|always remember|rule:)\s+([^.]+)/i);
    if (rememberMatch && rememberMatch[1]) {
      const rule = rememberMatch[1].trim();
      onAddMemory(rule);
      setMicStatusText(`LEARNED RULE: "${rule.toUpperCase()}"`);
      if (soundEnabled) jarvisVoice.speak(`Assimilated directive into neural memory: ${rule}`);
    }

    // Dispatch instruction to J.A.R.V.I.S. Chatbot
    onSendMessage(text);
    if (!isChatOpen) {
      onOpenChat();
    }
  };

  // Safe stop listening helper
  const stopListening = async () => {
    setIsListening(false);
    isListeningRef.current = false;
    setMicVolumeLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // Capture any audio recorded as fallback
    const recordedAudio = await jarvisVoice.stopMediaRecorderCapture();
    jarvisVoice.cleanupMicrophone();

    // If we recorded audio and user hadn't produced text, transcribe via Gemini 3.5 Transcribe
    if (recordedAudio && recordedAudio.base64 && !lastExecutedCommand) {
      setIsTranscribingWithGemini(true);
      setMicStatusText('TRANSCRIBING AUDIO VIA GEMINI CORE...');
      const geminiTranscript = await jarvisVoice.transcribeAudioViaGemini(
        recordedAudio.base64,
        recordedAudio.mimeType
      );
      setIsTranscribingWithGemini(false);
      if (geminiTranscript && geminiTranscript.trim()) {
        processVoiceInstruction(geminiTranscript);
      }
    }

    setMicStatusText('MICROPHONE STANDBY');
  };

  // Safe start listening with explicit permissions + dual Web Speech & Gemini MediaRecorder fallback
  const startListening = async () => {
    setMicError(null);
    if (soundEnabled) soundFx.playHologramPing();
    setMicStatusText('REQUESTING MICROPHONE PERMISSION...');

    // 1. Explicitly request getUserMedia permission handshake & attach volume meter
    const micSetup = await jarvisVoice.setupMicrophoneStream((vol) => {
      setMicVolumeLevel(vol);
    });

    if (!micSetup.success) {
      setMicError(micSetup.error || 'Microphone access denied.');
      setMicStatusText('MIC PERMISSION REQUIRED');
      setActiveSubsystemModal('MIC_HELP');
      return;
    }

    setIsListening(true);
    isListeningRef.current = true;
    setMicStatusText('● LISTENING... SPEAK YOUR INSTRUCTION NOW');

    // 2. Start fallback MediaRecorder capture
    jarvisVoice.startMediaRecorderCapture();

    // 3. Start Web Speech Recognition
    let capturedFinal = false;

    const initRecognition = () => {
      const recognition = jarvisVoice.createAdvancedRecognition(
        {
          onStart: () => {
            setIsListening(true);
            setMicStatusText('● LISTENING... SPEAK YOUR INSTRUCTION NOW');
          },
          onInterim: (text) => {
            setInterimTranscript(text);
            setMicStatusText(`HEARING: "${text.toUpperCase()}"`);
          },
          onFinal: (finalText) => {
            capturedFinal = true;
            processVoiceInstruction(finalText);
          },
          onError: (err) => {
            console.warn('SpeechRecognition error:', err);
            // If it's a network error or not allowed, fallback is still recording
            if (err.includes('blocked') || err.includes('denied')) {
              setMicError(err);
              setActiveSubsystemModal('MIC_HELP');
            }
          },
          onEnd: () => {
            // If user is still listening, automatically rearm recognition so it never dies on pause!
            if (isListeningRef.current) {
              setTimeout(() => {
                if (isListeningRef.current) {
                  try {
                    recognitionRef.current = initRecognition();
                    recognitionRef.current?.start();
                  } catch {}
                }
              }, 250);
            }
          },
        },
        true
      );

      return recognition;
    };

    const rec = initRecognition();
    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e: any) {
        console.warn('Recognition start exception, using MediaRecorder fallback:', e);
      }
    }
  };

  // Toggle Microphone
  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Media Player Controls
  const handleMediaPlayToggle = () => {
    if (soundEnabled) soundFx.playClick();
    const next = !isPlayingAudio;
    setIsPlayingAudio(next);
    if (next) {
      soundFx.startAmbience();
      setMicStatusText('AUDIO STREAMING // 44.1 KHZ');
    } else {
      soundFx.stopAmbience();
      setMicStatusText('AUDIO SUSPENDED');
    }
  };

  const handleNextTrack = () => {
    if (soundEnabled) soundFx.playClick();
    setCurrentTrackIndex((prev) => (prev + 1) % trackList.length);
    if (isPlayingAudio) {
      soundFx.startAmbience();
    }
  };

  const handlePrevTrack = () => {
    if (soundEnabled) soundFx.playClick();
    setCurrentTrackIndex((prev) => (prev - 1 + trackList.length) % trackList.length);
    if (isPlayingAudio) {
      soundFx.startAmbience();
    }
  };

  // RUNNING ACTIONS FOR EVERY RADIAL OPTION
  const handleRadialClick = (label: string) => {
    if (soundEnabled) soundFx.playClick();
    setMicStatusText(`RUNNING SUBSYSTEM: [${label}]`);

    switch (label) {
      case 'DOCS':
        setActiveSubsystemModal('DOCS');
        break;
      case 'CTRL':
        setActiveSubsystemModal('CTRL');
        break;
      case 'DESK':
        setActiveSubsystemModal('DESK');
        setActiveMode('DESK');
        setOverclockLevel(80);
        setMicStatusText('DESK WORKSTATION ONLINE // TASK BOARD & CODE RUNNER ARMED');
        if (soundEnabled) jarvisVoice.speak('Desk workstation online. Task board and code runner loaded.');
        break;
      case 'XPLR':
        setActiveSubsystemModal('XPLR');
        break;
      case 'CHRM':
        handleRunDiagnosticScan();
        break;
      case 'GAME':
        setActiveSubsystemModal('GAME');
        setActiveMode('GAME');
        setOverclockLevel(98);
        setMicStatusText('GAME COMBAT MATRIX RUNNING // OVERCLOCK 98%');
        if (soundEnabled) jarvisVoice.speak('Tactical combat simulation online. Repulsor cannons primed.');
        break;
      case 'CFG':
        setActiveSubsystemModal('CFG');
        break;
      case 'VOL':
        if (onToggleSound) onToggleSound();
        setMicStatusText(soundEnabled ? 'SOUND MUTED' : 'SOUND ARMED');
        break;
      case 'EQ':
        setActiveSubsystemModal('EQ');
        break;
      case 'CAM':
        if (isCameraActive && isCameraModalOpen) {
          setExternalCameraCommand('STOP');
          setIsCameraModalOpen(false);
          setMicStatusText('OPTICAL CAMERA POWERED OFF');
          if (soundEnabled) soundFx.playPowerDown();
          if (soundEnabled) jarvisVoice.speak('Optical cameras powered down.');
          setTimeout(() => setExternalCameraCommand(null), 150);
        } else {
          setExternalCameraCommand('START');
          setIsCameraModalOpen(true);
          setMicStatusText('OPTICAL SENSORS FULL VIEWPORT OPENED');
          if (soundEnabled) soundFx.playArcReactorPowerUp();
          if (soundEnabled) jarvisVoice.speak('Optical camera viewport online.');
          setTimeout(() => setExternalCameraCommand(null), 150);
        }
        break;
      case '3D':
        setShow3DAsideReactor(true);
        {
          const presets: HologramPresetId[] = ['mark-iii', 'hulkbuster', 'mark-lxxxv', 'arc-core', 'war-machine'];
          const nextIdx = (presets.indexOf(activeHologramPreset) + 1) % presets.length;
          const nextPreset = presets[nextIdx];
          setActiveHologramPreset(nextPreset);
          setMicStatusText(`3D HOLOGRAPHIC WORLD: [${nextPreset.toUpperCase()}] ACTIVE`);
          if (soundEnabled) {
            soundFx.playHologramPing();
            jarvisVoice.speak(`Hologram projection switched to ${nextPreset.replace('-', ' ')} beside reactor.`);
          }
        }
        break;
      default:
        setMicStatusText(`SUBSYSTEM [${label}] EXECUTED`);
        break;
    }
  };

  // Diagnostic scan runner (CHRM)
  const handleRunDiagnosticScan = () => {
    setActiveSubsystemModal('CHRM');
    setIsScanning(true);
    setScanProgress(0);
    if (soundEnabled) soundFx.playRadarPing();

    let p = 0;
    const interval = setInterval(() => {
      p += 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setIsScanning(false);
        if (soundEnabled) soundFx.playHologramPing();
      }
      setScanProgress(p);
    }, 150);
  };

  // Stark Industries Overcharge Pulse
  const handleStarkLogoClick = () => {
    if (soundEnabled) soundFx.playArcReactorPowerUp();
    setMicStatusText('⚡ STARK INDUSTRIES CORE PULSE // ALL CIRCUITS OVERCHARGED');
    handleToggleVoice();
  };

  const handleSendInlineMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineChatInput.trim()) return;
    if (soundEnabled) soundFx.playClick();
    processVoiceInstruction(inlineChatInput.trim());
    setInlineChatInput('');
    if (!isChatOpen) onOpenChat();
  };

  const handleSaveUserName = () => {
    if (tempUserName.trim()) {
      onUpdateCallsign(tempUserName.trim());
      setIsEditingUser(false);
      setMicStatusText(`COMMANDER PROFILE UPDATED: "${tempUserName.trim()}"`);
      if (soundEnabled) jarvisVoice.speak(`Callsign saved as ${tempUserName.trim()}.`);
    }
  };

  const handleAddDirectRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    onAddMemory(newRuleInput.trim());
    setNewRuleInput('');
    if (soundEnabled) soundFx.playClick();
    setMicStatusText('NEURAL DIRECTIVE LEARNED & SAVED');
  };

  return (
    <div className={`relative w-full max-w-[1600px] mx-auto select-none font-mono ${themeStyles.text}`}>
      {/* Top Banner Status Bar with Mic decibel meter & Sound Switch */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] tracking-widest text-cyan-400/80 mb-2 border-b border-cyan-500/20 pb-1.5 px-2 gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
          <span className="font-bold">JARVIS COGNITIVE OS // LIVE COCKPIT</span>
          <span className="text-cyan-600 hidden sm:inline">|</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-bold hidden md:inline-flex items-center gap-1 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI: GOOGLE GEMINI CONNECTED
          </span>
          <span className="text-cyan-600 hidden md:inline">|</span>
          <span className={`${isListening ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
            {micStatusText}
          </span>
          {interimTranscript && (
            <span className="text-amber-300 italic hidden md:inline truncate max-w-xs">
              "{interimTranscript}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* REAL-TIME VOICE DECIBEL METER (Shows live mic activity!) */}
          {isListening && (
            <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-rose-500/50">
              <span className="text-[8px] text-rose-400 font-bold">MIC IN:</span>
              <div className="flex items-end gap-0.5 h-3 w-16">
                {Array.from({ length: 8 }).map((_, i) => {
                  const threshold = (i + 1) * 12;
                  const active = micVolumeLevel >= threshold;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-xs transition-all duration-75 ${
                        active
                          ? i > 5
                            ? 'bg-rose-500 h-full'
                            : i > 3
                            ? 'bg-amber-400 h-2.5'
                            : 'bg-emerald-400 h-2'
                          : 'bg-slate-800 h-1'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* SOUND ENABLE / DISABLE TOGGLE BUTTON */}
          <button
            onClick={() => {
              if (onToggleSound) onToggleSound();
            }}
            title={soundEnabled ? 'Click to Disable / Mute All Sound' : 'Click to Enable Sound'}
            className={`px-2.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span>{soundEnabled ? 'SOUND: ON' : 'SOUND: MUTED'}</span>
          </button>

          {/* MAIN MIC BUTTON IN HEADER */}
          <button
            onClick={handleToggleVoice}
            title={isListening ? 'Click to Stop Listening' : 'Click to Talk & Issue Voice Instructions'}
            className={`px-3 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              isListening
                ? 'border-rose-400 bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                : 'border-cyan-400/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500 hover:text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]'
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'LISTENING NOW' : 'ACTIVATE MIC'}</span>
          </button>

          {/* MIC TROUBLESHOOT / DIAGNOSTIC HELPER BUTTON */}
          <button
            onClick={() => setActiveSubsystemModal('MIC_HELP')}
            title="Microphone Permissions & Troubleshooting Guide"
            className="p-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* MALE VOICE ASSISTANT SWITCHER & TEST BUTTON */}
          <button
            onClick={handleCycleMaleVoice}
            title={`Active Voice: ${activeVoiceName}. Click to test male voice sample or cycle British male voices.`}
            className="px-2.5 py-1 rounded border border-cyan-400/50 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-500 hover:text-black text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">VOICE:</span>
            <span className="text-white font-orbitron">{activeVoiceName}</span>
          </button>

          {/* OPTICAL CAMERA & HAND GESTURE HUD BUTTON */}
          {isCameraActive ? (
            <button
              onClick={() => {
                setExternalCameraCommand('STOP');
                setIsCameraModalOpen(false);
                setMicStatusText('OPTICAL CAMERA POWERED OFF');
                if (soundEnabled) {
                  soundFx.playPowerDown();
                  jarvisVoice.speak('Optical cameras powered down. Camera hardware released.');
                }
                setTimeout(() => setExternalCameraCommand(null), 150);
              }}
              title="Camera is actively streaming. Click to shut down camera hardware."
              className="px-2.5 py-1 rounded border border-rose-500 bg-rose-950/80 text-rose-300 hover:bg-rose-600 hover:text-white text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer animate-pulse"
            >
              <CameraOff className="w-3.5 h-3.5 text-rose-400" />
              <span>CAM ACTIVE [CLOSE]</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsCameraModalOpen(true);
                setExternalCameraCommand('START');
                setTimeout(() => setExternalCameraCommand(null), 200);
              }}
              title="Optical Camera & Hand Gesture Recognition (5=Camera, 4=New Tab, 3=YouTube, Fist=Close)"
              className="px-2.5 py-1 rounded border border-cyan-400/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500 hover:text-black text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>OPTICAL GESTURES</span>
            </button>
          )}

          {/* 3D WORLD TOGGLE BUTTON */}
          <button
            onClick={() => {
              setShow3DAsideReactor(!show3DAsideReactor);
              if (soundEnabled) soundFx.playClick();
            }}
            title="Toggle 3D Holographic Iron Man Mark III Aside Reactor"
            className={`px-2.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              show3DAsideReactor
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-600 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{show3DAsideReactor ? '3D ASIDE: ON' : '3D ASIDE: OFF'}</span>
          </button>

          {/* AI CHAT BUTTON */}
          <button
            onClick={onOpenChat}
            className={`px-2.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1 ${
              isChatOpen
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'border-cyan-400/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isChatOpen ? 'DOCK CHAT' : 'AI CHAT'}</span>
          </button>
        </div>
      </div>

      {/* TOP ROW: MEDIA PLAYER | USER PROFILE ARCH | SYSTEM HARDWARE METERS */}
      <div className="grid grid-cols-12 gap-3 mb-3 items-stretch">
        {/* Top Left: Media Player Console */}
        <div className="col-span-12 lg:col-span-4 hud-panel hud-bevel-tl rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 text-[9px] tracking-wider font-bold">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              SAMPLERATE: 44.1 KHZ
            </span>
            <span>BITRATE: 320 KBPS</span>
            <span>CHANNELS: 2</span>
          </div>

          {/* Player controls */}
          <div className="flex items-center justify-between my-2">
            <div className="text-[10px] text-cyan-300 font-orbitron truncate max-w-[200px]">
              {isPlayingAudio ? trackList[currentTrackIndex] : 'STANDBY AUDIO MATRIX'}
            </div>
            <div className="text-[9px] text-cyan-500 font-mono">00:03:42</div>
          </div>

          <div className="flex items-center justify-between gap-1 pt-1 border-t border-cyan-500/20">
            <button
              onClick={handlePrevTrack}
              title="Previous Track"
              className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px]"
            >
              PREV
            </button>
            <button
              onClick={handleMediaPlayToggle}
              title={isPlayingAudio ? 'Pause' : 'Play Ambient Track'}
              className="px-3 py-1 rounded bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-[9px] flex items-center gap-1"
            >
              {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlayingAudio ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={() => {
                soundFx.stopAmbience();
                setIsPlayingAudio(false);
                setMicStatusText('AUDIO STOPPED');
              }}
              title="Stop"
              className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px]"
            >
              STOP
            </button>
            <button
              onClick={handleNextTrack}
              title="Next Track"
              className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px]"
            >
              NEXT
            </button>
          </div>
        </div>

        {/* Top Center & Right: J.A.R.V.I.S. CONVERSATIONAL COMM-LINK // SESSION INITIATED */}
        <div className="col-span-12 lg:col-span-8 hud-panel rounded-xl p-3 flex flex-col justify-between border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] relative overflow-hidden">
          {/* Subtle Cyber background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-black to-cyan-950/20 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 text-[10px]">
              <span className="font-orbitron font-bold text-white flex items-center gap-1.5 tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                J.A.R.V.I.S. CONVERSATIONAL COMM-LINK // GOOGLE GEMINI ACTIVE
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  GEMINI AI CONNECTED
                </span>
                <button
                  type="button"
                  onClick={handleTestMaleVoice}
                  title="Click to test masculine British voice sample"
                  className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950/80 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 text-cyan-300 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>VOICE: MALE ({activeVoiceName})</span>
                </button>
                <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  VERBAL REPLIES ARMED
                </span>
              </div>
            </div>

            {/* Vocal Prompt from J.A.R.V.I.S. */}
            <div className="my-2 p-2.5 rounded-lg bg-black/75 border border-cyan-500/30 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400/60 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-orbitron font-bold text-xs sm:text-sm tracking-wide text-cyan-100">
                  "Good day, {callsign}! How are you doing today, and what will be our tasks for this session?"
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  State how you are feeling and outline what you want to achieve. Tasks will be logged into your active matrix.
                </div>
              </div>
            </div>

            {/* Quick Response Chips: Feeling & Tasks */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[9px] font-mono">
              <span className="text-cyan-400 font-bold mr-1">QUICK VECTOR:</span>
              {[
                { label: '⚡ Doing great! Build feature matrix', task: 'Build core feature matrix' },
                { label: '🚀 Fired up! Test optical camera & gestures', task: 'Test optical camera and hand tracking' },
                { label: '🛡️ All nominal! Review architecture & diagnostics', task: 'Review architecture & run diagnostic scan' },
                { label: '🏆 Sprint on hackathon deliverables', task: 'Sprint on hackathon deliverables' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleAddTask(chip.task);
                    processVoiceInstruction(`I am ${chip.label.split('!')[0]}. Our task today is to ${chip.task}.`);
                  }}
                  className="px-2 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Response Form */}
          <form
            onSubmit={handleSendConversationReply}
            className="relative z-10 flex items-center gap-2 pt-2 border-t border-cyan-500/20"
          >
            <button
              type="button"
              onClick={handleToggleVoice}
              title={isListening ? 'Stop Listening' : 'Speak your answer directly to J.A.R.V.I.S.'}
              className={`p-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                  : 'bg-black/80 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? 'LISTENING' : 'SPEAK'}</span>
            </button>

            <input
              type="text"
              value={conversationReplyInput}
              onChange={(e) => setConversationReplyInput(e.target.value)}
              placeholder="Reply to J.A.R.V.I.S.: How are you doing & what will be our tasks today?..."
              className="flex-1 bg-black/90 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-orbitron flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SEND</span>
            </button>
          </form>
        </div>
      </div>

      {/* MAIN COCKPIT: LEFT GAUGES | GIANT CENTER ARC REACTOR (BIG!) | RIGHT WEATHER & CLOCK */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* LEFT COLUMN: ACTIVE SESSION MISSION TASKS & WORKSPACE STORAGE */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {/* ACTIVE MISSION TASKS & OBJECTIVES MATRIX */}
          <div className="hud-panel rounded-xl p-3 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 text-[10px]">
              <span className="font-orbitron font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                SESSION TASKS &amp; OBJECTIVES
              </span>
              <span className="text-[9px] text-cyan-300 font-mono font-bold">
                {sessionTasks.filter((t) => t.completed).length}/{sessionTasks.length} DONE
              </span>
            </div>

            {/* Tasks List */}
            <div className="my-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {sessionTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 transition-all ${
                    task.completed
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-slate-400 line-through'
                      : 'border-cyan-500/30 bg-black/60 text-slate-100 hover:border-cyan-400'
                  }`}
                >
                  <div
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        task.completed
                          ? 'border-emerald-400 bg-emerald-500 text-black'
                          : 'border-cyan-400/50 bg-black'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{task.text}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                    title="Remove Task"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Task Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask(newTaskInput);
              }}
              className="flex items-center gap-1.5 pt-1.5 border-t border-cyan-500/20"
            >
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="+ Add task for J.A.R.V.I.S..."
                className="flex-1 bg-black/80 px-2 py-1 rounded text-[10px] text-white border border-cyan-500/30 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Clean Workspace Directory & Storage Details */}
          <div
            onClick={() => handleRadialClick('XPLR')}
            title="Click to open Storage Drive Details"
            className="hud-panel rounded-xl p-3 text-[10px] cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1">
              <span className="font-bold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                WORKSPACE STORAGE // C:\
              </span>
              <span className="text-cyan-300">ONLINE</span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-slate-400">
              <div>
                <span>CAPACITY:</span>
                <p className="text-cyan-200 font-bold">447.7 GB</p>
              </div>
              <div>
                <span>ALLOCATED:</span>
                <p className="text-cyan-200 font-bold">247.1 GB</p>
              </div>
              <div>
                <span>FREE:</span>
                <p className="text-emerald-300 font-bold">200.6 GB</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-black rounded mt-2 border border-cyan-500/30 overflow-hidden">
              <div className="w-[55%] h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: THE BIG EXPANDED ARC REACTOR WITH RADIAL CLICKABLE RUNNERS & 3D MARK III WORLD */}
        <div className={`col-span-12 ${show3DAsideReactor ? 'lg:col-span-12 xl:col-span-6 2xl:col-span-6' : 'lg:col-span-6'} flex flex-col items-center justify-center relative min-h-[580px] transition-all duration-300`}>
          {/* Quick HUD Mode Bar for 3D Aside Reactor & Hologram Selector */}
          <div className="w-full flex flex-wrap items-center justify-between mb-3 px-2 z-20 gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span className="text-cyan-400 font-bold hidden sm:inline">CENTER ARCHITECTURE:</span>
              <button
                onClick={() => {
                  setShow3DAsideReactor(false);
                  if (soundEnabled) soundFx.playClick();
                }}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-orbitron transition-all cursor-pointer ${
                  !show3DAsideReactor
                    ? 'bg-cyan-500 text-black border-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-black/60 text-slate-400 border-cyan-500/30 hover:text-white'
                }`}
              >
                REACTOR ONLY
              </button>
              <button
                onClick={() => {
                  setShow3DAsideReactor(true);
                  if (soundEnabled) soundFx.playClick();
                }}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-orbitron transition-all cursor-pointer flex items-center gap-1 ${
                  show3DAsideReactor
                    ? 'bg-purple-600 text-white border-purple-300 font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'bg-black/60 text-slate-400 border-cyan-500/30 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3 text-purple-300" />
                <span>3D WORLD ASIDE</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick Hologram Selector Dropdown/Pills */}
              {show3DAsideReactor && (
                <div className="flex items-center gap-1 bg-black/80 p-0.5 rounded-lg border border-cyan-500/30 text-[9px] font-orbitron">
                  <Palette className="w-3 h-3 text-cyan-400 ml-1 hidden sm:inline" />
                  {(['mark-iii', 'hulkbuster', 'mark-lxxxv', 'arc-core'] as const).map((pid) => (
                    <button
                      key={pid}
                      onClick={() => {
                        setActiveHologramPreset(pid);
                        if (soundEnabled) soundFx.playHologramPing();
                      }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeHologramPreset === pid
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-slate-400 hover:text-cyan-300'
                      }`}
                    >
                      {pid === 'mark-iii'
                        ? 'MK-III'
                        : pid === 'hulkbuster'
                        ? 'HULKBUSTER'
                        : pid === 'mark-lxxxv'
                        ? 'MK-85'
                        : 'ARC CORE'}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setIsFullscreen3D(true);
                  if (soundEnabled) soundFx.playHologramPing();
                }}
                title="Expand 3D World to Fullscreen"
                className="px-2.5 py-1 rounded-lg border border-purple-400/60 bg-purple-950/60 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-orbitron font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>EXPAND 3D</span>
              </button>
            </div>
          </div>

          <div className={`w-full flex flex-col ${show3DAsideReactor ? 'xl:flex-row items-center justify-center gap-4' : 'items-center justify-center'}`}>
            <div className="flex flex-col items-center justify-center">
              {/* Main Giant Circular Interface: MADE BIG! */}
              <div className={`relative ${show3DAsideReactor ? 'w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]' : 'w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[580px] lg:h-[580px]'} flex items-center justify-center transition-all duration-300`}>
                {/* Outer Compass & Tick Marks ring */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/30 flex items-center justify-center">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-[1.5px] h-3.5 bg-cyan-400/50 origin-bottom"
                      style={{
                        transform: `rotate(${i * 7.5}deg) translateY(-${
                          typeof window !== 'undefined' && window.innerWidth < 640 ? 150 : show3DAsideReactor ? 190 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 260 : 285
                        }px)`,
                      }}
                    />
                  ))}
                </div>

                {/* Geared Outer Ring with Animation */}
                <div
                  className={`absolute inset-4 sm:inset-6 rounded-full border-2 border-dashed border-cyan-400/60 ${
                    animationActive ? 'animate-spin-slow' : ''
                  }`}
                />

                {/* Counter-Clockwise Segment Ring */}
                <div
                  className={`absolute inset-10 sm:inset-14 rounded-full border border-t-4 border-b-4 border-cyan-300/50 ${
                    animationActive ? 'animate-spin-reverse-slow' : ''
                  }`}
                />

                {/* Radial interactive HUD Buttons: EVERY BUTTON RUNS A TANGIBLE ACTION! */}
                {[
                  { label: 'DOCS', angle: 180, desc: 'Project Documentation' },
                  { label: 'CTRL', angle: 210, desc: 'System Controls' },
                  { label: 'DESK', angle: 240, desc: 'Desktop Mode' },
                  { label: 'CAM', angle: 270, desc: 'Optical Vision & Hand Gestures' },
                  { label: '3D', angle: 300, desc: '3D Mark III World' },
                  { label: 'XPLR', angle: 30, desc: 'System Explorer' },
                  { label: 'CHRM', angle: 60, desc: 'Diagnostics Scan' },
                  { label: 'GAME', angle: 90, desc: 'Game Mode Overclock' },
                  { label: 'CFG', angle: 120, desc: 'Neural Memory & Config' },
                  { label: 'VOL', angle: 150, desc: 'Audio Sound Toggle' },
                ].map((btn, i) => {
                  const rad = (btn.angle * Math.PI) / 180;
                  const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : show3DAsideReactor ? 160 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 195 : 215;
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;

                  return (
                    <button
                      key={i}
                      onClick={() => handleRadialClick(btn.label)}
                      title={`Run: ${btn.desc}`}
                      className="group absolute w-14 h-7 sm:w-16 sm:h-8 rounded-lg border border-cyan-400/80 bg-black/90 hover:bg-cyan-500 hover:text-black text-cyan-300 text-[10px] font-bold font-mono tracking-widest flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-115 active:scale-95 z-20 cursor-pointer"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      <span className="group-hover:font-black">{btn.label}</span>
                    </button>
                  );
                })}

                {/* Middle Glow Ring */}
                <div className="absolute inset-20 sm:inset-28 rounded-full border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(0,240,255,0.5)] flex items-center justify-center bg-cyan-950/25 pointer-events-none" />

                {/* 10 Arc Reactor Glowing Coils (Made Larger) */}
                <div className="absolute inset-24 sm:inset-36 rounded-full flex items-center justify-center pointer-events-none">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-10 sm:w-5 sm:h-14 rounded-xs border-2 border-cyan-300 bg-cyan-400/40 shadow-[0_0_15px_#00f0ff] origin-bottom"
                      style={{
                        transform: `rotate(${i * 36}deg) translateY(-${
                          typeof window !== 'undefined' && window.innerWidth < 640 ? 55 : show3DAsideReactor ? 75 : 100
                        }px)`,
                      }}
                    />
                  ))}
                </div>

                {/* Inner Glowing Center Core: MADE BIGGER & INTERACTIVE */}
                <div
                  onClick={handleToggleVoice}
                  title={isListening ? 'Click to Stop Listening' : 'Click to Talk to J.A.R.V.I.S. (Speech Command)'}
                  className={`group relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 z-30 ${
                    isListening
                      ? 'scale-110 ring-4 ring-rose-500 bg-rose-950/90 shadow-[0_0_60px_rgba(244,63,94,0.9)]'
                      : 'hover:scale-105 bg-gradient-to-b from-cyan-400/30 to-black/90 ring-2 ring-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.7)]'
                  }`}
                >
                  {/* Triangular Core Icon (Iron Man Signature) - BIGGER! */}
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-all ${
                      isListening ? 'animate-ping' : ''
                    }`}
                    style={{
                      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                      backgroundColor: isListening ? '#f43f5e' : '#ffffff',
                      boxShadow: isListening ? '0 0 35px #f43f5e' : '0 0 30px #00f0ff',
                    }}
                  />

                  <div className="text-xs sm:text-sm font-black font-orbitron text-cyan-200 mt-2">
                    {overclockLevel}%
                  </div>
                  <div className={`text-[9px] tracking-wider font-mono font-bold ${isListening ? 'text-rose-300 animate-pulse' : 'text-cyan-300'}`}>
                    {isListening ? 'LISTENING NOW' : 'CLICK TO TALK'}
                  </div>
                </div>
              </div>

              {/* Quick Voice & Command Prompt directly below Big Reactor */}
              <div className="w-full max-w-lg mt-4 px-2">
                <form
                  onSubmit={handleSendInlineMessage}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                >
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={isListening ? 'Stop Listening' : 'Voice Command (Talk to JARVIS)'}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse border-rose-400'
                        : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black'
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={inlineChatInput}
                    onChange={(e) => setInlineChatInput(e.target.value)}
                    placeholder="Give J.A.R.V.I.S. an instruction or write: 'Remember: ...'"
                    className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder-cyan-600 focus:outline-none"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* 3D HOLOGRAPHIC MARK III WORLD ASIDE REACTOR */}
            {show3DAsideReactor && (
              <div className="w-full xl:w-[380px] 2xl:w-[440px] h-[480px] flex-shrink-0 animate-in fade-in zoom-in-95 duration-300 mt-4 xl:mt-0">
                <ThreeIronManWorld
                  mode="aside"
                  soundEnabled={soundEnabled}
                  themeColor={themeColor}
                  activePresetId={activeHologramPreset}
                  onPresetChange={setActiveHologramPreset}
                  title={`3D WORLD // ${activeHologramPreset.replace('-', ' ').toUpperCase()}`}
                  onMaximize={() => {
                    setIsFullscreen3D(true);
                    if (soundEnabled) soundFx.playHologramPing();
                  }}
                  onClose={() => setShow3DAsideReactor(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Atmospheric Weather, Digital Clock, GPU Vitals, System Armed */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {/* Futuristic Digital Clock (Clickable: toggles 12h/24h) */}
          <div
            onClick={() => {
              if (soundEnabled) soundFx.playClick();
              setIs24Hour(!is24Hour);
              setMicStatusText(is24Hour ? 'CLOCK: 12-HOUR FORMAT' : 'CLOCK: 24-HOUR MILITARY FORMAT');
            }}
            title="Click to toggle 12-Hour / 24-Hour format"
            className="hud-panel rounded-xl p-3 text-center cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <div className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
              MOUNTAIN STANDARD TIME // {is24Hour ? '24-HOUR MILITARY' : 'LOCAL CLOCK'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-orbitron text-cyan-300 tracking-wider my-1 drop-shadow-[0_0_12px_#00f0ff]">
              {timeString}
            </div>
            <div className="text-[10px] text-cyan-400 font-bold">{dateString}</div>
          </div>

          {/* Atmospheric Weather Station (Clickable: cycles city/units) */}
          <div
            onClick={() => {
              if (soundEnabled) soundFx.playClick();
              setWeatherCity((prev) =>
                prev === 'JUAREZ, MEXICO'
                  ? 'NEW YORK, USA'
                  : prev === 'NEW YORK, USA'
                  ? 'TOKYO, JAPAN'
                  : 'JUAREZ, MEXICO'
              );
              setTempUnit((prev) => (prev === 'C' ? 'F' : 'C'));
            }}
            title="Click to cycle weather city & units"
            className="hud-panel rounded-xl p-3 text-[10px] space-y-1.5 cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1">
              <span className="font-bold flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
                ATMOSPHERIC STATION
              </span>
              <span className="text-[9px] text-slate-400 font-bold">{weatherCity}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-2xl font-black font-orbitron text-white">
                  {tempUnit === 'C' ? '30°C' : '86°F'}
                </div>
                <div className="text-[10px] text-cyan-300 font-bold">FAIR // HUMIDITY: 14%</div>
              </div>
              <div className="text-right text-[9px] text-slate-400">
                <div>WIND: 8 KM/H (E)</div>
                <div>PRESSURE: 1015.2 MB</div>
                <div>VISIBILITY: 16.1 KM</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400 pt-1 border-t border-cyan-500/20">
              <div>SUNRISE: 7:00 AM</div>
              <div>SUNSET: 8:19 PM</div>
              <div>MOON: WANING CRESCENT</div>
              <div className="text-cyan-300">PRECIPITATION: 0%</div>
            </div>
          </div>

          {/* Lower Right: TACTICAL PROTOCOLS & DIRECTIVES */}
          <div
            onClick={() => handleRadialClick('CFG')}
            title="Click to open System Config"
            className="hud-panel rounded-xl p-3 text-[10px] cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1">
              <span className="font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                TACTICAL PROTOCOLS
              </span>
              <span className="text-emerald-400 font-bold">ARMED</span>
            </div>

            <div className="mt-2 space-y-1.5 text-[9px]">
              <div className="flex justify-between text-slate-400">
                <span>SYSTEM MODE:</span>
                <span className="text-cyan-300 font-bold font-orbitron">{activeMode}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>LEARNED DIRECTIVES:</span>
                <span className="text-purple-300 font-bold">{learnedMemories.length} STORED</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-cyan-500/20 pt-1">
                <span>FIREWALL STATUS:</span>
                <span className="text-emerald-400 font-bold">ARMED &amp; SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPTICAL SENSORS & REAL-TIME HAND GESTURE RECOGNITION (5, 4, 3 FINGERS) */}
      <div className="mt-4">
        <HandGestureController
          isCameraModalOpen={isCameraModalOpen}
          onCloseCameraModal={() => setIsCameraModalOpen(false)}
          onOpenCameraFull={() => setIsCameraModalOpen(true)}
          onOpenNewTab={() => setMicStatusText('GESTURE DETECTED: 4 FINGERS -> NEW TAB LAUNCHED')}
          onOpenYouTube={() => setMicStatusText('GESTURE DETECTED: 3 FINGERS -> YOUTUBE FEED ACTIVE')}
          soundEnabled={soundEnabled}
          themeColor={themeColor}
          onRequestChatMessage={(msg) => onSendMessage(msg)}
          externalCameraCommand={externalCameraCommand}
          onCameraStateChange={(active) => setIsCameraActive(active)}
        />
      </div>

      {/* BIG BOTTOM BRANDING: STARK INDUSTRIES (Clickable to trigger core power pulse!) */}
      <div
        onClick={handleStarkLogoClick}
        title="Click to run full Stark Industries Core Overcharge"
        className="mt-6 flex flex-col items-center justify-center cursor-pointer group"
      >
        <div className="relative px-12 py-3 border-t-2 border-b-2 border-cyan-400 bg-gradient-to-r from-transparent via-cyan-950/80 to-transparent flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-all">
          <span className="font-orbitron font-black text-2xl sm:text-3xl md:text-4xl tracking-[0.3em] text-cyan-200 uppercase drop-shadow-[0_0_18px_#00f0ff] group-hover:text-white">
            STARK INDUSTRIES
          </span>
        </div>
        <div className="text-[10px] font-mono text-cyan-500/80 mt-1 tracking-widest flex items-center gap-2">
          <span>SECURITY LEVEL 4 // ADVANCED TACTICAL RESEARCH DIVISION</span>
          <span className="text-cyan-400 font-bold">[CLICK TO PULSE &amp; TALK]</span>
        </div>
      </div>

      {/* RUNNABLE SUBSYSTEM: DOCS (5 Runnable Architecture & Blueprint Files) */}
      {activeSubsystemModal === 'DOCS' && (
        <DocsSubsystem
          onClose={() => setActiveSubsystemModal(null)}
          onSendMessage={onSendMessage}
          onAddMemory={onAddMemory}
          soundEnabled={soundEnabled}
        />
      )}

      {/* RUNNABLE SUBSYSTEM: DESK (4 Runnable Productivity Apps & Task Suite) */}
      {activeSubsystemModal === 'DESK' && (
        <DeskSubsystem
          onClose={() => setActiveSubsystemModal(null)}
          onSendMessage={onSendMessage}
          soundEnabled={soundEnabled}
          callsign={callsign}
        />
      )}

      {/* RUNNABLE SUBSYSTEM: GAME (3 Playable Tactical Games & Combat Simulators) */}
      {activeSubsystemModal === 'GAME' && (
        <GameSubsystem
          onClose={() => setActiveSubsystemModal(null)}
          onSendMessage={onSendMessage}
          soundEnabled={soundEnabled}
        />
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: CTRL (SYSTEM CONTROLS) */}
      {activeSubsystemModal === 'CTRL' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                SUBSYSTEM: [CTRL] SYSTEM CONTROLS &amp; POWER DISTRIBUTION
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">CORE OVERCLOCK THROTTLE</span>
                  <span className="text-cyan-300 font-bold">{overclockLevel}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={overclockLevel}
                  onChange={(e) => setOverclockLevel(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">COOLING FAN VELOCITY</span>
                  <span className="text-cyan-300 font-bold">{fanSpeed} RPM</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="4500"
                  step="100"
                  value={fanSpeed}
                  onChange={(e) => setFanSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShieldActive(!shieldActive);
                    if (soundEnabled) soundFx.playClick();
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                    shieldActive ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300' : 'border-slate-800 bg-black text-slate-500'
                  }`}
                >
                  <span>DEFENSE SHIELD</span>
                  <span>{shieldActive ? 'ARMED' : 'OFFLINE'}</span>
                </button>

                <button
                  onClick={() => {
                    setFirewallArmed(!firewallArmed);
                    if (soundEnabled) soundFx.playClick();
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                    firewallArmed ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300' : 'border-slate-800 bg-black text-slate-500'
                  }`}
                >
                  <span>FIREWALL MATRIX</span>
                  <span>{firewallArmed ? 'ONLINE' : 'BYPASS'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end mt-2">
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: XPLR (STORAGE EXPLORER) */}
      {activeSubsystemModal === 'XPLR' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                SUBSYSTEM: [XPLR] SYSTEM STORAGE &amp; DIRECTORY EXPLORER
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-2 text-slate-300 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-black/60 border border-cyan-500/30">
                  <span className="text-slate-400 block">SYSTEM DRIVE // C:\</span>
                  <span className="text-cyan-300 font-bold">447.7 GB TOTAL (200.6 GB FREE)</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-cyan-500/30">
                  <span className="text-slate-400 block">NEURAL CACHE // MEM_0</span>
                  <span className="text-emerald-300 font-bold">{learnedMemories.length} DIRECTIVES STORED</span>
                </div>
              </div>
              <div className="p-2 rounded bg-black/80 font-mono text-[10px] text-cyan-300 space-y-1">
                <div>📁 /app/mainframe/core.bin [98.6% SYNC]</div>
                <div>📁 /app/speech/voice_en_gb.synth [ACTIVE]</div>
                <div>📁 /app/gemini/model_3.8_flash.socket [ONLINE]</div>
                <div>📁 /app/tactics/war_room_sprint.json [ARMED]</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: CHRM (DIAGNOSTIC SCAN) */}
      {activeSubsystemModal === 'CHRM' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                SUBSYSTEM: [CHRM] HARDWARE &amp; SYSTEM DIAGNOSTIC
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center py-4 space-y-3">
              <div className="text-3xl font-black font-orbitron text-cyan-300">
                {scanProgress}%
              </div>
              <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-cyan-500/40">
                <div
                  className="h-full bg-cyan-400 shadow-[0_0_12px_#00f0ff] transition-all duration-200"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-300">
                {isScanning
                  ? 'SCANNING CPU BUS, MEMORY HEAP, AND NEURAL LINK...'
                  : 'ALL HARDWARE SUBSYSTEMS OPERATIONAL // THREAT LEVEL: NOMINAL'}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleRunDiagnosticScan}
                disabled={isScanning}
                className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer"
              >
                Re-Run Scan
              </button>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: CFG (CONFIGURATION & NEURAL MEMORY) */}
      {activeSubsystemModal === 'CFG' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                SUBSYSTEM: [CFG] SYSTEM CONFIG &amp; NEURAL MEMORY
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {/* Theme Colors */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  OPTICAL HUD COLOR MATRIX
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cyan', label: 'Stark Blue', bg: 'bg-cyan-500' },
                    { id: 'amber', label: 'Gold (Mark XLII)', bg: 'bg-amber-500' },
                    { id: 'emerald', label: 'Stealth Matrix', bg: 'bg-emerald-500' },
                    { id: 'crimson', label: 'Alert Protocol', bg: 'bg-rose-500' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onChangeTheme(t.id as any)}
                      className={`p-2 rounded-lg border text-[10px] font-bold text-center flex flex-col items-center gap-1 cursor-pointer ${
                        themeColor === t.id
                          ? 'border-white text-white bg-white/10'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.bg}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Callsign Editor */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  COMMANDER CALLSIGN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    className="flex-1 bg-black px-3 py-1.5 rounded-lg border border-slate-700 text-white text-xs"
                  />
                  <button
                    onClick={handleSaveUserName}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Neural Memory Directives List */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-purple-400 font-bold flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" />
                    LEARNED DIRECTIVES ({learnedMemories.length})
                  </label>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto bg-black/60 p-2 rounded-lg border border-purple-500/30">
                  {learnedMemories.length === 0 ? (
                    <div className="text-[10px] text-slate-500 text-center py-2">
                      No custom directives taught yet. Teach J.A.R.V.I.S. in chat or below!
                    </div>
                  ) : (
                    learnedMemories.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] p-1.5 rounded bg-black/80 border border-purple-500/20 text-slate-200"
                      >
                        <span>#{idx + 1}: {rule}</span>
                        <button
                          onClick={() => onDeleteMemory(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Rule Form */}
                <form onSubmit={handleAddDirectRule} className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="Add a new rule for J.A.R.V.I.S. to learn..."
                    className="flex-1 bg-black px-2.5 py-1 rounded-lg border border-purple-500/40 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Teach Rule
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end mt-4">
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: EQ (EQUALIZER) */}
      {activeSubsystemModal === 'EQ' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                SUBSYSTEM: [EQ] AUDIO EQUALIZER &amp; HARMONIC BANDS
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 py-4">
              {['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'].map((freq, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="h-32 w-4 bg-black rounded-full relative flex items-end p-0.5 border border-cyan-500/30">
                    <div
                      className="w-full bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]"
                      style={{ height: `${40 + (idx * 12) % 60}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">{freq}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleMediaPlayToggle}
                className="px-3 py-1 rounded bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                {isPlayingAudio ? 'Pause Stream' : 'Test Audio Stream'}
              </button>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUNNABLE SUBSYSTEM MODAL: MIC_HELP (MICROPHONE DIAGNOSTIC & TROUBLESHOOTING) */}
      {activeSubsystemModal === 'MIC_HELP' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full hud-panel rounded-2xl p-4 border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <div className="flex items-center justify-between border-b border-rose-500/40 pb-2 mb-3">
              <span className="text-xs font-orbitron font-bold text-rose-300 flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-400" />
                MICROPHONE PERMISSION &amp; DIAGNOSTIC
              </span>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-slate-300 py-2">
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200">
                <strong>Microphone Status:</strong>{' '}
                {micError ? micError : isListening ? 'Active and capturing voice' : 'Standby'}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-400">
                <p className="text-white font-bold">How to enable in 2 seconds:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Look at your browser's address bar (URL bar).</li>
                  <li>Click the <strong>Microphone / Tune / Lock icon</strong> next to the URL.</li>
                  <li>Toggle <strong>Microphone</strong> to <strong>Allow</strong>.</li>
                  <li>Click the "Test &amp; Enable Now" button below.</li>
                </ol>
              </div>

              {isListening && (
                <div className="p-2 rounded bg-black/60 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Hearing your voice! Volume Level: {micVolumeLevel}%</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center mt-2">
              <button
                onClick={startListening}
                className="px-4 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                Test &amp; Enable Now
              </button>
              <button
                onClick={() => setActiveSubsystemModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP AI CHATBOT MODAL WITH NEURAL MEMORY & DIRECTIVES VIEW */}
      {isChatOpen && (
        <div className="fixed inset-y-10 right-4 w-full max-w-xl z-50 hud-panel hud-panel-glow rounded-2xl flex flex-col shadow-2xl border-cyan-400 overflow-hidden animate-in fade-in slide-in-from-right duration-300">
          {/* Chatbot Header */}
          <div className="flex items-center justify-between p-3 border-b border-cyan-500/40 bg-cyan-950/90">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="font-orbitron font-bold text-xs text-white tracking-wider">
                J.A.R.V.I.S. AI COGNITIVE CHATBOT
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Learned Memory in Chat */}
              <button
                onClick={() => setShowMemoryInChat(!showMemoryInChat)}
                title="View what J.A.R.V.I.S. has learned"
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-purple-500/50 bg-purple-950/40 text-purple-300 text-[10px] font-bold cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>{learnedMemories.length} LEARNED</span>
              </button>

              <button
                onClick={onOpenChat}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Learned Directives Drawer Inside Chat */}
          {showMemoryInChat && (
            <div className="p-3 bg-purple-950/30 border-b border-purple-500/40 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold uppercase">
                <span>🧠 ACTIVE NEURAL MEMORIES LEARNED FROM YOU</span>
                <span className="text-slate-400">Injected into Gemini core</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {learnedMemories.length === 0 ? (
                  <div className="text-[10px] text-slate-400">
                    No custom rules yet. Type: <em>"Jarvis, remember: [instruction]"</em> to teach it!
                  </div>
                ) : (
                  learnedMemories.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[10px] p-1.5 rounded bg-black/60 border border-purple-500/30 text-slate-200"
                    >
                      <span>#{idx + 1}: {rule}</span>
                      <button
                        onClick={() => onDeleteMemory(idx)}
                        className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Voice / Live Status readout */}
          <div className="p-3 bg-black/85 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
            {lastAssistantMessage ? (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] sm:text-xs">
                {lastAssistantMessage}
              </div>
            ) : (
              <div className="text-center py-10 text-cyan-600">
                <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin-slow" />
                <p className="font-bold text-sm text-cyan-300">J.A.R.V.I.S. Neural Core Ready</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Type instructions to make changes, teach custom rules, or ask any technical/competition question. J.A.R.V.I.S. adapts and learns dynamically.
                </p>
              </div>
            )}

            {isGeneratingResponse && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse text-xs">
                <Zap className="w-4 h-4 animate-spin-slow" />
                <span>J.A.R.V.I.S. computing tactical telemetry &amp; assimilating directives...</span>
              </div>
            )}
          </div>

          {/* Chatbot Quick Training Chips */}
          <div className="px-3 py-1.5 bg-black/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[9px]">
            <span className="text-purple-400 whitespace-nowrap">TEACH:</span>
            {[
              'Show 3D Mark III aside reactor',
              'Turn off camera',
              'Remember: our stack is React 19 + Python FastAPI',
              'Change my callsign to Commander',
              'Switch to game mode',
              'Change theme to Amber Gold',
            ].map((tip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  processVoiceInstruction(tip);
                }}
                className="px-2 py-0.5 rounded border border-purple-500/30 text-purple-300 hover:text-white bg-purple-950/30 whitespace-nowrap cursor-pointer"
              >
                "{tip}"
              </button>
            ))}
          </div>

          {/* Chatbot Input */}
          <div className="p-3 border-t border-cyan-500/30 bg-cyan-950/50">
            <form onSubmit={handleSendInlineMessage} className="flex gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isListening ? 'Stop Listening' : 'Speak to JARVIS'}
                className={`p-2 rounded-xl border cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse border-rose-400'
                    : 'bg-black border-cyan-500/40 text-cyan-300'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inlineChatInput}
                onChange={(e) => setInlineChatInput(e.target.value)}
                placeholder="Give J.A.R.V.I.S. an instruction or write: 'Remember: ...'"
                className="flex-1 bg-black/90 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-white text-xs focus:outline-none focus:border-cyan-400"
              />

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPANDED FULL-SCREEN 3D WORLD MODAL */}
      {isFullscreen3D && (
        <ThreeIronManWorld
          mode="fullscreen"
          onClose={() => setIsFullscreen3D(false)}
          soundEnabled={soundEnabled}
          themeColor={themeColor}
          activePresetId={activeHologramPreset}
          onPresetChange={setActiveHologramPreset}
          title={`STARK INDUSTRIES 3D WORLD // ${activeHologramPreset.replace('-', ' ').toUpperCase()} HOLOGRAPHIC PROJECTION`}
        />
      )}
    </div>
  );
};
