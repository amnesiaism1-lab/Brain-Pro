import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { GameResultModal } from './GameResultModal';
import { auditoryEngine } from '../../services/auditoryEngine';
import { useRelationSession } from '../../hooks/useRelationSession';
import { calculateGameScore } from '@brain-exercises/shared';
import {
  Brain,
  Volume2,
  Eye,
  Play,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const LETTERS_POOL = ['C', 'K', 'L', 'Q', 'R', 'T', 'X', 'B'];

const LETTER_NOTE_MAP: Record<string, string> = {
  C: 'C4',
  K: 'D4',
  L: 'E4',
  Q: 'F4',
  R: 'G4',
  T: 'A4',
  X: 'B4',
  B: 'C5'
};

interface StepRecord {
  position: number; // 0 to 8 in 3x3 grid
  letter: string;
}

type ChannelOutcome = 'hit' | 'miss' | 'false' | 'skip';

interface StepFeedbackDetail {
  evalRound: number;
  nBack: number;
  refPos: number;
  refLetter: string;
  curPos: number;
  curLetter: string;
  pos: ChannelOutcome;
  audio: ChannelOutcome;
  hasError: boolean;
}

const formatPosLabel = (pos: number): string =>
  `Ô #${pos + 1} (H${Math.floor(pos / 3) + 1}C${(pos % 3) + 1})`;

const MiniNBackGrid: React.FC<{
  activePos: number;
  accent: 'ref' | 'cur-ok' | 'cur-err';
}> = ({ activePos, accent }) => {
  const activeClass =
    accent === 'ref'
      ? 'bg-amber-400 border-amber-200 shadow-sm shadow-amber-400/50'
      : accent === 'cur-ok'
        ? 'bg-emerald-500 border-emerald-200 shadow-sm shadow-emerald-500/50'
        : 'bg-rose-500 border-rose-200 shadow-sm shadow-rose-500/50';

  return (
    <div className="grid grid-cols-3 gap-0.5 w-9 h-9 p-0.5 rounded-lg bg-slate-900/90 border border-slate-700 shrink-0">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
        <div
          key={idx}
          className={`rounded-[3px] border ${
            idx === activePos
              ? activeClass
              : 'bg-slate-800/80 border-slate-700/60'
          }`}
        />
      ))}
    </div>
  );
};

