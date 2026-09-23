import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateOptimalRecognitionPoint, calculateEffectiveWpm, IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const RsvpSpeedReaderGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('rsvp-speed-reader') || currentLevel;

  const isDualWord = effectiveLevel === 9;
  const isMasked = effectiveLevel === 10;
  const isPeripheral = effectiveLevel === 12;

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    return allTexts[Math.floor(Math.random() * allTexts.length)] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [showFullContext, setShowFullContext] = useState(true);

  const words = currentArticle.content.split(/\s+/).filter(Boolean);

  const initialWpm = useMemo(() => {
    switch (effectiveLevel) {
      case 1: return 200;
      case 2: return 300;
      case 3: return 450;
      case 4: return 600;
      case 5: return 750;
      case 6: return 900;
      case 7: return 1050;
      case 8: return 1200;
      case 9: return 1400;
      case 10: return 1600;
      case 11: return 1800;
      case 12: return 2000;
      default: return 450;
    }
  }, [effectiveLevel]);

  const [wpm, setWpm] = useState(initialWpm);
  const [wordIndex, setWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (activeWordRef.current && isPlaying) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [wordIndex, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(60000 / wpm);
    const step = isDualWord ? 2 : 1;
    timerRef.current = setInterval(() => {
      setWordIndex((prev) => {
        if (prev % 6 === 0 && words[prev]) {
          emitTrialEvent({
            exerciseSlug: 'rsvp-speed-reader',
            level: effectiveLevel,
            relationId: 'TEMPORAL_PREDICT',
            relationWeight: 1.0,
            entities: { wordIndex: prev, word: words[prev], wpm, articleTitle: currentArticle.title },
            stateBefore: `idx:${prev}`,
            stateAfter: `idx:${prev + step}`,
            responseMs: intervalMs,
            correct: true
          });
        }

        if (prev >= words.length - step) {
          setIsPlaying(false);
          setIsFinished(true);
          return prev;
        }
        return prev + step;
      });
      setElapsedSec((s) => s + (intervalMs / 1000));
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, wpm, words.length, isDualWord, effectiveLevel, currentArticle.title, emitTrialEvent]);

  const rawWord = words[wordIndex] || 'BẮT ĐẦU';
  const nextWord = isDualWord && wordIndex + 1 < words.length ? words[wordIndex + 1] : null;

  // Masked variant logic
  const displayWord = useMemo(() => {
    if (!isMasked || rawWord.length < 4) return rawWord;
    const chars = rawWord.split('');
    const maskIdx = Math.floor(chars.length / 2);
    chars[maskIdx] = '•';
    return chars.join('');
  }, [rawWord, isMasked]);

  const orpIndex = calculateOptimalRecognitionPoint(displayWord);
  const partLeft = displayWord.slice(0, orpIndex);
  const orpChar = displayWord[orpIndex] || '';
  const partRight = displayWord.slice(orpIndex + 1);

  // Peripheral jumping position logic
  const peripheralPositionClass = useMemo(() => {
    if (!isPeripheral) return 'justify-center';
    const pos = wordIndex % 3;
    if (pos === 0) return 'justify-start pl-8';
    if (pos === 1) return 'justify-center';
    return 'justify-end pr-8';
  }, [isPeripheral, wordIndex]);

  const handleTogglePlay = () => {
    playSound('click');
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    playSound('click');
    setIsPlaying(false);
    setWordIndex(0);
    setElapsedSec(0);
    setIsFinished(false);
  };

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
    setWordIndex(0);
    setElapsedSec(0);
    setIsPlaying(false);
    setIsFinished(false);
  };

  const effectiveWpm = calculateEffectiveWpm(wpm, 90);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Từ hiện tại</span>
          <div className="text-xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {wordIndex + 1} / {words.length}
          </div>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setIsSourceModalOpen(true);
          }}
          className="py-2 px-3 sm:px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all btn-press shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Đổi bài đọc / Tải Wikipedia</span>
          <span className="sm:hidden">Đổi bài</span>
        </button>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tốc độ hiện tại</span>
          <div className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {wpm} WPM
          </div>
        </div>
      </div>

      {/* RSVP Central Fixation Viewbox */}
      <div className={`relative h-48 sm:h-64 md:h-72 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500/80 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-8 overflow-hidden ${peripheralPositionClass}`}>
        {/* Top & Bottom Alignment Marks (Fixation Target) */}
        {!isPeripheral && (
          <>
            <div className="absolute top-3 w-0.5 h-5 bg-slate-400/40 rounded-full" />
            <div className="absolute bottom-3 w-0.5 h-5 bg-slate-400/40 rounded-full" />
          </>
        )}

        {/* Word Display with Centered Red ORP Accent (Zero horizontal jump/overlap) */}
        <div className="flex flex-col items-center gap-3 select-none w-full">
          <div className="w-full max-w-xl mx-auto flex items-baseline justify-center font-mono font-black text-4xl sm:text-6xl md:text-7xl text-slate-900 dark:text-white">
            <span className="flex-1 text-right whitespace-nowrap overflow-hidden select-none">{partLeft}</span>
            <span className="text-red-500 px-0.5 sm:px-1 underline decoration-red-500 decoration-4 sm:decoration-8 underline-offset-8 shrink-0 select-none">{orpChar}</span>
            <span className="flex-1 text-left whitespace-nowrap overflow-hidden select-none">{partRight}</span>
          </div>

          {/* Dual-Word RSVP variant */}
          {nextWord && (
            <div className="text-2xl sm:text-3xl font-bold text-slate-500 dark:text-slate-400 tracking-tight">
              {nextWord}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-brand-600 h-full transition-all duration-100"
          style={{ width: `${Math.round(((wordIndex + 1) / words.length) * 100)}%` }}
        />
      </div>

      {/* Text Area Context Preview (Nét Thanh -> Nét Đậm) */}
      <div className="rounded-3xl bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-md overflow-hidden">
        <div 
          onClick={() => setShowFullContext(!showFullContext)}
          className="px-5 py-3 bg-[#F5EFE6] dark:bg-slate-800 flex items-center justify-between cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-[10px] font-black">
              {currentArticle.category}
            </span>
            <span className="truncate">{currentArticle.title}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 shrink-0">
            <span>{showFullContext ? 'Thu gọn đoạn văn' : 'Hiện toàn văn ngữ cảnh'}</span>
            {showFullContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showFullContext && (
          <div className="p-5 sm:p-7 leading-[2.2] sm:leading-[2.4] text-sm sm:text-base text-slate-800 dark:text-slate-200 max-h-[180px] overflow-y-auto scroll-smooth select-none">
            {words.map((w, idx) => {
              const isFocused = idx === wordIndex || (isDualWord && idx === wordIndex + 1);
              const isPast = idx < wordIndex;
              return (
                <React.Fragment key={idx}>
                  <span
                    ref={isFocused ? activeWordRef : undefined}
                    className={`inline align-baseline px-1 py-0.5 rounded transition-colors duration-75 font-medium ${
                      isFocused
                        ? 'font-bold text-slate-950 bg-amber-300 dark:bg-amber-400 shadow-sm ring-2 ring-amber-400/60'
                        : isPast
                        ? 'text-slate-700 dark:text-slate-300 opacity-80'
                        : 'text-slate-400 dark:text-slate-500 opacity-40'
                    }`}
                  >
                    {w}
                  </span>
                  {' '}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Speed Slider */}
      <div className="space-y-1.5 p-4 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Tốc độ đọc (WPM)</span>
          <span className="text-brand-600 dark:text-brand-400 font-black">{wpm} WPM</span>
        </div>
        <input
          type="range"
          min="150"
          max="2000"
          step="50"
          value={wpm}
          onChange={(e) => setWpm(Number(e.target.value))}
          className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>150 (Chậm)</span>
          <span>600 (Tiêu chuẩn)</span>
          <span>2000 (Siêu phàm)</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTogglePlay}
          className="flex-1 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold text-base shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              Tạm dừng
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              {wordIndex === 0 ? 'Bắt đầu đọc' : 'Tiếp tục đọc'}
            </>
          )}
        </button>

        <button
          onClick={handleRestart}
          className="p-4 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 hover:bg-[#ebdcc8] text-slate-700 dark:text-slate-200 border border-[#D5CBB9] dark:border-slate-700 btn-press"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Text Source Selection Modal */}
      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

      {isFinished && (
        <GameResultModal
          score={wpm * 2}
          accuracyRate={95}
          timeSpentSec={Math.round(elapsedSec)}
          effectiveWpm={effectiveWpm}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            handleRestart();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
