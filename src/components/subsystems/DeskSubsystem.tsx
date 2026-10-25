import React, { useState } from 'react';
import { soundFx } from '../../utils/audioEffects';
import { jarvisVoice } from '../../utils/speechEngine';
import {
  FolderKanban,
  X,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Terminal,
  FileCode,
  Notebook,
  Calendar,
  Send,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type DeskAppType = 'TASK_BOARD' | 'CODE_RUNNER' | 'MISSION_NOTES' | 'CALENDAR_SPRINT';

interface DeskSubsystemProps {
  onClose: () => void;
  onSendMessage: (text: string) => void;
  soundEnabled?: boolean;
  callsign: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: 't-1', title: 'Overclock Arc Reactor power rails to 95%', status: 'DONE', priority: 'CRITICAL' },
  { id: 't-2', title: 'Audit competitive radar telemetry for hackathon sprint', status: 'IN_PROGRESS', priority: 'HIGH' },
  { id: 't-3', title: 'Connect Gemini 3.8 Flash real-time voice synthesis link', status: 'DONE', priority: 'CRITICAL' },
  { id: 't-4', title: 'Calibrate supersonic repulsor damping vectors', status: 'TODO', priority: 'NORMAL' },
  { id: 't-5', title: 'Rehearse 3-minute executive competition pitch deck', status: 'TODO', priority: 'HIGH' },
];

const CODE_TEMPLATES: Record<string, { lang: string; code: string; defaultOutput: string }> = {
  'reactor_calc.py': {
    lang: 'Python',
    code: `# STARK INDUSTRIES // ARC REACTOR FLUX CALCULATION
import math

def calculate_harmonic_output(core_flux_gj: float, efficiency: float) -> dict:
    plasma_pressure = core_flux_gj * 14.85
    repulsor_draw = plasma_pressure * math.sqrt(efficiency)
    return {
        "flux_rate": f"{core_flux_gj:.2f} GJ/s",
        "plasma_pressure": f"{plasma_pressure:.1f} MPa",
        "max_repulsor_burst": f"{repulsor_draw:.2f} MW",
        "containment_integrity": "NOMINAL (99.8%)"
    }

telemetry = calculate_harmonic_output(3.2, 0.984)
print("=== ARC REACTOR TELEMETRY ===")
for k, v in telemetry.items():
    print(f"[{k.upper()}]: {v}")
print("STATUS: CORE SYNCHRONIZED WITH J.A.R.V.I.S.")
`,
    defaultOutput: `=== ARC REACTOR TELEMETRY ===
[FLUX_RATE]: 3.20 GJ/s
[PLASMA_PRESSURE]: 47.5 MPa
[MAX_REPULSOR_BURST]: 47.14 MW
[CONTAINMENT_INTEGRITY]: NOMINAL (99.8%)
STATUS: CORE SYNCHRONIZED WITH J.A.R.V.I.S.
`,
  },
  'competitor_radar.ts': {
    lang: 'TypeScript',
    code: `// TACTICAL COMPETITOR RADAR INTERCEPTOR
interface CompetitorVector {
  team: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pacing: number; // km/h sprint velocity
}

const vectors: CompetitorVector[] = [
  { team: "Vector Alpha", threatLevel: "MEDIUM", pacing: 42 },
  { team: "Vector Omega", threatLevel: "LOW", pacing: 28 },
  { team: "Stark Protocol (Ours)", threatLevel: "HIGH", pacing: 98 },
];

console.log("Analyzing competition sprint vectors...");
vectors.forEach(v => {
  console.log(\`[VECTOR: \${v.team}] -> THREAT: \${v.threatLevel} | SPRINT PACING: \${v.pacing}%\`);
});
console.log("CONCLUSION: Tactical superiority confirmed.");
`,
    defaultOutput: `Analyzing competition sprint vectors...
[VECTOR: Vector Alpha] -> THREAT: MEDIUM | SPRINT PACING: 42%
[VECTOR: Vector Omega] -> THREAT: LOW | SPRINT PACING: 28%
[VECTOR: Stark Protocol (Ours)] -> THREAT: HIGH | SPRINT PACING: 98%
CONCLUSION: Tactical superiority confirmed.
`,
  },
};

