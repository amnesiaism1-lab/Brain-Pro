import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Zap, AlertTriangle } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';

interface ColorDef {
  id: string;
  nameVi: string;
  hex: string;
  twText: string;
  twBg: string;
  twBorder: string;
}

const COLOR_PALETTE: ColorDef[] = [
  { id: 'red', nameVi: 'ĐỎ', hex: '#EF4444', twText: 'text-red-500', twBg: 'bg-red-500', twBorder: 'border-red-500' },
  { id: 'blue', nameVi: 'XANH BIỂN', hex: '#3B82F6', twText: 'text-blue-500', twBg: 'bg-blue-500', twBorder: 'border-blue-500' },
  { id: 'green', nameVi: 'XANH LÁ', hex: '#10B981', twText: 'text-emerald-500', twBg: 'bg-emerald-500', twBorder: 'border-emerald-500' },
  { id: 'yellow', nameVi: 'VÀNG', hex: '#F59E0B', twText: 'text-amber-500', twBg: 'bg-amber-500', twBorder: 'border-amber-500' },
  { id: 'purple', nameVi: 'TÍM', hex: '#8B5CF6', twText: 'text-purple-500', twBg: 'bg-purple-500', twBorder: 'border-purple-500' },
  { id: 'orange', nameVi: 'CAM', hex: '#F97316', twText: 'text-orange-500', twBg: 'bg-orange-500', twBorder: 'border-orange-500' }
];

