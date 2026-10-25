import React, { useState } from 'react';
import { DailyPlanItem, ReminderItem, ResearchCard } from '../types/hospital';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Brain,
  Lightbulb,
  Compass,
  ArrowRight,
  Shield,
  Send,
  HelpCircle,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface JarvisExecutiveSuiteProps {
  onSendMessage: (text: string) => void;
  soundEnabled: boolean;
  onSwitchToHospital: () => void;
}

const INITIAL_SCHEDULE: DailyPlanItem[] = [
  {
    id: 'plan-1',
    timeSlot: '08:30 - 09:30',
    title: 'Executive Briefing & Daily Objectives Sync',
    description: 'Review hospital clinical telemetry, triage alerts, and organize high-leverage deliverables.',
    period: 'MORNING',
    priority: 'HIGH',
    completed: true,
  },
  {
    id: 'plan-2',
    timeSlot: '09:30 - 11:30',
    title: 'High-Focus Deep Work: Clinical Wayfinding System Audit',
    description: 'Optimize floor navigation pathways and latency benchmarks for emergency paging.',
    period: 'MORNING',
    priority: 'CRITICAL',
    completed: false,
  },
  {
    id: 'plan-3',
    timeSlot: '11:30 - 12:30',
    title: 'Research & Problem-Solving: Triage Latency Reduction',
    description: 'Synthesize data on automated doctor dispatch times and analyze bottleneck resolution.',
    period: 'MORNING',
    priority: 'NORMAL',
    completed: false,
  },
  {
    id: 'plan-4',
    timeSlot: '13:30 - 15:00',
    title: 'Strategic Consultation with On-Call Chiefs',
    description: 'Review trauma protocol sync with Dr. Marcus Vance and cardiology response metrics.',
    period: 'AFTERNOON',
    priority: 'HIGH',
    completed: false,
  },
  {
    id: 'plan-5',
    timeSlot: '15:30 - 17:00',
    title: 'AI Multi-Domain Knowledge Base Expansion',
    description: 'Calibrate voice synthesis male audio harmonics and verify multi-floor map waypoints.',
    period: 'AFTERNOON',
    priority: 'NORMAL',
    completed: false,
  },
  {
    id: 'plan-6',
    timeSlot: '17:30 - 18:30',
    title: 'Evening Debrief, Tomorrow Roadmap & Inbox Zero',
    description: 'Consolidate reminders, evaluate productivity index, and lock schedule for next cycle.',
    period: 'EVENING',
    priority: 'HIGH',
    completed: false,
  },
];

const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1',
    title: 'Inspect Ground Floor Mobility Station Bay B-2 wheelchairs',
    dueTime: '10:00 AM',
    priority: 'HIGH',
    category: 'HEALTH',
    completed: false,
  },
  {
    id: 'rem-2',
    title: 'Audit MRI Suite B-104 cryogen pressure levels on Level B1',
    dueTime: '01:30 PM',
    priority: 'URGENT',
    category: 'WORK',
    completed: false,
  },
  {
    id: 'rem-3',
    title: 'Rehearse executive problem-solving brief on doctor dispatch',
    dueTime: '04:00 PM',
    priority: 'NORMAL',
    category: 'PERSONAL',
    completed: true,
  },
  {
    id: 'rem-4',
    title: 'Verify 24/7 central pharmacy stock of analgesics & painkillers',
    dueTime: '06:00 PM',
    priority: 'HIGH',
    category: 'HEALTH',
    completed: false,
  },
];

