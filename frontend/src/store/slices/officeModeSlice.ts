import { ExerciseSlug } from '@brain-exercises/shared';
import { INTERVAL_CATALOG } from '../../services/musicTheoryService';

export type OfficeModeType = 'drip' | 'on-demand';
export type OfficePillPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type OfficeQuestionState = 'standby' | 'playing' | 'waiting' | 'feedback' | 'freestyle' | 'paused';

export interface OfficeQuestionOption {
  index: number;         // 1-based (1..6)
  code: string;          // e.g. '3M' or 'C4-E4-G4'
  label: string;         // e.g. 'Quãng 3 Trưởng' or 'Đồ - Mi - Sol'
  isCorrect: boolean;
  semitones?: number;
  notes?: string[];      // Cho bài Nhớ Cao Độ (chuỗi nốt)
}

export interface OfficeQuestion {
  id: string;
  exerciseSlug: ExerciseSlug; // 'pitch-recall' | 'interval-identify'
  level: number;
  rootNote: string;
  targetNote?: string;
  intervalCode?: string;
  playbackDirection?: 'ascending' | 'descending' | 'harmonic';
  sequenceNotes?: string[];   // Cho bài Nhớ Cao Độ: ví dụ ['C4', 'E4', 'G4']
  options: OfficeQuestionOption[];
  createdAt: number;
  replays: number;
}

export interface OfficeLastAnswerResult {
  isCorrect: boolean;
  selectedIndex: number;
  correctIndex: number;
  selectedLabel: string;
  correctLabel: string;
  correctCode: string;
  awardedXp: number;
  semitones?: number;
  mnemonicSongVi?: string;
  tipVi?: string;
  ratioDescription?: string;
  sequenceNotes?: string[];
}

export interface OfficeModeSettings {
  exerciseSlug: ExerciseSlug;   // 'pitch-recall' | 'interval-identify'
  mode: OfficeModeType;
  intervalMinutes: number;      // 1, 2, 3, 5, 10
  volume: number;               // 0.1 to 1.0
  enableTonicBefore: boolean;   // play tonic anchor before question
  delayWhenTyping: boolean;     // delay 15s if user is actively typing
  pauseOnBlur: boolean;         // pause when tab loses focus
  showPill: boolean;            // show the floating pill
  pillPosition: OfficePillPosition;
  autoReplayOnWrong: boolean;   // automatically replay correct answer on wrong
  freestyleOnWrong: boolean;    // enter freestyle self-practice mode on wrong answer
  enableNotifications: boolean; // browser notifications when tab is backgrounded
}

export interface OfficeSessionStats {
  id: string;
  startedAt: number;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  currentStreak: number;
  bestStreak: number;
  totalXpEarned: number;
}

export interface OfficeModeSliceState {
  officeModeActive: boolean;
  officeModePaused: boolean;
  isInfoPanelOpen: boolean;
  officeSettings: OfficeModeSettings;
  officeSession: OfficeSessionStats;
  currentOfficeQuestion: OfficeQuestion | null;
  officeQuestionState: OfficeQuestionState;
  lastOfficeAnswerResult: OfficeLastAnswerResult | null;
  secondsUntilNext: number;

  // Actions
  toggleOfficeMode: (force?: boolean) => void;
  togglePauseOfficeMode: () => void;
  toggleInfoPanel: (open?: boolean) => void;
  updateOfficeSettings: (settings: Partial<OfficeModeSettings>) => void;
  setCurrentOfficeQuestion: (q: OfficeQuestion | null) => void;
  setOfficeQuestionState: (state: OfficeQuestionState) => void;
  setSecondsUntilNext: (s: number | ((prev: number) => number)) => void;
  incrementOfficeReplay: () => void;
  recordOfficeAnswer: (optionIndex: number) => OfficeLastAnswerResult | null;
  finishFreestyleAndNext: () => void;
  skipOfficeQuestion: () => void;
  resetOfficeSession: () => void;
}

const STORAGE_KEY_SETTINGS = 'be_office_mode_settings';
const STORAGE_KEY_STATS = 'be_office_mode_stats';

const DEFAULT_SETTINGS: OfficeModeSettings = {
  exerciseSlug: 'pitch-recall', // Mặc định là Nhớ Cao Độ theo yêu cầu người dùng
  mode: 'drip',
  intervalMinutes: 3,
  volume: 0.7,
  enableTonicBefore: true,
  delayWhenTyping: true,
  pauseOnBlur: false,
  showPill: true,
  pillPosition: 'bottom-right',
  autoReplayOnWrong: true,
  freestyleOnWrong: true,
  enableNotifications: true
};

const loadSettings = (): OfficeModeSettings => {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load office mode settings:', e);
  }
  return DEFAULT_SETTINGS;
};

const createInitialSession = (): OfficeSessionStats => ({
  id: `office-sess-${Date.now()}`,
  startedAt: Date.now(),
  totalAnswered: 0,
  correctCount: 0,
  wrongCount: 0,
  skippedCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalXpEarned: 0
});

