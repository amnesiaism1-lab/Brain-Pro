import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Crosshair } from 'lucide-react';

export const PeripheralVisionGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const currentLevel = getExerciseLevel('peripheral-vision');
  // At level 9-12, span expands up to 180px and flash speed drops to 150ms
  const span = Math.min(180, 70 + (currentLevel * 10));
  const alphabet = ['A', 'K', 'M', 'T', 'X', 'B', 'H', 'P'].slice(0, currentLevel >= 9 ? 8 : 6);

  const [pair, setPair] = useState<[string, string]>(['A', 'K']);
  const [targetSide, setTargetSide] = useState<'left' | 'right' | 'top' | 'bottom'>('left');
  const [phase, setPhase] = useState<'flash' | 'guess'>('flash');
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const maxRounds = currentLevel >= 9 ? 8 : 5;

  const nextRound = () => {
    const c1 = alphabet[Math.floor(Math.random() * alphabet.length)];
    let c2 = alphabet[Math.floor(Math.random() * alphabet.length)];
    setPair([c1, c2]);
    setTargetSide(currentLevel >= 9 ? (Math.random() < 0.5 ? 'left' : 'right') : 'left');
    setPhase('flash');

    const flashDuration = Math.max(150, 600 - (currentLevel * 45));
    setTimeout(() => {
      setPhase('guess');
    }, flashDuration);
  };

  useEffect(() => {
    nextRound();
  }, [round, currentLevel]);

  const handleGuess = (guessChar: string) => {
    playSound('click');
    const expected = targetSide === 'left' ? pair[0] : pair[1];
    if (guessChar === expected) {
      playSound('correct');
      setCorrectCount(c => c + 1);
    } else {
      playSound('wrong');
    }

    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(r => r + 1);
    }
  };

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = (correctCount * 50 * currentLevel) + 100;

  const effectiveSpan = typeof window !== 'undefined' && window.innerWidth >= 768 ? Math.min(320, Math.round(span * 1.5)) : span;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Lượt thử</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {round} / {maxRounds}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Độ mở góc nhìn</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {effectiveSpan * 2}px
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Khóa chặt mắt vào <strong>Tâm Ngắm đỏ</strong> ở chính giữa! Không đảo con ngươi sang hai bên.
      </p>

      {/* Crosshair Viewbox */}
      <div className="h-64 sm:h-72 md:h-84 rounded-3xl bg-slate-900 border-2 border-brand-500/80 shadow-2xl flex items-center justify-center relative overflow-hidden">
        {/* Center Target */}
        <div className="relative flex items-center justify-center">
          <Crosshair className="w-16 h-16 text-rose-500 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500" />
        </div>

        {/* Left and Right Peripheral Flash Targets */}
        {phase === 'flash' && (
          <>
            <div 
              className="absolute font-mono font-black text-4xl sm:text-5xl text-cyan-400 select-none animate-scale-up"
              style={{ transform: `translateX(-${effectiveSpan}px)` }}
            >
              {pair[0]}
            </div>
            <div 
              className="absolute font-mono font-black text-4xl sm:text-5xl text-cyan-400 select-none animate-scale-up"
              style={{ transform: `translateX(${effectiveSpan}px)` }}
            >
              {pair[1]}
            </div>
          </>
        )}
      </div>

      {/* Guess Buttons */}
      <div className="space-y-3">
        <span className="text-xs sm:text-sm text-center block text-slate-600 dark:text-slate-400 font-bold">
          {phase === 'guess' 
            ? `Chữ cái nào vừa xuất hiện ở vùng nhìn bên ${targetSide === 'left' ? 'TRÁI' : 'PHẢI'}?` 
            : 'Đang tập trung nhìn tâm ngắm...'}
        </span>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {alphabet.map((char) => (
            <button
              key={char}
              disabled={phase !== 'guess'}
              onClick={() => handleGuess(char)}
              className="py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:border-brand-500 hover:scale-[1.03] active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={25}
          onRestart={() => {
            setRound(1);
            setCorrectCount(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