const RESEARCH_TOPICS: ResearchCard[] = [
  {
    id: 'res-1',
    title: 'Rapid Triage Algorithm Optimization',
    domain: 'Clinical AI & Emergency Medicine',
    queryPrompt: 'Jarvis, provide an executive research synthesis on optimizing hospital triage algorithms to cut emergency doctor response time by 50%.',
    summary: 'Multi-vector analysis comparing automated patient risk stratification with traditional triage scales.',
    keyFindings: [
      'Automated dispatch reduces door-to-provider time from 18 min to 3.2 min.',
      'Acoustic symptom detection elevates accuracy in acute dyspnea and cardiac crises.',
    ],
  },
  {
    id: 'res-2',
    title: 'First-Principles Productivity & Deep Work Framework',
    domain: 'Executive Cognitive Performance',
    queryPrompt: 'Jarvis, what is the most effective creative problem-solving framework to eliminate operational bottlenecks in my daily schedule?',
    summary: 'Applying thermodynamic entropy models and time-blocking architecture to executive task management.',
    keyFindings: [
      'Two 90-minute morning deep work blocks outperform fragmented 8-hour days by 140%.',
      'Verbal synthesis and proactive clarifying questions reduce ambiguity rework by 65%.',
    ],
  },
  {
    id: 'res-3',
    title: 'Cardiovascular Intervention & Rapid Paging Telemetry',
    domain: 'Cardiology & Healthcare Logistics',
    queryPrompt: 'Jarvis, research the latest protocols in acute coronary syndrome dispatch and the role of immediate doctor paging.',
    summary: 'Clinical review of early catheterization alerts and immediate bystander reassurance protocols.',
    keyFindings: [
      'Early doctor notification during initial symptom onset prevents myocardial damage.',
      'Immediate verbal reassuring instructions lower patient pulse rate during acute distress.',
    ],
  },
];

