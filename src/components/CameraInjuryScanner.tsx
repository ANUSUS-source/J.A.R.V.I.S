import React, { useState, useRef, useEffect } from 'react';
import { ClinicalScanResult, DoctorProfile } from '../types/hospital';
import { PatientWaitingTimeBox } from './PatientWaitingTimeBox';
import { jarvisVoice } from '../utils/speechEngine';
import { soundFx } from '../utils/audioEffects';
import {
  Camera,
  CameraOff,
  Scan,
  Sparkles,
  AlertTriangle,
  Clock,
  UserCheck,
  Pill,
  ShieldAlert,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Upload,
  Eye,
  Flame,
  Bandage,
  Droplets,
  X,
  MapPin,
  ChevronRight,
  Send,
  Radio,
  FileText,
  Activity,
} from 'lucide-react';

interface CameraInjuryScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostReportToChat?: (report: ClinicalScanResult) => void;
  onPageDoctor?: (doc: any) => void;
  onViewOnMap?: (floorId: 'B1' | 'G' | 'L1' | 'L2' | 'L3' | 'L4') => void;
  soundEnabled: boolean;
}

export type AnatomicalRegion = 'ALL' | 'MOUTH' | 'EARS' | 'LEGS' | 'HANDS' | 'FINGERS' | 'EYES' | 'BURNS' | 'RASH';

export interface AnatomicalTargetOption {
  id: AnatomicalRegion;
  label: string;
  focus: string;
  guideText: string;
}

export const ANATOMICAL_TARGETS: AnatomicalTargetOption[] = [
  { id: 'ALL', label: '🌐 All Wounds', focus: 'General cutaneous and soft-tissue trauma', guideText: 'ALIGN ANY INJURY, WOUND OR PHYSICAL SYMPTOM' },
  { id: 'MOUTH', label: '👄 Mouth & Lips', focus: 'Aphthous ulcer, canker sore, lip cut, oral thrush', guideText: 'ALIGN LABIAL MUCOSA, LIPS OR ORAL CAVITY' },
  { id: 'EARS', label: '👂 Ears & Canal', focus: 'Otitis externa, swimmer’s ear, auricular canal trauma', guideText: 'ALIGN AURICULAR PINNA & AUDITORY CANAL' },
  { id: 'LEGS', label: '🦵 Legs & Shins', focus: 'Pretibial shin lacerations, road rash, knee cuts', guideText: 'ALIGN LOWER EXTREMITY, SHIN OR KNEE WOUND' },
  { id: 'HANDS', label: '✋ Hands & Palms', focus: 'Palmar lacerations, puncture wounds, palm cuts', guideText: 'ALIGN PALMAR ZONE & HAND SOFT TISSUE' },
  { id: 'FINGERS', label: '🖐️ Fingers & Nails', focus: 'Acute paronychia, nailbed cut, digit crush trauma', guideText: 'ALIGN DISTAL PHALANX, FINGER OR NAILBED' },
  { id: 'EYES', label: '👁️ Eyes / Redness', focus: 'Acute conjunctivitis, scleral injection, dry eye', guideText: 'ALIGN CORNEA, SCLERA & OCULAR SURFACE' },
  { id: 'BURNS', label: '🔥 Thermal Burns', focus: 'First & second degree heat scalds', guideText: 'ALIGN BURN ERYTHEMA OR HEAT SCALD' },
  { id: 'RASH', label: '🩹 Allergic Rash', focus: 'Contact dermatitis, hives, allergic wheals', guideText: 'ALIGN DERMAL HIVES OR ALLERGIC WHEALS' },
];

