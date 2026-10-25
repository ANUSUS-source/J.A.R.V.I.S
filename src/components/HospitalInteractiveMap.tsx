import React, { useState } from 'react';
import { HOSPITAL_FLOORS, KNOWN_HOSPITAL_LOCATIONS } from '../data/hospitalDirectory';
import { HospitalFloor } from '../types/hospital';
import {
  Layers,
  MapPin,
  Compass,
  ArrowUpRight,
  Shield,
  Activity,
  Footprints,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface HospitalInteractiveMapProps {
  activeFloorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4';
  onSelectFloor: (floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4') => void;
  highlightedItem?: string;
  onSelectItemForDirections?: (itemQuery: string) => void;
}

export const HospitalInteractiveMap: React.FC<HospitalInteractiveMapProps> = ({
  activeFloorId,
  onSelectFloor,
  highlightedItem,
  onSelectItemForDirections,
}) => {
  const currentFloor = HOSPITAL_FLOORS.find((f) => f.id === activeFloorId) || HOSPITAL_FLOORS[1];

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Floor Selector Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
              <span>HOSPITAL INTERACTIVE FLOOR PLAN</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Select any level to inspect wings, departments & equipment stations
            </p>
          </div>
        </div>

        {/* Floor Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {HOSPITAL_FLOORS.map((floor) => {
            const isSelected = floor.id === activeFloorId;
            return (
              <button
                key={floor.id}
                onClick={() => onSelectFloor(floor.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {floor.id === 'G' ? 'Ground' : floor.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Floor Banner */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              {currentFloor.levelNumber}
            </span>
            <span className="font-bold text-sm text-white">{currentFloor.name}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {currentFloor.description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>ELEVATORS & CORRIDORS OPEN</span>
        </div>
      </div>

      {/* Schematic Floor Diagram Layout */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/20 relative overflow-hidden flex-1 min-h-[280px] flex flex-col justify-between">
        {/* Subtle Architectural Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Compass & Scale */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 relative z-10">
          <span className="flex items-center gap-1 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            NORTH CONCOURSE
          </span>
          <span>SCALE: 1:200m • ADA COMPLIANT</span>
        </div>

        {/* Wings Grid for Current Floor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10 my-auto">
          {currentFloor.wings.map((wing, i) => (
            <div
              key={i}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/50 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                <span className="font-bold text-xs font-mono text-cyan-300">{wing.name}</span>
                <span className="text-[10px] font-mono text-slate-400">Zone {i + 1}</span>
              </div>
              <ul className="space-y-1.5">
                {wing.services.map((svc, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => onSelectItemForDirections && onSelectItemForDirections(svc)}
                      className="w-full text-left text-xs text-slate-300 hover:text-cyan-200 hover:bg-cyan-950/50 p-1.5 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                        {svc}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Items / Amenities on this floor */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 relative z-10">
          <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>KEY SUPPLIES & LOCATIONS ON {currentFloor.levelNumber.toUpperCase()}:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentFloor.keyItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectItemForDirections && onSelectItemForDirections(item)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center gap-1"
              >
                <span>{item}</span>
                <ArrowUpRight className="w-3 h-3 text-cyan-400 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
