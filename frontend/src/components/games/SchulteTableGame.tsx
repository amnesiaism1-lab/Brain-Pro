import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateSchulteGrid, calculateGameScore, EXERCISES_METADATA } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Clock, 
  Target, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  Volume2, 
  VolumeX, 
  Share2, 
  Download, 
  Flame, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Info,
  AlertTriangle,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { numberToRoman } from '../../services/infinityApiService';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';

export type SchulteMode = 'standard' | 'gorbov' | 'reverse' | 'alphabet' | 'fading' | 'rotating';

interface GorbovCell {
  num: number;
  color: 'red' | 'black';
}

const VI_ALPHABET = ['A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y'];
const LATIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const getAlphabetSequence = (type: 'vi' | 'latin', count: number): string[] => {
  const base = type === 'vi' ? VI_ALPHABET : LATIN_ALPHABET;
  if (count <= base.length) {
    return base.slice(0, count);
  }
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const cycle = Math.floor(i / base.length);
    const letter = base[i % base.length];
    result.push(cycle === 0 ? letter : `${letter}${cycle}`);
  }
  return result;
};

const MAX_HINTS_PER_ROUND = 3;

interface RoundResult {
  round: number;
  timeSpentSec: number;
  accuracy: number;
  pace: number;
  score: number;
  missClicks: number;
  hintCount: number;
}

