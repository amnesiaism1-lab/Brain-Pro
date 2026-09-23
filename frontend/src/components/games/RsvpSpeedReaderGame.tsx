import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, BookOpen, ChevronDown, ChevronUp, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { calculateOptimalRecognitionPoint, calculateEffectiveWpm, IReadingText, SAMPLE_READING_TEXTS, INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService, ENGLISH_INFINITY_READING_TEXTS } from '../../services/readingContentService';

export const RsvpSpeedReaderGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('rsvp-speed-reader') || currentLevel;

  const isInfinity = effectiveLevel >= 13;
  const infinityTier = getInfinityTier(effectiveLevel);

  const isDualWord = effectiveLevel === 9;
  const isMasked = effectiveLevel === 10;
  const isPeripheral = effectiveLevel === 12;
  const isChunked = effectiveLevel === 16;
  const isEmojiMode = effectiveLevel === 17;

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    if (effectiveLevel >= 13) {
      return readingContentService.getInfinityText(effectiveLevel);
    }
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
      case 13: return 500; // English RSVP baseline
      case 14: return 550; // Bilingual
      case 15: return 500; // Masked
      case 16: return 750; // Chunked 3 words
      case 17: return 600; // Emoji embeds
      case 18: return 800; // Acceleration surge
      case 19: return 650; // Wikipedia live
      case 20: return 450; // Poetry
      case 21: return 400; // Reverse flow
      case 22: return 700; // Dual stream
      default: return 500;
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
    const step = isChunked ? 3 : isDualWord ? 2 : 1;
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
  }, [isPlaying, wpm, words.length, isDualWord, isChunked, effectiveLevel, currentArticle.title, emitTrialEvent]);

  // Handle words to display
  const rawWord = words[wordIndex] || 'START';
  const chunkWords = isChunked 
    ? words.slice(wordIndex, wordIndex + 3).join(' ')
    : isDualWord && wordIndex + 1 < words.length 
    ? `${words[wordIndex]} ${words[wordIndex + 1]}`
    : rawWord;

  // Masked variant logic
  const displayWord = useMemo(() => {
    if (isEmojiMode) {
      return rawWord
        .replace(/brain/gi, '🧠')
        .replace(/rocket/gi, '🚀')
        .replace(/star/gi, '⭐')
        .replace(/light/gi, '💡')
        .replace(/mind/gi, '🧘');
    }
    if (!isMasked || rawWord.length < 4) return isChunked ? chunkWords : rawWord;
    const chars = rawWord.split('');
    const maskIdx = Math.floor(chars.length / 2);
    chars[maskIdx] = '•';
    return chars.join('');
  }, [rawWord, isMasked, isEmojiMode, isChunked, chunkWords]);

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
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tiến độ bài đọc</span>
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(effectiveLevel)}
              </span>
            )}
          </div>
          <div className="text-xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {wordIndex + 1} / {words.length}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tốc độ WPM</span>
          <div className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5 font-mono">
            {wpm}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-xl sm:text-3xl font-black text-amber-500 mt-0.5 font-mono">
            {Math.round(elapsedSec)}s
          </div>
        </div>
      </div>

      {/* Article Selector and Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
              {currentArticle.category}
            </span>
            <span className="text-xs text-slate-400">~{currentArticle.wordCount} từ</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white truncate mt-1">
            {currentArticle.title}
          </h3>
        </div>

        <button
          onClick={() => setIsSourceModalOpen(true)}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Đổi văn bản khác</span>
        </button>
      </div>

      {/* RSVP Main Flash Stage */}
      <div className="relative h-56 sm:h-64 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        {/* Fixation Guides */}
        <div className="absolute top-4 w-4 h-2 border-t-2 border-r-2 border-l-2 border-rose-500/40 pointer-events-none" />
        <div className="absolute bottom-4 w-4 h-2 border-b-2 border-r-2 border-l-2 border-rose-500/40 pointer-events-none" />

        {/* Center ORP Aligned Word Container */}
        <div className={`w-full flex items-center ${peripheralPositionClass}`}>
          {isChunked ? (
            <div className="font-mono text-2xl sm:text-4xl md:text-5xl font-black text-center text-purple-600 dark:text-purple-400 tracking-wide px-4">
              {displayWord}
            </div>
          ) : (
            <div className="font-mono text-3xl sm:text-5xl md:text-6xl font-black flex items-center justify-center tracking-tight">
              <span className="text-slate-800 dark:text-white text-right">{partLeft}</span>
              <span className="text-rose-500 dark:text-rose-400 px-0.5">{orpChar}</span>
              <span className="text-slate-800 dark:text-white text-left">{partRight}</span>
            </div>
          )}
        </div>

        {/* Fixation Anchor Reticle */}
        <div className="absolute bottom-6 flex items-center gap-1 opacity-40">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Điểm Neo ORP</span>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
      </div>

      {/* Speed & Control Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        {/* Speed Adjustment Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Tốc độ đọc (WPM)</span>
            <span className="text-brand-600 dark:text-brand-400 font-mono text-sm font-black">{wpm} WPM</span>
          </div>
          <input
            type="range"
            min={150}
            max={2200}
            step={25}
            value={wpm}
            onChange={(e) => setWpm(parseInt(e.target.value, 10))}
            className="w-full accent-brand-500 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Play / Pause / Reset Actions */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={handleRestart}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors btn-press"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-8 py-3.5 rounded-2xl font-black text-white flex items-center gap-2 shadow-lg transition-all btn-press ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25' 
                : isInfinity
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/30'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>BẮT ĐẦU ĐỌC</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Context Reading Passage with live tracking */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md p-4 sm:p-5 space-y-3">
        <button
          onClick={() => setShowFullContext(!showFullContext)}
          className="w-full flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300"
        >
          <span>Toàn văn ngữ cảnh bài đọc (Xem con trỏ quét)</span>
          {showFullContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullContext && (
          <div className="max-h-44 overflow-y-auto pr-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 select-none">
            {words.map((w, idx) => {
              const isCurrent = idx === wordIndex;
              return (
                <span
                  key={idx}
                  ref={isCurrent ? activeWordRef : null}
                  className={`inline-block mr-1.5 transition-all ${
                    isCurrent 
                      ? 'bg-amber-300 dark:bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded shadow' 
                      : idx < wordIndex 
                      ? 'opacity-40' 
                      : ''
                  }`}
                >
                  {w}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

      {isFinished && (
        <GameResultModal
          score={Math.round((words.length * (wpm / 100)) + 300)}
          accuracyRate={95}
          timeSpentSec={Math.round(elapsedSec)}
          effectiveWpm={effectiveWpm}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={handleRestart}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
