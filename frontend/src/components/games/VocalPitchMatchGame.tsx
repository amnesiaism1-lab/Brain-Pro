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
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [isFinished, setIsFinished] = useState(false);

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
    setCurrentRound(roundNum);
    setActiveNoteIndex(0);
    setCurrentHoldMs(0);
    setEvaluation(null);

    const targets = generateTargets();
    setTargetNotes(targets);

    // Phase: Play audio prompt
    setPhase('prompt');

    try {
      await auditoryEngine.resumeAudioContext();

      // Play prompt sequence
      for (let i = 0; i < targets.length; i++) {
        auditoryEngine.playNote(targets[i].note, 0.9, { volume: 0.65, timbrePreset: 'acoustic-piano' });
        await new Promise((r) => setTimeout(r, 900));
      }

      // If reference drone is enabled for early levels, start a quiet drone
      if (params.referenceDrone || enableTonicAnchor) {
        auditoryEngine.startDrone(targets[0].note, 0.12);
      }

      // Phase: Countdown
      setPhase('countdown');
      setCountdownNum(3);
      for (let c = 3; c > 0; c--) {
        setCountdownNum(c);
        playSound('click');
        await new Promise((r) => setTimeout(r, 700));
      }

      // Phase: Singing
      setPhase('singing');
      lastFrameTimestampRef.current = performance.now();
    } catch (e) {
      console.error('Audio prompt error:', e);
      setPhase('singing');
    }
  }, [generateTargets, params.referenceDrone, enableTonicAnchor, playSound]);

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

  // Subscribe to live microphone pitch detection
  useEffect(() => {
    if (phase !== 'singing') return;

    vocalPitchService.startListening().catch((err) => {
      console.warn('Microphone start error:', err);
    });

    const unsubscribe = vocalPitchService.subscribe((currentReading) => {
      setReading(currentReading);

      // Evaluate match against current target note
      const evalResult = vocalPitchService.evaluatePitchMatch(
        currentReading,
        currentTarget.note,
        toleranceCents,
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
          targetNote: currentTarget.note,
          matched: evalResult.matched,
        });
      }

      // Delta time accumulation for holding the pitch
      const dt = now - lastFrameTimestampRef.current;
      lastFrameTimestampRef.current = now;

      if (evalResult.matched && currentReading.isSinging) {
        setCurrentHoldMs((prev) => {
          const next = prev + dt;
          if (next >= currentTarget.holdDurationMs) {
            // Success on this note!
            handleNoteSuccess(currentTarget.note);
            return 0;
          }
          return next;
        });
        setConsecutiveInTuneStreak((s) => s + 1);
      } else {
        // Slowly decay hold progress if voice wavers out of tune
        setCurrentHoldMs((prev) => Math.max(0, prev - dt * 0.4));
        setConsecutiveInTuneStreak(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [phase, currentTarget, toleranceCents]);

  // Handle note match success
  const handleNoteSuccess = (matchedNote: string) => {
    playSound('correct');

    // Emit Relational Event (SIMILARITY_DIFF)
    emitTrialEvent({
      exerciseSlug: 'vocal-pitch-match',
      level: currentLevel,
      relationId: 'SIMILARITY_DIFF',
      relationWeight: 1.0,
      entities: {
        targetNote: matchedNote,
        toleranceCents,
        requiredHoldMs,
      },
      stateBefore: 'SEEKING_PITCH',
      stateAfter: 'PITCH_MATCHED',
      responseMs: Math.round(currentHoldMs),
      correct: true,
      extra: {
        centsDeviation: evaluation?.centsDiff ?? 0,
        octaveOffset: evaluation?.octaveOffset ?? 0,
      },
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.65 },
      });
    } catch {}

    // Check if more notes in sequence
    if (activeNoteIndex + 1 < targetNotes.length) {
      setActiveNoteIndex((idx) => idx + 1);
      setCurrentHoldMs(0);
    } else {
      // Completed entire round!
      setCorrectRounds((r) => r + 1);
      const points = Math.round(100 * (1 + (toleranceCents <= 20 ? 0.4 : 0.1)));
      setScore((s) => s + points);

      if (currentRound < totalRounds) {
        setPhase('feedback');
        setTimeout(() => {
          startRound(currentRound + 1);
        }, 1200);
      } else {
        // All rounds complete!
        finishGame();
      }
    }
  };

  // Finish Game
  const finishGame = useCallback(() => {
    auditoryEngine.stopDrone();
    vocalPitchService.stopListening();
    setPhase('finished');
    setIsFinished(true);
  }, []);

  // Overall timer
  useEffect(() => {
    if (phase !== 'singing' || isFinished) return;

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
  }, [phase, isFinished, finishGame]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      auditoryEngine.stopDrone();
      vocalPitchService.stopListening();
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

        {/* Timer & Score Readout */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
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

      {/* Center Interactive Arena */}
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 my-2">
        {/* Phase: Prompt Playing Notice */}
        {phase === 'prompt' && (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 shadow-2xl animate-pulse">
            <Volume2 className="w-6 h-6 text-indigo-400 animate-bounce" />
            <div className="text-left">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-indigo-400">Đang phát âm thanh mẫu...</span>
              <div className="text-base font-bold text-white">Lắng nghe kỹ cao độ nốt {currentTarget.note} ({currentTarget.solfege})</div>
            </div>
          </div>
        )}

        {/* Phase: 3-2-1 Countdown */}
        {phase === 'countdown' && (
          <div className="flex flex-col items-center justify-center my-6">
            <span className="text-6xl font-black font-mono text-emerald-400 animate-ping">
              {countdownNum}
            </span>
            <span className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-4">
              Chuẩn bị cất giọng...
            </span>
          </div>
        )}

        {/* Phase: Feedback Transition */}
        {phase === 'feedback' && (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-2xl animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div className="text-left">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">Xuất Sắc!</span>
              <div className="text-base font-bold text-white">Bạn đã giữ vững cao độ nốt {currentTarget.note}!</div>
            </div>
          </div>
        )}

        {/* Phase: Active Singing Arena */}
        {(phase === 'singing' || phase === 'prompt') && (
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
        )}
      </div>

      {/* Bottom Status / Advice Footer */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-indigo-400" />
          <span>Mẹo: Thả lỏng cơ hàm và lấy hơi từ bụng để giữ cao độ ổn định.</span>
        </div>

        <button
          onClick={() => setShowPreflightModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-medium transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kiểm tra Micro</span>
        </button>
      </div>

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
