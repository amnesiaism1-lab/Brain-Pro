import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Play, Pause, RotateCcw, BookOpen, Layers } from 'lucide-react';
import { IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const WordChunkingGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('word-chunking');

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    return allTexts[(currentLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const rawText = currentArticle.content;
  const allWords = rawText.split(/\s+/).filter(Boolean);
  const chunkSize = currentLevel <= 2 ? 2 : currentLevel <= 5 ? 3 : currentLevel <= 8 ? 4 : currentLevel <= 10 ? 5 : 6;

  const chunks: string[] = [];
  for (let i = 0; i < allWords.length; i += chunkSize) {
    chunks.push(allWords.slice(i, i + chunkSize).join(' '));
  }

  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Speed of chunking: 400ms - 800ms
  const defaultSpeedMs = Math.max(280, 850 - (currentLevel * 45));
  const [chunkSpeedMs, setChunkSpeedMs] = useState(defaultSpeedMs);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChunkRef = useRef<HTMLSpanElement | null>(null);
  const textAreaRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll follower
  useEffect(() => {
    if (activeChunkRef.current && isPlaying) {
      activeChunkRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeChunkIndex, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveChunkIndex(prev => {
        emitTrialEvent({
          exerciseSlug: 'word-chunking',
          level: currentLevel,
          relationId: 'PART_WHOLE',
          relationWeight: 1.0,
          entities: { chunkIndex: prev, chunkSize, chunkText: chunks[prev], articleTitle: currentArticle.title },
          stateBefore: `chunk:${prev}`,
          stateAfter: `chunk:${prev + 1}`,
          responseMs: chunkSpeedMs,
          correct: true
        });

        if (prev >= chunks.length - 1) {
          setIsPlaying(false);
          setIsFinished(true);
          return prev;
        }
        return prev + 1;
      });
      setElapsedSec(s => s + 1);
    }, chunkSpeedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, chunks.length, chunkSpeedMs, currentArticle.title, chunkSize, currentLevel, emitTrialEvent]);

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
    setActiveChunkIndex(0);
    setElapsedSec(0);
    setIsPlaying(false);
    setIsFinished(false);
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = 0;
    }
  };

  const restartReading = () => {
    playSound('click');
    setActiveChunkIndex(0);
    setElapsedSec(0);
    setIsPlaying(true);
    setIsFinished(false);
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Khối đọc</span>
            <span className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">
              {chunkSize} từ / nhịp
            </span>
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
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Tiến trình cụm</span>
          <div className="text-base sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {activeChunkIndex + 1} / {chunks.length}
          </div>
        </div>
      </div>

      {/* Paragraph Text Area with Nét Thanh -> Nét Đậm Highlighting */}
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
            {allWords.length} từ • {chunks.length} cụm
          </span>
        </div>

        {/* Text Area Body with Natural Chunk Flow (Zero Overlap & Zero Collapse) */}
        <div 
          ref={textAreaRef}
          className="p-6 sm:p-10 md:p-12 leading-[2.6] sm:leading-[3.0] text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-slate-200 select-none max-h-[380px] sm:max-h-[440px] overflow-y-auto scroll-smooth"
        >
          {chunks.map((chunk, idx) => {
            const isFocused = idx === activeChunkIndex;
            const isPast = idx < activeChunkIndex;

            return (
              <React.Fragment key={idx}>
                <span
                  ref={isFocused ? activeChunkRef : undefined}
                  className={`inline align-baseline box-decoration-clone px-2 py-0.5 rounded-lg transition-colors duration-150 font-medium ${
                    isFocused
                      ? 'font-bold text-white bg-brand-600 dark:bg-brand-500 shadow-sm ring-2 ring-brand-400/70'
                      : isPast
                      ? 'text-slate-700 dark:text-slate-200 opacity-85'
                      : 'text-slate-400 dark:text-slate-500 opacity-40'
                  }`}
                >
                  {chunk}
                </span>
                {' '}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E6DDCE] dark:bg-slate-800 h-1.5">
          <div 
            className="h-full bg-brand-600 transition-all duration-150"
            style={{ width: `${Math.round(((activeChunkIndex + 1) / chunks.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Speed Slider Adjuster */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 space-y-2.5">
        <div className="flex justify-between text-xs sm:text-sm font-bold">
          <span className="text-slate-700 dark:text-slate-300">Nhịp dừng mỗi cụm</span>
          <span className="text-brand-600 dark:text-brand-400 font-black text-sm sm:text-base">{chunkSpeedMs} ms / cụm</span>
        </div>
        <input
          type="range"
          min="200"
          max="1200"
          step="50"
          value={chunkSpeedMs}
          onChange={(e) => setChunkSpeedMs(Number(e.target.value))}
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
              <span>{activeChunkIndex >= chunks.length - 1 ? 'Đọc lại từ đầu' : 'Tiếp tục nhịp cụm'}</span>
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
          score={chunks.length * 15 * currentLevel}
          accuracyRate={95}
          timeSpentSec={elapsedSec}
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
