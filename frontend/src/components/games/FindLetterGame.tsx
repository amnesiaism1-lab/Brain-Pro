import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, EXERCISES_METADATA } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { readingContentService } from '../../services/readingContentService';
import { RotateCcw, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const FindLetterGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound,
    isGamePaused,
    ladderSessionRounds
  } = useAppStore();

  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('find-letter');
  const { sessionConfig: resolvedConfig, isCustom } = useExerciseSessionConfig('find-letter');

  const effectiveLevel = getExerciseLevel('find-letter') || currentLevel || 1;
  // Hold the level played during this session to avoid sudden re-render wipes if DDA updates store
  const playedLevelRef = useRef<number>(effectiveLevel);
  const sessionIdRef = useRef<string>(`fl-${Date.now()}`);
  const lastClickRef = useRef<number>(Date.now());

  useEffect(() => {
    playedLevelRef.current = effectiveLevel;
  }, [effectiveLevel]);

  const playedLevel = playedLevelRef.current;
  const isInfinity = playedLevel >= 13;

  // Rounds configuration
  const totalRounds = useMemo(() => {
    if (isCustom && resolvedConfig.rounds && resolvedConfig.rounds > 0) {
      return resolvedConfig.rounds;
    }
    return ladderSessionRounds || 1;
  }, [isCustom, resolvedConfig.rounds, ladderSessionRounds]);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundResults, setRoundResults] = useState<Array<{ score: number; accuracy: number; timeSpentSec: number }>>([]);
  const [roundTransition, setRoundTransition] = useState<{ roundDone: number; isTimeout: boolean } | null>(null);

  // Custom countdown timer if timeLimitSec is set in custom mode
  const isCustomCountdown = Boolean(isCustom && resolvedConfig.timeLimitSec && resolvedConfig.timeLimitSec > 0);
  const customTimeLimit = isCustomCountdown ? (resolvedConfig.timeLimitSec || 30) : 0;

  const exerciseMeta = useMemo(() => EXERCISES_METADATA.find(e => e.slug === 'find-letter'), []);
  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === playedLevel);
  }, [exerciseMeta, playedLevel]);

  const gridSize = isCustom 
    ? 6 
    : (levelConfig?.gridRows ?? (playedLevel >= 20 ? 10 : playedLevel >= 17 ? 9 : playedLevel >= 13 ? 8 : playedLevel <= 2 ? 5 : playedLevel <= 5 ? 6 : playedLevel <= 8 ? 7 : 8));

  const targetCount = isCustom 
    ? 4 
    : (levelConfig?.targetItemCount ?? (playedLevel >= 20 ? 10 : playedLevel >= 16 ? 8 : playedLevel >= 13 ? 6 : playedLevel <= 2 ? 3 : playedLevel <= 5 ? 4 : playedLevel <= 8 ? 5 : 7));

  // Challenge mode: 'all' | 'vowel_tones' | 'confusable'
  const [challengeMode, setChallengeMode] = useState<'all' | 'vowel_tones' | 'confusable'>(() => {
    if (playedLevel >= 13) return 'confusable';
    return 'all';
  });
  
  const [challenge, setChallenge] = useState(() => 
    readingContentService.getRandomLetterChallenge(challengeMode)
  );

  interface LetterCellItem {
    id: number;
    char: string;
    isTarget: boolean;
    found: boolean;
    rotationDeg?: number;
    fontFamily?: string;
    mirror?: boolean;
    scale?: number;
    colorClass?: string;
    driftOffset?: { x: number; y: number };
  }

  const [grid, setGrid] = useState<LetterCellItem[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [errorCellId, setErrorCellId] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [finalTimeSpentSec, setFinalTimeSpentSec] = useState<number>(0);

  const MATH_SYMBOLS = ['∑', 'π', 'Ω', 'δ', '∞', 'λ', 'θ', 'ψ', 'Δ', 'β', '≈', '≠', '√', '∫'];
  const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive'];
  const CAMOUFLAGE_COLORS = [
    'text-rose-500 dark:text-rose-400', 
    'text-blue-500 dark:text-blue-400', 
    'text-emerald-500 dark:text-emerald-400', 
    'text-amber-500 dark:text-amber-400', 
    'text-purple-500 dark:text-purple-400', 
    'text-cyan-500 dark:text-cyan-400', 
    'text-pink-500 dark:text-pink-400'
  ];

  const initGridWithChallenge = useCallback((currentChallenge: typeof challenge) => {
    const totalCells = gridSize * gridSize;
    const items: LetterCellItem[] = [];
    
    // Distribute target count
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    const { target, distractors } = currentChallenge;
    let distractorPool = [...distractors];

    // ∞-VII & ∞-X: Symbol invasion
    if (playedLevel === 19 || playedLevel === 22) {
      distractorPool = [...distractorPool, ...MATH_SYMBOLS];
    }
    // ∞-I: Latin letters mix
    if (playedLevel === 13) {
      distractorPool = [...distractorPool, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    }

    const rotations = [0, 90, 180, 270];

    for (let i = 0; i < totalCells; i++) {
      const isTarget = targetIndices.has(i);
      const rotationDeg = (playedLevel === 14 || playedLevel === 21 || playedLevel === 22) 
        ? rotations[Math.floor(Math.random() * rotations.length)] 
        : 0;
      const fontFamily = (playedLevel === 16 || playedLevel === 22) 
        ? FONTS[Math.floor(Math.random() * FONTS.length)] 
        : undefined;
      const mirror = (playedLevel === 15 || playedLevel === 21 || playedLevel === 22) 
        ? Math.random() < 0.5 
        : false;
      const scale = playedLevel === 17 
        ? +(0.7 + Math.random() * 0.6).toFixed(2) 
        : undefined;

      // Color Stroop conflict: Level 12 (standard Stroop) or Level 20/22 (Infinity Camouflage)
      const colorClass = (playedLevel === 12 || playedLevel === 20 || playedLevel === 22)
        ? CAMOUFLAGE_COLORS[Math.floor(Math.random() * CAMOUFLAGE_COLORS.length)]
        : undefined;

      // Level 10: Moving grid drift offset
      const driftOffset = playedLevel === 10
        ? { x: Math.floor(Math.random() * 7) - 3, y: Math.floor(Math.random() * 7) - 3 }
        : undefined;

      items.push({
        id: i,
        char: isTarget ? target : distractorPool[Math.floor(Math.random() * distractorPool.length)],
        isTarget,
        found: false,
        rotationDeg,
        fontFamily,
        mirror,
        scale,
        colorClass,
        driftOffset
      });
    }
    setGrid(items);
    setFoundCount(0);
    setMissCount(0);
    setElapsedSec(0);
  }, [gridSize, targetCount, playedLevel]);

  const handleNewChallenge = (mode = challengeMode) => {
    playSound('click');
    const nextChallenge = readingContentService.getRandomLetterChallenge(mode);
    setChallenge(nextChallenge);
    initGridWithChallenge(nextChallenge);
  };

  // Initial grid creation
  useEffect(() => {
    initGridWithChallenge(challenge);
  }, [initGridWithChallenge]);

  // Handle Round Completion (advance to next round or finish session)
  const completeRound = useCallback((timedOut = false) => {
    const totalClicks = foundCount + missCount;
    const roundAcc = timedOut
      ? (totalClicks > 0 ? Math.round((foundCount / totalClicks) * 100) : 0)
      : (totalClicks > 0 ? Math.round((foundCount / totalClicks) * 100) : 100);

    const roundScore = calculateGameScore({
      level: playedLevel,
      accuracyRate: roundAcc,
      timeLimitSec: isCustomCountdown ? customTimeLimit : (isInfinity ? 60 : 40),
      timeSpentSec: elapsedSec
    });

    const newResult = {
      score: roundScore,
      accuracy: roundAcc,
      timeSpentSec: elapsedSec
    };

    const nextAllResults = [...roundResults, newResult];
    setRoundResults(nextAllResults);

    if (currentRound < totalRounds) {
      // Transition to next round
      setRoundTransition({ roundDone: currentRound, isTimeout: timedOut });
      playSound(timedOut ? 'wrong' : 'correct');
    } else {
      // Final round done: Aggregate score and freeze!
      const aggScore = nextAllResults.reduce((sum, r) => sum + r.score, 0);
      const aggAcc = Math.round(nextAllResults.reduce((sum, r) => sum + r.accuracy, 0) / nextAllResults.length);
      const aggTime = nextAllResults.reduce((sum, r) => sum + r.timeSpentSec, 0);

      setFinalScore(aggScore);
      setFinalAccuracy(aggAcc);
      setFinalTimeSpentSec(aggTime);
      setIsFinished(true);
      playSound('victory');
    }
  }, [
    foundCount, 
    missCount, 
    playedLevel, 
    isCustomCountdown, 
    customTimeLimit, 
    isInfinity, 
    elapsedSec, 
    roundResults, 
    currentRound, 
    totalRounds, 
    playSound
  ]);

  // Main Timer Effect (pauses on isGamePaused, roundTransition, isFinished)
  useEffect(() => {
    if (isFinished || isGamePaused || Boolean(roundTransition)) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSec(s => {
        const nextSec = s + 1;
        // Check timeout in custom countdown mode
        if (isCustomCountdown && nextSec >= customTimeLimit) {
          clearInterval(timer);
          completeRound(true);
          return customTimeLimit;
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, roundTransition, isCustomCountdown, customTimeLimit, completeRound]);

  const advanceNextRound = () => {
    playSound('click');
    setRoundTransition(null);
    setCurrentRound(r => r + 1);
    const nextChallenge = readingContentService.getRandomLetterChallenge(challengeMode);
    setChallenge(nextChallenge);
    initGridWithChallenge(nextChallenge);
  };

  const handleCellClick = (cellId: number) => {
    if (isFinished || Boolean(roundTransition)) return;
    const cell = grid.find(c => c.id === cellId);
    if (!cell || cell.found) return;

    const isCorrect = cell.isTarget;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickRef.current));
    lastClickRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'find-letter',
      level: playedLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: challenge.target,
        distractor: !isCorrect ? cell.char : undefined,
        challengeType: challenge.type,
        position: String(cellId)
      },
      stateBefore: 'scanning_matrix',
      stateAfter: isCorrect ? 'target_isolated' : 'distractor_clicked',
      responseMs: respMs,
      correct: isCorrect
    });

    if (cell.isTarget) {
      playSound('click');
      const updated = grid.map(c => c.id === cellId ? { ...c, found: true } : c);
      setGrid(updated);
      const nextFound = foundCount + 1;
      setFoundCount(nextFound);

      if (nextFound >= targetCount) {
        completeRound(false);
      }
    } else {
      playSound('wrong');
      setMissCount(m => m + 1);
      setErrorCellId(cellId);
      setTimeout(() => setErrorCellId(null), 400);

      // Record into Wrong Answer History
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: playedLevel,
        questionContext: {
          prompt: `Tìm chữ "${challenge.target}"`,
          distractor: cell.char,
          challengeType: challenge.type,
          matrixSize: `${gridSize}x${gridSize}`
        },
        correctAnswer: {
          label: challenge.target,
          code: challenge.target
        },
        userAnswer: {
          label: cell.char,
          code: cell.char
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  const displayTimeLeft = isCustomCountdown ? Math.max(0, customTimeLimit - elapsedSec) : elapsedSec;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][playedLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {playedLevel === 13 ? 'Săn Ký Tự Latin Học Thuật (Latin Alphabet Hunt)' :
               playedLevel === 14 ? 'Ký Tự Xoay Góc Ngẫu Nhiên (Rotated Letters)' :
               playedLevel === 15 ? 'Ký Tự Đảo Gương Đối Xứng (Mirror Inversion)' :
               playedLevel === 16 ? 'Xung Đột Họ Phông Chữ (Font Typography Clash)' :
               playedLevel === 17 ? 'Biến Thiên Kích Thước Ký Tự (Font Size Chaos)' :
               playedLevel === 18 ? 'Ký Tự Dễ Nhầm Lẫn Thị Giác (Confusable Glyphs)' :
               playedLevel === 19 ? 'Ký Hiệu Toán & Hy Lạp Xâm Nhập (Symbol Invasion)' :
               playedLevel === 20 ? 'Ngụy Trang Đa Sắc Tố (Color Camouflage)' :
               playedLevel === 21 ? 'Mê Cung Đảo Gương & Xoay (Mirror & Rotation Maze)' :
               'Ma Trận Tổng Hợp Lượng Tử (Quantum Matrix)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            {challenge.target}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                {challenge.type}
              </span>
              {totalRounds > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  Lượt {currentRound}/{totalRounds}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-1">
              Đã tìm: <strong className="text-brand-600 text-base sm:text-lg">{foundCount} / {targetCount}</strong>
            </div>
          </div>
        </div>

        {/* Change Challenge & Clock */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNewChallenge()}
            disabled={isFinished || Boolean(roundTransition)}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all btn-press disabled:opacity-50"
            title="Đổi bộ ký tự ngẫu nhiên khác"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đổi ký tự</span>
          </button>

          <div className="text-right">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              {isCustomCountdown ? 'Còn lại' : 'Thời gian'}
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${isCustomCountdown && displayTimeLeft <= 10 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
              {displayTimeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Mode Pill Filter */}
      <div className="flex items-center justify-center gap-2">
        {[
          { id: 'all', label: 'Ngẫu nhiên tất cả' },
          { id: 'vowel_tones', label: 'Dấu thanh Tiếng Việt' },
          { id: 'confusable', label: 'Ký tự dễ nhầm lẫn' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => {
              setChallengeMode(m.id as any);
              handleNewChallenge(m.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              challengeMode === m.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Quét nhanh qua ma trận ký tự và nhấp vào tất cả chữ <strong>"{challenge.target}"</strong> ({challenge.description})!
        <span className="block text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
          * Phân biệt chính xác chữ hoa, chữ thường và dấu thanh tiếng Việt.
        </span>
      </p>

      {/* Grid */}
      <div 
        className="grid gap-2 sm:gap-3 md:gap-4 bg-[#F5EFE6] dark:bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none aspect-square relative"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((cell) => (
          <button
            key={cell.id}
            onClick={() => handleCellClick(cell.id)}
            style={{
              transform: `${cell.rotationDeg ? `rotate(${cell.rotationDeg}deg)` : ''} ${cell.mirror ? 'scaleX(-1)' : ''} ${cell.scale ? `scale(${cell.scale})` : ''} ${cell.driftOffset ? `translate(${cell.driftOffset.x}px, ${cell.driftOffset.y}px)` : ''}`.trim() || undefined,
              fontFamily: cell.fontFamily || undefined
            }}
            className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-100 btn-press ${cell.colorClass || 'text-slate-800 dark:text-white'} ${
              gridSize >= 10 ? 'text-xs sm:text-base md:text-lg' : gridSize >= 8 ? 'text-sm sm:text-lg md:text-xl' : 'text-base sm:text-xl md:text-2xl lg:text-3xl'
            } ${
              cell.found
                ? 'bg-emerald-500 !text-white shadow scale-95 cursor-default'
                : errorCellId === cell.id
                ? 'bg-rose-500/25 border-2 border-rose-500 ring-4 ring-rose-500/40 animate-shake !text-rose-600 dark:!text-rose-400'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 shadow-sm'
            }`}
          >
            {cell.char}
          </button>
        ))}

        {/* Round Transition Overlay */}
        {roundTransition && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-4 text-white z-20 animate-fade-in p-6 text-center">
            {roundTransition.isTimeout ? (
              <>
                <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-full text-amber-400">
                  <Clock className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 uppercase">
                    Hết Thời Gian Lượt {roundTransition.roundDone}/{totalRounds}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Chưa tìm đủ chữ cái mục tiêu!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    Đã hết thời gian quy định cho lượt này ({customTimeLimit}s). Lưu ý: thời gian được làm mới riêng cho mỗi lượt mới.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                <h3 className="text-xl sm:text-2xl font-black">
                  Hoàn thành Lượt {roundTransition.roundDone}/{totalRounds}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Thời gian: {elapsedSec}s • Sẵn sàng cho lượt tiếp theo?
                </p>
              </>
            )}
            <button
              onClick={advanceNextRound}
              className="mt-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>Vào Lượt {roundTransition.roundDone + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={finalScore}
          accuracyRate={finalAccuracy}
          timeSpentSec={finalTimeSpentSec}
          playedLevel={playedLevel}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setCurrentRound(1);
            setRoundResults([]);
            setRoundTransition(null);
            setIsFinished(false);
            playedLevelRef.current = getExerciseLevel('find-letter');
            handleNewChallenge();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
