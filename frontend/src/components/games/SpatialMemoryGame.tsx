import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

export const SpatialMemoryGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('spatial-memory') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const gridSize = useMemo(() => {
    if (effectiveLevel >= 19) return 6;
    if (effectiveLevel >= 13) return 5;
    if (effectiveLevel <= 2) return 3;
    if (effectiveLevel <= 5) return 4;
    if (effectiveLevel <= 9) return 5;
    return 6;
  }, [effectiveLevel]);

  const targetSequenceLength = useMemo(() => {
    if (isInfinity) return Math.min(14, 4 + infinityTier);
    return Math.min(13, 2 + effectiveLevel);
  }, [effectiveLevel, isInfinity, infinityTier]);

  const isReverseOrder = effectiveLevel === 8 || effectiveLevel === 9 || effectiveLevel === 16;
  const isColorCorsi = effectiveLevel === 13;
  const isLetterCorsi = effectiveLevel === 14;
  const isTrapBlockMode = effectiveLevel === 17;
  const isFastFlash = effectiveLevel === 20;
  const isRotatingBoard = effectiveLevel === 22;

  const CORSI_COLORS = ['#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
  const CORSI_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

  const [sequence, setSequence] = useState<number[]>([]);
  const [trapBlockIndex, setTrapBlockIndex] = useState<number | null>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [userInputs, setUserInputs] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const totalBlocks = gridSize * gridSize;

  // Generate a random non-consecutive block sequence
  const startNewSequence = useCallback((round: number) => {
    const seqLength = Math.min(targetSequenceLength, 2 + round);
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

    const stepIntervalMs = isFastFlash ? 400 : isInfinity ? 600 : 850;
    const highlightMs = isFastFlash ? 260 : isInfinity ? 380 : 500;

    // Playback sequence animation
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        const block = newSeq[step];
        setActiveHighlightIndex(block);
        playSound('click');
        step++;

        // Turn off highlight shortly after
        setTimeout(() => {
          setActiveHighlightIndex(null);
        }, highlightMs);
      } else {
        clearInterval(interval);
        setActiveHighlightIndex(null);
        setIsShowingSequence(false);
      }
    }, stepIntervalMs);
  }, [totalBlocks, targetSequenceLength, playSound, isInfinity, isFastFlash, isTrapBlockMode]);

  useEffect(() => {
    startNewSequence(currentRound);
  }, [startNewSequence, currentRound]);

  const handleBlockClick = (blockIndex: number) => {
    if (isShowingSequence || isFinished) return;

    // Check if clicked the trap block in level 17
    if (isTrapBlockMode && blockIndex === trapBlockIndex) {
      playSound('wrong');
      setMistakes(m => m + 1);
      setTimeout(() => startNewSequence(currentRound), 600);
      return;
    }

    playSound('click');
    const nextInputs = [...userInputs, blockIndex];
    setUserInputs(nextInputs);

    // Check correctness of this input
    const expectedSequence = isReverseOrder ? [...sequence].reverse() : sequence;
    const currentStep = nextInputs.length - 1;
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
      responseMs: 450,
      correct: isCorrect
    });

    if (!isCorrect) {
      // Mistake!
      playSound('wrong');
      setMistakes(m => m + 1);
      setTimeout(() => {
        // Retry current round
        startNewSequence(currentRound);
      }, 600);
      return;
    }

    // Correct tap
    playSound('correct');

    if (nextInputs.length === sequence.length) {
      // Completed round!
      const addedScore = 100 + (sequence.length * 30) + (currentLevel * 15);
      setScore(s => s + addedScore);

      if (currentRound >= 5) {
        // Complete game after 5 progressive rounds
        setTimeout(() => {
          setIsFinished(true);
        }, 400);
      } else {
        setTimeout(() => {
          setCurrentRound(r => r + 1);
        }, 700);
      }
    }
  };

  const gridClass = useMemo(() => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    if (gridSize === 5) return 'grid-cols-5';
    return 'grid-cols-6';
  }, [gridSize]);

  const accuracyRate = Math.max(50, Math.min(100, Math.round(100 - (mistakes * 10))));

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
            {currentRound} / 5
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
      <div className={`p-4 rounded-2xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
        isShowingSequence 
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300 animate-pulse' 
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
      }`}>
        {isShowingSequence ? (
          <>
            <Eye className="w-5 h-5 animate-bounce" />
            <span>Quan sát chuỗi ô phát sáng...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Đến lượt bạn: Hãy bấm lại theo đúng thứ tự! {isReverseOrder && '(ĐẢO NGƯỢC)'} {isRotatingBoard && '(BẢNG ĐÃ TỰ XOAY 90°)'}</span>
          </>
        )}
      </div>

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
          const isUserTapped = userInputs.includes(idx);
          const colorForBlock = isColorCorsi ? CORSI_COLORS[idx % CORSI_COLORS.length] : undefined;
          const isTrap = isTrapBlockMode && idx === trapBlockIndex;

          return (
            <button
              key={`block-${idx}`}
              onClick={() => handleBlockClick(idx)}
              disabled={isShowingSequence}
              style={{
                backgroundColor: isHighlighted && colorForBlock ? colorForBlock : undefined
              }}
              className={`w-full h-full aspect-square rounded-2xl sm:rounded-3xl font-black text-xl transition-all duration-150 btn-press relative flex items-center justify-center ${
                isHighlighted
                  ? colorForBlock 
                    ? 'border-4 border-white shadow-xl scale-105 z-10 text-white' 
                    : 'bg-amber-400 border-4 border-white shadow-xl shadow-amber-400/80 scale-105 z-10'
                  : isTrap && isShowingSequence
                  ? 'bg-rose-500 border-4 border-rose-300 text-white animate-pulse'
                  : isUserTapped
                  ? 'bg-brand-500 border-2 border-brand-300 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isHighlighted && !isLetterCorsi && <Sparkles className="w-8 h-8 text-white animate-spin" />}
              {isHighlighted && isLetterCorsi && (
                <span className="text-2xl font-black text-white">{String.fromCharCode(65 + (idx % 26))}</span>
              )}
            </button>
          );
        })}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={45}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScore(0);
            setMistakes(0);
            setCurrentRound(1);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
