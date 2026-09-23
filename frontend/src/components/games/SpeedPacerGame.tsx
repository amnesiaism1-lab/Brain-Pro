import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

export const SpeedPacerGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('reading-pacer');
  const [textIndex, setTextIndex] = useState(() => (currentLevel - 1) % SAMPLE_READING_TEXTS.length);
  const rawText = (SAMPLE_READING_TEXTS[textIndex] || SAMPLE_READING_TEXTS[0]).content;
  const words = rawText.split(/\s+/).filter(Boolean);

  // Level 1-8: 350-700 WPM. Level 9-12: 800-1200 WPM
  const baseWpm = currentLevel >= 9 ? 750 + (currentLevel - 9) * 120 : 300 + (currentLevel * 50);
  const [pacerWpm, setPacerWpm] = useState(baseWpm);
  const [highlightWordIndex, setHighlightWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          entities: { wordIndex: prev, word: words[prev], pacerWpm },
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
  }, [isPlaying, pacerWpm, words.length]);

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Gauge className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span className="text-base sm:text-xl font-black text-slate-800 dark:text-white">{pacerWpm} WPM</span>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Tiến trình đọc</span>
          <div className="text-base sm:text-xl font-black text-brand-600">
            {Math.round(((highlightWordIndex + 1) / words.length) * 100)}%
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Công nghệ <strong>Bionic Reading</strong> in đậm đầu từ kết hợp thanh dẫn hướng ép mắt bạn đọc nhanh hơn!
      </p>

      {/* Reading Passage with Bionic Highlighting & Pacer Focus */}
      <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-white dark:bg-slate-800 border-2 border-brand-500/80 shadow-2xl leading-loose sm:leading-[2.2] text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-slate-200 select-none max-h-[460px] overflow-y-auto">
        {words.map((word, idx) => {
          const isFocused = idx === highlightWordIndex;
          const half = Math.ceil(word.length / 2);
          const head = word.slice(0, half);
          const tail = word.slice(half);

          return (
            <span
              key={idx}
              className={`inline-block mr-2 sm:mr-3 transition-all duration-75 px-1 rounded-lg ${
                isFocused
                  ? 'bg-amber-300 text-slate-900 font-black scale-110 shadow-md ring-2 ring-amber-400'
                  : ''
              }`}
            >
              <strong className="font-black text-slate-950 dark:text-white">{head}</strong>
              <span className="opacity-80">{tail}</span>
            </span>
          );
        })}
      </div>

      {/* Speed Adjuster */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F5EFE6] dark:bg-slate-800 border border-[#D5CBB9] dark:border-slate-700 space-y-3">
        <div className="flex justify-between text-xs sm:text-sm font-bold">
          <span>Nhịp dẫn hướng (Pacer Speed)</span>
          <span className="text-brand-600 font-black text-base">{pacerWpm} WPM</span>
        </div>
        <input
          type="range"
          min="200"
          max="900"
          step="50"
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
          {isPlaying ? <><Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> Tạm dừng</> : <><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> Tiếp tục dẫn nhịp</>}
        </button>

        <button
          onClick={() => {
            playSound('click');
            setTextIndex(t => (t + 1) % SAMPLE_READING_TEXTS.length);
            setHighlightWordIndex(0);
            setIsPlaying(true);
            setIsFinished(false);
          }}
          className="p-4 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 hover:bg-[#ebdcc8] text-slate-700 dark:text-slate-200 border border-[#D5CBB9] dark:border-slate-700 btn-press"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={pacerWpm * 2}
          accuracyRate={95}
          timeSpentSec={45}
          effectiveWpm={pacerWpm}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setTextIndex(t => (t + 1) % SAMPLE_READING_TEXTS.length);
            setHighlightWordIndex(0);
            setIsPlaying(true);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
