import React, { useState } from 'react';
import { soundFx } from '../../utils/audioEffects';
import { jarvisVoice } from '../../utils/speechEngine';
import {
  FileText,
  X,
  Play,
  Copy,
  Check,
  Send,
  Download,
  BookOpen,
  Terminal,
  Shield,
  Zap,
  Cpu,
  Search,
} from 'lucide-react';

export interface DocFile {
  id: string;
  name: string;
  category: 'FLIGHT' | 'HARDWARE' | 'TACTICS' | 'AI_CORE' | 'DEFENSE';
  size: string;
  description: string;
  content: string;
  runnableActionDescription: string;
  executableRules: string[];
}

const DOC_FILES: DocFile[] = [
  {
    id: 'doc-1',
    name: '01_MARK_VIII_FLIGHT_MANUAL.md',
    category: 'FLIGHT',
    size: '18.4 KB',
    description: 'Operating procedures, repulsor vectoring, and supersonic transition protocols.',
    runnableActionDescription: 'Engage Mark VIII Flight Telemetry & Thruster Calibration',
    executableRules: [
      'Flight thruster vectoring locked to Mach 3.2 transition threshold.',
      'Inertial dampers operating at 99.8% harmonic damping.',
      'Repulsor auto-stabilization engaged for combat maneuvers.',
    ],
    content: `# MARK VIII ARMOR // FLIGHT OPERATION & THRUSTER DYNAMICS
**CLASSIFICATION:** LEVEL 4 EYES ONLY // STARK INDUSTRIES AVIONICS

## 1. PRE-FLIGHT IGNITION PROTOCOL
1. Initiate Arc Reactor power relay to boot thruster vector coils.
2. Verify dual-stage boot sequence:
   \`\`\`bash
   $ stark-avionics --ignite-thrusters --power-level=85%
   [OK] BOOT THRUSTER COILS 1 & 2: 12,400 N THRUST PRIMED
   [OK] STABILIZER GYROS: CALIBRATED (LATENCY < 2ms)
   \`\`\`
3. Check inertial damper buffer: Must maintain minimum 99.4% stability prior to transonic flight.

## 2. SUPERSONIC TRANSITION (MACH 1.0 -> MACH 3.5)
- **Aileron Flaps:** Auto-deploy at Mach 0.92 to prevent sonic buffeting.
- **Micro-Thruster Vectoring:** Repulsors pulse at 440 Hz for continuous pitch trim.
- **Hull Thermal Dissipation:** Cryo-coolant micro-channels flush automatically when external skin hits 380°C.

## 3. COMBAT EVASION ALGORITHMS
- Algorithm **DELTA-9**: Rapid barrel-roll with counter-repulsor airbrake.
- Algorithm **OMEGA-TANGENT**: Zero-G vertical drop with immediate ground skimming trajectory.`,
  },
  {
    id: 'doc-2',
    name: '02_ARC_REACTOR_POWER_DISTRIBUTION.md',
    category: 'HARDWARE',
    size: '24.1 KB',
    description: 'Core geometry, palladium substitute synthesis, and harmonic resonance tuning.',
    runnableActionDescription: 'Calibrate Arc Reactor Power Rails & Core Flux',
    executableRules: [
      'Arc Reactor core flux balanced at 3.2 Gigajoules/sec.',
      'Palladium substitute element synthetic lattice active.',
      'Overcharge surge protector primed for repulsor cannon discharges.',
    ],
    content: `# ARC REACTOR MARK V // POWER DISTRIBUTION & CORE RESONANCE
**STARK INDUSTRIES RESEARCH DIVISION // ENERGY SYSTEMS GROUP**

## 1. CORE ARCHITECTURE & CHEMICAL MATRIX
The central power unit utilizes a synthetic non-decaying vibrational element synthesized via heavy particle acceleration.
- **Energy Output Rate:** 3.2 Gigajoules per second (Nominal Operating Load: 85%)
- **Magnetic Containment Field:** Superconducting toroidal coils rated at 45 Tesla
- **Thermal Byproduct:** < 38°C due to quantum thermoelectric reclamation circuits

## 2. VOLTAGE DISTRIBUTION CHANNELS
\`\`\`
[ARC CORE] ───┬───> [PRIMARY BUS] ───> 48% (Repulsor Turbines & Weapons)
              ├───> [SECONDARY BUS] ─> 32% (Flight Thrusters & Life Support)
              └───> [NEURAL BUS] ────> 20% (J.A.R.V.I.S. Core & HUD Holograms)
\`\`\`

## 3. EMERGENCY OVERCHARGE PROTOCOL
In tactical war-room conditions, issue instruction:
*"Overcharge Reactor to 120%"*
- Core coils pulse at 1.2x safety ceiling for up to 90 seconds.
- Shield deflection rating increases by 45%.`,
  },
  {
    id: 'doc-3',
    name: '03_COMPETITION_HACKATHON_TACTICS.md',
    category: 'TACTICS',
    size: '14.8 KB',
    description: 'Rapid prototyping vectors, competitive radar intelligence, and presentation dominance.',
    runnableActionDescription: 'Arm Competition War-Room Sprint Tactics in J.A.R.V.I.S.',
    executableRules: [
      'Sprint priority: Ship working interactive MVP within first 25% of hackathon timeline.',
      'Competitor radar scanning for UX parity and unfair technical differentiators.',
      'Presentation doctrine: Live demo superiority over static pitch decks.',
    ],
    content: `# COMPETITION & HACKATHON WAR-ROOM TACTICAL BLUEPRINT
**STRATEGY DIVISION // COGNITIVE COMBAT MATRIX**

## 1. THE 24-HOUR SPRINT VECTOR
- **Phase 0 (Hour 0 - 2):** Lock the "Unfair Advantage" feature. Discard 80% of secondary scope.
- **Phase 1 (Hour 2 - 8):** Build the critical clickable backbone. Deploy to production URL immediately.
- **Phase 2 (Hour 8 - 18):** Integrate real intelligence APIs (Gemini 3.8 Flash, live Web Audio, real-time reactive UI).
- **Phase 3 (Hour 18 - 24):** Zero-friction polish, keyboard shortcuts, voice interaction, cinematic micro-animations.

## 2. COMPETITOR RADAR TELEMETRY
\`\`\`
[RADAR SCAN]
├── Competitor Vector A: Generic CRUD app with basic form inputs (Threat: Low)
├── Competitor Vector B: Complex backend with broken visual presentation (Threat: Medium)
└── OUR COCKPIT VECTOR: Real-time voice control + live HUD + neural learning (Threat: Lethal Superiority)
\`\`\`

## 3. JUDGING & DEMO DIRECTIVES
- Never apologize for incomplete minor features; showcase the showstopping core capability.
- Speak with decisive executive calm and let the tactile speed of the application speak.`,
  },
  {
    id: 'doc-4',
    name: '04_GEMINI_COGNITIVE_API_SPEC.md',
    category: 'AI_CORE',
    size: '22.0 KB',
    description: 'API architecture, endpoints, system instructions, and real-time neural memory schemas.',
    runnableActionDescription: 'Sync Gemini AI Core Neural Parameters & Memory Pipelines',
    executableRules: [
      'Gemini Model: gemini-3.8-flash for instant reasoning and HUD tactical formatting.',
      'Audio Transcribe: gemini-3.5-transcribe for audio fallback processing.',
      'All user instructions dynamically assimilate into persistent neural directives.',
    ],
    content: `# J.A.R.V.I.S. NEURAL LINK // GEMINI API ARCHITECTURE
**STARK COGNITIVE SYSTEMS // API CONTRACT SPECIFICATION**

## 1. ENDPOINT MATRIX
| Route | Method | Payload | Function |
|---|---|---|---|
| \`/api/jarvis/chat\` | POST | \`{ message, mode, learnedMemories }\` | Tactical reasoning + dynamic system actions |
| \`/api/jarvis/transcribe\` | POST | \`{ audioData, mimeType }\` | Gemini 3.5 Transcribe voice fallback |
| \`/api/health\` | GET | None | Hardware mainframe status & API key verification |

## 2. NEURAL MEMORY ASSIMILATION PIPELINE
When a user instructs *"Remember: [rule]"*, the backend regex extractor parses:
1. Regex \`/(?:remember that|learn that|rule:)\s+([^.]+)/i\`
2. Dispatches \`newLearnedRules\` array back to the React UI.
3. Automatically saves to \`localStorage.jarvis_neural_memories\`.
4. Re-injects into all future Gemini system prompts as active training context.`,
  },
  {
    id: 'doc-5',
    name: '05_STARK_CYBER_DEFENSE_DIRECTIVES.md',
    category: 'DEFENSE',
    size: '16.5 KB',
    description: 'Firewall intrusion counter-measures, honeypot deployment, and neural lockdown.',
    runnableActionDescription: 'Deploy Stark Cyber Defense & Intrusion Shielding',
    executableRules: [
      'Quantum firewall configured to drop malicious packet floods within 1.2ms.',
      'Honeypot decoys active on ports 8080 and 3306.',
      'Memory heap sandboxed against buffer overflows and prompt injections.',
    ],
    content: `# STARK CYBER DEFENSE // INTRUSION COUNTER-MEASURES
**NETWORK SECURITY PROTOCOL // LEVEL 4 ENCRYPTION**

## 1. PERIMETER FIREWALL CONFIGURATION
- **Packet Inspection:** Deep neural telemetry analyzer rejecting malformed TCP SYN floods.
- **Port Masking:** Ports 1024 - 65535 obscured via pseudo-random frequency hopping.
- **Honeypot Subsystems:** Fake database instances capture unauthorized reconnaissance attempts.

## 2. EMERGENCY NEURAL LOCKDOWN
If an anomaly is detected in the cognitive bus:
1. Sever public WAN sockets.
2. Flush volatile memory registers.
3. Revert to isolated local procedural heuristics engine.
4. Notify Commander immediately via priority comm-link.`,
  },
];

