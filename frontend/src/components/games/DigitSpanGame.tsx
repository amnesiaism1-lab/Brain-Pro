import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { GameResultModal } from './GameResultModal';
import {
  calculateGameScore,
  EXERCISES_METADATA,
  DigitSpanRecallRule
} from '@brain-exercises/shared';
import {
  Delete,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Layers,
  History,
  X,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { speakWord, cognitiveAudioEngine } from '../../services/infinityApiService';
import {
  analyzeSequenceDiff,
  computeExpectedSequence,
  formatChunkedSequence,
  SequenceDiffResult
} from '../../utils/memoryDiffAnalysis';

const SHORT_WORDS = ['CAT', 'SUN', 'SKY', 'MAP', 'SEA', 'STAR', 'MOON', 'PEN', 'TREE', 'BIRD'];
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const PITCH_NOTES: Record<string, 'C4' | 'D4' | 'E4' | 'G4' | 'A4'> = {
  '1': 'C4',
  '2': 'D4',
  '3': 'E4',
  '4': 'G4',
  '5': 'A4'
};

const PITCH_LABELS: Record<string, string> = {
  '1': 'Đô (C4)',
  '2': 'Rê (D4)',
  '3': 'Mi (E4)',
  '4': 'Sol (G4)',
  '5': 'La (A4)'
};

interface RoundHistoryEntry {
  round: number;
  rawStimulus: string;
  expected: string;
  userTyped: string;
  isCorrect: boolean;
  responseMs: number;
  diff: SequenceDiffResult;
}

const RULE_META: Record<
  DigitSpanRecallRule,
  { badgeVi: string; shortVi: string; promptVi: string; badgeClass: string }
> = {
  forward: {
    badgeVi: 'Xuôi chiều',
    shortVi: 'Giữ nguyên thứ tự',
    promptVi: 'Nhập lại chính xác theo thứ tự vừa thấy',
    badgeClass: 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700'
  },
  reverse: {
    badgeVi: '↺ Đảo ngược',
    shortVi: 'Từ cuối về đầu',
    promptVi: 'ĐẢO NGƯỢC toàn bộ chuỗi: nhập từ ký tự CUỐI CÙNG về ký tự đầu tiên',
    badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
  },
  'sort-asc': {
    badgeVi: '↑ Sắp xếp tăng dần',
    shortVi: 'Thứ tự 0 → 9',
    promptVi: 'SẮP XẾP TĂNG DẦN các chữ số (từ nhỏ đến lớn, giữ nguyên số lần lặp)',
    badgeClass: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
  },
  'plus-one': {
    badgeVi: '+1 Cộng nhẩm',
    shortVi: 'Mỗi số tăng 1 (9 → 0)',
    promptVi: 'CỘNG NHẨM +1 vào TỪNG chữ số (ví dụ: 4 → 5, 9 → 0) rồi nhập dãy kết quả',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
  }
};

export const DigitSpanGame: React.FC = () => {
  const {
    currentLevel: storeLevel,
    getExerciseLevel,
    setActiveGameSlug,
    playSound,
    isGamePaused,
    ladderSessionRounds
  } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('digit-span');
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('digit-span');

  const sessionIdRef = useRef<string>(`session-digit-${Date.now()}`);
  const recallStartTimeRef = useRef<number>(Date.now());
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const ladderLevel = getExerciseLevel('digit-span') || storeLevel || 1;
  const playedLevelRef = useRef<number>(isCustom ? 0 : ladderLevel);
  const effectiveLevel = isCustom ? 0 : playedLevelRef.current;
  const isInfinity = !isCustom && effectiveLevel >= 13;

  const customParams = (sessionConfig.params || {}) as {
    sequenceLength?: number;
    recallRule?: DigitSpanRecallRule;
    stimulusType?: 'digits' | 'letters' | 'alphanumeric' | 'audio';
    flashPerItemMs?: number;
    chunkingGuide?: boolean;
  };

  const levelMeta = useMemo(() => {
    const meta = EXERCISES_METADATA.find(e => e.slug === 'digit-span');
    return meta?.levelConfigs.find(c => c.level === effectiveLevel);
  }, [effectiveLevel]);

  const isLetterMode = isCustom
    ? customParams.stimulusType === 'letters'
    : effectiveLevel === 13;
  const isWordMode = !isCustom && effectiveLevel === 14;
  const isSuppression = !isCustom && effectiveLevel === 15;
  const isMixedMode = isCustom
    ? customParams.stimulusType === 'alphanumeric'
    : effectiveLevel === 12 || effectiveLevel === 16 || effectiveLevel === 19;
  const isAudioSpan = isCustom
    ? customParams.stimulusType === 'audio'
    : effectiveLevel === 17;
  const isReverseAlphanumeric = !isCustom && effectiveLevel === 19;
  const isRsvpMode = !isCustom && (effectiveLevel === 20 || effectiveLevel === 22);
  const isPitchSpan = !isCustom && effectiveLevel === 21;

  const recallRule: DigitSpanRecallRule = useMemo(() => {
    if (isCustom && customParams.recallRule) {
      return customParams.recallRule;
    }
    if (effectiveLevel === 8 || effectiveLevel === 9 || isReverseAlphanumeric) return 'reverse';
    if (effectiveLevel === 10) return 'sort-asc';
    if (effectiveLevel === 11) return 'plus-one';
    return 'forward';
  }, [isCustom, customParams.recallRule, effectiveLevel, isReverseAlphanumeric]);

  const isReverseSpan = recallRule === 'reverse';

  const digitCount = useMemo(() => {
    if (isCustom && typeof customParams.sequenceLength === 'number') {
      return Math.max(3, Math.min(14, customParams.sequenceLength));
    }
    if (isInfinity) {
      if (isLetterMode) return 6;
      if (isWordMode) return 4;
      if (isMixedMode) return 6;
      if (isAudioSpan || isPitchSpan) return 5;
      if (isReverseAlphanumeric) return 6;
      if (isRsvpMode) return 8;
      return Math.min(12, 6 + (effectiveLevel - 13));
    }
    if (levelMeta?.targetItemCount) {
      return levelMeta.targetItemCount;
    }
    return Math.min(12, 3 + effectiveLevel);
  }, [
    isCustom,
    customParams.sequenceLength,
    isInfinity,
    isLetterMode,
    isWordMode,
    isMixedMode,
    isAudioSpan,
    isPitchSpan,
    isReverseAlphanumeric,
    isRsvpMode,
    effectiveLevel,
    levelMeta
  ]);

  const maxRounds = useMemo(() => {
    if (sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    return Math.max(1, ladderSessionRounds || 6);
  }, [sessionConfig.rounds, ladderSessionRounds]);

  const generateSequence = useCallback(
    (len: number) => {
      if (isWordMode) {
        const shuffled = [...SHORT_WORDS].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, len).join(' ');
      }
      if (isPitchSpan) {
        const noteKeys = ['1', '2', '3', '4', '5'];
        let str = '';
        for (let i = 0; i < len; i++) {
          str += noteKeys[Math.floor(Math.random() * noteKeys.length)];
        }
        return str;
      }
      let str = '';
      for (let i = 0; i < len; i++) {
        if (isLetterMode) {
          str += LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } else if (isMixedMode || isReverseAlphanumeric) {
          str +=
            i % 2 === 0
              ? Math.floor(Math.random() * 10).toString()
              : LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } else {
          str += Math.floor(Math.random() * 10).toString();
        }
      }
      return str;
    },
    [isWordMode, isPitchSpan, isLetterMode, isMixedMode, isReverseAlphanumeric]
  );

  const [digits, setDigits] = useState(() => generateSequence(digitCount));
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [rsvpIndex, setRsvpIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState('');
  const [round, setRound] = useState(1);
  const [restartKey, setRestartKey] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [memorizeProgress, setMemorizeProgress] = useState(100);
  const [chunkingEnabled, setChunkingEnabled] = useState<boolean>(() => {
    if (isCustom && typeof customParams.chunkingGuide === 'boolean') {
      return customParams.chunkingGuide;
    }
    return true;
  });
  const [roundFeedback, setRoundFeedback] = useState<{
    isCorrect: boolean;
    rawStimulus: string;
    expected: string;
    userTyped: string;
    diff: SequenceDiffResult;
  } | null>(null);
  const [audioReplayUsed, setAudioReplayUsed] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<RoundHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const isAlphanumericMode = isLetterMode || isWordMode || isMixedMode || isReverseAlphanumeric;

  const clearPlaybackTimeouts = useCallback(() => {
    playbackTimeoutsRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      clearPlaybackTimeouts();
    };
  }, [clearPlaybackTimeouts]);

  const playAudioForSequence = useCallback(
    (seq: string) => {
      clearPlaybackTimeouts();
      if (isAudioSpan) {
        const spacedDigits = seq.split('').join(' ... ');
        speakWord(spacedDigits, 'en', 0.9);
      } else if (isPitchSpan) {
        seq.split('').forEach((char, idx) => {
          const t = setTimeout(() => {
            const note = PITCH_NOTES[char];
            if (note) cognitiveAudioEngine.playMusicalNote(note, 450);
          }, 200 + idx * 650);
          playbackTimeoutsRef.current.push(t);
        });
      }
    },
    [isAudioSpan, isPitchSpan, clearPlaybackTimeouts]
  );

  // Start / reset each round
  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    clearPlaybackTimeouts();

    const seq = generateSequence(digitCount);
    setDigits(seq);
    setPhase('memorize');
    setUserInput('');
    setRsvpIndex(0);
    setRoundFeedback(null);
    setAudioReplayUsed(false);
    setMemorizeProgress(100);

    if (isAudioSpan) {
      const spacedDigits = seq.split('').join(' ... ');
      const t = setTimeout(() => {
        speakWord(spacedDigits, 'en', 0.9);
      }, 300);
      playbackTimeoutsRef.current.push(t);
    }

    if (isPitchSpan) {
      seq.split('').forEach((char, idx) => {
        const t = setTimeout(() => {
          const note = PITCH_NOTES[char];
          if (note) cognitiveAudioEngine.playMusicalNote(note, 450);
        }, 400 + idx * 650);
        playbackTimeoutsRef.current.push(t);
      });
    }
  }, [round, restartKey, digitCount, generateSequence, isAudioSpan, isPitchSpan, clearPlaybackTimeouts]);

  // Memorize countdown timer that respects pause
  useEffect(() => {
    if (phase !== 'memorize' || isFinished || isGamePaused || roundFeedback) return;

    const perItemMs =
      isCustom && typeof customParams.flashPerItemMs === 'number'
        ? customParams.flashPerItemMs
        : undefined;

    const baseDuration =
      typeof levelMeta?.parametersJson?.flashDurationMs === 'number' && !isCustom
        ? (levelMeta.parametersJson.flashDurationMs as number)
        : 900 + digitCount * (perItemMs || (isInfinity ? 360 : 340));

    const flashDuration = isRsvpMode
      ? digits.length * 360 + 600
      : isAudioSpan
        ? digits.length * 950 + 800
        : isPitchSpan
          ? digits.length * 650 + 1200
          : perItemMs
            ? 600 + digitCount * perItemMs
            : baseDuration;

    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / flashDuration) * 100);
      setMemorizeProgress(pct);
      if (elapsed >= flashDuration) {
        clearInterval(tick);
        setPhase('recall');
        recallStartTimeRef.current = Date.now();
      }
    }, 50);

    return () => clearInterval(tick);
  }, [
    phase,
    isFinished,
    isGamePaused,
    roundFeedback,
    digits,
    isRsvpMode,
    isAudioSpan,
    isPitchSpan,
    digitCount,
    isInfinity,
    isCustom,
    customParams.flashPerItemMs,
    levelMeta
  ]);

  // RSVP character stream tick
  useEffect(() => {
    if (phase !== 'memorize' || !isRsvpMode || isGamePaused) return;
    const interval = setInterval(() => {
      setRsvpIndex(i => (i + 1 < digits.length ? i + 1 : i));
    }, 340);
    return () => clearInterval(interval);
  }, [phase, isRsvpMode, isGamePaused, digits]);

  // Global active elapsed seconds
  useEffect(() => {
    if (isFinished || isGamePaused) return;
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, isGamePaused]);

  const advanceNextRound = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setRoundFeedback(null);
    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(r => r + 1);
    }
  }, [round, maxRounds]);

  const handleInput = useCallback(
    (char: string) => {
      if (phase !== 'recall' || roundFeedback || isGamePaused || isFinished) return;
      playSound('click');
      if (isPitchSpan && PITCH_NOTES[char]) {
        cognitiveAudioEngine.playMusicalNote(PITCH_NOTES[char], 280);
      }

      if (userInput.length < digits.length) {
        const nextInput = userInput + char;
        setUserInput(nextInput);

        if (nextInput.length === digits.length) {
          const expected = computeExpectedSequence(digits, recallRule, isWordMode);
          const isCorrect = nextInput === expected;
          const responseMs = Math.min(20000, Math.max(100, Date.now() - recallStartTimeRef.current));

          const diff = analyzeSequenceDiff({
            expected,
            userTyped: nextInput,
            rawStimulus: digits,
            rule: recallRule,
            isWordTokens: isWordMode,
            tokenLabels: isPitchSpan ? PITCH_LABELS : undefined
          });

          emitTrialEvent({
            exerciseSlug: 'digit-span',
            level: effectiveLevel || 1,
            relationId: 'ORDER_SEQUENCE',
            relationWeight: isReverseSpan ? 1.0 : 0.85,
            entities: {
              target: expected,
              typed: nextInput,
              rule: recallRule,
              exactCount: diff.exactCount,
              transposedCount: diff.transposedCount
            },
            stateBefore: 'recalling',
            stateAfter: isCorrect ? 'sequence_matched' : 'sequence_mismatch',
            responseMs,
            correct: isCorrect
          });

          setSessionHistory(prev => [
            ...prev,
            {
              round,
              rawStimulus: digits,
              expected,
              userTyped: nextInput,
              isCorrect,
              responseMs,
              diff
            }
          ]);

          setRoundFeedback({
            isCorrect,
            rawStimulus: digits,
            expected,
            userTyped: nextInput,
            diff
          });

          if (isCorrect) {
            playSound('correct');
            setCorrectCount(c => c + 1);
            autoAdvanceTimerRef.current = setTimeout(() => {
              advanceNextRound();
            }, 950);
          } else {
            playSound('wrong');
            trackWrongAnswer({
              round,
              difficultyLevel: effectiveLevel || 1,
              questionContext: {
                prompt: `Chuỗi gốc: ${digits} (${RULE_META[recallRule].badgeVi})`,
                challengeType: recallRule,
                sequenceNotes: expected.split(isWordMode ? ' ' : '')
              },
              correctAnswer: {
                label: `${expected} (${RULE_META[recallRule].badgeVi})`,
                code: expected
              },
              userAnswer: {
                label: `${nextInput} — ${diff.diagnosisVi}`,
                code: nextInput
              },
              responseTimeMs: responseMs,
              sessionId: sessionIdRef.current
            });
          }
        }
      }
    },
    [
      phase,
      roundFeedback,
      isGamePaused,
      isFinished,
      playSound,
      isPitchSpan,
      userInput,
      digits,
      recallRule,
      isWordMode,
      emitTrialEvent,
      effectiveLevel,
      isReverseSpan,
      round,
      advanceNextRound,
      trackWrongAnswer
    ]
  );

  const handleDelete = useCallback(() => {
    if (roundFeedback || isGamePaused || isFinished) return;
    playSound('click');
    setUserInput(prev => prev.slice(0, -1));
  }, [roundFeedback, isGamePaused, isFinished, playSound]);

  // Keyboard bindings: typing digits/letters in recall, Enter/Space to advance during feedback or skip waiting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isFinished || isGamePaused || showHistoryModal) return;

      if (roundFeedback) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advanceNextRound();
        }
        return;
      }

      if (phase === 'memorize' && !isRsvpMode && !isAudioSpan && !isPitchSpan) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPhase('recall');
          recallStartTimeRef.current = Date.now();
        }
        return;
      }

      if (phase !== 'recall') return;

      if (isAlphanumericMode) {
        if (isWordMode && e.key === ' ') {
          e.preventDefault();
          handleInput(' ');
        } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
          handleInput(e.key.toUpperCase());
        } else if (e.key === 'Backspace') {
          handleDelete();
        }
      } else {
        if (e.key >= '0' && e.key <= '9') {
          handleInput(e.key);
        } else if (e.key === 'Backspace') {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    phase,
    isFinished,
    isGamePaused,
    showHistoryModal,
    roundFeedback,
    advanceNextRound,
    isRsvpMode,
    isAudioSpan,
    isPitchSpan,
    isAlphanumericMode,
    isWordMode,
    handleInput,
    handleDelete
  ]);

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = calculateGameScore({
    level: effectiveLevel || 1,
    accuracyRate: accuracy,
    timeLimitSec: 45,
    timeSpentSec: elapsedSec
  });

  const ruleMeta = RULE_META[recallRule];
  const spanLabel = isLetterMode
    ? 'chuỗi chữ cái'
    : isWordMode
      ? 'chuỗi từ vựng'
      : isMixedMode
        ? 'chuỗi Số & Chữ'
        : isPitchSpan
          ? 'chuỗi cao độ'
          : 'dãy số';

  const memorizeDisplayFormatted = useMemo(() => {
    if (!chunkingEnabled || isWordMode || isPitchSpan || isRsvpMode || isAudioSpan) {
      return digits;
    }
    return formatChunkedSequence(digits.split(''), false);
  }, [chunkingEnabled, isWordMode, isPitchSpan, isRsvpMode, isAudioSpan, digits]);

  // Compute chunk break points so recall slots mirror chunking groups visually
  const chunkBreakIndices = useMemo(() => {
    const breaks = new Set<number>();
    if (!chunkingEnabled || isWordMode || isPitchSpan || digits.length < 5) return breaks;
    const len = digits.length;
    let cursor = 0;
    while (cursor < len) {
      const remaining = len - cursor;
      let take = 3;
      if (remaining <= 3) take = remaining;
      else if (remaining === 4) take = 2;
      cursor += take;
      if (cursor < len) breaks.add(cursor);
    }
    return breaks;
  }, [chunkingEnabled, isWordMode, isPitchSpan, digits.length]);

  const completedCount = sessionHistory.length;

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl mx-auto px-3 sm:px-5 py-4 space-y-5 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13
                ? 'Letter Span (Trí nhớ ngắn hạn chuỗi ký tự Latin)'
                : effectiveLevel === 14
                  ? 'Word Span (Chuỗi từ vựng ngắn tiếng Anh CAT, SUN, SKY...)'
                  : effectiveLevel === 15
                    ? 'Phonological Suppression (Chặn phát âm thầm: hãy nói LA-LA-LA)'
                    : effectiveLevel === 16
                      ? 'Mixed Alphanumeric (Xen kẽ Số - Chữ phức hợp A7B2C9)'
                      : effectiveLevel === 17
                        ? 'Audio Dictation Span (Nghe số qua giọng nói, không nhìn chữ)'
                        : effectiveLevel === 18
                          ? 'High-Load Digit Stream (Chuỗi mở rộng)'
                          : effectiveLevel === 19
                            ? 'Reverse Alphanumeric (Đảo ngược chuỗi số và chữ phức hợp)'
                            : effectiveLevel === 20
                              ? 'RSVP Rapid Serial Stream (Chớp từng ký tự 340ms)'
                              : effectiveLevel === 21
                                ? 'Absolute Musical Pitch Span (Trí nhớ cao độ âm thanh C4-D4-E4-G4-A4)'
                                : 'Adaptive Ceiling Stream (Dãy siêu tốc 8-12 ký tự)'}
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
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium block">Lượt kiểm tra</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">
                {round} / {maxRounds}
              </span>
              {completedCount > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ({correctCount}/{completedCount} đúng)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Active Rule Badge */}
            <span className={`px-3 py-1 rounded-xl border text-xs font-black ${ruleMeta.badgeClass}`}>
              {ruleMeta.badgeVi}
            </span>

            {/* Chunking Toggle */}
            {!isWordMode && !isPitchSpan && !isRsvpMode && !isAudioSpan && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setChunkingEnabled(v => !v);
                }}
                title="Chia nhóm 2-3 ký tự theo nhịp Chunking giúp ghi nhớ dài hơn"
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  chunkingEnabled
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chunking: {chunkingEnabled ? 'BẬT' : 'TẮT'}</span>
              </button>
            )}

            <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 font-medium block">Độ dài chuỗi</span>
              <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                {isWordMode ? `${digitCount} từ` : `${digitCount} ${isPitchSpan ? 'nốt' : isLetterMode ? 'chữ' : 'ký tự'}`}
              </div>
            </div>
          </div>
        </div>

        {/* Visual progress bar across maxRounds */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${Math.round(((round - (roundFeedback ? 0 : 1)) / maxRounds) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Memorize / Recall / Color-Coded Diff Stage */}
      <div className="min-h-[16rem] sm:min-h-[19rem] rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white flex flex-col items-center justify-center p-5 sm:p-7 shadow-2xl relative overflow-hidden border-2 border-brand-400/80">
        {phase === 'memorize' && !roundFeedback && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/25">
            <div
              className="h-full bg-amber-300 transition-all duration-75"
              style={{ width: `${memorizeProgress}%` }}
            />
          </div>
        )}

        {roundFeedback ? (
          roundFeedback.isCorrect ? (
            /* CORRECT FEEDBACK VIEW */
            <div className="w-full space-y-4 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-emerald-500/25 border-2 border-emerald-300 text-emerald-100 font-black text-lg sm:text-xl shadow-lg">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                <span>Chính xác tuyệt đối! (+150 điểm)</span>
              </div>

              {!isWordMode && !isPitchSpan && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {roundFeedback.diff.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-11 h-14 sm:w-14 sm:h-16 rounded-2xl bg-emerald-500/25 border-2 border-emerald-300 flex items-center justify-center font-mono font-black text-2xl sm:text-4xl text-emerald-100 shadow"
                    >
                      {item.expectedChar}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={advanceNextRound}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition cursor-pointer"
              >
                <span>{round >= maxRounds ? 'Xem kết quả' : `Sang lượt ${round + 1}/${maxRounds}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* LARGE COLOR-CODED WRONG ANSWER DIAGNOSTIC VIEW */
            <div className="w-full space-y-4 animate-fade-in text-left">
              {/* Diagnostic Top Header + Color Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/30 border border-rose-300/60 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-rose-200" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black text-white leading-tight">
                      Chưa khớp ở lượt {round}/{maxRounds}
                    </div>
                    <div className="text-xs font-bold text-emerald-300">
                      Khớp chính xác vị trí: {roundFeedback.diff.exactCount}/{roundFeedback.diff.items.length} ({roundFeedback.diff.matchPercent}%)
                    </div>
                  </div>
                </div>

                {/* Color Legend Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/60 text-emerald-200">
                    ✓ Đúng chỗ ({roundFeedback.diff.exactCount})
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/25 border border-amber-400/70 text-amber-200">
                    ⇄ Lệch vị trí ({roundFeedback.diff.transposedCount})
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/30 border border-rose-400/70 text-rose-200">
                    ✕ Sai ký tự ({roundFeedback.diff.wrongCount + roundFeedback.diff.missingCount})
                  </span>
                </div>
              </div>

              {/* Raw Stimulus Context if rule transformed expected output */}
              {recallRule !== 'forward' && (
                <div
                  className={`p-3 rounded-2xl border text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 ${
                    roundFeedback.diff.forgotRuleTransform
                      ? 'bg-amber-500/25 border-amber-300 text-amber-100'
                      : 'bg-slate-950/45 border-white/15 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {roundFeedback.diff.forgotRuleTransform && (
                      <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    )}
                    <span className="font-semibold">Dãy gốc vừa chiếu:</span>
                    <span className="font-mono font-black text-base sm:text-lg tracking-wider bg-black/30 px-2.5 py-0.5 rounded-lg text-amber-300">
                      {roundFeedback.rawStimulus}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white/10">
                    Quy tắc: {ruleMeta.badgeVi} ({ruleMeta.shortVi})
                  </span>
                </div>
              )}

              {/* Big Position-by-Position Side-by-Side Diff Columns */}
              <div className="bg-slate-950/65 border border-white/15 rounded-2xl p-3 sm:p-4 overflow-x-auto">
                {isWordMode ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 block mb-1.5">
                        Đáp án đúng:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {roundFeedback.diff.items.map((item, idx) => (
                          <span
                            key={`wexp-${idx}`}
                            className="px-3 py-2 rounded-xl bg-emerald-500/25 border-2 border-emerald-400 font-mono font-black text-lg sm:text-xl text-emerald-100"
                          >
                            {item.expectedChar}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block mb-1.5">
                        Bạn đã nhập:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {roundFeedback.diff.items.map((item, idx) => (
                          <span
                            key={`wusr-${idx}`}
                            className={`px-3 py-2 rounded-xl border-2 font-mono font-black text-lg sm:text-xl ${
                              item.status === 'exact'
                                ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
                                : item.status === 'transposed'
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-100'
                                  : 'bg-rose-500/30 border-rose-400 text-rose-100'
                            }`}
                          >
                            {item.userChar || '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-max mx-auto space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1 mb-1">
                      <span className="text-emerald-300">▲ Hàng trên: ĐÁP ÁN ĐÚNG</span>
                      <span>▼ Hàng dưới: BẠN ĐÃ NHẬP</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                      {roundFeedback.diff.items.map((item, idx) => {
                        const isMatched = item.status === 'exact';
                        const isTransposed = item.status === 'transposed';
                        const displayExp = isPitchSpan
                          ? `${item.expectedChar}`
                          : item.expectedChar;
                        const displayUsr = item.userChar || '?';

                        return (
                          <div
                            key={`diff-col-${idx}`}
                            className="flex flex-col items-center gap-1.5"
                          >
                            {/* Position Index */}
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{idx + 1}
                            </span>

                            {/* Top Tile: Expected */}
                            <div
                              className={`w-11 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-4xl transition-all ${
                                isMatched
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                                  : 'bg-emerald-500/30 border-emerald-300 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40'
                              }`}
                            >
                              <span>{displayExp}</span>
                              {isPitchSpan && item.expectedLabel && (
                                <span className="text-[9px] font-sans font-bold text-emerald-200 leading-none">
                                  {item.expectedLabel.split(' ')[0]}
                                </span>
                              )}
                            </div>

                            {/* Connector Arrow / Shift Badge */}
                            <div className="h-5 flex items-center justify-center">
                              {isMatched ? (
                                <span className="text-emerald-400 text-xs font-black">✓</span>
                              ) : isTransposed && item.targetPosIndex !== undefined ? (
                                <span
                                  className="px-1.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400/70 text-[10px] font-mono font-black text-amber-200 whitespace-nowrap"
                                  title={`Ký tự "${displayUsr}" đáng lẽ nằm ở vị trí #${item.targetPosIndex + 1}`}
                                >
                                  ⇄ #{item.targetPosIndex + 1}
                                </span>
                              ) : (
                                <span className="text-rose-400 text-xs font-black">✕</span>
                              )}
                            </div>

                            {/* Bottom Tile: User Input (NO strikethrough — crystal clear comparison) */}
                            <div
                              className={`w-11 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-4xl transition-all ${
                                isMatched
                                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                                  : isTransposed
                                    ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30'
                                    : item.status === 'missing'
                                      ? 'bg-slate-800/70 border-dashed border-slate-500 text-slate-400'
                                      : 'bg-rose-500/30 border-rose-400 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.35)] ring-2 ring-rose-400/30'
                              }`}
                            >
                              <span>{displayUsr}</span>
                              {isPitchSpan && item.userLabel && (
                                <span className="text-[9px] font-sans font-bold text-white/80 leading-none">
                                  {item.userLabel.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actionable Diagnosis & Chunking Aid */}
              <div className="bg-black/30 border border-white/15 rounded-2xl p-3.5 space-y-1.5 text-xs sm:text-sm">
                <p className="font-bold text-amber-200 flex items-start gap-2 leading-relaxed">
                  <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>{roundFeedback.diff.diagnosisVi}</span>
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200 pl-6">
                  <span>
                    💡 Mẹo: {roundFeedback.diff.tipVi}
                  </span>
                  {!isWordMode && roundFeedback.diff.expectedChunked && (
                    <span className="font-mono font-black bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-lg text-emerald-200">
                      Cụm nhớ: {roundFeedback.diff.expectedChunked}
                    </span>
                  )}
                </div>
              </div>

              {/* Continue + Audio Replay Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {(isAudioSpan || isPitchSpan) && (
                  <button
                    type="button"
                    onClick={() => playAudioForSequence(roundFeedback.rawStimulus)}
                    className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-amber-200 inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nghe lại mẫu chuẩn</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={advanceNextRound}
                  className="ml-auto w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-slate-950 hover:bg-amber-300 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <span>
                    {round >= maxRounds
                      ? 'Hoàn tất — Xem kết quả'
                      : `Đã hiểu — Tiếp tục lượt ${round + 1}/${maxRounds}`}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900/10 hidden sm:inline">
                    Enter ↵
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        ) : phase === 'memorize' ? (
          /* MEMORIZE PRESENTATION VIEW */
          <div className="space-y-3 text-center w-full">
            {isPitchSpan ? (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold flex items-center justify-center gap-1.5">
                  🎵 LẮNG NGHE GIAI ĐIỆU CAO ĐỘ TUYỆT ĐỐI
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {digits.split('').map((char, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-amber-300 font-mono font-black text-lg sm:text-xl border border-white/30 shadow"
                    >
                      {PITCH_LABELS[char] || char}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-brand-100 mt-2 font-medium">
                  Ghi nhớ chuỗi nốt theo âm sắc phát ra
                </p>
              </>
            ) : isAudioSpan ? (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
                  🎧 LẮNG NGHE CHUỖI SỐ QUA TAI NGHE / LOA
                </span>
                <div className="text-3xl sm:text-5xl font-mono font-black tracking-widest text-amber-300 flex items-center justify-center gap-3 py-4">
                  <span>🔊</span>
                  <span className="text-xl sm:text-3xl text-white">ĐANG ĐỌC TỪNG SỐ...</span>
                </div>
              </>
            ) : isRsvpMode ? (
              <>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-200 font-bold">
                  ⚡ CHỚP TỪNG KÝ TỰ RSVP ({rsvpIndex + 1}/{digits.length})
                </span>
                <div className="text-6xl sm:text-8xl font-mono font-black text-amber-300 animate-pulse">
                  {digits[rsvpIndex]}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-100 font-bold">
                    Ghi nhớ {spanLabel}
                  </span>
                  {recallRule !== 'forward' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase shadow">
                      Chuẩn bị: {ruleMeta.badgeVi}
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono font-black tracking-widest text-amber-300 py-2 break-all ${
                    isWordMode
                      ? 'text-2xl sm:text-4xl md:text-5xl'
                      : digits.length >= 10
                        ? 'text-3xl sm:text-5xl'
                        : 'text-4xl sm:text-6xl md:text-7xl'
                  }`}
                >
                  {memorizeDisplayFormatted}
                </div>

                <div className="pt-1 flex items-center justify-center gap-3 text-xs text-brand-100/80">
                  <span>{ruleMeta.promptVi}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('recall');
                      recallStartTimeRef.current = Date.now();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Đã nhớ — Nhập ngay (Space)
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* RECALL INPUT SLOTS VIEW */
          <div className="space-y-4 text-center w-full">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm uppercase tracking-wider text-brand-100 font-bold">
                {ruleMeta.promptVi} ({userInput.length}/{digits.length})
              </span>
              {(isAudioSpan || isPitchSpan) && !audioReplayUsed && (
                <button
                  type="button"
                  onClick={() => {
                    setAudioReplayUsed(true);
                    playAudioForSequence(digits);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-amber-200 inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Nghe lại
                </button>
              )}
            </div>

            {isPitchSpan ? (
              <div className="min-h-[76px] bg-black/25 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: digits.length }).map((_, idx) => {
                  const ch = userInput[idx];
                  const isCurrent = idx === userInput.length;
                  return (
                    <div
                      key={`pitch-slot-${idx}`}
                      className={`px-3 py-2 rounded-xl border-2 min-w-[68px] flex flex-col items-center justify-center font-mono transition-all ${
                        ch
                          ? 'bg-amber-400/20 border-amber-300 text-amber-200 font-black'
                          : isCurrent
                            ? 'bg-white/10 border-amber-300 animate-pulse text-amber-200'
                            : 'bg-black/20 border-white/15 text-white/30'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{ch ? PITCH_LABELS[ch] : '?'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-black/25 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-[84px]">
                {Array.from({ length: digits.length }).map((_, idx) => {
                  const ch = userInput[idx];
                  const isCurrentCursor = idx === userInput.length;
                  const addChunkGap = chunkBreakIndices.has(idx);
                  return (
                    <div
                      key={`input-slot-${idx}`}
                      className={`flex flex-col items-center gap-1 ${addChunkGap ? 'ml-2 sm:ml-3.5' : ''}`}
                    >
                      <div
                        className={`w-9 h-12 sm:w-12 sm:h-16 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-mono font-black text-xl sm:text-3xl transition-all ${
                          ch
                            ? 'bg-white text-slate-950 border-amber-300 shadow-lg scale-105'
                            : isCurrentCursor
                              ? 'bg-amber-400/20 border-amber-300 text-amber-300 animate-pulse'
                              : 'bg-black/20 border-white/20 text-white/30'
                        }`}
                      >
                        {ch === ' ' ? '␣' : ch || ''}
                      </div>
                      <span className="text-[9px] font-mono text-white/45">#{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onscreen Numpad / Keyboard */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {roundFeedback
              ? 'Nhấn nút Tiếp tục hoặc bấm phím Enter / Space để sang lượt kế tiếp'
              : 'Bấm trực tiếp bàn phím máy tính hoặc các phím số bên dưới'}
          </p>

          {sessionHistory.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setShowHistoryModal(true);
              }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Xem lại các lượt ({sessionHistory.length})</span>
            </button>
          )}
        </div>

        {isPitchSpan ? (
          <div className="flex flex-wrap gap-2.5 max-w-md mx-auto justify-center">
            {['1', '2', '3', '4', '5'].map(key => (
              <button
                key={key}
                disabled={phase !== 'recall' || Boolean(roundFeedback)}
                onClick={() => handleInput(key)}
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 font-black text-base text-indigo-700 dark:text-indigo-300 shadow hover:bg-indigo-50 active:scale-95 transition-all btn-press disabled:opacity-40 flex flex-col items-center justify-center min-w-[72px] cursor-pointer"
              >
                <span className="text-base sm:text-lg">🎵 Phím {key}</span>
                <span className="text-[11px] text-slate-500 font-semibold">{PITCH_LABELS[key]}</span>
              </button>
            ))}
            <button
              disabled={phase !== 'recall' || userInput.length === 0 || Boolean(roundFeedback)}
              onClick={handleDelete}
              className="w-16 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        ) : isAlphanumericMode ? (
          <div className="space-y-2.5 max-w-lg mx-auto">
            {(isMixedMode || isReverseAlphanumeric) && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    disabled={phase !== 'recall' || Boolean(roundFeedback)}
                    onClick={() => handleInput(num)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 font-black text-base text-amber-800 dark:text-amber-200 shadow hover:bg-amber-100 active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {LETTERS.split('').map(char => (
                <button
                  key={char}
                  disabled={phase !== 'recall' || Boolean(roundFeedback)}
                  onClick={() => handleInput(char)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-base text-slate-800 dark:text-white shadow hover:bg-brand-50 active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
                >
                  {char}
                </button>
              ))}
              {isWordMode && (
                <button
                  disabled={phase !== 'recall' || Boolean(roundFeedback)}
                  onClick={() => handleInput(' ')}
                  className="px-4 h-10 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700 font-bold text-xs text-indigo-700 dark:text-indigo-300 shadow active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
                >
                  Dấu cách (Space)
                </button>
              )}
              <button
                disabled={phase !== 'recall' || userInput.length === 0 || Boolean(roundFeedback)}
                onClick={handleDelete}
                className="w-14 h-10 sm:w-16 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
                aria-label="Xóa ký tự"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                disabled={phase !== 'recall' || Boolean(roundFeedback)}
                onClick={() => handleInput(String(n))}
                className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 dark:hover:bg-slate-700 active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              disabled={phase !== 'recall' || Boolean(roundFeedback)}
              onClick={() => handleInput('0')}
              className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-2xl sm:text-3xl text-slate-800 dark:text-white shadow hover:bg-brand-50 dark:hover:bg-slate-700 active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
            >
              0
            </button>
            <button
              disabled={phase !== 'recall' || userInput.length === 0 || Boolean(roundFeedback)}
              onClick={handleDelete}
              aria-label="Xóa số vừa nhập"
              className="h-14 sm:h-18 md:h-20 rounded-2xl sm:rounded-3xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all btn-press disabled:opacity-40 cursor-pointer"
            >
              <Delete className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>
        )}
      </div>

      {/* Session Round Review Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black">Chi Tiết Các Lượt Trong Phiên</h3>
                  <span className="text-[11px] text-brand-100">
                    Đúng {correctCount}/{sessionHistory.length} lượt • Mục tiêu {maxRounds} lượt
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {sessionHistory.map((entry, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border ${
                    entry.isCorrect
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      Lượt #{entry.round}
                    </span>
                    <span className={entry.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {entry.isCorrect ? '✓ Chính xác' : `✕ Đúng ${entry.diff.exactCount}/${entry.diff.items.length} vị trí`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-base font-black">
                    {entry.diff.items.map((item, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg border ${
                          item.status === 'exact'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                            : item.status === 'transposed'
                              ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-800 dark:text-amber-200'
                              : 'bg-rose-100 dark:bg-rose-900/50 border-rose-400 text-rose-800 dark:text-rose-200'
                        }`}
                        title={`Chuẩn: ${item.expectedChar} | Nhập: ${item.userChar || '?'}`}
                      >
                        {item.userChar || '?'}
                        {!entry.isCorrect && item.status !== 'exact' && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 ml-1">
                            ({item.expectedChar})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  {!entry.isCorrect && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      {entry.diff.diagnosisVi}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          playedLevel={effectiveLevel || 1}
          isCustom={isCustom}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            sessionIdRef.current = `session-digit-${Date.now()}`;
            setSessionHistory([]);
            setRound(1);
            setRestartKey(k => k + 1);
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