export const DualNBackGame: React.FC = () => {
  const {
    currentLevel,
    getExerciseLevel,
    setActiveGameSlug,
    playSound,
    isGamePaused,
    ladderSessionRounds
  } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('dual-nback');
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('dual-nback');
  const sessionIdRef = useRef<string>(`session-nback-${Date.now()}`);

  const ladderLevel = getExerciseLevel('dual-nback') || currentLevel || 1;
  const playedLevelRef = useRef<number>(isCustom ? sessionConfig.level || 1 : ladderLevel);
  const effectiveLevel = playedLevelRef.current;

  // Calculate N based on level (Level 1: 1-back; Level 2-5: 2-back; Level 6-12: 3-back; Level 13+: 4-back)
  const nBack = effectiveLevel <= 1 ? 1 : effectiveLevel <= 5 ? 2 : effectiveLevel <= 12 ? 3 : 4;
  const evaluatedTurns = useMemo(() => {
    if (sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    return Math.max(1, ladderSessionRounds || 6);
  }, [sessionConfig.rounds, ladderSessionRounds]);
  const totalTrials = nBack + evaluatedTurns;
  const trialIntervalMs = effectiveLevel >= 13 ? 2200 : 2600;

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // User responses for current trial
  const [posPressed, setPosPressed] = useState(false);
  const [audioPressed, setAudioPressed] = useState(false);
  const posPressedRef = useRef(false);
  const audioPressedRef = useRef(false);
  const [stepFeedback, setStepFeedback] = useState<StepFeedbackDetail | null>(null);
  const [mistakeLog, setMistakeLog] = useState<StepFeedbackDetail[]>([]);
  const [stepProgress, setStepProgress] = useState(100);

  // Scoring telemetry
  const [posHits, setPosHits] = useState(0);
  const [posMisses, setPosMisses] = useState(0);
  const [posFalseAlarms, setPosFalseAlarms] = useState(0);
  const [audioHits, setAudioHits] = useState(0);
  const [audioMisses, setAudioMisses] = useState(0);
  const [audioFalseAlarms, setAudioFalseAlarms] = useState(0);

  const [isFinished, setIsFinished] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Speak or synthesize letter sound
  const playLetterAudio = useCallback((letter: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch {
        // fallback handled by triangle tone below
      }
    }

    const note = LETTER_NOTE_MAP[letter] || 'C4';
    auditoryEngine.resumeAudioContext().then(() => {
      auditoryEngine.playNote(note, 0.45, { volume: 0.5, waveform: 'triangle' });
    });
  }, []);

  // Pre-generate full trial sequence with controlled target match frequency (~32% matches)
  const generateSequence = useCallback(() => {
    const seq: StepRecord[] = [];
    for (let i = 0; i < totalTrials; i++) {
      let pos = Math.floor(Math.random() * 9);
      let lettr = LETTERS_POOL[Math.floor(Math.random() * LETTERS_POOL.length)];

      if (i >= nBack) {
        if (Math.random() < 0.35) {
          pos = seq[i - nBack].position;
        }
        if (Math.random() < 0.35) {
          lettr = seq[i - nBack].letter;
        }
      }

      seq.push({ position: pos, letter: lettr });
    }
    return seq;
  }, [nBack, totalTrials]);

  const [trialSequence, setTrialSequence] = useState<StepRecord[]>(generateSequence);

  // Re-generate when totalTrials / nBack changes before playing
  useEffect(() => {
    if (!isPlaying && !isFinished) {
      setTrialSequence(generateSequence());
    }
  }, [generateSequence, isPlaying, isFinished]);

  // Initialize or reset game
  const startGame = useCallback(() => {
    const seq = generateSequence();
    sessionIdRef.current = `session-nback-${Date.now()}`;
    setTrialSequence(seq);
    setTrialIndex(0);
    setActivePosition(null);
    setActiveLetter(null);
    setPosPressed(false);
    setAudioPressed(false);
    posPressedRef.current = false;
    audioPressedRef.current = false;
    setStepFeedback(null);
    setMistakeLog([]);
    setStepProgress(100);
    setPosHits(0);
    setPosMisses(0);
    setPosFalseAlarms(0);
    setAudioHits(0);
    setAudioMisses(0);
    setAudioFalseAlarms(0);
    setElapsedSec(0);
    setIsFinished(false);
    setShowResultModal(false);
    setIsPlaying(true);
    resetSession();
  }, [generateSequence, resetSession]);

  // Handle Position Match button click
  const handlePositionMatch = useCallback(() => {
    if (!isPlaying || isFinished || isGamePaused || posPressedRef.current) return;
    posPressedRef.current = true;
    setPosPressed(true);
    playSound('click');
  }, [isPlaying, isFinished, isGamePaused, playSound]);

  // Handle Audio Match button click
  const handleAudioMatch = useCallback(() => {
    if (!isPlaying || isFinished || isGamePaused || audioPressedRef.current) return;
    audioPressedRef.current = true;
    setAudioPressed(true);
    playSound('click');
  }, [isPlaying, isFinished, isGamePaused, playSound]);

  // Keyboard shortcut listener: 'A' or ArrowLeft for Position, 'L' or ArrowRight for Audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePositionMatch();
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAudioMatch();
      } else if (e.key === ' ' && !isPlaying && !isFinished) {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePositionMatch, handleAudioMatch, isPlaying, isFinished, startGame]);

  // Elapsed seconds timer
  useEffect(() => {
    if (!isPlaying || isFinished || isGamePaused) return;
    timerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFinished, isGamePaused]);

  // Evaluation at the end of each step
  const evaluateStep = useCallback(
    (stepIdx: number, pPressed: boolean, aPressed: boolean) => {
      if (stepIdx < nBack) return;

      const currentItem = trialSequence[stepIdx];
      const nBackItem = trialSequence[stepIdx - nBack];
      const evalRound = stepIdx - nBack + 1;

      const isPosMatch = currentItem.position === nBackItem.position;
      const isAudioMatch = currentItem.letter === nBackItem.letter;

      let posResult: ChannelOutcome = 'skip';
      if (isPosMatch) {
        if (pPressed) {
          setPosHits(h => h + 1);
          posResult = 'hit';
        } else {
          setPosMisses(m => m + 1);
          posResult = 'miss';
        }
      } else if (pPressed) {
        setPosFalseAlarms(f => f + 1);
        posResult = 'false';
      }

      let audioResult: ChannelOutcome = 'skip';
      if (isAudioMatch) {
        if (aPressed) {
          setAudioHits(h => h + 1);
          audioResult = 'hit';
        } else {
          setAudioMisses(m => m + 1);
          audioResult = 'miss';
        }
      } else if (aPressed) {
        setAudioFalseAlarms(f => f + 1);
        audioResult = 'false';
      }

      const hasError =
        posResult === 'miss' ||
        posResult === 'false' ||
        audioResult === 'miss' ||
        audioResult === 'false';

      const detail: StepFeedbackDetail = {
        evalRound,
        nBack,
        refPos: nBackItem.position,
        refLetter: nBackItem.letter,
        curPos: currentItem.position,
        curLetter: currentItem.letter,
        pos: posResult,
        audio: audioResult,
        hasError
      };

      if (posResult !== 'skip' || audioResult !== 'skip') {
        setStepFeedback(detail);
        if (hasError) {
          playSound('wrong');
          setMistakeLog(prev => [...prev, detail]);
          trackWrongAnswer({
            round: evalRound,
            difficultyLevel: effectiveLevel,
            questionContext: {
              prompt: `Dual ${nBack}-Back: Cách ${nBack} bước là ${formatPosLabel(nBackItem.position)} '${nBackItem.letter}' | Lượt #${evalRound} là ${formatPosLabel(currentItem.position)} '${currentItem.letter}'`,
              challengeType: `dual-${nBack}-back`,
              gridSize: 3
            },
            correctAnswer: {
              label: `${isPosMatch ? 'Khớp Vị trí' : 'Không khớp Vị trí'} • ${isAudioMatch ? 'Khớp Âm thanh' : 'Không khớp Âm thanh'}`,
              code: `POS_${isPosMatch ? 'MATCH' : 'NO'}_AUDIO_${isAudioMatch ? 'MATCH' : 'NO'}`
            },
            userAnswer: {
              label: `${pPressed ? 'Bấm Vị trí' : 'Bỏ qua Vị trí'} • ${aPressed ? 'Bấm Âm thanh' : 'Bỏ qua Âm thanh'}`,
              code: `POS_${pPressed ? 'YES' : 'NO'}_AUDIO_${aPressed ? 'YES' : 'NO'}`
            },
            responseTimeMs: trialIntervalMs,
            sessionId: sessionIdRef.current
          });
        } else {
          playSound('correct');
        }
      } else {
        setStepFeedback(null);
      }

      emitTrialEvent({
        exerciseSlug: 'dual-nback',
        level: effectiveLevel,
        relationId: 'IDENTITY_MATCH',
        relationWeight: 1.0,
        entities: {
          step: stepIdx,
          nBack,
          isPosMatch,
          isAudioMatch,
          posPressed: pPressed,
          audioPressed: aPressed
        },
        stateBefore: `step:${stepIdx}`,
        stateAfter: `step:${stepIdx + 1}`,
        responseMs: trialIntervalMs,
        correct: isPosMatch === pPressed && isAudioMatch === aPressed
      });
    },
    [nBack, trialSequence, effectiveLevel, emitTrialEvent, trialIntervalMs, playSound, trackWrongAnswer]
  );

  // Step progression execution loop
  useEffect(() => {
    if (!isPlaying || isFinished || isGamePaused) return;

    if (trialIndex >= totalTrials) {
      setIsPlaying(false);
      setIsFinished(true);
      playSound('victory');
      // If 100% accurate, open modal directly; if mistakes occurred, show mistake summary review first
      if (posMisses + posFalseAlarms + audioMisses + audioFalseAlarms === 0) {
        setShowResultModal(true);
      }
      return;
    }

    const currentStep = trialSequence[trialIndex];
    setActivePosition(currentStep.position);
    setActiveLetter(currentStep.letter);
    setPosPressed(false);
    setAudioPressed(false);
    posPressedRef.current = false;
    audioPressedRef.current = false;
    setStepProgress(100);

    playLetterAudio(currentStep.letter);

    const stepStart = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - stepStart;
      setStepProgress(Math.max(0, 100 - (elapsed / trialIntervalMs) * 100));
    }, 50);

    const flashTimeout = setTimeout(() => {
      setActivePosition(null);
    }, 650);

    trialTimerRef.current = setTimeout(() => {
      evaluateStep(trialIndex, posPressedRef.current, audioPressedRef.current);
      setTrialIndex(i => i + 1);
    }, trialIntervalMs);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(flashTimeout);
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    };
  }, [
    trialIndex,
    isPlaying,
    isFinished,
    isGamePaused,
    trialSequence,
    totalTrials,
    trialIntervalMs,
    playLetterAudio,
    evaluateStep,
    playSound,
    posMisses,
    posFalseAlarms,
    audioMisses,
    audioFalseAlarms
  ]);

  const totalHits = posHits + audioHits;
  const totalErrors = posMisses + posFalseAlarms + audioMisses + audioFalseAlarms;
  const accuracyRate =
    totalHits + totalErrors === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((totalHits / (totalHits + totalErrors)) * 100)));
  const calculatedScore = calculateGameScore({
    level: effectiveLevel,
    accuracyRate,
    timeLimitSec: 60,
    timeSpentSec: elapsedSec
  });

  const isWarmup = isPlaying && trialIndex < nBack;
  const completedEvaluatedTurns = Math.max(0, Math.min(evaluatedTurns, trialIndex - nBack));

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-28">
      {/* HUD Header */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Dual N-Back</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-extrabold text-xs border border-brand-200 dark:border-brand-700">
                {nBack}-Back
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {isWarmup
                ? `Đang nạp ${nBack} bước đầu vào bộ nhớ (${trialIndex + 1}/${nBack})...`
                : `Chuẩn vàng phát triển Trí Tuệ Linh Hoạt • ${evaluatedTurns} lượt đánh giá`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            title="Hướng dẫn cách chơi Dual N-Back"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
              Lượt chấm điểm
            </span>
            <span className="text-lg font-black text-brand-600 dark:text-brand-400">
              {completedEvaluatedTurns} / {evaluatedTurns}
            </span>
          </div>
        </div>
      </div>

      {/* Finished with mistakes: Post-session N-Back Comparison Review */}
      {isFinished && !showResultModal && mistakeLog.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-rose-400/70 dark:border-rose-500/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Đối Chiếu {mistakeLog.length} Lỗi Trong Phiên Dual {nBack}-Back
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  So sánh trực tiếp mẫu {nBack} bước trước với lượt bạn vừa bỏ lỡ hoặc bấm nhầm
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-black text-xs border border-brand-500/30">
              Độ chính xác: {accuracyRate}%
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {mistakeLog.map((m, i) => (
              <div
                key={`nback-err-${i}`}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Lượt #{m.evalRound}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.pos !== 'skip' && (
                      <span
                        className={`px-2 py-0.5 rounded-md border ${
                          m.pos === 'hit'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                        }`}
                      >
                        Vị trí:{' '}
                        {m.pos === 'hit'
                          ? '✓ Chuẩn'
                          : m.pos === 'miss'
                            ? '✕ Bỏ lỡ trùng ô'
                            : '✕ Bấm nhầm khác ô'}
                      </span>
                    )}
                    {m.audio !== 'skip' && (
                      <span
                        className={`px-2 py-0.5 rounded-md border ${
                          m.audio === 'hit'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        }`}
                      >
                        Âm thanh:{' '}
                        {m.audio === 'hit'
                          ? '✓ Chuẩn'
                          : m.audio === 'miss'
                            ? '✕ Bỏ lỡ trùng chữ'
                            : '✕ Bấm nhầm khác chữ'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30">
                    <MiniNBackGrid activePos={m.refPos} accent="ref" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                        Cách {m.nBack} bước
                      </div>
                      <div className="font-black text-slate-900 dark:text-white">
                        {formatPosLabel(m.refPos)}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300">
                        Chữ &quot;{m.refLetter}&quot;
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30">
                    <MiniNBackGrid
                      activePos={m.curPos}
                      accent={m.pos === 'hit' ? 'cur-ok' : 'cur-err'}
                    />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-300">
                        Tại lượt #{m.evalRound}
                      </div>
                      <div className="font-black text-slate-900 dark:text-white">
                        {formatPosLabel(m.curPos)}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300">
                        Chữ &quot;{m.curLetter}&quot;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowResultModal(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 cursor-pointer transition-all"
          >
            <span>Hoàn tất &amp; Lưu Kết Quả Tổng Hợp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 3x3 Dual N-Back Matrix Container */}
      <div className="relative bg-gradient-to-b from-[#F9F6F0] to-[#EFE9DF] dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-5 overflow-hidden">
        {/* Step Timer Bar */}
        {isPlaying && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-75"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        )}

        {/* Audio letter stream indicator */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Volume2 className={`w-4 h-4 ${activeLetter ? 'text-indigo-500 animate-bounce' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Âm thanh chữ cái:
            </span>
            <span className="text-base font-black font-mono px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {activeLetter ? activeLetter : '--'}
            </span>
          </div>
        </div>

        {/* High-Visibility Live N-Back Comparison Feedback Card */}
        {stepFeedback && (
          <div
            className={`w-full rounded-2xl p-3 sm:p-3.5 border-2 transition-all ${
              stepFeedback.hasError
                ? 'bg-rose-50 dark:bg-rose-950/45 border-rose-400 dark:border-rose-500/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black mb-2">
              <span className="flex items-center gap-1.5">
                {stepFeedback.hasError ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span
                  className={
                    stepFeedback.hasError
                      ? 'text-rose-700 dark:text-rose-200'
                      : 'text-emerald-700 dark:text-emerald-200'
                  }
                >
                  Đối chiếu Lượt #{stepFeedback.evalRound} với {stepFeedback.nBack} bước trước:
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                {stepFeedback.pos !== 'skip' && (
                  <span
                    className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                      stepFeedback.pos === 'hit'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-200 border-rose-500/40'
                    }`}
                  >
                    Vị trí: {stepFeedback.pos === 'hit' ? '✓ Khớp đúng' : stepFeedback.pos === 'miss' ? '✕ Bỏ lỡ' : '✕ Bấm nhầm'}
                  </span>
                )}
                {stepFeedback.audio !== 'skip' && (
                  <span
                    className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                      stepFeedback.audio === 'hit'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                    }`}
                  >
                    Âm thanh: {stepFeedback.audio === 'hit' ? '✓ Khớp đúng' : stepFeedback.audio === 'miss' ? '✕ Bỏ lỡ' : '✕ Bấm nhầm'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-300/60 dark:border-amber-500/30">
                <MiniNBackGrid activePos={stepFeedback.refPos} accent="ref" />
                <div className="leading-tight">
                  <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                    Cách {stepFeedback.nBack} bước
                  </div>
                  <div className="font-black text-slate-800 dark:text-slate-100">
                    {formatPosLabel(stepFeedback.refPos)} • &quot;{stepFeedback.refLetter}&quot;
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700">
                <MiniNBackGrid
                  activePos={stepFeedback.curPos}
                  accent={stepFeedback.hasError ? 'cur-err' : 'cur-ok'}
                />
                <div className="leading-tight">
                  <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Lượt vừa qua
                  </div>
                  <div className="font-black text-slate-800 dark:text-slate-100">
                    {formatPosLabel(stepFeedback.curPos)} • &quot;{stepFeedback.curLetter}&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3x3 Grid Matrix */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-64 h-64 sm:w-72 sm:h-72 aspect-square">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
            const isActive = activePosition === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-150 border-2 flex items-center justify-center ${
                  isActive
                    ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-105 ring-4 ring-cyan-400/40 animate-pulse'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="w-4 h-4 rounded-full bg-white shadow-md animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Match Buttons */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePositionMatch}
            disabled={!isPlaying || isFinished || isWarmup}
            className={`h-16 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all shadow-md active:scale-95 border-2 ${
              posPressed
                ? 'bg-cyan-600 text-white border-cyan-500 ring-4 ring-cyan-500/30'
                : 'bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-white border-cyan-500/50 disabled:opacity-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-500" />
              <span>Khớp Vị Trí</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline-block">
                A / ←
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {isWarmup ? 'Đang nạp nhớ...' : `Trùng ô ${nBack} bước trước`}
            </span>
          </button>

          <button
            onClick={handleAudioMatch}
            disabled={!isPlaying || isFinished || isWarmup}
            className={`h-16 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all shadow-md active:scale-95 border-2 ${
              audioPressed
                ? 'bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white border-indigo-500/50 disabled:opacity-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <span>Khớp Âm Thanh</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline-block">
                L / →
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {isWarmup ? 'Đang nạp nhớ...' : `Trùng chữ cái ${nBack} bước trước`}
            </span>
          </button>
        </div>

        {/* Start / Replay Controls */}
        {!isPlaying && !isFinished && (
          <button
            onClick={startGame}
            className="w-full max-w-md py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all btn-press"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Bắt Đầu Dual {nBack}-Back ({evaluatedTurns} lượt • Space)</span>
          </button>
        )}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  Quy Luật Dual N-Back
                </h3>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Dual N-Back</strong> yêu cầu não bộ duy trì đồng thời 2 luồng thông tin song song:{' '}
                <strong>Vị trí ô sáng</strong> và <strong>Âm thanh chữ cái</strong>.
              </p>
              <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                <strong className="text-cyan-700 dark:text-cyan-300 block mb-1">
                  🟦 Khớp Vị Trí (Phím A hoặc ←):
                </strong>
                Nếu ô sáng hiện tại nằm ở vị trí{' '}
                <strong>y hệt ô sáng {nBack} bước trước đó</strong>, hãy bấm nút Khớp Vị Trí.
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <strong className="text-indigo-700 dark:text-indigo-300 block mb-1">
                  🎵 Khớp Âm Thanh (Phím L hoặc →):
                </strong>
                Nếu chữ cái âm thanh vừa đọc{' '}
                <strong>y hệt chữ cái {nBack} bước trước đó</strong>, hãy bấm nút Khớp Âm Thanh.
              </div>
            </div>

            <button
              onClick={() => {
                setShowTutorial(false);
                if (!isPlaying && !isFinished) startGame();
              }}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-md transition-all text-xs"
            >
              Đã Hiểu Quy Luật — Bắt Đầu Ngay
            </button>
          </div>
        </div>
      )}

      {/* Game Result Modal */}
      {isFinished && showResultModal && (
        <GameResultModal
          score={calculatedScore}
          accuracyRate={accuracyRate}
          timeSpentSec={elapsedSec}
          playedLevel={effectiveLevel}
          isCustom={isCustom}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={startGame}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
