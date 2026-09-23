import React, { useState, useEffect, useRef } from 'react';
import { VIETNAMESE_WORDS_DICTIONARY, generateAnagram } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { RotateCcw } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService } from '../../services/readingContentService';

export const AnagramGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, enableHints, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastWordTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('anagram') || currentLevel;
  
  const combinedDict = React.useMemo(() => {
    const extra = readingContentService.getVocabularyList();
    const merged = [...VIETNAMESE_WORDS_DICTIONARY, ...extra];
    return Array.from(new Set(merged.map(w => w.toUpperCase())));
  }, []);

  const wordPool = effectiveLevel <= 3 
    ? combinedDict.filter(w => w.replace(/\s+/g, '').length <= 4)
    : effectiveLevel <= 6 
      ? combinedDict.filter(w => w.replace(/\s+/g, '').length <= 7)
      : combinedDict;

  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * 100));
  const targetWord = (wordPool[currentIndex % wordPool.length] || 'TRÍ TUỆ').replace(/\s+/g, '');
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableTiles, setAvailableTiles] = useState<Array<{ id: number; char: string; used: boolean }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [scoreAcc, setScoreAcc] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [round, setRound] = useState(1);
  const maxRounds = 4;

  const setupRound = (word: string) => {
    const data = generateAnagram(word);
    setSelectedLetters([]);
    setAvailableTiles(data.scrambled.map((c, i) => ({ id: i, char: c, used: false })));
  };

  useEffect(() => {
    setupRound(targetWord);
  }, [currentIndex, targetWord]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTileClick = (tileId: number, char: string) => {
    playSound('click');
    setAvailableTiles(prev => prev.map(t => t.id === tileId ? { ...t, used: true } : t));
    const nextSelected = [...selectedLetters, char];
    setSelectedLetters(nextSelected);

    // Check if fully formed
    if (nextSelected.length === targetWord.length) {
      const formedWord = nextSelected.join('');
      const isCorrect = formedWord === targetWord;
      const now = Date.now();
      const respMs = Math.min(15000, Math.max(100, now - lastWordTimeRef.current));
      lastWordTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'anagram',
        level: effectiveLevel,
        relationId: 'PART_WHOLE',
        relationWeight: 1.0,
        entities: { target: targetWord, formed: formedWord },
        stateBefore: `round:${round}`,
        stateAfter: isCorrect ? `round:${round + 1}` : `round:${round}`,
        responseMs: respMs,
        correct: isCorrect
      });

      if (isCorrect) {
        playSound('correct');
        setScoreAcc(s => s + 150 * currentLevel);
        if (round >= maxRounds) {
          setIsFinished(true);
        } else {
          setRound(r => r + 1);
          setCurrentIndex(i => i + 1);
        }
      } else {
        playSound('wrong');
        // Reset current selection after slight delay
        setTimeout(() => {
          setSelectedLetters([]);
          setAvailableTiles(prev => prev.map(t => ({ ...t, used: false })));
        }, 350);
      }
    }
  };

  const handleUndo = () => {
    playSound('click');
    setSelectedLetters([]);
    setAvailableTiles(prev => prev.map(t => ({ ...t, used: false })));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.key === 'Backspace') {
        // remove last letter
        if (selectedLetters.length > 0) {
          const lastChar = selectedLetters[selectedLetters.length - 1];
          const updatedSelected = selectedLetters.slice(0, -1);
          setSelectedLetters(updatedSelected);
          // find last used tile with this char
          const lastIndex = availableTiles.map((t, idx) => ({ ...t, idx }))
            .filter(t => t.used && t.char.toLowerCase() === lastChar.toLowerCase())
            .pop();
          if (lastIndex) {
            setAvailableTiles(prev => prev.map((t, i) => i === lastIndex.idx ? { ...t, used: false } : t));
          }
        }
      } else if (e.key.length === 1 && /[a-zA-Zà-ỹÀ-Ỹ]/i.test(e.key)) {
        // match an unused tile
        const targetTile = availableTiles.find(t => !t.used && t.char.toLowerCase() === e.key.toLowerCase());
        if (targetTile) {
          handleTileClick(targetTile.id, targetTile.char);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableTiles, selectedLetters, isFinished, targetWord]);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-4 space-y-8 animate-fade-in pb-24">
      {/* HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Vòng chơi</span>
          <div className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {round} / {maxRounds}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            {elapsedSec}s
          </div>
        </div>
      </div>

      {/* Answer Slots Display */}
      <div className="text-center space-y-3">
        <span className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">Từ cần sắp xếp</span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 min-h-[70px]">
          {Array.from({ length: targetWord.length }).map((_, idx) => (
            <div
              key={idx}
              className="w-12 h-14 sm:w-16 sm:h-20 md:w-20 md:h-24 rounded-2xl sm:rounded-3xl border-2 border-brand-500/50 bg-white dark:bg-slate-800 flex items-center justify-center text-xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white shadow-md"
            >
              {selectedLetters[idx] || (enableHints && idx === 0 ? <span className="opacity-30 text-amber-500">{targetWord[0]}</span> : '')}
            </div>
          ))}
        </div>
      </div>

      {/* Scrambled Clickable Letter Tiles */}
      <div className="space-y-4">
        <span className="text-xs sm:text-sm text-center block text-slate-500 font-medium">
          Bấm chọn hoặc gõ phím các chữ cái bên dưới:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              disabled={tile.used}
              onClick={() => handleTileClick(tile.id, tile.char)}
              className={`w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-3xl md:text-4xl flex items-center justify-center transition-all duration-150 btn-press ${
                tile.used
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800 opacity-40 cursor-default scale-95'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30 border border-brand-500 active:scale-95'
              }`}
            >
              {tile.char}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleUndo}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors btn-press"
        >
          <RotateCcw className="w-5 h-5" />
          Xếp lại từ đầu (Backspace)
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={scoreAcc + 200}
          accuracyRate={95}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCurrentIndex(0);
            setElapsedSec(0);
            setScoreAcc(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