export const createOfficeModeSlice = (set: any, get: any): OfficeModeSliceState => ({
  officeModeActive: false,
  officeModePaused: false,
  isInfoPanelOpen: false,
  officeSettings: loadSettings(),
  officeSession: createInitialSession(),
  currentOfficeQuestion: null,
  officeQuestionState: 'standby',
  lastOfficeAnswerResult: null,
  secondsUntilNext: 180,

  toggleOfficeMode: (force?: boolean) => {
    set((state: OfficeModeSliceState) => {
      const nextActive = force !== undefined ? force : !state.officeModeActive;
      const initialSeconds = state.officeSettings.intervalMinutes * 60;

      return {
        officeModeActive: nextActive,
        officeModePaused: false,
        officeQuestionState: nextActive ? 'standby' : 'standby',
        currentOfficeQuestion: nextActive ? state.currentOfficeQuestion : null,
        lastOfficeAnswerResult: null,
        secondsUntilNext: initialSeconds,
        officeSession: nextActive ? createInitialSession() : state.officeSession
      };
    });
  },

  togglePauseOfficeMode: () => {
    set((state: OfficeModeSliceState) => {
      if (!state.officeModeActive) return {};
      const nextPaused = !state.officeModePaused;
      return {
        officeModePaused: nextPaused,
        officeQuestionState: nextPaused ? 'paused' : (state.currentOfficeQuestion ? 'waiting' : 'standby')
      };
    });
  },

  toggleInfoPanel: (open?: boolean) => {
    set((state: OfficeModeSliceState) => ({
      isInfoPanelOpen: open !== undefined ? open : !state.isInfoPanelOpen
    }));
  },

  updateOfficeSettings: (partial: Partial<OfficeModeSettings>) => {
    set((state: OfficeModeSliceState) => {
      const nextSettings = { ...state.officeSettings, ...partial };
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(nextSettings));
        } catch (e) {
          console.warn('Failed to save office mode settings:', e);
        }
      }
      return { officeSettings: nextSettings };
    });
  },

  setCurrentOfficeQuestion: (q: OfficeQuestion | null) => {
    set({
      currentOfficeQuestion: q,
      officeQuestionState: q ? 'waiting' : 'standby',
      lastOfficeAnswerResult: null
    });
  },

  setOfficeQuestionState: (qState: OfficeQuestionState) => {
    set({ officeQuestionState: qState });
  },

  setSecondsUntilNext: (updater: number | ((prev: number) => number)) => {
    set((state: OfficeModeSliceState) => ({
      secondsUntilNext: typeof updater === 'function' ? updater(state.secondsUntilNext) : updater
    }));
  },

  incrementOfficeReplay: () => {
    set((state: OfficeModeSliceState) => {
      if (!state.currentOfficeQuestion) return {};
      return {
        currentOfficeQuestion: {
          ...state.currentOfficeQuestion,
          replays: state.currentOfficeQuestion.replays + 1
        }
      };
    });
  },

  recordOfficeAnswer: (optionIndex: number): OfficeLastAnswerResult | null => {
    const state: OfficeModeSliceState = get();
    const q = state.currentOfficeQuestion;
    if (!q || state.officeQuestionState !== 'waiting') return null;

    const chosenOption = q.options.find(opt => opt.index === optionIndex);
    const correctOption = q.options.find(opt => opt.isCorrect);
    if (!chosenOption || !correctOption) return null;

    const isCorrect = chosenOption.isCorrect;
    const baseLevelXp = Math.max(5, q.level * 4);
    const awardedXp = isCorrect ? Math.round(baseLevelXp * 0.5) : 0; // 50% XP for office mode

    const cat = q.intervalCode ? INTERVAL_CATALOG[q.intervalCode] : undefined;
    const result: OfficeLastAnswerResult = {
      isCorrect,
      selectedIndex: chosenOption.index,
      correctIndex: correctOption.index,
      selectedLabel: chosenOption.label,
      correctLabel: correctOption.label,
      correctCode: correctOption.code,
      awardedXp,
      semitones: correctOption.semitones ?? cat?.semitones,
      mnemonicSongVi: cat?.mnemonicSongVi,
      tipVi: cat?.tipVi,
      ratioDescription: cat?.ratioDescription,
      sequenceNotes: q.sequenceNotes
    };

    set((s: OfficeModeSliceState) => {
      const currentStreak = isCorrect ? s.officeSession.currentStreak + 1 : 0;
      const bestStreak = Math.max(s.officeSession.bestStreak, currentStreak);

      const nextSession: OfficeSessionStats = {
        ...s.officeSession,
        totalAnswered: s.officeSession.totalAnswered + 1,
        correctCount: s.officeSession.correctCount + (isCorrect ? 1 : 0),
        wrongCount: s.officeSession.wrongCount + (isCorrect ? 0 : 1),
        currentStreak,
        bestStreak,
        totalXpEarned: s.officeSession.totalXpEarned + awardedXp
      };

      // Nếu sai và bật chế độ freestyleOnWrong -> Chuyển sang freestyle mode để người dùng tự do thử nghiệm
      const nextState: OfficeQuestionState = isCorrect
        ? 'feedback'
        : (s.officeSettings.freestyleOnWrong ? 'freestyle' : 'feedback');

      return {
        lastOfficeAnswerResult: result,
        officeQuestionState: nextState,
        officeSession: nextSession
      };
    });

    return result;
  },

  finishFreestyleAndNext: () => {
    set((state: OfficeModeSliceState) => ({
      currentOfficeQuestion: null,
      officeQuestionState: 'standby',
      lastOfficeAnswerResult: null,
      secondsUntilNext: state.officeSettings.intervalMinutes * 60
    }));
  },

  skipOfficeQuestion: () => {
    set((state: OfficeModeSliceState) => ({
      currentOfficeQuestion: null,
      officeQuestionState: 'standby',
      lastOfficeAnswerResult: null,
      secondsUntilNext: state.officeSettings.intervalMinutes * 60,
      officeSession: {
        ...state.officeSession,
        skippedCount: state.officeSession.skippedCount + 1,
        currentStreak: 0
      }
    }));
  },

  resetOfficeSession: () => {
    set({
      officeSession: createInitialSession(),
      currentOfficeQuestion: null,
      officeQuestionState: 'standby',
      lastOfficeAnswerResult: null
    });
  }
});
