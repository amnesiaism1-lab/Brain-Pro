import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { calculateOptimalRecognitionPoint, calculateEffectiveWpm, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';

export const RsvpSpeedReaderGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const effectiveLevel = getExerciseLevel('rsvp-speed-reader') || currentLevel;

  const isDualWord = effectiveLevel === 9;
  const isMasked = effectiveLevel === 10;
  const isPeripheral = effectiveLevel === 12;

  const [textIndex, setTextIndex] = useState(() => Math.floor(Math.random() * SAMPLE_READING_TEXTS.length));
  const sampleArticle = SAMPLE_READING_TEXTS[textIndex] || SAMPLE_READING_TEXTS[0];
  const words = sampleArticle.content.split(/\s+/).filter(Boolean);

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(60000 / wpm);
    const step = isDualWord ? 2 : 1;
    timerRef.current = setInterval(() => {
      setWordIndex((prev) => {
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
  }, [isPlaying, wpm, words.length, isDualWord]);

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
    setTextIndex(prev => (prev + 1) % SAMPLE_READING_TEXTS.length);
    setIsPlaying(false);
    setWordIndex(0);
    setElapsedSec(0);
    setIsFinished(false);
  };

  const effectiveWpm = calculateEffectiveWpm(wpm, 90);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Từ hiện tại</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {wordIndex + 1} / {words.length}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tốc độ hiện tại</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5">
            {wpm} WPM
          </div>
        </div>
      </div>

      {/* RSVP Central Fixation Viewbox */}
      <div className={`relative h-60 sm:h-72 md:h-84 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500/80 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-8 overflow-hidden ${peripheralPositionClass}`}>
        {/* Top & Bottom Alignment Marks (Fixation Target) */}
        {!isPeripheral && (
          <>
            <div className="absolute top-4 w-2 h-4 bg-red-500/80 rounded-full" />
            <div className="absolute bottom-4 w-2 h-4 bg-red-500/80 rounded-full" />
          </>
        )}

        {/* Word Display with Red ORP Accent */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-white flex items-baseline">
            <span className="text-right inline-block">{partLeft}</span>
            <span className="text-red-500 font-black px-0.5 underline decoration-red-500 decoration-4 sm:decoration-8 underline-offset-8">{orpChar}</span>
            <span className="text-left inline-block">{partRight}</span>
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

      {/* Speed Slider */}
      <div className="space-y-1.5 p-4 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Tốc độ đọc (WPM)</span>
          <span className="text-brand-600 dark:text-brand-400">{wpm} WPM</span>
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

      {isFinished && (
        <GameResultModal
          score={wpm * 2}
          accuracyRate={95}
          timeSpentSec={Math.round(elapsedSec)}
          effectiveWpm={effectiveWpm}
          onRestart={handleRestart}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
