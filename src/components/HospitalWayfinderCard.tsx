import React from 'react';
import { HospitalLocation } from '../types/hospital';
import {
  Navigation,
  MapPin,
  Clock,
  Footprints,
  Info,
  CheckCircle,
  Pill,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface HospitalWayfinderCardProps {
  location: HospitalLocation;
  onViewOnMap?: (floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4') => void;
}

export const HospitalWayfinderCard: React.FC<HospitalWayfinderCardProps> = ({
  location,
  onViewOnMap,
}) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'EQUIPMENT':
        return 'bg-blue-950 text-blue-300 border-blue-500/40';
      case 'MEDICINE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'DIAGNOSTIC':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'CLINIC':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      case 'EMERGENCY':
        return 'bg-rose-950 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase">
              HOSPITAL WAYFINDING SYSTEM
            </span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              {location.item}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${getCategoryBadge(
              location.category
            )}`}
          >
            {location.category}
          </span>
          <span className="flex items-center gap-1 text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5" />
            {location.eta}
          </span>
        </div>
      </div>

      {/* Location Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block">FLOOR / LEVEL:</span>
          <span className="text-sm font-bold text-cyan-300 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {location.floorName}
          </span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block">WING / CONCOURSE:</span>
          <span className="text-sm font-bold text-slate-200 block mt-0.5">
            {location.wing}
          </span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 block">BAY / ROOM:</span>
          <span className="text-sm font-bold text-amber-300 block mt-0.5 truncate" title={location.roomBay}>
            {location.roomBay}
          </span>
        </div>
      </div>

      {/* Step by Step Navigation Path */}
      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold mb-2">
          <Footprints className="w-3.5 h-3.5 text-cyan-400" />
          <span>STEP-BY-STEP WALKING DIRECTIONS:</span>
        </div>
        <div className="space-y-2">
          {location.directions.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {location.notes ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{location.notes}</span>
          </div>
        ) : <div />}

        {onViewOnMap && (
          <button
            onClick={() => onViewOnMap(location.floorId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md ml-auto"
          >
            <span>Show on Floor Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
