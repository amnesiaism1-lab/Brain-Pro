import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Crosshair, Type, Sparkles } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { PERIPHERAL_FLASH_WORDS } from '../../services/readingContentService';

const FULL_ALPHABET = ['A', 'B', 'C', 'D', 'Đ', 'E', 'G', 'H', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y'];

export const PeripheralVisionGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastGuessTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('peripheral-vision');
  
  // Span expands with level
  const span = Math.min(220, 75 + (currentLevel * 12));
  
  // Mode: 'letters' vs 'words' (peripheral word recognition)
  const [contentMode, setContentMode] = useState<'letters' | 'words'>(() => {
    try {
      const saved = localStorage.getItem('be_pref_peripheral_stimulus');
      if (saved === 'words' || saved === 'letters') return saved;
    } catch {}
    return 'letters';
  });

  const pool = useMemo(() => {
    return contentMode === 'words' ? PERIPHERAL_FLASH_WORDS : FULL_ALPHABET;
  }, [contentMode]);

  const [pair, setPair] = useState<[string, string]>(() => ['A', 'K']);
  const [targetSide, setTargetSide] = useState<'left' | 'right'>('left');
  const [choices, setChoices] = useState<string[]>([]);
  const [phase, setPhase] = useState<'flash' | 'guess'>('flash');
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const maxRounds = useMemo(() => {
    try {
      const saved = localStorage.getItem('be_pref_peripheral_rounds');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return currentLevel >= 9 ? 10 : 8;
  }, [currentLevel]);

  const nextRound = useCallback(() => {
    const c1 = pool[Math.floor(Math.random() * pool.length)];
    let c2 = pool[Math.floor(Math.random() * pool.length)];
    while (c2 === c1 && pool.length > 1) {
      c2 = pool[Math.floor(Math.random() * pool.length)];
    }

    const side = Math.random() < 0.5 ? 'left' : 'right';
    const targetExpected = side === 'left' ? c1 : c2;

    // Pick 3 distractors from pool
    const otherOptions = pool.filter(item => item !== targetExpected);
    const shuffledOthers = [...otherOptions].sort(() => 0.5 - Math.random()).slice(0, 3);
    const currentChoices = [targetExpected, ...shuffledOthers].sort(() => 0.5 - Math.random());

    setPair([c1, c2]);
    setTargetSide(side);
    setChoices(currentChoices);
    setPhase('flash');

    const flashDuration = Math.max(260, 780 - (currentLevel * 45));
    setTimeout(() => {
      setPhase('guess');
    }, flashDuration);
  }, [pool, currentLevel]);

  useEffect(() => {
    nextRound();
  }, [round, contentMode, nextRound]);

  const handleGuess = (guessVal: string) => {
    playSound('click');
    const expected = targetSide === 'left' ? pair[0] : pair[1];
    const isCorrect = guessVal === expected;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastGuessTimeRef.current));
    lastGuessTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'peripheral-vision',
      level: currentLevel,
      relationId: 'FOCUS_FIELD',
      relationWeight: 1.0,
      entities: { targetSide, expected, guessVal, mode: contentMode, span: effectiveSpan },
      stateBefore: `round:${round}`,
      stateAfter: isCorrect ? `round:${round + 1}` : `round:${round}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
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

  const effectiveSpan = typeof window !== 'undefined' && window.innerWidth >= 768 
    ? Math.min(320, Math.round(span * 1.5)) 
    : span;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Lượt thử</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {round} / {maxRounds}
          </div>
        </div>

        {/* Content Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl">
          <button
            onClick={() => {
              playSound('click');
              setContentMode('letters');
              setRound(1);
              setCorrectCount(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              contentMode === 'letters'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Ký tự</span>
          </button>
          <button
            onClick={() => {
              playSound('click');
              setContentMode('words');
              setRound(1);
              setCorrectCount(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              contentMode === 'words'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Từ vựng ngoại vi</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Độ mở góc nhìn</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {effectiveSpan * 2}px
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Khóa chặt mắt vào <strong>Tâm Ngắm đỏ</strong> ở chính giữa! Dùng thị giác ngoại vi để nhận diện mục tiêu lóe sáng ở hai biên.
      </p>

      {/* Crosshair Viewbox */}
      <div className="h-64 sm:h-72 rounded-3xl bg-slate-900 border-2 border-brand-500/80 shadow-2xl relative overflow-hidden flex items-center">
        {/* Left peripheral target zone */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center" style={{ width: `calc(50% - 48px)` }}>
          {phase === 'flash' && (
            <span
              key={`left-${round}`}
              className={`font-black text-cyan-400 select-none animate-scale-up tracking-wider ${
                contentMode === 'words' ? 'text-2xl sm:text-3xl' : 'font-mono text-4xl sm:text-5xl'
              }`}
            >
              {pair[0]}
            </span>
          )}
        </div>

        {/* Center fixation point */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          {/* Subtle hairline crosshair – guides eye without blocking targets */}
          <div className="relative flex items-center justify-center" style={{ opacity: 0.35 }}>
            <div className="absolute w-7 h-[1px] bg-slate-300" />
            <div className="absolute h-7 w-[1px] bg-slate-300" />
            <div className="absolute w-[4px] h-[4px] rounded-full bg-rose-400" />
          </div>
        </div>

        {/* Right peripheral target zone */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center" style={{ width: `calc(50% - 48px)` }}>
          {phase === 'flash' && (
            <span
              key={`right-${round}`}
              className={`font-black text-cyan-400 select-none animate-scale-up tracking-wider ${
                contentMode === 'words' ? 'text-2xl sm:text-3xl' : 'font-mono text-4xl sm:text-5xl'
              }`}
            >
              {pair[1]}
            </span>
          )}
        </div>

        {/* Peripheral span indicator lines */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <div className="w-full h-px bg-cyan-400" />
        </div>
      </div>

      {/* Guess Buttons */}
      <div className="space-y-3">
        <span className="text-xs sm:text-sm text-center block text-slate-600 dark:text-slate-400 font-bold">
          {phase === 'guess' 
            ? `${contentMode === 'words' ? 'Từ' : 'Ký tự'} nào vừa xuất hiện ở vùng ngoại vi bên ${targetSide === 'left' ? 'TRÁI' : 'PHẢI'}?` 
            : 'Đang tập trung nhìn tâm ngắm...'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {choices.map((val) => (
            <button
              key={val}
              disabled={phase !== 'guess'}
              onClick={() => handleGuess(val)}
              className="py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-black text-xl sm:text-2xl text-slate-800 dark:text-white shadow hover:border-brand-500 hover:scale-[1.03] active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={25}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCorrectCount(0);
            setIsFinished(false);
            nextRound();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
