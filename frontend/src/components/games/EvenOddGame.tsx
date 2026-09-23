import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';

export const EvenOddGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastAnsTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('even-odd') || currentLevel;
  
  const isEquationMode = effectiveLevel >= 10;
  const [currentNumber, setCurrentNumber] = useState(14);
  const [displayEquation, setDisplayEquation] = useState<string | null>(null);
  const [isInverted, setIsInverted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [answersCount, setAnswersCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const nextNumber = () => {
    let num = Math.floor(Math.random() * 899) + 10;
    if (isEquationMode) {
      const a = Math.floor(Math.random() * 40) + 11;
      const b = Math.floor(Math.random() * 40) + 11;
      num = a + b;
      setDisplayEquation(`${a} + ${b}`);
    } else {
      setDisplayEquation(null);
    }
    const invert = effectiveLevel >= 4 && Math.random() < 0.35;
    setCurrentNumber(num);
    setIsInverted(invert);
  };

  useEffect(() => {
    nextNumber();
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
  }, []);

  const handleAnswer = (choice: 'EVEN' | 'ODD') => {
    if (isFinished) return;
    setAnswersCount(c => c + 1);

    const isNumEven = currentNumber % 2 === 0;
    let expected: 'EVEN' | 'ODD' = isNumEven ? 'EVEN' : 'ODD';
    if (isInverted) {
      expected = expected === 'EVEN' ? 'ODD' : 'EVEN';
    }

    const isCorrect = choice === expected;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastAnsTimeRef.current));
    lastAnsTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'even-odd',
      level: effectiveLevel,
      relationId: isInverted ? 'INHIBITION' : 'RULE_ACTION',
      relationWeight: 1.0,
      entities: {
        number: String(currentNumber),
        equation: displayEquation || undefined,
        inverted: isInverted,
        choice,
        expected
      },
      stateBefore: `combo:${combo}`,
      stateAfter: isCorrect ? `combo:${combo + 1}` : 'combo:0',
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      setCorrectCount(c => c + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setScore(s => s + (20 * currentLevel) + (nextCombo * 5));
    } else {
      playSound('wrong');
      setCombo(0);
    }

    nextNumber();
  };

  const accuracy = answersCount > 0 ? Math.round((correctCount / answersCount) * 100) : 100;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số (Chuỗi: x{combo})</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">
            {score}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Number Display Area */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-4">
        {isInverted && (
          <div className="inline-block px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-black animate-pulse border border-red-200 dark:border-red-900">
            ⚠️ ĐẢO NGƯỢC QUY TẮC! (Chẵn chọn LẺ, Lẻ chọn CHẴN)
          </div>
        )}

        <div className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-slate-900 dark:text-white select-none">
          {displayEquation ? displayEquation : currentNumber}
        </div>

        {displayEquation && (
          <p className="text-xs sm:text-sm text-slate-400 font-semibold">
            (Tính kết quả phép tính rồi chọn Chẵn hoặc Lẻ)
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
        <button
          onClick={() => handleAnswer('EVEN')}
          className="py-6 sm:py-7 rounded-3xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-black text-2xl sm:text-3xl shadow-xl shadow-brand-600/30 btn-press"
        >
          CHẴN
        </button>

        <button
          onClick={() => handleAnswer('ODD')}
          className="py-6 sm:py-7 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-600/30 btn-press"
        >
          LẺ
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={30}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScore(0);
            setCombo(0);
            setTimeLeft(30);
            setAnswersCount(0);
            setCorrectCount(0);
            setIsFinished(false);
            nextNumber();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
