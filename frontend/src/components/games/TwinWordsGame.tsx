import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { generateTwinWords, VIETNAMESE_WORDS_DICTIONARY } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';

export const TwinWordsGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastChoiceTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('twin-words');
  const [round, setRound] = useState(1);
  const maxRounds = currentLevel >= 9 ? 12 : 10;
  
  const [pair, setPair] = useState(() => {
    const word = VIETNAMESE_WORDS_DICTIONARY[0].replace(/\s+/g, '');
    return generateTwinWords(word, true);
  });
  const [showWords, setShowWords] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const nextPair = () => {
    const randWord = VIETNAMESE_WORDS_DICTIONARY[Math.floor(Math.random() * VIETNAMESE_WORDS_DICTIONARY.length)].replace(/\s+/g, '');
    const shouldMatch = Math.random() < 0.5;
    setPair(generateTwinWords(randWord, shouldMatch));
    setShowWords(true);
    // At level 9+, words flash and disappear after a short window (memory challenge)
    if (currentLevel >= 9) {
      const flashMs = Math.max(400, 1000 - (currentLevel - 9) * 180);
      setTimeout(() => setShowWords(false), flashMs);
    }
  };

  useEffect(() => {
    nextPair();
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel]);

  const handleChoice = (isMatchChoice: boolean) => {
    if (isFinished) return;
    const isCorrect = isMatchChoice === pair.isMatch;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastChoiceTimeRef.current));
    lastChoiceTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'twin-words',
      level: currentLevel,
      relationId: 'IDENTITY_MATCH',
      relationWeight: 1.0,
      entities: {
        wordA: pair.word1,
        wordB: pair.word2,
        shouldMatch: pair.isMatch,
        choice: isMatchChoice
      },
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
      nextPair();
    }
  };

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = (correctCount * 30 * currentLevel) + Math.max(0, (30 - elapsedSec) * 5);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tiến trình</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {round} / {maxRounds}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {elapsedSec}s
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        So sánh chớp nhoáng: Hai từ vựng bên dưới giống hệt nhau hay có ký tự khác biệt?
      </p>

      {/* Side-by-side Twin Words Display */}
      <div className="h-56 sm:h-64 md:h-72 rounded-3xl bg-white dark:bg-slate-800 border-2 border-brand-500/80 shadow-2xl flex items-center justify-around p-6 sm:p-8">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono tracking-wider text-slate-800 dark:text-white transition-opacity">
          {showWords ? pair.word1 : '••••••'}
        </div>
        <div className="w-0.5 h-16 sm:h-20 bg-slate-300 dark:bg-slate-700" />
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono tracking-wider text-slate-800 dark:text-white transition-opacity">
          {showWords ? pair.word2 : '••••••'}
        </div>
      </div>

      {/* Two Big Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <button
          onClick={() => handleChoice(true)}
          className="py-5 sm:py-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg sm:text-xl md:text-2xl shadow-xl shadow-emerald-600/30 btn-press"
        >
          GIỐNG NHAU
        </button>

        <button
          onClick={() => handleChoice(false)}
          className="py-5 sm:py-6 rounded-3xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-lg sm:text-xl md:text-2xl shadow-xl shadow-rose-600/30 btn-press"
        >
          KHÁC NHAU
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCorrectCount(0);
            setElapsedSec(0);
            setIsFinished(false);
            nextPair();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
