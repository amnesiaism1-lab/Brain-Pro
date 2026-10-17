import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';
import { 
  numberToEnglish, 
  numberToRoman, 
  speakWord,
  generateWordProblem,
  generateFractionProblem,
  generateAlgebraParityProblem
} from '../../services/infinityApiService';
import { INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { Infinity as InfinityIcon, Sparkles, Zap, Volume2, Eye, Ear } from 'lucide-react';

export const EvenOddGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastAnsTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('even-odd') || currentLevel;

  const isInfinity = effectiveLevel >= 13;
  const infinityTier = getInfinityTier(effectiveLevel);

  // Standard modes
  const isEquationMode = effectiveLevel >= 10 && effectiveLevel <= 12;

  // Infinity modes
  const isEnglishWords = effectiveLevel === 13;
  const isNegativeMode = effectiveLevel === 14;
  const isTripleRule = effectiveLevel === 15; // Even, Odd, Divisible by 3
  const isFractionMode = effectiveLevel === 16;
  const isWordProblem = effectiveLevel === 17;
  const isSpeedStorm = effectiveLevel === 18;
  const isColorInversion = effectiveLevel === 19;
  const isRomanMode = effectiveLevel === 20;
  const isDualStreamAudio = effectiveLevel === 21;
  const isAlgebraStream = effectiveLevel === 22;

  const [currentNumber, setCurrentNumber] = useState(14);
  const [displayText, setDisplayText] = useState<string>('14');
  const [displayEquation, setDisplayEquation] = useState<string | null>(null);
  const [dualStreamFocus, setDualStreamFocus] = useState<'EYE' | 'EAR'>('EYE');
  const [isInverted, setIsInverted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(isSpeedStorm ? 20 : 35);
  const [isFinished, setIsFinished] = useState(false);
  const [answersCount, setAnswersCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSpamWarning, setIsSpamWarning] = useState(false);

  const nextNumber = () => {
    let num = Math.floor(Math.random() * 899) + 10;
    let label = String(num);

    if (isEnglishWords) {
      num = Math.floor(Math.random() * 90) + 10;
      label = numberToEnglish(num);
    } else if (isNegativeMode) {
      const isNeg = Math.random() < 0.6;
      num = (Math.floor(Math.random() * 90) + 10) * (isNeg ? -1 : 1);
      label = String(num);
    } else if (isTripleRule) {
      num = Math.floor(Math.random() * 90) + 10;
      label = String(num);
    } else if (isFractionMode) {
      const frac = generateFractionProblem();
      num = frac.answer;
      label = frac.text;
    } else if (isWordProblem) {
      const prob = generateWordProblem();
      num = prob.answer;
      label = prob.text;
    } else if (isRomanMode) {
      num = Math.floor(Math.random() * 60) + 1;
      label = numberToRoman(num); // Pure Roman numeral, NO spoilers
    } else if (isDualStreamAudio) {
      const visNum = Math.floor(Math.random() * 80) + 10;
      const audNum = Math.floor(Math.random() * 80) + 10;
      const focus: 'EYE' | 'EAR' = Math.random() < 0.5 ? 'EYE' : 'EAR';
      setDualStreamFocus(focus);
      num = focus === 'EYE' ? visNum : audNum;
      label = String(visNum);
      speakWord(String(audNum), 'en', 1.0);
    } else if (isAlgebraStream) {
      const alg = generateAlgebraParityProblem();
      num = alg.answer;
      label = alg.text;
    } else if (isEquationMode) {
      const a = Math.floor(Math.random() * 40) + 11;
      const b = Math.floor(Math.random() * 40) + 11;
      num = a + b;
      label = `${a} + ${b}`;
      setDisplayEquation(`${a} + ${b}`);
    } else {
      setDisplayEquation(null);
    }

    // Parity Inversion rule
    let invert = false;
    if (isColorInversion) {
      invert = Math.random() < 0.5;
    } else if (effectiveLevel >= 4 && !isDualStreamAudio && !isAlgebraStream) {
      invert = Math.random() < 0.35;
    }

    setCurrentNumber(num);
    setDisplayText(label);
    setIsInverted(invert);
  };

  useEffect(() => {
    nextNumber();
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
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (isFinished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || key === 'a' || e.key === '1') {
        e.preventDefault();
        handleAnswer('EVEN');
      } else if (e.key === 'ArrowRight' || key === 'd' || e.key === '2') {
        e.preventDefault();
        handleAnswer('ODD');
      } else if (isTripleRule && (e.key === 'ArrowDown' || key === 'w' || key === 's' || e.key === '3' || e.key === ' ')) {
        e.preventDefault();
        handleAnswer('DIV3');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, currentNumber, displayText, isInverted, isTripleRule]);

  const handleAnswer = (choice: 'EVEN' | 'ODD' | 'DIV3') => {
    if (isFinished) return;

    const now = Date.now();
    const timeSinceLast = now - lastAnsTimeRef.current;

    // Anti-spam detection: Human biological visual-motor reflex minimum is ~160ms.
    // Answering in <150ms on binary trials triggers anti-spam penalty and 400ms debounce.
    if (timeSinceLast < 150 && answersCount > 0) {
      setIsSpamWarning(true);
      playSound('wrong');
      setScore(s => Math.max(0, s - 30));
      setCombo(0);
      lastAnsTimeRef.current = now + 400;
      setTimeout(() => setIsSpamWarning(false), 1400);
      return;
    }

    setAnswersCount(c => c + 1);

    const absNum = Math.abs(currentNumber);
    let expected: 'EVEN' | 'ODD' | 'DIV3';

    if (isTripleRule && absNum % 3 === 0) {
      expected = 'DIV3';
    } else {
      const isNumEven = absNum % 2 === 0;
      expected = isNumEven ? 'EVEN' : 'ODD';
      if (isInverted) {
        expected = expected === 'EVEN' ? 'ODD' : 'EVEN';
      }
    }

    const isCorrect = choice === expected;
    const respMs = Math.min(10000, Math.max(50, now - lastAnsTimeRef.current));
    lastAnsTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'even-odd',
      level: effectiveLevel,
      relationId: isInverted ? 'INHIBITION' : 'RULE_ACTION',
      relationWeight: 1.0,
      entities: {
        number: String(currentNumber),
        display: displayText,
        inverted: isInverted,
        choice,
        expected
      },
      stateBefore: `combo:${combo}`,
      stateAfter: isCorrect ? `combo:${combo + 1}` : 'combo:0',
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      setCorrectCount(c => c + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setScore(s => s + (25 * effectiveLevel) + (nextCombo * 8));

      // Speed Storm bonus timer
      if (isSpeedStorm) {
        setTimeLeft(t => Math.min(45, t + 1));
      }
    } else {
      playSound('wrong');
      setCombo(0);
      // Speed Storm penalty timer
      if (isSpeedStorm) {
        setTimeLeft(t => Math.max(1, t - 2));
      }
    }

    nextNumber();
  };

  const accuracy = answersCount > 0 ? Math.round((correctCount / answersCount) * 100) : 100;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
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
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Đã trả lời</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {correctCount} / {answersCount}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Parity Inversion Warning Banner */}
      {isInverted && (
        <div className="p-3 rounded-2xl bg-rose-500 text-white text-center font-black text-xs sm:text-sm shadow-md animate-pulse">
          ⚠️ QUY TẮC ĐẢO NGƯỢC: CHẴN BẤM LẺ — LẺ BẤM CHẴN!
        </div>
      )}

      {/* Dual Stream Audio Focus Banner */}
      {isDualStreamAudio && (
        <div className={`p-3 rounded-2xl flex items-center justify-center gap-3 text-sm font-black shadow-md transition-all ${
          dualStreamFocus === 'EYE'
            ? 'bg-blue-600 text-white animate-bounce'
            : 'bg-amber-500 text-white animate-bounce'
        }`}>
          {dualStreamFocus === 'EYE' ? (
            <>
              <Eye className="w-5 h-5" />
              <span>TIÊU ĐIỂM MẮT (EYE FOCUS): ĐÁNH GIÁ SỐ HIỂN THỊ TRÊN MÀN HÌNH!</span>
            </>
          ) : (
            <>
              <Ear className="w-5 h-5" />
              <span>TIÊU ĐIỂM TAI (EAR FOCUS): ĐÁNH GIÁ SỐ PHÁT RA TỪ ÂM THANH!</span>
            </>
          )}
        </div>
      )}

      {/* Central Number Display Box */}
      <div className={`h-56 sm:h-64 rounded-3xl border-2 flex flex-col items-center justify-center p-6 text-center shadow-lg transition-all select-none ${
        isInverted 
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 ring-4 ring-rose-400/20' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
          {isEnglishWords 
            ? 'Từ Vựng Số Tiếng Anh' 
            : isRomanMode 
            ? 'Số La Mã Cổ Điển'
            : isWordProblem
            ? 'Toán Đố Tư Duy'
            : isFractionMode
            ? 'Phân Số Làm Tròn'
            : isDualStreamAudio
            ? (dualStreamFocus === 'EYE' ? '👁️ Đánh giá số trên màn hình' : '👂 Bỏ qua số màn hình, chú ý âm thanh')
            : isAlgebraStream
            ? 'Đại Số & Đa Thức Nhận Thức'
            : 'Xác Định Tính Chẵn / Lẻ'}
        </span>

        <span className={`font-black tracking-tight leading-none px-4 ${
          isEnglishWords 
            ? 'text-3xl sm:text-5xl text-purple-600 dark:text-purple-400' 
            : isAlgebraStream || isWordProblem
            ? 'text-2xl sm:text-4xl text-brand-600 dark:text-brand-300'
            : 'text-4xl sm:text-6xl text-slate-800 dark:text-white'
        }`}>
          {displayText}
        </span>
      </div>

      {/* Parity Logic Helper / Cheat Sheet Badge */}
      {isInfinity && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-200">Mẹo nhẩm Parity:</span>
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-mono">Chẵn ± Chẵn = Chẵn</span>
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-mono">Lẻ ± Lẻ = Chẵn</span>
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-mono">Lẻ × Lẻ = Lẻ</span>
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-mono">Lẻ ± Chẵn = Lẻ</span>
        </div>
      )}

      {/* Anti-spam Rapid Click Alert */}
      {isSpamWarning && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-800 dark:text-amber-200 text-center font-bold text-xs sm:text-sm shadow-md animate-shake">
          ⚡ Phát hiện phản hồi quá nhanh (&lt;150ms)! Hãy quan sát và đánh giá logic cẩn thận để tránh mất độ chính xác.
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className={`grid ${isTripleRule ? 'grid-cols-3' : 'grid-cols-2'} gap-3 sm:gap-4`}>
        <button
          onClick={() => handleAnswer('EVEN')}
          className="h-20 sm:h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center transition-all btn-press relative group"
        >
          <span className="flex items-center gap-1.5">
            CHẴN
            <span className="text-[10px] tracking-normal font-mono px-1.5 py-0.5 rounded bg-black/25 text-emerald-100 hidden sm:inline-block">← / A / 1</span>
          </span>
          <span className="text-[10px] sm:text-xs opacity-75 font-semibold">Even Number</span>
        </button>

        <button
          onClick={() => handleAnswer('ODD')}
          className="h-20 sm:h-24 rounded-3xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-lg shadow-brand-600/30 flex flex-col items-center justify-center transition-all btn-press relative group"
        >
          <span className="flex items-center gap-1.5">
            LẺ
            <span className="text-[10px] tracking-normal font-mono px-1.5 py-0.5 rounded bg-black/25 text-blue-100 hidden sm:inline-block">→ / D / 2</span>
          </span>
          <span className="text-[10px] sm:text-xs opacity-75 font-semibold">Odd Number</span>
        </button>

        {isTripleRule && (
          <button
            onClick={() => handleAnswer('DIV3')}
            className="h-20 sm:h-24 rounded-3xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-lg sm:text-xl shadow-lg shadow-purple-600/30 flex flex-col items-center justify-center transition-all btn-press relative group"
          >
            <span className="flex items-center gap-1.5">
              CHIA 3
              <span className="text-[10px] tracking-normal font-mono px-1.5 py-0.5 rounded bg-black/25 text-purple-100 hidden sm:inline-block">↓ / 3 / Space</span>
            </span>
            <span className="text-[10px] sm:text-xs opacity-75 font-semibold">Divisible by 3</span>
          </button>
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={isSpeedStorm ? 20 - timeLeft : 35 - timeLeft}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScore(0);
            setCombo(0);
            setAnswersCount(0);
            setCorrectCount(0);
            setTimeLeft(isSpeedStorm ? 20 : 35);
            setIsFinished(false);
            nextNumber();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
