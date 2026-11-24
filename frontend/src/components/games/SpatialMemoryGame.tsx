import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { GameResultModal } from './GameResultModal';
import { EXERCISES_METADATA } from '@brain-exercises/shared';
import {
  Sparkles,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { analyzeSpatialDiff, SpatialDiffResult } from '../../utils/memoryDiffAnalysis';

interface SpatialErrorState {
  diff: SpatialDiffResult;
  expectedSequence: number[];
  userInputs: number[];
  trapBlockIndex: number | null;
}

export const SpatialMemoryGame: React.FC = () => {
  const {
    currentLevel: storeLevel,
    getExerciseLevel,
    setActiveGameSlug,
    playSound,
    isGamePaused,
    ladderSessionRounds
  } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('spatial-memory');
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('spatial-memory');
  const sessionIdRef = useRef<string>(`session-spatial-${Date.now()}`);
  const recallStartTimeRef = useRef<number>(Date.now());

  const ladderLevel = getExerciseLevel('spatial-memory') || storeLevel || 1;
  const playedLevelRef = useRef<number>(isCustom ? 0 : ladderLevel);
  const effectiveLevel = isCustom ? 0 : playedLevelRef.current;
  const isInfinity = !isCustom && effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const customParams = (sessionConfig.params || {}) as {
    gridSize?: string;
    sequenceLength?: number;
    recallOrder?: 'forward' | 'reverse';
    flashSpeedMs?: number;
    rotateBoard?: boolean;
  };

  const levelMeta = useMemo(() => {
    const meta = EXERCISES_METADATA.find(e => e.slug === 'spatial-memory');
    return meta?.levelConfigs.find(c => c.level === effectiveLevel);
  }, [effectiveLevel]);

  const gridSize = useMemo(() => {
    if (isCustom && customParams.gridSize) {
      const parsed = parseInt(customParams.gridSize, 10);
      if (!Number.isNaN(parsed)) return Math.max(3, Math.min(6, parsed));
    }
    if (!isInfinity && levelMeta?.gridRows) {
      return Math.max(3, Math.min(6, levelMeta.gridRows));
    }
    if (effectiveLevel >= 19) return 6;
    if (effectiveLevel >= 13) return 5;
    if (effectiveLevel <= 2) return 3;
    if (effectiveLevel <= 5) return 4;
    if (effectiveLevel <= 9) return 5;
    return 6;
  }, [isCustom, customParams.gridSize, isInfinity, levelMeta, effectiveLevel]);

  const targetSequenceLength = useMemo(() => {
    if (isCustom && typeof customParams.sequenceLength === 'number') {
      return Math.max(3, Math.min(12, customParams.sequenceLength));
    }
    if (!isInfinity && levelMeta?.targetItemCount) {
      return levelMeta.targetItemCount;
    }
    if (isInfinity) return Math.min(14, 4 + infinityTier);
    return Math.min(13, 2 + effectiveLevel);
  }, [isCustom, customParams.sequenceLength, isInfinity, levelMeta, infinityTier, effectiveLevel]);

  const isReverseOrder = isCustom
    ? customParams.recallOrder === 'reverse'
    : effectiveLevel === 8 || effectiveLevel === 9 || effectiveLevel === 16 || Boolean(levelMeta?.parametersJson?.reverseOrder);
  const isColorCorsi = !isCustom && effectiveLevel === 13;
  const isLetterCorsi = !isCustom && effectiveLevel === 14;
  const isTrapBlockMode = !isCustom && effectiveLevel === 17;
  const isFastFlash = !isCustom && effectiveLevel === 20;
  const isRotatingBoard = isCustom
    ? Boolean(customParams.rotateBoard)
    : effectiveLevel === 12 || effectiveLevel === 22 || Boolean(levelMeta?.parametersJson?.rotateAfterFlash);

  const CORSI_COLORS = ['#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

  const [sequence, setSequence] = useState<number[]>([]);
  const [trapBlockIndex, setTrapBlockIndex] = useState<number | null>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);
  const [wrongBlockIndex, setWrongBlockIndex] = useState<number | null>(null);
  const [correctHintIndex, setCorrectHintIndex] = useState<number | null>(null);
  const [spatialErrorDiff, setSpatialErrorDiff] = useState<SpatialErrorState | null>(null);
  const [roundSuccessBanner, setRoundSuccessBanner] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [userInputs, setUserInputs] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [restartKey, setRestartKey] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const maxRounds = useMemo(() => {
    if (sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    return Math.max(1, ladderSessionRounds || 6);
  }, [sessionConfig.rounds, ladderSessionRounds]);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [replaysLeft, setReplaysLeft] = useState(1);

  const seqIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearSequenceTimers = useCallback(() => {
    if (seqIntervalRef.current) {
      clearInterval(seqIntervalRef.current);
      seqIntervalRef.current = null;
    }
    seqTimeoutsRef.current.forEach(t => clearTimeout(t));
    seqTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearSequenceTimers();
  }, [clearSequenceTimers]);

  // Real elapsed timer
  useEffect(() => {
    if (isFinished || isGamePaused) return;
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, isGamePaused]);

  const totalBlocks = gridSize * gridSize;

  const formatCellCoord = useCallback(
    (idx: number) => `Hàng ${Math.floor(idx / gridSize) + 1} · Cột ${(idx % gridSize) + 1}`,
    [gridSize]
  );

  // Generate a random non-consecutive block sequence
  const startNewSequence = useCallback(() => {
    clearSequenceTimers();
    setReplaysLeft(1);
    setWrongBlockIndex(null);
    setCorrectHintIndex(null);
    setSpatialErrorDiff(null);
    setRoundSuccessBanner(false);
    const seqLength = targetSequenceLength;
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      let nextBlock = Math.floor(Math.random() * totalBlocks);
      while (newSeq.length > 0 && nextBlock === newSeq[newSeq.length - 1]) {
        nextBlock = Math.floor(Math.random() * totalBlocks);
      }
      newSeq.push(nextBlock);
    }

    // Set trap block for level 17
    if (isTrapBlockMode) {
      let trap = Math.floor(Math.random() * totalBlocks);
      while (newSeq.includes(trap)) {
        trap = Math.floor(Math.random() * totalBlocks);
      }
      setTrapBlockIndex(trap);
    } else {
      setTrapBlockIndex(null);
    }

    setSequence(newSeq);
    setUserInputs([]);
    setIsShowingSequence(true);

    const stepIntervalMs =
      isCustom && typeof customParams.flashSpeedMs === 'number'
        ? Math.max(300, Math.min(1100, customParams.flashSpeedMs))
        : isFastFlash
          ? 400
          : isInfinity
            ? 600
            : 850;
    const highlightMs = Math.max(220, Math.min(stepIntervalMs - 120, Math.round(stepIntervalMs * 0.6)));

    // Playback sequence animation
    let step = 0;
    seqIntervalRef.current = setInterval(() => {
      if (step < newSeq.length) {
        const block = newSeq[step];
        setActiveHighlightIndex(block);
        playSound('click');
        step++;

        // Turn off highlight shortly after
        const t = setTimeout(() => {
          setActiveHighlightIndex(null);
        }, highlightMs);
        seqTimeoutsRef.current.push(t);
      } else {
        if (seqIntervalRef.current) {
          clearInterval(seqIntervalRef.current);
          seqIntervalRef.current = null;
        }
        setActiveHighlightIndex(null);
        setIsShowingSequence(false);
        recallStartTimeRef.current = Date.now();
      }
    }, stepIntervalMs);
  }, [
    clearSequenceTimers,
    totalBlocks,
    targetSequenceLength,
    playSound,
    isCustom,
    customParams.flashSpeedMs,
    isInfinity,
    isFastFlash,
    isTrapBlockMode
  ]);

  useEffect(() => {
    startNewSequence();
  }, [startNewSequence, currentRound, restartKey]);

  const advanceAfterError = useCallback(() => {
    setSpatialErrorDiff(null);
    setWrongBlockIndex(null);
    setCorrectHintIndex(null);
    if (currentRound >= maxRounds) {
      setIsFinished(true);
    } else {
      setCurrentRound(r => r + 1);
    }
  }, [currentRound, maxRounds]);

  useEffect(() => {
    if (!spatialErrorDiff || isFinished || isGamePaused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceAfterError();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spatialErrorDiff, isFinished, isGamePaused, advanceAfterError]);

  const handleBlockClick = (blockIndex: number) => {
    if (
      isShowingSequence ||
      isFinished ||
      isGamePaused ||
      wrongBlockIndex !== null ||
      spatialErrorDiff !== null ||
      roundSuccessBanner
    ) {
      return;
    }

    const expectedSequence = isReverseOrder ? [...sequence].reverse() : sequence;
    const nextInputs = [...userInputs, blockIndex];
    const currentStep = nextInputs.length - 1;
    const responseMs = Math.max(150, Date.now() - recallStartTimeRef.current);

    // Check if clicked the trap block in level 17
    if (isTrapBlockMode && blockIndex === trapBlockIndex) {
      playSound('wrong');
      setWrongBlockIndex(blockIndex);
      setCorrectHintIndex(expectedSequence[currentStep] ?? null);
      const diff = analyzeSpatialDiff({
        rawSequence: sequence,
        expectedSequence,
        userInputs: nextInputs,
        gridSize,
        isReverse: isReverseOrder,
        isTrap: true
      });
      setSpatialErrorDiff({
        diff,
        expectedSequence,
        userInputs: nextInputs,
        trapBlockIndex
      });
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: effectiveLevel || 1,
        questionContext: {
          prompt: `Corsi ${gridSize}×${gridSize} (${sequence.length} ô${isReverseOrder ? ', Đảo ngược' : ''})`,
          gridSize,
          isReverseRecall: isReverseOrder,
          sequenceNotes: expectedSequence.map(idx => formatCellCoord(idx))
        },
        correctAnswer: {
          label: formatCellCoord(diff.expectedBlock),
          code: `STEP_${diff.failStep + 1}_BLOCK_${diff.expectedBlock}`
        },
        userAnswer: {
          label: `Ô Bẫy (${formatCellCoord(blockIndex)})`,
          code: `TRAP_BLOCK_${blockIndex}`
        },
        responseTimeMs: responseMs,
        sessionId: sessionIdRef.current
      });
      return;
    }

    setUserInputs(nextInputs);

    // Check correctness of this input
    const isCorrect = nextInputs[currentStep] === expectedSequence[currentStep];

    emitTrialEvent({
      exerciseSlug: 'spatial-memory',
      level: effectiveLevel,
      relationId: isReverseOrder ? 'SPATIAL_TRANSFORM' : 'TARGET_POSITION',
      relationWeight: 1.0,
      entities: {
        target: String(expectedSequence[currentStep]),
        position: String(blockIndex),
        rule: isReverseOrder ? 'reverse_corsi' : 'forward_corsi'
      },
      stateBefore: 'recalling_spatial',
      stateAfter: isCorrect ? 'block_matched' : 'block_mistake',
      responseMs,
      correct: isCorrect
    });

    if (!isCorrect) {
      playSound('wrong');
      setWrongBlockIndex(blockIndex);
      setCorrectHintIndex(expectedSequence[currentStep]);
      const diff = analyzeSpatialDiff({
        rawSequence: sequence,
        expectedSequence,
        userInputs: nextInputs,
        gridSize,
        isReverse: isReverseOrder,
        isTrap: false
      });
      setSpatialErrorDiff({
        diff,
        expectedSequence,
        userInputs: nextInputs,
        trapBlockIndex
      });
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: effectiveLevel || 1,
        questionContext: {
          prompt: `Corsi ${gridSize}×${gridSize} (${sequence.length} ô${isReverseOrder ? ', Đảo ngược' : ''})`,
          gridSize,
          isReverseRecall: isReverseOrder,
          sequenceNotes: expectedSequence.map(idx => formatCellCoord(idx))
        },
        correctAnswer: {
          label: `Bước #${diff.failStep + 1}: ${formatCellCoord(diff.expectedBlock)}`,
          code: `STEP_${diff.failStep + 1}_BLOCK_${diff.expectedBlock}`
        },
        userAnswer: {
          label: `Bước #${diff.failStep + 1}: ${formatCellCoord(blockIndex)}`,
          code: `STEP_${diff.failStep + 1}_BLOCK_${blockIndex}`
        },
        responseTimeMs: responseMs,
        sessionId: sessionIdRef.current
      });
      return;
    }

    // Correct tap
    playSound('correct');

    if (nextInputs.length === sequence.length) {
      // Completed round!
      const addedScore = 100 + sequence.length * 30 + (effectiveLevel || 1) * 15;
      setScore(s => s + addedScore);
      setCorrectRounds(c => c + 1);
      setRoundSuccessBanner(true);

      if (currentRound >= maxRounds) {
        const t = setTimeout(() => {
          setIsFinished(true);
        }, 450);
        seqTimeoutsRef.current.push(t);
      } else {
        const t = setTimeout(() => {
          setCurrentRound(r => r + 1);
        }, 650);
        seqTimeoutsRef.current.push(t);
      }
    }
  };

  const gridClass = useMemo(() => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    if (gridSize === 5) return 'grid-cols-5';
    return 'grid-cols-6';
  }, [gridSize]);

  const accuracyRate = useMemo(() => {
    const completed = Math.max(1, maxRounds);
    return Math.max(0, Math.min(100, Math.round((correctRounds / completed) * 100)));
  }, [correctRounds, maxRounds]);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-2xl lg:max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13 ? 'Multi-Color Corsi (Khối sáng đa sắc màu rực rỡ)' :
               effectiveLevel === 14 ? 'Letter Spatial (Khối phát sáng kèm ký tự Latin)' :
               effectiveLevel === 15 ? 'Coordinate Shift (Dịch chuyển tọa độ tư duy)' :
               effectiveLevel === 16 ? 'Backward Corsi (Gõ ngược chuỗi không gian)' :
               effectiveLevel === 17 ? 'Hazard Trap Block (Bẫy vị trí: né ô nguy hiểm!)' :
               effectiveLevel === 18 ? 'Dual Concurrent Pulse (Nhớ cặp điểm không gian đồng thời)' :
               effectiveLevel === 19 ? '6x6 Extended Grid (Lưới cực đại 36 ô không gian)' :
               effectiveLevel === 20 ? 'Rapid Flash Corsi (Chớp lóe tốc độ cao 260ms)' :
               effectiveLevel === 21 ? 'Spatial Interference (Trí nhớ làm việc kháng nhiễu)' :
               'Mental Rotation Corsi (Bảng tự xoay 90° thử thách xoay tinh thần)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Trap block warning banner */}
      {isTrapBlockMode && (
        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-800 dark:text-rose-200 text-center font-black text-xs sm:text-sm animate-pulse">
          ⚠️ CẢNH BÁO BẪY: Trong lưới có 1 ô bẫy nguy hiểm màu đỏ! TUYỆT ĐỐI KHÔNG BẤM VÀO Ô BẪY!
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {score}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Vòng đấu</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {currentRound} / {maxRounds}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Độ dài chuỗi</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5">
            {sequence.length} ô
          </div>
        </div>
      </div>

      {/* Mode / Phase Indicator */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold transition-all shadow-sm ${
        spatialErrorDiff
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-200'
          : roundSuccessBanner
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
          : isShowingSequence
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300 animate-pulse'
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
      }`}>
        <div className="flex items-center gap-2">
          {spatialErrorDiff ? (
            <>
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>
                Chệch ở bước #{spatialErrorDiff.diff.failStep + 1}/{spatialErrorDiff.expectedSequence.length} — Xem đối chiếu màu trực quan ngay bên dưới
              </span>
            </>
          ) : roundSuccessBanner ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Xuất sắc! Hoàn thành chính xác cả {sequence.length} vị trí!</span>
            </>
          ) : isShowingSequence ? (
            <>
              <Eye className="w-5 h-5 animate-bounce text-amber-600 shrink-0" />
              <span>Quan sát chuỗi ô phát sáng ({sequence.length} bước)...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Đến lượt bạn ({userInputs.length}/{sequence.length} ô): Hãy bấm lại đúng thứ tự!{' '}
                {isReverseOrder && '(ĐẢO NGƯỢC)'} {isRotatingBoard && '(BẢNG ĐÃ TỰ XOAY 90°)'}
              </span>
            </>
          )}
        </div>

        {replaysLeft > 0 && !isShowingSequence && !spatialErrorDiff && !roundSuccessBanner && (
          <button
            onClick={() => {
              playSound('click');
              setReplaysLeft(0);
              startNewSequence();
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all"
          >
            Phát lại chuỗi (1 lần)
          </button>
        )}
      </div>

      {/* Persistent High-Contrast Spatial Diff Diagnostic Panel */}
      {spatialErrorDiff && (
        <div className="rounded-3xl border-2 border-rose-400/70 dark:border-rose-500/60 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                {spatialErrorDiff.diff.errorType === 'forgot-reverse'
                  ? 'Quên quy tắc đảo ngược chuỗi'
                  : spatialErrorDiff.diff.errorType === 'trap-block'
                  ? 'Chạm trúng ô bẫy nguy hiểm'
                  : spatialErrorDiff.diff.errorType === 'order-shift'
                  ? 'Nhầm thứ tự bước trong chuỗi'
                  : 'Lệch tọa độ ô trên lưới'}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
              Sai ở bước #{spatialErrorDiff.diff.failStep + 1} / {spatialErrorDiff.expectedSequence.length}
            </span>
          </div>

          {/* Side-by-Side Tapped vs Expected Block Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Bạn vừa bấm (Bước #{spatialErrorDiff.diff.failStep + 1})
              </div>
              <div className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-200 mt-1">
                ✕ {formatCellCoord(spatialErrorDiff.diff.tappedBlock)}
                {spatialErrorDiff.diff.tappedStepInExpected !== -1 && (
                  <span className="ml-2 text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                    Đúng ra là bước #{spatialErrorDiff.diff.tappedStepInExpected + 1}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Vị trí chuẩn phải bấm
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-200 mt-1">
                ★ {formatCellCoord(spatialErrorDiff.diff.expectedBlock)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs sm:text-sm">
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {spatialErrorDiff.diff.diagnosisVi}
            </p>
            <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{spatialErrorDiff.diff.tipVi}</span>
            </p>
          </div>

          {/* Grid Color Legend + Advance Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Đã đúng (#1..k)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> ★ Đúng tại bước sai
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> ✕ Ô bấm nhầm
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-cyan-400" /> Các bước còn lại
              </span>
            </div>

            <button
              onClick={advanceAfterError}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer transition-all shrink-0"
            >
              <span>
                {currentRound >= maxRounds
                  ? 'Xem kết quả tổng hợp'
                  : `Tiếp tục lượt ${currentRound + 1}/${maxRounds}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Spatial Matrix Grid */}
      <div
        style={{
          transform: isRotatingBoard && !isShowingSequence ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        className={`w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto aspect-square grid ${gridClass} gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl`}
      >
        {Array.from({ length: totalBlocks }).map((_, idx) => {
          const isHighlighted = activeHighlightIndex === idx;
          const colorForBlock = isColorCorsi ? CORSI_COLORS[idx % CORSI_COLORS.length] : undefined;
          const isTrap = isTrapBlockMode && idx === trapBlockIndex;

          const counterRotateStyle =
            isRotatingBoard && !isShowingSequence
              ? { transform: 'rotate(-90deg)' }
              : undefined;

          // Determine review state when spatialErrorDiff is active
          let matchedCorrectStep = -1;
          let expectedFailStep = false;
          let isWrongCell = false;
          let remainingExpectedSteps: number[] = [];

          if (spatialErrorDiff) {
            const { diff, expectedSequence, userInputs: prevInputs } = spatialErrorDiff;
            for (let s = 0; s < diff.failStep; s++) {
              if (prevInputs[s] === idx) {
                matchedCorrectStep = s + 1;
              }
            }
            isWrongCell = idx === diff.tappedBlock;
            expectedFailStep = idx === diff.expectedBlock;
            for (let s = diff.failStep + 1; s < expectedSequence.length; s++) {
              if (expectedSequence[s] === idx) {
                remainingExpectedSteps.push(s + 1);
              }
            }
          }

          const tappedStepNums = !spatialErrorDiff
            ? userInputs
                .map((b, sIdx) => (b === idx ? sIdx + 1 : -1))
                .filter(n => n !== -1)
            : [];
          const isUserTapped = tappedStepNums.length > 0;

          return (
            <button
              key={`block-${idx}`}
              onClick={() => handleBlockClick(idx)}
              disabled={isShowingSequence || isGamePaused || spatialErrorDiff !== null || roundSuccessBanner}
              style={{
                backgroundColor: isHighlighted && colorForBlock ? colorForBlock : undefined
              }}
              className={`w-full h-full aspect-square rounded-2xl sm:rounded-3xl font-black text-xl transition-all duration-150 btn-press relative flex items-center justify-center cursor-pointer ${
                spatialErrorDiff
                  ? isWrongCell
                    ? 'bg-rose-500 border-4 border-rose-200 text-white shadow-xl ring-4 ring-rose-500/40 scale-95 z-10'
                    : expectedFailStep
                    ? 'bg-amber-400 dark:bg-amber-500 border-4 border-white text-slate-950 shadow-xl ring-4 ring-amber-400/50 scale-105 z-20'
                    : matchedCorrectStep !== -1
                    ? 'bg-emerald-500 border-2 border-emerald-200 text-white shadow-md'
                    : remainingExpectedSteps.length > 0
                    ? 'bg-cyan-500/20 border-2 border-dashed border-cyan-400 text-cyan-800 dark:text-cyan-200'
                    : isTrap
                    ? 'bg-rose-900/40 border-2 border-rose-500/50 text-rose-300'
                    : 'bg-white/60 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 opacity-55'
                  : wrongBlockIndex === idx
                  ? 'bg-rose-500 border-4 border-rose-200 text-white shadow-lg scale-95'
                  : correctHintIndex === idx
                  ? 'bg-emerald-500 border-4 border-emerald-200 text-white shadow-lg scale-105'
                  : isHighlighted
                  ? colorForBlock
                    ? 'border-4 border-white shadow-xl scale-105 z-10 text-white'
                    : 'bg-amber-400 border-4 border-white shadow-xl shadow-amber-400/80 scale-105 z-10'
                  : isTrap && isShowingSequence
                  ? 'bg-rose-500 border-4 border-rose-300 text-white animate-pulse'
                  : isUserTapped
                  ? 'bg-emerald-500 dark:bg-emerald-600 border-2 border-emerald-300 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <div style={counterRotateStyle} className="flex flex-col items-center justify-center leading-tight">
                {spatialErrorDiff ? (
                  isWrongCell ? (
                    <>
                      <span className="text-lg sm:text-xl font-black">
                        {isTrap ? 'BẪY!' : `✕ #${spatialErrorDiff.diff.failStep + 1}`}
                      </span>
                      {expectedFailStep && (
                        <span className="text-[11px] font-black bg-amber-300 text-slate-950 px-1.5 rounded">
                          ★ #{spatialErrorDiff.diff.failStep + 1}
                        </span>
                      )}
                    </>
                  ) : expectedFailStep ? (
                    <span className="text-lg sm:text-2xl font-black">
                      ★ #{spatialErrorDiff.diff.failStep + 1}
                    </span>
                  ) : matchedCorrectStep !== -1 ? (
                    <span className="text-base sm:text-xl font-black">
                      ✓ #{matchedCorrectStep}
                    </span>
                  ) : remainingExpectedSteps.length > 0 ? (
                    <span className="text-sm sm:text-base font-black">
                      #{remainingExpectedSteps.join(', #')}
                    </span>
                  ) : null
                ) : isHighlighted ? (
                  isLetterCorsi ? (
                    <span className="text-2xl font-black text-white">
                      {String.fromCharCode(65 + (idx % 26))}
                    </span>
                  ) : (
                    <Sparkles className="w-8 h-8 text-white animate-spin" />
                  )
                ) : isUserTapped ? (
                  <span className="text-base sm:text-lg font-black">
                    #{tappedStepNums.join(', #')}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={elapsedSec}
          playedLevel={effectiveLevel || 1}
          isCustom={isCustom}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            sessionIdRef.current = `session-spatial-${Date.now()}`;
            setScore(0);
            setCorrectRounds(0);
            setElapsedSec(0);
            setCurrentRound(1);
            setSpatialErrorDiff(null);
            setWrongBlockIndex(null);
            setCorrectHintIndex(null);
            setRoundSuccessBanner(false);
            setRestartKey(k => k + 1);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
