import { 
  IWrongAnswer, 
  IConfusionPairStat, 
  IAuditoryProgressSnapshot, 
  IReviewRecommendation, 
  IWrongAnswerFilter, 
  ExerciseSlug,
  calculateNextReviewDate 
} from '@brain-exercises/shared';
import { 
  calculateConfusionMatrix, 
  generateReviewRecommendations, 
  calculateProgressTimeline 
} from '../../services/wrongAnswerAnalytics';

const STORAGE_KEY_WRONG_ANSWERS = 'be_wrong_answers';
const MAX_LOCAL_WRONG_ANSWERS = 500;

export interface WrongAnswerSliceState {
  wrongAnswers: IWrongAnswer[];
  confusionStats: IConfusionPairStat[];
  progressSnapshots: IAuditoryProgressSnapshot[];
  isWrongAnswerHistoryOpen: boolean;
  activeReviewSession: ExerciseSlug | null;
  historyFilter: IWrongAnswerFilter;

  // Actions
  recordWrongAnswer: (wrong: IWrongAnswer) => void;
  recordWrongAnswersBatch: (wrongs: IWrongAnswer[]) => void;
  markWrongAnswerReviewed: (id: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  setHistoryFilter: (filter: Partial<IWrongAnswerFilter>) => void;
  setIsWrongAnswerHistoryOpen: (open: boolean) => void;
  setActiveReviewSession: (slug: ExerciseSlug | null) => void;
  clearWrongAnswerHistory: (slug?: ExerciseSlug | 'ALL') => void;
  getReviewRecommendations: () => IReviewRecommendation[];
  syncWrongAnswersFromBackend: () => Promise<void>;
}

export const initialWrongAnswerFilter: IWrongAnswerFilter = {
  exerciseSlug: 'ALL',
  severity: 'ALL',
  reviewStatus: 'ALL',
  dateRange: 'all',
  searchQuery: ''
};

export const loadInitialWrongAnswers = (): IWrongAnswer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WRONG_ANSWERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load wrong answers from localStorage:', e);
    return [];
  }
};

const saveWrongAnswersToStorage = (answers: IWrongAnswer[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_WRONG_ANSWERS, JSON.stringify(answers.slice(0, MAX_LOCAL_WRONG_ANSWERS)));
  } catch (e) {
    console.warn('Failed to persist wrong answers to localStorage:', e);
  }
};