export const DeskSubsystem: React.FC<DeskSubsystemProps> = ({
  onClose,
  onSendMessage,
  soundEnabled = true,
  callsign,
}) => {
  const [activeApp, setActiveApp] = useState<DeskAppType>('TASK_BOARD');

  // Task Board state
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL'>('HIGH');

  // Code Runner state
  const [selectedFile, setSelectedFile] = useState<string>('reactor_calc.py');
  const [codeContent, setCodeContent] = useState<string>(CODE_TEMPLATES['reactor_calc.py'].code);
  const [terminalOutput, setTerminalOutput] = useState<string>(CODE_TEMPLATES['reactor_calc.py'].defaultOutput);
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);

  // Notes state
  const [notesContent, setNotesContent] = useState<string>(
    `# STARK DESK // MISSION LOGS & NOTES
Commander: ${callsign.toUpperCase()}
Date: ${new Date().toLocaleDateString()}

- Priority 1: Keep Arc Reactor output above 85% at all times.
- Priority 2: Use J.A.R.V.I.S. voice commands for quick navigation during competition.
- Priority 3: Teach J.A.R.V.I.S. project-specific rules in the chat before live demo.
`
  );

  // Switch Desk Files/Apps
  const handleSwitchApp = (app: DeskAppType) => {
    if (soundEnabled) soundFx.playClick();
    setActiveApp(app);
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (soundEnabled) soundFx.playClick();
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'TODO',
      priority: newTaskPriority,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
  };

  // Toggle Task Status
  const handleCycleTaskStatus = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Run Code File
  const handleRunCode = () => {
    if (soundEnabled) soundFx.playClick();
    setIsRunningCode(true);
    setTerminalOutput('Compiling and executing script in Stark Mainframe sandbox...\n');

    setTimeout(() => {
      setIsRunningCode(false);
      setTerminalOutput(CODE_TEMPLATES[selectedFile]?.defaultOutput || 'Script executed successfully with code 0.\n');
      if (soundEnabled) soundFx.playHologramPing();
      if (soundEnabled) jarvisVoice.speak('Script execution finished with zero errors, Sir.');
    }, 600);
  };

  // Ask JARVIS to Optimize Code
  const handleAskJarvisOptimize = () => {
    if (soundEnabled) soundFx.playClick();
    onSendMessage(`Jarvis, review and optimize the code in ${selectedFile}:\n\n${codeContent}`);
    onClose();
  };

  // Ask JARVIS to Prioritize Tasks
  const handleAskJarvisPrioritizeTasks = () => {
    if (soundEnabled) soundFx.playClick();
    const taskListStr = tasks.map((t) => `[${t.status}] ${t.title} (${t.priority})`).join('\n');
    onSendMessage(`Jarvis, review my current sprint task board and recommend tactical prioritization:\n\n${taskListStr}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-mono select-none">
      <div className="max-w-5xl w-full h-[88vh] hud-panel rounded-2xl border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col overflow-hidden">
        {/* Desk Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-cyan-500/40 bg-cyan-950/80">
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-cyan-300 animate-pulse" />
            <div>
              <span className="font-orbitron font-bold text-xs sm:text-sm text-white tracking-wider block">
                SUBSYSTEM: [DESK] STARK WORKSTATION &amp; PRODUCTIVITY SUITE
              </span>
              <span className="text-[10px] text-cyan-400">
                ACTIVE WORKSPACE // 4 RUNNABLE APPLICATION FILES
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

        {/* Desk Runnable File Tabs */}
        <div className="px-3 py-2 bg-black/70 border-b border-cyan-500/30 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'TASK_BOARD', label: 'TASK_BOARD.app', icon: FolderKanban, desc: 'Kanban Sprint Board' },
            { id: 'CODE_RUNNER', label: 'CODE_RUNNER.app', icon: FileCode, desc: 'Script Scratchpad & Terminal' },
            { id: 'MISSION_NOTES', label: 'MISSION_NOTES.app', icon: Notebook, desc: 'Field Directives' },
            { id: 'CALENDAR_SPRINT', label: 'CALENDAR_SPRINT.app', icon: Calendar, desc: 'Sprint Countdown' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeApp === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchApp(tab.id as DeskAppType)}
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

        {/* APP 1: TASK_BOARD.app */}
        {activeApp === 'TASK_BOARD' && (
          <div className="flex-1 p-4 flex flex-col bg-black/80 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30 mb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>STARK SPRINT KANBAN</span>
                  <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                    {tasks.filter((t) => t.status === 'DONE').length} / {tasks.length} COMPLETED
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Click circle to cycle task status (TODO -&gt; IN PROGRESS -&gt; DONE)</p>
              </div>

              <button
                onClick={handleAskJarvisPrioritizeTasks}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prioritize with J.A.R.V.I.S.</span>
              </button>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter new mission task..."
                className="flex-1 bg-black px-3 py-1.5 rounded-lg border border-cyan-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="bg-black px-2 py-1.5 rounded-lg border border-cyan-500/40 text-xs text-cyan-300"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </form>

            {/* Task Columns Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((col) => {
                const colTasks = tasks.filter((t) => t.status === col);
                const colTitle = col === 'TODO' ? 'TO DO' : col === 'IN_PROGRESS' ? 'IN PROGRESS' : 'COMPLETED';
                const colBorder = col === 'DONE' ? 'border-emerald-500/40' : col === 'IN_PROGRESS' ? 'border-amber-500/40' : 'border-cyan-500/40';

                return (
                  <div key={col} className={`p-3 rounded-xl border bg-black/60 flex flex-col ${colBorder}`}>
                    <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-800 mb-2">
                      <span className="text-white">{colTitle}</span>
                      <span className="text-cyan-400 text-[10px]">{colTasks.length}</span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {colTasks.length === 0 ? (
                        <div className="text-[10px] text-slate-600 text-center py-6">No tasks</div>
                      ) : (
                        colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/80 hover:border-cyan-500/40 flex items-start justify-between gap-2 transition-all"
                          >
                            <div className="flex items-start gap-2 flex-1 cursor-pointer" onClick={() => handleCycleTaskStatus(task.id)}>
                              {task.status === 'DONE' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              ) : task.status === 'IN_PROGRESS' ? (
                                <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <span className={`text-xs block ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {task.title}
                                </span>
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block mt-1 ${
                                    task.priority === 'CRITICAL'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                      : task.priority === 'HIGH'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-600 hover:text-rose-400 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* APP 2: CODE_RUNNER.app */}
        {activeApp === 'CODE_RUNNER' && (
          <div className="flex-1 p-3 flex flex-col bg-black/80 overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-2">
              <div className="flex items-center gap-2">
                {Object.keys(CODE_TEMPLATES).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => {
                      if (soundEnabled) soundFx.playClick();
                      setSelectedFile(fileName);
                      setCodeContent(CODE_TEMPLATES[fileName].code);
                      setTerminalOutput(CODE_TEMPLATES[fileName].defaultOutput);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                      selectedFile === fileName
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                        : 'border-slate-800 bg-black text-slate-400'
                    }`}
                  >
                    {fileName}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{isRunningCode ? 'RUNNING...' : 'EXECUTE CODE'}</span>
                </button>
                <button
                  onClick={handleAskJarvisOptimize}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask J.A.R.V.I.S. to Optimize</span>
                </button>
              </div>
            </div>

            {/* Code Editor & Terminal Output Split */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden">
              <div className="flex flex-col rounded-xl border border-slate-800 bg-black/90 p-2 overflow-hidden">
                <div className="text-[10px] text-slate-400 pb-1 border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>SCRIPT EDITOR // {selectedFile}</span>
                  <span className="text-cyan-400 font-bold">{CODE_TEMPLATES[selectedFile]?.lang}</span>
                </div>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="flex-1 w-full bg-transparent text-cyan-100 font-mono text-xs leading-relaxed p-2 resize-none focus:outline-none select-text"
                  spellCheck={false}
                />
              </div>

              {/* Terminal Console Output */}
              <div className="flex flex-col rounded-xl border border-cyan-500/40 bg-black p-2 overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <div className="text-[10px] text-cyan-400 pb-1 border-b border-cyan-500/30 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    STARK MAINFRAME TERMINAL // STDOUT
                  </span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
                <pre className="flex-1 p-2 text-[11px] font-mono text-emerald-400 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
                  {terminalOutput}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* APP 3: MISSION_NOTES.app */}
        {activeApp === 'MISSION_NOTES' && (
          <div className="flex-1 p-4 flex flex-col bg-black/80 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-2">
              <div>
                <h4 className="text-sm font-bold text-white">MISSION NOTES &amp; FIELD INTEL</h4>
                <p className="text-[10px] text-slate-400">Tactical notepad auto-saved to session state</p>
              </div>
              <button
                onClick={() => {
                  onSendMessage(`Jarvis, review these mission notes and identify any potential strategic gaps:\n\n${notesContent}`);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Notes to J.A.R.V.I.S.</span>
              </button>
            </div>

            <textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              className="flex-1 w-full bg-black/90 p-4 rounded-xl border border-cyan-500/40 text-cyan-100 font-mono text-xs leading-relaxed resize-none focus:outline-none select-text"
              placeholder="Write down technical notes, competitive observations, or mission directives..."
            />
          </div>
        )}

        {/* APP 4: CALENDAR_SPRINT.app */}
        {activeApp === 'CALENDAR_SPRINT' && (
          <div className="flex-1 p-4 flex flex-col bg-black/80 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
              <div>
                <h4 className="text-sm font-bold text-white">HACKATHON &amp; SPRINT MISSION TIMELINE</h4>
                <p className="text-[10px] text-slate-400">Critical milestones and execution countdown</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/40">
                ACTIVE PHASE: EXECUTION &amp; POLISH
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { time: 'T - 24:00', label: 'PROBLEM DEFINITION', status: 'COMPLETED', desc: 'Lock competitive moat' },
                { time: 'T - 18:00', label: 'SYSTEM ARCHITECTURE', status: 'COMPLETED', desc: 'React 19 + Gemini Link' },
                { time: 'T - 06:00', label: 'LIVE PROTOTYPING', status: 'IN_PROGRESS', desc: 'Audio, HUD, and voice' },
                { time: 'T - 01:00', label: 'FINAL EXECUTIVE DEMO', status: 'UPCOMING', desc: 'Showcase live cockpit superiority' },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-cyan-500/30 bg-black/60 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold block">{m.time}</span>
                  <h5 className="text-xs font-bold text-white">{m.label}</h5>
                  <p className="text-[10px] text-slate-400">{m.desc}</p>
                  <span
                    className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 border-t border-cyan-500/30 bg-black/90 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-cyan-400">DESK ENVIRONMENT // READY FOR HIGH VELOCITY PRODUCTIVITY</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-cyan-500 text-black font-bold text-xs cursor-pointer"
          >
            Close Desk
          </button>
        </div>
      </div>
    </div>
  );
};
