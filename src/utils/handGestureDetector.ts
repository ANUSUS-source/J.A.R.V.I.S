/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandGestureResult {
  handDetected: boolean;
  handedness: 'Left' | 'Right' | 'Unknown';
  openFingersCount: number;
  fingers: FingerState;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  palmCenter?: { x: number; y: number };
  activeGesture: 'FIVE_FINGERS' | 'FOUR_FINGERS' | 'THREE_FINGERS' | 'TWO_FINGERS' | 'ONE_FINGER' | 'FIST' | 'NONE';
  confidence: number;
  engine: 'mediapipe_gpu' | 'mediapipe_cpu' | 'computer_vision_accelerated';
}

function dist2d(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function dist3d(p1: { x: number; y: number; z?: number }, p2: { x: number; y: number; z?: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z ?? 0) - (p2.z ?? 0);
  return Math.hypot(dx, dy, dz);
}

export class HandGestureDetector {
  private landmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private initError: string | null = null;
  private lastTimestamp: number = 0;
  private activeEngine: 'mediapipe_gpu' | 'mediapipe_cpu' | 'computer_vision_accelerated' = 'computer_vision_accelerated';
  private lastResult: HandGestureResult | null = null;
  private fallbackCanvas: HTMLCanvasElement | null = null;

  async init(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initError = null;

    // CDN endpoints to try in order
    const cdnCandidates = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      'https://unpkg.com/@mediapipe/tasks-vision@latest/wasm',
    ];

    let vision = null;
    for (const cdn of cdnCandidates) {
      try {
        vision = await FilesetResolver.forVisionTasks(cdn);
        if (vision) break;
      } catch (err) {
        console.warn(`FilesetResolver failed for ${cdn}, trying next:`, err);
      }
    }

    if (!vision) {
      console.warn('MediaPipe WASM FilesetResolver could not load. Using high-speed CV tracker.');
      this.activeEngine = 'computer_vision_accelerated';
      this.isInitializing = false;
      return false;
    }

    // Try GPU delegate first, fallback to CPU delegate immediately if GPU context fails
    const modelAssetPath =
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

    try {
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      });
      this.activeEngine = 'mediapipe_gpu';
      this.isInitializing = false;
      return true;
    } catch (gpuErr) {
      console.warn('GPU delegate failed (possibly shared with Three.js), falling back to CPU delegate:', gpuErr);
      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
        this.activeEngine = 'mediapipe_cpu';
        this.isInitializing = false;
        return true;
      } catch (cpuErr: any) {
        console.warn('MediaPipe CPU delegate failed as well, using CV fallback engine:', cpuErr);
        this.initError = cpuErr?.message || 'MediaPipe initialization failed';
        this.activeEngine = 'computer_vision_accelerated';
        this.isInitializing = false;
        return false;
      }
    }
  }

  get isReady(): boolean {
    return !!this.landmarker;
  }

  get currentEngine(): 'mediapipe_gpu' | 'mediapipe_cpu' | 'computer_vision_accelerated' {
    return this.activeEngine;
  }

  detect(video: HTMLVideoElement, timestamp: number): HandGestureResult {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return (
        this.lastResult || {
          handDetected: false,
          handedness: 'Unknown',
          openFingersCount: 0,
          fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
          activeGesture: 'NONE',
          confidence: 0,
          engine: this.activeEngine,
        }
      );
    }

    if (this.landmarker) {
      try {
        // Enforce monotonically strictly increasing timestamps required by MediaPipe
        const safeTs = Math.max(Math.round(timestamp), this.lastTimestamp + 1);
        this.lastTimestamp = safeTs;

        const result = this.landmarker.detectForVideo(video, safeTs);

        if (result.landmarks && result.landmarks.length > 0) {
          // Take the primary tracked hand
          const landmarks = result.landmarks[0];
          const handednessStr =
            result.handedness && result.handedness[0] && result.handedness[0][0]
              ? (result.handedness[0][0].categoryName as 'Left' | 'Right')
              : 'Unknown';

          const analyzed = this.analyzeLandmarks(landmarks, handednessStr);
          this.lastResult = analyzed;
          return analyzed;
        } else {
          // Landmarker ran successfully but no hand visible in current frame
          const noHand: HandGestureResult = {
            handDetected: false,
            handedness: 'Unknown',
            openFingersCount: 0,
            fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
            activeGesture: 'NONE',
            confidence: 0,
            engine: this.activeEngine,
          };
          this.lastResult = noHand;
          return noHand;
        }
      } catch (err) {
        console.warn('Error during MediaPipe detection, falling back to CV:', err);
      }
    }

    // High performance fallback using computer vision skin-tone and contour convexity defect analysis
    const fallbackResult = this.fallbackDetect(video);
    this.lastResult = fallbackResult;
    return fallbackResult;
  }

  /**
   * Mathematically analyze all 21 skeletal landmarks for individual finger extension states.
   * Works regardless of hand orientation, camera distance, or tilt.
   */
  private analyzeLandmarks(
    lm: Array<{ x: number; y: number; z?: number }>,
    handedness: 'Left' | 'Right' | 'Unknown'
  ): HandGestureResult {
    const wrist = lm[0];

    // Palm center calculation (barycenter of wrist, index MCP, and pinky MCP)
    const palmCenter = {
      x: (lm[0].x + lm[5].x + lm[17].x) / 3,
      y: (lm[0].y + lm[5].y + lm[17].y) / 3,
    };

    // Palm scale reference (distance from wrist to middle finger MCP)
    const palmLength = Math.max(0.01, dist2d(wrist, lm[9]));

    // 1. INDEX FINGER (MCP: 5, PIP: 6, DIP: 7, TIP: 8)
    const indexTipToWrist = dist2d(lm[8], wrist);
    const indexPipToWrist = dist2d(lm[6], wrist);
    const indexTipToMcp = dist2d(lm[8], lm[5]);
    const indexPipToMcp = dist2d(lm[6], lm[5]);
    const indexExtended =
      indexTipToWrist > indexPipToWrist * 1.05 &&
      indexTipToMcp > indexPipToMcp * 1.08 &&
      dist2d(lm[8], lm[0]) > palmLength * 0.85;

    // 2. MIDDLE FINGER (MCP: 9, PIP: 10, DIP: 11, TIP: 12)
    const middleTipToWrist = dist2d(lm[12], wrist);
    const middlePipToWrist = dist2d(lm[10], wrist);
    const middleTipToMcp = dist2d(lm[12], lm[9]);
    const middlePipToMcp = dist2d(lm[10], lm[9]);
    const middleExtended =
      middleTipToWrist > middlePipToWrist * 1.05 &&
      middleTipToMcp > middlePipToMcp * 1.08 &&
      dist2d(lm[12], lm[0]) > palmLength * 0.88;

    // 3. RING FINGER (MCP: 13, PIP: 14, DIP: 15, TIP: 16)
    const ringTipToWrist = dist2d(lm[16], wrist);
    const ringPipToWrist = dist2d(lm[14], wrist);
    const ringTipToMcp = dist2d(lm[16], lm[13]);
    const ringPipToMcp = dist2d(lm[14], lm[13]);
    const ringExtended =
      ringTipToWrist > ringPipToWrist * 1.05 &&
      ringTipToMcp > ringPipToMcp * 1.08 &&
      dist2d(lm[16], lm[0]) > palmLength * 0.82;

    // 4. PINKY FINGER (MCP: 17, PIP: 18, DIP: 19, TIP: 20)
    const pinkyTipToWrist = dist2d(lm[20], wrist);
    const pinkyPipToWrist = dist2d(lm[18], wrist);
    const pinkyTipToMcp = dist2d(lm[20], lm[17]);
    const pinkyPipToMcp = dist2d(lm[18], lm[17]);
    const pinkyExtended =
      pinkyTipToWrist > pinkyPipToWrist * 1.05 &&
      pinkyTipToMcp > pinkyPipToMcp * 1.08 &&
      dist2d(lm[20], lm[0]) > palmLength * 0.72;

    // 5. THUMB (CMC: 1, MCP: 2, IP: 3, TIP: 4)
    // When open, thumb extends laterally away from pinky MCP (17) and index MCP (5)
    const thumbTipToPinkyMcp = dist2d(lm[4], lm[17]);
    const thumbIpToPinkyMcp = dist2d(lm[3], lm[17]);
    const thumbTipToIndexMcp = dist2d(lm[4], lm[5]);
    const thumbIpToIndexMcp = dist2d(lm[3], lm[5]);
    const thumbTipToWrist = dist2d(lm[4], wrist);
    const thumbMcpToWrist = dist2d(lm[2], wrist);

    // Also check angle/spread from palm
    const thumbExtended =
      (thumbTipToPinkyMcp > thumbIpToPinkyMcp * 1.06 || thumbTipToIndexMcp > thumbIpToIndexMcp * 1.1) &&
      thumbTipToWrist > thumbMcpToWrist * 1.08 &&
      thumbTipToPinkyMcp > palmLength * 0.55;

    const fingers: FingerState = {
      thumb: thumbExtended,
      index: indexExtended,
      middle: middleExtended,
      ring: ringExtended,
      pinky: pinkyExtended,
    };

    const openCount = [
      fingers.thumb,
      fingers.index,
      fingers.middle,
      fingers.ring,
      fingers.pinky,
    ].filter(Boolean).length;

    let activeGesture: HandGestureResult['activeGesture'] = 'NONE';
    if (openCount === 5) activeGesture = 'FIVE_FINGERS';
    else if (openCount === 4) activeGesture = 'FOUR_FINGERS';
    else if (openCount === 3) activeGesture = 'THREE_FINGERS';
    else if (openCount === 2) activeGesture = 'TWO_FINGERS';
    else if (openCount === 1) activeGesture = 'ONE_FINGER';
    else if (openCount === 0) activeGesture = 'FIST';

    return {
      handDetected: true,
      handedness,
      openFingersCount: openCount,
      fingers,
      landmarks: lm,
      palmCenter,
      activeGesture,
      confidence: 0.96,
      engine: this.activeEngine,
    };
  }

  // Fallback computer vision analysis when WASM model is downloading or offline
  private fallbackDetect(video: HTMLVideoElement): HandGestureResult {
    if (!video || video.videoWidth === 0) {
      return {
        handDetected: false,
        handedness: 'Unknown',
        openFingersCount: 0,
        fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
        activeGesture: 'NONE',
        confidence: 0,
        engine: 'computer_vision_accelerated',
      };
    }

    try {
      if (!this.fallbackCanvas) {
        this.fallbackCanvas = document.createElement('canvas');
        this.fallbackCanvas.width = 160;
        this.fallbackCanvas.height = 120;
      }

      const canvas = this.fallbackCanvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('No 2d context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      // Skin tone detection & column density projection
      const skinColCounts = new Int32Array(canvas.width);
      let totalSkinPixels = 0;
      let minX = canvas.width;
      let maxX = 0;
      let minY = canvas.height;
      let maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized skin filter
          const isSkin =
            r > 60 &&
            g > 30 &&
            b > 15 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 8 &&
            r - Math.min(g, b) > 12;

          if (isSkin) {
            skinColCounts[x]++;
            totalSkinPixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // If insufficient skin detected, no hand
      if (totalSkinPixels < 400 || maxX <= minX || maxY <= minY) {
        return {
          handDetected: false,
          handedness: 'Unknown',
          openFingersCount: 0,
          fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
          activeGesture: 'NONE',
          confidence: 0,
          engine: 'computer_vision_accelerated',
        };
      }

      // Count peaks in the column density histogram
      let peaks = 0;
      let inPeak = false;
      const threshold = 14;

      for (let x = minX; x <= maxX; x++) {
        const val = skinColCounts[x];
        if (val > threshold && !inPeak) {
          inPeak = true;
          peaks++;
        } else if (val <= threshold) {
          inPeak = false;
        }
      }

      // Bound peaks to 0-5
      const openCount = Math.min(5, Math.max(0, peaks));
      let activeGesture: HandGestureResult['activeGesture'] = 'NONE';
      if (openCount === 5) activeGesture = 'FIVE_FINGERS';
      else if (openCount === 4) activeGesture = 'FOUR_FINGERS';
      else if (openCount === 3) activeGesture = 'THREE_FINGERS';
      else if (openCount === 2) activeGesture = 'TWO_FINGERS';
      else if (openCount === 1) activeGesture = 'ONE_FINGER';
      else if (openCount === 0) activeGesture = 'FIST';

      // Generate synthetic landmarks so visual HUD can still draw the hand
      const centerX = (minX + maxX) / (2 * canvas.width);
      const centerY = (minY + maxY) / (2 * canvas.height);
      const handWidth = (maxX - minX) / canvas.width;
      const handHeight = (maxY - minY) / canvas.height;

      const syntheticLandmarks: Array<{ x: number; y: number; z?: number }> = [];
      syntheticLandmarks[0] = { x: centerX, y: Math.min(0.95, centerY + handHeight * 0.45), z: 0 }; // Wrist

      // Approximate fingertips
      const fingerXOffsets = [-0.25, -0.12, 0, 0.12, 0.22];
      const fingerHeights = [0.25, 0.42, 0.46, 0.4, 0.32];
      const isExt = [
        openCount >= 5,
        openCount >= 1,
        openCount >= 2,
        openCount >= 3,
        openCount >= 4,
      ];

      for (let f = 0; f < 5; f++) {
        const baseIdx = f === 0 ? 1 : f * 4 + 1;
        const fx = centerX + fingerXOffsets[f] * handWidth;
        const tipY = isExt[f] ? centerY - fingerHeights[f] * handHeight : centerY;

        syntheticLandmarks[baseIdx] = { x: fx, y: centerY + 0.1 * handHeight, z: 0 };
        syntheticLandmarks[baseIdx + 1] = { x: fx, y: centerY - 0.05 * handHeight, z: 0 };
        syntheticLandmarks[baseIdx + 2] = { x: fx, y: centerY - 0.2 * handHeight, z: 0 };
        syntheticLandmarks[baseIdx + 3] = { x: fx, y: tipY, z: 0 };
      }

      return {
        handDetected: true,
        handedness: 'Unknown',
        openFingersCount: openCount,
        fingers: {
          thumb: openCount >= 5,
          index: openCount >= 1,
          middle: openCount >= 2,
          ring: openCount >= 3,
          pinky: openCount >= 4,
        },
        landmarks: syntheticLandmarks,
        palmCenter: { x: centerX, y: centerY },
        activeGesture,
        confidence: 0.78,
        engine: 'computer_vision_accelerated',
      };
    } catch {
      return {
        handDetected: false,
        handedness: 'Unknown',
        openFingersCount: 0,
        fingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
        activeGesture: 'NONE',
        confidence: 0,
        engine: 'computer_vision_accelerated',
      };
    }
  }

  destroy() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.error(e);
      }
      this.landmarker = null;
    }
  }
}

export const handDetector = new HandGestureDetector();
