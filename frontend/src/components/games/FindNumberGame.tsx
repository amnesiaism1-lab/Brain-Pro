import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';

export const FindNumberGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastClickRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('find-number');
  const gridSize = currentLevel <= 2 ? 4 : currentLevel <= 5 ? 5 : currentLevel <= 8 ? 6 : 7;
  const totalCells = gridSize * gridSize;

  const [numbers, setNumbers] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number>(9);
  const [foundCount, setFoundCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const isMathTarget = currentLevel >= 10;
  const [mathConditionText, setMathConditionText] = useState<string>('Số chia hết cho 3');

  const generateBoard = () => {
    const list: number[] = [];
    const maxVal = currentLevel <= 2 ? 20 : currentLevel <= 5 ? 50 : currentLevel <= 8 ? 99 : 200;
    for (let i = 0; i < totalCells; i++) {
      list.push(Math.floor(Math.random() * maxVal) + 1);
    }
    
    if (isMathTarget) {
      // Ensure at least 3 matching numbers exist in grid
      const validNumbers = list.filter(n => n % 3 === 0);
      if (validNumbers.length < 3) {
        list[0] = 3 * (Math.floor(Math.random() * 20) + 1);
        list[1] = 3 * (Math.floor(Math.random() * 20) + 1);
        list[2] = 3 * (Math.floor(Math.random() * 20) + 1);
      }
      setMathConditionText('Tìm số chia hết cho 3');
      setTargetNumber(0); // Flag that we use math condition
    } else {
      const randTarget = list[Math.floor(Math.random() * list.length)];
      setTargetNumber(randTarget);
    }
    setNumbers(list);
  };

  useEffect(() => {
    generateBoard();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentLevel]);

  const handleCellClick = (num: number) => {
    if (isFinished) return;
    const isCorrect = isMathTarget ? (num % 3 === 0) : (num === targetNumber);
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickRef.current));
    lastClickRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'find-number',
      level: currentLevel,
      relationId: isMathTarget ? 'RULE_ACTION' : 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: isMathTarget ? 'chia hết cho 3' : String(targetNumber),
        distractor: String(num)
      },
      stateBefore: `found:${foundCount}`,
      stateAfter: isCorrect ? `found:${foundCount + 1}` : `found:${foundCount}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      setFoundCount(c => c + 1);
      generateBoard();
    } else {
      playSound('wrong');
    }
  };

  const score = calculateGameScore({
    level: currentLevel,
    accuracyRate: 95,
    timeLimitSec: 30,
    timeSpentSec: 30 - timeLeft,
    baseScore: foundCount * 25
  });

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-brand-600 text-white font-black text-xl sm:text-3xl flex items-center justify-center shadow-lg shadow-brand-600/30 px-1 text-center">
            {isMathTarget ? '÷3' : targetNumber}
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              {isMathTarget ? 'Quy tắc số học đích' : 'Số mục tiêu cần tìm'}
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              {isMathTarget ? <strong className="text-indigo-600 dark:text-indigo-400">{mathConditionText}</strong> : <>Đã tìm thấy: <strong className="text-brand-600 text-base sm:text-lg">{foundCount}</strong></>}
            </div>
            {isMathTarget && (
              <div className="text-xs font-semibold text-slate-500">
                Đã giải đúng: <strong className="text-brand-600">{foundCount}</strong>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian còn lại</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Grid */}
      <div 
        className="grid gap-2 sm:gap-3 md:gap-4 bg-[#F5EFE6] dark:bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none aspect-square"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {numbers.map((num, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(num)}
            className="flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-100 btn-press text-slate-800 dark:text-white text-base sm:text-xl md:text-2xl lg:text-3xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 shadow-sm active:scale-95"
          >
            {num}
          </button>
        ))}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={95}
          timeSpentSec={30}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setFoundCount(0);
            setTimeLeft(30);
            setIsFinished(false);
            generateBoard();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
