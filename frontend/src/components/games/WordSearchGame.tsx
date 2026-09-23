import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateWordSearchGrid, calculateGameScore, VIETNAMESE_WORDS_DICTIONARY } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Check } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

export const WordSearchGame: React.FC = () => {
  const { getExerciseLevel, enableHints, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastMatchTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('word-search');
  
  // Level scaling: 1-2: 8x10 (2 words), 3-5: 10x14 (3 words), 6-8: 12x16 (4 words), 9-10: 13x16 (5 words), 11-12: 14x18 (6-7 words)
  const rows = currentLevel <= 2 ? 8 : currentLevel <= 5 ? 10 : currentLevel <= 8 ? 12 : currentLevel <= 10 ? 13 : 14;
  const cols = currentLevel <= 2 ? 10 : currentLevel <= 5 ? 14 : currentLevel <= 8 ? 16 : currentLevel <= 10 ? 16 : 18;
  const wordCount = currentLevel <= 2 ? 2 : currentLevel <= 5 ? 3 : currentLevel <= 8 ? 4 : currentLevel <= 10 ? 5 : 6;

  const pickWords = useCallback(() => {
    const pool = VIETNAMESE_WORDS_DICTIONARY
      .map(w => w.replace(/\s+/g, ''))
      .filter(w => w.length >= 3 && w.length <= (currentLevel >= 9 ? 8 : 6));
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, wordCount);
  }, [wordCount, currentLevel]);

  const [targetWords, setTargetWords] = useState<string[]>(pickWords);
  const [searchData, setSearchData] = useState(() => generateWordSearchGrid(rows, cols, targetWords));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const newWords = pickWords();
    setTargetWords(newWords);
    setSearchData(generateWordSearchGrid(rows, cols, newWords));
    setFoundWords([]);
    setSelectedCells([]);
    setElapsedSec(0);
    setIsFinished(false);

    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel, rows, cols, pickWords]);

  const handleCellClick = (r: number, c: number) => {
    playSound('click');
    const existing = selectedCells.find(cell => cell.r === r && cell.c === c);
    let nextCells = existing 
      ? selectedCells.filter(cell => !(cell.r === r && cell.c === c))
      : [...selectedCells, { r, c }];

    setSelectedCells(nextCells);

    // Check if the current selected cells spell one of the target words
    const selectedString = nextCells.map(cell => searchData.grid[cell.r][cell.c]).join('');
    const reversedString = selectedString.split('').reverse().join('');

    const matched = targetWords.find(w => !foundWords.includes(w) && (w === selectedString || w === reversedString));
    if (matched) {
      playSound('correct');
      const now = Date.now();
      const respMs = Math.min(20000, Math.max(200, now - lastMatchTimeRef.current));
      lastMatchTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'word-search',
        level: currentLevel,
        relationId: 'SPATIAL_TRANSFORM',
        relationWeight: 1.0,
        entities: { target: matched, cellsCount: nextCells.length },
        stateBefore: `found:${foundWords.length}`,
        stateAfter: `found:${foundWords.length + 1}`,
        responseMs: respMs,
        correct: true
      });

      const updatedFound = [...foundWords, matched];
      setFoundWords(updatedFound);
      setSelectedCells([]);
      if (updatedFound.length >= targetWords.length) {
        setIsFinished(true);
      }
    }
  };

  const timeLimit = 60;
  const score = calculateGameScore({
    level: currentLevel,
    accuracyRate: 100,
    timeLimitSec: timeLimit,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Từ đã tìm</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {foundWords.length} / {targetWords.length}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {elapsedSec}s
          </div>
        </div>
      </div>

      {/* Target Word Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {targetWords.map((word) => {
          const isFound = foundWords.includes(word);
          return (
            <div
              key={word}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 transition-all shadow-sm ${
                isFound
                  ? 'bg-emerald-500 text-white scale-95 opacity-80 shadow-emerald-500/30'
                  : 'bg-white dark:bg-slate-800 border-2 border-brand-500 text-brand-700 dark:text-brand-300'
              }`}
            >
              {isFound && <Check className="w-4 h-4" />}
              <span>{word}</span>
            </div>
          );
        })}
      </div>

      {/* Word Search Grid Matrix */}
      <div 
        className="grid gap-1 sm:gap-1.5 bg-[#F5EFE6] dark:bg-slate-800/90 p-3 sm:p-5 md:p-6 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none overflow-x-auto justify-center"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {searchData.grid.map((row, r) =>
          row.map((letter, c) => {
            const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
            const isHint = enableHints && searchData.placedWords.some(pw => pw.row === r && pw.col === c && !foundWords.includes(pw.word));

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center font-mono font-black text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl transition-all duration-100 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md scale-105 z-10'
                    : isHint
                      ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-brand-50 hover:border-brand-300 border border-slate-200/60 dark:border-slate-600'
                }`}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={100}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setSearchData(generateWordSearchGrid(rows, cols, targetWords));
            setFoundWords([]);
            setSelectedCells([]);
            setElapsedSec(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
