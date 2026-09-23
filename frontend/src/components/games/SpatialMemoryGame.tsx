import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

export const SpatialMemoryGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('spatial-memory') || currentLevel;

  const gridSize = useMemo(() => {
    if (effectiveLevel <= 2) return 3; // 3x3 = 9 blocks
    if (effectiveLevel <= 5) return 4; // 4x4 = 16 blocks
    if (effectiveLevel <= 9) return 5; // 5x5 = 25 blocks
    return 6; // 6x6 = 36 blocks for level 10-12
  }, [effectiveLevel]);

  const targetSequenceLength = useMemo(() => {
    return Math.min(13, 2 + effectiveLevel); // from 3 up to 13
  }, [effectiveLevel]);

  const isReverseOrder = effectiveLevel === 8 || effectiveLevel === 9;

  const [sequence, setSequence] = useState<number[]>([]);
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

    setSequence(newSeq);
    setUserInputs([]);
    setIsShowingSequence(true);

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
        }, 500);
      } else {
        clearInterval(interval);
        setActiveHighlightIndex(null);
        setIsShowingSequence(false);
      }
    }, 850);
  }, [totalBlocks, targetSequenceLength, playSound]);

  useEffect(() => {
    startNewSequence(currentRound);
  }, [startNewSequence, currentRound]);

  const handleBlockClick = (blockIndex: number) => {
    if (isShowingSequence || isFinished) return;

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
    return 'grid-cols-5';
  }, [gridSize]);

  const accuracyRate = Math.max(50, Math.min(100, Math.round(100 - (mistakes * 10))));

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-2xl lg:max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
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
            <span>Đến lượt bạn: Hãy bấm lại theo đúng thứ tự! {isReverseOrder && '(ĐẢO NGƯỢC)'}</span>
          </>
        )}
      </div>

      {/* Spatial Matrix Grid */}
      <div className={`w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto aspect-square grid ${gridClass} gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl`}>
        {Array.from({ length: totalBlocks }).map((_, idx) => {
          const isHighlighted = activeHighlightIndex === idx;
          const isUserTapped = userInputs.includes(idx);

          return (
            <button
              key={`block-${idx}`}
              onClick={() => handleBlockClick(idx)}
              disabled={isShowingSequence}
              className={`w-full h-full aspect-square rounded-2xl sm:rounded-3xl font-black text-xl transition-all duration-150 btn-press relative flex items-center justify-center ${
                isHighlighted
                  ? 'bg-amber-400 border-4 border-white shadow-xl shadow-amber-400/80 scale-105 z-10'
                  : isUserTapped
                  ? 'bg-brand-500 border-2 border-brand-300 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isHighlighted && <Sparkles className="w-8 h-8 text-white animate-spin" />}
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