export const JarvisExecutiveSuite: React.FC<JarvisExecutiveSuiteProps> = ({
  onSendMessage,
  soundEnabled,
  onSwitchToHospital,
}) => {
  const [schedule, setSchedule] = useState<DailyPlanItem[]>(INITIAL_SCHEDULE);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderPriority, setNewReminderPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('HIGH');
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTime, setNewPlanTime] = useState('02:00 - 03:00');
  const [newPlanPeriod, setNewPlanPeriod] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('AFTERNOON');
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const togglePlanItem = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deletePlanItem = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setSchedule((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    const newItem: DailyPlanItem = {
      id: `plan-${Date.now()}`,
      timeSlot: newPlanTime || '14:00 - 15:00',
      title: newPlanTitle.trim(),
      description: 'Scheduled with J.A.R.V.I.S. Executive Daily Planner',
      period: newPlanPeriod,
      priority: 'HIGH',
      completed: false,
    };

    setSchedule((prev) => [...prev, newItem]);
    setNewPlanTitle('');
    setIsAddingPlan(false);
    if (soundEnabled) soundFx.playClick();
  };

  const toggleReminder = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const deleteReminder = (id: string) => {
    if (soundEnabled) soundFx.playClick();
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;

    const newRem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: newReminderText.trim(),
      dueTime: new Date(Date.now() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: newReminderPriority,
      category: 'WORK',
      completed: false,
    };

    setReminders((prev) => [newRem, ...prev]);
    setNewReminderText('');
    if (soundEnabled) soundFx.playClick();
  };

  const completedPlans = schedule.filter((s) => s.completed).length;
  const planProgress = Math.round((completedPlans / (schedule.length || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Executive Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 p-5 shadow-[0_4px_25px_rgba(6,182,212,0.1)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300">
                <Shield className="w-3 h-3 text-cyan-400" />
                J.A.R.V.I.S. EXECUTIVE CORE V8.4
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                PRODUCTIVITY & STRATEGIC PLANNING
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>Personal Executive Assistant & Daily Command</span>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Professional, proactive, and multi-domain assistance: schedule planning, strategic research, creative problem-solving, and reminder management. Jarvis responds verbally to all inquiries in a refined male voice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                onSendMessage('Jarvis, please analyze my schedule for today, suggest optimizations to maximize productivity, and ask any clarifying questions needed.');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Optimize Day with Jarvis</span>
            </button>

            <button
              onClick={onSwitchToHospital}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Switch to Hospital MediNav</span>
            </button>
          </div>
        </div>

        {/* Real-Time Productivity Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Daily Execution Index:</span>
            <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${planProgress}%` }}
              />
            </div>
            <span className="text-emerald-400 font-bold">{planProgress}% Complete</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Tasks: <strong className="text-white">{completedPlans}/{schedule.length}</strong></span>
            <span>Reminders: <strong className="text-white">{reminders.filter(r => !r.completed).length} Pending</strong></span>
            <span className="text-cyan-400">AI Engine: Google Gemini</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Daily Planner & Reminders Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Daily Planner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white tracking-wide">
                  Daily Planning & Schedule Organizer
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingPlan(!isAddingPlan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold hover:bg-cyan-900/60 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingPlan ? 'Cancel' : 'Add Time Block'}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Plan Form */}
            {isAddingPlan && (
              <form onSubmit={handleAddPlan} className="mb-4 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold">
                  [NEW SCHEDULE ITEM]
                </div>
                <input
                  type="text"
                  placeholder="Task title (e.g. Executive Strategy Session, Clinical Rounds)..."
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Time slot (e.g. 10:00 - 11:30)"
                    value={newPlanTime}
                    onChange={(e) => setNewPlanTime(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                  <select
                    value={newPlanPeriod}
                    onChange={(e: any) => setNewPlanPeriod(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="MORNING">Morning (08:00 - 12:00)</option>
                    <option value="AFTERNOON">Afternoon (12:00 - 17:00)</option>
                    <option value="EVENING">Evening (17:00 - 21:00)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPlan(false)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded bg-cyan-600 text-slate-950 font-bold text-xs font-mono hover:bg-cyan-500"
                  >
                    Save Time Block
                  </button>
                </div>
              </form>
            )}

            {/* Time Block List grouped by Morning, Afternoon, Evening */}
            <div className="space-y-3">
              {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((period) => {
                const items = schedule.filter((s) => s.period === period);
                if (items.length === 0) return null;

                const periodLabel =
                  period === 'MORNING'
                    ? '🌅 Morning Focus Block (08:00 - 12:00)'
                    : period === 'AFTERNOON'
                    ? '☀️ Afternoon Execution Block (12:00 - 17:00)'
                    : '🌙 Evening Decompression & Wrap-Up (17:00 - 21:00)';

                return (
                  <div key={period} className="space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider pl-1">
                      {periodLabel}
                    </div>

                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            item.completed
                              ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                              : 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/40 shadow-sm'
                          }`}
                        >
                          <button
                            onClick={() => togglePlanItem(item.id)}
                            className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 group-hover:text-cyan-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-semibold">
                                {item.timeSlot}
                              </span>

                              {item.priority === 'CRITICAL' && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                                  CRITICAL
                                </span>
                              )}
                              {item.priority === 'HIGH' && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                                  HIGH
                                </span>
                              )}
                            </div>

                            <div
                              className={`text-sm font-semibold text-slate-100 mt-1 ${
                                item.completed ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {item.description}
                            </div>
                          </div>

                          <button
                            onClick={() => deletePlanItem(item.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Jarvis Proactive Planner Helper */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Jarvis Tip: Group similar high-cognitive tasks together.</span>
              </span>
              <button
                onClick={() => {
                  onSendMessage('Jarvis, give me 3 creative strategies to overcome my afternoon focus slump and structure my remaining schedule.');
                }}
                className="text-cyan-400 hover:underline font-mono text-xs flex items-center gap-1"
              >
                <span>Ask for Focus Advice</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Reminders & Quick Research (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Reminders & Task Vault */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Active Reminders & Alerts</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {reminders.filter((r) => !r.completed).length} active
              </span>
            </div>

            {/* Add Reminder Input */}
            <form onSubmit={handleAddReminder} className="mb-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add new reminder for Jarvis..."
                value={newReminderText}
                onChange={(e) => setNewReminderText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={newReminderPriority}
                onChange={(e: any) => setNewReminderPriority(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 font-mono"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
              </select>
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-cyan-600 text-slate-950 hover:bg-cyan-500 transition-colors"
                title="Save Reminder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Reminder List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    rem.completed
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button onClick={() => toggleReminder(rem.id)}>
                      {rem.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 hover:text-cyan-400" />
                      )}
                    </button>
                    <span
                      className={`text-xs truncate text-slate-200 ${
                        rem.completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {rem.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {rem.dueTime}
                    </span>
                    <button
                      onClick={() => deleteReminder(rem.id)}
                      className="text-slate-600 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Assistance & Problem Solving Lab */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Research & Problem-Solving Lab</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">GEMINI POWERED</span>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Launch deep multi-domain research or creative problem-solving inquiries. Jarvis analyzes empirical evidence and responds verbally.
            </p>

            <div className="space-y-2">
              {RESEARCH_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/40 transition-all cursor-pointer group"
                  onClick={() => onSendMessage(topic.queryPrompt)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {topic.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                    {topic.domain}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {topic.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
