import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Eye, Zap } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

const DISTRACTOR_SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'K', 'M', 'P', 'R', 'S', 'T'];
const TARGET_SYMBOL = 'X';

export const SaccadeTrackerGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const effectiveLevel = getExerciseLevel('saccade-tracker') || currentLevel;

  const isColorSwitch = effectiveLevel === 11;

  const jumpIntervalMs = useMemo(() => {
    switch (effectiveLevel) {
      case 1: return 1200;
      case 2: return 1050;
      case 3: return 920;
      case 4: return 820;
      case 5: return 720;
      case 6: return 640;
      case 7: return 560;
      case 8: return 500;
      case 9: return 450;
      case 10: return 400;
      case 11: return 360;
      case 12: return 320;
      default: return 500;
    }
  }, [effectiveLevel]);

  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [currentSymbol, setCurrentSymbol] = useState('A');
  const [isTarget, setIsTarget] = useState(false);
  const [targetAppearanceTime, setTargetAppearanceTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hitsCount, setHitsCount] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [isFinished, setIsFinished] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);

  // Jump loop
  const jumpTarget = useCallback(() => {
    // Generate new random position (keeping 10% margin from edges)
    const newX = 10 + Math.random() * 80;
    const newY = 10 + Math.random() * 80;

    // 25% chance of being the target 'X'
    const isTargetNow = Math.random() < 0.25;
    const symbol = isTargetNow 
      ? TARGET_SYMBOL 
      : DISTRACTOR_SYMBOLS[Math.floor(Math.random() * DISTRACTOR_SYMBOLS.length)];

    setPosition({ x: newX, y: newY });
    setCurrentSymbol(symbol);
    setIsTarget(isTargetNow);

    if (isTargetNow) {
      setTargetAppearanceTime(Date.now());
    }
  }, []);

  useEffect(() => {
    jumpTarget();
    const interval = setInterval(jumpTarget, jumpIntervalMs);
    return () => clearInterval(interval);
  }, [jumpTarget, jumpIntervalMs]);

  // Countdown timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  const handleReaction = useCallback(() => {
    if (isFinished) return;

    if (isTarget) {
      // Hit!
      const rt = Date.now() - targetAppearanceTime;
      playSound('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setHitsCount(h => h + 1);
      setReactionTimes(prev => [...prev, rt]);
      
      emitTrialEvent({
        exerciseSlug: 'saccade-tracker',
        level: effectiveLevel,
        relationId: 'TARGET_POSITION',
        relationWeight: 1.0,
        entities: { target: TARGET_SYMBOL, position: `${Math.round(position.x)}%,${Math.round(position.y)}%`, rt },
        stateBefore: `hits:${hitsCount}`,
        stateAfter: `hits:${hitsCount + 1}`,
        responseMs: rt,
        correct: true
      });

      const speedBonus = Math.max(10, Math.round((jumpIntervalMs - rt) / 5));
      const addedScore = 100 + speedBonus + (nextCombo * 15);
      setScore(s => s + addedScore);
      setIsTarget(false); // consume target
    } else {
      // False alarm
      playSound('wrong');
      setCombo(0);
      setFalseAlarms(f => f + 1);

      emitTrialEvent({
        exerciseSlug: 'saccade-tracker',
        level: effectiveLevel,
        relationId: 'INHIBITION',
        relationWeight: 1.0,
        entities: { distractor: currentSymbol, position: `${Math.round(position.x)}%,${Math.round(position.y)}%` },
        stateBefore: `falseAlarms:${falseAlarms}`,
        stateAfter: `falseAlarms:${falseAlarms + 1}`,
        responseMs: jumpIntervalMs,
        correct: false
      });
    }
  }, [isFinished, isTarget, targetAppearanceTime, playSound, combo, jumpIntervalMs, effectiveLevel, hitsCount, falseAlarms, currentSymbol, position, emitTrialEvent]);

  // Keyboard shortcut: Spacebar to react
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleReaction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReaction]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const totalActions = hitsCount + falseAlarms;
  const accuracyRate = totalActions > 0 ? Math.round((hitsCount / totalActions) * 100) : 100;

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số (Chuỗi: x{combo})</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {score}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Phản xạ TB</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {avgReactionTime ? `${avgReactionTime}ms` : '--'}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Instruction Tip */}
      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
        <Eye className="w-5 h-5 text-brand-500" />
        <span>Di chuyển mắt theo mục tiêu. Bấm phản xạ ngay khi thấy chữ <strong>"X"</strong>!</span>
      </div>

      {/* Ocular Tracking Arena */}
      <div 
        ref={arenaRef}
        onClick={handleReaction}
        className="relative h-80 sm:h-96 md:h-[460px] lg:h-[520px] bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl cursor-crosshair select-none"
      >
        {/* Subtle coordinate grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none" />

        {/* Center fixation reticle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-slate-600 pointer-events-none opacity-30" />

        {/* Jumping Saccade Target */}
        <div 
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl transition-all duration-100 ${
            isTarget 
              ? 'bg-rose-500 text-white shadow-rose-500/60 scale-110 ring-4 ring-rose-300 animate-pulse' 
              : isColorSwitch
                ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-95'
                : 'bg-brand-500 text-white shadow-brand-500/40 scale-95'
          }`}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`
          }}
        >
          {currentSymbol}
        </div>
      </div>

      {/* Big Action Reaction Button */}
      <button
        onClick={handleReaction}
        className="w-full py-5 sm:py-6 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-xl shadow-rose-500/30 flex items-center justify-center gap-3 transition-transform btn-press"
      >
        <Zap className="w-7 h-7 animate-bounce" />
        <span>BẤM KHI THẤY "X" (Phím Cách)</span>
      </button>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={35}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScore(0);
            setCombo(0);
            setHitsCount(0);
            setFalseAlarms(0);
            setReactionTimes([]);
            setTimeLeft(35);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