export const PRESET_SAMPLES = [
  {
    id: 'mouth',
    region: 'MOUTH' as AnatomicalRegion,
    label: '👄 Mouth: Canker Sore & Lip Cut',
    hint: 'Patient exhibits painful aphthous oral ulcer on buccal mucosa with traumatic labial lip laceration and swelling',
    category: 'Oral Medicine',
    color: '#ec4899',
    badge: 'Mouth / Oral',
  },
  {
    id: 'ear',
    region: 'EARS' as AnatomicalRegion,
    label: '👂 Ear: Swimmer’s Ear & Canal Cut',
    hint: 'Patient has acute ear canal erythema, swelling, tenderness upon moving tragus, and external auditory canal abrasion',
    category: 'ENT / Otology',
    color: '#eab308',
    badge: 'Ears / Otic',
  },
  {
    id: 'leg',
    region: 'LEGS' as AnatomicalRegion,
    label: '🦵 Leg: Pretibial Shin Cut & Road Rash',
    hint: 'Deep pretibial laceration over anterior shin bone with road rash dermal abrasion and localized capillary bleeding',
    category: 'Trauma & Wound',
    color: '#ef4444',
    badge: 'Legs / Shin',
  },
  {
    id: 'hand',
    region: 'HANDS' as AnatomicalRegion,
    label: '✋ Hand: Deep Palmar Laceration',
    hint: 'Palmar cutaneous laceration across thenar crease with active capillary bleeding and soft-tissue shear wound',
    category: 'Hand Trauma',
    color: '#06b6d4',
    badge: 'Hands / Palm',
  },
  {
    id: 'finger',
    region: 'FINGERS' as AnatomicalRegion,
    label: '🖐️ Finger: Nailbed Paronychia & Cut',
    hint: 'Acute digital paronychia with erythematous periungual abscess and painful fingertip laceration',
    category: 'Extremity Care',
    color: '#8b5cf6',
    badge: 'Fingers / Nail',
  },
  {
    id: 'eye',
    region: 'EYES' as AnatomicalRegion,
    label: '👁️ Eyes: Red Eyes & Conjunctivitis',
    hint: 'Patient exhibits acute bilateral ocular redness, conjunctival injection, dryness, burning and mild photophobia',
    category: 'Ocular',
    color: '#10b981',
    badge: 'Eyes / Cornea',
  },
  {
    id: 'burn',
    region: 'BURNS' as AnatomicalRegion,
    label: '🔥 Thermal Burn & Scald',
    hint: 'First-degree hot liquid thermal scald on hand with active dermal redness and burning sensation',
    category: 'Burns',
    color: '#f97316',
    badge: 'Thermal Scald',
  },
  {
    id: 'rash',
    region: 'RASH' as AnatomicalRegion,
    label: '🩹 Allergic Skin Rash & Hives',
    hint: 'Erythematous contact dermatitis with intense itching, wheals, and micro-papular hives',
    category: 'Dermatology',
    color: '#a855f7',
    badge: 'Dermatology',
  },
];

