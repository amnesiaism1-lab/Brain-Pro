import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { SAMPLE_READING_TEXTS, calculateGameScore } from '@brain-exercises/shared';
import { Search } from 'lucide-react';

export const TextScanningGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const currentLevel = getExerciseLevel('text-scanning');
  const [textIndex, setTextIndex] = useState(() => (currentLevel - 1) % SAMPLE_READING_TEXTS.length);
  const rawText = (SAMPLE_READING_TEXTS[textIndex] || SAMPLE_READING_TEXTS[0]).content;
  const words = rawText.split(/\s+/).filter(Boolean);

  const [targetWord, setTargetWord] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);

  useEffect(() => {
    // Pick an interesting word with at least 5 letters from the middle of the article
    const candidates = words
      .map(w => w.replace(/[.,()—":;?]/g, ''))
      .filter(w => w.length >= 5 && !['trong', 'những', 'chúng', 'người'].includes(w.toLowerCase()));
    
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || 'thần kinh';
    setTargetWord(chosen);
    setElapsedSec(0);
    setFoundIndex(null);
    setIsFinished(false);

    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [textIndex, currentLevel]);

  const handleWordClick = (word: string, idx: number) => {
    playSound('click');
    const cleanWord = word.replace(/[.,()—]/g, '');
    if (cleanWord.toLowerCase().includes(targetWord.toLowerCase())) {
      playSound('correct');
      setFoundIndex(idx);
      setTimeout(() => {
        setIsFinished(true);
      }, 500);
    } else {
      playSound('wrong');
    }
  };

  const score = calculateGameScore({
    level: currentLevel,
    accuracyRate: 100,
    timeLimitSec: 40,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Từ khóa cần quét</span>
            <div className="text-lg sm:text-2xl font-black text-brand-600 dark:text-brand-400">
              "{targetWord}"
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {elapsedSec}s
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Kỹ thuật Skimming & Scanning: Quét mắt nhanh trên đoạn văn và bấm trực tiếp vào từ khóa cần tìm!
      </p>

      {/* Clickable Word Matrix */}
      <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-white dark:bg-slate-800 border-2 border-brand-500/80 shadow-2xl leading-relaxed sm:leading-loose text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-200 select-none max-h-[460px] overflow-y-auto">
        {words.map((word, idx) => {
          const isFound = idx === foundIndex;
          return (
            <span
              key={idx}
              onClick={() => handleWordClick(word, idx)}
              className={`inline-block mr-1.5 sm:mr-2 px-1.5 py-0.5 sm:py-1 rounded-lg cursor-pointer transition-all hover:bg-brand-100 dark:hover:bg-slate-700 ${
                isFound
                  ? 'bg-emerald-500 text-white font-black scale-110 shadow-lg ring-2 ring-emerald-300'
                  : ''
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={100}
          timeSpentSec={elapsedSec}
          onRestart={() => {
            setTextIndex(t => (t + 1) % SAMPLE_READING_TEXTS.length);
            setElapsedSec(0);
            setFoundIndex(null);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
