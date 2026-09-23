import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { Delete } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { speakWord } from '../../services/infinityApiService';

const SHORT_WORDS = ['CAT', 'SUN', 'SKY', 'MAP', 'SEA', 'STAR', 'MOON', 'PEN', 'TREE', 'BIRD'];

export const DigitSpanGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const recallStartTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('digit-span') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  const isLetterMode = effectiveLevel === 13;
  const isWordMode = effectiveLevel === 14;
  const isSuppression = effectiveLevel === 15;
  const isMixedMode = effectiveLevel === 16;
  const isAudioSpan = effectiveLevel === 17;
  const isReverseAlphanumeric = effectiveLevel === 19;
  const isRsvpMode = effectiveLevel === 20 || effectiveLevel === 22;
  const isReverseSpan = (effectiveLevel >= 8 && effectiveLevel !== 13 && effectiveLevel !== 14 && effectiveLevel !== 16 && effectiveLevel !== 17) || isReverseAlphanumeric;
  
  const digitCount = isInfinity 
    ? (isLetterMode ? 6 : isWordMode ? 4 : isMixedMode ? 6 : isAudioSpan ? 5 : isReverseAlphanumeric ? 6 : isRsvpMode ? 8 : Math.min(12, 6 + (effectiveLevel - 13))) 
    : Math.min(12, 3 + effectiveLevel);
  
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const generateSequence = (len: number) => {
    if (isWordMode) {
      const shuffled = [...SHORT_WORDS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, len).join(' ');
    }
    let str = '';
    for (let i = 0; i < len; i++) {
      if (isLetterMode) {
        str += LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } else if (isMixedMode || isReverseAlphanumeric) {
        str += (i % 2 === 0) ? Math.floor(Math.random() * 10).toString() : LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } else {
        str += Math.floor(Math.random() * 10).toString();
      }
    }
    return str;
  };

  const [digits, setDigits] = useState(() => generateSequence(digitCount));
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [rsvpIndex, setRsvpIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState('');
  const [round, setRound] = useState(1);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const maxRounds = 3;

  useEffect(() => {
    const seq = generateSequence(digitCount);
    setDigits(seq);
    setPhase('memorize');
    setUserInput('');
    setRsvpIndex(0);

    // Audio span dictation
    if (isAudioSpan) {
      const spacedDigits = seq.split('').join(' ... ');
      setTimeout(() => {
        speakWord(spacedDigits, 'en', 0.9);
      }, 300);
    }

    const flashDuration = isRsvpMode 
      ? (seq.length * 350) + 600
      : isAudioSpan 
      ? (seq.length * 1000) + 800
      : 1000 + (digitCount * (isInfinity ? 350 : 300));

    const timer = setTimeout(() => {
      setPhase('recall');
      recallStartTimeRef.current = Date.now();
    }, flashDuration);

    return () => clearTimeout(timer);
  }, [round, effectiveLevel, digitCount]);

  // RSVP animation tick
  useEffect(() => {
    if (phase !== 'memorize' || !isRsvpMode) return;
    const interval = setInterval(() => {
      setRsvpIndex(i => (i + 1 < digits.length ? i + 1 : i));
    }, 320);
    return () => clearInterval(interval);
  }, [phase, isRsvpMode, digits]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInput = (char: string) => {
    if (phase !== 'recall') return;
    playSound('click');
    if (userInput.length < digits.length) {
      const nextInput = userInput + char;
      setUserInput(nextInput);

      if (nextInput.length === digits.length) {
        const expected = isReverseSpan ? digits.split('').reverse().join('') : digits;
        const isCorrect = nextInput === expected;
        const responseMs = Math.min(10000, Math.max(100, Date.now() - recallStartTimeRef.current));

        emitTrialEvent({
          exerciseSlug: 'digit-span',
          level: effectiveLevel,
          relationId: 'ORDER_SEQUENCE',
          relationWeight: isReverseSpan ? 1.0 : 0.8,
          entities: {
            target: expected,
            rule: isReverseSpan ? 'reverse' : 'forward'
          },
          stateBefore: 'recalling',
          stateAfter: isCorrect ? 'sequence_matched' : 'sequence_mismatch',
          responseMs,
          correct: isCorrect
        });

        if (isCorrect) {
          playSound('correct');
          setCorrectCount(c => c + 1);
        } else {
          playSound('wrong');
        }

        setTimeout(() => {
          if (round >= maxRounds) {
            setIsFinished(true);
          } else {
            setRound(r => r + 1);
          }
        }, 500);
      }
    }
  };

  const handleNumpad = (num: number) => {
    handleInput(num.toString());
  };

  const handleDelete = () => {
    playSound('click');
    setUserInput(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'recall' || isFinished) return;
      if (isLetterMode || isMixedMode) {
        if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
          handleInput(e.key.toUpperCase());
        } else if (e.key === 'Backspace') {
          handleDelete();
        }
      } else {
        if (e.key >= '0' && e.key <= '9') {
          handleNumpad(parseInt(e.key, 10));
        } else if (e.key === 'Backspace') {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isFinished, userInput, digits, isLetterMode, isMixedMode]);

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = calculateGameScore({
    level: effectiveLevel,
    accuracyRate: accuracy,
    timeLimitSec: 45,
    timeSpentSec: elapsedSec
  });

  const spanLabel = isLetterMode ? 'chuỗi chữ cái' : isMixedMode ? 'chuỗi ký tự pha trộn' : 'dãy số';

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13 ? 'Letter Span (Trí nhớ ngắn hạn chuỗi ký tự Latin)' :
               effectiveLevel === 14 ? 'Word Span (Chuỗi từ vựng ngắn tiếng Anh CAT, SUN, SKY...)' :
               effectiveLevel === 15 ? 'Phonological Suppression (Chặn phát âm thầm: hãy nói LA-LA-LA)' :
               effectiveLevel === 16 ? 'Mixed Alphanumeric (Xen kẽ Số - Chữ phức hợp A7B2C9)' :
               effectiveLevel === 17 ? 'Audio Dictation Span (Nghe số qua giọng nói, không nhìn chữ)' :
               effectiveLevel === 18 ? 'Color Sequence Span (Chuỗi màu quy ước)' :
               effectiveLevel === 19 ? 'Reverse Alphanumeric (Đảo ngược chuỗi số và chữ phức hợp)' :
               effectiveLevel === 20 ? 'RSVP Rapid Serial Stream (Chớp từng ký tự 320ms)' :
               effectiveLevel === 21 ? 'Dual Channel Span (Đa kênh trí nhớ làm việc)' :
               'Adaptive Ceiling Stream (Dãy siêu tốc 8-12 ký tự)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Suppression Warning Banner */}
      {isSuppression && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-800 dark:text-amber-200 text-center font-black text-xs sm:text-sm animate-pulse">
          🗣️ PHƯƠNG PHÁP ỨC CHẾ ÂM VỊ: Hãy nói to liên tục "LA - LA - LA" trong khi nhớ số để chặn giọng đọc ngầm!
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Lượt kiểm tra</span>
          <div className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
            {round} / {maxRounds}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Độ dài chuỗi</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            {digitCount} {isLetterMode ? 'chữ cái' : isWordMode ? 'từ' : 'ký tự'} {isReverseSpan && <span className="text-rose-500 text-xs sm:text-sm ml-1 font-bold">(Đảo ngược)</span>}
          </div>
        </div>
      </div>

      {/* Center Digit Display / Recall Box */}
      <div className="h-56 sm:h-64 md:h-72 rounded-3xl bg-brand-600 dark:bg-brand-700 text-white flex flex-col items-center justify-center p-6 sm:p-8 shadow-2xl relative overflow-hidden border-2 border-brand-400">
        {phase === 'memorize' ? (
          <div className="space-y-2 text-center animate-pulse">
            {isAudioSpan ? (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
                  🎧 LẮNG NGHE CHUỖI SỐ QUA TAI NGHE / LOA
                </span>
                <div className="text-4xl sm:text-6xl font-mono font-black tracking-widest text-amber-300 flex items-center justify-center gap-3">
                  <span>🔊</span>
                  <span className="text-2xl sm:text-3xl text-white">ĐANG ĐỌC TỪNG SỐ...</span>
                </div>
              </>
            ) : isRsvpMode ? (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
                  ⚡ CHỚP TỪNG KÝ TỰ RSVP ({rsvpIndex + 1}/{digits.length})
                </span>
                <div className="text-6xl sm:text-8xl font-mono font-black text-amber-300">
                  {digits[rsvpIndex]}
                </div>
              </>
            ) : (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
                  {isReverseSpan ? `Ghi nhớ ${spanLabel} (Chuẩn bị gõ đảo ngược)` : `Ghi nhớ ${spanLabel}`}
                </span>
                <div className="text-4xl sm:text-6xl md:text-7xl font-mono font-black tracking-widest text-amber-300">
                  {digits}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-center w-full">
            <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
              {isReverseSpan ? `Nhập lại ${spanLabel} theo thứ tự đảo ngược` : `Nhập lại ${spanLabel}`}
            </span>
            <div className="text-3xl sm:text-5xl md:text-6xl font-mono font-black tracking-widest min-h-[56px] sm:min-h-[72px] bg-black/20 rounded-2xl sm:rounded-3xl flex items-center justify-center px-4">
              {userInput ? userInput : <span className="opacity-40">???</span>}
            </div>
          </div>
        )}
      </div>

      {/* Onscreen Numpad / Keyboard */}
      <div className="space-y-2">
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
          (Bấm trực tiếp bàn phím máy tính hoặc các phím bên dưới)
        </p>
        {isLetterMode ? (
          <div className="flex flex-wrap gap-2 max-w-lg mx-auto justify-center">
            {LETTERS.split('').map(char => (
              <button
                key={char}
                disabled={phase !== 'recall'}
                onClick={() => handleInput(char)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-base text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40"
              >
                {char}
              </button>
            ))}
            <button
              disabled={phase !== 'recall' || userInput.length === 0}
              onClick={handleDelete}
              className="w-14 h-10 sm:w-16 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                disabled={phase !== 'recall'}
                onClick={() => handleNumpad(n)}
                className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              disabled={phase !== 'recall'}
              onClick={() => handleNumpad(0)}
              className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              0
            </button>
            <button
              disabled={phase !== 'recall' || userInput.length === 0}
              onClick={handleDelete}
              className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40"
            >
              <Delete className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCorrectCount(0);
            setElapsedSec(0);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
