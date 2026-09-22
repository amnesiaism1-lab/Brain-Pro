import { create } from 'zustand';
import { 
  ExerciseSlug, 
  IWorkoutRoutine, 
  IUserReminder,
  IUserExerciseMastery,
  IExerciseSynergy,
  IWeeklyChallenge,
  IUserCognitiveSnapshot,
  EXERCISE_SYNERGIES,
  WEEKLY_CHALLENGES
} from '@brain-exercises/shared';

export type MainNavTab = 'home' | 'exercises' | 'settings' | 'user';

interface AppState {
  // Navigation & Modals
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  selectedExerciseSlug: ExerciseSlug | null;
  setSelectedExerciseSlug: (slug: ExerciseSlug | null) => void;
  activeGameSlug: ExerciseSlug | null;
  setActiveGameSlug: (slug: ExerciseSlug | null) => void;
  
  isHowToTrainOpen: boolean;
  setIsHowToTrainOpen: (open: boolean) => void;
  isRemindersOpen: boolean;
  setIsRemindersOpen: (open: boolean) => void;

  // Exercise settings & state
  currentLevel: number; // Global active level
  setCurrentLevel: (level: number) => void;
  autoDifficulty: boolean;
  setAutoDifficulty: (enabled: boolean) => void;
  enableHints: boolean;
  setEnableHints: (enabled: boolean) => void;

  // Per-exercise Mastery & Progression (1 to 12)
  exerciseMasteries: Record<string, IUserExerciseMastery>;
  getExerciseLevel: (slug: ExerciseSlug) => number;
  setExerciseLevel: (slug: ExerciseSlug, level: number) => void;

  // Synergies & Combos
  lastPlayedSlug: ExerciseSlug | null;
  activeSynergy: IExerciseSynergy | null;
  suggestedSynergy: IExerciseSynergy | null;
  dismissSynergy: () => void;

  // Weekly Challenges
  weeklyChallenges: IWeeklyChallenge[];
  completeWeeklyChallenge: (challengeId: string) => void;

  // Cognitive Snapshots (Long-term progression)
  cognitiveSnapshots: IUserCognitiveSnapshot[];

  // Active workout routine session
  activeWorkoutRoutine: IWorkoutRoutine | null;
  currentWorkoutStepIndex: number;
  startWorkoutRoutine: (routine: IWorkoutRoutine) => void;
  nextWorkoutStep: () => void;
  cancelWorkoutRoutine: () => void;

  // Gamification & User Stats
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;

  // Reminders
  reminders: IUserReminder[];
  addReminder: (reminder: IUserReminder) => void;
  toggleReminder: (id: string) => void;

  // History & High Scores
  attemptsHistory: Array<{
    id: string;
    exerciseSlug: ExerciseSlug;
    score: number;
    accuracyRate: number;
    timeSpentSec: number;
    effectiveWpm?: number;
    xpEarned: number;
    level: number;
    synergyBonusXp?: number;
    date: string;
  }>;
  recordAttempt: (attempt: {
    id?: string;
    exerciseSlug: ExerciseSlug;
    score: number;
    accuracyRate: number;
    timeSpentSec: number;
    effectiveWpm?: number;
    xpEarned: number;
    level?: number;
  }) => void;
  
  // Sound Synthesis helper
  playSound: (type: 'correct' | 'wrong' | 'click' | 'victory') => void;
}

// Simple Web Audio API Synthesizer (No external assets required!)
function playSynthSound(type: 'correct' | 'wrong' | 'click' | 'victory') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {
    // Gracefully ignore audio errors in restricted browser autoplay policies
  }
}

