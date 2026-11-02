import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  generateWordSearchGrid, 
  calculateGameScore, 
  VIETNAMESE_WORDS_DICTIONARY, 
  INFINITY_ROMAN_NUMERALS, 
  getInfinityTier, 
  getInfinityLabel,
  EXERCISES_METADATA
} from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Check, Sparkles, RotateCcw, Infinity as InfinityIcon, CheckCircle2, ArrowRight, Clock, Eye } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { infinityApiService } from '../../services/infinityApiService';

export const WordSearchGame: React.FC = () => {
  const { 
    currentLevel: storeLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound,
    isGamePaused,
    ladderSessionRounds 
  } = useAppStore();

  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('word-search');
  const { sessionConfig: resolvedConfig, isCustom } = useExerciseSessionConfig('word-search');

  const effectiveLevel = getExerciseLevel('word-search') || storeLevel || 1;
  const playedLevelRef = useRef<number>(effectiveLevel);
  const playedLevel = playedLevelRef.current;
  const isInfinity = playedLevel >= 13;

  const sessionIdRef = useRef<string>(`ws-${Date.now()}`);
  const lastMatchTimeRef = useRef<number>(Date.now());
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ r: number; c: number } | null>(null);
  const [clickAnchorCell, setClickAnchorCell] = useState<{ r: number; c: number } | null>(null);

  useEffect(() => {
    playedLevelRef.current = effectiveLevel;
  }, [effectiveLevel]);

  // Rounds configuration
  const totalRounds = useMemo(() => {
    if (isCustom && resolvedConfig.rounds && resolvedConfig.rounds > 0) {
      return resolvedConfig.rounds;
    }
    return ladderSessionRounds || 1;
  }, [isCustom, resolvedConfig.rounds, ladderSessionRounds]);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundResults, setRoundResults] = useState<Array<{ score: number; accuracy: number; timeSpentSec: number }>>([]);
  const [roundTransition, setRoundTransition] = useState<{ roundDone: number; isTimeout: boolean } | null>(null);

  const isCustomCountdown = Boolean(isCustom && resolvedConfig.timeLimitSec && resolvedConfig.timeLimitSec > 0);
  const customTimeLimit = isCustomCountdown ? (resolvedConfig.timeLimitSec || 60) : 0;

  const themes = ['Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy', 'Tổng Hợp'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Khoa Học Não Bộ');
  
  const exerciseMeta = useMemo(() => EXERCISES_METADATA.find(e => e.slug === 'word-search'), []);
  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === playedLevel);
  }, [exerciseMeta, playedLevel]);

  // Level scaling (rows x cols) aligned with levelConfigs
  const rows = isCustom ? 10 : (levelConfig?.gridRows ?? (playedLevel >= 22 ? 15 : playedLevel >= 19 ? 14 : playedLevel <= 2 ? 8 : playedLevel <= 5 ? 10 : playedLevel <= 8 ? 12 : 13));
  const cols = isCustom ? 12 : (levelConfig?.gridCols ?? (playedLevel >= 22 ? 18 : playedLevel >= 19 ? 17 : playedLevel <= 2 ? 10 : playedLevel <= 5 ? 14 : playedLevel <= 8 ? 16 : 16));
  const wordCount = isCustom ? 3 : (levelConfig?.targetItemCount ?? (playedLevel >= 22 ? 6 : playedLevel >= 19 ? 5 : playedLevel <= 2 ? 2 : playedLevel <= 5 ? 3 : playedLevel <= 8 ? 4 : 5));

  const pickWords = useCallback((themeName: string): { words: string[]; clues: Record<string, string> } => {
    if (isInfinity) {
      const items = infinityApiService.getOfflineWordSearchWords(playedLevel, wordCount);
      const words = items.map(it => it.word);
      const clues: Record<string, string> = {};
      items.forEach(it => {
        if (it.clue) clues[it.word] = it.clue;
      });
      return { words, clues };
    }

    let pool: string[] = [];
    if (themeName !== 'Tổng Hợp' && THEMED_VOCABULARY[themeName]) {
      pool = [...THEMED_VOCABULARY[themeName], ...VIETNAMESE_WORDS_DICTIONARY];
    } else {
      pool = [...VIETNAMESE_WORDS_DICTIONARY];
    }

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const validWords: string[] = [];
    for (const w of shuffled) {
      const sanitized = w.replace(/\s+/g, '').toUpperCase();
      if (sanitized.length >= 3 && sanitized.length <= Math.min(rows, cols) - 1) {
        if (!validWords.includes(sanitized)) {
          validWords.push(sanitized);
        }
      }
      if (validWords.length >= wordCount) break;
    }

    const words = validWords.length >= wordCount 
      ? validWords 
      : ['NAO', 'TRITUE', 'QUANXAT', 'TAPTRUNG', 'PHANXA'].slice(0, wordCount);

    return { words, clues: {} };
  }, [playedLevel, wordCount, rows, cols, isInfinity]);

  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [wordClues, setWordClues] = useState<Record<string, string>>({});
  const [searchData, setSearchData] = useState(() => generateWordSearchGrid(rows, cols, ['NAO', 'TRITUE']));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  const [permanentFoundCells, setPermanentFoundCells] = useState<Array<{ r: number; c: number }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);

  // Frozen final results
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [finalTimeSpentSec, setFinalTimeSpentSec] = useState<number>(0);

  const startNewBoard = useCallback((themeName: string) => {
    const { words: newWords, clues: newClues } = pickWords(themeName);
    setTargetWords(newWords);
    setWordClues(newClues);
    setSearchData(generateWordSearchGrid(rows, cols, newWords));
    setFoundWords([]);
    setSelectedCells([]);
    setPermanentFoundCells([]);
    setElapsedSec(0);
    setMissCount(0);
    setHintCell(null);
    setHintsRemaining(3);

    // Asynchronously query live Datamuse API in Infinity Mode
    if (isInfinity) {
      infinityApiService.fetchDynamicWordSearchWords(playedLevel, wordCount).then(dynamicItems => {
        if (dynamicItems && dynamicItems.length >= wordCount) {
          setFoundWords(found => {
            if (found.length > 0) return found; // keep board if already found words
            const dynWords = dynamicItems.map(it => it.word);
            const dynClues: Record<string, string> = {};
            dynamicItems.forEach(it => {
              if (it.clue) dynClues[it.word] = it.clue;
            });
            setTargetWords(dynWords);
            setWordClues(dynClues);
            setSelectedCells([]);
            setPermanentFoundCells([]);
            setSearchData(generateWordSearchGrid(rows, cols, dynWords));
            return [];
          });
        }
      }).catch(() => {});
    }
  }, [rows, cols, pickWords, isInfinity, playedLevel, wordCount]);

  // Complete Round logic
  const completeRound = useCallback((timedOut = false) => {
    const totalAttempts = foundWords.length + missCount;
    const roundAcc = timedOut
      ? (totalAttempts > 0 ? Math.round((foundWords.length / totalAttempts) * 100) : 0)
      : (totalAttempts > 0 ? Math.round((foundWords.length / totalAttempts) * 100) : 100);
    const roundScore = (foundWords.length * 150 * playedLevel) + (timedOut ? 0 : Math.max(0, (120 - elapsedSec) * 5));

    const newResult = {
      score: roundScore,
      accuracy: roundAcc,
      timeSpentSec: elapsedSec
    };

    const nextAllResults = [...roundResults, newResult];
    setRoundResults(nextAllResults);

    if (currentRound < totalRounds) {
      setRoundTransition({ roundDone: currentRound, isTimeout: timedOut });
      playSound(timedOut ? 'wrong' : 'correct');
    } else {
      const aggScore = nextAllResults.reduce((sum, r) => sum + r.score, 0);
      const aggAcc = Math.round(nextAllResults.reduce((sum, r) => sum + r.accuracy, 0) / nextAllResults.length);
      const aggTime = nextAllResults.reduce((sum, r) => sum + r.timeSpentSec, 0);

      setFinalScore(aggScore);
      setFinalAccuracy(aggAcc);
      setFinalTimeSpentSec(aggTime);
      setIsFinished(true);
      playSound('victory');
    }
  }, [foundWords.length, missCount, playedLevel, elapsedSec, roundResults, currentRound, totalRounds, playSound]);

  // Initial board start
  useEffect(() => {
    startNewBoard(selectedTheme);
  }, [selectedTheme, startNewBoard]);

  // Timer loop with pause handling
  useEffect(() => {
    if (isFinished || isGamePaused || Boolean(roundTransition)) return;

    const timer = setInterval(() => {
      setElapsedSec(s => {
        const nextSec = s + 1;
        if (isCustomCountdown && nextSec >= customTimeLimit) {
          clearInterval(timer);
          completeRound(true);
          return customTimeLimit;
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, roundTransition, isCustomCountdown, customTimeLimit, completeRound]);

  const advanceNextRound = () => {
    playSound('click');
    setRoundTransition(null);
    setClickAnchorCell(null);
    setCurrentRound(r => r + 1);
    startNewBoard(selectedTheme);
  };

  // Straight line path calculation between two grid points
  const calculateLinePath = (start: { r: number; c: number }, end: { r: number; c: number }): Array<{ r: number; c: number }> => {
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    // Horizontal
    if (dr === 0) {
      const stepC = dc >= 0 ? 1 : -1;
      const path: Array<{ r: number; c: number }> = [];
      for (let i = 0; i <= absDc; i++) {
        path.push({ r: start.r, c: start.c + i * stepC });
      }
      return path;
    }
    // Vertical
    if (dc === 0) {
      const stepR = dr >= 0 ? 1 : -1;
      const path: Array<{ r: number; c: number }> = [];
      for (let i = 0; i <= absDr; i++) {
        path.push({ r: start.r + i * stepR, c: start.c });
      }
      return path;
    }
    // Diagonal 45-deg
    if (absDr === absDc) {
      const stepR = dr >= 0 ? 1 : -1;
      const stepC = dc >= 0 ? 1 : -1;
      const path: Array<{ r: number; c: number }> = [];
      for (let i = 0; i <= absDr; i++) {
        path.push({ r: start.r + i * stepR, c: start.c + i * stepC });
      }
      return path;
    }

    return [start];
  };

  // Check if cell path spells any unfound target word
  const verifySelection = useCallback((cells: Array<{ r: number; c: number }>) => {
    if (cells.length < 2) {
      setSelectedCells([]);
      return;
    }

    const selectedString = cells.map(cell => searchData.grid[cell.r]?.[cell.c] || '').join('');
    const reversedString = selectedString.split('').reverse().join('');

    const matched = targetWords.find(w => !foundWords.includes(w) && (w === selectedString || w === reversedString));
    if (matched) {
      playSound('correct');
      const now = Date.now();
      const respMs = Math.min(20000, Math.max(200, now - lastMatchTimeRef.current));
      lastMatchTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'word-search',
        level: playedLevel,
        relationId: 'SPATIAL_TRANSFORM',
        relationWeight: 1.0,
        entities: { target: matched, cellsCount: cells.length, theme: selectedTheme },
        stateBefore: `found:${foundWords.length}`,
        stateAfter: `found:${foundWords.length + 1}`,
        responseMs: respMs,
        correct: true
      });

      setPermanentFoundCells(prev => [...prev, ...cells]);
      const updatedFound = [...foundWords, matched];
      setFoundWords(updatedFound);
      setSelectedCells([]);

      if (updatedFound.length >= targetWords.length) {
        completeRound();
      }
    } else {
      setMissCount(m => m + 1);
      playSound('wrong');

      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: playedLevel,
        questionContext: {
          prompt: `Tìm các từ trong chủ đề: ${selectedTheme}`,
          targetWords: targetWords
        },
        correctAnswer: { label: targetWords[0] || 'Từ mục tiêu', code: targetWords[0] || 'WORD' },
        userAnswer: { label: selectedString, code: selectedString },
        responseTimeMs: 1000,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });

      setSelectedCells([]);
    }
  }, [foundWords, searchData.grid, targetWords, playedLevel, selectedTheme, currentRound, completeRound, emitTrialEvent, playSound, trackWrongAnswer]);

  // Pointer Handlers supporting both:
  // 1. Drag & swipe (mouse/touch press & drag)
  // 2. Two-click selection (click start cell, then click end cell)
  const handlePointerDown = (e: React.PointerEvent, r: number, c: number) => {
    if (isFinished || Boolean(roundTransition)) return;
    try {
      (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
    } catch {}

    if (clickAnchorCell) {
      if (clickAnchorCell.r === r && clickAnchorCell.c === c) {
        // Deselect if clicked same cell again
        setClickAnchorCell(null);
        setSelectedCells([]);
        playSound('click');
        return;
      }

      // Check if straight line between clickAnchorCell and (r, c)
      const path = calculateLinePath(clickAnchorCell, { r, c });
      if (path.length > 1) {
        setSelectedCells(path);
        verifySelection(path);
        setClickAnchorCell(null);
        return;
      } else {
        // Not a straight line with existing anchor -> switch anchor to new cell
        setClickAnchorCell({ r, c });
        setSelectedCells([{ r, c }]);
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        dragStartRef.current = { r, c };
        playSound('click');
        return;
      }
    }

    // No anchor: start drag or register potential first click
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { r, c };
    setSelectedCells([{ r, c }]);
    playSound('click');
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (!isDraggingRef.current || !dragStartRef.current || isFinished || Boolean(roundTransition)) return;
    hasDraggedRef.current = true;
    const path = calculateLinePath(dragStartRef.current, { r, c });
    setSelectedCells(path);
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current || isFinished || Boolean(roundTransition)) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cellBtn = el?.closest('[data-cell-pos]') as HTMLElement | null;
    if (cellBtn) {
      const pos = cellBtn.getAttribute('data-cell-pos');
      if (pos) {
        const [rStr, cStr] = pos.split('-');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        if (!isNaN(r) && !isNaN(c)) {
          handlePointerEnter(r, c);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const start = dragStartRef.current;
    dragStartRef.current = null;

    if (hasDraggedRef.current) {
      // Completed drag gesture across cells
      setClickAnchorCell(null);
      verifySelection(selectedCells);
    } else if (start) {
      // Completed single click: register as click anchor!
      setClickAnchorCell(start);
      setSelectedCells([start]);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    playSound('click');
    setSelectedTheme(newTheme);
    startNewBoard(newTheme);
  };

  const handleFlashFirstLetter = () => {
    if (hintsRemaining <= 0 || isFinished || Boolean(roundTransition)) return;
    const unfoundPlaced = searchData.placedWords.find(p => !foundWords.includes(p.word));
    if (unfoundPlaced) {
      playSound('click');
      setHintsRemaining(h => h - 1);
      setHintCell({ r: unfoundPlaced.row, c: unfoundPlaced.col });
      setTimeout(() => setHintCell(null), 1600);
    }
  };

  const handleRevealOneWord = () => {
    if (isFinished || Boolean(roundTransition)) return;
    const unfoundPlaced = searchData.placedWords.find(p => !foundWords.includes(p.word));
    if (unfoundPlaced) {
      playSound('click');
      const dr = unfoundPlaced.direction === 'V' ? 1 : 0;
      const dc = unfoundPlaced.direction === 'H' ? 1 : 0;
      const path: Array<{ r: number; c: number }> = [];
      for (let i = 0; i < unfoundPlaced.word.length; i++) {
        path.push({
          r: unfoundPlaced.row + i * dr,
          c: unfoundPlaced.col + i * dc
        });
      }
      verifySelection(path);
    }
  };

  return (
    <div 
      className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6 animate-fade-in pb-24"
      onPointerUp={handlePointerUp}
    >
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Mục tiêu</span>
            {totalRounds > 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                Lượt {currentRound}/{totalRounds}
              </span>
            )}
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(playedLevel)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {foundWords.length} / {targetWords.length} từ
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Lỗi thử sai: <strong className="text-rose-500">{missCount}</strong>
          </div>
        </div>

        {/* Theme Picker */}
        {!isInfinity && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl">
            {themes.map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTheme === t
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            {isCustomCountdown ? 'Còn lại' : 'Thời gian'}
          </span>
          <div className={`text-2xl sm:text-3xl font-black ${isCustomCountdown && (customTimeLimit - elapsedSec) <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
            {isCustomCountdown ? Math.max(0, customTimeLimit - elapsedSec) : elapsedSec}s
          </div>
        </div>
      </div>

      {/* Target Word Pills Banner */}
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {targetWords.map(word => {
          const isFound = foundWords.includes(word);
          const clueText = wordClues[word];
          return (
            <div
              key={word}
              className={`px-3 py-1.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex flex-col items-center select-none ${
                isFound
                  ? 'bg-emerald-500 text-white border-emerald-400 line-through opacity-90 ring-2 ring-emerald-400/40 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isFound && <Check className="w-4 h-4 text-white stroke-[3]" />}
                <span>{word}</span>
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

      <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
        Hướng dẫn: <strong>Nhấn giữ và kéo</strong> từ chữ đầu đến chữ cuối, hoặc <strong>nhấp vào chữ đầu rồi nhấp vào chữ cuối</strong> để khoanh từ.
      </p>

      {/* Word Search Grid */}
      <div className="p-3 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center max-w-full overflow-hidden relative">
        <div 
          className="grid gap-1 sm:gap-1.5 select-none touch-none w-full max-w-full"
          onPointerMove={handleGridPointerMove}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
          }}
        >
          {searchData.grid.map((row, r) =>
            row.map((letter, c) => {
              const isAnchor = clickAnchorCell?.r === r && clickAnchorCell?.c === c;
              const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
              const isPermanentFound = permanentFoundCells.some(cell => cell.r === r && cell.c === c);
              const isHinted = hintCell?.r === r && hintCell?.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  data-cell-pos={`${r}-${c}`}
                  onPointerDown={(e) => handlePointerDown(e, r, c)}
                  onPointerEnter={() => handlePointerEnter(r, c)}
                  className={`aspect-square rounded-lg sm:rounded-xl font-black flex items-center justify-center transition-all duration-100 ${
                    cols >= 16 ? 'text-[11px] sm:text-xs md:text-sm' : 'text-xs sm:text-sm md:text-base'
                  } ${
                    isHinted
                      ? 'bg-amber-400 text-slate-950 scale-125 z-20 animate-bounce shadow-xl ring-4 ring-amber-400 font-black'
                      : isAnchor
                      ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg ring-4 ring-amber-500 z-10 animate-pulse font-black'
                      : isSelected
                      ? 'bg-amber-400 text-slate-950 scale-105 shadow-md ring-2 ring-amber-400 z-10'
                      : isPermanentFound
                      ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400 font-black'
                      : 'bg-[#FDFBF7] dark:bg-slate-900/60 hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>

        {/* Round Transition Overlay */}
        {roundTransition && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-4 text-white z-20 animate-fade-in p-6 text-center">
            {roundTransition.isTimeout ? (
              <>
                <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-full text-amber-400">
                  <Clock className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 uppercase">
                    Hết Thời Gian Lượt {roundTransition.roundDone}/{totalRounds}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Chưa kịp tìm đủ từ khóa!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    Đã hết giới hạn thời gian cho lượt này. Lưu ý: thời gian được làm mới riêng cho mỗi lượt mới.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                <h3 className="text-xl sm:text-2xl font-black">
                  Hoàn thành Lượt {roundTransition.roundDone}/{totalRounds}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Đã khoanh đủ {targetWords.length} từ khóa • Thời gian: {elapsedSec}s
                </p>
              </>
            )}
            <button
              onClick={advanceNextRound}
              className="mt-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>Vào Lượt {roundTransition.roundDone + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls: Reset + Hint First Letter Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          onClick={handleFlashFirstLetter}
          disabled={hintsRemaining <= 0 || isFinished || Boolean(roundTransition)}
          className={`py-2.5 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
            hintsRemaining <= 0
              ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 shadow-sm'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Soi chữ cái đầu ({hintsRemaining}/3)</span>
        </button>

        {missCount >= 2 && (
          <button
            onClick={handleRevealOneWord}
            disabled={isFinished || Boolean(roundTransition)}
            className="py-2.5 px-4 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
          >
            <Eye className="w-4 h-4 text-rose-500" />
            <span>Xem & khoanh 1 từ khó</span>
          </button>
        )}

        <button
          onClick={() => startNewBoard(selectedTheme)}
          disabled={isFinished || Boolean(roundTransition)}
          className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Làm mới bàn chơi</span>
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={finalScore}
          accuracyRate={finalAccuracy}
          timeSpentSec={finalTimeSpentSec}
          playedLevel={playedLevel}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setCurrentRound(1);
            setRoundResults([]);
            setRoundTransition(null);
            setClickAnchorCell(null);
            setIsFinished(false);
            playedLevelRef.current = getExerciseLevel('word-search');
            startNewBoard(selectedTheme);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
