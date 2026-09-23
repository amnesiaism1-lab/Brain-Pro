import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateWordSearchGrid, calculateGameScore, VIETNAMESE_WORDS_DICTIONARY, INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Check, Sparkles, RotateCcw, Infinity as InfinityIcon } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { 
  CURATED_DICTIONARY, 
  SYNONYM_PAIRS,
  ANTONYM_PAIRS,
  BILINGUAL_WORD_PAIRS,
  EMOJI_WORD_PAIRS,
  NASA_OFFLINE_CARDS,
  GEOGRAPHY_TRIADS,
  PERIODIC_TABLE_TRIADS
} from '../../services/infinityApiService';

export const WordSearchGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastMatchTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('word-search');
  const isInfinity = currentLevel >= 13;

  const themes = ['Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy', 'Tổng Hợp'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Khoa Học Não Bộ');
  
  // Level scaling
  const rows = currentLevel >= 22 ? 15 : currentLevel >= 19 ? 14 : currentLevel <= 2 ? 8 : currentLevel <= 5 ? 10 : currentLevel <= 8 ? 12 : 13;
  const cols = currentLevel >= 22 ? 18 : currentLevel >= 19 ? 17 : currentLevel <= 2 ? 10 : currentLevel <= 5 ? 14 : currentLevel <= 8 ? 16 : 16;
  const wordCount = currentLevel >= 22 ? 6 : currentLevel >= 19 ? 5 : currentLevel <= 2 ? 2 : currentLevel <= 5 ? 3 : currentLevel <= 8 ? 4 : 5;

  const pickWords = useCallback((themeName: string) => {
    if (isInfinity) {
      if (currentLevel === 14) {
        // ∞-II: Bilingual (find English word from Vietnamese meaning clue)
        const shuffled = [...BILINGUAL_WORD_PAIRS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount).map(b => b.en.toUpperCase().replace(/\s+/g, ''));
      }
      if (currentLevel === 15) {
        // ∞-III: Synonyms
        const synList = SYNONYM_PAIRS.map(p => p.wordA.toUpperCase().replace(/\s+/g, ''));
        const shuffled = [...synList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel === 16) {
        // ∞-IV: Antonyms
        const antList = ANTONYM_PAIRS.map(p => p.wordA.toUpperCase().replace(/\s+/g, ''));
        const shuffled = [...antList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel === 17) {
        // ∞-V: Emoji pairs
        const emoList = EMOJI_WORD_PAIRS.map(e => e.word.toUpperCase().replace(/\s+/g, ''));
        const shuffled = [...emoList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel === 18) {
        // ∞-VI: NASA Cosmic Terms
        const cosmicTerms = ['GALAXY', 'NEBULA', 'PULSAR', 'SUPERNOVA', 'QUASAR', 'EXOPLANET', 'ASTEROID', 'TELESCOPE', 'COSMOS'];
        const shuffled = [...cosmicTerms].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel === 19) {
        // ∞-VII: World Capitals Geography Grid
        const capitals = GEOGRAPHY_TRIADS.map(g => g.capital.toUpperCase().replace(/[^A-Z]/g, ''));
        const shuffled = [...capitals].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel === 20) {
        // ∞-VIII: Chemistry Elements Grid
        const chemNames = ['HYDROGEN', 'HELIUM', 'LITHIUM', 'CARBON', 'NITROGEN', 'OXYGEN', 'SILICON', 'TITANIUM', 'PLATINUM', 'URANIUM'];
        const shuffled = [...chemNames].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      if (currentLevel >= 21) {
        // Long academic words
        const longDict = CURATED_DICTIONARY.filter(d => d.word.length >= 6).map(d => d.word.toUpperCase());
        const shuffled = [...longDict].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, wordCount);
      }
      // English words from Curated Dictionary
      const dictWords = CURATED_DICTIONARY.map(d => d.word.toUpperCase());
      const shuffled = [...dictWords].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, wordCount);
    }

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
  }, [wordCount, currentLevel, isInfinity]);

  const [targetWords, setTargetWords] = useState<string[]>(() => pickWords(selectedTheme));
  const [searchData, setSearchData] = useState(() => generateWordSearchGrid(rows, cols, targetWords));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);

  const startNewBoard = useCallback((themeName: string) => {
    const newWords = pickWords(themeName);
    setTargetWords(newWords);
    setSearchData(generateWordSearchGrid(rows, cols, newWords));
    setFoundWords([]);
    setSelectedCells([]);
    setElapsedSec(0);
    setIsFinished(false);
    setHintCell(null);
    setHintsRemaining(3);
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
        setIsFinished(true);
      }
    }
  };

  const handleThemeChange = (newTheme: string) => {
    playSound('click');
    setSelectedTheme(newTheme);
    startNewBoard(newTheme);
  };

  const handleFlashFirstLetter = () => {
    if (hintsRemaining <= 0 || isFinished) return;
    const unfoundPlaced = searchData.placedWords.find(p => !foundWords.includes(p.word));
    if (unfoundPlaced) {
      playSound('click');
      setHintsRemaining(h => h - 1);
      setHintCell({ r: unfoundPlaced.row, c: unfoundPlaced.col });
      setTimeout(() => setHintCell(null), 1600);
    }
  };

  const score = (foundWords.length * 150 * currentLevel) + Math.max(0, (120 - elapsedSec) * 5);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Mục tiêu</span>
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(currentLevel)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {foundWords.length} / {targetWords.length}
          </div>
        </div>

        {/* Theme Pills */}
        {!isInfinity && (
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            {themes.map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  selectedTheme === t
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

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
          const dictEntry = isInfinity ? CURATED_DICTIONARY.find(d => d.word === word) : null;
          const placed = searchData.placedWords.find(p => p.word === word);
          const dirBadge = placed ? (placed.direction === 'H' ? '➡️ Ngang' : '⬇️ Dọc') : null;

          let clueText: string | null = null;
          if (currentLevel === 14) {
            const bp = BILINGUAL_WORD_PAIRS.find(b => b.en.toUpperCase().replace(/\s+/g, '') === word);
            if (bp) clueText = `Nghĩa: ${bp.vi}`;
          } else if (currentLevel === 15) {
            const syn = SYNONYM_PAIRS.find(s => s.wordA.toUpperCase().replace(/\s+/g, '') === word);
            if (syn) clueText = `≈ ${syn.wordB}`;
          } else if (currentLevel === 16) {
            const ant = ANTONYM_PAIRS.find(a => a.wordA.toUpperCase().replace(/\s+/g, '') === word);
            if (ant) clueText = `≠ ${ant.wordB}`;
          } else if (currentLevel === 17) {
            const emo = EMOJI_WORD_PAIRS.find(e => e.word.toUpperCase().replace(/\s+/g, '') === word);
            if (emo) clueText = `${emo.emoji} ${emo.vi}`;
          } else if (currentLevel === 19) {
            const geo = GEOGRAPHY_TRIADS.find(g => g.capital.toUpperCase().replace(/[^A-Z]/g, '') === word);
            if (geo) clueText = `Thủ đô của: ${geo.flag} ${geo.country}`;
          } else if (currentLevel === 20) {
            const elem = PERIODIC_TABLE_TRIADS.find(el => el.name.toUpperCase().includes(word));
            if (elem) clueText = `Ký hiệu: ${elem.symbol} (Z = ${elem.atomicNumber})`;
          } else if (dictEntry) {
            clueText = dictEntry.viMeaning.slice(0, 32) + '...';
          }

          return (
            <div
              key={word}
              className={`px-4 py-2 sm:py-2.5 rounded-2xl font-black tracking-wider text-xs sm:text-sm md:text-base border shadow-sm transition-all duration-300 flex flex-col items-center justify-center ${
                isFound
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-600 dark:text-emerald-400 line-through opacity-75 ring-2 ring-emerald-400/30'
                  : isInfinity
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100 hover:border-purple-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 scale-100 hover:border-brand-500'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isFound && <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />}
                <span>{word}</span>
                {dirBadge && !isFound && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    {dirBadge}
                  </span>
                )}
              </div>
              {clueText && (
                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 no-underline mt-0.5">
                  {clueText}
                </span>
              )}
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
              const isHinted = hintCell?.r === r && hintCell?.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base md:text-lg flex items-center justify-center transition-all duration-150 btn-press ${
                    isHinted
                      ? 'bg-amber-400 text-slate-950 scale-125 z-20 animate-bounce shadow-xl ring-4 ring-amber-400'
                      : isSelected
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

      {/* Controls: Reset + Hint First Letter Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          onClick={handleFlashFirstLetter}
          disabled={hintsRemaining <= 0 || isFinished}
          className={`py-2.5 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            hintsRemaining <= 0
              ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 shadow-sm'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Soi chữ cái đầu ({hintsRemaining}/3)</span>
        </button>

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
