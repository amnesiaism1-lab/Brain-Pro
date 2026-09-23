import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Eye, Zap, RotateCcw } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

const TARGET_CANDIDATES = ['X', '★', '◆', '▲', '✦', 'Ω', '⚡', 'Z', '7', 'Đ'];
const ALL_DISTRACTOR_SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'K', 'M', 'P', 'R', 'S', 'T', 'O', 'V', 'N', 'Y'];

export const SaccadeTrackerGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const effectiveLevel = getExerciseLevel('saccade-tracker') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const isVowelTrigger = effectiveLevel === 13;
  const isColorGated = effectiveLevel === 14;
  const isAntiSaccade = effectiveLevel === 15 || effectiveLevel === 22;
  const isParityTrigger = effectiveLevel === 19;
  const isHyperSaccade = effectiveLevel === 20 || effectiveLevel === 22;

  const jumpIntervalMs = useMemo(() => {
    if (isHyperSaccade) return 200;
    if (effectiveLevel >= 18) return 270;
    if (effectiveLevel >= 13) return 320;
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
  }, [effectiveLevel, isHyperSaccade]);

  // Dynamic target symbol per session
  const [targetSymbol, setTargetSymbol] = useState<string>(() => 
    isVowelTrigger ? 'VOWELS' : isParityTrigger ? 'EVEN' : TARGET_CANDIDATES[Math.floor(Math.random() * TARGET_CANDIDATES.length)]
  );

  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'Z'];

  const distractors = useMemo(() => {
    if (isVowelTrigger) return CONSONANTS;
    return ALL_DISTRACTOR_SYMBOLS.filter(s => s !== targetSymbol);
  }, [targetSymbol, isVowelTrigger]);

  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [currentSymbol, setCurrentSymbol] = useState('A');
  const [currentColor, setCurrentColor] = useState<'red' | 'green' | 'blue'>('red');
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
    const newX = 10 + Math.random() * 80;
    const newY = 10 + Math.random() * 80;

    let isTargetNow = Math.random() < 0.32;
    let symbol = '';
    const colorPick: 'red' | 'green' | 'blue' = ['red', 'green', 'blue'][Math.floor(Math.random() * 3)] as any;

    if (isVowelTrigger) {
      symbol = isTargetNow 
        ? VOWELS[Math.floor(Math.random() * VOWELS.length)]
        : CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
    } else if (isParityTrigger) {
      const num = Math.floor(Math.random() * 10);
      symbol = String(num);
      isTargetNow = (num % 2 === 0);
    } else if (isColorGated) {
      symbol = targetSymbol;
      // Target only if color is RED
      isTargetNow = (colorPick === 'red');
    } else if (isAntiSaccade) {
      symbol = '✦';
      isTargetNow = true;
    } else {
      symbol = isTargetNow 
        ? targetSymbol 
        : distractors[Math.floor(Math.random() * distractors.length)];
    }

    setPosition({ x: newX, y: newY });
    setCurrentSymbol(symbol);
    setCurrentColor(colorPick);
    setIsTarget(isTargetNow);

    if (isTargetNow) {
      setTargetAppearanceTime(Date.now());
    }
  }, [targetSymbol, distractors, isVowelTrigger, isParityTrigger, isColorGated, isAntiSaccade]);

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

  // Handle user reaction (clicking arena or pressing button)
  const handleReaction = useCallback(() => {
    if (isFinished) return;
    const now = Date.now();

    if (isTarget) {
      // Hit
      playSound('correct');
      const rt = now - targetAppearanceTime;
      setReactionTimes(prev => [...prev, rt]);
      setHitsCount(h => h + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + Math.max(10, Math.round((1000 - rt) / 5)) + (newCombo * 10));

      emitTrialEvent({
        exerciseSlug: 'saccade-tracker',
        level: effectiveLevel,
        relationId: 'TARGET_POSITION',
        relationWeight: 1.0,
        entities: { targetSymbol, currentSymbol, reactionMs: rt, combo: newCombo },
        stateBefore: 'target_appeared',
        stateAfter: 'target_intercepted',
        responseMs: rt,
        correct: true
      });

      // Instantly jump to prevent double hit
      jumpTarget();
    } else {
      // False Alarm
      playSound('wrong');
      setFalseAlarms(f => f + 1);
      setCombo(0);
      setScore(s => Math.max(0, s - 30));

      emitTrialEvent({
        exerciseSlug: 'saccade-tracker',
        level: effectiveLevel,
        relationId: 'TARGET_POSITION',
        relationWeight: 1.0,
        entities: { targetSymbol, distractorClicked: currentSymbol },
        stateBefore: 'distractor_present',
        stateAfter: 'false_alarm',
        responseMs: 100,
        correct: false
      });
    }
  }, [isFinished, isTarget, playSound, targetAppearanceTime, combo, emitTrialEvent, effectiveLevel, targetSymbol, currentSymbol, jumpTarget]);

  // Anti-Saccade Choice Handler
  const handleAntiSaccade = useCallback((choice: 'LEFT' | 'RIGHT') => {
    if (isFinished) return;
    const targetSide = position.x < 50 ? 'LEFT' : 'RIGHT';
    // In anti-saccade, the correct reaction is looking at the OPPOSITE side
    const expected = targetSide === 'LEFT' ? 'RIGHT' : 'LEFT';
    const isCorrect = choice === expected;

    if (isCorrect) {
      playSound('correct');
      setHitsCount(h => h + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + 50 + (newCombo * 10));
      jumpTarget();
    } else {
      playSound('wrong');
      setFalseAlarms(f => f + 1);
      setCombo(0);
    }
  }, [isFinished, position.x, playSound, combo, jumpTarget]);

  // Keyboard shortcut: Spacebar or Left/Right arrows to react
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAntiSaccade) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleAntiSaccade('LEFT');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleAntiSaccade('RIGHT');
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleReaction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReaction, handleAntiSaccade, isAntiSaccade]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const totalActions = hitsCount + falseAlarms;
  const accuracyRate = totalActions > 0 ? Math.round((hitsCount / totalActions) * 100) : 100;

  const handleNewTarget = () => {
    playSound('click');
    const available = TARGET_CANDIDATES.filter(t => t !== targetSymbol);
    const nextTarget = available[Math.floor(Math.random() * available.length)];
    setTargetSymbol(nextTarget);
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
              {effectiveLevel === 13 ? 'Vowel Trigger (Chỉ bấm khi gặp nguyên âm A, E, I, O, U)' :
               effectiveLevel === 14 ? 'Color-Gated Target (Mục tiêu chỉ hợp lệ khi có màu ĐỎ)' :
               effectiveLevel === 15 ? 'Anti-Saccade Task (Mục tiêu bên TRÁI → Bấm PHẢI, bên PHẢI → Bấm TRÁI)' :
               effectiveLevel === 16 ? 'Dual Target Jump (Hai mục tiêu nhảy luân phiên)' :
               effectiveLevel === 17 ? 'Stroop Saccade (Xung đột ý niệm & vị trí)' :
               effectiveLevel === 18 ? 'Audio-Visual Synced (Đồng bộ thị giác & âm thanh)' :
               effectiveLevel === 19 ? 'Parity Trigger (Chỉ bấm khi gặp SỐ CHẴN 0,2,4,6,8)' :
               effectiveLevel === 20 ? 'Hyper Saccade (Tốc độ nhảy 200ms cực đại)' :
               effectiveLevel === 21 ? 'Dynamic Vector Trajectory (Quỹ đạo chuyển động liên tục)' :
               'Anti-Saccade Chaos Stream (200ms Anti-Saccade Vô cực)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
            {isVowelTrigger ? 'V' : targetSymbol}
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-semibold block">Mục tiêu bắt buộc</span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
              {isVowelTrigger ? 'Nguyên âm (A, E, I, O, U)' : `Ký tự "${targetSymbol}"`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isVowelTrigger && (
            <button
              onClick={handleNewTarget}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-all btn-press"
              title="Đổi ký tự mục tiêu ngẫu nhiên"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

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
      </div>

      {/* Instruction Tip */}
      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
        <Eye className="w-5 h-5 text-brand-500" />
        <span>Di chuyển mắt theo mục tiêu. Bấm phản xạ ngay khi thấy {isVowelTrigger ? <strong className="text-rose-600 font-black">Nguyên âm (A, E, I, O, U)</strong> : <strong className="text-rose-600 font-black">"{targetSymbol}"</strong>}!</span>
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
              : isColorGated
                ? currentColor === 'red'
                  ? 'bg-rose-500 text-white ring-4 ring-rose-300'
                  : currentColor === 'green'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-500 text-white'
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

      {/* Big Action Reaction Button or Anti-Saccade Pair */}
      {isAntiSaccade ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAntiSaccade('LEFT')}
            className="h-20 sm:h-24 rounded-3xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-lg sm:text-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform btn-press"
          >
            <span>⬅️ NHÌN TRÁI (←)</span>
          </button>
          <button
            onClick={() => handleAntiSaccade('RIGHT')}
            className="h-20 sm:h-24 rounded-3xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-lg sm:text-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-transform btn-press"
          >
            <span>NHÌN PHẢI ➡️ (→)</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleReaction}
          className="w-full py-5 sm:py-6 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-xl shadow-rose-500/30 flex items-center justify-center gap-3 transition-transform btn-press"
        >
          <Zap className="w-7 h-7 animate-bounce" />
          <span>
            {isParityTrigger
              ? 'BẤM KHI THẤY SỐ CHẴN (0, 2, 4, 6, 8)'
              : isColorGated
              ? 'BẤM KHI MỤC TIÊU CÓ MÀU ĐỎ'
              : isVowelTrigger
              ? 'BẤM KHI THẤY NGUYÊN ÂM'
              : `BẤM KHI THẤY "${targetSymbol}" (Phím Cách)`}
          </span>
        </button>
      )}

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
            handleNewTarget();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
