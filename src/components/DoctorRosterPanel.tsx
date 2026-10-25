import React from 'react';
import { DoctorProfile } from '../types/hospital';
import { ON_CALL_DOCTORS } from '../data/hospitalDirectory';
import {
  Stethoscope,
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  UserCheck,
} from 'lucide-react';

interface DoctorRosterPanelProps {
  doctors?: DoctorProfile[];
  dispatchedDoctorIds?: string[];
  onPageDoctor?: (doc: DoctorProfile) => void;
}

export const DoctorRosterPanel: React.FC<DoctorRosterPanelProps> = ({
  doctors = ON_CALL_DOCTORS,
  dispatchedDoctorIds = [],
  onPageDoctor,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
              <span>HOSPITAL ON-CALL PHYSICIAN ROSTER</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live attending medical staff stationed across Trauma, Cardiology, & Specialty Care
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {doctors.length} ATTENDING ACTIVE
        </span>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {doctors.map((doc) => {
          const isDispatched = dispatchedDoctorIds.includes(doc.id);

          return (
            <div
              key={doc.id}
              className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                isDispatched
                  ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">{doc.name}</h4>
                    <p className="text-[11px] font-mono text-cyan-300 font-medium">
                      {doc.specialty}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold shrink-0">
                    {doc.pager}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{doc.room}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {doc.department}
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {isDispatched ? (
                  <span className="text-[11px] font-mono font-bold text-rose-300 flex items-center gap-1.5 animate-pulse">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    DISPATCHED (ETA: {doc.etaMinutes || '1-2m'})
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Available on-call
                  </span>
                )}

                {onPageDoctor && !isDispatched && (
                  <button
                    onClick={() => onPageDoctor(doc)}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3" />
                    <span>Page</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
