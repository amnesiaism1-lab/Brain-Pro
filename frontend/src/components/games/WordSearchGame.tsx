import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateWordSearchGrid, calculateGameScore, VIETNAMESE_WORDS_DICTIONARY } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Check, Sparkles, RotateCcw } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';

export const WordSearchGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastMatchTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('word-search');

  const themes = ['Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy', 'Tổng Hợp'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Khoa Học Não Bộ');
  
  // Level scaling: 1-2: 8x10 (2 words), 3-5: 10x14 (3 words), 6-8: 12x16 (4 words), 9-10: 13x16 (5 words), 11-12: 14x18 (6-7 words)
  const rows = currentLevel <= 2 ? 8 : currentLevel <= 5 ? 10 : currentLevel <= 8 ? 12 : currentLevel <= 10 ? 13 : 14;
  const cols = currentLevel <= 2 ? 10 : currentLevel <= 5 ? 14 : currentLevel <= 8 ? 16 : currentLevel <= 10 ? 16 : 18;
  const wordCount = currentLevel <= 2 ? 2 : currentLevel <= 5 ? 3 : currentLevel <= 8 ? 4 : currentLevel <= 10 ? 5 : 6;

  const pickWords = useCallback((themeName: string) => {
    let pool: string[] = [];
    if (themeName !== 'Tổng Hợp' && THEMED_VOCABULARY[themeName]) {
      pool = THEMED_VOCABULARY[themeName];
    } else {
      pool = readingContentService.getVocabularyList();
      if (pool.length === 0) {
        pool = VIETNAMESE_WORDS_DICTIONARY;
      }
    }

    const sanitized = pool
      .map(w => w.replace(/\s+/g, '').toUpperCase())
      .filter(w => w.length >= 3 && w.length <= (currentLevel >= 9 ? 8 : 6));
    
    const shuffled = [...sanitized].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, wordCount);
  }, [wordCount, currentLevel]);

  const [targetWords, setTargetWords] = useState<string[]>(() => pickWords(selectedTheme));
  const [searchData, setSearchData] = useState(() => generateWordSearchGrid(rows, cols, targetWords));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startNewBoard = useCallback((themeName: string) => {
    const newWords = pickWords(themeName);
    setTargetWords(newWords);
    setSearchData(generateWordSearchGrid(rows, cols, newWords));
    setFoundWords([]);
    setSelectedCells([]);
    setElapsedSec(0);
    setIsFinished(false);
  }, [rows, cols, pickWords]);

  useEffect(() => {
    startNewBoard(selectedTheme);
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel, rows, cols, selectedTheme, startNewBoard]);

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
        entities: { target: matched, cellsCount: nextCells.length, theme: selectedTheme },
        stateBefore: `found:${foundWords.length}`,
        stateAfter: `found:${foundWords.length + 1}`,
        responseMs: respMs,
        correct: true
      });

      const updatedFound = [...foundWords, matched];
      setFoundWords(updatedFound);
      setSelectedCells([]);
      if (updatedFound.length >= targetWords.length) {
        playSound('victory');
        setTimeout(() => setIsFinished(true), 400);
      }
    }
  };

  const handleThemeChange = (newTheme: string) => {
    playSound('click');
    setSelectedTheme(newTheme);
    startNewBoard(newTheme);
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
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Từ đã tìm</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {foundWords.length} / {targetWords.length}
          </div>
        </div>

        {/* Theme Pills */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-700/60">
          {themes.map(t => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                selectedTheme === t
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {elapsedSec}s
          </div>
        </div>
      </div>

      {/* Mobile Theme Selector */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 pb-1">
        {themes.map(t => (
          <button
            key={t}
            onClick={() => handleThemeChange(t)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 border transition-all ${
              selectedTheme === t
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Target Word Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {targetWords.map((word) => {
          const isFound = foundWords.includes(word);
          return (
            <div
              key={word}
              className={`px-4 py-2 sm:py-2.5 rounded-2xl font-black tracking-wider text-xs sm:text-sm md:text-base border shadow-sm transition-all duration-300 flex items-center gap-1.5 ${
                isFound
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-600 dark:text-emerald-400 line-through opacity-75 ring-2 ring-emerald-400/30'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 scale-100 hover:border-brand-500'
              }`}
            >
              {isFound && <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />}
              <span>{word}</span>
            </div>
          );
        })}
      </div>

      {/* Word Search Grid */}
      <div className="p-3 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center overflow-x-auto">
        <div 
          className="grid gap-1 sm:gap-1.5 select-none touch-none"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
          }}
        >
          {searchData.grid.map((row, r) =>
            row.map((letter, c) => {
              const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base md:text-lg flex items-center justify-center transition-all duration-150 btn-press ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 scale-105 shadow-md ring-2 ring-amber-400'
                      : 'bg-[#FDFBF7] dark:bg-slate-900/60 hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Restart Board Button */}
      <div className="flex justify-end">
        <button
          onClick={() => startNewBoard(selectedTheme)}
          className="py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 flex items-center gap-1.5 btn-press"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Tạo ma trận từ mới</span>
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={100}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            startNewBoard(selectedTheme);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
