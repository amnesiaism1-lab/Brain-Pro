import { create } from 'zustand';
import {
  StudioTab,
  TuningTolerance,
  TargetPitchMode,
  MicStatus,
  SingSessionStats,
} from '../components/vocal-studio/types';
import { IVocalAnalysisResult, IVocalPhrase } from '../services/vocalFileAnalysisService';

export interface ISelectedKeyOverride {
  root: string;
  mode: 'major' | 'minor';
}

export interface VocalStudioPreferences {
  toleranceCents: TuningTolerance;
  targetMode: TargetPitchMode;
  smartOctaveFold: boolean;
  playbackSpeed: number;
  musicVolume: number;
  isMutedMusic: boolean;
  isLiveMonitoring: boolean;
  concertA4Hz: number;
  latencyOffsetMs: number;
  isWindowLocked: boolean;
  selectedKeyOverride: ISelectedKeyOverride | null;
  snapToScale: boolean;
  transposeSemitones: number;
}

const STORAGE_KEY = 'be_vocal_studio_prefs';

function loadSavedPreferences(): VocalStudioPreferences {
  const defaults: VocalStudioPreferences = {
    toleranceCents: 35,
    targetMode: 'quantized',
    smartOctaveFold: true,
    playbackSpeed: 1.0,
    musicVolume: 0.85,
    isMutedMusic: false,
    isLiveMonitoring: false,
    concertA4Hz: 440,
    latencyOffsetMs: 0,
    isWindowLocked: false,
    selectedKeyOverride: null,
    snapToScale: false,
    transposeSemitones: 0,
  };

  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

function savePreferences(prefs: Partial<VocalStudioPreferences>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadSavedPreferences();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (err) {
    console.warn('Failed to save vocal studio preferences:', err);
  }
}

export const INITIAL_SESSION_STATS: SingSessionStats = {
  totalVocalFrames: 0,
  inTuneFrames: 0,
  flatFrames: 0,
  sharpFrames: 0,
  highestStreak: 0,
  phraseScores: {},
};

export interface VocalStudioState extends VocalStudioPreferences {
  // Modal & Navigation
  isOpen: boolean;
  activeTab: StudioTab;

  // Analysis
  analysisResult: IVocalAnalysisResult | null;
  isAnalyzing: boolean;
  analyzeProgress: number;
  analyzeStatusText: string;
  errorMessage: string | null;

  // Playback & Session
  isPlaying: boolean;
  currentTimeMs: number;
  isLoopingActive: boolean;
  loopStartMs: number | null;
  loopEndMs: number | null;
  selectedPhraseIndex: number | null;
  micStatus: MicStatus;
  realtimeScorePct: number | null;
  currentStreak: number;
  sessionStats: SingSessionStats;

  // Actions
  openStudio: () => void;
  closeStudio: () => void;
  setActiveTab: (tab: StudioTab) => void;
  setToleranceCents: (val: TuningTolerance) => void;
  setTargetMode: (mode: TargetPitchMode) => void;
  setSmartOctaveFold: (val: boolean) => void;
  setPlaybackSpeed: (val: number) => void;
  setMusicVolume: (val: number) => void;
  setIsMutedMusic: (val: boolean) => void;
  setIsLiveMonitoring: (val: boolean) => void;
  setConcertA4Hz: (val: number) => void;
  setLatencyOffsetMs: (val: number) => void;
  setIsWindowLocked: (val: boolean) => void;
  setSelectedKeyOverride: (key: ISelectedKeyOverride | null) => void;
  setSnapToScale: (val: boolean) => void;
  setTransposeSemitones: (val: number) => void;

  setAnalysisResult: (res: IVocalAnalysisResult | null) => void;
  setIsAnalyzing: (val: boolean) => void;
  setAnalyzeProgress: (pct: number, statusText?: string) => void;
  setErrorMessage: (msg: string | null) => void;

  setIsPlaying: (val: boolean) => void;
  setCurrentTimeMs: (ms: number) => void;
  setLoop: (startMs: number | null, endMs: number | null, phraseIndex?: number | null) => void;
  clearLoop: () => void;
  setMicStatus: (status: MicStatus) => void;
  setRealtimeScorePct: (pct: number | null) => void;
  setCurrentStreak: (streak: number) => void;
  setSessionStats: (stats: SingSessionStats) => void;
  resetSessionStats: () => void;
}

const initialPrefs = loadSavedPreferences();

export const useVocalStudioStore = create<VocalStudioState>((set) => ({
  ...initialPrefs,

  isOpen: false,
  activeTab: 'analysis',

  analysisResult: null,
  isAnalyzing: false,
  analyzeProgress: 0,
  analyzeStatusText: '',
  errorMessage: null,

  isPlaying: false,
  currentTimeMs: 0,
  isLoopingActive: false,
  loopStartMs: null,
  loopEndMs: null,
  selectedPhraseIndex: null,
  micStatus: 'idle',
  realtimeScorePct: null,
  currentStreak: 0,
  sessionStats: { ...INITIAL_SESSION_STATS },

  openStudio: () => {
    set({ isOpen: true });
    if (typeof window !== 'undefined' && window.location.hash !== '#/vocal-studio') {
      window.history.pushState(null, '', '#/vocal-studio');
    }
  },

  closeStudio: () => {
    set({ isOpen: false, isPlaying: false });
    if (typeof window !== 'undefined' && window.location.hash === '#/vocal-studio') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setToleranceCents: (toleranceCents) => {
    savePreferences({ toleranceCents });
    set({ toleranceCents });
  },

  setTargetMode: (targetMode) => {
    savePreferences({ targetMode });
    set({ targetMode });
  },

  setSmartOctaveFold: (smartOctaveFold) => {
    savePreferences({ smartOctaveFold });
    set({ smartOctaveFold });
  },

  setPlaybackSpeed: (playbackSpeed) => {
    savePreferences({ playbackSpeed });
    set({ playbackSpeed });
  },

  setMusicVolume: (musicVolume) => {
    savePreferences({ musicVolume });
    set({ musicVolume });
  },

  setIsMutedMusic: (isMutedMusic) => {
    savePreferences({ isMutedMusic });
    set({ isMutedMusic });
  },

  setIsLiveMonitoring: (isLiveMonitoring) => {
    savePreferences({ isLiveMonitoring });
    set({ isLiveMonitoring });
  },

  setConcertA4Hz: (concertA4Hz) => {
    savePreferences({ concertA4Hz });
    set({ concertA4Hz });
  },

  setLatencyOffsetMs: (latencyOffsetMs) => {
    savePreferences({ latencyOffsetMs });
    set({ latencyOffsetMs });
  },

  setIsWindowLocked: (isWindowLocked) => {
    savePreferences({ isWindowLocked });
    set({ isWindowLocked });
  },

  setSelectedKeyOverride: (selectedKeyOverride) => {
    savePreferences({ selectedKeyOverride });
    set({ selectedKeyOverride });
  },

  setSnapToScale: (snapToScale) => {
    savePreferences({ snapToScale });
    set({ snapToScale });
  },

  setTransposeSemitones: (transposeSemitones) => {
    savePreferences({ transposeSemitones });
    set({ transposeSemitones });
  },

  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalyzeProgress: (analyzeProgress, statusText) =>
    set((state) => ({
      analyzeProgress,
      analyzeStatusText: statusText !== undefined ? statusText : state.analyzeStatusText,
    })),
  setErrorMessage: (errorMessage) => set({ errorMessage }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTimeMs: (currentTimeMs) => set({ currentTimeMs }),
  setLoop: (loopStartMs, loopEndMs, phraseIndex = null) =>
    set({
      loopStartMs,
      loopEndMs,
      selectedPhraseIndex: phraseIndex,
      isLoopingActive: loopStartMs !== null && loopEndMs !== null,
    }),
  clearLoop: () =>
    set({
      loopStartMs: null,
      loopEndMs: null,
      selectedPhraseIndex: null,
      isLoopingActive: false,
    }),
  setMicStatus: (micStatus) => set({ micStatus }),
  setRealtimeScorePct: (realtimeScorePct) => set({ realtimeScorePct }),
  setCurrentStreak: (currentStreak) => set({ currentStreak }),
  setSessionStats: (sessionStats) => set({ sessionStats }),
  resetSessionStats: () =>
    set({
      sessionStats: { ...INITIAL_SESSION_STATS },
      realtimeScorePct: null,
      currentStreak: 0,
    }),
}));