export const SchulteTableGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setExerciseLevel,
    setActiveGameSlug, 
    playSound, 
    soundEnabled, 
    setSoundEnabled,
    recordAttempt,
    activeWorkoutRoutine,
    nextWorkoutStep,
    isGamePaused,
    ladderSessionRounds,
    lastLevelUpEvent,
    clearLevelUpEvent,
    autoHintEnabled,
    setAutoHintEnabled,
    enableHints,
    setEnableHints,
    lastChallengeBonus
  } = useAppStore();

  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('schulte-table');
  const { sessionConfig: resolvedConfig, isCustom } = useExerciseSessionConfig('schulte-table');

  const sessionIdRef = useRef<string>(`schulte-${Date.now()}`);
  const lastClickTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);

  const effectiveLevel = getExerciseLevel('schulte-table') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;
  const isRomanMode = effectiveLevel === 15;

  // Retrieve standard level target time from EXERCISES_METADATA
  const standardLevelConfig = useMemo(() => {
    const meta = EXERCISES_METADATA.find(e => e.slug === 'schulte-table');
    return meta?.levelConfigs.find(c => c.level === effectiveLevel);
  }, [effectiveLevel]);

  // Determine initial mode based on level progression or custom preset
  const initialMode: SchulteMode = useMemo(() => {
    if (isCustom && resolvedConfig.params?.mode) {
      const customMode = resolvedConfig.params.mode as string;
      if (customMode === 'gorbov') return 'gorbov';
      if (customMode === 'alphabet') return 'alphabet';
      if (customMode === 'dynamic') return 'rotating';
      return 'standard';
    }
    if (effectiveLevel === 13) return 'alphabet'; // Latin A-Y
    if (effectiveLevel === 14) return 'gorbov'; // Gorbov Red/Black 7x7
    if (effectiveLevel === 15) return 'standard'; // Roman Numerals I-XXV
    if (effectiveLevel === 16) return 'reverse'; // 7x7 49->1
    if (effectiveLevel === 17) return 'fading'; // Phantom fading 6x6
    if (effectiveLevel === 18) return 'rotating'; // Fast rotating 6x6
    if (effectiveLevel === 19) return 'rotating'; // Rotating + fading combo 6x6
    if (effectiveLevel === 20) return 'alphabet'; // Fading Latin alphabet 5x5 (A-Y)
    if (effectiveLevel === 21) return 'gorbov'; // Rotating Gorbov 7x7
    if (effectiveLevel === 22) return 'rotating'; // Quantum chaos 7x7
    if (effectiveLevel === 8) return 'reverse';
    if (effectiveLevel === 9) return 'gorbov';
    if (effectiveLevel === 10) return 'rotating';
    if (effectiveLevel === 11) return 'fading';
    return 'standard';
  }, [effectiveLevel, isCustom, resolvedConfig.params]);

  // Determine initial size
  const initialSize = useMemo(() => {
    if (isCustom && typeof resolvedConfig.params?.gridSize === 'number') {
      return resolvedConfig.params.gridSize;
    }
    if (effectiveLevel === 13) return 5;
    if (effectiveLevel === 14) return 7;
    if (effectiveLevel === 15) return 5;
    if (effectiveLevel === 16) return 7;
    if (effectiveLevel === 17) return 6;
    if (effectiveLevel === 18) return 6;
    if (effectiveLevel === 19) return 6;
    if (effectiveLevel === 20) return 5;
    if (effectiveLevel === 21) return 7;
    if (effectiveLevel === 22) return 7;
    if (effectiveLevel === 1) return 3;
    if (effectiveLevel === 2) return 4;
    if (effectiveLevel <= 4) return 5;
    if (effectiveLevel <= 6) return 6;
    if (effectiveLevel <= 9) return 7;
    if (effectiveLevel <= 11) return 8;
    return 9; // Level 12 standard is 9x9
  }, [effectiveLevel, isCustom, resolvedConfig.params]);

  // Session rounds configuration
  const totalRounds = useMemo(() => {
    if (isCustom && resolvedConfig.rounds && resolvedConfig.rounds > 0) {
      return resolvedConfig.rounds;
    }
    return ladderSessionRounds || 1;
  }, [isCustom, resolvedConfig.rounds, ladderSessionRounds]);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [roundTransition, setRoundTransition] = useState<{ show: boolean; roundDone: number } | null>(null);

  // Active configurations
  const [mode, setMode] = useState<SchulteMode>(initialMode);
  const [gridSize, setGridSize] = useState<number>(initialSize);
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(true);
  const [isClassicMode, setIsClassicMode] = useState<boolean>(() => {
    if (isCustom && typeof resolvedConfig.params?.isClassicMode === 'boolean') {
      return resolvedConfig.params.isClassicMode;
    }
    return false;
  });
  
  // Distinguish between manual user hints and automatic idle radar ping
  const [hintActive, setHintActive] = useState<string | null>(null);
  const [autoRadarActive, setAutoRadarActive] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState<number>(0);

  // Phantom Fading state: ghost cells after initial 2.5 seconds
  const [isPhantomFaded, setIsPhantomFaded] = useState<boolean>(false);

  // Confirmation before resetting or altering an active board
  const [showResetConfirm, setShowResetConfirm] = useState<{ action: () => void; message: string } | null>(null);

  // Game board states
  const [standardNumbers, setStandardNumbers] = useState<number[][]>([]);
  const [alphabetLetters, setAlphabetLetters] = useState<string[][]>([]);
  const [gorbovGrid, setGorbovGrid] = useState<GorbovCell[][]>([]);
  
  // Target tracking
  const [currentTarget, setCurrentTarget] = useState<number>(1);
  const [alphabetType, setAlphabetType] = useState<'vi' | 'latin'>(() => {
    if (isCustom && resolvedConfig.params?.alphabetType) {
      return resolvedConfig.params.alphabetType as 'vi' | 'latin';
    }
    if (effectiveLevel >= 13) return 'latin';
    return 'vi';
  });
  const [alphabetIndex, setAlphabetIndex] = useState<number>(0);
  const [currentLetterTarget, setCurrentLetterTarget] = useState<string>('A');
  const [gorbovTarget, setGorbovTarget] = useState<{ color: 'red' | 'black'; num: number }>({ color: 'red', num: 1 });
  
  // Game session metrics
  const [foundKeys, setFoundKeys] = useState<Set<string>>(new Set());
  const [missClicks, setMissClicks] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [clickEffects, setClickEffects] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const phantomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playedLevelRef = useRef<number>(effectiveLevel);

  useEffect(() => {
    playedLevelRef.current = effectiveLevel;
    if (!isCustom) {
      setMode(initialMode);
      setGridSize(initialSize);
    }
  }, [effectiveLevel, initialMode, initialSize, isCustom]);

  // Personal Best key
  const personalBestKey = `be_schulte_best_${mode}_${gridSize}`;
  const [personalBest, setPersonalBest] = useState<number | null>(() => {
    const saved = localStorage.getItem(personalBestKey);
    return saved ? parseFloat(saved) : null;
  });

  // Calculate total items
  const totalItems = useMemo(() => {
    if (mode === 'gorbov') return 49;
    return gridSize * gridSize;
  }, [mode, gridSize]);

  // Dynamic rotation interval
  const rotateInterval = useMemo(() => {
    if (isCustom && typeof resolvedConfig.params?.rotateInterval === 'number') {
      return resolvedConfig.params.rotateInterval;
    }
    return effectiveLevel === 22 ? 5 : effectiveLevel >= 18 ? 8 : 12;
  }, [isCustom, resolvedConfig.params, effectiveLevel]);

  // Items remaining & found count
  const currentFoundCount = useMemo(() => {
    return foundKeys.size;
  }, [foundKeys]);

  // Average pace: seconds per found item
  const currentPace = useMemo(() => {
    if (currentFoundCount === 0 || elapsedSec === 0) return 0;
    return +(elapsedSec / currentFoundCount).toFixed(2);
  }, [currentFoundCount, elapsedSec]);

  // Custom countdown limit vs Ladder target time
  const isCustomCountdown = Boolean(isCustom && resolvedConfig.timeLimitSec && resolvedConfig.timeLimitSec > 0);
  const countdownLimitSec = isCustomCountdown ? (resolvedConfig.timeLimitSec || 60) : 0;
  const remainingCountdownSec = isCustomCountdown ? Math.max(0, countdownLimitSec - elapsedSec) : 0;

  // Target standard time for score bonus
  const targetTimeSec = useMemo(() => {
    if (isCustom && resolvedConfig.timeLimitSec) {
      return resolvedConfig.timeLimitSec;
    }
    if (standardLevelConfig?.timeLimitSec) {
      return standardLevelConfig.timeLimitSec;
    }
    if (mode === 'gorbov') return 120;
    if (gridSize === 3) return 40;
    if (gridSize === 4) return 50;
    if (gridSize === 5) return 60;
    if (gridSize === 6) return 60;
    if (gridSize === 7) return 75;
    if (gridSize === 8) return 75;
    return 80;
  }, [isCustom, resolvedConfig, standardLevelConfig, mode, gridSize]);

  // Accuracy calculation
  const totalClicks = currentFoundCount + missClicks;
  const accuracy = totalClicks > 0 ? Math.round((currentFoundCount / totalClicks) * 100) : 100;

  // Final score for current round
  const currentRoundScore = useMemo(() => {
    const rawScore = calculateGameScore({
      level: effectiveLevel,
      accuracyRate: accuracy,
      timeLimitSec: targetTimeSec,
      timeSpentSec: elapsedSec
    });
    // Deduct user hint penalty (-5 pts per manual hint used)
    return Math.max(10, rawScore - hintCount * 5);
  }, [effectiveLevel, accuracy, targetTimeSec, elapsedSec, hintCount]);

  // Handle Pause Freeze: freeze elapsed time when modal or exit dialog is open
  useEffect(() => {
    if (isGamePaused) {
      pausedAtRef.current = Date.now();
    } else if (pausedAtRef.current) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      startTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
    }
  }, [isGamePaused]);

  // Safe request to alter board: prompt if in-progress
  const safeAlterBoard = (action: () => void, description: string) => {
    if (currentFoundCount > 0 && !isFinished) {
      setShowResetConfirm({
        action,
        message: `Bạn đang trong ván chơi (${currentFoundCount}/${totalItems} ô). ${description} sẽ đặt lại bàn cờ hiện tại. Bạn có muốn tiếp tục?`
      });
    } else {
      action();
    }
  };

  // Initialize or reset game board
  const initBoard = (overrideMode?: SchulteMode, overrideSize?: number) => {
    const activeMode = overrideMode || mode;
    const activeSize = overrideSize || gridSize;
    playedLevelRef.current = effectiveLevel;
    setFoundKeys(new Set());
    setMissClicks(0);
    setCurrentStreak(0);
    setElapsedSec(0);
    setRotationDeg(0);
    setIsFinished(false);
    setClickEffects({});
    setHintActive(null);
    setAutoRadarActive(null);
    setHintCount(0);
    setIsCopied(false);
    setIsPhantomFaded(false);
    lastClickTimeRef.current = Date.now();

    startTimeRef.current = Date.now();

    if (activeMode === 'gorbov') {
      // 25 Red (1-25) + 24 Black (1-24)
      const items: GorbovCell[] = [];
      for (let i = 1; i <= 25; i++) items.push({ num: i, color: 'red' });
      for (let i = 1; i <= 24; i++) items.push({ num: i, color: 'black' });
      
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      const grid: GorbovCell[][] = [];
      for (let r = 0; r < 7; r++) {
        grid.push(items.slice(r * 7, (r + 1) * 7));
      }
      setGorbovGrid(grid);
      setGorbovTarget({ color: 'red', num: 1 });
    } else if (activeMode === 'alphabet') {
      const fullSequence = getAlphabetSequence(alphabetType, activeSize * activeSize);
      const letters = [...fullSequence];
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      const grid: string[][] = [];
      for (let r = 0; r < activeSize; r++) {
        grid.push(letters.slice(r * activeSize, (r + 1) * activeSize));
      }
      setAlphabetLetters(grid);
      setAlphabetIndex(0);
      setCurrentLetterTarget(fullSequence[0]);
    } else {
      // Standard / Reverse / Fading / Rotating
      const gen = generateSchulteGrid(activeSize, activeMode === 'reverse');
      setStandardNumbers(gen.grid);
      setCurrentTarget(activeMode === 'reverse' ? activeSize * activeSize : 1);
    }

    // Refresh saved personal best for current config
    const saved = localStorage.getItem(`be_schulte_best_${activeMode}_${activeSize}`);
    setPersonalBest(saved ? parseFloat(saved) : null);

    // Phantom Fading timer: cells fade after 2.5 seconds
    if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current);
    const willFade = activeMode === 'fading' || (isInfinity && [17, 19, 20, 22].includes(effectiveLevel));
    if (willFade) {
      phantomTimerRef.current = setTimeout(() => {
        setIsPhantomFaded(true);
      }, 2500);
    }

    // Setup active timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (useAppStore.getState().isGamePaused) return;

      const sec = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(sec);

      // Handle custom countdown time-out
      if (isCustomCountdown && sec >= countdownLimitSec) {
        handleTimeOut();
        return;
      }

      // Rotation timer
      const shouldRotate = mode === 'rotating' || (isInfinity && [18, 19, 21, 22].includes(effectiveLevel));
      if (shouldRotate && sec > 0 && sec % rotateInterval === 0) {
        setRotationDeg(prev => prev + 90);
      }
    }, 1000);
  };

  useEffect(() => {
    initBoard();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current);
    };
  }, [mode, gridSize, alphabetType]);

  // Handle Round or Game Finish
  const handleRoundFinish = (wasTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current);

    const finalTime = Math.max(1, elapsedSec);
    const roundResult: RoundResult = {
      round: currentRound,
      timeSpentSec: finalTime,
      accuracy: wasTimeout ? Math.min(accuracy, 60) : accuracy,
      pace: currentPace,
      score: currentRoundScore,
      missClicks,
      hintCount
    };

    // Update Personal Best if single round or better
    const prevBest = personalBest;
    if (!wasTimeout && (prevBest === null || finalTime < prevBest)) {
      localStorage.setItem(personalBestKey, String(finalTime));
      setPersonalBest(finalTime);
    }

    if (currentRound < totalRounds) {
      // Advance to next round with brief intermission
      playSound('correct');
      setRoundResults(prev => [...prev, roundResult]);
      setRoundTransition({ show: true, roundDone: currentRound });
    } else {
      // Entire session finished!
      playSound('victory');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      const allRounds = [...roundResults, roundResult];
      const aggregateScore = allRounds.reduce((sum, r) => sum + r.score, 0);
      const aggregateAccuracy = Math.round(allRounds.reduce((sum, r) => sum + r.accuracy, 0) / allRounds.length);
      const totalTimeSpent = allRounds.reduce((sum, r) => sum + r.timeSpentSec, 0);
      const totalXp = Math.round(aggregateScore / 8) + 25 * totalRounds;

      // Record into global store with DDA evaluation
      recordAttempt({
        id: `att-${Date.now()}`,
        exerciseSlug: 'schulte-table',
        score: aggregateScore,
        accuracyRate: aggregateAccuracy,
        timeSpentSec: totalTimeSpent,
        xpEarned: totalXp,
        level: playedLevelRef.current,
        rawMetricsJson: {
          ...getRawMetricsJson(),
          mode,
          variantCode: mode === 'gorbov' ? 'GORBOV_RED_BLACK' : undefined
        }
      });

      setRoundResults(allRounds);
      setIsFinished(true);
    }
  };

  const handleTimeOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('wrong');
    handleRoundFinish(true);
  };

  const advanceNextRound = () => {
    setRoundTransition(null);
    setCurrentRound(r => r + 1);
    initBoard();
  };

  // Trigger brief cell effect
  const triggerCellEffect = (key: string, type: 'correct' | 'wrong') => {
    setClickEffects(prev => ({ ...prev, [key]: type }));
    setTimeout(() => {
      setClickEffects(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 300);
  };

  // Handle Standard / Reverse Click
  const handleStandardCellClick = (num: number, key: string) => {
    if (isFinished || foundKeys.has(key)) return;

    const isCorrect = num === currentTarget;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickTimeRef.current));
    lastClickTimeRef.current = now;
    setAutoRadarActive(null);

    emitTrialEvent({
      exerciseSlug: 'schulte-table',
      level: effectiveLevel,
      relationId: mode === 'reverse' ? 'ORDER_SEQUENCE' : effectiveLevel >= 10 ? 'SPATIAL_TRANSFORM' : 'TARGET_POSITION',
      entities: { target: String(currentTarget), position: key },
      stateBefore: 'searching',
      stateAfter: isCorrect ? 'target_found' : 'error_penalized',
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('click');
      triggerCellEffect(key, 'correct');
      setFoundKeys(prev => new Set([...prev, key]));
      
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const isReverse = mode === 'reverse';
      const isEnd = isReverse ? currentTarget === 1 : currentTarget === gridSize * gridSize;

      if (isEnd) {
        handleRoundFinish();
      } else {
        setCurrentTarget(prev => (isReverse ? prev - 1 : prev + 1));
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);

      // Track wrong click into centralized wrong answers history
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: effectiveLevel,
        questionContext: {
          schulteMode: mode,
          gridSize
        },
        correctAnswer: {
          code: String(currentTarget),
          label: `Mục tiêu ${isRomanMode ? numberToRoman(currentTarget) : currentTarget}`
        },
        userAnswer: {
          code: String(num),
          label: `Bấm nhầm ô số ${isRomanMode ? numberToRoman(num) : num}`
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  // Handle Alphabet Click
  const handleAlphabetCellClick = (letter: string, key: string) => {
    if (isFinished || foundKeys.has(key)) return;

    const fullSequence = getAlphabetSequence(alphabetType, gridSize * gridSize);
    const expectedLetter = fullSequence[alphabetIndex];
    const isCorrect = letter === expectedLetter;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickTimeRef.current));
    lastClickTimeRef.current = now;
    setAutoRadarActive(null);

    if (isCorrect) {
      playSound('click');
      triggerCellEffect(key, 'correct');
      setFoundKeys(prev => new Set([...prev, key]));

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const nextIndex = alphabetIndex + 1;
      if (nextIndex >= fullSequence.length) {
        handleRoundFinish();
      } else {
        setAlphabetIndex(nextIndex);
        setCurrentLetterTarget(fullSequence[nextIndex]);
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);

      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: effectiveLevel,
        questionContext: {
          schulteMode: mode,
          gridSize
        },
        correctAnswer: {
          code: expectedLetter,
          label: `Mục tiêu Chữ ${expectedLetter}`
        },
        userAnswer: {
          code: letter,
          label: `Bấm nhầm chữ ${letter}`
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  // Handle Gorbov Click
  const handleGorbovCellClick = (cell: GorbovCell, key: string) => {
    if (isFinished || foundKeys.has(key)) return;

    const isCorrect = cell.color === gorbovTarget.color && cell.num === gorbovTarget.num;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickTimeRef.current));
    lastClickTimeRef.current = now;
    setAutoRadarActive(null);

    if (isCorrect) {
      playSound('click');
      triggerCellEffect(key, 'correct');
      setFoundKeys(prev => new Set([...prev, key]));

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      if (gorbovTarget.color === 'red') {
        const nextBlack = 25 - gorbovTarget.num;
        if (nextBlack >= 1) {
          setGorbovTarget({ color: 'black', num: nextBlack });
        } else {
          handleRoundFinish();
        }
      } else {
        const nextRed = (25 - gorbovTarget.num) + 1;
        if (nextRed <= 25) {
          setGorbovTarget({ color: 'red', num: nextRed });
        } else {
          handleRoundFinish();
        }
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);

      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: effectiveLevel,
        questionContext: {
          schulteMode: mode,
          gridSize
        },
        correctAnswer: {
          code: `${gorbovTarget.color.toUpperCase()}_${gorbovTarget.num}`,
          label: `Mục tiêu: ${gorbovTarget.color === 'red' ? 'ĐỎ' : 'ĐEN'} ${gorbovTarget.num}`
        },
        userAnswer: {
          code: `${cell.color.toUpperCase()}_${cell.num}`,
          label: `Bấm nhầm: ${cell.color === 'red' ? 'ĐỎ' : 'ĐEN'} ${cell.num}`
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  // Find target cell coordinates
  const getTargetCellKey = (): string | null => {
    if (mode === 'gorbov') {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const cell = gorbovGrid[r]?.[c];
          if (cell && cell.color === gorbovTarget.color && cell.num === gorbovTarget.num) {
            return `g-${r}-${c}`;
          }
        }
      }
    } else if (mode === 'alphabet') {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (alphabetLetters[r]?.[c] === currentLetterTarget) {
            return `a-${r}-${c}`;
          }
        }
      }
    } else {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (standardNumbers[r]?.[c] === currentTarget) {
            return `${r}-${c}`;
          }
        }
      }
    }
    return null;
  };

  // Manual Hint: clicked by user, penalizes -5 pts, increments user hint count (capped at MAX_HINTS_PER_ROUND)
  const triggerUserHint = () => {
    if (isFinished || hintCount >= MAX_HINTS_PER_ROUND) return;
    playSound('click');
    setHintCount(prev => prev + 1);

    const targetKey = getTargetCellKey();
    if (targetKey) {
      setHintActive(targetKey);
      setTimeout(() => setHintActive(null), 1200);
    }
  };

  // Auto Radar: triggers silently after 6 seconds of idle ONLY when autoHintEnabled is true!
  useEffect(() => {
    if (!autoHintEnabled || isFinished || isGamePaused) {
      if (autoRadarActive) setAutoRadarActive(null);
      return;
    }
    const autoPingInterval = setInterval(() => {
      if (Date.now() - lastClickTimeRef.current >= 6000 && !hintActive && !autoRadarActive) {
        const targetKey = getTargetCellKey();
        if (targetKey) {
          setAutoRadarActive(targetKey);
        }
      }
    }, 1000);
    return () => clearInterval(autoPingInterval);
  }, [autoHintEnabled, isFinished, isGamePaused, hintActive, autoRadarActive, mode, currentTarget, currentLetterTarget, gorbovTarget]);

  // Share / Export handlers
  const handleCopyResults = () => {
    const text = `🧠 Bảng Schulte (${mode.toUpperCase()} ${gridSize}×${gridSize})
⏱️ Thời gian: ${elapsedSec}s
⚡ Tốc độ: ${currentPace}s/số
🎯 Chính xác: ${accuracy}%
🏆 Điểm: +${currentRoundScore}
🔥 Chuỗi cao nhất: ${bestStreak}`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const data = {
      exercise: 'Schulte Table',
      mode,
      gridSize,
      totalRounds,
      roundResults,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schulte_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Progress percentage of current board
  const progressPercent = Math.min(100, Math.round((currentFoundCount / totalItems) * 100));

  const isFading = mode === 'fading' || (isInfinity && [17, 19, 20, 22].includes(effectiveLevel));

  // Aggregate results calculations for session end
  const aggregateScore = useMemo(() => {
    if (roundResults.length === 0) return currentRoundScore;
    return roundResults.reduce((s, r) => s + r.score, 0);
  }, [roundResults, currentRoundScore]);

  const aggregateAccuracy = useMemo(() => {
    if (roundResults.length === 0) return accuracy;
    return Math.round(roundResults.reduce((s, r) => s + r.accuracy, 0) / roundResults.length);
  }, [roundResults, accuracy]);

  const aggregateTotalTime = useMemo(() => {
    if (roundResults.length === 0) return elapsedSec;
    return roundResults.reduce((s, r) => s + r.timeSpentSec, 0);
  }, [roundResults, elapsedSec]);

  const aggregatePace = useMemo(() => {
    if (roundResults.length === 0) return currentPace;
    return +(roundResults.reduce((s, r) => s + r.pace, 0) / roundResults.length).toFixed(2);
  }, [roundResults, currentPace]);

  const totalEarnedXp = Math.round(aggregateScore / 8) + 25 * totalRounds;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 animate-fade-in pb-24">
      {/* Multi-Round Session & Infinity Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Multi-round pill */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Vòng {currentRound} / {totalRounds}
            </span>
          </div>
          {isCustom && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              Chế Độ Tùy Chỉnh
            </span>
          )}
        </div>

        {/* Infinity Level Badge */}
        {isInfinity && (
          <div className="rounded-2xl px-3.5 py-1.5 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-md backdrop-blur-md flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white text-[11px] truncate max-w-[260px] sm:max-w-none">
              {effectiveLevel === 13 ? 'English Alpha-Schulte (A-Y Latin 5×5)' :
               effectiveLevel === 14 ? 'Color-Code Gorbov Schulte (Đỏ 1-25 / Đen 24-1 7×7)' :
               effectiveLevel === 15 ? 'Roman Numerals Schulte (Số La Mã I-XXV 5×5)' :
               effectiveLevel === 16 ? 'Reverse Schulte (49→1 7×7)' :
               effectiveLevel === 17 ? 'Phantom Fading Schulte (6×6)' :
               effectiveLevel === 18 ? 'Fast Rotating Schulte (Xoay 90° mỗi 8s)' :
               effectiveLevel === 19 ? 'Rotating + Fading Combo (6×6 vừa xoay vừa ẩn)' :
               effectiveLevel === 20 ? 'Fading Latin Alphabet (5×5 Chữ Latin ẩn dần)' :
               effectiveLevel === 21 ? 'Rotating Gorbov Schulte (7×7 Gorbov xoay không gian)' :
               'Quantum Chaos Schulte (7×7 Vô cực xoay 5s + ẩn ô)'}
            </span>
          </div>
        )}
      </div>

      {/* Top Controls & Mode Switcher Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Modes Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'standard', label: 'Cơ bản', icon: Layers },
              { id: 'gorbov', label: 'Gorbov Đỏ-Đen', icon: Zap },
              { id: 'reverse', label: 'Số giảm dần', icon: RotateCcw },
              { id: 'alphabet', label: 'Chữ cái', icon: Target },
              { id: 'rotating', label: 'Tự xoay', icon: RotateCcw },
              { id: 'fading', label: 'Ẩn hiện (Ghost)', icon: Eye }
            ].map(item => {
              const Icon = item.icon;
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    safeAlterBoard(() => {
                      setMode(item.id as SchulteMode);
                      setRotationDeg(0); // Reset rotation deg when switching mode
                      if (item.id === 'gorbov') setGridSize(7);
                    }, `Chuyển sang biến thể "${item.label}"`);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Config Toggles */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Alphabet Type selector when in alphabet mode */}
            {mode === 'alphabet' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    safeAlterBoard(() => setAlphabetType('vi'), 'Đổi sang bộ chữ Tiếng Việt');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    alphabetType === 'vi'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => {
                    safeAlterBoard(() => setAlphabetType('latin'), 'Đổi sang bộ chữ Latin (A-Y)');
                  }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    alphabetType === 'latin'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Latin
                </button>
              </div>
            )}

            {/* Grid Size selector: supports 3x3 to 9x9 or Fixed Badge for Gorbov */}
            {mode === 'gorbov' ? (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="text-red-500 font-black mr-1">7×7</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">(Gorbov 49 ô cố định)</span>
              </div>
            ) : (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-[200px] sm:max-w-none">
                {[3, 4, 5, 6, 7, 8, 9].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      safeAlterBoard(() => setGridSize(s), `Đổi kích thước lưới thành ${s}×${s}`);
                    }}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      gridSize === s
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            )}

            {/* Classic Mode Toggle */}
            <button
              onClick={() => setIsClassicMode(prev => !prev)}
              title={isClassicMode ? 'Đang bật Thử Thách Cổ Điển (Không làm mờ số đã bấm)' : 'Bật Thử Thách Cổ Điển (Giữ nguyên toàn bộ số để luyện tầm nhìn ngoại vi chuẩn)'}
              className={`px-2.5 py-1.5 rounded-xl transition-all border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isClassicMode 
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30' 
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cổ Điển</span>
            </button>

            {/* Center Focus Toggle */}
            <button
              onClick={() => setShowCenterGuide(prev => !prev)}
              title={showCenterGuide ? 'Tắt tâm hội tụ' : 'Bật tâm hội tụ (Mở rộng thị giác ngoại biên)'}
              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                showCenterGuide 
                  ? 'bg-amber-500/10 border-amber-400/40 text-amber-600 dark:text-amber-400' 
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Auto-Hint Toggle */}
            <button
              onClick={() => {
                playSound('click');
                setAutoHintEnabled(!autoHintEnabled);
              }}
              title={autoHintEnabled ? 'Tự động gợi ý: ĐANG BẬT (Bấm để TẮT hoàn toàn)' : 'Tự động gợi ý: ĐANG TẮT (Bấm để BẬT)'}
              className={`p-2 rounded-xl transition-all border cursor-pointer ${
                autoHintEnabled 
                  ? 'bg-amber-500/15 border-amber-400 text-amber-600 dark:text-amber-400 shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-4 h-4" />
            </button>

            {/* Reset Board Button */}
            <button
              onClick={() => {
                safeAlterBoard(() => initBoard(), 'Khởi động lại bàn hiện tại');
              }}
              title="Khởi động lại bảng"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main HUD Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Next Target Pill */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Mục tiêu tiếp theo</span>
            <Target className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="mt-2">
            {mode === 'gorbov' ? (
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase text-white tracking-wider ${
                  gorbovTarget.color === 'red' 
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse shadow-md shadow-red-500/30' 
                    : 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 animate-pulse shadow-md'
                }`}>
                  {gorbovTarget.color === 'red' ? 'ĐỎ TĂNG' : 'ĐEN GIẢM'}
                </span>
                <span className={`text-2xl font-black ${
                  gorbovTarget.color === 'red' ? 'text-red-600' : 'text-slate-900 dark:text-white'
                }`}>
                  {gorbovTarget.num}
                </span>
              </div>
            ) : mode === 'alphabet' ? (
              <div className="text-3xl font-black text-brand-600 dark:text-brand-400">
                Chữ {currentLetterTarget}
              </div>
            ) : (
              <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">
                <span>{isRomanMode ? numberToRoman(currentTarget) : currentTarget}</span>
                <span className="text-xs font-semibold text-slate-400">/ {totalItems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Timer: Countdown vs Target Time HUD */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">
              {isCustomCountdown ? 'Đếm ngược' : 'Thời gian'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl sm:text-3xl font-black ${
                isCustomCountdown && remainingCountdownSec <= 5
                  ? 'text-rose-600 animate-pulse'
                  : 'text-slate-800 dark:text-white'
              }`}>
                {isCustomCountdown ? `${remainingCountdownSec}s` : `${elapsedSec}s`}
              </span>
              {!isCustomCountdown && (
                <span className="text-[11px] font-bold text-slate-400">
                  / {targetTimeSec}s
                </span>
              )}
            </div>

            {/* Target time warning badge if overtime */}
            {!isCustomCountdown && elapsedSec > targetTimeSec ? (
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Quá mốc mục tiêu (+{elapsedSec - targetTimeSec}s)
              </span>
            ) : personalBest !== null ? (
              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3" /> Kỷ lục: {personalBest}s
              </span>
            ) : null}
          </div>

          {/* Circular Visual Indicator */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-brand-500 transition-all duration-300 stroke-current"
                strokeWidth="3.5"
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-700 dark:text-slate-300">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Real-time Pace & Streak */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tốc độ quét</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                {currentPace > 0 ? `${currentPace}s` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">/ 1 ô số</span>
            </div>
            {currentStreak >= 3 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-black animate-bounce">
                <Flame className="w-3 h-3 fill-orange-500" /> {currentStreak}
              </span>
            )}
          </div>
        </div>

        {/* Accuracy & Hint helper */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Độ chính xác</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {accuracy}%
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Lỗi: {missClicks}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={triggerUserHint}
              disabled={isFinished || hintCount >= MAX_HINTS_PER_ROUND}
              title={
                hintCount >= MAX_HINTS_PER_ROUND
                  ? 'Đã dùng hết 3 lượt gợi ý cho ván này'
                  : `Gợi ý ô tiếp theo (Dùng gợi ý bị trừ nhẹ 5 điểm, còn ${MAX_HINTS_PER_ROUND - hintCount} lượt)`
              }
              className={`p-2 sm:px-3 sm:py-2 rounded-2xl transition-all btn-press flex items-center gap-1.5 shadow-sm ${
                hintCount >= MAX_HINTS_PER_ROUND
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 cursor-pointer'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold">
                {hintCount >= MAX_HINTS_PER_ROUND
                  ? 'Hết gợi ý'
                  : `Gợi ý (${MAX_HINTS_PER_ROUND - hintCount}/${MAX_HINTS_PER_ROUND})`}
              </span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setAutoHintEnabled(!autoHintEnabled);
              }}
              title={autoHintEnabled ? 'Tự động gợi ý khi dừng lâu đang BẬT. Bấm để TẮT hoàn toàn' : 'Tự động gợi ý khi dừng lâu đang TẮT. Bấm để BẬT'}
              className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                autoHintEnabled
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-2.5 h-2.5" />
              <span>{autoHintEnabled ? 'Tự gợi ý: BẬT' : 'Tự gợi ý: TẮT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-brand-50/70 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>
            {mode === 'gorbov'
              ? 'Quy luật Gorbov: Bấm ĐỎ tăng dần (1→25) xen kẽ ĐEN giảm dần (24→1) liên tục!'
              : mode === 'reverse'
              ? `Số giảm dần: Quét ngược từ ${gridSize * gridSize} về 1. Cố định tâm nhìn để bao quát!`
              : mode === 'alphabet'
              ? (gridSize * gridSize > (alphabetType === 'vi' ? VI_ALPHABET.length : LATIN_ALPHABET.length)
                  ? `Lưới ${gridSize}×${gridSize} (${gridSize * gridSize} ô) vượt quá bảng chữ cái: Sau chữ ${alphabetType === 'vi' ? 'Y' : 'Z'}, vòng lặp tiếp theo được đánh số A1, B1, C1...`
                  : alphabetType === 'latin'
                  ? `Bảng chữ cái Latin (${gridSize * gridSize} ô): Tìm chữ từ A → B → C... theo thứ tự!`
                  : `Bảng chữ cái Tiếng Việt (${gridSize * gridSize} ô): Tìm chữ từ A → Ă → Â → B... theo thứ tự!`)
              : mode === 'rotating'
              ? `Bảng tự xoay 90° sau mỗi ${rotateInterval} giây để rèn luyện tái định hướng không gian thị giác.`
              : mode === 'fading'
              ? 'Biến thể Ghost Ẩn hiện: Sau 2.5s đầu các ô sẽ ẩn mờ dần, yêu cầu bạn ghi nhớ bản đồ không gian và quét định vị.'
              : 'Quy tắc: Giữ ánh mắt nhìn vào giao điểm tâm lưới. Dùng tầm nhìn ngoại vi mở rộng để nhận diện mục tiêu!'}
          </span>
        </div>
        {showCenterGuide && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg shrink-0">
            <Eye className="w-3 h-3" /> Tâm nhìn ngoại vi
          </span>
        )}
      </div>

      {/* Schulte Grid Matrix Container */}
      <div className="relative w-full max-w-[440px] sm:max-w-[500px] md:max-w-[560px] mx-auto select-none">
        {/* Glow backdrop aura */}
        <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-amber-500/10 rounded-3xl blur-xl opacity-70 pointer-events-none" />

        <div
          className="relative w-full aspect-square bg-[#F5EFE6] dark:bg-slate-800/95 p-3 sm:p-5 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl transition-transform duration-700 ease-in-out grid gap-2 sm:gap-2.5"
          style={{
            gridTemplateColumns: `repeat(${mode === 'gorbov' ? 7 : gridSize}, minmax(0, 1fr))`,
            transform: `rotate(${rotationDeg}deg)`
          }}
        >
          {/* High-contrast precision center fixation reticle (z-30, never washed out) */}
          {showCenterGuide && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-[1.5px] bg-red-500/80 shadow-sm" />
                <div className="absolute h-10 w-[1.5px] bg-red-500/80 shadow-sm" />
                <div className="relative w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.95)] flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>
            </div>
          )}

          {/* Render cells according to mode */}
          {mode === 'gorbov' ? (
            gorbovGrid.map((row, r) =>
              row.map((cell, c) => {
                const key = `g-${r}-${c}`;
                const isFound = foundKeys.has(key);
                const isHint = hintActive === key;
                const isAutoRadar = autoRadarActive === key;
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleGorbovCellClick(cell, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative text-sm sm:text-lg md:text-xl lg:text-2xl shadow-sm cursor-pointer ${
                      isFound
                        ? isClassicMode
                          ? cell.color === 'red'
                            ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/60 cursor-default opacity-90'
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 cursor-default opacity-90'
                          : 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : cell.color === 'red'
                        ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/60 hover:shadow-lg hover:scale-105 active:scale-95'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
                    } ${
                      isAutoRadar ? 'ring-2 ring-amber-400/80 animate-pulse' : ''
                    } ${
                      effect === 'correct' ? 'ring-4 ring-emerald-500 scale-105' : effect === 'wrong' ? 'ring-4 ring-rose-500 animate-pulse' : ''
                    }`}
                  >
                    {cell.num}
                  </button>
                );
              })
            )
          ) : mode === 'alphabet' ? (
            alphabetLetters.map((row, r) =>
              row.map((letter, c) => {
                const key = `a-${r}-${c}`;
                const isFound = foundKeys.has(key);
                const isHint = hintActive === key;
                const isAutoRadar = autoRadarActive === key;
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleAlphabetCellClick(letter, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative shadow-sm cursor-pointer ${
                      gridSize >= 7 ? 'text-xs sm:text-base' : gridSize >= 6 ? 'text-sm sm:text-lg' : gridSize === 5 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'
                    } ${
                      isFound
                        ? isClassicMode
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 cursor-default opacity-90'
                          : 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : isFading && isPhantomFaded
                        ? 'bg-white/80 dark:bg-slate-700/80 text-slate-800/20 dark:text-white/20 border border-slate-200/50 dark:border-slate-600/50 hover:text-slate-800 dark:hover:text-white hover:scale-105'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
                    } ${
                      isAutoRadar ? 'ring-2 ring-amber-400/80 animate-pulse' : ''
                    } ${
                      effect === 'correct' ? 'ring-4 ring-emerald-500 scale-105' : effect === 'wrong' ? 'ring-4 ring-rose-500 animate-pulse' : ''
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )
          ) : (
            standardNumbers.map((row, r) =>
              row.map((num, c) => {
                const key = `${r}-${c}`;
                const isFound = foundKeys.has(key);
                const isHint = hintActive === key;
                const isAutoRadar = autoRadarActive === key;
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleStandardCellClick(num, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative shadow-sm cursor-pointer ${
                      gridSize >= 8
                        ? 'text-xs sm:text-sm md:text-base'
                        : gridSize >= 7
                        ? 'text-xs sm:text-base md:text-xl'
                        : gridSize === 6
                        ? 'text-sm sm:text-lg md:text-2xl'
                        : gridSize === 5
                        ? 'text-base sm:text-2xl md:text-3xl'
                        : 'text-2xl sm:text-4xl md:text-5xl'
                    } ${
                      isFound
                        ? isClassicMode
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 cursor-default opacity-90'
                          : 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : isFading && isPhantomFaded
                        ? 'bg-white/80 dark:bg-slate-700/80 text-slate-800/20 dark:text-white/20 border border-slate-200/50 dark:border-slate-600/50 hover:text-slate-800 dark:hover:text-white hover:scale-105'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
                    } ${
                      isAutoRadar ? 'ring-2 ring-amber-400/80 animate-pulse' : ''
                    } ${
                      effect === 'correct' ? 'ring-4 ring-emerald-500 scale-105' : effect === 'wrong' ? 'ring-4 ring-rose-500 animate-pulse' : ''
                    }`}
                  >
                    {isRomanMode ? numberToRoman(num) : num}
                  </button>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Confirmation Modal when Altering In-Progress Board */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">Xác nhận thay đổi</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {showResetConfirm.message}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Tiếp tục chơi
              </button>
              <button
                onClick={() => {
                  const act = showResetConfirm.action;
                  setShowResetConfirm(null);
                  act();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                Đồng ý đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Round Intermission Modal between rounds */}
      {roundTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-brand-600 dark:text-brand-400">
                Vòng {roundTransition.roundDone} / {totalRounds} Hoàn Tất
              </span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">
                Chuẩn Bị Vòng {roundTransition.roundDone + 1}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thời gian vòng vừa rồi: <strong className="text-slate-800 dark:text-white">{elapsedSec}s</strong> • Tốc độ: <strong className="text-slate-800 dark:text-white">{currentPace}s/ô</strong>
              </p>
            </div>
            <button
              onClick={advanceNextRound}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 btn-press cursor-pointer"
            >
              <span>Vào Vòng Tiếp Theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Session Summary & Upgraded Results Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 text-center shadow-2xl space-y-4 sm:space-y-5 animate-scale-up my-auto">
            
            {/* Header Icon */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xl">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              </div>
            </div>

            {/* Weekly Challenge Completed Banner */}
            {lastChallengeBonus && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-amber-400 text-slate-800 dark:text-white rounded-2xl shadow-lg text-left animate-bounce">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Thử Thách Tuần Hoàn Thành!
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm">
                    +{lastChallengeBonus.bonusXp} XP
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {lastChallengeBonus.title}
                </p>
              </div>
            )}

            {/* DDA Level-Up Celebration Banner */}
            {lastLevelUpEvent && lastLevelUpEvent.exerciseSlug === 'schulte-table' && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl shadow-lg border border-amber-300/40 text-left animate-bounce">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-200 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-100 block">
                      Thăng Cấp Tự Động (DDA Engine)
                    </span>
                    <h4 className="text-base font-black text-white">
                      🎉 Chúc mừng bạn đã lên Cấp {lastLevelUpEvent.toLevel}!
                    </h4>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {totalRounds > 1 ? `Tổng Kết Phiên (${totalRounds} Vòng)` : 'Hoàn Thành Bảng Schulte'}
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                  +{aggregateScore} Điểm
                </h3>
                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  +{totalEarnedXp} XP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quy đổi: (Điểm/8) + {25 * totalRounds} XP chuẩn phiên
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Chế độ: <strong className="text-brand-600 dark:text-brand-400 uppercase">{mode}</strong> ({gridSize}×{gridSize}) • Cấp {playedLevelRef.current}
              </p>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Tổng thời gian</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {aggregateTotalTime}s
                </p>
                {personalBest !== null && aggregateTotalTime <= personalBest && (
                  <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5 mt-0.5">
                    <Sparkles className="w-3 h-3" /> KỶ LỤC MỚI!
                  </span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Tốc độ quét TB</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {aggregatePace}s
                </p>
                <span className="text-[10px] text-slate-400 font-medium">mỗi ô mục tiêu</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Chính xác TB</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {aggregateAccuracy}%
                </p>
                <span className="text-[10px] text-slate-400 font-medium">{roundResults.reduce((s, r) => s + r.missClicks, 0)} lần bấm lệch</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Chuỗi chuẩn</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {bestStreak} ô
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Gợi ý dùng: {roundResults.reduce((s, r) => s + (r.hintCount || 0), 0)}</span>
              </div>
            </div>

            {/* Multi-round chips breakdown if > 1 round */}
            {roundResults.length > 1 && (
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Chi tiết từng vòng ({roundResults.length} lượt):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {roundResults.map(r => (
                    <div key={r.round} className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-xs shrink-0 flex items-center gap-2">
                      <span className="font-bold text-slate-600 dark:text-slate-300">V{r.round}:</span>
                      <span className="font-mono text-slate-800 dark:text-white font-bold">{r.timeSpentSec}s</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{r.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cognitive Evaluation Badge */}
            <div className="p-3 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 rounded-2xl border border-brand-200 dark:border-brand-800 text-xs text-left">
              <span className="font-bold text-brand-700 dark:text-brand-300">Đánh giá khả năng thị giác:</span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {aggregatePace < 0.8
                  ? '⚡ Thị giác ngoại biên phi thường! Bạn có tốc độ quét hàng đầu, rất lý tưởng để đọc sách tốc độ cao.'
                  : aggregatePace < 1.4
                  ? '✨ Khả năng bao quát trường nhìn rất tốt! Tiếp tục duy trì mắt ở tâm để phản xạ ngày càng nhanh.'
                  : '🎯 Khởi đầu vững chắc. Hãy hạn chế đảo mắt và cố định tầm nhìn ở điểm trung tâm.'}
              </p>
            </div>

            {/* Share & Export Tools */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyResults}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {isCopied ? 'Đã sao chép!' : 'Chia sẻ kết quả'}
              </button>

              <button
                onClick={handleDownloadJson}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Tải báo cáo JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>

            {/* Predictable Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  if (activeWorkoutRoutine) {
                    nextWorkoutStep();
                  } else if (lastLevelUpEvent && lastLevelUpEvent.exerciseSlug === 'schulte-table') {
                    const nextLvl = lastLevelUpEvent.toLevel;
                    setExerciseLevel('schulte-table', nextLvl);
                    clearLevelUpEvent();
                    setCurrentRound(1);
                    setRoundResults([]);
                    const targetMode: SchulteMode = nextLvl === 9 || nextLvl === 14 || nextLvl === 21 ? 'gorbov' : (nextLvl >= 13 ? (nextLvl === 13 || nextLvl === 20 ? 'alphabet' : nextLvl === 18 ? 'rotating' : nextLvl === 17 || nextLvl === 19 ? 'fading' : 'standard') : 'standard');
                    const targetSize = nextLvl === 1 ? 3 : nextLvl === 2 ? 4 : nextLvl <= 4 ? 5 : nextLvl <= 6 ? 6 : nextLvl <= 9 ? 7 : nextLvl <= 11 ? 8 : 9;
                    setMode(targetMode);
                    setGridSize(targetSize);
                    initBoard(targetMode, targetSize);
                  } else {
                    setActiveGameSlug(null);
                  }
                }}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press cursor-pointer"
              >
                <span>
                  {activeWorkoutRoutine
                    ? (() => {
                        const nextStepIndex = (useAppStore.getState().currentWorkoutStepIndex ?? 0) + 1;
                        if (nextStepIndex >= activeWorkoutRoutine.items.length) {
                          return 'Hoàn tất lộ trình luyện tập! 🎉';
                        }
                        const nextItem = activeWorkoutRoutine.items[nextStepIndex];
                        const nextTitle = nextItem
                          ? EXERCISES_METADATA.find(e => e.slug === nextItem.exerciseSlug)?.title || 'Bài kế tiếp'
                          : 'Hoàn thành';
                        return `Chặng tiếp theo (${nextStepIndex + 1}/${activeWorkoutRoutine.items.length}): ${nextTitle}`;
                      })()
                    : lastLevelUpEvent && lastLevelUpEvent.exerciseSlug === 'schulte-table'
                    ? `🎉 Luyện Cấp ${lastLevelUpEvent.toLevel} Ngay`
                    : 'Về Trang Cấp Độ & Thiết Lập'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setCurrentRound(1);
                  setRoundResults([]);
                  initBoard();
                }}
                className="w-full py-2.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Luyện lại phiên này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};