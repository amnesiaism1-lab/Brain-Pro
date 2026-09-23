import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateSchulteGrid, calculateGameScore } from '@brain-exercises/shared';
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
  Info
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

export type SchulteMode = 'standard' | 'gorbov' | 'reverse' | 'alphabet' | 'fading' | 'rotating';

interface GorbovCell {
  num: number;
  color: 'red' | 'black';
}

export const SchulteTableGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound, 
    soundEnabled, 
    setSoundEnabled,
    recordAttempt,
    activeWorkoutRoutine,
    nextWorkoutStep
  } = useAppStore();

  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const lastClickTimeRef = useRef<number>(Date.now());

  const effectiveLevel = getExerciseLevel('schulte-table') || currentLevel;

  // Determine initial mode based on level progression
  const initialMode: SchulteMode = useMemo(() => {
    if (effectiveLevel === 8) return 'reverse';
    if (effectiveLevel === 9) return 'gorbov';
    if (effectiveLevel === 10) return 'rotating';
    if (effectiveLevel === 11) return 'fading';
    return 'standard';
  }, [effectiveLevel]);

  // Determine initial size
  const initialSize = useMemo(() => {
    if (effectiveLevel <= 2) return 3;
    if (effectiveLevel <= 4) return 5;
    if (effectiveLevel <= 6) return 6;
    if (effectiveLevel <= 9) return 7;
    return 7;
  }, [effectiveLevel]);

  // Active configurations
  const [mode, setMode] = useState<SchulteMode>(initialMode);
  const [gridSize, setGridSize] = useState<number>(initialSize);
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(true);
  const [hintActive, setHintActive] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState<number>(0);

  // Game board states
  const [standardNumbers, setStandardNumbers] = useState<number[][]>([]);
  const [alphabetLetters, setAlphabetLetters] = useState<string[][]>([]);
  const [gorbovGrid, setGorbovGrid] = useState<GorbovCell[][]>([]);
  
  // Target tracking
  const [currentTarget, setCurrentTarget] = useState<number>(1);
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

  // Personal Best key
  const personalBestKey = `be_schulte_best_${mode}_${gridSize}`;
  const [personalBest, setPersonalBest] = useState<number | null>(() => {
    const saved = localStorage.getItem(personalBestKey);
    return saved ? parseFloat(saved) : null;
  });

  // Calculate total items
  const totalItems = useMemo(() => {
    if (mode === 'gorbov') return 49;
    if (mode === 'alphabet') return Math.min(26, gridSize * gridSize);
    return gridSize * gridSize;
  }, [mode, gridSize]);

  // Items remaining & found count
  const currentFoundCount = useMemo(() => {
    return foundKeys.size;
  }, [foundKeys]);

  // Average pace: seconds per found item
  const currentPace = useMemo(() => {
    if (currentFoundCount === 0 || elapsedSec === 0) return 0;
    return +(elapsedSec / currentFoundCount).toFixed(2);
  }, [currentFoundCount, elapsedSec]);

  // Time limit for scoring
  const timeLimit = useMemo(() => {
    if (mode === 'gorbov') return 120;
    if (gridSize === 3) return 25;
    if (gridSize === 4) return 40;
    if (gridSize === 5) return 60;
    if (gridSize === 6) return 80;
    return 100;
  }, [mode, gridSize]);

  // Accuracy calculation
  const totalClicks = currentFoundCount + missClicks;
  const accuracy = totalClicks > 0 ? Math.round((currentFoundCount / totalClicks) * 100) : 100;

  // Final score
  const score = useMemo(() => {
    return calculateGameScore({
      level: effectiveLevel,
      accuracyRate: accuracy,
      timeLimitSec: timeLimit,
      timeSpentSec: elapsedSec
    });
  }, [effectiveLevel, accuracy, timeLimit, elapsedSec]);

  // Initialize or reset game board
  const initBoard = () => {
    setFoundKeys(new Set());
    setMissClicks(0);
    setCurrentStreak(0);
    setElapsedSec(0);
    setRotationDeg(0);
    setIsFinished(false);
    setClickEffects({});
    setHintActive(null);
    setHintCount(0);
    setIsCopied(false);

    startTimeRef.current = Date.now();

    if (mode === 'gorbov') {
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
    } else if (mode === 'alphabet') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, Math.min(26, gridSize * gridSize)).split('');
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      const grid: string[][] = [];
      for (let r = 0; r < gridSize; r++) {
        grid.push(letters.slice(r * gridSize, (r + 1) * gridSize));
      }
      setAlphabetLetters(grid);
      setCurrentLetterTarget('A');
    } else {
      // Standard / Reverse / Fading / Rotating
      const gen = generateSchulteGrid(gridSize, mode === 'reverse');
      setStandardNumbers(gen.grid);
      setCurrentTarget(mode === 'reverse' ? gridSize * gridSize : 1);
    }

    // Refresh saved personal best for current config
    const saved = localStorage.getItem(`be_schulte_best_${mode}_${gridSize}`);
    setPersonalBest(saved ? parseFloat(saved) : null);

    // Setup timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const sec = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(sec);

      if (mode === 'rotating' && sec > 0 && sec % 12 === 0) {
        setRotationDeg(prev => prev + 90);
      }
    }, 1000);
  };

  useEffect(() => {
    initBoard();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, gridSize]);

  // Handle completion
  const handleGameFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
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

    // Check personal best
    const finalTime = Math.max(1, elapsedSec);
    const prevBest = personalBest;
    if (prevBest === null || finalTime < prevBest) {
      localStorage.setItem(personalBestKey, String(finalTime));
      setPersonalBest(finalTime);
    }

    // Record into global store
    recordAttempt({
      id: `att-${Date.now()}`,
      exerciseSlug: 'schulte-table',
      score,
      accuracyRate: accuracy,
      timeSpentSec: finalTime,
      xpEarned: Math.round(score / 8) + 25,
      level: effectiveLevel,
      rawMetricsJson: getRawMetricsJson()
    });
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
        handleGameFinish();
      } else {
        setCurrentTarget(prev => (isReverse ? prev - 1 : prev + 1));
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);
    }
  };

  // Handle Alphabet Click
  const handleAlphabetCellClick = (letter: string, key: string) => {
    if (isFinished || foundKeys.has(key)) return;

    if (letter === currentLetterTarget) {
      playSound('click');
      triggerCellEffect(key, 'correct');
      setFoundKeys(prev => new Set([...prev, key]));

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const nextCharCode = currentLetterTarget.charCodeAt(0) + 1;
      const targetLettersLength = Math.min(26, gridSize * gridSize);
      const lastCharCode = 65 + targetLettersLength - 1;

      if (nextCharCode > lastCharCode) {
        handleGameFinish();
      } else {
        setCurrentLetterTarget(String.fromCharCode(nextCharCode));
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);
    }
  };

  // Handle Gorbov Click
  const handleGorbovCellClick = (cell: GorbovCell, key: string) => {
    if (isFinished || foundKeys.has(key)) return;

    if (cell.color === gorbovTarget.color && cell.num === gorbovTarget.num) {
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
          handleGameFinish();
        }
      } else {
        const nextRed = (25 - gorbovTarget.num) + 1;
        if (nextRed <= 25) {
          setGorbovTarget({ color: 'red', num: nextRed });
        } else {
          handleGameFinish();
        }
      }
    } else {
      playSound('wrong');
      triggerCellEffect(key, 'wrong');
      setMissClicks(prev => prev + 1);
      setCurrentStreak(0);
    }
  };

  // Hint generator
  const triggerHint = () => {
    if (isFinished) return;
    playSound('click');
    setHintCount(prev => prev + 1);

    if (mode === 'gorbov') {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const cell = gorbovGrid[r][c];
          if (cell.color === gorbovTarget.color && cell.num === gorbovTarget.num) {
            setHintActive(`g-${r}-${c}`);
            setTimeout(() => setHintActive(null), 1200);
            return;
          }
        }
      }
    } else if (mode === 'alphabet') {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (alphabetLetters[r][c] === currentLetterTarget) {
            setHintActive(`a-${r}-${c}`);
            setTimeout(() => setHintActive(null), 1200);
            return;
          }
        }
      }
    } else {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (standardNumbers[r]?.[c] === currentTarget) {
            setHintActive(`${r}-${c}`);
            setTimeout(() => setHintActive(null), 1200);
            return;
          }
        }
      }
    }
  };

  // Share / Export handlers
  const handleCopyResults = () => {
    const text = `🧠 Bảng Schulte (${mode.toUpperCase()} ${gridSize}x${gridSize})
⏱️ Thời gian: ${elapsedSec}s
⚡ Tốc độ: ${currentPace}s/số
🎯 Chính xác: ${accuracy}%
🏆 Điểm: +${score}
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
      elapsedSec,
      accuracy,
      score,
      bestStreak,
      pace: currentPace,
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

  // Progress percentage
  const progressPercent = Math.min(100, Math.round((currentFoundCount / totalItems) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6 animate-fade-in pb-24">
      {/* Top Controls & Mode Switcher Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Modes Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'standard', label: 'Cơ bản', icon: Layers },
              { id: 'gorbov', label: 'Gorbov Đỏ-Đen', icon: Zap },
              { id: 'reverse', label: 'Đếm lùi', icon: RotateCcw },
              { id: 'alphabet', label: 'Chữ cái', icon: Target },
              { id: 'rotating', label: 'Tự xoay', icon: RotateCcw },
              { id: 'fading', label: 'Ẩn hiện', icon: Eye }
            ].map(item => {
              const Icon = item.icon;
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMode(item.id as SchulteMode);
                    if (item.id === 'gorbov') setGridSize(7);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
            {/* Grid Size selector if not Gorbov */}
            {mode !== 'gorbov' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                {[3, 4, 5, 6, 7].map(s => (
                  <button
                    key={s}
                    onClick={() => setGridSize(s)}
                    className={`px-2 py-1 rounded-lg transition-all ${
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

            {/* Center Focus Toggle */}
            <button
              onClick={() => setShowCenterGuide(prev => !prev)}
              title={showCenterGuide ? 'Tắt tâm hội tụ' : 'Bật tâm hội tụ (Mở rộng thị giác ngoại biên)'}
              className={`p-2 rounded-xl transition-all border ${
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
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Reset Board */}
            <button
              onClick={initBoard}
              title="Khởi động lại bảng"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
                <span>{currentTarget}</span>
                <span className="text-xs font-semibold text-slate-400">/ {totalItems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Timer with Animated Progress Ring */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Thời gian</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-1 block">
              {elapsedSec}s
            </span>
            {personalBest !== null && (
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3" /> Kỷ lục: {personalBest}s
              </span>
            )}
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
          <button
            onClick={triggerHint}
            disabled={isFinished}
            title="Gợi ý ô tiếp theo"
            className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-all btn-press"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-brand-50/70 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>
            {mode === 'gorbov'
              ? 'Bấm ĐỎ tăng dần (1→25) xen kẽ ĐEN giảm dần (24→1) liên tục!'
              : mode === 'reverse'
              ? 'Đếm lùi từ số lớn nhất về 1. Cố định ánh nhìn tại tâm để luyện thị giác ngoại biên!'
              : mode === 'alphabet'
              ? 'Tìm chữ cái theo thứ tự bảng Alphabet (A → B → C...)!'
              : mode === 'rotating'
              ? 'Bảng sẽ xoay 90° sau mỗi 12 giây để thử thách khả năng định hướng không gian!'
              : mode === 'fading'
              ? 'Các ô số đã bấm sẽ mờ đi để trường nhìn của bạn luôn tập trung vào các số còn lại!'
              : 'Giữ ánh mắt tập trung vào chấm đỏ tâm lưới. Dùng tầm nhìn ngoại biên để tìm số!'}
          </span>
        </div>
        {showCenterGuide && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg shrink-0">
            <Eye className="w-3 h-3" /> Tâm nhìn đang bật
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
          {/* Optional Center Peripheral Vision Anchor */}
          {showCenterGuide && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="relative flex items-center justify-center">
                {/* Outer guide ring */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-red-500/30 dark:border-red-400/30 animate-ping opacity-30" />
                <div className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-red-500/50 bg-red-500/5" />
                <div className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/80 ring-2 ring-white dark:ring-slate-900" />
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
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleGorbovCellClick(cell, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative text-sm sm:text-lg md:text-xl lg:text-2xl shadow-sm ${
                      isFound
                        ? 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : cell.color === 'red'
                        ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/60 hover:shadow-lg hover:scale-105 active:scale-95'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
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
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleAlphabetCellClick(letter, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative shadow-sm ${
                      gridSize >= 6 ? 'text-sm sm:text-lg' : gridSize === 5 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'
                    } ${
                      isFound
                        ? 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
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
                const effect = clickEffects[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleStandardCellClick(num, key)}
                    disabled={isFound}
                    className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-150 relative shadow-sm ${
                      gridSize >= 7
                        ? 'text-xs sm:text-base md:text-xl'
                        : gridSize === 6
                        ? 'text-sm sm:text-lg md:text-2xl'
                        : gridSize === 5
                        ? 'text-base sm:text-2xl md:text-3xl'
                        : 'text-2xl sm:text-4xl md:text-5xl'
                    } ${
                      isFound
                        ? mode === 'fading'
                          ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400/30 border border-dashed border-slate-300/40 scale-95 cursor-default'
                          : 'bg-slate-200/40 dark:bg-slate-700/20 text-slate-300 dark:text-slate-600 scale-95 cursor-default'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-brand-50 hover:border-brand-500 hover:shadow-lg hover:scale-105 active:scale-95'
                    } ${
                      isHint ? 'ring-4 ring-amber-400 scale-110 z-10 animate-bounce' : ''
                    } ${
                      effect === 'correct' ? 'ring-4 ring-emerald-500 scale-105' : effect === 'wrong' ? 'ring-4 ring-rose-500 animate-pulse' : ''
                    }`}
                  >
                    {num}
                  </button>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Upgraded Schulte Results & Analytics Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-5 animate-scale-up">
            {/* Header Icon */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xl">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Xuất Sắc! Hoàn Thành Bảng Schulte
              </span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                +{score} Điểm
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chế độ: <strong className="text-brand-600 dark:text-brand-400 uppercase">{mode}</strong> ({gridSize}×{gridSize}) • Cấp {effectiveLevel}
              </p>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Thời gian hoàn tất</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {elapsedSec}s
                </p>
                {personalBest !== null && elapsedSec <= personalBest && (
                  <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5 mt-0.5">
                    <Sparkles className="w-3 h-3" /> KỶ LỤC MỚI!
                  </span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Tốc độ trung bình</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {currentPace}s
                </p>
                <span className="text-[10px] text-slate-400 font-medium">mỗi ô mục tiêu</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Chính xác</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {accuracy}%
                </p>
                <span className="text-[10px] text-slate-400 font-medium">{missClicks} lần bấm lệch</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Chuỗi chuẩn liên tục</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {bestStreak} ô
                </p>
                <span className="text-[10px] text-slate-400 font-medium">gợi ý dùng: {hintCount}</span>
              </div>
            </div>

            {/* Cognitive Evaluation Badge */}
            <div className="p-3 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 rounded-2xl border border-brand-200 dark:border-brand-800 text-xs text-left">
              <span className="font-bold text-brand-700 dark:text-brand-300">Đánh giá khả năng thị giác:</span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {currentPace < 0.8
                  ? '⚡ Thị giác ngoại biên phi thường! Bạn có tốc độ quét hàng đầu, rất lý tưởng để đọc sách tốc độ cao.'
                  : currentPace < 1.4
                  ? '✨ Khả năng bao quát trường nhìn rất tốt! Tiếp tục duy trì mắt ở tâm để phản xạ ngày càng nhanh.'
                  : '🎯 Khởi đầu vững chắc. Hãy hạn chế đảo mắt và cố định tầm nhìn ở điểm trung tâm.'}
              </p>
            </div>

            {/* Share & Export Tools */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyResults}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {isCopied ? 'Đã sao chép!' : 'Chia sẻ kết quả'}
              </button>

              <button
                onClick={handleDownloadJson}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                title="Tải báo cáo JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  if (activeWorkoutRoutine) {
                    nextWorkoutStep();
                  } else {
                    setActiveGameSlug(null);
                  }
                }}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
              >
                <span>{activeWorkoutRoutine ? 'Bài tiếp theo trong lộ trình' : 'Tiếp tục rèn luyện'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  initBoard();
                }}
                className="w-full py-2.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Thử lại bảng này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
