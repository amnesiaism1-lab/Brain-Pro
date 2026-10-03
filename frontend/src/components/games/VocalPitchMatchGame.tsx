import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { 
  calculateGameScore, 
  INFINITY_ROMAN_NUMERALS, 
  EXERCISES_METADATA,
  VocalRangePreference,
  IVocalPitchTracePoint
} from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { getNoteFrequency } from '../../services/musicTheoryService';
import { 
  vocalPitchService, 
  IVocalPitchReading, 
  IVocalPitchMatchEvaluation 
} from '../../services/vocalPitchService';
import { CentsTunerGauge } from '../ui/CentsTunerGauge';
import { VocalPitchRibbonCanvas } from '../ui/VocalPitchRibbonCanvas';
import { VocalPreflightModal } from '../ui/VocalPreflightModal';
import { VocalStudioModal } from '../vocal-studio/VocalStudioModal';
import { 
  Mic, 
  Volume2, 
  RotateCcw, 
  Play, 
  Sparkles, 
  Headphones, 
  CheckCircle2, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Music
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';

type GamePhase = 'preflight' | 'prompt' | 'countdown' | 'singing' | 'feedback' | 'finished';

interface TargetNoteItem {
  note: string;
  solfege: string;
  holdDurationMs: number;
}

export const VocalPitchMatchGame: React.FC = () => {
  const { 
    getExerciseLevel, 
    setExerciseLevel,
    setActiveGameSlug, 
    playSound,
    enableTonicAnchor
  } = useAppStore();
  const { trackWrongAnswer } = useWrongAnswerTracker('vocal-pitch-match');
  const sessionIdRef = useRef<string>(`session-vocal-${Date.now()}`);

  const currentLevel = getExerciseLevel('vocal-pitch-match') || 1;
  const isInfinity = currentLevel > 12;
  const infinityTier = isInfinity ? currentLevel - 12 : null;

  // Level configuration
  const exerciseMeta = useMemo(() => EXERCISES_METADATA.find(e => e.slug === 'vocal-pitch-match'), []);
  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === currentLevel) || {
      level: currentLevel,
      timeLimitSec: 45,
      targetItemCount: 3,
      parametersJson: {
        noteCount: 1,
        centsTolerance: 40,
        holdDurationMs: 1800,
        referenceDrone: false,
        sequenceType: 'single',
      },
    };
  }, [exerciseMeta, currentLevel]);

  const params = (levelConfig.parametersJson || {}) as {
    noteCount?: number;
    centsTolerance?: number;
    holdDurationMs?: number;
    referenceDrone?: boolean;
    sequenceType?: string;
  };

  const toleranceCents = params.centsTolerance ?? 35;
  const requiredHoldMs = params.holdDurationMs ?? 1800;
  const totalRounds = levelConfig.targetItemCount ?? 3;
  const timeLimitSec = levelConfig.timeLimitSec ?? 45;

  // Session & Relational Dynamics
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  // State
  const [phase, setPhase] = useState<GamePhase>('preflight');
  const [currentRound, setCurrentRound] = useState(1);
  const [targetNotes, setTargetNotes] = useState<TargetNoteItem[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [currentHoldMs, setCurrentHoldMs] = useState(0);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [consecutiveInTuneStreak, setConsecutiveInTuneStreak] = useState(0);

  // Live Audio Telemetry
  const [reading, setReading] = useState<IVocalPitchReading | null>(null);
  const [evaluation, setEvaluation] = useState<IVocalPitchMatchEvaluation | null>(null);
  const pitchTraceRef = useRef<IVocalPitchTracePoint[]>([]);
  const lastSampleTimeRef = useRef<number>(0);
  const lastFrameTimestampRef = useRef<number>(performance.now());

  // Modal states
  const [showPreflightModal, setShowPreflightModal] = useState(true);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const hasFinishedRef = useRef(false);

  // Active target note
  const currentTarget = targetNotes[activeNoteIndex] || {
    note: 'C4',
    solfege: 'Đô 4',
    holdDurationMs: requiredHoldMs,
  };

  // Generate target notes based on level and user's vocal range
  const generateTargets = useCallback((): TargetNoteItem[] => {
    const range = vocalPitchService.getUserRange();
    let octave = 4;
    if (range === 'bass-baritone') octave = 3;
    else if (range === 'soprano') octave = 4;

    const baseNotes = [
      { n: 'C', s: 'Đô' },
      { n: 'D', s: 'Rê' },
      { n: 'E', s: 'Mi' },
      { n: 'F', s: 'Fa' },
      { n: 'G', s: 'Sol' },
      { n: 'A', s: 'La' },
      { n: 'B', s: 'Si' },
    ];

    const noteCount = params.noteCount ?? 1;
    const items: TargetNoteItem[] = [];

    if (noteCount === 1) {
      const pick = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      items.push({
        note: `${pick.n}${octave}`,
        solfege: `${pick.s} ${octave}`,
        holdDurationMs: requiredHoldMs,
      });
    } else {
      // Sequence: e.g. intervals, triad arpeggios
      const startIndex = Math.floor(Math.random() * 3);
      for (let i = 0; i < noteCount; i++) {
        const step = (startIndex + i * 2) % baseNotes.length;
        const pick = baseNotes[step];
        items.push({
          note: `${pick.n}${octave}`,
          solfege: `${pick.s} ${octave}`,
          holdDurationMs: requiredHoldMs,
        });
      }
    }

    return items;
  }, [params.noteCount, requiredHoldMs]);

  // Start new round
  const startRound = useCallback(async (roundNum: number) => {
    hasFinishedRef.current = false;
    isHandlingSuccessRef.current = false;
    holdMsRef.current = 0;
    setCurrentRound(roundNum);
    currentRoundRef.current = roundNum;
    setActiveNoteIndex(0);
    activeNoteIndexRef.current = 0;
    setCurrentHoldMs(0);
    setEvaluation(null);

    const targets = generateTargets();
    setTargetNotes(targets);
    targetNotesRef.current = targets;
    if (targets[0]) {
      currentTargetRef.current = targets[0];
    }

    // Phase: Play audio prompt
    setPhase('prompt');
    phaseRef.current = 'prompt';

    try {
      await auditoryEngine.resumeAudioContext();

      // Play prompt sequence
      for (let i = 0; i < targets.length; i++) {
        auditoryEngine.playNote(targets[i].note, 0.9, { volume: 0.65, timbrePreset: 'acoustic-piano' });
        await new Promise((r) => setTimeout(r, 900));
      }

      // Ensure no drone leaks into mic
      auditoryEngine.stopDrone();

      // Phase: Countdown
      setPhase('countdown');
      phaseRef.current = 'countdown';
      setCountdownNum(3);
      for (let c = 3; c > 0; c--) {
        setCountdownNum(c);
        playSound('click');
        await new Promise((r) => setTimeout(r, 700));
      }

      // Phase: Singing
      setPhase('singing');
      phaseRef.current = 'singing';
      isHandlingSuccessRef.current = false;
      holdMsRef.current = 0;
      setCurrentHoldMs(0);
      lastFrameTimestampRef.current = performance.now();
    } catch (e) {
      console.error('Audio prompt error:', e);
      setPhase('singing');
      phaseRef.current = 'singing';
      isHandlingSuccessRef.current = false;
      holdMsRef.current = 0;
      setCurrentHoldMs(0);
      lastFrameTimestampRef.current = performance.now();
    }
  }, [generateTargets, playSound]);

  // Replay current target note
  const handleReplayPrompt = useCallback(() => {
    if (currentTarget?.note) {
      auditoryEngine.playNote(currentTarget.note, 0.8, { volume: 0.7, timbrePreset: 'acoustic-piano' });
    }
  }, [currentTarget]);

  // Keyboard shortcut: Space to replay note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (phase === 'singing' || phase === 'prompt')) {
        e.preventDefault();
        handleReplayPrompt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleReplayPrompt]);

  // Handle Pre-flight modal completion
  const handlePreflightProceed = (range: VocalRangePreference) => {
    vocalPitchService.setUserRange(range);
    setShowPreflightModal(false);
    resetSession();
    setTimeLeft(timeLimitSec);
    setScore(0);
    setCorrectRounds(0);
    pitchTraceRef.current = [];
    startRound(1);
  };

  // Synchronization & Audio Loop Refs
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const currentTargetRef = useRef<TargetNoteItem>(currentTarget);
  currentTargetRef.current = currentTarget;

  const toleranceCentsRef = useRef<number>(toleranceCents);
  toleranceCentsRef.current = toleranceCents;

  const activeNoteIndexRef = useRef<number>(activeNoteIndex);
  activeNoteIndexRef.current = activeNoteIndex;

  const targetNotesRef = useRef<TargetNoteItem[]>(targetNotes);
  targetNotesRef.current = targetNotes;

  const currentRoundRef = useRef<number>(currentRound);
  currentRoundRef.current = currentRound;

  const totalRoundsRef = useRef<number>(totalRounds);
  totalRoundsRef.current = totalRounds;

  const lastInTuneTimeRef = useRef<number>(0);
  const holdMsRef = useRef<number>(0);
  const isHandlingSuccessRef = useRef<boolean>(false);

  // Forward ref for handleNoteSuccess so audio subscription loop always calls the freshest handler
  const handleNoteSuccessRef = useRef<(matchedNote: string) => void>(() => {});

  // Subscribe to live microphone pitch detection - stays active throughout game to prevent cold-start latency
  useEffect(() => {
    if (showPreflightModal || isFinished || showStudioModal) return;

    vocalPitchService.startListening().catch((err) => {
      console.warn('Microphone start error:', err);
    });

    const unsubscribe = vocalPitchService.subscribe((currentReading) => {
      setReading(currentReading);

      const target = currentTargetRef.current;
      const tolCents = toleranceCentsRef.current;
      const currentPhase = phaseRef.current;

      // Evaluate match against current target note
      const evalResult = vocalPitchService.evaluatePitchMatch(
        currentReading,
        target.note,
        tolCents,
        false // Smart Octave-folding enabled for natural singing comfort
      );
      setEvaluation(evalResult);

      // Downsample pitch telemetry (~10 samples per second)
      const now = performance.now();
      if (now - lastSampleTimeRef.current >= 100) {
        lastSampleTimeRef.current = now;
        pitchTraceRef.current.push({
          tMs: Math.round(now),
          freqHz: currentReading.freqHz,
          cents: evalResult.centsDiff,
          clarity: currentReading.clarity,
          targetNote: target.note,
          matched: evalResult.matched,
        });
      }

      // Delta time accumulation for holding the pitch
      const dt = Math.min(100, Math.max(0, now - lastFrameTimestampRef.current));
      lastFrameTimestampRef.current = now;

      // Only accumulate note hold progress during active singing phase
      if (currentPhase === 'singing') {
        if (evalResult.matched && currentReading.isSinging) {
          lastInTuneTimeRef.current = now;
          holdMsRef.current += dt;

          // Check if target hold duration reached (execute success outside setState updater!)
          if (holdMsRef.current >= target.holdDurationMs) {
            if (!isHandlingSuccessRef.current) {
              isHandlingSuccessRef.current = true;
              holdMsRef.current = target.holdDurationMs;
              setCurrentHoldMs(target.holdDurationMs);
              handleNoteSuccessRef.current(target.note);
            }
            return;
          }

          setCurrentHoldMs(holdMsRef.current);
          setConsecutiveInTuneStreak((s) => s + 1);
        } else {
          // Grace period: allow 250ms of breath/vibrato waver before decaying hold progress
          const timeSinceInTune = now - lastInTuneTimeRef.current;
          if (timeSinceInTune > 250) {
            holdMsRef.current = Math.max(0, holdMsRef.current - dt * 0.35);
            setCurrentHoldMs(holdMsRef.current);
            setConsecutiveInTuneStreak(0);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showPreflightModal, isFinished, showStudioModal]);

  // Handle note match success
  const handleNoteSuccess = (matchedNote: string) => {
    try {
      playSound('correct');
    } catch {}

    const activeIdx = activeNoteIndexRef.current;
    const targets = targetNotesRef.current;
    const round = currentRoundRef.current;
    const total = totalRoundsRef.current;

    // Emit Relational Event (SIMILARITY_DIFF)
    try {
      emitTrialEvent({
        exerciseSlug: 'vocal-pitch-match',
        level: currentLevel,
        relationId: 'SIMILARITY_DIFF',
        relationWeight: 1.0,
        entities: {
          targetNote: matchedNote,
          toleranceCents: toleranceCentsRef.current,
          requiredHoldMs,
        },
        stateBefore: 'SEEKING_PITCH',
        stateAfter: 'PITCH_MATCHED',
        responseMs: Math.round(holdMsRef.current),
        correct: true,
        extra: {
          centsDeviation: evaluation?.centsDiff ?? 0,
          octaveOffset: evaluation?.octaveOffset ?? 0,
        },
      });
    } catch (err) {
      console.warn('Trial event telemetry warning:', err);
    }

    // Confetti celebration
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.65 },
      });
    } catch {}

    // Check if more notes in sequence
    if (activeIdx + 1 < targets.length) {
      activeNoteIndexRef.current = activeIdx + 1;
      setActiveNoteIndex(activeIdx + 1);
      holdMsRef.current = 0;
      setCurrentHoldMs(0);
      lastInTuneTimeRef.current = 0;
      setTimeout(() => {
        isHandlingSuccessRef.current = false;
      }, 400);
    } else {
      // Completed entire round!
      setCorrectRounds((r) => r + 1);
      const points = Math.round(100 * (1 + (toleranceCentsRef.current <= 20 ? 0.4 : 0.1)));
      setScore((s) => s + points);

      if (round < total) {
        setPhase('feedback');
        phaseRef.current = 'feedback';
        setTimeout(() => {
          holdMsRef.current = 0;
          setCurrentHoldMs(0);
          lastInTuneTimeRef.current = 0;
          isHandlingSuccessRef.current = false;
          startRound(round + 1);
        }, 1200);
      } else {
        // All rounds complete!
        finishGame();
      }
    }
  };

  handleNoteSuccessRef.current = handleNoteSuccess;

  // Finish Game
  const finishGame = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    auditoryEngine.stopDrone();
    vocalPitchService.stopListening(true);
    setPhase('finished');
    setIsFinished(true);

    if (correctRounds < totalRounds && currentTargetRef.current?.note) {
      const target = currentTargetRef.current;
      trackWrongAnswer({
        round: currentRoundRef.current,
        difficultyLevel: currentLevel,
        questionContext: {
          targetNoteName: target.note,
          centsTolerance: toleranceCentsRef.current
        },
        correctAnswer: {
          label: `Nốt mục tiêu: ${target.note}`,
          code: target.note
        },
        userAnswer: {
          label: reading?.noteName ? `Nốt hát được: ${reading.noteName} (${Math.round(evaluation?.centsDiff ?? 0)} cents)` : 'Lệch cao độ / Chưa hoàn thành giữ nốt',
          code: reading?.noteName || 'pitch-drift',
          centsDeviation: Math.round(evaluation?.centsDiff ?? 0)
        },
        responseTimeMs: Math.round((timeLimitSec - timeLeft) * 1000),
        sessionId: sessionIdRef.current
      });
    }
  }, [correctRounds, totalRounds, currentLevel, reading, evaluation, timeLimitSec, timeLeft, trackWrongAnswer]);

  // Overall timer
  useEffect(() => {
    if (phase !== 'singing' || isFinished || showStudioModal) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isFinished, showStudioModal, finishGame]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      auditoryEngine.stopDrone();
      vocalPitchService.stopListening(true);
    };
  }, []);

  // Computed results
  const holdProgressPct = Math.min(100, (currentHoldMs / currentTarget.holdDurationMs) * 100);
  const accuracyRate = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;
  const timeSpentSec = timeLimitSec - timeLeft;

  const finalScore = useMemo(() => {
    return calculateGameScore({
      level: currentLevel,
      accuracyRate,
      timeSpentSec,
      timeLimitSec,
      baseScore: 100,
    });
  }, [currentLevel, accuracyRate, timeSpentSec, timeLimitSec]);

  return (
    <div className="relative min-h-[560px] w-full max-w-4xl mx-auto flex flex-col items-center justify-between p-4 md:p-6 bg-slate-950/60 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Pre-flight Modal */}
      <VocalPreflightModal
        isOpen={showPreflightModal}
        onClose={() => setActiveGameSlug(null)}
        onProceed={handlePreflightProceed}
      />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Mic className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black tracking-tight text-white">
                Cảm Âm & Dò Cao Độ Giọng Hát
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isInfinity ? 'bg-purple-950 text-purple-300 border border-purple-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
              }`}>
                {isInfinity ? `Tier ${INFINITY_ROMAN_NUMERALS[infinityTier || 1]}` : `Cấp ${currentLevel}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Vòng {currentRound}/{totalRounds} • Ngưỡng sai số: ±{toleranceCents} cents • Giữ {requiredHoldMs / 1000}s
            </p>
          </div>
        </div>

        {/* Timer & Score Readout + Studio MP3 Launcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStudioModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-indigo-400/40 transition hover:scale-105 active:scale-95"
            title="Import file nhạc MP3/WAV để phân tích nốt & luyện hát theo ca sĩ"
          >
            <Music className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
            <span className="hidden sm:inline">Studio Luyện MP3</span>
            <span className="sm:hidden">Studio MP3</span>
          </button>

          <div className="flex flex-col items-end pl-3 border-l border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Thời gian</span>
            <span className={`text-base font-mono font-bold ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex flex-col items-end pl-3 border-l border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Điểm</span>
            <span className="text-base font-mono font-black text-amber-400">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Center Interactive Arena - ALWAYS MOUNTED to eliminate lag and flicker */}
      <div className="w-full flex-1 relative flex flex-col items-center justify-center gap-4 my-2 min-h-[380px]">
        {/* Phase: Prompt Playing Notice Banner */}
        {phase === 'prompt' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/60 text-indigo-200 shadow-2xl backdrop-blur-md animate-pulse">
            <Volume2 className="w-5 h-5 text-indigo-400 animate-bounce shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-300">Đang phát nốt mẫu</span>
              <div className="text-sm font-bold text-white leading-tight">
                Lắng nghe: {currentTarget.note} ({currentTarget.solfege})
              </div>
            </div>
          </div>
        )}

        {/* Phase: 3-2-1 Countdown Overlay */}
        {phase === 'countdown' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs rounded-3xl pointer-events-none transition-all">
            <span className="text-7xl font-black font-mono text-emerald-400 animate-ping">
              {countdownNum}
            </span>
            <span className="text-sm font-bold text-slate-200 uppercase tracking-widest mt-4">
              Chuẩn bị cất giọng...
            </span>
          </div>
        )}

        {/* Phase: Feedback Transition Celebration Overlay */}
        {phase === 'feedback' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-3xl pointer-events-none">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 shadow-2xl animate-bounce">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">Xuất Sắc!</span>
                <div className="text-base font-bold text-white">Bạn đã giữ vững nốt {currentTarget.note}!</div>
              </div>
            </div>
          </div>
        )}

        {/* Live Arena Components - Continuously Active */}
        <div className="w-full flex flex-col gap-4">
          {/* 60 FPS Visual Ribbon Runway Canvas */}
          <VocalPitchRibbonCanvas
            reading={reading}
            evaluation={evaluation}
            currentTargetNote={currentTarget.note}
            toleranceCents={toleranceCents}
            holdProgressPct={holdProgressPct}
          />

          {/* Precision Cents Tuner HUD Gauge */}
          <CentsTunerGauge
            reading={reading}
            evaluation={evaluation}
            targetNote={currentTarget.note}
            targetSolfege={currentTarget.solfege}
            targetFreqHz={getNoteFrequency(currentTarget.note)}
            toleranceCents={toleranceCents}
            onReplayPrompt={handleReplayPrompt}
          />
        </div>
      </div>

      {/* Bottom Status / Advice Footer */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-indigo-400" />
          <span>Mẹo: Thả lỏng cơ hàm và lấy hơi từ bụng để giữ cao độ ổn định.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStudioModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border border-violet-700/60 font-semibold transition"
          >
            <Music className="w-3.5 h-3.5 text-violet-400" />
            <span>Studio MP3</span>
          </button>

          <button
            onClick={() => setShowPreflightModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-medium transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kiểm tra Micro</span>
          </button>
        </div>
      </div>

      {/* Vocal Studio Modal (Import MP3, Analysis & Sing-Along) */}
      <VocalStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        onOpenPreflightModal={() => setShowPreflightModal(true)}
      />

      {/* Game Result Modal */}
      {isFinished && (
        <GameResultModal
          score={finalScore}
          accuracyRate={accuracyRate}
          timeSpentSec={timeSpentSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            setIsFinished(false);
            setTimeLeft(timeLimitSec);
            setScore(0);
            setCorrectRounds(0);
            startRound(1);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
