import React, { useState } from 'react';
import { soundFx } from '../utils/audioEffects';
import { Network, Server, Cpu, Database, Shield, Zap, Copy, Check, ArrowRight } from 'lucide-react';

interface TopologyMatrixProps {
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
}

export const TopologyMatrix: React.FC<TopologyMatrixProps> = ({ themeColor }) => {
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('node-orchestrator');

  const nodes = [
    {
      id: 'node-client',
      title: 'COMMAND CLIENT (HUD)',
      role: 'Tactical Frontend & Voice Gateway',
      spec: 'React 19 + Tailwind v4 + Web Speech API',
      status: 'ONLINE',
      latency: '2ms',
      icon: Cpu,
    },
    {
      id: 'node-orchestrator',
      title: 'TACTICAL ORCHESTRATOR',
      role: 'Express Server & Telemetry Router',
      spec: 'Node.js Express + Protocol Parser',
      status: 'ONLINE',
      latency: '6ms',
      icon: Server,
    },
    {
      id: 'node-gemini',
      title: 'GEMINI 3.8 FLASH MAINFRAME',
      role: 'Cognitive Reasoning & System HUD Synthesizer',
      spec: '@google/genai SDK // 1M Context Window',
      status: 'ONLINE',
      latency: '180ms',
      icon: Zap,
    },
    {
      id: 'node-failover',
      title: 'IN-MEMORY MOCK FAILOVER',
      role: 'Emergency Sandbox Circuit Breaker',
      spec: 'Local Heuristic Engine for Demo Resiliency',
      status: 'ARMED',
      latency: '1ms',
      icon: Shield,
    },
    {
      id: 'node-radar',
      title: 'COMPETITOR TELEMETRY MATRIX',
      role: 'Vector Tracking & Threat Assessment',
      spec: 'Radar Canvas + Vulnerability Indexing',
      status: 'ACTIVE',
      latency: '12ms',
      icon: Network,
    },
  ];

  const asciiTopology = `
┌────────────────────────────────────────────────────────────────────────┐
│                   J.A.R.V.I.S. SYSTEM TOPOLOGY GRAPH                   │
└────────────────────────────────────────────────────────────────────────┘

    [ USER VOICE / COMMAND HUD ]
                 │
                 ▼ (Sub-5ms Web Speech & Input Gateway)
    ┌───────────────────────────┐
    │   TACTICAL ORCHESTRATOR   │◄─────────┐ (Heuristic Failover)
    └─────────────┬─────────────┘          │
                  │                        │
       ┌──────────┴──────────┐   ┌─────────┴─────────┐
       ▼                     ▼   │ IN-MEMORY SANDBOX │
┌──────────────┐      ┌──────────────┐ (Rate-limit Safe)
│ GEMINI FLASH │      │ RADAR VECTOR │
│  COGNITIVE   │      │ COMPETITORS  │
└──────────────┘      └──────────────┘
       │
       ▼
[ REAL-TIME SCREEN VISUALS + AUDITORY COMM-LINK ]
`;

  const handleCopyAscii = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(asciiTopology.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex flex-col p-4 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              SYSTEM ARCHITECTURE &amp; TOPOLOGY MATRIX
            </h3>
            <p className="text-[10px] font-mono text-slate-400">
              Interactive data pipelines, emergency failovers, and competition presentation diagrams
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyAscii}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-600 text-xs font-mono text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied ASCII' : 'Copy Topology ASCII'}
        </button>
      </div>

      {/* Nodes Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isSelected = selectedNode === node.id;

          return (
            <div
              key={node.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedNode(node.id);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded bg-slate-800 text-cyan-400">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                  {node.status}
                </span>
              </div>
              <div className="text-[11px] font-bold font-mono text-slate-200 truncate">{node.title}</div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{node.role}</div>
              <div className="text-[9px] font-mono text-cyan-400/80 mt-2 flex justify-between border-t border-slate-800 pt-1">
                <span>LATENCY:</span>
                <span className="font-bold">{node.latency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ASCII Architectural Blueprint Box */}
      <div className="relative rounded-xl border border-slate-800 bg-black/90 p-4">
        <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between border-b border-slate-900 pb-1">
          <span>HIGH-DENSITY PRESENTATION SCHEMATIC (ASCII DIAGRAM)</span>
          <span className="text-cyan-400">TACTICAL SCHEMATIC V8.4</span>
        </div>

        <pre className="text-[11px] sm:text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed select-all">
          {asciiTopology}
        </pre>
      </div>
    </div>
  );
};
