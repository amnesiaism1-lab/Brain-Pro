import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { Play, Pause, RotateCcw, Gauge, BookOpen, Sparkles } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const SpeedPacerGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const effectiveLevel = getExerciseLevel('reading-pacer') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const allTexts = readingContentService.getAllTexts();
  const englishTexts = allTexts.filter(t => t.language === 'en');
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    if (isInfinity) {
      return readingContentService.getInfinityText(effectiveLevel);
    }
    return allTexts[(effectiveLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const rawText = currentArticle.content;
  const words = rawText.split(/\s+/).filter(Boolean);

  // Level 1-8: 250-650 WPM. Level 9-12: 700-1100 WPM. Infinity: 800-1300 WPM
  const baseWpm = isInfinity 
    ? 750 + (infinityTier * 55) 
    : effectiveLevel >= 9 ? 650 + (effectiveLevel - 9) * 100 : 250 + (effectiveLevel * 45);
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
        block: 'nearest'
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
          level: effectiveLevel,
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
  }, [isPlaying, words.length, pacerWpm, currentArticle.title, effectiveLevel, emitTrialEvent]);

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
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13 ? 'English Pacer (Nhịp dẫn đọc văn bản Anh ngữ 750-1000 WPM)' :
               effectiveLevel === 14 ? 'Bilingual Pacing (Dẫn nhịp luân chuyển hai ngôn ngữ)' :
               effectiveLevel === 15 ? 'High-speed Acceleration (Gia tốc vượt ngưỡng cá nhân)' :
               effectiveLevel === 16 ? 'Rhythmic Metronome Pacing (Nhịp đập máy đếm nhịp chuẩn)' :
               effectiveLevel === 17 ? 'Dual Word Pacing (Lướt cùng lúc 2 từ liền kề)' :
               effectiveLevel === 18 ? 'Smooth Flow Acceleration (Tăng tốc mượt mà không khựng)' :
               effectiveLevel === 19 ? 'Dynamic Acceleration Ramp (Gia tốc lũy tiến mỗi 30 từ)' :
               effectiveLevel === 20 ? 'Wikipedia Live Stream Pacer (Thực chiến Wikipedia)' :
               effectiveLevel === 21 ? 'Mirror Reverse Pacing (Quét ngược từ cuối lên)' :
               'Chaos Pacer (1200+ WPM Dẫn nhịp siêu thanh Vô cực)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Từ hiện tại</span>
          <div className="text-base sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {highlightWordIndex + 1} / {words.length}
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
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tốc độ đọc</span>
          <div className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">
            {pacerWpm} WPM
          </div>
        </div>
      </div>

      {/* Paragraph Text Area with Stable Non-Jitter Typography */}
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

        {/* Text Area Body with Natural Word Flow (Zero Overlap & Zero Collapse) */}
        <div 
          ref={textAreaContainerRef}
          className="p-6 sm:p-10 md:p-12 leading-[2.6] sm:leading-[3.0] text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-slate-200 select-none max-h-[380px] sm:max-h-[440px] overflow-y-auto scroll-smooth"
        >
          {words.map((word, idx) => {
            const isFocused = idx === highlightWordIndex;
            const isPast = idx < highlightWordIndex;

            return (
              <React.Fragment key={idx}>
                <span
                  ref={isFocused ? activeWordRef : undefined}
                  className={`inline align-baseline transition-colors duration-100 px-1 py-0.5 rounded-md font-medium ${
                    isFocused
                      ? 'font-bold text-slate-950 bg-amber-300 dark:bg-amber-400 shadow-sm ring-2 ring-amber-400/80'
                      : isPast
                      ? 'text-slate-700 dark:text-slate-200 opacity-85'
                      : 'text-slate-400 dark:text-slate-500 opacity-40'
                  }`}
                >
                  {word}
                </span>
                {' '}
              </React.Fragment>
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
