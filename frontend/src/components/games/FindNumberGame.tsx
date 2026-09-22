import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';

export const FindNumberGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const currentLevel = getExerciseLevel('find-number');
  const gridSize = currentLevel <= 2 ? 4 : currentLevel <= 5 ? 5 : currentLevel <= 8 ? 6 : 7;
  const totalCells = gridSize * gridSize;

  const [numbers, setNumbers] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number>(9);
  const [foundCount, setFoundCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  const generateBoard = () => {
    const list: number[] = [];
    const maxVal = currentLevel <= 2 ? 20 : currentLevel <= 5 ? 50 : currentLevel <= 8 ? 99 : 200;
    for (let i = 0; i < totalCells; i++) {
      list.push(Math.floor(Math.random() * maxVal) + 1);
    }
    const randTarget = list[Math.floor(Math.random() * list.length)];
    setNumbers(list);
    setTargetNumber(randTarget);
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
    if (num === targetNumber) {
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
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-brand-600 text-white font-black text-2xl sm:text-4xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            {targetNumber}
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Số mục tiêu cần tìm</span>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              Đã tìm thấy: <strong className="text-brand-600 text-base sm:text-lg">{foundCount}</strong>
            </div>
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
          onRestart={() => {
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
