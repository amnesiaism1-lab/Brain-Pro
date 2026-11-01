import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { Search, BookOpen, Check, Target, Sparkles, RotateCcw, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';
import { shuffleArray } from '../../services/infinityApiService';

export const TextScanningGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound,
    isGamePaused,
    ladderSessionRounds 
  } = useAppStore();

  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('text-scanning');
  const { sessionConfig: resolvedConfig, isCustom } = useExerciseSessionConfig('text-scanning');

  const effectiveLevel = getExerciseLevel('text-scanning') || currentLevel || 1;
  const playedLevelRef = useRef<number>(effectiveLevel);

  useEffect(() => {
    playedLevelRef.current = effectiveLevel;
  }, [effectiveLevel]);

  const playedLevel = playedLevelRef.current;
  const isInfinity = playedLevel >= 13;

  const sessionIdRef = useRef<string>(`ts-${Date.now()}`);
  const lastScanTimeRef = useRef<number>(Date.now());

  // Rounds
  const totalRounds = useMemo(() => {
    if (isCustom && resolvedConfig.rounds && resolvedConfig.rounds > 0) {
      return resolvedConfig.rounds;
    }
    return ladderSessionRounds || 1;
  }, [isCustom, resolvedConfig.rounds, ladderSessionRounds]);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundResults, setRoundResults] = useState<Array<{ score: number; accuracy: number; timeSpentSec: number }>>([]);
  const [roundTransition, setRoundTransition] = useState<{ roundDone: number; isTimeout: boolean } | null>(null);

  const isCustomCountdown = Boolean(isCustom && resolvedConfig.timeLimitSec && resolvedConfig.timeLimitSec > 0);
  const customTimeLimit = isCustomCountdown ? (resolvedConfig.timeLimitSec || 45) : 0;

  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    const defaultTexts = SAMPLE_READING_TEXTS.filter(t => t.language === 'vi');
    return defaultTexts[0] || SAMPLE_READING_TEXTS[0];
  });

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const isMultiTarget = playedLevel >= 9;
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Frozen summary values
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);
  const [finalTimeSpentSec, setFinalTimeSpentSec] = useState<number>(0);

  // Pick target keywords from text
  const initTargets = useCallback((articleText: string) => {
    const candidates = readingContentService.extractKeywordsFromArticle(articleText, 4, 8, 20);
    const shuffled = shuffleArray(candidates);
    
    // Level scaling: 1 target for Level 1-8, 2-3 targets for Level 9-12, up to 4 for Infinity
    const targetCount = playedLevel >= 22 ? 6 : playedLevel >= 15 ? 4 : playedLevel >= 9 ? 3 : 1;
    const selectedTargets = shuffled.slice(0, targetCount);
    
    if (selectedTargets.length === 0) {
      const words = articleText.split(/\s+/).filter(w => w.length >= 4);
      setTargetWords([words[0] || 'thông tin']);
    } else {
      setTargetWords(selectedTargets);
    }
    setFoundWords([]);
    setFoundIndices([]);
    setElapsedSec(0);
    setMissCount(0);
  }, [playedLevel]);

  // Handle completing a round
  const completeRound = useCallback((timedOut = false) => {
    const totalClicks = foundWords.length + missCount;
    const roundAcc = timedOut
      ? (totalClicks > 0 ? Math.round((foundWords.length / totalClicks) * 100) : 0)
      : (totalClicks > 0 ? Math.round((foundWords.length / totalClicks) * 100) : 100);

    const roundScore = calculateGameScore({
      level: playedLevel,
      accuracyRate: roundAcc,
      timeLimitSec: isCustomCountdown ? customTimeLimit : 45,
      timeSpentSec: elapsedSec
    });

    const newResult = {
      score: roundScore,
      accuracy: roundAcc,
      timeSpentSec: elapsedSec
    };

    const nextAllResults = [...roundResults, newResult];
    setRoundResults(nextAllResults);

    if (currentRound < totalRounds) {
      setRoundTransition({ roundDone: currentRound, isTimeout: timedOut });
      playSound(timedOut ? 'wrong' : 'correct');
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
  }, [foundWords.length, missCount, playedLevel, isCustomCountdown, customTimeLimit, elapsedSec, roundResults, currentRound, totalRounds, playSound]);

  useEffect(() => {
    initTargets(currentArticle.content);
  }, [currentArticle, initTargets]);

  // Main timer loop
  useEffect(() => {
    if (isFinished || isGamePaused || Boolean(roundTransition)) return;

    const timer = setInterval(() => {
      setElapsedSec(s => {
        const nextSec = s + 1;
        if (isCustomCountdown && nextSec >= customTimeLimit) {
          clearInterval(timer);
          completeRound(true);
          return customTimeLimit;
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, roundTransition, isCustomCountdown, customTimeLimit, completeRound]);

  const advanceNextRound = () => {
    playSound('click');
    setRoundTransition(null);
    setCurrentRound(r => r + 1);
    initTargets(currentArticle.content);
  };

  const articleTokens = useMemo(() => {
    return currentArticle.content.split(/\s+/).filter(Boolean);
  }, [currentArticle.content]);

  const handleWordClick = (word: string, idx: number) => {
    if (isFinished || Boolean(roundTransition) || foundIndices.includes(idx)) return;

    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”—]/g, '').trim().toLowerCase();
    const matchedTarget = targetWords.find(t => {
      const cleanTarget = t.toLowerCase();
      return cleanWord.includes(cleanTarget) || cleanTarget.includes(cleanWord);
    });

    const isCorrect = Boolean(matchedTarget && !foundWords.includes(matchedTarget));
    const now = Date.now();
    const respMs = Math.min(20000, Math.max(100, now - lastScanTimeRef.current));
    lastScanTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'text-scanning',
      level: playedLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: { 
        target: matchedTarget || targetWords.join(', '), 
        clicked: cleanWord, 
        index: idx,
        isMultiTarget,
        articleTitle: currentArticle.title
      },
      stateBefore: `found:${foundWords.length}`,
      stateAfter: isCorrect ? `found:${foundWords.length + 1}` : `found:${foundWords.length}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect && matchedTarget) {
      playSound('correct');
      const nextFoundWords = [...foundWords, matchedTarget];
      const nextIndices = [...foundIndices, idx];
      setFoundWords(nextFoundWords);
      setFoundIndices(nextIndices);

      if (nextFoundWords.length >= targetWords.length) {
        completeRound(false);
      }
    } else {
      playSound('wrong');
      setMissCount(m => m + 1);

      // Track into Wrong Answer History
      trackWrongAnswer({
        round: currentRound,
        difficultyLevel: playedLevel,
        questionContext: {
          prompt: `Tìm từ khóa: ${targetWords.join(', ')}`,
          distractor: cleanWord,
          articleTitle: currentArticle.title
        },
        correctAnswer: {
          label: targetWords[0] || 'Từ mục tiêu',
          code: targetWords[0] || 'TARGET'
        },
        userAnswer: {
          label: cleanWord,
          code: cleanWord
        },
        responseTimeMs: respMs,
        sessionId: sessionIdRef.current,
        severity: 'minor'
      });
    }
  };

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
  };

  const handleRestart = () => {
    playSound('click');
    initTargets(currentArticle.content);
  };

  const displayTime = isCustomCountdown ? Math.max(0, customTimeLimit - elapsedSec) : elapsedSec;

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][playedLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {playedLevel === 13 ? 'English Technical Scanning (Quét từ khóa chuyên môn Anh ngữ)' :
               playedLevel === 14 ? 'Bilingual Scanning (Quét song ngữ Anh - Việt)' :
               playedLevel === 15 ? 'High Density Multi-Target (Quét 4 từ khóa đồng thời)' :
               playedLevel === 16 ? 'Live News Keyword Scan (Quét nhanh dòng sự kiện)' :
               playedLevel === 17 ? 'Speed Rush Scan (Quét tốc hành dưới 30s)' :
               playedLevel === 18 ? 'Semantic Concept Scan (Nhận diện khái niệm trừu tượng)' :
               playedLevel === 19 ? 'Noisy Camouflage Scan (Vượt lớp ngụy trang nhiễu)' :
               playedLevel === 20 ? 'Scientific Article Deep Scan (Khảo sát bài nghiên cứu)' :
               playedLevel === 21 ? 'Mirror Orientation Scan (Đảo góc định hướng)' :
               'Chaos Blitz Scanning (6 từ khóa đồng thời Vô cực)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold block">Tiến trình quét từ</span>
              {totalRounds > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  Lượt {currentRound}/{totalRounds}
                </span>
              )}
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">
              {foundWords.length} / {targetWords.length} từ
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Lỗi bấm nhầm: <strong className="text-rose-500">{missCount}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSourceModalOpen(true)}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Đổi bài đọc khác"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đổi bài</span>
          </button>

          <button
            onClick={handleRestart}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Tạo lại từ khóa mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Từ mới</span>
          </button>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">
              {isCustomCountdown ? 'Còn lại' : 'Thời gian'}
            </span>
            <div className={`text-xl sm:text-2xl font-black ${isCustomCountdown && displayTime <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
              {displayTime}s
            </div>
          </div>
        </div>
      </div>

      {/* Target Word Pill Box */}
      <div className="bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 dark:border-amber-700/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
          <Target className="w-4 h-4 text-amber-600" />
          <span>Mục tiêu quét (Nhấp vào từ này khi phát hiện trong đoạn văn):</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {targetWords.map((word, i) => {
            const isFound = foundWords.includes(word);
            return (
              <span
                key={i}
                className={`px-3.5 py-1.5 rounded-xl font-black text-sm sm:text-base flex items-center gap-1.5 transition-all ${
                  isFound
                    ? 'bg-emerald-500 text-white line-through shadow-sm scale-95 opacity-80'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-amber-400 shadow-sm'
                }`}
              >
                {isFound && <Check className="w-4 h-4 text-white stroke-[3]" />}
                <span>{word}</span>
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1">
          Kỹ thuật quét: Quét mắt hình chữ S hoặc Z từ trên xuống dưới. Bấm ngay khi bắt gặp từ mục tiêu.
        </p>
      </div>

      {/* Article Content Container */}
      <div className="bg-[#FAF7F2] dark:bg-slate-800/90 p-5 sm:p-8 rounded-3xl border-2 border-[#E5DECF] dark:border-slate-700 shadow-xl relative">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          {currentArticle.title}
        </h3>

        <div className="leading-relaxed sm:leading-loose text-base sm:text-lg text-slate-800 dark:text-slate-200 font-serif flex flex-wrap gap-x-1.5 gap-y-1">
          {articleTokens.map((token, idx) => {
            const isTargetMatched = foundIndices.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleWordClick(token, idx)}
                disabled={isTargetMatched || isFinished || Boolean(roundTransition)}
                className={`px-1 py-0.5 rounded-lg transition-all text-left inline-block ${
                  isTargetMatched
                    ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-400 scale-105'
                    : 'hover:bg-amber-200/70 dark:hover:bg-amber-900/40 active:scale-95 cursor-pointer'
                }`}
              >
                {token}
              </button>
            );
          })}
        </div>

        {/* Round Transition Overlay */}
        {roundTransition && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-4 text-white z-20 animate-fade-in p-6 text-center">
            {roundTransition.isTimeout ? (
              <>
                <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-full text-amber-400">
                  <Clock className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 uppercase">
                    Hết Thời Gian Lượt {roundTransition.roundDone}/{totalRounds}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Chưa quét kịp các từ mục tiêu!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    Đã hết thời gian quy định cho lượt này ({customTimeLimit}s). Lưu ý: thời gian được làm mới riêng cho mỗi lượt mới.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                <h3 className="text-xl sm:text-2xl font-black">
                  Hoàn thành Lượt {roundTransition.roundDone}/{totalRounds}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Đã tìm đủ {targetWords.length} từ khóa • Thời gian: {elapsedSec}s
                </p>
              </>
            )}
            <button
              onClick={advanceNextRound}
              className="mt-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>Vào Lượt {roundTransition.roundDone + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

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
            setIsFinished(false);
            playedLevelRef.current = getExerciseLevel('text-scanning');
            initTargets(currentArticle.content);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
