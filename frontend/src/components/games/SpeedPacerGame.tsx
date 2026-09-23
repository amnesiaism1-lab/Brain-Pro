import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { Play, Pause, RotateCcw, Gauge, BookOpen, Sparkles } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const SpeedPacerGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('reading-pacer');

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    return allTexts[(currentLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const rawText = currentArticle.content;
  const words = rawText.split(/\s+/).filter(Boolean);

  // Level 1-8: 250-650 WPM. Level 9-12: 700-1100 WPM
  const baseWpm = currentLevel >= 9 ? 650 + (currentLevel - 9) * 100 : 250 + (currentLevel * 45);
  const [pacerWpm, setPacerWpm] = useState(baseWpm);
  const [highlightWordIndex, setHighlightWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const textAreaContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll follower
  useEffect(() => {
    if (activeWordRef.current && isPlaying) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightWordIndex, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(60000 / pacerWpm);
    timerRef.current = setInterval(() => {
      setHighlightWordIndex(prev => {
        emitTrialEvent({
          exerciseSlug: 'reading-pacer',
          level: currentLevel,
          relationId: 'TEMPORAL_PREDICT',
          relationWeight: 1.0,
          entities: { wordIndex: prev, word: words[prev], pacerWpm, articleTitle: currentArticle.title },
          stateBefore: `idx:${prev}`,
          stateAfter: `idx:${prev + 1}`,
          responseMs: intervalMs,
          correct: true
        });

        if (prev >= words.length - 1) {
          setIsPlaying(false);
          setIsFinished(true);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, pacerWpm, words.length, currentArticle.title]);

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
    setHighlightWordIndex(0);
    setIsPlaying(false);
    setIsFinished(false);
    if (textAreaContainerRef.current) {
      textAreaContainerRef.current.scrollTop = 0;
    }
  };

  const restartReading = () => {
    playSound('click');
    setHighlightWordIndex(0);
    setIsPlaying(true);
    setIsFinished(false);
    if (textAreaContainerRef.current) {
      textAreaContainerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Tốc độ nhịp</span>
            <span className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">{pacerWpm} WPM</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              playSound('click');
              setIsSourceModalOpen(true);
            }}
            className="py-2 px-3.5 sm:px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all btn-press shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Đổi bài đọc / Tải Wikipedia</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Tiến trình</span>
          <div className="text-base sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {Math.round(((highlightWordIndex + 1) / words.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Reading Passage Text Area with Nét Thanh -> Nét Đậm Highlighting */}
      <div className="rounded-3xl bg-[#FDFBF7] dark:bg-slate-900 border-2 border-[#D5CBB9] dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Article Meta Bar */}
        <div className="px-6 py-3.5 bg-[#F5EFE6] dark:bg-slate-800/80 border-b border-[#E6DDCE] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[11px] font-black shrink-0">
              {currentArticle.category}
            </span>
            <span className="truncate font-bold text-slate-800 dark:text-slate-100">
              {currentArticle.title}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0 pl-2">
            {words.length} từ
          </span>
        </div>

        {/* Text Area Body */}
        <div 
          ref={textAreaContainerRef}
          className="p-6 sm:p-10 md:p-12 leading-loose sm:leading-[2.6] text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-slate-200 select-none max-h-[380px] sm:max-h-[440px] overflow-y-auto scroll-smooth"
        >
          {words.map((word, idx) => {
            const isFocused = idx === highlightWordIndex;
            const isPast = idx < highlightWordIndex;
            const isFuture = idx > highlightWordIndex;

            return (
              <span
                key={idx}
                ref={isFocused ? activeWordRef : undefined}
                className={`inline-block mr-2 sm:mr-3 transition-all duration-100 px-1.5 py-0.5 rounded-lg ${
                  isFocused
                    ? 'font-black text-slate-950 dark:text-slate-950 bg-amber-300 dark:bg-amber-400 shadow-lg ring-4 ring-amber-400/40 scale-110 z-10 inline-block'
                    : isPast
                    ? 'font-normal text-slate-700 dark:text-slate-300 opacity-80'
                    : 'font-light text-slate-400 dark:text-slate-500 opacity-50'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-[#E6DDCE] dark:bg-slate-800 h-1.5">
          <div 
            className="h-full bg-brand-600 transition-all duration-150"
            style={{ width: `${Math.round(((highlightWordIndex + 1) / words.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Speed Slider Adjuster */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 space-y-2.5">
        <div className="flex justify-between text-xs sm:text-sm font-bold">
          <span className="text-slate-700 dark:text-slate-300">Điều chỉnh nhịp đọc (Pacer Speed)</span>
          <span className="text-brand-600 dark:text-brand-400 font-black text-sm sm:text-base">{pacerWpm} WPM</span>
        </div>
        <input
          type="range"
          min="150"
          max="1000"
          step="25"
          value={pacerWpm}
          onChange={(e) => setPacerWpm(Number(e.target.value))}
          className="w-full accent-brand-600 cursor-pointer h-2 rounded-lg"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => {
            playSound('click');
            setIsPlaying(!isPlaying);
          }}
          className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold text-base sm:text-xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              <span>{highlightWordIndex >= words.length - 1 ? 'Đọc lại từ đầu' : 'Tiếp tục nhịp đọc'}</span>
            </>
          )}
        </button>

        <button
          title="Bắt đầu lại bài này"
          onClick={restartReading}
          className="p-4 sm:p-5 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 hover:bg-[#ebdcc8] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-[#D5CBB9] dark:border-slate-700 btn-press"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
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
          score={pacerWpm * 2}
          accuracyRate={95}
          timeSpentSec={Math.round((words.length / pacerWpm) * 60) || 30}
          effectiveWpm={pacerWpm}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            restartReading();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
