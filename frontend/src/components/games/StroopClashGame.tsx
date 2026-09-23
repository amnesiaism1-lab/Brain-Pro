import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { Zap, AlertTriangle, Infinity as InfinityIcon, Volume2 } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { speakWord, infinityApiService, EMOTION_WORDS } from '../../services/infinityApiService';
import { INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';

export interface ColorDef {
  id: string;
  nameVi: string;
  nameEn: string;
  hex: string;
  twText: string;
  twBg: string;
  twBorder: string;
}

const COLOR_PALETTE: ColorDef[] = [
  { id: 'red', nameVi: 'ĐỎ', nameEn: 'RED', hex: '#EF4444', twText: 'text-red-500', twBg: 'bg-red-500', twBorder: 'border-red-500' },
  { id: 'blue', nameVi: 'XANH BIỂN', nameEn: 'BLUE', hex: '#3B82F6', twText: 'text-blue-500', twBg: 'bg-blue-500', twBorder: 'border-blue-500' },
  { id: 'green', nameVi: 'XANH LÁ', nameEn: 'GREEN', hex: '#10B981', twText: 'text-emerald-500', twBg: 'bg-emerald-500', twBorder: 'border-emerald-500' },
  { id: 'yellow', nameVi: 'VÀNG', nameEn: 'YELLOW', hex: '#F59E0B', twText: 'text-amber-500', twBg: 'bg-amber-500', twBorder: 'border-amber-500' },
  { id: 'purple', nameVi: 'TÍM', nameEn: 'PURPLE', hex: '#8B5CF6', twText: 'text-purple-500', twBg: 'bg-purple-500', twBorder: 'border-purple-500' },
  { id: 'orange', nameVi: 'CAM', nameEn: 'ORANGE', hex: '#F97316', twText: 'text-orange-500', twBg: 'bg-orange-500', twBorder: 'border-orange-500' }
];

export const DIRECTION_OPTIONS = [
  { id: 'UP', label: 'TRÊN', en: 'UP' },
  { id: 'DOWN', label: 'DƯỚI', en: 'DOWN' },
  { id: 'LEFT', label: 'TRÁI', en: 'LEFT' },
  { id: 'RIGHT', label: 'PHẢI', en: 'RIGHT' }
];

export const StroopClashGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const effectiveLevel = getExerciseLevel('stroop-clash') || currentLevel;

  const isInfinity = effectiveLevel >= 13;
  const infinityTier = getInfinityTier(effectiveLevel);

  const totalTrials = effectiveLevel >= 13 ? 20 : 15;

  const [trialIndex, setTrialIndex] = useState(0);
  const [wordItem, setWordItem] = useState<{
    text: string;
    inkColor: ColorDef;
    borderColor?: ColorDef;
    spokenColor?: ColorDef;
    isExclusionTarget?: boolean;
    displayLang: 'vi' | 'en';
    spatialPos?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    motionOffset?: { x: number; y: number };
  } | null>(null);

  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState<'CORRECT' | 'WRONG' | 'TIMEOUT' | null>(null);

  // Standard modes
  const isReverseStroop = effectiveLevel === 9;
  const isTripleStroop = effectiveLevel === 10;
  const isAlternating = effectiveLevel === 11;

  // Infinity modes
  const isEnglishStroop = effectiveLevel === 13;
  const isBilingualStroop = effectiveLevel === 14;
  const isAudioStroop = effectiveLevel === 15;
  const is4WayStroop = effectiveLevel === 16;
  const isMotionStroop = effectiveLevel === 17;
  const isEmotionStroop = effectiveLevel === 18;
  const isExclusionStroop = effectiveLevel === 19;
  const isHyperSpeed = effectiveLevel === 20;
  const isDirectionalStroop = effectiveLevel === 21;
  const isChaosStroop = effectiveLevel === 22;

  // Reaction Window Calculation
  const reactionWindowMs = useMemo(() => {
    if (isHyperSpeed) {
      // Ramp down from 1200ms by 50ms per trial to minimum 400ms
      return Math.max(400, 1200 - (trialIndex * 50));
    }
    switch (effectiveLevel) {
      case 1: return 3500;
      case 2: return 3000;
      case 3: return 2600;
      case 4: return 2300;
      case 5: return 2000;
      case 6: return 1800;
      case 7: return 1600;
      case 8: return 1450;
      case 9: return 1500;
      case 10: return 1400;
      case 11: return 1300;
      case 12: return 1200;
      case 13: return 1600; // English Stroop
      case 14: return 1500; // Bilingual Alternation
      case 15: return 1800; // Audio Conflict (extra time to process audio)
      case 16: return 1500; // 4-Way Multi
      case 17: return 1500; // Motion
      case 18: return 1400; // Emotion
      case 19: return 1800; // Exclusion logic
      case 20: return 600;  // Hyper-speed
      case 21: return 1300; // Directional
      case 22: return 1200; // Chaos
      default: return 1600;
    }
  }, [effectiveLevel, isHyperSpeed, trialIndex]);

  // Current Target Instruction Type
  const currentTargetType = useMemo<'INK' | 'TEXT' | 'BORDER' | 'EXCLUSION' | 'DIRECTION_POS' | 'DIRECTION_WORD'>(() => {
    if (isDirectionalStroop) {
      return trialIndex % 2 === 0 ? 'DIRECTION_POS' : 'DIRECTION_WORD';
    }
    if (isExclusionStroop) return 'EXCLUSION';
    if (isTripleStroop) return 'BORDER';
    if (isReverseStroop) return 'TEXT';
    if (isAlternating) return trialIndex % 2 === 0 ? 'INK' : 'TEXT';
    if (isChaosStroop) {
      const modes: Array<'INK' | 'TEXT' | 'BORDER'> = ['INK', 'TEXT', 'BORDER'];
      return modes[trialIndex % modes.length];
    }
    return 'INK';
  }, [isDirectionalStroop, isExclusionStroop, isTripleStroop, isReverseStroop, isAlternating, isChaosStroop, trialIndex]);

  const nextTrial = useCallback((index: number) => {
    if (index >= totalTrials) {
      setIsFinished(true);
      return;
    }

    // Determine language
    let lang: 'vi' | 'en' = 'vi';
    if (isEnglishStroop || isEmotionStroop || isAudioStroop || effectiveLevel >= 20) {
      lang = 'en';
    } else if (isBilingualStroop) {
      lang = index % 2 === 0 ? 'vi' : 'en';
    }

    // Pick text color, ink color, and optional border color
    const textIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    let inkIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    
    // 80% chance of conflict
    if (Math.random() < 0.8 && inkIdx === textIdx) {
      inkIdx = (inkIdx + 1) % COLOR_PALETTE.length;
    }

    let borderIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    if (borderIdx === inkIdx || borderIdx === textIdx) {
      borderIdx = (borderIdx + 2) % COLOR_PALETTE.length;
    }

    let spokenIdx = Math.floor(Math.random() * COLOR_PALETTE.length);
    if (spokenIdx === inkIdx) {
      spokenIdx = (spokenIdx + 1) % COLOR_PALETTE.length;
    }

    let displayString = lang === 'en' ? COLOR_PALETTE[textIdx].nameEn : COLOR_PALETTE[textIdx].nameVi;
    let spatialPos: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | undefined = undefined;

    if (isDirectionalStroop) {
      // Pick direction word & conflicting spatial position
      const wordDir = DIRECTION_OPTIONS[Math.floor(Math.random() * DIRECTION_OPTIONS.length)];
      let posDir = DIRECTION_OPTIONS[Math.floor(Math.random() * DIRECTION_OPTIONS.length)];
      if (Math.random() < 0.8 && posDir.id === wordDir.id) {
        posDir = DIRECTION_OPTIONS[(DIRECTION_OPTIONS.indexOf(wordDir) + 1) % DIRECTION_OPTIONS.length];
      }
      displayString = lang === 'en' ? wordDir.en : wordDir.label;
      spatialPos = posDir.id as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    } else if (isEmotionStroop) {
      displayString = EMOTION_WORDS[textIdx % EMOTION_WORDS.length].text;
    }

    const motionOffset = isMotionStroop ? {
      x: Math.round((Math.random() - 0.5) * 90),
      y: Math.round((Math.random() - 0.5) * 60)
    } : undefined;

    const item = {
      text: displayString,
      inkColor: COLOR_PALETTE[inkIdx],
      borderColor: COLOR_PALETTE[borderIdx],
      spokenColor: COLOR_PALETTE[spokenIdx],
      isExclusionTarget: isExclusionStroop,
      displayLang: lang,
      spatialPos,
      motionOffset
    };

    setWordItem(item);
    setTrialIndex(index);
    setTrialStartTime(Date.now());
    setFlashFeedback(null);

    // Audio Stroop speech synthesis
    if (isAudioStroop) {
      speakWord(COLOR_PALETTE[spokenIdx].nameEn, 'en', 1.1);
    }
  }, [totalTrials, isEnglishStroop, isEmotionStroop, isAudioStroop, isBilingualStroop, isExclusionStroop, isDirectionalStroop, isMotionStroop, effectiveLevel]);

  useEffect(() => {
    nextTrial(0);
  }, [nextTrial]);

  // Timeout monitor
  useEffect(() => {
    if (isFinished || !wordItem) return;

    const timer = setTimeout(() => {
      playSound('wrong');
      setCombo(0);
      setFlashFeedback('TIMEOUT');

      const expectedColor = currentTargetType === 'TEXT'
        ? COLOR_PALETTE.find(c => c.nameEn === wordItem.text || c.nameVi === wordItem.text) || wordItem.inkColor
        : currentTargetType === 'BORDER' && wordItem.borderColor
        ? wordItem.borderColor
        : wordItem.inkColor;

      emitTrialEvent({
        exerciseSlug: 'stroop-clash',
        level: effectiveLevel,
        relationId: 'INHIBITION',
        relationWeight: 1.0,
        entities: {
          text: wordItem.text,
          ink: wordItem.inkColor.id,
          border: wordItem.borderColor?.id,
          expected: expectedColor.id,
          choice: 'TIMEOUT'
        },
        stateBefore: `combo:${combo}`,
        stateAfter: 'combo:0',
        responseMs: reactionWindowMs,
        correct: false
      });

      setTimeout(() => {
        nextTrial(trialIndex + 1);
      }, 700);
    }, reactionWindowMs);

    return () => clearTimeout(timer);
  }, [trialStartTime, isFinished, wordItem, reactionWindowMs, trialIndex, currentTargetType, combo, effectiveLevel]);

  const handleSelectDirection = (dirId: string) => {
    if (isFinished || !wordItem || flashFeedback) return;
    const reactionTime = Date.now() - trialStartTime;
    let isCorrect = false;

    if (currentTargetType === 'DIRECTION_POS') {
      isCorrect = dirId === wordItem.spatialPos;
    } else {
      // DIRECTION_WORD
      const matchedDir = DIRECTION_OPTIONS.find(d => d.label === wordItem.text || d.en === wordItem.text);
      isCorrect = matchedDir ? dirId === matchedDir.id : false;
    }

    setReactionTimes(prev => [...prev, reactionTime]);

    emitTrialEvent({
      exerciseSlug: 'stroop-clash',
      level: effectiveLevel,
      relationId: 'SPATIAL_TRANSFORM',
      relationWeight: 1.0,
      entities: {
        text: wordItem.text,
        spatialPos: wordItem.spatialPos,
        rule: currentTargetType,
        choice: dirId
      },
      stateBefore: `combo:${combo}`,
      stateAfter: isCorrect ? `combo:${combo + 1}` : 'combo:0',
      responseMs: reactionTime,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setCorrectCount(c => c + 1);
      const speedBonus = Math.max(0, Math.floor((reactionWindowMs - reactionTime) / 10));
      const addedScore = 140 + (nextCombo * 25) + speedBonus + (effectiveLevel * 15);
      setScore(s => s + addedScore);
      setFlashFeedback('CORRECT');
    } else {
      playSound('wrong');
      setCombo(0);
      setFlashFeedback('WRONG');
    }

    setTimeout(() => {
      nextTrial(trialIndex + 1);
    }, 450);
  };

  useEffect(() => {
    if (!isDirectionalStroop || isFinished || !wordItem || flashFeedback) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSelectDirection('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleSelectDirection('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSelectDirection('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSelectDirection('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirectionalStroop, isFinished, wordItem, flashFeedback, currentTargetType, trialIndex]);

  const handleSelectColor = (selectedColor: ColorDef) => {
    if (isFinished || !wordItem || flashFeedback) return;

    const reactionTime = Date.now() - trialStartTime;
    let isCorrect = false;

    if (currentTargetType === 'EXCLUSION') {
      // Correct if selected color is NEITHER the written color word nor the ink color
      const matchingWordColor = COLOR_PALETTE.find(c => c.nameEn === wordItem.text || c.nameVi === wordItem.text);
      const isWordMatch = matchingWordColor && selectedColor.id === matchingWordColor.id;
      const isInkMatch = selectedColor.id === wordItem.inkColor.id;
      isCorrect = !isWordMatch && !isInkMatch;
    } else if (currentTargetType === 'TEXT') {
      const matchingWordColor = COLOR_PALETTE.find(c => c.nameEn === wordItem.text || c.nameVi === wordItem.text);
      isCorrect = matchingWordColor ? selectedColor.id === matchingWordColor.id : false;
    } else if (currentTargetType === 'BORDER' && wordItem.borderColor) {
      isCorrect = selectedColor.id === wordItem.borderColor.id;
    } else {
      isCorrect = selectedColor.id === wordItem.inkColor.id;
    }

    setReactionTimes(prev => [...prev, reactionTime]);

    emitTrialEvent({
      exerciseSlug: 'stroop-clash',
      level: effectiveLevel,
      relationId: 'INHIBITION',
      relationWeight: 1.0,
      entities: {
        text: wordItem.text,
        ink: wordItem.inkColor.id,
        border: wordItem.borderColor?.id,
        rule: currentTargetType,
        choice: selectedColor.id
      },
      stateBefore: `combo:${combo}`,
      stateAfter: isCorrect ? `combo:${combo + 1}` : 'combo:0',
      responseMs: reactionTime,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setCorrectCount(c => c + 1);
      const speedBonus = Math.max(0, Math.floor((reactionWindowMs - reactionTime) / 10));
      const addedScore = 120 + (nextCombo * 25) + speedBonus + (effectiveLevel * 15);
      setScore(s => s + addedScore);
      setFlashFeedback('CORRECT');
    } else {
      playSound('wrong');
      setCombo(0);
      setFlashFeedback('WRONG');
    }

    setTimeout(() => {
      nextTrial(trialIndex + 1);
    }, 450);
  };

  const accuracyRate = trialIndex > 0 ? Math.round((correctCount / trialIndex) * 100) : 100;
  const avgReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
    : 0;

  // Use English names on buttons if English/Bilingual mode is active
  const useEnButtons = isEnglishStroop || (wordItem?.displayLang === 'en');

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số</span>
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(effectiveLevel)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {score}
            {combo > 1 && <span className="text-xs text-amber-500 ml-1.5 font-bold">x{combo}</span>}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Vòng đấu</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {trialIndex + 1} / {totalTrials}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tốc độ TB</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 mt-0.5 font-mono">
            {avgReactionTime}ms
          </div>
        </div>
      </div>

      {/* Dynamic Rule Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
            QUY TẮC HIỆN TẠI:
          </span>
        </div>
        <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-xl shadow-sm uppercase ${
          currentTargetType === 'DIRECTION_POS'
            ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse'
            : currentTargetType === 'DIRECTION_WORD'
            ? 'bg-cyan-600 text-white font-extrabold'
            : currentTargetType === 'EXCLUSION'
            ? 'bg-rose-500 text-white animate-pulse'
            : currentTargetType === 'TEXT'
            ? 'bg-blue-600 text-white'
            : currentTargetType === 'BORDER'
            ? 'bg-purple-600 text-white'
            : 'bg-emerald-600 text-white'
        }`}>
          {currentTargetType === 'DIRECTION_POS'
            ? 'CHỌN THEO VỊ TRÍ KHÔNG GIAN (NƠI CHỮ XUẤT HIỆN)'
            : currentTargetType === 'DIRECTION_WORD'
            ? 'CHỌN THEO Ý NGHĨA CHỮ (TỪ VIẾT LÀ GÌ)'
            : currentTargetType === 'EXCLUSION'
            ? 'CHỌN MÀU NGOẠI TRỪ (KHÔNG PHẢI CHỮ & MỰC)'
            : currentTargetType === 'TEXT'
            ? 'CHỌN THEO Ý NGHĨA CHỮ'
            : currentTargetType === 'BORDER'
            ? 'CHỌN THEO MÀU VIỀN KHUNG'
            : 'CHỌN THEO MÀU MỰC IN'}
        </span>
      </div>

      {/* Auditory Conflict Indicator (Level 15: ∞-III) */}
      {isAudioStroop && (
        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 flex items-center justify-center gap-2 text-xs font-black text-purple-700 dark:text-purple-300 animate-pulse">
          <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>BỎ QUA GIỌNG NÓI PHÁT RA — CHỈ CHỌN THEO MÀU MỰC TRÊN MÀN HÌNH!</span>
        </div>
      )}

      {/* Main Stimulus Card */}
      {wordItem && (
        <div 
          className={`h-52 sm:h-60 rounded-3xl flex flex-col items-center justify-center relative shadow-xl transition-all duration-300 select-none overflow-hidden ${
            wordItem.borderColor ? `border-8 ${wordItem.borderColor.twBorder}` : 'border-4 border-slate-200 dark:border-slate-700'
          } ${
            flashFeedback === 'CORRECT' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-4 ring-emerald-500' 
              : flashFeedback === 'WRONG' || flashFeedback === 'TIMEOUT'
              ? 'bg-rose-50 dark:bg-rose-950/40 ring-4 ring-rose-500'
              : 'bg-white dark:bg-slate-900'
          }`}
        >
          {/* Reaction Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              key={trialIndex}
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 animate-[linear_shrink]"
              style={{
                animationDuration: `${reactionWindowMs}ms`,
                animationFillMode: 'forwards',
                animationTimingFunction: 'linear'
              }}
            />
          </div>

          {/* Central Conflict Word (With Spatial Placement or Floating Motion) */}
          <div
            className={`transition-all duration-300 ${
              isDirectionalStroop && wordItem.spatialPos === 'UP'
                ? 'absolute top-4 left-1/2 -translate-x-1/2'
                : isDirectionalStroop && wordItem.spatialPos === 'DOWN'
                ? 'absolute bottom-4 left-1/2 -translate-x-1/2'
                : isDirectionalStroop && wordItem.spatialPos === 'LEFT'
                ? 'absolute left-8 top-1/2 -translate-y-1/2'
                : isDirectionalStroop && wordItem.spatialPos === 'RIGHT'
                ? 'absolute right-8 top-1/2 -translate-y-1/2'
                : 'flex flex-col items-center justify-center'
            }`}
            style={isMotionStroop && wordItem.motionOffset ? {
              transform: `translate(${wordItem.motionOffset.x}px, ${wordItem.motionOffset.y}px)`,
              transition: 'transform 0.5s ease-out'
            } : undefined}
          >
            <span 
              className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-wider ${wordItem.inkColor.twText} ${
                isMotionStroop ? 'animate-bounce' : ''
              }`}
            >
              {wordItem.text}
            </span>
          </div>

          {flashFeedback && (
            <div className={`text-xs font-black px-3 py-1 rounded-full mt-3 uppercase tracking-widest absolute bottom-3 ${
              flashFeedback === 'CORRECT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {flashFeedback === 'CORRECT' ? 'CHÍNH XÁC +1' : flashFeedback === 'TIMEOUT' ? 'HẾT THỜI GIAN!' : 'BỊ LỪA RỒI!'}
            </div>
          )}
        </div>
      )}

      {/* Answer Buttons Grid: Direction Buttons (Level 21) or Color Buttons */}
      {isDirectionalStroop ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
          {DIRECTION_OPTIONS.map((dir) => (
            <button
              key={dir.id}
              onClick={() => handleSelectDirection(dir.id)}
              className="h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-2 border-amber-300 hover:scale-105 transition-all btn-press shadow-md"
            >
              <span className="text-xl sm:text-2xl font-black">
                {dir.id === 'UP' ? '↑' : dir.id === 'DOWN' ? '↓' : dir.id === 'LEFT' ? '←' : '→'}
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wider">
                {dir.label} ({dir.en})
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color.id}
              onClick={() => handleSelectColor(color)}
              className="h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all btn-press shadow-sm hover:shadow-md group"
            >
              <div className={`w-5 h-5 rounded-full ${color.twBg} shadow-sm group-hover:scale-110 transition-transform`} />
              <span className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-200 tracking-tight uppercase">
                {useEnButtons ? color.nameEn : color.nameVi}
              </span>
            </button>
          ))}
        </div>
      )}

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={Math.round((reactionTimes.reduce((a, b) => a + b, 0)) / 1000)}
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
