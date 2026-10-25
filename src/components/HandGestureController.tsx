/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { handDetector, HandGestureResult, FingerState } from '../utils/handGestureDetector';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import {
  Camera,
  CameraOff,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Youtube,
  Globe,
  Layers,
  Hand,
  Volume2,
  Activity,
  Check,
  Zap,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface HandGestureControllerProps {
  onOpenCameraFull?: () => void;
  onOpenNewTab?: () => void;
  onOpenYouTube?: () => void;
  soundEnabled?: boolean;
  themeColor?: 'cyan' | 'amber' | 'emerald' | 'crimson';
  isCameraModalOpen?: boolean;
  onCloseCameraModal?: () => void;
  onRequestChatMessage?: (text: string) => void;
  externalCameraCommand?: 'START' | 'STOP' | null;
  onCameraStateChange?: (active: boolean) => void;
}

export const HandGestureController: React.FC<HandGestureControllerProps> = ({
  onOpenCameraFull,
  onOpenNewTab,
  onOpenYouTube,
  soundEnabled = true,
  themeColor = 'cyan',
  isCameraModalOpen = false,
  onCloseCameraModal,
  onRequestChatMessage,
  externalCameraCommand,
  onCameraStateChange,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [virtualGestureTarget, setVirtualGestureTarget] = useState<'AUTO' | 5 | 4 | 3 | 0>('AUTO');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializingModel, setIsInitializingModel] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<HandGestureResult['activeGesture']>('NONE');
  const [openFingersCount, setOpenFingersCount] = useState<number>(0);
  const [fingersState, setFingersState] = useState<FingerState>({
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  });
  const [handedness, setHandedness] = useState<string>('Unknown');
  const [trackingEngine, setTrackingEngine] = useState<string>('INITIALIZING...');
  const [actionProgress, setActionProgress] = useState<number>(0);
  const [targetActionName, setTargetActionName] = useState<string | null>(null);
  const [lastExecutedAction, setLastExecutedAction] = useState<string | null>(null);
  const [actionCooldown, setActionCooldown] = useState<number>(0);

  // Holographic Modals for New Tab & YouTube
  const [activeOverlayModal, setActiveOverlayModal] = useState<'NEW_TAB' | 'YOUTUBE' | null>(null);
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState<string>('Iron Man Jarvis HUD soundtrack');

  // Video and Canvas References
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);
  const dockVideoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const virtualAnimIdRef = useRef<number | null>(null);

  // Gesture hold tracking refs
  const gestureHoldCountRef = useRef<{ gesture: string; frames: number }>({
    gesture: 'NONE',
    frames: 0,
  });
  const cooldownRef = useRef<number>(0);

  // Initialize MediaPipe model
  useEffect(() => {
    let mounted = true;
    setIsInitializingModel(true);
    handDetector.init().then(() => {
      if (mounted) {
        setIsInitializingModel(false);
        setTrackingEngine(
          handDetector.currentEngine === 'mediapipe_gpu'
            ? 'MEDIAPIPE (GPU)'
            : handDetector.currentEngine === 'mediapipe_cpu'
            ? 'MEDIAPIPE (CPU)'
            : 'CV ACCELERATED'
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to safely attach current stream to any video element
  const attachStreamToVideo = useCallback((video: HTMLVideoElement | null) => {
    if (!video || !streamRef.current) return;
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }
    video
      .play()
      .catch((err) => {
        // Autoplay may wait for user gesture, but user clicked button so it usually passes
        console.warn('Video play prevented or delayed:', err);
      });
  }, []);

  // Sync stream to all registered video elements
  const syncAllVideoElements = useCallback(() => {
    if (!streamRef.current) return;
    attachStreamToVideo(masterVideoRef.current);
    attachStreamToVideo(dockVideoRef.current);
    attachStreamToVideo(modalVideoRef.current);
  }, [attachStreamToVideo]);

  // Keep all video elements in sync whenever camera active or modal opens
  useEffect(() => {
    if (cameraActive && streamRef.current) {
      syncAllVideoElements();
    }
  }, [cameraActive, isCameraModalOpen, isMinimized, syncAllVideoElements]);

  // Clean up media tracks on unmount to prevent lingering webcam lights
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }
      if (virtualAnimIdRef.current) {
        cancelAnimationFrame(virtualAnimIdRef.current);
        virtualAnimIdRef.current = null;
      }
    };
  }, []);

  // Start Real Hardware Camera Stream with progressive multi-level fallback
  const startCamera = async () => {
    setCameraError(null);
    setIsVirtualCamera(false);

    // Stop virtual camera if running
    if (virtualAnimIdRef.current) {
      cancelAnimationFrame(virtualAnimIdRef.current);
      virtualAnimIdRef.current = null;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Camera API (getUserMedia) is not supported or is restricted in this browser context.'
        );
      }

      // Progressive constraint fallback list
      const constraintCandidates: MediaStreamConstraints[] = [
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: 'user',
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const constraints of constraintCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream && stream.getVideoTracks().length > 0) {
            break;
          }
        } catch (err: any) {
          lastErr = err;
          // If the user explicitly clicked "Block", don't loop endlessly
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw err;
          }
        }
      }

      if (!stream) {
        throw lastErr || new Error('Could not establish optical video stream.');
      }

      streamRef.current = stream;
      setCameraActive(true);
      if (onCameraStateChange) {
        onCameraStateChange(true);
      }

      // Sync stream to video elements immediately and on short tick
      setTimeout(() => {
        syncAllVideoElements();
      }, 30);

      if (soundEnabled) soundFx.playClick();
      if (soundEnabled) jarvisVoice.speak('Optical cameras activated. Hand tracking online.');
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = 'Unable to start camera stream.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errMsg =
          'Camera permission denied. Click the lock/camera icon in your address bar to allow camera access, or click "TEST WITH VIRTUAL FEED" below.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errMsg =
          'No physical webcam detected on your device. You can test hand tracking using the Virtual Feed.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        errMsg =
          'Camera hardware is in use by another app or OS service. Please close other camera apps and retry.';
      } else if (err?.message) {
        errMsg = err.message;
      }

      setCameraError(errMsg);
      setCameraActive(false);
      if (onCameraStateChange) {
        onCameraStateChange(false);
      }
    }
  };

  // Start Synthetic Virtual Camera Feed (for sandbox / missing hardware / testing)
  const startVirtualCamera = () => {
    setCameraError(null);
    setIsVirtualCamera(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }

    // Create or reuse offscreen virtual canvas
    if (!virtualCanvasRef.current) {
      const vCanvas = document.createElement('canvas');
      vCanvas.width = 640;
      vCanvas.height = 480;
      virtualCanvasRef.current = vCanvas;
    }

    const canvas = virtualCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const renderVirtualFeed = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Determine active target gesture in auto mode
      let targetFingers = 5;
      if (virtualGestureTarget === 'AUTO') {
        // Cycle every 4.5 seconds: 5 fingers (0-4.5s) -> 4 fingers (4.5-9s) -> 3 fingers (9-13.5s) -> fist (13.5-17s)
        const cycle = Math.floor(elapsed / 4.5) % 4;
        if (cycle === 0) targetFingers = 5;
        else if (cycle === 1) targetFingers = 4;
        else if (cycle === 2) targetFingers = 3;
        else targetFingers = 0;
      } else {
        targetFingers = virtualGestureTarget;
      }

      // Dark tactical cyber background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Virtual Cybernetic Iron Man Hand with skin/armor tones detectable by CV and ML
      const cx = canvas.width / 2 + Math.sin(elapsed * 1.5) * 12;
      const cy = canvas.height / 2 + 30 + Math.cos(elapsed * 2) * 8;

      // Palm (Skin tone so CV skin detection triggers with 100% reliability)
      ctx.fillStyle = '#e2a77f';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wrist
      ctx.fillStyle = '#c78f67';
      ctx.beginPath();
      ctx.rect(cx - 38, cy + 50, 76, 90);
      ctx.fill();

      // Repulsor Core glow in palm center
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 5 Finger Definitions: [name, angleOffset, length, isOpen]
      const fingerDefinitions = [
        { name: 'Thumb', xOff: -52, yBase: cy + 12, angle: -0.65, len: 65, open: targetFingers >= 5 },
        { name: 'Index', xOff: -26, yBase: cy - 45, angle: -0.15, len: 90, open: targetFingers >= 1 && targetFingers !== 0 },
        { name: 'Middle', xOff: 0, yBase: cy - 55, angle: 0, len: 100, open: targetFingers >= 2 && targetFingers !== 0 },
        { name: 'Ring', xOff: 26, yBase: cy - 48, angle: 0.15, len: 90, open: targetFingers >= 3 && targetFingers !== 0 },
        { name: 'Pinky', xOff: 48, yBase: cy - 35, angle: 0.35, len: 75, open: targetFingers >= 4 && targetFingers !== 0 },
      ];

      for (const f of fingerDefinitions) {
        const fingerLen = f.open ? f.len : 28; // Tucked or extended
        const tipX = cx + f.xOff + Math.sin(f.angle) * fingerLen;
        const tipY = f.yBase - Math.cos(f.angle) * fingerLen;

        // Draw articulated finger bone
        ctx.beginPath();
        ctx.moveTo(cx + f.xOff, f.yBase);
        ctx.lineTo(tipX, tipY);
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.strokeStyle = f.open ? '#e2a77f' : '#b37852';
        ctx.shadowBlur = 10;
        ctx.shadowColor = f.open ? '#00f0ff' : 'transparent';
        ctx.stroke();

        // Fingertip sensor dot
        ctx.beginPath();
        ctx.arc(tipX, tipY, f.open ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = f.open ? '#00f0ff' : '#64748b';
        ctx.fill();
      }

      // HUD Text telemetry overlay on virtual canvas
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(`SIMULATED OPTICAL FEED // ACTIVE GESTURE: ${targetFingers} FINGERS`, 18, 28);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `MODE: ${virtualGestureTarget === 'AUTO' ? 'AUTO-CYCLE PROTOCOL' : 'MANUAL OVERRIDE'}`,
        18,
        46
      );

      virtualAnimIdRef.current = requestAnimationFrame(renderVirtualFeed);
    };

    renderVirtualFeed();

    // Capture virtual stream from canvas
    try {
      const virtualStream = (canvas as any).captureStream(30) as MediaStream;
      streamRef.current = virtualStream;
      setCameraActive(true);
      if (onCameraStateChange) {
        onCameraStateChange(true);
      }
      setTimeout(() => {
        syncAllVideoElements();
      }, 50);

      if (soundEnabled) soundFx.playClick();
      if (soundEnabled) jarvisVoice.speak('Virtual optical feed engaged. Simulated telemetry active, sir.');
    } catch (e) {
      console.error('Canvas captureStream error:', e);
      setCameraError('Unable to generate virtual camera stream.');
    }
  };

  // Stop Camera Stream and release hardware completely
  const stopCamera = (silent = false) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }

    if (virtualAnimIdRef.current) {
      cancelAnimationFrame(virtualAnimIdRef.current);
      virtualAnimIdRef.current = null;
    }

    [masterVideoRef.current, dockVideoRef.current, modalVideoRef.current].forEach((video) => {
      if (video) {
        video.srcObject = null;
      }
    });

    setCameraActive(false);
    setIsVirtualCamera(false);
    if (onCameraStateChange) {
      onCameraStateChange(false);
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setActionProgress(0);
    setTargetActionName(null);
    setCurrentGesture('NONE');
    setOpenFingersCount(0);
    setFingersState({ thumb: false, index: false, middle: false, ring: false, pinky: false });

    // Clear canvases
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (modalCanvasRef.current) {
      const ctx = modalCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, modalCanvasRef.current.width, modalCanvasRef.current.height);
    }

    if (!silent && soundEnabled) {
      soundFx.playPowerDown();
      jarvisVoice.speak('Optical cameras powered down. Camera hardware released, sir.');
    }
    if (onRequestChatMessage && !silent) {
      onRequestChatMessage('Optical sensors powered down. Webcam stream disconnected.');
    }
  };

  // Shutdown camera and close the full viewport modal
  const handleFullCameraShutdown = () => {
    stopCamera(false);
    if (onCloseCameraModal) {
      onCloseCameraModal();
    }
  };

  // Handle external camera commands (e.g. from voice or header button)
  useEffect(() => {
    if (externalCameraCommand === 'STOP') {
      stopCamera(false);
    } else if (externalCameraCommand === 'START' && !cameraActive) {
      startCamera();
    }
  }, [externalCameraCommand]);

  // Trigger Action Dispatcher with voice and sound
  const executeGestureAction = (action: 'OPEN_CAMERA' | 'OPEN_NEW_TAB' | 'OPEN_YOUTUBE' | 'CLOSE_CAMERA') => {
    // Set cooldown to avoid rapid repeated triggers
    cooldownRef.current = 60;
    setActionCooldown(2);

    if (action === 'CLOSE_CAMERA') {
      setLastExecutedAction('0 FINGERS (FIST) -> CAMERA POWERED OFF');
      handleFullCameraShutdown();
      return;
    }

    if (action === 'OPEN_CAMERA') {
      setLastExecutedAction('5 FINGERS -> OPEN CAMERA EXECUTED');
      if (soundEnabled) soundFx.playArcReactorPowerUp();
      if (soundEnabled) {
        jarvisVoice.speak('Visual optical sensors maximized. Camera mode engaged, sir.');
      }
      if (onOpenCameraFull) {
        onOpenCameraFull();
      }
      setIsMinimized(false);
      if (onRequestChatMessage) {
        onRequestChatMessage('Gesture detected: 5 Fingers (Open Palm). Optical camera sensors expanded to full viewport.');
      }
    } else if (action === 'OPEN_NEW_TAB') {
      setLastExecutedAction('4 FINGERS -> OPEN NEW TAB EXECUTED');
      if (soundEnabled) soundFx.playClick();
      if (soundEnabled) {
        jarvisVoice.speak('Gesture detected: 4 fingers. Launching new browser tab protocol, sir.');
      }

      try {
        window.open('https://google.com', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, opening holographic modal instead', e);
      }

      setActiveOverlayModal('NEW_TAB');
      if (onOpenNewTab) {
        onOpenNewTab();
      }
      if (onRequestChatMessage) {
        onRequestChatMessage('Gesture detected: 4 Fingers. New browser tab protocol initiated.');
      }
    } else if (action === 'OPEN_YOUTUBE') {
      setLastExecutedAction('3 FINGERS -> OPEN YOUTUBE EXECUTED');
      if (soundEnabled) soundFx.playClick();
      if (soundEnabled) {
        jarvisVoice.speak('Gesture detected: 3 fingers. Accessing YouTube tactical feed, sir.');
      }

      try {
        window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, opening holo player modal', e);
      }

      setActiveOverlayModal('YOUTUBE');
      if (onOpenYouTube) {
        onOpenYouTube();
      }
      if (onRequestChatMessage) {
        onRequestChatMessage('Gesture detected: 3 Fingers. Connecting to YouTube tactical stream.');
      }
    }
  };

  // Real-time tracking and rendering loop
  useEffect(() => {
    if (!cameraActive) return;

    let isRunning = true;

    const processFrame = () => {
      if (!isRunning) return;

      // Select whichever video element is active and ready
      const video =
        (dockVideoRef.current && dockVideoRef.current.readyState >= 2)
          ? dockVideoRef.current
          : (masterVideoRef.current && masterVideoRef.current.readyState >= 2)
          ? masterVideoRef.current
          : (modalVideoRef.current && modalVideoRef.current.readyState >= 2)
          ? modalVideoRef.current
          : null;

      if (video && video.readyState >= 2) {
        // Decrement cooldown if active
        if (cooldownRef.current > 0) {
          cooldownRef.current--;
          setActionCooldown(Math.ceil(cooldownRef.current / 30));
        }

        // Run detection with high-precision monotonic timestamp
        const result = handDetector.detect(video, performance.now());

        if (result.handDetected) {
          setOpenFingersCount(result.openFingersCount);
          setFingersState(result.fingers);
          setCurrentGesture(result.activeGesture);
          setHandedness(result.handedness);
          setTrackingEngine(
            result.engine === 'mediapipe_gpu'
              ? 'MEDIAPIPE (GPU)'
              : result.engine === 'mediapipe_cpu'
              ? 'MEDIAPIPE (CPU)'
              : 'CV ACCELERATED'
          );

          // Check required target actions:
          // 5 fingers: Open Camera
          // 4 fingers: Open New Tab
          // 3 fingers: Open YouTube
          // 0 fingers (fist): Power Off / Close Camera
          let currentTarget: 'OPEN_CAMERA' | 'OPEN_NEW_TAB' | 'OPEN_YOUTUBE' | 'CLOSE_CAMERA' | null = null;
          if (result.openFingersCount === 5) {
            currentTarget = 'OPEN_CAMERA';
          } else if (result.openFingersCount === 4) {
            currentTarget = 'OPEN_NEW_TAB';
          } else if (result.openFingersCount === 3) {
            currentTarget = 'OPEN_YOUTUBE';
          } else if (result.openFingersCount === 0 && result.handDetected) {
            currentTarget = 'CLOSE_CAMERA';
          }

          if (currentTarget) {
            setTargetActionName(
              currentTarget === 'OPEN_CAMERA'
                ? '5 FINGERS: OPEN CAMERA'
                : currentTarget === 'OPEN_NEW_TAB'
                ? '4 FINGERS: OPEN NEW TAB'
                : currentTarget === 'OPEN_YOUTUBE'
                ? '3 FINGERS: OPEN YOUTUBE'
                : '0 FINGERS (FIST): POWER OFF CAMERA'
            );

            // Accumulate stable frames (~12 frames for fast responsiveness, ~18 for fist to prevent false triggers)
            if (gestureHoldCountRef.current.gesture === currentTarget) {
              gestureHoldCountRef.current.frames++;
            } else {
              gestureHoldCountRef.current = { gesture: currentTarget, frames: 1 };
            }

            const requiredFrames = currentTarget === 'CLOSE_CAMERA' ? 18 : 12;
            const progress = Math.min(100, Math.round((gestureHoldCountRef.current.frames / requiredFrames) * 100));
            setActionProgress(progress);

            if (gestureHoldCountRef.current.frames >= requiredFrames && cooldownRef.current <= 0) {
              executeGestureAction(currentTarget);
              gestureHoldCountRef.current.frames = 0;
              setActionProgress(0);
            }
          } else {
            setTargetActionName(null);
            setActionProgress(0);
            gestureHoldCountRef.current = { gesture: 'NONE', frames: 0 };
          }
        } else {
          setOpenFingersCount(0);
          setFingersState({ thumb: false, index: false, middle: false, ring: false, pinky: false });
          setCurrentGesture('NONE');
          setTargetActionName(null);
          setActionProgress(0);
          gestureHoldCountRef.current = { gesture: 'NONE', frames: 0 };
        }

        // Render Stark HUD Overlay on both the dock canvas AND the modal canvas
        const canvasesToRender = [canvasRef.current, modalCanvasRef.current].filter(Boolean) as HTMLCanvasElement[];

        for (const canvas of canvasesToRender) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw holographic Iron Man corners
            drawHudReticles(ctx, canvas.width, canvas.height);

            // Draw hand skeleton & glowing repulsor fingertips if landmarks available
            if (result.handDetected && result.landmarks && result.landmarks.length > 0) {
              drawHandSkeleton(ctx, result.landmarks, canvas.width, canvas.height, result.openFingersCount, result.fingers);
            } else if (result.handDetected) {
              drawSimulatedHandReticle(ctx, canvas.width, canvas.height, result.openFingersCount);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, soundEnabled, isCameraModalOpen]);

  // Canvas drawing helpers
  const drawHudReticles = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';

    // Four corner brackets
    const bracketSize = 28;
    const margin = 16;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin, margin + bracketSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + bracketSize, margin);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - margin - bracketSize, margin);
    ctx.lineTo(w - margin, margin);
    ctx.lineTo(w - margin, margin + bracketSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin, h - margin - bracketSize);
    ctx.lineTo(margin, h - margin);
    ctx.lineTo(margin + bracketSize, h - margin);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - margin - bracketSize, h - margin);
    ctx.lineTo(w - margin, h - margin);
    ctx.lineTo(w - margin, h - margin - bracketSize);
    ctx.stroke();

    // Center crosshair
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();
  };

  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    lm: Array<{ x: number; y: number; z?: number }>,
    w: number,
    h: number,
    fingerCount: number,
    fingers: FingerState
  ) => {
    // 21-joint connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17], // Palm base
    ];

    // Select color based on fingers count
    const glowColor =
      fingerCount === 5
        ? '#00f0ff'
        : fingerCount === 4
        ? '#f59e0b'
        : fingerCount === 3
        ? '#10b981'
        : fingerCount === 0
        ? '#f43f5e'
        : '#a855f7';

    // Draw skeletal lines
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;

    for (const [i, j] of connections) {
      const p1 = lm[i];
      const p2 = lm[j];
      ctx.beginPath();
      // Mirror x for selfie orientation: (1 - x)
      ctx.moveTo((1 - p1.x) * w, p1.y * h);
      ctx.lineTo((1 - p2.x) * w, p2.y * h);
      ctx.stroke();
    }

    // Draw joints
    for (let i = 0; i < lm.length; i++) {
      const p = lm[i];
      const x = (1 - p.x) * w;
      const y = p.y * h;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = glowColor;
      ctx.fill();
    }

    // Fingertip definitions: [landmarkIndex, fingerKey, label]
    const fingerTipsConfig: Array<[number, keyof FingerState, string]> = [
      [4, 'thumb', 'THM'],
      [8, 'index', 'IDX'],
      [12, 'middle', 'MID'],
      [16, 'ring', 'RNG'],
      [20, 'pinky', 'PNK'],
    ];

    // Draw interactive fingertip targeting rings & labels
    for (const [tipIdx, fingerKey, label] of fingerTipsConfig) {
      const p = lm[tipIdx];
      const x = (1 - p.x) * w;
      const y = p.y * h;
      const isOpen = fingers[fingerKey];

      // Outer glow pulse ring
      ctx.beginPath();
      ctx.arc(x, y, isOpen ? 12 : 6, 0, Math.PI * 2);
      ctx.strokeStyle = isOpen ? '#ffffff' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = isOpen ? 2.5 : 1;
      ctx.shadowBlur = isOpen ? 16 : 4;
      ctx.shadowColor = isOpen ? glowColor : 'transparent';
      ctx.stroke();

      // Inner solid core
      ctx.beginPath();
      ctx.arc(x, y, isOpen ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isOpen ? '#ffffff' : glowColor;
      ctx.fill();

      // HUD Finger tip badge label
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isOpen ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(`${label}:${isOpen ? '1' : '0'}`, x + 10, y - 6);
    }

    // Draw center repulsor target on palm
    const palmCenter = {
      x: (((1 - lm[0].x) + (1 - lm[5].x) + (1 - lm[17].x)) / 3) * w,
      y: ((lm[0].y + lm[5].y + lm[17].y) / 3) * h,
    };

    // Animated rotating repulsor ring
    const nowSec = performance.now() / 1000;
    ctx.save();
    ctx.translate(palmCenter.x, palmCenter.y);
    ctx.rotate(nowSec * 2);

    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = glowColor;
    ctx.stroke();

    // 3 radial ticks inside repulsor
    for (let t = 0; t < 3; t++) {
      const ang = (t * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 12, Math.sin(ang) * 12);
      ctx.lineTo(Math.cos(ang) * 19, Math.sin(ang) * 19);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(palmCenter.x, palmCenter.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };

  const drawSimulatedHandReticle = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fingerCount: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    const glowColor =
      fingerCount === 5
        ? '#00f0ff'
        : fingerCount === 4
        ? '#f59e0b'
        : fingerCount === 3
        ? '#10b981'
        : '#f43f5e';

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;

    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = glowColor;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`FINGERS TRACKED: ${fingerCount}`, cx - 55, cy + 78);
  };

  return (
    <>
      {/* HIDDEN BACKGROUND MASTER VIDEO (Guarantees uninterrupted stream binding & processing) */}
      <video
        ref={(el) => {
          masterVideoRef.current = el;
          if (el && streamRef.current) attachStreamToVideo(el);
        }}
        autoPlay
        playsInline
        muted
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* COCKPIT COMPACT OPTICAL HUD DOCK */}
      <div className="hud-panel rounded-xl p-3 border-cyan-500/40 relative overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Camera className={`w-4 h-4 ${cameraActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-orbitron font-bold text-xs text-white tracking-wider flex items-center gap-1.5">
              OPTICAL SENSORS // HAND GESTURE HUD
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                onClick={() => stopCamera(false)}
                title="Stop video stream, release webcam device, and turn off webcam LED"
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-600 border border-rose-500 text-rose-200 hover:text-white font-bold text-[10px] font-orbitron flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                <span>POWER OFF CAMERA</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={startCamera}
                  title="Start optical camera stream and begin tracking hand gestures"
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-500 hover:text-black border border-cyan-400 text-cyan-300 font-bold text-[10px] font-orbitron flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>START CAMERA</span>
                </button>
                <button
                  onClick={startVirtualCamera}
                  title="Test hand gestures using simulated synthetic optical feed"
                  className="px-2 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-[10px] font-orbitron flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="hidden sm:inline">SIM FEED</span>
                </button>
              </div>
            )}

            {cameraActive && (
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border hidden sm:flex items-center gap-1 ${
                isVirtualCamera
                  ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                  : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isVirtualCamera ? 'bg-purple-400' : 'bg-emerald-400'} animate-ping`} />
                {isVirtualCamera ? 'VIRTUAL SIM' : 'ONLINE'}
              </span>
            )}

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand Camera View' : 'Minimize View'}
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-white cursor-pointer"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Camera Permission Alert if Error */}
        {cameraError && (
          <div className="p-2.5 mb-2 rounded-lg bg-rose-950/80 border border-rose-500/50 text-[11px] text-rose-200 flex items-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300">Camera Access Notice</p>
              <p className="text-[10px] text-rose-200 mt-0.5">{cameraError}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={startCamera}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] font-orbitron cursor-pointer transition-all shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                >
                  Retry Hardware Camera
                </button>
                <button
                  onClick={startVirtualCamera}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] font-orbitron cursor-pointer transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)] flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use Virtual Tactical Feed</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video & Canvas Viewport */}
        {!isMinimized && (
          <div className="relative rounded-lg overflow-hidden bg-black/95 border border-cyan-500/30 aspect-video flex items-center justify-center">
            {/* Always-mounted dock video element (prevents ref detachment) */}
            <video
              ref={(el) => {
                dockVideoRef.current = el;
                if (el && streamRef.current) attachStreamToVideo(el);
              }}
              playsInline
              muted
              autoPlay
              onLoadedMetadata={() => {
                if (dockVideoRef.current) dockVideoRef.current.play().catch(() => {});
              }}
              className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* Glowing HUD Canvas */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${cameraActive ? 'block' : 'hidden'}`}
            />

            {cameraActive ? (
              <>
                {/* Live Gesture Detection Telemetry Badge */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  <div className="px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-cyan-400/50 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                    <Hand className="w-3 h-3 text-cyan-400" />
                    <span>FINGERS:</span>
                    <strong className="text-white text-xs font-orbitron">{openFingersCount}</strong>
                    <span className="text-[9px] text-slate-400">({handedness})</span>
                  </div>

                  {targetActionName && (
                    <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono text-white animate-pulse shadow-[0_0_12px_rgba(0,240,255,0.5)]">
                      TARGET: <strong>{targetActionName}</strong>
                    </div>
                  )}

                  {isVirtualCamera && (
                    <div className="px-2 py-0.5 rounded bg-purple-950/90 border border-purple-400 text-[9px] font-mono text-purple-200">
                      VIRTUAL TACTICAL FEED ACTIVE
                    </div>
                  )}
                </div>

                {/* Floating Controls inside video */}
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                  {onOpenCameraFull && (
                    <button
                      onClick={onOpenCameraFull}
                      title="Expand to Full Viewport"
                      className="px-2 py-1 rounded-md bg-black/80 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Maximize</span>
                    </button>
                  )}
                  <button
                    onClick={() => stopCamera(false)}
                    title="Shut down camera stream & turn off webcam hardware"
                    className="px-2 py-1 rounded-md bg-rose-950/90 hover:bg-rose-600 border border-rose-500 text-rose-200 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-[0_0_10px_rgba(244,63,94,0.5)] cursor-pointer"
                  >
                    <CameraOff className="w-3 h-3 text-rose-400" />
                    <span>Turn Off</span>
                  </button>
                </div>

                {/* Virtual Camera Gesture Control Bar */}
                {isVirtualCamera && (
                  <div className="absolute top-10 inset-x-2 z-15 flex items-center justify-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-purple-500/30 text-[9px] font-mono">
                    <span className="text-purple-300 font-bold px-1">SIM:</span>
                    {(['AUTO', 5, 4, 3, 0] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setVirtualGestureTarget(t)}
                        className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          virtualGestureTarget === t
                            ? 'bg-purple-600 border-purple-400 text-white font-bold'
                            : 'bg-black/50 border-purple-500/30 text-purple-300 hover:bg-purple-950'
                        }`}
                      >
                        {t === 'AUTO' ? 'CYCLE' : `${t} FINGERS`}
                      </button>
                    ))}
                    <button
                      onClick={startCamera}
                      title="Switch to hardware webcam"
                      className="ml-2 px-2 py-0.5 rounded bg-cyan-900 border border-cyan-400 text-cyan-200 font-bold text-[8px] hover:bg-cyan-700 cursor-pointer"
                    >
                      USE REAL CAM
                    </button>
                  </div>
                )}

                {/* Action Progress Bar when holding gesture */}
                {actionProgress > 0 && (
                  <div className="absolute bottom-3 inset-x-4 z-20 bg-black/90 backdrop-blur-md p-2 rounded-lg border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.6)]">
                    <div className="flex justify-between text-[10px] font-mono text-cyan-200 mb-1">
                      <span>HOLDING GESTURE FOR ACTION:</span>
                      <strong className="text-white font-bold">{actionProgress}%</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/40">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_#00f0ff] transition-all duration-75"
                        style={{ width: `${actionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Cooldown Indicator */}
                {actionCooldown > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-amber-400/50 text-[9px] text-amber-300 font-mono">
                    COOLDOWN: {actionCooldown}s
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-cyan-400 mx-auto opacity-70 animate-pulse" />
                <div>
                  <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                    CAMERA ACCESS STANDBY
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Allow camera access to capture your hand movements and trigger voice &amp; HUD actions via gestures. You can turn off the camera anytime after using it.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-orbitron tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    START CAMERA &amp; ENABLE TRACKING
                  </button>
                  <button
                    onClick={startVirtualCamera}
                    className="px-3.5 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-600 border border-purple-500/50 text-purple-300 hover:text-white font-bold text-xs font-orbitron flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    TEST WITH VIRTUAL FEED
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INDIVIDUAL FINGERS REAL-TIME TELEMETRY */}
        {cameraActive && (
          <div className="mt-2 p-1.5 rounded-lg bg-black/60 border border-cyan-500/20 text-[9px] font-mono">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span>INDIVIDUAL FINGER SENSORS:</span>
              <span className="text-cyan-300 font-bold">{trackingEngine}</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { name: 'THUMB', key: 'thumb' as const, emoji: '👍' },
                { name: 'INDEX', key: 'index' as const, emoji: '☝️' },
                { name: 'MIDDLE', key: 'middle' as const, emoji: '🖕' },
                { name: 'RING', key: 'ring' as const, emoji: '💍' },
                { name: 'PINKY', key: 'pinky' as const, emoji: '🤙' },
              ].map((f) => {
                const isOpen = fingersState[f.key];
                return (
                  <div
                    key={f.key}
                    className={`py-1 px-0.5 rounded border transition-all ${
                      isOpen
                        ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'border-slate-800 bg-black/40 text-slate-500'
                    }`}
                  >
                    <div>{f.emoji}</div>
                    <div className="font-bold text-[8px] mt-0.5">{f.name}</div>
                    <div className={`text-[8px] font-bold ${isOpen ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {isOpen ? 'OPEN' : 'TUCKED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gesture Reference & Action Triggers Guide */}
        <div className="mt-2.5 pt-2 border-t border-cyan-500/20 text-[10px]">
          <div className="text-[9px] font-mono text-cyan-400 mb-1.5 flex items-center justify-between">
            <span>CONFIGURED HAND GESTURE RULES (ANY HAND):</span>
            {lastExecutedAction && (
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {lastExecutedAction}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono">
            {/* Rule 1: 5 Fingers -> Open Camera */}
            <div
              onClick={() => executeGestureAction('OPEN_CAMERA')}
              title="Click or show 5 fingers to trigger"
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                openFingersCount === 5
                  ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_12px_rgba(0,240,255,0.4)] text-white scale-105'
                  : 'border-cyan-500/30 bg-black/50 text-slate-300 hover:border-cyan-400'
              }`}
            >
              <div className="text-xs font-bold text-cyan-300">🖐️ 5 FINGERS</div>
              <div className="text-[9px] text-slate-400 mt-0.5">OPEN CAMERA</div>
              <div className="text-[8px] text-cyan-400/80 mt-0.5 font-bold">[TEST CLICK]</div>
            </div>

            {/* Rule 2: 4 Fingers -> Open New Tab */}
            <div
              onClick={() => executeGestureAction('OPEN_NEW_TAB')}
              title="Click or show 4 fingers to trigger"
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                openFingersCount === 4
                  ? 'border-amber-400 bg-amber-950/80 shadow-[0_0_12px_rgba(245,158,11,0.4)] text-white scale-105'
                  : 'border-cyan-500/30 bg-black/50 text-slate-300 hover:border-amber-400'
              }`}
            >
              <div className="text-xs font-bold text-amber-300">✌️✌️ 4 FINGERS</div>
              <div className="text-[9px] text-slate-400 mt-0.5">OPEN NEW TAB</div>
              <div className="text-[8px] text-amber-400/80 mt-0.5 font-bold">[TEST CLICK]</div>
            </div>

            {/* Rule 3: 3 Fingers -> Open YouTube */}
            <div
              onClick={() => executeGestureAction('OPEN_YOUTUBE')}
              title="Click or show 3 fingers to trigger"
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                openFingersCount === 3
                  ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_12px_rgba(16,185,129,0.4)] text-white scale-105'
                  : 'border-cyan-500/30 bg-black/50 text-slate-300 hover:border-emerald-400'
              }`}
            >
              <div className="text-xs font-bold text-emerald-300">🤟 3 FINGERS</div>
              <div className="text-[9px] text-slate-400 mt-0.5">OPEN YOUTUBE</div>
              <div className="text-[8px] text-emerald-400/80 mt-0.5 font-bold">[TEST CLICK]</div>
            </div>

            {/* Rule 4: 0 Fingers / Fist -> Turn Camera Off */}
            <div
              onClick={() => executeGestureAction('CLOSE_CAMERA')}
              title="Click or hold a closed fist to turn off the camera"
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                openFingersCount === 0 && cameraActive
                  ? 'border-rose-400 bg-rose-950/80 shadow-[0_0_12px_rgba(244,63,94,0.4)] text-white scale-105'
                  : 'border-rose-500/30 bg-black/50 text-slate-300 hover:border-rose-400'
              }`}
            >
              <div className="text-xs font-bold text-rose-300">✊ 0 FINGERS (FIST)</div>
              <div className="text-[9px] text-rose-200 mt-0.5">CLOSE CAMERA</div>
              <div className="text-[8px] text-rose-400/80 mt-0.5 font-bold">[POWER OFF]</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-2 pt-1.5 text-[9px] text-slate-400 gap-2">
            <span>ENGINE: {trackingEngine}</span>
            <div className="flex items-center gap-2">
              {cameraActive ? (
                <button
                  onClick={() => stopCamera(false)}
                  className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-600 border border-rose-500 text-rose-200 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                >
                  <CameraOff className="w-3 h-3 text-rose-400" />
                  <span>Turn Camera Off (Release Hardware)</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-500 hover:text-black border border-cyan-400 text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>Turn Camera On</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN MAXIMIZED CAMERA HUD MODAL (Triggered by 5 fingers or UI button) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-4xl w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col max-h-[90vh]">
            <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/40 pb-2 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <Camera className={`w-5 h-5 ${cameraActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-orbitron font-bold text-sm text-white tracking-wider">
                  OPTICAL SENSORS FULL VIEWPORT // STARK VISION HUD
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  cameraActive
                    ? isVirtualCamera
                      ? 'bg-purple-950 border border-purple-500/50 text-purple-300'
                      : 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950 border border-rose-500/50 text-rose-300'
                }`}>
                  {cameraActive
                    ? isVirtualCamera
                      ? '● VIRTUAL OPTICAL FEED ACTIVE'
                      : '● HARDWARE WEBCAM LIVE'
                    : '○ CAMERA OFFLINE'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cameraActive && (
                  <button
                    onClick={handleFullCameraShutdown}
                    title="Stop camera video stream, release webcam device, and turn off webcam LED"
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>POWER OFF CAMERA &amp; CLOSE</span>
                  </button>
                )}
                <button
                  onClick={onCloseCameraModal}
                  title="Close viewport but keep hand gesture tracking running in cockpit dock"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer flex items-center gap-1"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Minimize to Cockpit</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-cyan-500/40 flex-1 flex items-center justify-center">
              {/* Modal Video Element */}
              <video
                ref={(el) => {
                  modalVideoRef.current = el;
                  if (el && streamRef.current) attachStreamToVideo(el);
                }}
                playsInline
                muted
                autoPlay
                onLoadedMetadata={() => {
                  if (modalVideoRef.current) modalVideoRef.current.play().catch(() => {});
                }}
                className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Modal HUD Reticles Canvas */}
              <canvas
                ref={modalCanvasRef}
                className={`absolute inset-0 w-full h-full pointer-events-none ${cameraActive ? 'block' : 'hidden'}`}
              />

              {cameraActive ? (
                <>
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-cyan-950/10 to-black/60" />

                  {/* Left HUD Telemetry Box */}
                  <div className="absolute top-4 left-4 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/40 text-xs font-mono text-cyan-300 space-y-1 z-10 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <div>OPTICAL FEED: 1080P // 60 FPS</div>
                    <div>ACTIVE GESTURE: {currentGesture}</div>
                    <div className="flex items-center gap-1">
                      <span>OPEN FINGERS:</span>
                      <strong className="text-white text-sm font-orbitron">{openFingersCount}</strong>
                    </div>
                    <div>HANDEDNESS: {handedness}</div>
                    <div>TRACKING ENGINE: {trackingEngine}</div>
                  </div>

                  {/* Top Right Quick Power Off Button */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    {isVirtualCamera ? (
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-400 text-xs font-orbitron font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SWITCH TO REAL WEBCAM</span>
                      </button>
                    ) : (
                      <button
                        onClick={startVirtualCamera}
                        className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-400 text-xs font-orbitron font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>SWITCH TO VIRTUAL FEED</span>
                      </button>
                    )}
                    <button
                      onClick={handleFullCameraShutdown}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500 text-xs font-orbitron font-bold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>TURN OFF CAMERA</span>
                    </button>
                  </div>

                  {/* Bottom Action Progress Display */}
                  {actionProgress > 0 && (
                    <div className="absolute bottom-6 inset-x-8 z-20 bg-black/90 backdrop-blur-md p-3 rounded-xl border border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.7)]">
                      <div className="flex justify-between text-xs font-mono text-cyan-200 mb-1.5">
                        <span className="font-bold">ENGAGING TARGET ACTION: {targetActionName}</span>
                        <strong className="text-white font-bold">{actionProgress}%</strong>
                      </div>
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/50">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-white shadow-[0_0_15px_#00f0ff] transition-all duration-75"
                          style={{ width: `${actionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <CameraOff className="w-14 h-14 text-slate-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-orbitron font-bold text-white">
                      CAMERA STREAM IS OFFLINE
                    </h3>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                      Webcam hardware is currently disconnected and power down. Activate to start optical hand gesture detection.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-orbitron tracking-wider cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ACTIVATE WEBCAM</span>
                    </button>
                    <button
                      onClick={startVirtualCamera}
                      className="px-4 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-600 border border-purple-500 text-purple-200 hover:text-white font-bold text-xs font-orbitron cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>START VIRTUAL FEED</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-cyan-500/30 flex flex-wrap items-center justify-between text-xs mt-3 gap-2">
              <span className="text-slate-400 text-[11px] font-mono">
                Hold <strong>4 fingers</strong> for New Tab, <strong>3 fingers</strong> for YouTube, or <strong>✊ (Fist)</strong> to power down camera.
              </span>
              <div className="flex items-center gap-2">
                {cameraActive ? (
                  <button
                    onClick={handleFullCameraShutdown}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-orbitron font-bold text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.5)] cursor-pointer"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>SHUT DOWN CAMERA &amp; RELEASE HARDWARE</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ACTIVATE CAMERA</span>
                  </button>
                )}
                <button
                  onClick={onCloseCameraModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-orbitron text-xs cursor-pointer"
                >
                  Return to Cockpit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOLOGRAPHIC MODAL: NEW TAB LAUNCHED (Triggered by 4 fingers) */}
      {activeOverlayModal === 'NEW_TAB' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full hud-panel rounded-2xl p-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="font-orbitron font-bold text-xs text-white">
                  NEW BROWSER TAB PROTOCOL // 4 FINGERS DETECTED
                </span>
              </div>
              <button
                onClick={() => setActiveOverlayModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
                <p className="font-bold">Tab Launch Signal Sent!</p>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  A new browser tab was launched. If your browser popup blocker prevented automated opening in this frame, use the direct links below:
                </p>
              </div>

              <div className="space-y-1.5">
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 rounded-lg bg-black/70 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Open Google Search
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 rounded-lg bg-black/70 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Open GitHub Mainframe
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="about:blank"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 rounded-lg bg-black/70 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Open Blank Tactical Workspace
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end mt-2">
              <button
                onClick={() => setActiveOverlayModal(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOLOGRAPHIC MODAL: YOUTUBE PLAYER & SEARCH (Triggered by 3 fingers) */}
      {activeOverlayModal === 'YOUTUBE' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full hud-panel rounded-2xl p-4 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-500/40 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-emerald-400" />
                <span className="font-orbitron font-bold text-xs text-white">
                  YOUTUBE TACTICAL FEED // 3 FINGERS DETECTED
                </span>
              </div>
              <button
                onClick={() => setActiveOverlayModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <span>YouTube stream initiated via 3-finger hand gesture.</span>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-emerald-500 text-black font-bold flex items-center gap-1 hover:bg-emerald-400 transition-colors"
                >
                  <span>Launch on YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Quick Search Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={youtubeSearchQuery}
                    onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                    placeholder="Search tactical audio / YouTube video..."
                    className="w-full bg-black/80 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white pl-8 focus:outline-none focus:border-emerald-400"
                  />
                  <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Search
                </a>
              </div>

              {/* Embedded Holographic Video Player */}
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/40 bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end mt-2">
              <button
                onClick={() => setActiveOverlayModal(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer"
              >
                Close Tactical Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
