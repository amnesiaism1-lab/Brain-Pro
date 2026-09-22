import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { Delete } from 'lucide-react';

export const DigitSpanGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const effectiveLevel = getExerciseLevel('digit-span') || currentLevel;
  const isReverseSpan = effectiveLevel >= 9;
  const digitCount = Math.min(15, 3 + effectiveLevel); // 4 to 15 digits
  
  const generateDigits = (len: number) => {
    let str = '';
    for (let i = 0; i < len; i++) {
      str += Math.floor(Math.random() * 10).toString();
    }
    return str;
  };

  const [digits, setDigits] = useState(() => generateDigits(digitCount));
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [userInput, setUserInput] = useState('');
  const [round, setRound] = useState(1);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const maxRounds = 3;

  useEffect(() => {
    setDigits(generateDigits(digitCount));
    setPhase('memorize');
    setUserInput('');

    const flashDuration = 1000 + (digitCount * 300);
    const timer = setTimeout(() => {
      setPhase('recall');
    }, flashDuration);

    return () => clearTimeout(timer);
  }, [round, effectiveLevel, digitCount]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNumpad = (num: number) => {
    if (phase !== 'recall') return;
    playSound('click');
    if (userInput.length < digits.length) {
      const nextInput = userInput + num.toString();
      setUserInput(nextInput);

      if (nextInput.length === digits.length) {
        const expected = isReverseSpan ? digits.split('').reverse().join('') : digits;
        if (nextInput === expected) {
          playSound('correct');
          setCorrectCount(c => c + 1);
        } else {
          playSound('wrong');
        }

        setTimeout(() => {
          if (round >= maxRounds) {
            setIsFinished(true);
          } else {
            setRound(r => r + 1);
          }
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    playSound('click');
    setUserInput(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'recall' || isFinished) return;
      if (e.key >= '0' && e.key <= '9') {
        handleNumpad(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isFinished, userInput, digits]);

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = calculateGameScore({
    level: currentLevel,
    accuracyRate: accuracy,
    timeLimitSec: 45,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Lượt kiểm tra</span>
          <div className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {round} / {maxRounds}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Độ dài chuỗi</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            {digitCount} số {isReverseSpan && <span className="text-rose-500 text-xs sm:text-sm ml-1 font-bold">(Đảo ngược)</span>}
          </div>
        </div>
      </div>

      {/* Center Digit Display / Recall Box */}
      <div className="h-56 sm:h-64 md:h-72 rounded-3xl bg-brand-600 dark:bg-brand-700 text-white flex flex-col items-center justify-center p-6 sm:p-8 shadow-2xl relative overflow-hidden border-2 border-brand-400">
        {phase === 'memorize' ? (
          <div className="space-y-2 text-center animate-pulse">
            <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
              {isReverseSpan ? 'Ghi nhớ dãy số (Chuẩn bị gõ đảo ngược)' : 'Ghi nhớ dãy số'}
            </span>
            <div className="text-4xl sm:text-6xl md:text-7xl font-mono font-black tracking-widest text-amber-300">
              {digits}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-center w-full">
            <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
              {isReverseSpan ? 'Nhập lại dãy số theo thứ tự đảo ngược' : 'Nhập lại dãy số'}
            </span>
            <div className="text-3xl sm:text-5xl md:text-6xl font-mono font-black tracking-widest min-h-[56px] sm:min-h-[72px] bg-black/20 rounded-2xl sm:rounded-3xl flex items-center justify-center px-4">
              {userInput ? userInput : <span className="opacity-40">???</span>}
            </div>
          </div>
        )}
      </div>

      {/* Onscreen Numpad + Physical Keyboard friendly */}
      <div className="space-y-2">
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
          (Bạn có thể bấm số trên bàn phím máy tính hoặc bấm các phím dưới đây)
        </p>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              disabled={phase !== 'recall'}
              onClick={() => handleNumpad(n)}
              className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            disabled={phase !== 'recall'}
            onClick={() => handleNumpad(0)}
            className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40"
          >
            0
          </button>
          <button
            disabled={phase !== 'recall' || userInput.length === 0}
            onClick={handleDelete}
            className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40"
          >
            <Delete className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          onRestart={() => {
            setRound(1);
            setCorrectCount(0);
            setElapsedSec(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
