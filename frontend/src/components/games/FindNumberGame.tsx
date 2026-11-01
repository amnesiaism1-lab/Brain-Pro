import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { numberToRoman } from '../../services/infinityApiService';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const isPrime = (n: number): boolean => {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
};

const FIBONACCI_SET = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]);

export const FindNumberGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound,
    isGamePaused,
    ladderSessionRounds 
  } = useAppStore();

  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('find-number');
  const { sessionConfig: resolvedConfig, isCustom } = useExerciseSessionConfig('find-number');

  const effectiveLevel = getExerciseLevel('find-number') || currentLevel || 1;
  const playedLevelRef = useRef<number>(effectiveLevel);
  const playedLevel = playedLevelRef.current;
  const isInfinity = playedLevel >= 13;

  const sessionIdRef = useRef<string>(`fn-${Date.now()}`);
  const lastClickRef = useRef<number>(Date.now());

  // Rounds
  const totalRounds = useMemo(() => {
    if (isCustom && resolvedConfig.rounds && resolvedConfig.rounds > 0) {
      return resolvedConfig.rounds;
    }
    return ladderSessionRounds || 1;
  }, [isCustom, resolvedConfig.rounds, ladderSessionRounds]);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundResults, setRoundResults] = useState<Array<{ score: number; accuracy: number; timeSpentSec: number }>>([]);
  const [roundTransition, setRoundTransition] = useState<{ roundDone: number } | null>(null);

  const initialDuration = isCustom && resolvedConfig.timeLimitSec && resolvedConfig.timeLimitSec > 0
    ? resolvedConfig.timeLimitSec
    : (isInfinity ? 40 : 30);

  const gridSize = playedLevel >= 22 ? 8 : playedLevel >= 13 ? 7 : playedLevel <= 2 ? 4 : playedLevel <= 5 ? 5 : playedLevel <= 8 ? 6 : 7;
  const totalCells = gridSize * gridSize;

  const [numbers, setNumbers] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number>(9);
  const [foundCount, setFoundCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isFinished, setIsFinished] = useState(false);

  // Frozen summary values
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [finalTimeSpentSec, setFinalTimeSpentSec] = useState<number>(0);

  const isMathTarget = playedLevel >= 10 && playedLevel <= 12;
  const isRomanTarget = playedLevel === 13;
  const isPrimeTarget = playedLevel === 14;
  const isFibonacciTarget = playedLevel === 15;
  const isHexTarget = playedLevel === 16;
  const isEquationTarget = playedLevel === 17;
  const isBinaryTarget = playedLevel === 18;
  const isNegativeTarget = playedLevel === 19;
  const isSpeedSurge = playedLevel === 20;
  const isCompoundFilter = playedLevel === 21;

  const [mathConditionText, setMathConditionText] = useState<string>('Số chia hết cho 3');
  const [equationText, setEquationText] = useState<string>('');

  const generateBoard = useCallback(() => {
    const list: number[] = [];
    const maxVal = playedLevel <= 2 ? 20 : playedLevel <= 5 ? 50 : playedLevel <= 8 ? 99 : 150;
    
    if (isNegativeTarget) {
      for (let i = 0; i < totalCells; i++) {
        const val = (Math.floor(Math.random() * 80) + 1) * (Math.random() < 0.6 ? -1 : 1);
        list.push(val);
      }
      const negTarget = list.find(n => n < 0) || -15;
      setTargetNumber(negTarget);
    } else {
      for (let i = 0; i < totalCells; i++) {
        list.push(Math.floor(Math.random() * maxVal) + 1);
      }
    }
    
    if (isPrimeTarget) {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      list[0] = primes[Math.floor(Math.random() * primes.length)];
      list[1] = primes[Math.floor(Math.random() * primes.length)];
      list[2] = primes[Math.floor(Math.random() * primes.length)];
      setMathConditionText('Tìm số nguyên tố (Prime Number)');
      setTargetNumber(0);
    } else if (isFibonacciTarget) {
      const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      list[0] = fibs[Math.floor(Math.random() * fibs.length)];
      list[1] = fibs[Math.floor(Math.random() * fibs.length)];
      list[2] = fibs[Math.floor(Math.random() * fibs.length)];
      setMathConditionText('Tìm số thuộc dãy Fibonacci (1, 2, 3, 5, 8...)');
      setTargetNumber(0);
    } else if (isEquationTarget) {
      const a = Math.floor(Math.random() * 35) + 12;
      const b = Math.floor(Math.random() * 35) + 12;
      const ans = a + b;
      list[0] = ans;
      setEquationText(`${a} + ${b} = ?`);
      setTargetNumber(ans);
    } else if (isCompoundFilter) {
      const primesOver20 = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
      list[0] = primesOver20[Math.floor(Math.random() * primesOver20.length)];
      list[1] = primesOver20[Math.floor(Math.random() * primesOver20.length)];
      setMathConditionText('Tìm số NGUYÊN TỐ LỚN HƠN 20');
      setTargetNumber(0);
    } else if (isMathTarget) {
      const validNumbers = list.filter(n => n % 3 === 0);
      if (validNumbers.length < 3) {
        list[0] = 3 * (Math.floor(Math.random() * 20) + 1);
        list[1] = 3 * (Math.floor(Math.random() * 20) + 1);
        list[2] = 3 * (Math.floor(Math.random() * 20) + 1);
      }
      setMathConditionText('Tìm số chia hết cho 3');
      setTargetNumber(0);
    } else if (!isNegativeTarget) {
      const randTarget = list[Math.floor(Math.random() * list.length)];
      setTargetNumber(randTarget);
    }

    // Shuffle list
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setNumbers(list);
  }, [playedLevel, isNegativeTarget, isPrimeTarget, isFibonacciTarget, isEquationTarget, isCompoundFilter, isMathTarget, totalCells]);

  // Complete Round logic
  const completeRound = useCallback(() => {
    const totalClicks = foundCount + missCount;
    const roundAcc = totalClicks > 0 ? Math.round((foundCount / totalClicks) * 100) : 100;
    const timeSpent = initialDuration - timeLeft;

    const roundScore = calculateGameScore({
      level: playedLevel,
      accuracyRate: roundAcc,
      timeLimitSec: initialDuration,
      timeSpentSec: timeSpent,
      baseScore: foundCount * 25
    });

    const newResult = {
      score: roundScore,
      accuracy: roundAcc,
      timeSpentSec: timeSpent
    };

    const nextAllResults = [...roundResults, newResult];
    setRoundResults(nextAllResults);

    if (currentRound < totalRounds) {
      setRoundTransition({ roundDone: currentRound });
      playSound('correct');
    } else {
      const aggScore = nextAllResults.reduce((sum, r) => sum + r.score, 0);
      const aggAcc = Math.round(nextAllResults.reduce((sum, r) => sum + r.accuracy, 0) / nextAllResults.length);
      const aggTime = nextAllResults.reduce((sum, r) => sum + r.timeSpentSec, 0);

      setFinalScore(aggScore);
      setFinalAccuracy(aggAcc);
      setFinalTimeSpentSec(aggTime);
      setIsFinished(true);
      playSound('victory');
    }
  }, [foundCount, missCount, initialDuration, timeLeft, playedLevel, roundResults, currentRound, totalRounds, playSound]);

  // Initial generation
  useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  // Timer loop with pause handling
  useEffect(() => {
    if (isFinished || isGamePaused || Boolean(roundTransition)) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          completeRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, roundTransition, completeRound]);

  const advanceNextRound = () => {
    playSound('click');
    setRoundTransition(null);
    setCurrentRound(r => r + 1);
    setFoundCount(0);
    setMissCount(0);
    setTimeLeft(initialDuration);
    generateBoard();
  };

  const handleCellClick = (num: number) => {
    if (isFinished || Boolean(roundTransition)) return;
    let isCorrect = false;
    if (isPrimeTarget) {
      isCorrect = isPrime(num);
    } else if (isFibonacciTarget) {
      isCorrect = FIBONACCI_SET.has(num);
    } else if (isCompoundFilter) {
      isCorrect = isPrime(num) && num > 20;
    } else if (isMathTarget) {
      isCorrect = (num % 3 === 0);
    } else {
      isCorrect = (num === targetNumber);
    }

    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastClickRef.current));
    lastClickRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'find-number',
      level: playedLevel,
      relationId: (isMathTarget || isPrimeTarget || isFibonacciTarget) ? 'RULE_ACTION' : 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: isPrimeTarget ? 'prime' : isFibonacciTarget ? 'fibonacci' : isMathTarget ? 'div3' : String(targetNumber),
        distractor: String(num)
      },
      stateBefore: `found:${foundCount}`,
      stateAfter: isCorrect ? `found:${foundCount + 1}` : `found:${foundCount}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      setFoundCount(c => c + 1);
      if (isSpeedSurge) {
        setTimeLeft(t => Math.min(60, t + 2));
      }
      generateBoard();
    } else {
      playSound('wrong');
      setMissCount(m => m + 1);
      if (isSpeedSurge) {
        setTimeLeft(t => Math.max(1, t - 3));
      }

      // Track into Wrong Answer History
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: playedLevel,
        questionContext: {
          prompt: isPrimeTarget ? 'Tìm số nguyên tố' : isFibonacciTarget ? 'Tìm số Fibonacci' : isMathTarget ? 'Tìm số chia hết cho 3' : `Tìm số ${targetNumber}`,
          distractor: String(num),
          matrixSize: `${gridSize}x${gridSize}`
        },
        correctAnswer: {
          label: isPrimeTarget ? 'Số nguyên tố' : isFibonacciTarget ? 'Số Fibonacci' : isMathTarget ? 'Chia hết cho 3' : String(targetNumber),
          code: String(targetNumber)
        },
        userAnswer: {
          label: String(num),
          code: String(num)
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][playedLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {playedLevel === 13 ? 'Roman Numeral Hunt (Nhận diện số La Mã XIV, XLII...)' :
               playedLevel === 14 ? 'Prime Only (Quét và tìm số nguyên tố)' :
               playedLevel === 15 ? 'Fibonacci Hunt (Tìm chuỗi Fibonacci 1,2,3,5,8...)' :
               playedLevel === 16 ? 'Hexadecimal Target (Hệ số thập lục phân 0x..)' :
               playedLevel === 17 ? 'Mental Arithmetic Equation (Tính nhẩm phép toán)' :
               playedLevel === 18 ? 'Binary Decode (Giải mã số nhị phân)' :
               playedLevel === 19 ? 'Negative Integers Hunt (Ma trận số nguyên âm)' :
               playedLevel === 20 ? 'Speed Surge (+2s khi đúng, -3s khi sai)' :
               playedLevel === 21 ? 'Compound Filter (Số nguyên tố > 20)' :
               'Chaos Number (Lưới 8x8 Vô cực phản xạ siêu tốc)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-brand-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-brand-600/30 px-1 text-center">
            {isRomanTarget ? numberToRoman(targetNumber) :
             isPrimeTarget ? 'PRIME' :
             isFibonacciTarget ? 'FIBO' :
             isHexTarget ? `0x${targetNumber.toString(16).toUpperCase()}` :
             isEquationTarget ? equationText :
             isBinaryTarget ? targetNumber.toString(2) :
             isCompoundFilter ? 'P > 20' :
             isMathTarget ? '÷3' : targetNumber}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                {isRomanTarget ? 'Số La Mã (Tìm số tương ứng)' :
                 isHexTarget ? 'Thập lục phân (Tìm số thập phân)' :
                 isEquationTarget ? 'Tính kết quả phép toán' :
                 (isPrimeTarget || isFibonacciTarget || isMathTarget || isCompoundFilter) ? 'Quy tắc số học đích' : 
                 isBinaryTarget ? 'Số nhị phân (Tìm số thập phân)' :
                 isNegativeTarget ? 'Số nguyên âm mục tiêu' :
                 'Số mục tiêu cần tìm'}
              </span>
              {totalRounds > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  Lượt {currentRound}/{totalRounds}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              {(isMathTarget || isPrimeTarget || isFibonacciTarget || isCompoundFilter) ? (
                <strong className="text-indigo-600 dark:text-indigo-400">{mathConditionText}</strong>
              ) : (
                <>Đã tìm thấy: <strong className="text-brand-600 text-base sm:text-lg">{foundCount}</strong></>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Đúng: <strong className="text-emerald-600">{foundCount}</strong> • Sai: <strong className="text-rose-500">{missCount}</strong>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian còn lại</span>
          <div className={`text-2xl sm:text-3xl font-black ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-500'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Grid */}
      <div 
        className="grid gap-2 sm:gap-3 md:gap-4 bg-[#F5EFE6] dark:bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-700 shadow-2xl select-none aspect-square relative"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {numbers.map((num, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(num)}
            className="flex items-center justify-center font-black rounded-xl sm:rounded-2xl transition-all duration-100 btn-press text-slate-800 dark:text-white text-base sm:text-xl md:text-2xl lg:text-3xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 shadow-sm active:scale-95"
          >
            {num}
          </button>
        ))}

        {/* Round Transition Overlay */}
        {roundTransition && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-white z-20 animate-fade-in p-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
            <h3 className="text-xl sm:text-2xl font-black">
              Hoàn thành Lượt {roundTransition.roundDone}/{totalRounds}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Đã tìm: {foundCount} số • Lỗi sai: {missCount}
            </p>
            <button
              onClick={advanceNextRound}
              className="mt-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Vào Lượt {roundTransition.roundDone + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={finalScore}
          accuracyRate={finalAccuracy}
          timeSpentSec={finalTimeSpentSec}
          playedLevel={playedLevel}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setCurrentRound(1);
            setRoundResults([]);
            setRoundTransition(null);
            setFoundCount(0);
            setMissCount(0);
            setTimeLeft(initialDuration);
            setIsFinished(false);
            generateBoard();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
