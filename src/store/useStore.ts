import { create } from 'zustand';

export type PowerType =
  | 'none'
  | 'strange-shield'
  | 'strange-portal'
  | 'ironman-hud'
  | 'energy-blast'
  | 'lightning'
  | 'telekinesis'
  | 'aura'
  | 'super-shield';

export type GestureType =
  | 'none'
  | 'open-palm'
  | 'fist'
  | 'pinch'
  | 'raise-arm'
  | 'cross-arms'
  | 'meditation'
  | 'circle-motion'
  | 'victory';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PowerInfo {
  id: PowerType;
  name: string;
  description: string;
  gesture: string;
  voice: string;
  color: string;
  icon: string;
}

export const POWERS: PowerInfo[] = [
  {
    id: 'strange-shield',
    name: 'Doctor Strange Shield',
    description: 'Circular magical shield with rotating runes',
    gesture: 'Open Palm',
    voice: 'Activate Shield',
    color: '#ff6a00',
    icon: '🛡️',
  },
  {
    id: 'strange-portal',
    name: 'Strange Portal',
    description: 'Golden interdimensional portal',
    gesture: 'Circle Motion',
    voice: 'Open Portal',
    color: '#ffd700',
    icon: '🌀',
  },
  {
    id: 'ironman-hud',
    name: 'Iron Man HUD',
    description: 'Advanced tactical heads-up display',
    gesture: 'Victory Sign',
    voice: 'Activate HUD',
    color: '#ff3333',
    icon: '🤖',
  },
  {
    id: 'energy-blast',
    name: 'Energy Blast',
    description: 'Powerful energy beam from fist',
    gesture: 'Closed Fist',
    voice: 'Energy Blast',
    color: '#00d4ff',
    icon: '⚡',
  },
  {
    id: 'lightning',
    name: 'Thor Lightning',
    description: 'Crackling lightning from raised arm',
    gesture: 'Raise Arm High',
    voice: 'Lightning Mode',
    color: '#4fc3f7',
    icon: '🌩️',
  },
  {
    id: 'telekinesis',
    name: 'Telekinesis',
    description: 'Move objects with your mind',
    gesture: 'Pinch Fingers',
    voice: 'Telekinesis',
    color: '#8b5cf6',
    icon: '🔮',
  },
  {
    id: 'aura',
    name: 'Aura Power',
    description: 'Full body energy aura field',
    gesture: 'Meditation Pose',
    voice: 'Aura Mode',
    color: '#00ff88',
    icon: '✨',
  },
  {
    id: 'super-shield',
    name: 'Super Shield',
    description: 'Energy dome shield around body',
    gesture: 'Cross Arms',
    voice: 'Super Shield',
    color: '#3b82f6',
    icon: '🔵',
  },
];

interface AppState {
  // Camera
  cameraReady: boolean;
  setCameraReady: (v: boolean) => void;

  // Powers
  activePower: PowerType;
  setActivePower: (p: PowerType) => void;
  previousPower: PowerType;
  powerIntensity: number;
  setPowerIntensity: (v: number) => void;

  // Gestures
  detectedGesture: GestureType;
  setDetectedGesture: (g: GestureType) => void;
  gestureConfidence: number;
  setGestureConfidence: (v: number) => void;

  // Landmarks
  handLandmarks: HandLandmark[][];
  setHandLandmarks: (l: HandLandmark[][]) => void;
  poseLandmarks: PoseLandmark[];
  setPoseLandmarks: (l: PoseLandmark[]) => void;
  faceLandmarks: HandLandmark[][];
  setFaceLandmarks: (l: HandLandmark[][]) => void;

  // Voice
  voiceCommand: string;
  setVoiceCommand: (c: string) => void;
  voiceListening: boolean;
  setVoiceListening: (v: boolean) => void;

  // UI
  showPanel: boolean;
  setShowPanel: (v: boolean) => void;
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  showHUD: boolean;
  setShowHUD: (v: boolean) => void;
  introComplete: boolean;
  setIntroComplete: (v: boolean) => void;

  // Stats
  fps: number;
  setFps: (v: number) => void;
  detectionConfidence: number;
  setDetectionConfidence: (v: number) => void;

  // Combo
  comboMessage: string;
  setComboMessage: (m: string) => void;

  // Debug
  showLandmarks: boolean;
  setShowLandmarks: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  cameraReady: false,
  setCameraReady: (v) => set({ cameraReady: v }),

  activePower: 'none',
  previousPower: 'none',
  setActivePower: (p) =>
    set((s) => ({ activePower: p, previousPower: s.activePower })),
  powerIntensity: 0.8,
  setPowerIntensity: (v) => set({ powerIntensity: v }),

  detectedGesture: 'none',
  setDetectedGesture: (g) => set({ detectedGesture: g }),
  gestureConfidence: 0,
  setGestureConfidence: (v) => set({ gestureConfidence: v }),

  handLandmarks: [],
  setHandLandmarks: (l) => set({ handLandmarks: l }),
  poseLandmarks: [],
  setPoseLandmarks: (l) => set({ poseLandmarks: l }),
  faceLandmarks: [],
  setFaceLandmarks: (l) => set({ faceLandmarks: l }),

  voiceCommand: '',
  setVoiceCommand: (c) => set({ voiceCommand: c }),
  voiceListening: false,
  setVoiceListening: (v) => set({ voiceListening: v }),

  showPanel: true,
  setShowPanel: (v) => set({ showPanel: v }),
  showGuide: false,
  setShowGuide: (v) => set({ showGuide: v }),
  showHUD: false,
  setShowHUD: (v) => set({ showHUD: v }),
  introComplete: false,
  setIntroComplete: (v) => set({ introComplete: v }),

  fps: 0,
  setFps: (v) => set({ fps: v }),
  detectionConfidence: 0,
  setDetectionConfidence: (v) => set({ detectionConfidence: v }),

  comboMessage: '',
  setComboMessage: (m) => set({ comboMessage: m }),

  showLandmarks: false,
  setShowLandmarks: (v) => set({ showLandmarks: v }),
}));
