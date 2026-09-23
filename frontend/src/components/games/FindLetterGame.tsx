import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';

export const FindLetterGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const lastClickRef = React.useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('find-letter') || currentLevel;

  const isCaseSensitive = effectiveLevel >= 9;
  const gridSize = effectiveLevel <= 2 ? 5 : effectiveLevel <= 5 ? 6 : effectiveLevel <= 8 ? 7 : 8;
  const targetLetter = isCaseSensitive ? 'ả' : 'A';
  const distractors = isCaseSensitive 
    ? ['a', 'á', 'à', 'ã', 'ạ', 'A', 'Á', 'À', 'Ả']
    : ['B', 'P', 'R', 'E', '4', '8'];
  const targetCount = effectiveLevel <= 2 ? 3 : effectiveLevel <= 5 ? 4 : effectiveLevel <= 8 ? 5 : 7;

  const [grid, setGrid] = useState<Array<{ id: number; char: string; isTarget: boolean; found: boolean }>>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const initGrid = () => {
    const totalCells = gridSize * gridSize;
    const items: Array<{ id: number; char: string; isTarget: boolean; found: boolean }> = [];
    
    // Distribute target count
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    for (let i = 0; i < totalCells; i++) {
      const isTarget = targetIndices.has(i);
      items.push({
        id: i,
        char: isTarget ? targetLetter : distractors[Math.floor(Math.random() * distractors.length)],
        isTarget,
        found: false
      });
    }
    setGrid(items);
    setFoundCount(0);
    setMissCount(0);
    setElapsedSec(0);
    setIsFinished(false);
  };

  useEffect(() => {
    initGrid();
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel, gridSize]);

  const handleCellClick = (cellId: number) => {
    const cell = grid.find(c => c.id === cellId);
    if (!cell || cell.found) return;

    const isCorrect = cell.isTarget;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickRef.current));
    lastClickRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'find-letter',
      level: effectiveLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: targetLetter,
        distractor: !isCorrect ? cell.char : undefined,
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
        playSound('correct');
        setIsFinished(true);
      }
    } else {
      playSound('wrong');
      setMissCount(m => m + 1);
    }
  };

  const totalClicks = foundCount + missCount;
  const accuracy = totalClicks > 0 ? Math.round((foundCount / totalClicks) * 100) : 100;
  const score = calculateGameScore({
    level: currentLevel,
    accuracyRate: accuracy,
    timeLimitSec: 40,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            {targetLetter}
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Mục tiêu cần tìm</span>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              Đã tìm: <strong className="text-brand-600 text-base sm:text-lg">{foundCount} / {targetCount}</strong>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {elapsedSec}s
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Quét nhanh qua ma trận ký tự và nhấp vào tất cả chữ <strong>"{targetLetter}"</strong>!
      </p>

      {/* Grid */}
      <div 
        className="grid gap-2 sm:gap-3 md:gap-4 bg-[#F5EFE6] dark:bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none aspect-square"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((cell) => (
          <button
            key={cell.id}
            onClick={() => handleCellClick(cell.id)}
            className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-100 btn-press text-slate-800 dark:text-white text-base sm:text-xl md:text-2xl lg:text-3xl ${
              cell.found
                ? 'bg-emerald-500 text-white shadow scale-95 cursor-default'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 shadow-sm'
            }`}
          >
            {cell.char}
          </button>
        ))}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            initGrid();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