interface DocsSubsystemProps {
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onAddMemory: (rule: string) => void;
  soundEnabled?: boolean;
}

export const DocsSubsystem: React.FC<DocsSubsystemProps> = ({
  onClose,
  onSendMessage,
  onAddMemory,
  soundEnabled = true,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile>(DOC_FILES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [executionNotice, setExecutionNotice] = useState<string | null>(null);

  const filteredDocs = DOC_FILES.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDoc = (doc: DocFile) => {
    if (soundEnabled) soundFx.playClick();
    setSelectedDoc(doc);
    setExecutionNotice(null);
  };

  // Execute the document directives directly in J.A.R.V.I.S. Mainframe!
  const handleExecuteDocumentDirectives = () => {
    if (soundEnabled) soundFx.playHologramPing();

    // Add each directive to neural memory
    selectedDoc.executableRules.forEach((rule) => {
      onAddMemory(rule);
    });

    setExecutionNotice(
      `✓ EXECUTED: ${selectedDoc.name} directives assimilated into J.A.R.V.I.S. Neural Core (${selectedDoc.executableRules.length} rules loaded).`
    );

    if (soundEnabled) {
      jarvisVoice.speak(
        `Blueprint directives from ${selectedDoc.name.replace('.md', '')} successfully executed and loaded into mainframe memory, Sir.`
      );
    }
  };

  const handleSendToChat = () => {
    if (soundEnabled) soundFx.playClick();
    onSendMessage(
      `Jarvis, analyze and execute the blueprint directives in ${selectedDoc.name}:\n\n${selectedDoc.description}\n\nPlease verify system readiness.`
    );
    onClose();
  };

  const handleCopyContent = () => {
    if (soundEnabled) soundFx.playClick();
    navigator.clipboard.writeText(selectedDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-5xl w-full h-[88vh] hud-panel rounded-2xl border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col overflow-hidden font-mono">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-cyan-500/40 bg-cyan-950/80">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-300 animate-pulse" />
            <div>
              <span className="font-orbitron font-bold text-xs sm:text-sm text-white tracking-wider block">
                SUBSYSTEM: [DOCS] TACTICAL ARCHITECTURE &amp; BLUEPRINTS
              </span>
              <span className="text-[10px] text-cyan-400">
                5 RUNNABLE BLUEPRINT FILES READY FOR MAINFRAME EXECUTION
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

        {/* Search Bar & Stats */}
        <div className="p-2.5 bg-black/70 border-b border-cyan-500/30 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter blueprints by name, category (FLIGHT, HARDWARE, TACTICS, AI_CORE)..."
              className="w-full bg-cyan-950/30 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-cyan-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="text-[10px] text-cyan-400 hidden sm:block whitespace-nowrap">
            FILES LOADED: {filteredDocs.length} / {DOC_FILES.length}
          </div>
        </div>

        {/* Content Area: Sidebar File List + Document Viewer */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Left Column: File Explorer List */}
          <div className="col-span-12 md:col-span-4 border-r border-cyan-500/30 bg-black/60 overflow-y-auto p-2 space-y-1.5">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest px-2 py-1 flex items-center justify-between">
              <span>EXPLORER DIRECTORY</span>
              <span className="text-cyan-400 font-bold">/docs/blueprints/</span>
            </div>

            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(0,240,255,0.25)] text-white'
                      : 'border-slate-800 bg-black/40 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
                      {doc.name}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-cyan-500/10 text-[9px]">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                      {doc.category}
                    </span>
                    <span className="text-slate-500">{doc.size}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Document Viewer & Action Runner */}
          <div className="col-span-12 md:col-span-8 flex flex-col bg-black/80 overflow-hidden">
            {/* Document Header & Execution Toolbar */}
            <div className="p-3 border-b border-cyan-500/30 bg-cyan-950/40 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  {selectedDoc.name}
                </h3>
                <p className="text-[10px] text-cyan-300/80">{selectedDoc.description}</p>
              </div>

              {/* Action Buttons: RUN THIS FILE */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteDocumentDirectives}
                  title="Run this document directives into J.A.R.V.I.S. neural memory"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>RUN DIRECTIVES</span>
                </button>

                <button
                  onClick={handleSendToChat}
                  title="Ask J.A.R.V.I.S. to analyze this document in chat"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SEND TO CHAT</span>
                </button>

                <button
                  onClick={handleCopyContent}
                  title="Copy document content"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Execution Status Banner */}
            {executionNotice && (
              <div className="p-2.5 bg-emerald-950/60 border-b border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                <span>{executionNotice}</span>
                <span className="text-[10px] text-emerald-400 font-bold">STATE: MEMORY ACTIVE</span>
              </div>
            )}

            {/* Document Content View */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 space-y-4 leading-relaxed select-text">
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">
                  ⚡ EXECUTABLE SYSTEM DIRECTIVES IN THIS FILE:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-cyan-200">
                  {selectedDoc.executableRules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-slate-300 bg-black/50 p-4 rounded-xl border border-slate-800">
                {selectedDoc.content}
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="p-2.5 border-t border-cyan-500/30 bg-black/90 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-cyan-400">CLICK "RUN DIRECTIVES" TO LOAD RULES INTO J.A.R.V.I.S. MAINFRAME</span>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
