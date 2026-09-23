import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService } from '../../services/readingContentService';
import { RotateCcw, Sparkles } from 'lucide-react';

export const FindLetterGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const lastClickRef = React.useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('find-letter') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const gridSize = effectiveLevel >= 20 ? 10 : effectiveLevel >= 17 ? 9 : effectiveLevel >= 13 ? 8 : effectiveLevel <= 2 ? 5 : effectiveLevel <= 5 ? 6 : effectiveLevel <= 8 ? 7 : 8;
  const targetCount = effectiveLevel >= 20 ? 10 : effectiveLevel >= 16 ? 8 : effectiveLevel >= 13 ? 6 : effectiveLevel <= 2 ? 3 : effectiveLevel <= 5 ? 4 : effectiveLevel <= 8 ? 5 : 7;

  // Challenge mode: 'all' | 'vowel_tones' | 'confusable'
  const [challengeMode, setChallengeMode] = useState<'all' | 'vowel_tones' | 'confusable'>(() => {
    if (effectiveLevel >= 13) return 'confusable';
    return 'all';
  });
  
  const [challenge, setChallenge] = useState(() => 
    readingContentService.getRandomLetterChallenge(challengeMode)
  );

  interface LetterCellItem {
    id: number;
    char: string;
    isTarget: boolean;
    found: boolean;
    rotationDeg?: number;
    fontFamily?: string;
    mirror?: boolean;
    scale?: number;
    colorClass?: string;
  }

  const [grid, setGrid] = useState<LetterCellItem[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const MATH_SYMBOLS = ['∑', 'π', 'Ω', 'δ', '∞', 'λ', 'θ', 'ψ', 'Δ', 'β', '≈', '≠', '√', '∫'];
  const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive'];
  const CAMOUFLAGE_COLORS = [
    'text-rose-500', 'text-blue-500', 'text-emerald-500', 
    'text-amber-500', 'text-purple-500', 'text-cyan-500', 'text-pink-500'
  ];

  const initGridWithChallenge = useCallback((currentChallenge: typeof challenge) => {
    const totalCells = gridSize * gridSize;
    const items: LetterCellItem[] = [];
    
    // Distribute target count
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    const { target, distractors } = currentChallenge;
    let distractorPool = [...distractors];

    // ∞-VII & ∞-X: Symbol invasion
    if (effectiveLevel === 19 || effectiveLevel === 22) {
      distractorPool = [...distractorPool, ...MATH_SYMBOLS];
    }
    // ∞-I: Latin letters mix
    if (effectiveLevel === 13) {
      distractorPool = [...distractorPool, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
    }

    const rotations = [0, 90, 180, 270];

    for (let i = 0; i < totalCells; i++) {
      const isTarget = targetIndices.has(i);
      const rotationDeg = (effectiveLevel === 14 || effectiveLevel === 21 || effectiveLevel === 22) 
        ? rotations[Math.floor(Math.random() * rotations.length)] 
        : 0;
      const fontFamily = (effectiveLevel === 16 || effectiveLevel === 22) 
        ? FONTS[Math.floor(Math.random() * FONTS.length)] 
        : undefined;
      const mirror = (effectiveLevel === 15 || effectiveLevel === 21 || effectiveLevel === 22) 
        ? Math.random() < 0.5 
        : false;
      const scale = effectiveLevel === 17 
        ? +(0.7 + Math.random() * 0.6).toFixed(2) 
        : undefined;
      const colorClass = (effectiveLevel === 20 || effectiveLevel === 22)
        ? CAMOUFLAGE_COLORS[Math.floor(Math.random() * CAMOUFLAGE_COLORS.length)]
        : undefined;

      items.push({
        id: i,
        char: isTarget ? target : distractorPool[Math.floor(Math.random() * distractorPool.length)],
        isTarget,
        found: false,
        rotationDeg,
        fontFamily,
        mirror,
        scale,
        colorClass
      });
    }
    setGrid(items);
    setFoundCount(0);
    setMissCount(0);
    setElapsedSec(0);
    setIsFinished(false);
  }, [gridSize, targetCount, effectiveLevel]);

  const handleNewChallenge = (mode = challengeMode) => {
    playSound('click');
    const nextChallenge = readingContentService.getRandomLetterChallenge(mode);
    setChallenge(nextChallenge);
    initGridWithChallenge(nextChallenge);
  };

  useEffect(() => {
    initGridWithChallenge(challenge);
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel, gridSize, challenge, initGridWithChallenge]);

  const handleCellClick = (cellId: number) => {
    const cell = grid.find(c => c.id === cellId);
    if (!cell || cell.found) return;

    const isCorrect = cell.isTarget;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickRef.current));
    lastClickRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'find-letter',
      level: effectiveLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: challenge.target,
        distractor: !isCorrect ? cell.char : undefined,
        challengeType: challenge.type,
        position: String(cellId)
      },
      stateBefore: 'scanning_matrix',
      stateAfter: isCorrect ? 'target_isolated' : 'distractor_clicked',
      responseMs: respMs,
      correct: isCorrect
    });

    if (cell.isTarget) {
      playSound('click');
      const updated = grid.map(c => c.id === cellId ? { ...c, found: true } : c);
      setGrid(updated);
      const nextFound = foundCount + 1;
      setFoundCount(nextFound);

      if (nextFound >= targetCount) {
        playSound('correct');
        setIsFinished(true);
      }
    } else {
      playSound('wrong');
      setMissCount(m => m + 1);
    }
  };

  const totalClicks = foundCount + missCount;
  const accuracy = totalClicks > 0 ? Math.round((foundCount / totalClicks) * 100) : 100;
  const score = calculateGameScore({
    level: effectiveLevel,
    accuracyRate: accuracy,
    timeLimitSec: isInfinity ? 60 : 40,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13 ? 'Latin Alphabet Hunt (Ký tự Latin học thuật)' :
               effectiveLevel === 14 ? 'Rotated Letters (Xoay góc 90°/180°/270° ngẫu nhiên)' :
               effectiveLevel === 15 ? 'Mirror Inversion (Ký tự đảo gương đối xứng)' :
               effectiveLevel === 16 ? 'Font Typography Clash (Họ phông chữ Serif, Sans, Cursive, Mono)' :
               effectiveLevel === 17 ? 'Font Size Chaos (Kích thước ký tự biến thiên hỗn loạn)' :
               effectiveLevel === 18 ? 'Confusable Glyphs (Ký tự dễ gây nhầm lẫn thị giác)' :
               effectiveLevel === 19 ? 'Symbol Invasion (Ký hiệu toán học ∑, π, Ω, δ, ∞, λ)' :
               effectiveLevel === 20 ? 'Color Camouflage (Ngụy trang đa sắc tố)' :
               effectiveLevel === 21 ? 'Mirror & Rotation Maze (Kết hợp xoay + lật gương)' :
               'Quantum Matrix (Ma trận 10x10 tổng hợp toàn diện)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            {challenge.target}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                {challenge.type}
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-1">
              Đã tìm: <strong className="text-brand-600 text-base sm:text-lg">{foundCount} / {targetCount}</strong>
            </div>
          </div>
        </div>

        {/* Change Challenge Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNewChallenge()}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all btn-press"
            title="Đổi bộ ký tự ngẫu nhiên khác"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đổi ký tự</span>
          </button>

          <div className="text-right">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
              {elapsedSec}s
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Mode Pill Filter */}
      <div className="flex items-center justify-center gap-2">
        {[
          { id: 'all', label: 'Ngẫu nhiên tất cả' },
          { id: 'vowel_tones', label: 'Dấu thanh Tiếng Việt' },
          { id: 'confusable', label: 'Ký tự dễ nhầm lẫn' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => {
              setChallengeMode(m.id as any);
              handleNewChallenge(m.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              challengeMode === m.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
        Quét nhanh qua ma trận ký tự và nhấp vào tất cả chữ <strong>"{challenge.target}"</strong> ({challenge.description})!
      </p>

      {/* Grid */}
      <div 
        className="grid gap-2 sm:gap-3 md:gap-4 bg-[#F5EFE6] dark:bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none aspect-square"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((cell) => (
          <button
            key={cell.id}
            onClick={() => handleCellClick(cell.id)}
            style={{
              transform: `${cell.rotationDeg ? `rotate(${cell.rotationDeg}deg)` : ''} ${cell.mirror ? 'scaleX(-1)' : ''} ${cell.scale ? `scale(${cell.scale})` : ''}`.trim() || undefined,
              fontFamily: cell.fontFamily || undefined
            }}
            className={`flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-100 btn-press ${cell.colorClass || 'text-slate-800 dark:text-white'} ${
              gridSize >= 10 ? 'text-xs sm:text-base md:text-lg' : gridSize >= 8 ? 'text-sm sm:text-lg md:text-xl' : 'text-base sm:text-xl md:text-2xl lg:text-3xl'
            } ${
              cell.found
                ? 'bg-emerald-500 !text-white shadow scale-95 cursor-default'
                : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 shadow-sm'
            }`}
          >
            {cell.char}
          </button>
        ))}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            handleNewChallenge();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