export const StroopClashGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('stroop-clash') || currentLevel;

  const totalTrials = 15;
  const reactionWindowMs = useMemo(() => {
    switch (effectiveLevel) {
      case 1: return 3500;
      case 2: return 3000;
      case 3: return 2600;
      case 4: return 2300;
      case 5: return 2000;
      case 6: return 1800;
      case 7: return 1600;
      case 8: return 1450;
      case 9: return 1500; // Đảo ngược quy tắc: cần thời gian ức chế thói quen đọc mực
      case 10: return 1400; // Tam trùng xung đột: cần nhận biết viền và bỏ qua chữ + mực
      case 11: return 1300; // Luân phiên luật chữ & màu
      case 12: return 1200; // Cực hạn phản xạ
      default: return 2000;
    }
  }, [effectiveLevel]);

  const isReverseStroop = effectiveLevel === 9;
  const isTripleStroop = effectiveLevel === 10;
  const isAlternating = effectiveLevel === 11;

  const [trialIndex, setTrialIndex] = useState(0);
  const [wordItem, setWordItem] = useState<{ text: string; inkColor: ColorDef; borderColor?: ColorDef } | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState<'CORRECT' | 'WRONG' | 'TIMEOUT' | null>(null);

  // Current instruction rule
  const currentTargetType = useMemo<'INK' | 'TEXT' | 'BORDER'>(() => {
    if (isTripleStroop) return 'BORDER';
    if (isReverseStroop) return 'TEXT';
    if (isAlternating) return trialIndex % 2 === 0 ? 'INK' : 'TEXT';
    return 'INK';
  }, [isTripleStroop, isReverseStroop, isAlternating, trialIndex]);

  const nextTrial = useCallback((index: number) => {
    if (index >= totalTrials) {
      setIsFinished(true);
      return;
    }

    // Pick text color, ink color, and optional border color
    const textIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    let inkIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    
    // 75% chance of conflict (Stroop effect)
    if (Math.random() < 0.75 && inkIdx === textIdx) {
      inkIdx = (inkIdx + 1) % COLOR_PALETTE.length;
    }

    let borderIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    if (borderIdx === inkIdx || borderIdx === textIdx) {
      borderIdx = (borderIdx + 2) % COLOR_PALETTE.length;
    }

    setWordItem({
      text: COLOR_PALETTE[textIdx].nameVi,
      inkColor: COLOR_PALETTE[inkIdx],
      borderColor: COLOR_PALETTE[borderIdx]
    });
    setTrialIndex(index);
    setTrialStartTime(Date.now());
    setFlashFeedback(null);
  }, [totalTrials]);

  useEffect(() => {
    nextTrial(0);
  }, [nextTrial]);

  // Timeout monitor
  useEffect(() => {
    if (isFinished || !wordItem) return;

    const timer = setTimeout(() => {
      // Timeout reached!
      playSound('wrong');
      setCombo(0);
      setFlashFeedback('TIMEOUT');

      const expectedTarget = currentTargetType === 'TEXT'
        ? wordItem.text
        : currentTargetType === 'BORDER' && wordItem.borderColor
        ? wordItem.borderColor.nameVi
        : wordItem.inkColor.nameVi;

      emitTrialEvent({
        exerciseSlug: 'stroop-clash',
        level: effectiveLevel,
        relationId: 'INHIBITION',
        relationWeight: 1.0,
        entities: {
          target: expectedTarget,
          distractor: wordItem.text,
          rule: currentTargetType,
          timedOut: true
        },
        stateBefore: 'inhibited_conflict',
        stateAfter: 'stroop_timeout',
        responseMs: reactionWindowMs,
        correct: false
      });

      setTimeout(() => {
        nextTrial(trialIndex + 1);
      }, 500);
    }, reactionWindowMs);

    return () => clearTimeout(timer);
  }, [trialIndex, wordItem, reactionWindowMs, isFinished, playSound, nextTrial, currentTargetType, effectiveLevel, emitTrialEvent]);

  const handleChoice = (selectedColor: ColorDef) => {
    if (isFinished || !wordItem) return;
    const now = Date.now();
    const rt = now - trialStartTime;

    let isCorrect = false;
    if (currentTargetType === 'TEXT') {
      isCorrect = selectedColor.nameVi === wordItem.text;
    } else if (currentTargetType === 'BORDER' && wordItem.borderColor) {
      isCorrect = selectedColor.id === wordItem.borderColor.id;
    } else {
      isCorrect = selectedColor.id === wordItem.inkColor.id;
    }

    if (isCorrect) {
      playSound('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setCorrectCount(c => c + 1);
      setReactionTimes(prev => [...prev, rt]);
      
      // Speed bonus: faster reaction gives more points
      const speedFactor = Math.max(1, Math.round((reactionWindowMs - rt) / 15));
      const addedScore = 50 + (effectiveLevel * 10) + speedFactor + (nextCombo * 10);
      setScore(s => s + addedScore);
      setFlashFeedback('CORRECT');
    } else {
      playSound('wrong');
      setCombo(0);
      setFlashFeedback('WRONG');
    }

    emitTrialEvent({
      exerciseSlug: 'stroop-clash',
      level: effectiveLevel,
      relationId: 'INHIBITION',
      relationWeight: 1.0,
      entities: {
        target: wordItem.inkColor.nameVi,
        distractor: wordItem.text,
        rule: currentTargetType
      },
      stateBefore: 'inhibited_conflict',
      stateAfter: isCorrect ? 'correct_response' : 'stroop_interference',
      responseMs: rt,
      correct: isCorrect
    });

    setTimeout(() => {
      nextTrial(trialIndex + 1);
    }, 250);
  };

  const avgReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
    : 0;

  const accuracyRate = trialIndex > 0 ? Math.round((correctCount / trialIndex) * 100) : 100;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-7 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số (Chuỗi: x{combo})</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {score}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Lượt kiểm tra</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {Math.min(trialIndex + 1, totalTrials)} / {totalTrials}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Phản xạ TB</span>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-500 mt-0.5">
            {avgReactionTime ? `${avgReactionTime}ms` : '--'}
          </div>
        </div>
      </div>

      {/* Warning / Instruction Banner */}
      <div className={`rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 text-xs sm:text-sm font-medium border ${
        currentTargetType === 'TEXT'
          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200'
          : currentTargetType === 'BORDER'
          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
      }`}>
        <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-500" />
        <div>
          {currentTargetType === 'TEXT' ? (
            <span><strong>ĐẢO QUY TẮC:</strong> Chọn đúng <span className="underline font-black">Ý NGHĨA CỦA CHỮ</span>, bỏ qua màu sắc hiển thị!</span>
          ) : currentTargetType === 'BORDER' ? (
            <span><strong>TAM TRÙNG XUNG ĐỘT:</strong> Bấm chọn đúng <span className="underline font-black">MÀU CỦA VIỀN NGOÀI</span>!</span>
          ) : (
            <span><strong>QUY TẮC STROOP:</strong> Chọn đúng <span className="underline font-black">MÀU MỰC HIỂN THỊ</span>, bỏ qua chữ viết!</span>
          )}
        </div>
      </div>

      {/* Trial Countdown Timer Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-2 sm:h-2.5 rounded-full overflow-hidden shadow-inner relative">
        <div 
          key={trialIndex}
          className="h-full rounded-full animate-timer-shrink bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
          style={{ animationDuration: `${reactionWindowMs}ms` }}
        />
      </div>

      {/* Presentation Word Box */}
      <div 
        className={`h-56 sm:h-72 md:h-80 rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8 shadow-2xl border-4 transition-all duration-150 relative overflow-hidden ${
          flashFeedback === 'CORRECT' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500' :
          flashFeedback === 'WRONG' || flashFeedback === 'TIMEOUT' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shake' :
          currentTargetType === 'BORDER' && wordItem?.borderColor
            ? 'bg-white dark:bg-slate-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
        style={currentTargetType === 'BORDER' && wordItem?.borderColor && !flashFeedback ? {
          borderColor: wordItem.borderColor.hex,
          borderWidth: '10px',
          boxShadow: `0 0 28px ${wordItem.borderColor.hex}44`
        } : undefined}
      >
        {/* Rule Indicator Badge on Card */}
        <div className="mb-2 sm:mb-4">
          {currentTargetType === 'BORDER' && wordItem?.borderColor ? (
            <span 
              className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5"
              style={{ 
                backgroundColor: `${wordItem.borderColor.hex}22`, 
                color: wordItem.borderColor.hex, 
                border: `1.5px solid ${wordItem.borderColor.hex}` 
              }}
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: wordItem.borderColor.hex }} />
              CHỌN MÀU CỦA VIỀN NGOÀI
            </span>
          ) : currentTargetType === 'TEXT' ? (
            <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300">
              CHỌN Ý NGHĨA CỦA CHỮ
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              CHỌN MÀU MỰC HIỂN THỊ
            </span>
          )}
        </div>

        {wordItem && (
          <span 
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-wider uppercase drop-shadow-md select-none animate-scale-up"
            style={{ color: wordItem.inkColor.hex }}
          >
            {wordItem.text}
          </span>
        )}

        {flashFeedback === 'TIMEOUT' && (
          <span className="text-sm font-bold text-rose-500 mt-3 animate-bounce">
            Hết thời gian ({reactionWindowMs}ms)!
          </span>
        )}
      </div>

      {/* Color Selection Buttons */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {COLOR_PALETTE.map(color => (
          <button
            key={color.id}
            onClick={() => handleChoice(color)}
            className="py-4 sm:py-5 md:py-6 px-3 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg md:text-xl text-white shadow-lg btn-press hover:shadow-xl hover:scale-[1.03] transition-all flex flex-col items-center justify-center gap-1.5"
            style={{ backgroundColor: color.hex }}
          >
            <Zap className="w-5 h-5 opacity-80" />
            <span>{color.nameVi}</span>
          </button>
        ))}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={Math.round((reactionTimes.reduce((a, b) => a + b, 0)) / 1000) || 15}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScore(0);
            setCombo(0);
            setCorrectCount(0);
            setReactionTimes([]);
            setIsFinished(false);
            nextTrial(0);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