export const createWrongAnswerSlice = (
  set: (fn: (state: any) => any) => void,
  get: () => any
) => {
  const initialAnswers = loadInitialWrongAnswers();
  const initialStats = calculateConfusionMatrix(initialAnswers);
  const initialSnapshots = calculateProgressTimeline(initialAnswers, 14);

  return {
    wrongAnswers: initialAnswers,
    confusionStats: initialStats,
    progressSnapshots: initialSnapshots,
    isWrongAnswerHistoryOpen: false,
    activeReviewSession: null,
    historyFilter: initialWrongAnswerFilter,

    recordWrongAnswer: (wrong: IWrongAnswer) => {
      set((state: any) => {
        const nextAnswers = [wrong, ...state.wrongAnswers].slice(0, MAX_LOCAL_WRONG_ANSWERS);
        saveWrongAnswersToStorage(nextAnswers);
        const stats = calculateConfusionMatrix(nextAnswers, state.historyFilter.exerciseSlug);
        const snapshots = calculateProgressTimeline(nextAnswers, 14);

        // Background sync to backend
        try {
          fetch('/api/wrong-answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wrong)
          }).catch(() => {});
        } catch {}

        return {
          wrongAnswers: nextAnswers,
          confusionStats: stats,
          progressSnapshots: snapshots
        };
      });
    },

    recordWrongAnswersBatch: (wrongs: IWrongAnswer[]) => {
      if (wrongs.length === 0) return;
      set((state: any) => {
        const nextAnswers = [...wrongs, ...state.wrongAnswers].slice(0, MAX_LOCAL_WRONG_ANSWERS);
        saveWrongAnswersToStorage(nextAnswers);
        const stats = calculateConfusionMatrix(nextAnswers, state.historyFilter.exerciseSlug);
        const snapshots = calculateProgressTimeline(nextAnswers, 14);

        // Background sync to backend
        try {
          fetch('/api/wrong-answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wrongs)
          }).catch(() => {});
        } catch {}

        return {
          wrongAnswers: nextAnswers,
          confusionStats: stats,
          progressSnapshots: snapshots
        };
      });
    },

    markWrongAnswerReviewed: (id: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => {
      set((state: any) => {
        const nextAnswers = state.wrongAnswers.map((item: IWrongAnswer) => {
          if (item.id !== id) return item;

          const srs = calculateNextReviewDate(item.easeFactor, item.reviewCount, quality);
          const isMastered = quality >= 4 && (item.reviewCount + 1) >= 3;

          return {
            ...item,
            easeFactor: srs.newEF,
            reviewCount: item.reviewCount + 1,
            lastReviewedAt: new Date().toISOString(),
            nextReviewAt: srs.nextReviewDate.toISOString(),
            reviewStatus: isMastered ? 'mastered' : 'reviewing',
            consecutiveCorrectInReview: quality >= 3 ? (item.consecutiveCorrectInReview || 0) + 1 : 0
          };
        });

        saveWrongAnswersToStorage(nextAnswers);
        const stats = calculateConfusionMatrix(nextAnswers, state.historyFilter.exerciseSlug);
        const snapshots = calculateProgressTimeline(nextAnswers, 14);

        // Background sync to backend
        try {
          fetch(`/api/wrong-answers/${id}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quality })
          }).catch(() => {});
        } catch {}

        return {
          wrongAnswers: nextAnswers,
          confusionStats: stats,
          progressSnapshots: snapshots
        };
      });
    },

    setHistoryFilter: (filter: Partial<IWrongAnswerFilter>) => {
      set((state: any) => {
        const nextFilter = { ...state.historyFilter, ...filter };
        const stats = calculateConfusionMatrix(state.wrongAnswers, nextFilter.exerciseSlug);
        return {
          historyFilter: nextFilter,
          confusionStats: stats
        };
      });
    },

    setIsWrongAnswerHistoryOpen: (open: boolean) => {
      set(() => ({ isWrongAnswerHistoryOpen: open }));
    },

    setActiveReviewSession: (slug: ExerciseSlug | null) => {
      set(() => ({ activeReviewSession: slug }));
    },

    clearWrongAnswerHistory: (slug?: ExerciseSlug | 'ALL') => {
      set((state: any) => {
        let nextAnswers: IWrongAnswer[] = [];
        if (slug && slug !== 'ALL') {
          nextAnswers = state.wrongAnswers.filter((a: IWrongAnswer) => a.exerciseSlug !== slug);
        } else {
          nextAnswers = [];
        }
        saveWrongAnswersToStorage(nextAnswers);
        const stats = calculateConfusionMatrix(nextAnswers);
        const snapshots = calculateProgressTimeline(nextAnswers, 14);

        try {
          const url = slug && slug !== 'ALL' ? `/api/wrong-answers?exerciseSlug=${slug}` : '/api/wrong-answers';
          fetch(url, { method: 'DELETE' }).catch(() => {});
        } catch {}

        return {
          wrongAnswers: nextAnswers,
          confusionStats: stats,
          progressSnapshots: snapshots
        };
      });
    },

    getReviewRecommendations: (): IReviewRecommendation[] => {
      const state = get();
      return generateReviewRecommendations(state.confusionStats, state.wrongAnswers);
    },

    syncWrongAnswersFromBackend: async () => {
      try {
        const res = await fetch('/api/wrong-answers?limit=200');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            set((state: any) => {
              // Merge local and remote
              const localMap = new Map<string, IWrongAnswer>(
                state.wrongAnswers.map((a: IWrongAnswer) => [a.id, a] as [string, IWrongAnswer])
              );
              json.data.forEach((remoteItem: IWrongAnswer) => {
                if (!localMap.has(remoteItem.id)) {
                  localMap.set(remoteItem.id, remoteItem);
                }
              });
              const merged: IWrongAnswer[] = Array.from(localMap.values())
                .sort((a: IWrongAnswer, b: IWrongAnswer) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, MAX_LOCAL_WRONG_ANSWERS);

              saveWrongAnswersToStorage(merged);
              return {
                wrongAnswers: merged,
                confusionStats: calculateConfusionMatrix(merged, state.historyFilter.exerciseSlug),
                progressSnapshots: calculateProgressTimeline(merged, 14)
              };
            });
          }
        }
      } catch (e) {
        console.warn('Backend sync failed, using offline storage:', e);
      }
    }
  };
};
