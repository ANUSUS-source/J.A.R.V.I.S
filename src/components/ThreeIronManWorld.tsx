/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { soundFx } from '../utils/audioEffects';
import { jarvisVoice } from '../utils/speechEngine';
import {
  Sparkles,
  Zap,
  Layers,
  RotateCcw,
  Eye,
  Maximize2,
  Minimize2,
  Sliders,
  Upload,
  Palette,
  Crosshair,
  Compass,
  Shield,
  Cpu,
  Check,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export type HologramPresetId =
  | 'mark-iii'
  | 'mark-lxxxv'
  | 'hulkbuster'
  | 'arc-core'
  | 'war-machine'
  | 'custom';

export interface HologramPreset {
  id: HologramPresetId;
  name: string;
  subtitle: string;
  colorHex: number;
  colorName: string;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'crimson';
  description: string;
}

export const HOLOGRAM_PRESETS: HologramPreset[] = [
  {
    id: 'mark-iii',
    name: 'MARK III // FLIGHT CORE',
    subtitle: 'Classic Titanium-Gold Armor',
    colorHex: 0x00f0ff,
    colorName: 'Stark Cyan',
    themeColor: 'cyan',
    description: 'Hot-rod red and gold titanium alloy armor with dual palm repulsors and chest RT unibeam.',
  },
  {
    id: 'mark-lxxxv',
    name: 'MARK LXXXV // NANO-TECH',
    subtitle: 'Quantum Nanoparticle Lattice',
    colorHex: 0xffb703,
    colorName: 'Mark 85 Gold',
    themeColor: 'amber',
    description: 'Advanced nanotech armor with instantaneous morphing shields and high-energy particle conduits.',
  },
  {
    id: 'hulkbuster',
    name: 'HULKBUSTER // MK XLIV',
    subtitle: 'Heavy Orbital Drop Armor',
    colorHex: 0xf43f5e,
    colorName: 'Crimson Overdrive',
    themeColor: 'crimson',
    description: 'Veronica orbital kinetic frame with reinforced pneumatic servos and quad-arc reactor array.',
  },
  {
    id: 'arc-core',
    name: 'ARC REACTOR // MK-I CORE',
    subtitle: 'Palladium / Synthesized Element',
    colorHex: 0x00f0ff,
    colorName: 'Arc Blue',
    themeColor: 'cyan',
    description: 'Tony Stark blueprint schematics with 10 electromagnetic coils and clean energy flux.',
  },
  {
    id: 'war-machine',
    name: 'WAR MACHINE // TACTICAL',
    subtitle: 'Heavy Ballistic Armor',
    colorHex: 0x94a3b8,
    colorName: 'Gunmetal Silver',
    themeColor: 'cyan',
    description: 'Military-spec titanium-carbon plating equipped with dual shoulder cannons and automated targeting.',
  },
];

interface ThreeIronManWorldProps {
  mode?: 'aside' | 'fullscreen';
  onClose?: () => void;
  onMaximize?: () => void;
  soundEnabled?: boolean;
  themeColor?: 'cyan' | 'amber' | 'emerald' | 'crimson';
  title?: string;
  activePresetId?: HologramPresetId;
  onPresetChange?: (preset: HologramPresetId) => void;
}

export const ThreeIronManWorld: React.FC<ThreeIronManWorldProps> = ({
  mode = 'aside',
  onClose,
  onMaximize,
  soundEnabled = true,
  themeColor = 'cyan',
  title = 'MARK III // 3D HOLOGRAPHIC WORLD',
  activePresetId = 'mark-iii',
  onPresetChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hologram active preset & custom image
  const [currentPreset, setCurrentPreset] = useState<HologramPresetId>(activePresetId);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string>('Custom Photo');
  const [isHologramModalOpen, setIsHologramModalOpen] = useState<boolean>(false);

  // 3D Visual Customization Controls
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [projectionMode, setProjectionMode] = useState<'RELIEF' | 'WIREFRAME' | 'POINTS'>('RELIEF');
  const [hologramColorTint, setHologramColorTint] = useState<number>(0x00f0ff);
  const [depthIntensity, setDepthIntensity] = useState<number>(1.8);
  const [repulsorActive, setRepulsorActive] = useState<boolean>(false);
  const [particlesActive, setParticlesActive] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.35);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(mode === 'aside');

  // Three.js dynamic objects ref
  const threeRefs = useRef<{
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    ironManMesh?: THREE.Mesh;
    frameLines?: THREE.LineSegments;
    particlePoints?: THREE.Points;
    palmLight?: THREE.PointLight;
    chestLight?: THREE.PointLight;
    chestRing?: THREE.Mesh;
    palmRing?: THREE.Mesh;
    worldGroup?: THREE.Group;
    textureLoader?: THREE.TextureLoader;
    activeTexture?: THREE.Texture;
  }>({});

  // Internal mutable animation refs
  const stateRef = useRef({
    wireframe: wireframeMode,
    projection: projectionMode,
    depth: depthIntensity,
    repulsor: repulsorActive,
    particles: particlesActive,
    rotSpeed: rotationSpeed,
    colorTint: hologramColorTint,
    targetRotX: 0,
    targetRotY: 0,
    surgeTime: 0,
  });

  // Keep stateRef synced
  useEffect(() => {
    stateRef.current.wireframe = wireframeMode;
    stateRef.current.projection = projectionMode;
    stateRef.current.depth = depthIntensity;
    stateRef.current.repulsor = repulsorActive;
    stateRef.current.particles = particlesActive;
    stateRef.current.rotSpeed = rotationSpeed;
    stateRef.current.colorTint = hologramColorTint;
  }, [wireframeMode, projectionMode, depthIntensity, repulsorActive, particlesActive, rotationSpeed, hologramColorTint]);

  // Sync with prop
  useEffect(() => {
    if (activePresetId && activePresetId !== currentPreset) {
      setCurrentPreset(activePresetId);
    }
  }, [activePresetId]);

  // Procedural canvas textures for different holograms
  const createProceduralTexture = useCallback((presetId: HologramPresetId): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stark cybernetic grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (presetId === 'hulkbuster') {
      // Heavy Hulkbuster schematic
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#f43f5e';

      // Massive chest outline
      ctx.beginPath();
      ctx.arc(512, 384, 220, 0, Math.PI * 2);
      ctx.stroke();

      // Outer heavy armor shoulders
      ctx.strokeRect(180, 200, 200, 300);
      ctx.strokeRect(644, 200, 200, 300);

      // Central quad reactor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(512, 384, 60, 0, Math.PI * 2);
      ctx.fill();

      // Gold hydraulic conduits
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 3;
      ctx.strokeRect(400, 150, 224, 70);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 32px "Orbitron", monospace';
      ctx.fillText('MARK XLIV // HULKBUSTER VERONICA', 220, 100);
      ctx.font = '20px "JetBrains Mono", monospace';
      ctx.fillText('HYDRAULIC PRESSURE: 42,000 PSI // ARMOR: COMPOSITE DENSE TITANIUM', 160, 720);
    } else if (presetId === 'mark-lxxxv') {
      // Nanotech quantum matrix
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';

      // Hexagonal nanotech mesh
      const hexRadius = 35;
      for (let y = 150; y < 650; y += hexRadius * 1.5) {
        for (let x = 200; x < 850; x += hexRadius * Math.sqrt(3)) {
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const angle = (a * Math.PI) / 3;
            const hx = x + hexRadius * Math.cos(angle);
            const hy = y + hexRadius * Math.sin(angle);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Glowing Nano Chest Core
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(512, 384, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb703';
      ctx.font = 'bold 32px "Orbitron", monospace';
      ctx.fillText('MARK LXXXV // QUANTUM NANO-LATTICE', 200, 90);
    } else if (presetId === 'arc-core') {
      // Arc Reactor Blueprint Schematics
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';

      // Concentric schematic circles
      for (const r of [80, 140, 200, 260, 320]) {
        ctx.lineWidth = r === 200 ? 5 : 2;
        ctx.beginPath();
        ctx.arc(512, 384, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 10 radial copper coil segments
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI * 2) / 10;
        const cx = 512 + Math.cos(ang) * 200;
        const cy = 384 + Math.sin(ang) * 200;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(-15, -35, 30, 70);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-15, -35, 30, 70);
        ctx.restore();
      }

      // Central triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(512, 320);
      ctx.lineTo(450, 430);
      ctx.lineTo(574, 430);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 32px "Orbitron", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('ARC REACTOR MK-I // TACTICAL BLUEPRINT', 180, 80);
      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillText('POWER OUTPUT: 3.2 GJ/SEC // CORE RESIDUAL: 0.003%', 260, 720);
    } else if (presetId === 'war-machine') {
      // War machine tactical ballistic armor
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#e2e8f0';

      // Heavy chest plate and shoulder cannon targeting reticles
      ctx.strokeRect(300, 200, 424, 380);
      ctx.strokeRect(160, 160, 120, 180);
      ctx.strokeRect(744, 160, 120, 180);

      // Targeting reticles
      ctx.beginPath();
      ctx.arc(220, 250, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(804, 250, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(512, 384, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 32px "Orbitron", monospace';
      ctx.fillText('WAR MACHINE // TACTICAL SPECIFICATION', 190, 90);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Switch active hologram
  const applyHologram = useCallback(
    (presetId: HologramPresetId, customUrl?: string) => {
      setCurrentPreset(presetId);
      if (onPresetChange) onPresetChange(presetId);

      const targetPreset = HOLOGRAM_PRESETS.find((p) => p.id === presetId);
      if (targetPreset) {
        setHologramColorTint(targetPreset.colorHex);
      }

      if (soundEnabled) {
        soundFx.playHologramPing();
        jarvisVoice.speak(
          presetId === 'custom'
            ? 'Custom hologram loaded into 3D world, sir.'
            : `${targetPreset?.name || 'Hologram'} selected.`
        );
      }

      const { ironManMesh, textureLoader, palmLight, chestLight, frameLines } = threeRefs.current;
      if (!ironManMesh) return;

      const mat = ironManMesh.material as THREE.MeshStandardMaterial;

      if (presetId === 'custom' && customUrl) {
        const loader = textureLoader || new THREE.TextureLoader();
        loader.load(customUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          mat.map = tex;
          mat.needsUpdate = true;
        });
      } else if (presetId === 'mark-iii') {
        const loader = textureLoader || new THREE.TextureLoader();
        loader.load('/iron-man-mark-iii.jpg', (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          mat.map = tex;
          mat.needsUpdate = true;
        });
      } else {
        const proceduralTex = createProceduralTexture(presetId);
        mat.map = proceduralTex;
        mat.needsUpdate = true;
      }

      // Update light colors
      const newColor = targetPreset ? targetPreset.colorHex : 0x00f0ff;
      if (palmLight) palmLight.color.setHex(newColor);
      if (chestLight) chestLight.color.setHex(newColor);
      if (frameLines) {
        (frameLines.material as THREE.LineBasicMaterial).color.setHex(newColor);
      }
    },
    [onPresetChange, soundEnabled, createProceduralTexture]
  );

  // Handle custom photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setCustomImageUrl(url);
      applyHologram('custom', url);
    };
    reader.readAsDataURL(file);
  };

  // Trigger interactive repulsor burst
  const handleRepulsorBurst = useCallback(() => {
    stateRef.current.surgeTime = 1.0;
    setRepulsorActive(true);
    if (soundEnabled) {
      soundFx.playArcReactorPowerUp();
      jarvisVoice.speak('Holographic repulsor discharge initiated.');
    }
    setTimeout(() => {
      setRepulsorActive(false);
    }, 1200);
  }, [soundEnabled]);

  // Main 3D Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020712, 0.035);
    threeRefs.current.scene = scene;

    // 2. Camera setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.6);
    threeRefs.current.camera = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);
    threeRefs.current.renderer = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0a2233, 1.2);
    scene.add(ambientLight);

    const cyanKeyLight = new THREE.DirectionalLight(0x00f0ff, 2.8);
    cyanKeyLight.position.set(3, 4, 4);
    scene.add(cyanKeyLight);

    const goldFillLight = new THREE.DirectionalLight(0xffb703, 1.8);
    goldFillLight.position.set(-3, -2, 3);
    scene.add(goldFillLight);

    const rimLight = new THREE.DirectionalLight(0xff2a5f, 2.0);
    rimLight.position.set(0, -4, -3);
    scene.add(rimLight);

    // Dynamic Repulsor point light
    const palmLight = new THREE.PointLight(0x00f0ff, 2.5, 6);
    palmLight.position.set(0.9, 0.5, 0.6);
    scene.add(palmLight);
    threeRefs.current.palmLight = palmLight;

    // Dynamic Chest Arc Reactor point light
    const chestLight = new THREE.PointLight(0x38bdf8, 3.0, 5);
    chestLight.position.set(-0.25, -0.6, 0.5);
    scene.add(chestLight);
    threeRefs.current.chestLight = chestLight;

    // 5. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    threeRefs.current.textureLoader = textureLoader;

    const initialTexture = textureLoader.load(
      customImageUrl || '/iron-man-mark-iii.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
      },
      undefined,
      (err) => console.warn('Texture load fallback:', err)
    );

    // Procedural Luminance / Depth map for 3D displacement
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = 512;
    depthCanvas.height = 512;
    const dctx = depthCanvas.getContext('2d');
    if (dctx) {
      const grad = dctx.createRadialGradient(256, 256, 30, 256, 256, 250);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#c0d0ff');
      grad.addColorStop(0.7, '#604080');
      grad.addColorStop(1, '#000000');
      dctx.fillStyle = grad;
      dctx.fillRect(0, 0, 512, 512);

      // Chest & Palm hot spots
      dctx.fillStyle = '#ffffff';
      dctx.beginPath();
      dctx.arc(200, 360, 45, 0, Math.PI * 2);
      dctx.fill();

      dctx.beginPath();
      dctx.arc(380, 200, 55, 0, Math.PI * 2);
      dctx.fill();
    }
    const proceduralDepthTexture = new THREE.CanvasTexture(depthCanvas);

    // Main 3D Holographic Relief Mesh
    const planeGeo = new THREE.PlaneGeometry(3.6, 2.2, 120, 80);
    const planeMat = new THREE.MeshStandardMaterial({
      map: initialTexture,
      displacementMap: proceduralDepthTexture,
      displacementScale: depthIntensity * 0.35,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: wireframeMode,
      side: THREE.DoubleSide,
    });

    const ironManMesh = new THREE.Mesh(planeGeo, planeMat);
    threeRefs.current.ironManMesh = ironManMesh;

    // Parent group for rotating 3D world
    const worldGroup = new THREE.Group();
    worldGroup.add(ironManMesh);
    scene.add(worldGroup);
    threeRefs.current.worldGroup = worldGroup;

    // 6. Holographic Chest Arc Reactor Glowing 3D Ring
    const chestRingGeo = new THREE.RingGeometry(0.12, 0.18, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const chestRing = new THREE.Mesh(chestRingGeo, glowMat);
    chestRing.position.set(-0.35, -0.62, 0.15);
    worldGroup.add(chestRing);
    threeRefs.current.chestRing = chestRing;

    // Secondary inner coil
    const chestInnerRingGeo = new THREE.RingGeometry(0.04, 0.09, 24);
    const chestInnerRing = new THREE.Mesh(
      chestInnerRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      })
    );
    chestInnerRing.position.set(-0.35, -0.62, 0.17);
    worldGroup.add(chestInnerRing);

    // 7. Holographic Palm Repulsor Node 3D Rings
    const palmRingGeo = new THREE.RingGeometry(0.14, 0.22, 32);
    const palmRing = new THREE.Mesh(
      palmRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    palmRing.position.set(0.85, 0.44, 0.2);
    worldGroup.add(palmRing);
    threeRefs.current.palmRing = palmRing;

    // 8. Cybernetic Wireframe HUD Border
    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.7, 2.3, 0.4));
    const frameMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
    });
    const frameLines = new THREE.LineSegments(frameGeo, frameMat);
    worldGroup.add(frameLines);
    threeRefs.current.frameLines = frameLines;

    // 9. Particle Cloud
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.01;
      particleVelocities[i * 3 + 1] = Math.random() * 0.015;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particlePoints);
    threeRefs.current.particlePoints = particlePoints;

    // 10. Mouse Tilt
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.targetRotY = x * 0.45;
      stateRef.current.targetRotX = -y * 0.35;
    };

    const handlePointerLeave = () => {
      stateRef.current.targetRotX = 0;
      stateRef.current.targetRotY = 0;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);

    // 11. Animation Tick Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth damped rotation
      worldGroup.rotation.y = THREE.MathUtils.damp(
        worldGroup.rotation.y,
        stateRef.current.targetRotY + Math.sin(time * stateRef.current.rotSpeed) * 0.08,
        5,
        delta
      );
      worldGroup.rotation.x = THREE.MathUtils.damp(
        worldGroup.rotation.x,
        stateRef.current.targetRotX + Math.cos(time * stateRef.current.rotSpeed) * 0.04,
        5,
        delta
      );

      // Sync material dynamic properties
      planeMat.wireframe = stateRef.current.wireframe;
      planeMat.displacementScale = stateRef.current.depth * 0.28;

      // Handle Repulsor surge animation
      if (stateRef.current.surgeTime > 0) {
        stateRef.current.surgeTime -= delta * 1.4;
        const pulse = Math.max(0, stateRef.current.surgeTime);
        palmLight.intensity = 2.5 + pulse * 14.0;
        palmLight.color.setHex(pulse > 0.5 ? 0xffffff : stateRef.current.colorTint);
        palmRing.scale.setScalar(1 + pulse * 0.6);
        chestLight.intensity = 3.0 + pulse * 8.0;
        chestRing.scale.setScalar(1 + pulse * 0.4);
      } else {
        const glowCycle = 0.5 + Math.sin(time * 3.5) * 0.25;
        palmLight.intensity = 2.0 + glowCycle * 2.0;
        chestLight.intensity = 2.5 + glowCycle * 1.8;
        chestRing.scale.setScalar(1.0 + Math.sin(time * 4) * 0.06);
        palmRing.scale.setScalar(1.0 + Math.cos(time * 4) * 0.06);
      }

      // Update particles
      if (stateRef.current.particles) {
        particlePoints.visible = true;
        const pos = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += particleVelocities[i * 3];
          pos[i * 3 + 1] += particleVelocities[i * 3 + 1];
          pos[i * 3 + 2] += particleVelocities[i * 3 + 2];

          if (pos[i * 3 + 1] > 2.0) pos[i * 3 + 1] = -2.0;
          if (pos[i * 3] > 2.5) pos[i * 3] = -2.5;
          if (pos[i * 3] < -2.5) pos[i * 3] = 2.5;
        }
        particleGeo.attributes.position.needsUpdate = true;
      } else {
        particlePoints.visible = false;
      }

      ironManMesh.position.z = Math.sin(time * 1.5) * 0.05;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    tick();

    // 12. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);

      planeGeo.dispose();
      planeMat.dispose();
      chestRingGeo.dispose();
      glowMat.dispose();
      chestInnerRingGeo.dispose();
      palmRingGeo.dispose();
      frameGeo.dispose();
      frameMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      initialTexture.dispose();
      proceduralDepthTexture.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative rounded-xl border overflow-hidden flex flex-col transition-all duration-300 ${
        mode === 'fullscreen'
          ? 'fixed inset-4 sm:inset-10 z-50 bg-black/95 shadow-[0_0_60px_rgba(0,240,255,0.5)] border-cyan-400'
          : 'w-full h-full min-h-[460px] bg-black/80 border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.2)]'
      }`}
    >
      {/* Hidden File Input for Custom Hologram Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md z-10 gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="font-orbitron font-bold text-xs text-white tracking-wider truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-400/50 text-cyan-200 uppercase">
            {currentPreset.replace('-', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* CHANGE HOLOGRAM BUTTON (Primary Request) */}
          <button
            onClick={() => {
              setIsHologramModalOpen(true);
              if (soundEnabled) soundFx.playClick();
            }}
            title="Open Hologram Library & Custom Photo Uploader"
            className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black hover:text-white text-[10px] font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>CHANGE HOLOGRAM</span>
          </button>

          {/* Quick Repulsor Blast Button */}
          <button
            onClick={handleRepulsorBurst}
            title="Fire Repulsor Discharge Blast"
            className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all shadow-[0_0_12px_rgba(0,240,255,0.5)] cursor-pointer"
          >
            <Zap className="w-3 h-3 fill-black" />
            <span>DISCHARGE</span>
          </button>

          {/* Toggle Fullscreen / Modal */}
          {onMaximize && (
            <button
              onClick={onMaximize}
              title={mode === 'fullscreen' ? 'Minimize view' : 'Maximize to full 3D World'}
              className="p-1 rounded bg-black/50 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-pointer"
            >
              {mode === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close 3D View"
              className="p-1 rounded bg-black/50 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Mount Point */}
      <div className="relative flex-1 w-full h-full min-h-[340px]">
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Live HUD Floating Telemetry Overlay */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1 text-[10px] font-mono text-cyan-300">
          <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-cyan-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>HOLOGRAM: {currentPreset.toUpperCase()}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-cyan-500/40 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>3D DEPTH RELIEF: {depthIntensity.toFixed(1)}X</span>
          </div>
        </div>

        {/* Floating Quick Hologram Selector Pills right on top of 3D Canvas */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-cyan-500/30">
          {HOLOGRAM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyHologram(preset.id)}
              title={`Switch to ${preset.name}`}
              className={`px-2 py-1 rounded text-[9px] font-orbitron transition-all cursor-pointer ${
                currentPreset === preset.id
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              {preset.id.replace('mark-', 'MK-').toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload your own photo as 3D Hologram"
            className={`px-2 py-1 rounded text-[9px] font-orbitron transition-all cursor-pointer flex items-center gap-1 ${
              currentPreset === 'custom'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'text-purple-300 hover:text-white bg-purple-950/40'
            }`}
          >
            <Upload className="w-2.5 h-2.5" />
            <span>UPLOAD</span>
          </button>
        </div>

        {/* Interactive Pointer Instruction Tip */}
        <div className="absolute bottom-3 right-3 pointer-events-none z-10">
          <div className="px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-cyan-500/40 text-[9px] font-mono text-cyan-400">
            DRAG MOUSE TO ROTATE 3D HOLOGRAM // CLICK CHANGE TO SWAP ARMOR
          </div>
        </div>
      </div>

      {/* Sleek Bottom Dock Controls */}
      <div className="border-t border-cyan-500/30 bg-black/90 p-2 z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
              className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{isControlsCollapsed ? 'Show 3D World Controls' : 'Hide Controls'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Wireframe toggle */}
            <button
              onClick={() => {
                setWireframeMode(!wireframeMode);
                if (soundEnabled) soundFx.playClick();
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-all ${
                wireframeMode
                  ? 'bg-cyan-500 text-black border-cyan-300 font-bold'
                  : 'bg-black/60 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {wireframeMode ? 'WIREFRAME: ON' : 'WIREFRAME: OFF'}
              </span>
            </button>

            {/* Particles toggle */}
            <button
              onClick={() => {
                setParticlesActive(!particlesActive);
                if (soundEnabled) soundFx.playClick();
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-all ${
                particlesActive
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                  : 'bg-black/60 text-slate-500 border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                PHOTON EMBER: {particlesActive ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Expanded Controls Drawer */}
        {!isControlsCollapsed && (
          <div className="mt-2 pt-2 border-t border-cyan-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>3D DISPLACEMENT DEPTH:</span>
                <span className="text-cyan-300 font-bold">{depthIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={depthIntensity}
                onChange={(e) => setDepthIntensity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>HOLOGRAM AMBIENT ROTATION:</span>
                <span className="text-cyan-300 font-bold">{(rotationSpeed * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* HOLOGRAM LIBRARY & CUSTOM PHOTO UPLOADER MODAL */}
      {isHologramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full hud-panel rounded-2xl p-4 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <span className="font-orbitron font-bold text-sm text-white">
                  TACTICAL HOLOGRAM DATABASE // STARK PROJECTION SELECTOR
                </span>
              </div>
              <button
                onClick={() => setIsHologramModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HOLOGRAM_PRESETS.map((preset) => {
                  const isSelected = currentPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyHologram(preset.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_20px_rgba(0,240,255,0.3)] ring-1 ring-cyan-300'
                          : 'border-cyan-500/30 bg-black/60 hover:border-cyan-400 hover:bg-cyan-950/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-orbitron font-bold text-xs text-white">{preset.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="text-[10px] text-cyan-300/80 font-mono font-bold mb-1">
                          {preset.subtitle}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[9px] font-mono">
                        <span className="text-slate-500">TINT: {preset.colorName}</span>
                        <span
                          className={`font-bold ${
                            isSelected ? 'text-cyan-300' : 'text-slate-400 hover:text-cyan-300'
                          }`}
                        >
                          {isSelected ? 'ACTIVE 3D PROJECTION' : 'SELECT HOLOGRAM'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Photo Uploader Box */}
              <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span className="font-orbitron font-bold text-xs text-white">
                      UPLOAD YOUR OWN PHOTO AS 3D HOLOGRAM
                    </span>
                  </div>
                  {currentPreset === 'custom' && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/30 border border-purple-400 text-purple-200">
                      CURRENTLY ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 font-mono mb-3">
                  Upload any picture from your device (PNG, JPG, WEBP). Jarvis will generate real-time 3D displacement depth relief and project your photo as a holographic suit or artifact.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>CHOOSE PHOTO FROM COMPUTER...</span>
                  </button>

                  {customImageUrl && (
                    <button
                      onClick={() => applyHologram('custom', customImageUrl)}
                      className="px-3 py-2 rounded-lg bg-black/60 border border-purple-400/60 text-purple-200 text-xs font-mono hover:bg-purple-900/40 cursor-pointer"
                    >
                      Reload: {customImageName}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-cyan-500/30 flex justify-end">
              <button
                onClick={() => setIsHologramModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                PROCEED WITH SELECTED HOLOGRAM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