export const useAppStore = create<AppState>((set, get) => {
  // Load persisted state if any
  const savedXp = parseInt(localStorage.getItem('be_xp') || '420', 10);
  const savedStreak = parseInt(localStorage.getItem('be_streak') || '4', 10);
  const savedBestStreak = parseInt(localStorage.getItem('be_best_streak') || '7', 10);
  const savedLevel = Math.floor(Math.sqrt(savedXp / 100)) + 1;
  const savedSound = localStorage.getItem('be_sound') !== 'false';
  const savedDark = localStorage.getItem('be_dark') === 'true';

  let initialMasteries: Record<string, IUserExerciseMastery> = {};
  try {
    const raw = localStorage.getItem('be_masteries');
    if (raw) initialMasteries = JSON.parse(raw);
  } catch {
    initialMasteries = {};
  }

  const initialChallenges: IWeeklyChallenge[] = [...WEEKLY_CHALLENGES];

  const initialSnapshots: IUserCognitiveSnapshot[] = [
    {
      id: 'snap-prev-week',
      snapshotDate: 'Tuần trước',
      speedReadingScore: 68,
      peripheralVisionScore: 72,
      memoryScore: 65,
      attentionScore: 75,
      reactionScore: 70,
      overallBrainAge: 26
    },
    {
      id: 'snap-current-week',
      snapshotDate: 'Tuần này',
      speedReadingScore: 84,
      peripheralVisionScore: 88,
      memoryScore: 79,
      attentionScore: 90,
      reactionScore: 85,
      overallBrainAge: 23
    }
  ];

  return {
    activeTab: 'home',
    setActiveTab: (tab) => set({ activeTab: tab }),
    selectedExerciseSlug: null,
    setSelectedExerciseSlug: (slug) => set({ selectedExerciseSlug: slug }),
    activeGameSlug: null,
    setActiveGameSlug: (slug) => set({ activeGameSlug: slug }),

    isHowToTrainOpen: false,
    setIsHowToTrainOpen: (open) => set({ isHowToTrainOpen: open }),
    isRemindersOpen: false,
    setIsRemindersOpen: (open) => set({ isRemindersOpen: open }),

    currentLevel: 1,
    setCurrentLevel: (level) => set({ currentLevel: Math.min(12, Math.max(1, level)) }),
    autoDifficulty: true,
    setAutoDifficulty: (enabled) => set({ autoDifficulty: enabled }),
    enableHints: true,
    setEnableHints: (enabled) => set({ enableHints: enabled }),

    // Per-exercise Mastery
    exerciseMasteries: initialMasteries,
    getExerciseLevel: (slug: ExerciseSlug) => {
      const state = get();
      return state.exerciseMasteries[slug]?.currentLevel || state.currentLevel || 1;
    },
    setExerciseLevel: (slug: ExerciseSlug, level: number) => {
      const targetLevel = Math.min(12, Math.max(1, level));
      set(state => {
        const prev = state.exerciseMasteries[slug] || {
          exerciseSlug: slug,
          currentLevel: targetLevel,
          highestLevelReached: targetLevel,
          totalAttempts: 0,
          perfectAttempts: 0,
          avgAccuracy: 0,
          avgReactionMs: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0
        };
        const updated = {
          ...state.exerciseMasteries,
          [slug]: {
            ...prev,
            currentLevel: targetLevel,
            highestLevelReached: Math.max(prev.highestLevelReached, targetLevel)
          }
        };
        localStorage.setItem('be_masteries', JSON.stringify(updated));
        return { 
          exerciseMasteries: updated,
          currentLevel: targetLevel
        };
      });
    },

    // Synergies & Combos
    lastPlayedSlug: null,
    activeSynergy: null,
    suggestedSynergy: null,
    dismissSynergy: () => set({ activeSynergy: null, suggestedSynergy: null }),

    // Weekly Challenges
    weeklyChallenges: initialChallenges,
    completeWeeklyChallenge: (challengeId: string) => {
      set(state => ({
        weeklyChallenges: state.weeklyChallenges.map(c => 
          c.id === challengeId ? { ...c, isCompleted: true } : c
        )
      }));
    },

    // Cognitive Snapshots
    cognitiveSnapshots: initialSnapshots,

    activeWorkoutRoutine: null,
    currentWorkoutStepIndex: 0,
    startWorkoutRoutine: (routine) => {
      set({ 
        activeWorkoutRoutine: routine, 
        currentWorkoutStepIndex: 0,
        activeGameSlug: routine.items[0]?.exerciseSlug || null
      });
    },
    nextWorkoutStep: () => {
      const { activeWorkoutRoutine, currentWorkoutStepIndex } = get();
      if (!activeWorkoutRoutine) return;
      const nextIndex = currentWorkoutStepIndex + 1;
      if (nextIndex < activeWorkoutRoutine.items.length) {
        set({
          currentWorkoutStepIndex: nextIndex,
          activeGameSlug: activeWorkoutRoutine.items[nextIndex].exerciseSlug
        });
      } else {
        // Routine completed!
        set({
          activeWorkoutRoutine: null,
          currentWorkoutStepIndex: 0,
          activeGameSlug: null,
          activeTab: 'home'
        });
        get().playSound('victory');
      }
    },
    cancelWorkoutRoutine: () => {
      set({
        activeWorkoutRoutine: null,
        currentWorkoutStepIndex: 0,
        activeGameSlug: null
      });
    },

    xp: savedXp,
    level: savedLevel,
    streak: savedStreak,
    bestStreak: savedBestStreak,
    soundEnabled: savedSound,
    setSoundEnabled: (enabled) => {
      localStorage.setItem('be_sound', String(enabled));
      set({ soundEnabled: enabled });
    },
    darkMode: savedDark,
    setDarkMode: (enabled) => {
      localStorage.setItem('be_dark', String(enabled));
      if (enabled) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ darkMode: enabled });
    },

    reminders: [
      {
        id: 'rem-1',
        reminderTime: '08:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        isEnabled: true,
        label: 'Khởi động não bộ 10 phút đầu ngày'
      },
      {
        id: 'rem-2',
        reminderTime: '21:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: false,
        label: 'Luyện đọc sách nhanh ban tối'
      }
    ],
    addReminder: (reminder) => {
      set(state => ({ reminders: [...state.reminders, reminder] }));
    },
    toggleReminder: (id) => {
      set(state => ({
        reminders: state.reminders.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)
      }));
    },

    attemptsHistory: [],
    recordAttempt: (attempt) => {
      const state = get();
      const currentLevel = attempt.level || state.getExerciseLevel(attempt.exerciseSlug);
      
      // 1. Synergy Detection
      let synergyBonus = 0;
      let matchedSynergy: IExerciseSynergy | null = null;
      if (state.lastPlayedSlug && state.lastPlayedSlug !== attempt.exerciseSlug) {
        const found = EXERCISE_SYNERGIES.find(
          s => (s.exerciseASlug === state.lastPlayedSlug && s.exerciseBSlug === attempt.exerciseSlug) ||
               (s.exerciseBSlug === state.lastPlayedSlug && s.exerciseASlug === attempt.exerciseSlug)
        );
        if (found) {
          matchedSynergy = found;
          synergyBonus = Math.round(attempt.xpEarned * (found.bonusXpPercent / 100));
        }
      }

      // 2. Next Synergy Suggestion
      const nextSynergy = EXERCISE_SYNERGIES.find(
        s => s.exerciseASlug === attempt.exerciseSlug || s.exerciseBSlug === attempt.exerciseSlug
      ) || null;

      // 3. Weekly Challenge Verification
      let challengeBonusXp = 0;
      const updatedChallenges = state.weeklyChallenges.map(c => {
        if (!c.isCompleted && c.exerciseSlug === attempt.exerciseSlug && attempt.score >= c.targetScore && currentLevel >= c.targetLevel) {
          challengeBonusXp += c.xpReward;
          return { ...c, isCompleted: true };
        }
        return c;
      });

      // 4. Per-exercise Adaptive DDA (1 to 12)
      const prevMastery = state.exerciseMasteries[attempt.exerciseSlug] || {
        exerciseSlug: attempt.exerciseSlug,
        currentLevel,
        highestLevelReached: currentLevel,
        totalAttempts: 0,
        perfectAttempts: 0,
        avgAccuracy: 0,
        avgReactionMs: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };

      let nextLevel = prevMastery.currentLevel;
      let nextWins = prevMastery.consecutiveWins;
      let nextLosses = prevMastery.consecutiveLosses;

      if (state.autoDifficulty) {
        if (attempt.accuracyRate >= 90) {
          nextWins += 1;
          nextLosses = 0;
          if (nextWins >= 2) {
            nextLevel = Math.min(12, nextLevel + 1);
            nextWins = 0;
          }
        } else if (attempt.accuracyRate < 60) {
          nextLosses += 1;
          nextWins = 0;
          if (nextLosses >= 2) {
            nextLevel = Math.max(1, nextLevel - 1);
            nextLosses = 0;
          }
        }
      }

      const updatedMastery: IUserExerciseMastery = {
        ...prevMastery,
        currentLevel: nextLevel,
        highestLevelReached: Math.max(prevMastery.highestLevelReached, nextLevel),
        totalAttempts: prevMastery.totalAttempts + 1,
        perfectAttempts: attempt.accuracyRate === 100 ? prevMastery.perfectAttempts + 1 : prevMastery.perfectAttempts,
        consecutiveWins: nextWins,
        consecutiveLosses: nextLosses,
        lastPlayedAt: new Date().toISOString()
      };

      const updatedMasteries = {
        ...state.exerciseMasteries,
        [attempt.exerciseSlug]: updatedMastery
      };
      localStorage.setItem('be_masteries', JSON.stringify(updatedMasteries));

      // 5. XP Calculation & Leveling
      const totalEarnedXp = attempt.xpEarned + synergyBonus + challengeBonusXp;
      const newXp = state.xp + totalEarnedXp;
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      localStorage.setItem('be_xp', String(newXp));
      
      set({
        xp: newXp,
        level: newLevel,
        exerciseMasteries: updatedMasteries,
        currentLevel: nextLevel,
        lastPlayedSlug: attempt.exerciseSlug,
        activeSynergy: matchedSynergy,
        suggestedSynergy: nextSynergy,
        weeklyChallenges: updatedChallenges,
        attemptsHistory: [
          { 
            ...attempt, 
            id: attempt.id || `att-${Date.now()}`,
            level: currentLevel,
            synergyBonusXp: synergyBonus,
            date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
          },
          ...state.attemptsHistory
        ].slice(0, 50)
      });
    },

    playSound: (type) => {
      if (get().soundEnabled) {
        playSynthSound(type);
      }
    }
  };
});
