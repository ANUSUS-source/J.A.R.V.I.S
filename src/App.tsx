/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HospitalHeader } from './components/HospitalHeader';
import { HospitalVoiceChat } from './components/HospitalVoiceChat';
import { HospitalInteractiveMap } from './components/HospitalInteractiveMap';
import { DoctorRosterPanel } from './components/DoctorRosterPanel';
import { EmergencyDoctorAlert } from './components/EmergencyDoctorAlert';
import { JarvisExecutiveSuite } from './components/JarvisExecutiveSuite';
import { VoiceStudioModal } from './components/VoiceStudioModal';
import { HospitalChatMessage, EmergencyTriageAlert } from './types/hospital';
import { ON_CALL_DOCTORS } from './data/hospitalDirectory';
import { jarvisVoice } from './utils/speechEngine';
import { soundFx } from './utils/audioEffects';
import {
  HeartPulse,
  Compass,
  Stethoscope,
  Sparkles,
  Zap,
  Calendar,
  MessageSquare,
  Map,
  Shield,
  AlertTriangle,
} from 'lucide-react';

const INITIAL_JARVIS_WELCOME = `[J.A.R.V.I.S. // EXECUTIVE ASSISTANT & MEDINAV CARECONNECT]
┌────────────────────────────────────────────────────────────────────────┐
│  J.A.R.V.I.S.  ::  PERSONAL EXECUTIVE ASSISTANT & CLINICAL NAVIGATOR   │
├────────────────────────────────────────────────────────────────────────┤
│  STATUS: ONLINE          │  MODE: DUAL-CORE ACTIVE │  VOICE: MALE P.B.  │
│  ON-CALL DOCTORS: 6 LIVE │  INTELLIGENCE: GEMINI   │  RESPONSE: VERBAL  │
└────────────────────────────────────────────────────────────────────────┘

◈ AUDIO COMM-LINK (JARVIS MALE VOICE):
"Greetings. I am J.A.R.V.I.S., your personal executive assistant and St. Jude Hospital clinical intelligence. Whether you require daily planning, deep research assistance, hospital wayfinding, or emergency medical dispatch, I am at your service."

◈ UNIFIED COMMAND CAPABILITIES:
  [1] Personal Executive & Daily Productivity:
      • Daily schedule & time-block organizer ("Plan my schedule today")
      • Multi-domain research assistance & creative problem solving
      • Information management & priority task reminders

  [2] St. Jude Metropolitan Hospital Clinical MediNav:
      • Ask where any item is present (e.g. wheelchairs, pharmacy, MRI, cafeteria)
      • Report symptoms if you are unwell to immediately alert and dispatch on-call doctors
      • Interactive 6-floor blueprints and real-time physician paging console`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'EXECUTIVE' | 'MAP' | 'DOCTORS'>('CHAT');
  const [activeFloorId, setActiveFloorId] = useState<'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4'>('G');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<EmergencyTriageAlert | null>(null);
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);

  const [messages, setMessages] = useState<HospitalChatMessage[]>([
    {
      id: 'msg-jarvis-init',
      role: 'assistant',
      content: INITIAL_JARVIS_WELCOME,
      spokenBriefing:
        'Greetings. I am J.A.R.V.I.S., your personal executive assistant and St. Jude Hospital clinical intelligence. Whether you require daily planning, deep research assistance, hospital wayfinding, or emergency medical dispatch, I am at your service.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'J.A.R.V.I.S. Dual-Core AI Architecture',
    },
  ]);

  // Initial greeting audio trigger on page open
  useEffect(() => {
    let triggered = false;
    const greetingText =
      'Greetings. I am J.A.R.V.I.S., your personal executive assistant and St. Jude Hospital clinical intelligence. Whether you require daily planning, deep research assistance, hospital wayfinding, or emergency medical dispatch, I am at your service.';

    const startJarvisGreeting = () => {
      if (triggered) return;
      triggered = true;
      if (soundEnabled) {
        soundFx.playHospitalChime();
        setTimeout(() => {
          jarvisVoice.speak(greetingText, undefined, true);
        }, 400);
      }
    };

    const timer = setTimeout(startJarvisGreeting, 700);

    const handleFirstGesture = () => {
      if (!triggered) {
        startJarvisGreeting();
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [soundEnabled]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    jarvisVoice.autoSpeak = next;
    if (!next) {
      soundFx.stopAll();
      jarvisVoice.stop();
    } else {
      soundFx.playHospitalChime();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: HospitalChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // If on Executive tab and user asked about hospital or symptoms, switch to chat to view live card
    if (activeTab === 'EXECUTIVE') {
      const q = text.toLowerCase();
      if (/where|wheelchair|pharmacy|mri|doctor|chest|pain|dizzy|sick|unwell/i.test(q)) {
        setActiveTab('CHAT');
      }
    }

    try {
      const res = await fetch('/api/hospital/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          patientName: 'Executive User',
          kioskLocation: 'Main Atrium Kiosk 1 (Ground Floor)',
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      // Check if emergency triage was activated
      if (data.triageAlert) {
        const triageObj: EmergencyTriageAlert = {
          id: `triage-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: data.triageAlert.severity || 'CODE_RED',
          headline: data.triageAlert.alertHeadline || 'EMERGENCY DOCTOR RESPONSE ACTIVATED',
          patientSymptoms: data.triageAlert.symptoms || ['Acute Medical Distress'],
          doctorsDispatched: data.triageAlert.doctorsAlerted || [ON_CALL_DOCTORS[0], ON_CALL_DOCTORS[1]],
          immediateCareAdvice: data.triageAlert.immediateCareAdvice || [
            'Sit down immediately and rest.',
            'Medical attendants have been dispatched to your location.',
          ],
          kioskLocation: 'Main Atrium Kiosk 1',
          isActive: true,
        };

        setActiveAlert(triageObj);
        if (soundEnabled) {
          soundFx.playDoctorPagerAlert();
        }
      }

      // If a location was resolved, auto-switch floor preview
      if (data.locationResult?.floorId) {
        setActiveFloorId(data.locationResult.floorId);
        if (soundEnabled && !data.triageAlert) {
          soundFx.playHospitalChime();
        }
      }

      const assistantMsg: HospitalChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.text || 'Your request has been processed.',
        spokenBriefing: data.spokenBriefing || data.text,
        locationResult: data.locationResult,
        triageAlert: data.triageAlert,
        modeDetected: data.modeDetected,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'J.A.R.V.I.S. Intelligence Core',
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak response verbally using male voice synthesizer
      if (soundEnabled && (data.spokenBriefing || data.text)) {
        setTimeout(() => {
          jarvisVoice.speak(data.spokenBriefing || data.text, undefined, true);
        }, 250);
      }
    } catch (err) {
      console.error(err);
      const fallbackVoice =
        'I have received your request, sir. Both executive command and hospital triage teams are standing by.';
      const errorMsg: HospitalChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `[J.A.R.V.I.S. ASSISTANCE]\n${fallbackVoice}`,
        spokenBriefing: fallbackVoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'J.A.R.V.I.S. Local Core',
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (soundEnabled) {
        jarvisVoice.speak(fallbackVoice, undefined, true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Emergency SOS Trigger
  const handleTriggerSos = () => {
    setActiveTab('CHAT');
    handleSendMessage(
      'EMERGENCY ALERT: Acute medical emergency! Patient in distress with chest tightness and severe dizziness at Kiosk 1. Dispatch emergency physicians immediately!'
    );
  };

  const dispatchedIds = activeAlert
    ? activeAlert.doctorsDispatched.map((d) => d.id)
    : [];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Omni-Care Dual Core Header */}
      <HospitalHeader
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onTriggerSos={handleTriggerSos}
        activeDispatchesCount={dispatchedIds.length}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Persistent Emergency Alert Banner if Active on other tabs */}
        {activeAlert && activeTab !== 'CHAT' && (
          <EmergencyDoctorAlert
            alert={activeAlert}
            onDismiss={() => setActiveAlert(null)}
          />
        )}

        {/* View Switcher Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Tab 1: Omni Voice Comm-Link & Triage Command Box */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('CHAT');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all ${
                activeTab === 'CHAT'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-slate-950 shadow-[0_0_18px_rgba(6,182,212,0.45)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>🎙️ Voice Comm-Link & Triage</span>
            </button>

            {/* Tab 2: Executive Suite */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('EXECUTIVE');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all ${
                activeTab === 'EXECUTIVE'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Executive Assistant & Planner</span>
            </button>

            {/* Tab 3: Hospital Floor Blueprints */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('MAP');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all ${
                activeTab === 'MAP'
                  ? 'bg-cyan-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>🗺️ Hospital Blueprints</span>
            </button>

            {/* Tab 4: On-Call Physicians */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('DOCTORS');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all ${
                activeTab === 'DOCTORS'
                  ? 'bg-cyan-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>👨‍⚕️ On-Call Doctors</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">Male Voice: Active</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-cyan-400 font-semibold">Gemini 3.1 Flash-Lite</span>
          </div>
        </div>

        {/* Dynamic Main Workspace */}
        {activeTab === 'CHAT' && (
          <div className="w-full flex-1">
            <HospitalVoiceChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              soundEnabled={soundEnabled}
              activeAlert={activeAlert}
              onDismissAlert={() => setActiveAlert(null)}
              onTriggerSos={handleTriggerSos}
              onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
              dispatchedDoctorsCount={dispatchedIds.length}
              onViewOnMap={(floorId) => {
                setActiveFloorId(floorId);
                setActiveTab('MAP');
              }}
            />
          </div>
        )}

        {activeTab === 'EXECUTIVE' && (
          <JarvisExecutiveSuite
            onSendMessage={handleSendMessage}
            soundEnabled={soundEnabled}
            onSwitchToHospital={() => setActiveTab('CHAT')}
          />
        )}

        {activeTab === 'MAP' && (
          <div className="h-[750px]">
            <HospitalInteractiveMap
              activeFloorId={activeFloorId}
              onSelectFloor={(fid) => setActiveFloorId(fid)}
              onSelectItemForDirections={(item) => {
                setActiveTab('CHAT');
                handleSendMessage(`Where is ${item} located?`);
              }}
            />
          </div>
        )}

        {activeTab === 'DOCTORS' && (
          <div className="space-y-4">
            <DoctorRosterPanel
              dispatchedDoctorIds={dispatchedIds}
              onPageDoctor={(doc) => {
                setActiveTab('CHAT');
                handleSendMessage(`I need to consult ${doc.name} (${doc.specialty}) regarding patient care.`);
              }}
            />
          </div>
        )}
      </main>

      {/* Male Voice Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Clinical & Executive Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-2.5 px-4 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            J.A.R.V.I.S. DUAL-CORE // EXECUTIVE PRODUCTIVITY & ST. JUDE CLINICAL MEDINAV
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400">
            RAPID RESPONSE & STRATEGIC AI INTELLIGENCE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            SYSTEM STATUS: ONLINE
          </span>
          <span className="text-emerald-400 font-bold">
            ALL DIRECTIVES SYNCHRONIZED
          </span>
        </div>
      </footer>
    </div>
  );
}