export const CameraInjuryScanner: React.FC<CameraInjuryScannerProps> = ({
  isOpen,
  onClose,
  onPostReportToChat,
  onPageDoctor,
  onViewOnMap,
  soundEnabled,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion>('ALL');
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ClinicalScanResult | null>(null);
  const [symptomContext, setSymptomContext] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStreamActive(true);
      } else {
        setCameraError('Camera API is not supported in this browser environment. You can use image upload or preset samples.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera permission not granted or device not available. You can upload a photo or use a sample preset.');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      if (soundEnabled) soundFx.playClick();
      // Auto-trigger scan
      const activeGuide = ANATOMICAL_TARGETS.find((t) => t.id === selectedRegion);
      const contextHint = symptomContext || (activeGuide && selectedRegion !== 'ALL' ? `Target Body Region: ${activeGuide.label} (${activeGuide.focus})` : 'Visual camera examination of patient injury');
      performVisionAnalysis(dataUrl, contextHint);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      if (soundEnabled) soundFx.playClick();
      const activeGuide = ANATOMICAL_TARGETS.find((t) => t.id === selectedRegion);
      const contextHint = symptomContext || (activeGuide && selectedRegion !== 'ALL' ? `Target Body Region: ${activeGuide.label} (${activeGuide.focus})` : file.name);
      performVisionAnalysis(dataUrl, contextHint);
    };
    reader.readAsDataURL(file);
  };

  const handleRunPreset = (preset: typeof PRESET_SAMPLES[0]) => {
    setSelectedRegion(preset.region);
    setSymptomContext(preset.hint);
    // Draw an illustrative cyber-clinical HUD canvas for the preset anatomy
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark HUD background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, 640, 420);

      // Subtle cyan grid lines
      ctx.strokeStyle = '#0f2942';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 420);
        ctx.stroke();
      }
      for (let y = 0; y < 420; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Outer targeting frame
      ctx.strokeStyle = preset.color || '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 600, 380);

      // Corner reticles
      ctx.fillStyle = preset.color || '#06b6d4';
      ctx.fillRect(15, 15, 25, 6);
      ctx.fillRect(15, 15, 6, 25);
      ctx.fillRect(600, 15, 25, 6);
      ctx.fillRect(619, 15, 6, 25);
      ctx.fillRect(15, 399, 25, 6);
      ctx.fillRect(15, 380, 6, 25);
      ctx.fillRect(600, 399, 25, 6);
      ctx.fillRect(619, 380, 6, 25);

      // Center circular anatomical targeting crosshairs
      ctx.beginPath();
      ctx.arc(320, 190, 75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(320, 190, 35, 0, Math.PI * 2);
      ctx.strokeStyle = preset.color || '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(320, 100);
      ctx.lineTo(320, 280);
      ctx.moveTo(230, 190);
      ctx.lineTo(410, 190);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Clinical Text Badges
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`J.A.R.V.I.S. OPTICAL CLINICAL VISION // ST. JUDE MEDICAL`, 40, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`TARGET BODY REGION: [${preset.badge.toUpperCase()}]`, 40, 72);

      ctx.fillStyle = preset.color || '#f43f5e';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(preset.label, 40, 335);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(preset.hint.slice(0, 70), 40, 365);
      if (preset.hint.length > 70) {
        ctx.fillText(preset.hint.slice(70, 140), 40, 385);
      }
    }
    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(sampleDataUrl);
    stopCamera();
    performVisionAnalysis(sampleDataUrl, preset.hint);
  };

  const performVisionAnalysis = async (imgData: string, hint: string) => {
    setIsScanning(true);
    setScanResult(null);
    if (soundEnabled) soundFx.playHospitalChime();

    try {
      const res = await fetch('/api/clinical/vision-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imgData,
          symptomHint: hint,
        }),
      });

      const data = await res.json();
      if (data.scanResult) {
        setScanResult(data.scanResult);

        // Verbally speak the diagnosis in male voice!
        if (soundEnabled && data.scanResult.spokenDiagnosis) {
          setTimeout(() => {
            jarvisVoice.speak(data.scanResult.spokenDiagnosis, undefined, true);
          }, 350);
        }
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setSymptomContext('');
    startCamera();
  };

  const handlePageAssignedDoctor = () => {
    if (!scanResult) return;
    if (soundEnabled) soundFx.playDoctorPagerAlert();
    if (onPageDoctor) {
      onPageDoctor(scanResult.recommendedDoctor);
    }
  };

  const handlePushToChat = () => {
    if (!scanResult || !onPostReportToChat) return;
    onPostReportToChat(scanResult);
    if (soundEnabled) soundFx.playClick();
    onClose();
  };

  const activeTargetGuide = ANATOMICAL_TARGETS.find((t) => t.id === selectedRegion) || ANATOMICAL_TARGETS[0];

  // Filter preset scenarios by selected anatomy (or show all if 'ALL' is selected)
  const displayedPresets = selectedRegion === 'ALL'
    ? PRESET_SAMPLES
    : PRESET_SAMPLES.filter((p) => p.region === selectedRegion);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-bold text-base sm:text-lg text-white tracking-wide">
                  AI CLINICAL WOUND & INJURY VISION SCANNER
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Multimodal wound detection for mouth, ears, legs, hands, fingers & red eyes • Prescriptions & Doctor Wait Times
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. ANATOMICAL TARGET BODY SELECTOR (Mouth, Ears, Legs, Hands, Fingers, Eyes, Burns) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>SELECT ANATOMICAL TARGET REGION (WOUND FOCUS):</span>
              </span>
              <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
                Adapts optical reticle & diagnostic routing
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {ANATOMICAL_TARGETS.map((target) => {
                const isSelected = selectedRegion === target.id;
                return (
                  <button
                    key={target.id}
                    onClick={() => {
                      setSelectedRegion(target.id);
                      if (soundEnabled) soundFx.playClick();
                      if (target.id !== 'ALL') {
                        setSymptomContext(`Examination of ${target.label} - ${target.focus}`);
                      } else {
                        setSymptomContext('');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.45)] scale-105'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/50'
                    }`}
                  >
                    <span>{target.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ONE-TOUCH CLINICAL SCENARIOS ROW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold">
              <span>ONE-TOUCH CLINICAL TEST SCENARIOS:</span>
              <span className="text-slate-400 font-normal text-[11px]">Instant diagnosis & prescription preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(displayedPresets.length > 0 ? displayedPresets : PRESET_SAMPLES).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleRunPreset(sample)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850 text-left transition-all group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                      {sample.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sample.category}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Camera Viewport / Image Capture Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Viewport Frame (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative aspect-video rounded-2xl bg-black border border-cyan-500/30 overflow-hidden shadow-2xl flex items-center justify-center">
                {/* Live Video Feed */}
                {!capturedImage && (
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Captured Image Display */}
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured injury"
                    className="w-full h-full object-contain bg-slate-950"
                  />
                )}

                {/* Holographic HUD Targeting Reticle */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                    <div className="px-2.5 py-1 rounded bg-black/75 border border-cyan-500/40 text-[10px] sm:text-xs font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>{isScanning ? 'SPECTRAL DIAGNOSTIC SCAN IN PROGRESS...' : activeTargetGuide.guideText}</span>
                    </div>
                    <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                  </div>

                  {/* Center Scanning Crosshair */}
                  <div className="self-center flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-cyan-400/40 flex items-center justify-center animate-pulse">
                      <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                    <div className="text-[10px] font-mono text-slate-300 bg-black/75 px-2.5 py-0.5 rounded border border-slate-700/60">
                      TARGET: {activeTargetGuide.label}
                    </div>
                    <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                  </div>
                </div>

                {/* Scanning Laser Beam Line Animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)] animate-bounce top-1/2" />
                )}

                {/* Camera error message */}
                {cameraError && !capturedImage && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-300 space-y-2">
                    <CameraOff className="w-8 h-8 text-rose-400" />
                    <p className="font-semibold text-rose-200">Camera Access Notice</p>
                    <p className="text-slate-400 max-w-sm">{cameraError}</p>
                  </div>
                )}
              </div>

              {/* Viewport Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {!capturedImage ? (
                    <button
                      onClick={handleCaptureSnapshot}
                      disabled={!streamActive}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Capture & Examine</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRetake}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>New Scan / Retake</span>
                    </button>
                  )}

                  {/* Upload Image Option */}
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-cyan-300 font-mono text-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Front / Back Camera Switch on mobile */}
                {!capturedImage && (
                  <button
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white"
                  >
                    Switch Lens ({facingMode === 'user' ? 'Front' : 'Rear'})
                  </button>
                )}
              </div>

              {/* Optional Symptom context input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Optional note: (e.g. 'Both eyes feel gritty and red since morning')..."
                  value={symptomContext}
                  onChange={(e) => setSymptomContext(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                {capturedImage && (
                  <button
                    onClick={() => performVisionAnalysis(capturedImage, symptomContext)}
                    disabled={isScanning}
                    className="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-semibold disabled:opacity-50"
                  >
                    Re-Analyze
                  </button>
                )}
              </div>
            </div>

            {/* Diagnostic Report Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {isScanning && (
                <div className="rounded-2xl p-6 bg-slate-950 border border-cyan-500/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                  <div className="text-sm font-bold text-white font-orbitron">
                    J.A.R.V.I.S. MULTIMODAL CLINICAL ANALYSIS
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Evaluating ocular vascularity, cutaneous integrity, inflammation markers, and cross-referencing on-call physicians...
                  </p>
                </div>
              )}

              {!isScanning && !scanResult && (
                <div className="rounded-2xl p-6 bg-slate-950/80 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                    <Scan className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Scanner Standing By</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Point camera at red eyes, cuts, rashes, or burns. J.A.R.V.I.S. will diagnose the probable cause, recommend targeted medicines & dosages, and report current doctor wait times.
                  </p>
                  <div className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 py-1.5 px-3 rounded-lg border border-cyan-500/20">
                    Try the "Red Eyes" preset above to simulate immediately!
                  </div>
                </div>
              )}

              {/* COMPLETE CLINICAL DIAGNOSTIC REPORT */}
              {!isScanning && scanResult && (
                <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 sm:p-5 space-y-4 shadow-xl">
                  {/* Condition Title & Severity */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        [CLINICAL VISION DIAGNOSIS]
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          scanResult.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                            : scanResult.severity === 'URGENT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        }`}
                      >
                        {scanResult.severity} SEVERITY
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white tracking-wide">
                      {scanResult.identifiedCondition}
                    </h4>
                  </div>

                  {/* Spoken Voice Briefing Quote */}
                  {scanResult.spokenDiagnosis && (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-xs text-cyan-100 italic leading-relaxed">
                          "{scanResult.spokenDiagnosis}"
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (soundEnabled) jarvisVoice.speak(scanResult.spokenDiagnosis, undefined, true);
                        }}
                        title="Replay Voice Diagnosis"
                        className="p-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Probable Causes */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PROBABLE CAUSES:</span>
                    </div>
                    <ul className="space-y-1 pl-1">
                      {scanResult.probableCauses.map((cause, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Medicines & Prescriptions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-400" />
                      <span>RECOMMENDED MEDICINES & PRESCRIPTIONS:</span>
                    </div>

                    <div className="space-y-2">
                      {scanResult.recommendedMedicines.map((med, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-bold text-white">{med.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                med.prescriptionRequired
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {med.prescriptionRequired ? 'PRESCRIPTION REQUIRED' : 'OTC AVAILABLE'}
                            </span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-mono font-medium">
                            ▶ Dosage: {med.dosage}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Purpose: {med.purpose}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patient Waiting Time Box with Full Details */}
                  <PatientWaitingTimeBox
                    doctorName={scanResult.recommendedDoctor.name}
                    specialty={scanResult.recommendedDoctor.specialty}
                    department={scanResult.recommendedDoctor.department}
                    location={scanResult.recommendedDoctor.location}
                    floorId={
                      scanResult.recommendedDoctor.location.includes('Level G') ||
                      scanResult.recommendedDoctor.location.includes('Ground')
                        ? 'G'
                        : scanResult.recommendedDoctor.location.includes('Level 2')
                        ? 'L2'
                        : scanResult.recommendedDoctor.location.includes('Level 4')
                        ? 'L4'
                        : 'L1'
                    }
                    currentWaitingTime={scanResult.recommendedDoctor.currentWaitingTime}
                    queueLength={scanResult.recommendedDoctor.queueLength}
                    priority={scanResult.severity}
                    conditionTitle={scanResult.identifiedCondition}
                    pager={scanResult.recommendedDoctor.pager}
                    prepAdvice={scanResult.immediateHomeCare}
                    onPageDoctor={handlePageAssignedDoctor}
                    onViewOnMap={(floorId) => {
                      if (onViewOnMap) {
                        onViewOnMap(floorId);
                        onClose();
                      }
                    }}
                  />

                  {/* Immediate Home Care Advice */}
                  <div className="space-y-1 pt-1 text-xs">
                    <div className="font-mono text-slate-400 font-bold">
                      IMMEDIATE HOME CARE & PRECAUTIONS:
                    </div>
                    <ul className="space-y-0.5 text-slate-300">
                      {scanResult.immediateHomeCare.slice(0, 3).map((care, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{care}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons: Send to Comm-Link */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={handlePushToChat}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Log Report in Voice Comm-Link</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Video Snapshots */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
