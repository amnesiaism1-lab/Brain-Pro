import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';

export const WordChunkingGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('word-chunking');
  const [textIndex, setTextIndex] = useState(() => (currentLevel - 1) % SAMPLE_READING_TEXTS.length);
  const rawText = (SAMPLE_READING_TEXTS[textIndex] || SAMPLE_READING_TEXTS[0]).content;
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

  const speedMs = Math.max(180, 750 - (currentLevel * 48));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          entities: { chunkIndex: prev, chunkSize, chunkText: chunks[prev] },
          stateBefore: `chunk:${prev}`,
          stateAfter: `chunk:${prev + 1}`,
          responseMs: speedMs,
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
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, chunks.length, speedMs]);

  const currentChunk = chunks[activeChunkIndex] || '';

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Tiến trình cụm từ</span>
          <div className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {activeChunkIndex + 1} / {chunks.length}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Khối từ</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            {chunkSize} từ / nhịp
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Đọc trọn vẹn cả cụm từ trong một lần dừng mắt duy nhất. Tuyệt đối không đọc thầm từng từ riêng lẻ!
      </p>

      {/* Chunk Flash Box */}
      <div className="h-56 sm:h-72 md:h-84 rounded-3xl bg-brand-600 dark:bg-brand-700 border-2 border-brand-400 shadow-2xl flex items-center justify-center p-6 sm:p-10 text-center text-white">
        <div className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-snug animate-scale-up">
          {currentChunk}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => {
            playSound('click');
            setIsPlaying(!isPlaying);
          }}
          className="flex-1 py-4 sm:py-5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold text-base sm:text-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 btn-press"
        >
          {isPlaying ? <><Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> Tạm dừng</> : <><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> Tiếp tục</>}
        </button>

        <button
          onClick={() => {
            playSound('click');
            setTextIndex(t => (t + 1) % SAMPLE_READING_TEXTS.length);
            setIsPlaying(true);
            setActiveChunkIndex(0);
            setElapsedSec(0);
            setIsFinished(false);
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#F5EFE6] dark:bg-slate-800 hover:bg-[#ebdcc8] text-slate-700 dark:text-slate-200 border border-[#D5CBB9] dark:border-slate-700 btn-press"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={chunks.length * 15 * currentLevel}
          accuracyRate={95}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setTextIndex(t => (t + 1) % SAMPLE_READING_TEXTS.length);
            setIsPlaying(true);
            setActiveChunkIndex(0);
            setElapsedSec(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
