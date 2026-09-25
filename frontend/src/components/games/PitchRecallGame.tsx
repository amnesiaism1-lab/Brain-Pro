import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  generateRandomPitchSequence, 
  generateContourQuestion, 
  generateChromaticOddballQuestion, 
  getContourSampleNotes,
  generateOctaveLeapSequence,
  IMelodicContourInfo,
  MELODIC_CONTOURS
} from '../../services/musicTheoryService';
import { PianoKeyboard } from '../ui/PianoKeyboard';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { useMidiInput } from '../../hooks/useMidiInput';
import { Volume2, RotateCcw, Play, Music, Sparkles, GraduationCap, Zap, CheckCircle2, XCircle, ArrowRight, BookOpen, Anchor, TrendingUp } from 'lucide-react';

/**
 * Interactive SVG Trajectory Graph for Melodic Contour
 */
const MelodicContourGraph: React.FC<{ notes: string[]; className?: string }> = ({ notes, className = '' }) => {
  if (!notes || notes.length === 0) return null;

  const semitoneMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  const midiValues = notes.map(n => {
    const pitch = n.slice(0, -1);
    const oct = parseInt(n.slice(-1), 10) || 4;
    return (oct * 12) + (semitoneMap[pitch] ?? 0);
  });

  const minMidi = Math.min(...midiValues);
  const maxMidi = Math.max(...midiValues);
  const range = Math.max(3, maxMidi - minMidi);

  const width = 280;
  const height = 80;
  const padX = 28;
  const padY = 18;

  const points = midiValues.map((midi, i) => {
    const x = padX + (i / Math.max(1, midiValues.length - 1)) * (width - 2 * padX);
    const norm = (midi - minMidi) / range;
    const y = height - padY - norm * (height - 2 * padY);
    return { x, y, note: notes[i] };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`flex flex-col items-center bg-slate-900/95 rounded-2xl p-2.5 border border-slate-800 shadow-md ${className}`}>
      <span className="text-[10px] font-mono font-bold text-amber-400/90 mb-1 flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-amber-400" /> Quỹ đạo cao độ (Melodic Pitch Curve)
      </span>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="contourLineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {/* Trajectory Polyline */}
        <polyline
          fill="none"
          stroke="url(#contourLineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />
        {/* Note Key Points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              className="text-[9px] font-mono font-black fill-amber-300 drop-shadow-sm"
            >
              {p.note}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const PitchRecallGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug, 
    navigateToTheory,
    enableTonicAnchor,
    setEnableTonicAnchor
  } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('pitch-recall') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level configuration
  const isContourMode = effectiveLevel === 10;
  const isOctaveLeap = effectiveLevel === 11;
  const isOddballMode = effectiveLevel === 12;
  const isReverseRecall = effectiveLevel === 9;
  const isChromaticStorm = effectiveLevel === 13;
  const isTranspositionMode = effectiveLevel === 16;
  const isFibonacciTempo = effectiveLevel === 17;
  const isMicrotonal = effectiveLevel === 20;

  const sequenceLength = isInfinity
    ? Math.min(8, 4 + Math.floor(infinityTier / 2))
    : effectiveLevel <= 2 ? 3 : effectiveLevel <= 4 ? 4 : effectiveLevel <= 7 ? 5 : effectiveLevel <= 10 ? 6 : 7;

  const octaveRange = useMemo<[number, number]>(() => {
    if (effectiveLevel === 11) return [3, 5];
    return effectiveLevel >= 5 || isInfinity ? [4, 5] : [4, 4];
  }, [effectiveLevel, isInfinity]);

  const includeAccidentals = effectiveLevel >= 4 || isInfinity;
  const showVisualHints = effectiveLevel <= 2 && !isInfinity;
  const noteSpeedMs = effectiveLevel >= 10 ? 360 : 520;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 4;
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [recordedUserSequence, setRecordedUserSequence] = useState<string[]>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [phase, setPhase] = useState<'listen' | 'recall' | 'feedback'>('listen');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingComparison, setPlayingComparison] = useState<'target' | 'user' | null>(null);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLearnMode, setIsLearnMode] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; message: string; expected: string[] } | null>(null);

  // Contour & Oddball state (M1-1, M0-4)
  const [contourQuestion, setContourQuestion] = useState<ReturnType<typeof generateContourQuestion> | null>(null);
  const [selectedContourType, setSelectedContourType] = useState<string | null>(null);

  const [oddballQuestion, setOddballQuestion] = useState<ReturnType<typeof generateChromaticOddballQuestion> | null>(null);
  const [selectedOddballIdx, setSelectedOddballIdx] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const targetSeqRef = useRef<string[]>([]);

  // Generate new round
  const startNewRound = useCallback(() => {
    if (isContourMode) {
      const q = generateContourQuestion(['ascend', 'descend', 'arch', 'wave']);
      setContourQuestion(q);
      setSelectedContourType(null);
      targetSeqRef.current = q.notes;
      setTargetSequence(q.notes);
      setUserSequence([]);
      setLastFeedback(null);
      setPhase('listen');
    } else if (isOctaveLeap) {
      const seq = generateOctaveLeapSequence(sequenceLength);
      targetSeqRef.current = seq;
      setTargetSequence(seq);
      setUserSequence([]);
      setLastFeedback(null);
      setPhase('listen');
    } else if (isOddballMode) {
      const q = generateChromaticOddballQuestion('C4', 6);
      setOddballQuestion(q);
      setSelectedOddballIdx(null);
      targetSeqRef.current = q.notes;
      setTargetSequence(q.notes);
      setUserSequence([]);
      setLastFeedback(null);
      setPhase('listen');
    } else {
      const seq = generateRandomPitchSequence(
        sequenceLength,
        octaveRange[0] === octaveRange[1] ? [octaveRange[0]] : [4, 5],
        includeAccidentals
      );
      targetSeqRef.current = seq;
      setTargetSequence(seq);
      setUserSequence([]);
      setLastFeedback(null);
      setPhase('listen');
    }
  }, [sequenceLength, octaveRange, includeAccidentals, isContourMode, isOctaveLeap, isOddballMode]);

  // Initial setup on level change
  useEffect(() => {
    resetSession();
    playedRoundRef.current = 0;
    startNewRound();
  }, [effectiveLevel, resetSession, startNewRound]);

  // Check if audio context is active on mount
  useEffect(() => {
    if (auditoryEngine.isAudioActive()) {
      setHasStartedAudio(true);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play audio sequence when in listen phase
  const playSequence = useCallback(async (seqToPlay = targetSeqRef.current || targetSequence) => {
    if (seqToPlay.length === 0 || isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setIsPlayingAudio(true);
      setHasStartedAudio(true);
      setPhase('listen');
      const isFirstPlay = playedRoundRef.current !== round;
      playedRoundRef.current = round;

      await auditoryEngine.resumeAudioContext();

      // Pre-roll Tonic Anchor if enabled on first play of round
      if (enableTonicAnchor && isFirstPlay) {
        const anchorNote = seqToPlay[0] || 'C4';
        await auditoryEngine.playTonicAnchor(anchorNote, 'single', 0.65);
        await new Promise(r => setTimeout(r, 280));
      }

      for (let i = 0; i < seqToPlay.length; i++) {
        const note = seqToPlay[i];
        if (showVisualHints) {
          setActiveNotes([note]);
        }
        
        let delay = noteSpeedMs;
        if (isFibonacciTempo) {
          const fibDelays = [180, 240, 340, 520, 800];
          delay = fibDelays[i % fibDelays.length];
        }

        auditoryEngine.playNote(note, 0.45, {
          detuneCents: isMicrotonal ? (i % 2 === 0 ? 35 : -35) : 0
        });

        await new Promise(r => setTimeout(r, delay));
        if (showVisualHints) {
          setActiveNotes([]);
        }
        await new Promise(r => setTimeout(r, 60));
      }
    } catch (err) {
      console.warn('Pitch recall playback error:', err);
    } finally {
      isPlayingRef.current = false;
      setIsPlayingAudio(false);
      setActiveNotes([]);
      setPhase('recall');
      trialStartTimeRef.current = Date.now();
    }
  }, [targetSequence, showVisualHints, noteSpeedMs, isFibonacciTempo, isMicrotonal, round, enableTonicAnchor]);

  const handlePlayAnchor = async () => {
    if (isPlayingRef.current || targetSequence.length === 0) return;
    try {
      setIsPlayingAudio(true);
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playTonicAnchor(targetSequence[0] || 'C4', 'single', 0.8);
    } catch (err) {
      console.warn('Play anchor error:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Auto play sequence once when round starts IF user has already started audio
  useEffect(() => {
    if (phase === 'listen' && targetSequence.length > 0 && hasStartedAudio && !isPlayingAudio) {
      if (playedRoundRef.current !== round) {
        const timeout = setTimeout(() => {
          if (playedRoundRef.current !== round) {
            playSequence(targetSequence);
          }
        }, 400);
        return () => clearTimeout(timeout);
      }
    }
  }, [phase, round, targetSequence, hasStartedAudio, isPlayingAudio, playSequence]);

  const handleManualStart = async () => {
    await auditoryEngine.resumeAudioContext();
    setHasStartedAudio(true);
    playSequence(targetSequence);
  };

  // Handle user key click (from virtual piano or MIDI)
  const handleKeyClick = useCallback((note: string, velocity?: number) => {
    // If user clicks during listen phase, remind or free-play sound
    if (phase === 'listen') {
      auditoryEngine.resumeAudioContext().catch(() => {});
      const vel = velocity || 0.6;
      auditoryEngine.playNote(note, 0.35, { volume: Math.max(0.15, Math.pow(vel, 1.3) * 0.65) });
      return;
    }

    if (phase !== 'recall' || isPlayingRef.current) return;

    // Play clicked note sound immediately
    auditoryEngine.resumeAudioContext().catch(() => {});
    const vel = velocity || 0.65;
    auditoryEngine.playNote(note, 0.45, { volume: Math.max(0.18, Math.pow(vel, 1.3) * 0.7) });

    setUserSequence(prev => {
      const nextUserSeq = [...prev, note];

      // Flash key briefly
      setActiveNotes([note]);
      setTimeout(() => setActiveNotes([]), 180);

      // If reached expected length
      if (nextUserSeq.length >= targetSequence.length) {
        setPhase('feedback');
        const reactionMs = Date.now() - trialStartTimeRef.current;

        // Expected target sequence
        const expected = isReverseRecall ? [...targetSequence].reverse() : targetSequence;
        const isCorrect = nextUserSeq.every((n, idx) => n === expected[idx]);

        auditoryEngine.playFeedback(isCorrect);
        setRecordedUserSequence(nextUserSeq);

        if (isCorrect) {
          setCorrectRounds(p => p + 1);
          setScore(p => p + 250);
          setLastFeedback({
            isCorrect: true,
            message: 'Chính xác hoàn hảo!',
            expected
          });
        } else {
          setLastFeedback({
            isCorrect: false,
            message: `Chưa đúng! Chuỗi nốt đúng là: ${expected.join(' - ')}`,
            expected
          });
        }

        emitTrialEvent({
          exerciseSlug: 'pitch-recall',
          level: effectiveLevel,
          relationId: isReverseRecall ? 'ORDER_SEQUENCE' : 'IDENTITY_MATCH',
          entities: {
            target: targetSequence.join(','),
            response: nextUserSeq.join(',')
          },
          stateBefore: 'listen',
          stateAfter: 'recall',
          responseMs: reactionMs,
          correct: isCorrect
        });

        // If not in deliberate learn mode, auto-advance for fast pacing
        if (!isLearnMode) {
          setTimeout(() => {
            if (round >= maxRounds) {
              setIsFinished(true);
            } else {
              setRound(r => r + 1);
              startNewRound();
            }
          }, 1600);
        }
      }

      return nextUserSeq;
    });
  }, [phase, targetSequence, isReverseRecall, round, maxRounds, effectiveLevel, emitTrialEvent, startNewRound, isLearnMode]);

  // Hook up physical MIDI piano: hitting keys on external MIDI keyboard inputs answers!
  useMidiInput({
    autoPlayAudio: false, // handleKeyClick plays it
    onNoteOn: (note, velocity) => {
      handleKeyClick(note, velocity);
    }
  });

  const handleReplay = () => {
    if (!isPlayingRef.current) {
      setUserSequence([]);
      setPhase('listen');
      playSequence();
    }
  };

  // Play a sequence of notes for A/B comparison
  const playSequenceNotes = useCallback(async (seq: string[], type: 'target' | 'user') => {
    if (seq.length === 0 || isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setPlayingComparison(type);
      await auditoryEngine.resumeAudioContext();

      for (let i = 0; i < seq.length; i++) {
        const n = seq[i];
        setActiveNotes([n]);
        auditoryEngine.playNote(n, 0.45, { volume: 0.7 });
        await new Promise(r => setTimeout(r, noteSpeedMs));
        setActiveNotes([]);
        await new Promise(r => setTimeout(r, 60));
      }
    } catch (e) {
      console.warn('Comparison playback error:', e);
    } finally {
      isPlayingRef.current = false;
      setPlayingComparison(null);
      setActiveNotes([]);
    }
  }, [noteSpeedMs]);

  const handleSelectContour = (contour: IMelodicContourInfo) => {
    if (phase !== 'recall' || !contourQuestion) return;
    setSelectedContourType(contour.type);
    setPhase('feedback');
    const reactionMs = Date.now() - trialStartTimeRef.current;
    const isCorrect = contour.type === contourQuestion.targetContour.type;
    auditoryEngine.playFeedback(isCorrect);
    if (isCorrect) {
      setCorrectRounds(p => p + 1);
      setScore(p => p + 250);
      setLastFeedback({
        isCorrect: true,
        message: `Chính xác! Giai điệu chuyển động theo hướng ${contour.nameVi} (${contour.symbol})`,
        expected: contourQuestion.notes
      });
    } else {
      setLastFeedback({
        isCorrect: false,
        message: `Chưa đúng! Hướng chuẩn là: ${contourQuestion.targetContour.nameVi} (${contourQuestion.targetContour.symbol})`,
        expected: contourQuestion.notes
      });
    }
    emitTrialEvent({
      exerciseSlug: 'pitch-recall',
      level: effectiveLevel,
      relationId: 'SPATIAL_TRANSFORM',
      entities: {
        targetContour: contourQuestion.targetContour.type,
        selectedContour: contour.type
      },
      stateBefore: 'listen',
      stateAfter: 'feedback',
      responseMs: reactionMs,
      correct: isCorrect
    });
  };

  const handleSelectOddball = (idx: number) => {
    if (phase !== 'recall' || !oddballQuestion) return;
    setSelectedOddballIdx(idx);
    setPhase('feedback');
    const reactionMs = Date.now() - trialStartTimeRef.current;
    const isCorrect = idx === oddballQuestion.oddballIndex;
    auditoryEngine.playFeedback(isCorrect);
    if (isCorrect) {
      setCorrectRounds(p => p + 1);
      setScore(p => p + 250);
      setLastFeedback({
        isCorrect: true,
        message: `Chính xác! Nốt thứ ${idx + 1} (${oddballQuestion.oddballNote}) là nốt ngoại điệu`,
        expected: oddballQuestion.notes
      });
    } else {
      setLastFeedback({
        isCorrect: false,
        message: `Chưa đúng! Nốt ngoại điệu nằm ở vị trí thứ ${oddballQuestion.oddballIndex + 1} (${oddballQuestion.oddballNote})`,
        expected: oddballQuestion.notes
      });
    }
    emitTrialEvent({
      exerciseSlug: 'pitch-recall',
      level: effectiveLevel,
      relationId: 'TARGET_DISTRACTOR',
      entities: {
        targetIndex: oddballQuestion.oddballIndex,
        selectedIndex: idx,
        oddballNote: oddballQuestion.oddballNote
      },
      stateBefore: 'listen',
      stateAfter: 'feedback',
      responseMs: reactionMs,
      correct: isCorrect
    });
  };

  const handleProceedNextRound = useCallback(() => {
    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(r => r + 1);
      startNewRound();
    }
  }, [round, maxRounds, startNewRound]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isContourMode
                  ? 'Đường Nét Giai Điệu (Melodic Contour - Cấp 10)'
                  : isOctaveLeap
                  ? 'Bước Nhảy Bát Độ (Octave Leaps - Cấp 11)'
                  : isOddballMode
                  ? 'Nốt Ngoại Điệu (Chromatic Oddball - Cấp 12)'
                  : isReverseRecall
                  ? 'Nhớ Cao Độ Đảo Ngược (Reverse Recall - Cấp 9)'
                  : 'Nhớ Cao Độ (Pitch Recall)'}
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1] || 'INF'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {isContourMode
                ? 'Nhận diện hình dáng quỹ đạo của câu nhạc (Mã Parsons: Lên ↗, Xuống ↘, Cầu Vồng ∧, Lượn Sóng ∿)'
                : isOctaveLeap
                ? 'Phân biệt nốt cùng tên nhưng khác quãng tám (Pitch Chroma vs Pitch Height - Bước nhảy C3 ↔ C4 ↔ C5)'
                : isOddballMode
                ? 'Lắng nghe giai điệu trong âm giai Đô Trưởng và phát hiện nốt thăng lạ lẫm chen ngang'
                : isReverseRecall
                ? '⚠️ Chế độ đảo ngược: Nhập theo thứ tự TỪ CUỐI LÊN ĐẦU (Kích hoạt bộ nhớ làm việc thao tác ngược)'
                : 'Lắng nghe chuỗi nốt và bấm lại theo đúng thứ tự (Hỗ trợ đàn MIDI)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setIsLearnMode(!isLearnMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isLearnMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Bật/Tắt chế độ học sâu với gợi ý lý thuyết và đối chiếu âm thanh"
          >
            {isLearnMode ? (
              <>
                <GraduationCap className="w-4 h-4 text-amber-500" />
                <span>Chế độ: Học sâu</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-400" />
                <span>Chế độ: Thử thách</span>
              </>
            )}
          </button>

          {!isContourMode && !isOddballMode && (
            <button
              type="button"
              onClick={() => setEnableTonicAnchor(!enableTonicAnchor)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                enableTonicAnchor
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="Bật/Tắt Neo Âm Chủ (Tonic Anchor) - phát âm chuẩn nốt đầu tiên giúp định hình cao độ tương đối"
            >
              <Anchor className={`w-3.5 h-3.5 ${enableTonicAnchor ? 'text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Neo Âm Chủ</span>
            </button>
          )}

          {!isContourMode && !isOddballMode && <MidiStatusIndicator compact={true} />}
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Hiệp: <span className="font-black text-amber-600 dark:text-amber-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-cyan-600 dark:text-cyan-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Status */}
      <div className="my-4 flex flex-col items-center">
        <FrequencySpectrum height={75} className="w-full max-w-md mb-4 bg-slate-900 dark:bg-slate-950" isActive={isPlayingAudio} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!hasStartedAudio ? (
            <button
              type="button"
              onClick={handleManualStart}
              className="px-8 py-3.5 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-amber-500/40 hover:scale-105 cursor-pointer active:scale-95 animate-pulse"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU NGHE GIAI ĐIỆU (BẤM ĐỂ PHÁT)</span>
            </button>
          ) : (
            <div className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 border shadow-sm ${
              phase === 'listen'
                ? 'bg-amber-500/20 border-amber-400 text-amber-700 dark:text-amber-300 animate-pulse'
                : phase === 'recall'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-black'
                : 'bg-indigo-500/20 border-indigo-400 text-indigo-700 dark:text-indigo-300'
            }`}>
              <Volume2 className="w-4 h-4" />
              {phase === 'listen' 
                ? '🎧 Đang phát chuỗi nốt... Hãy lắng nghe kỹ!' 
                : phase === 'recall' 
                ? (isContourMode ? '📐 Hãy chọn hình dáng đường nét của giai điệu bên dưới' : isOddballMode ? '🎯 Hãy bấm vào nốt nào bạn nghe thấy là nốt ngoại điệu (lệch giọng)' : `🎹 Lượt của bạn: Hãy gõ các nốt (${userSequence.length}/${targetSequence.length})`) 
                : 'Đang đối chiếu...'}
            </div>
          )}

          {hasStartedAudio && phase === 'recall' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                disabled={isPlayingAudio}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Nghe lại chuỗi
              </button>
              {!isContourMode && !isOddballMode && targetSequence[0] && (
                <button
                  type="button"
                  onClick={handlePlayAnchor}
                  disabled={isPlayingAudio}
                  className="px-3.5 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-sm transition-all cursor-pointer"
                  title="Nghe lại nốt âm chủ đầu tiên để căn chuẩn thính giác"
                >
                  <Anchor className="w-3.5 h-3.5 text-amber-500" />
                  <span>Âm chủ: <strong>{targetSequence[0]}</strong></span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Progress Sequence Slots (Standard Mode Only) */}
        {!isContourMode && !isOddballMode && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            {targetSequence.map((_, idx) => {
              const userNote = userSequence[idx];
              return (
                <div
                  key={`slot-${idx}`}
                  className={`w-12 h-14 rounded-2xl flex items-center justify-center font-black font-mono text-base border-2 transition-all ${
                    userNote
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 shadow-inner'
                  }`}
                >
                  {userNote || (idx + 1)}
                </div>
              );
            })}
          </div>
        )}

        {lastFeedback && (
          <div className={`mt-3 text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl border ${
            lastFeedback.isCorrect ? 'bg-emerald-500/20 border-emerald-400 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/20 border-rose-400 text-rose-800 dark:text-rose-300'
          }`}>
            {lastFeedback.message}
          </div>
        )}
      </div>

      {/* Melodic Contour Options (Level 10) */}
      {isContourMode && contourQuestion && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {contourQuestion.options.map((opt) => {
            const isSelected = selectedContourType === opt.type;
            const isCorrect = opt.type === contourQuestion.targetContour.type;

            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
            if (phase === 'feedback') {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/50 font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
              } else {
                btnStyle = 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={opt.type}
                type="button"
                disabled={phase !== 'recall'}
                onClick={() => handleSelectContour(opt)}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{opt.symbol}</span>
                  <div>
                    <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.shapeDescriptionVi}</p>
                  </div>
                </div>
                {phase === 'feedback' && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {phase === 'feedback' && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Chromatic Oddball Selection (Level 12) */}
      {isOddballMode && oddballQuestion && (
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full my-4">
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 text-center">
            Bấm chọn nốt bạn cảm nhận là "nốt lạ" không thuộc âm giai Đô Trưởng:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {oddballQuestion.notes.map((note, idx) => {
              const isSelected = selectedOddballIdx === idx;
              const isTargetOddball = idx === oddballQuestion.oddballIndex;

              let btnStyle = 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500 hover:scale-105';
              if (phase === 'feedback') {
                if (isTargetOddball) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black ring-2 ring-emerald-500/50 scale-105';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                } else {
                  btnStyle = 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={`oddball-btn-${idx}`}
                  type="button"
                  disabled={phase !== 'recall'}
                  onClick={() => handleSelectOddball(idx)}
                  className={`w-16 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 shadow-md transition-all cursor-pointer active:scale-95 ${btnStyle}`}
                >
                  <span className="text-xs font-mono font-bold text-slate-500">Nốt {idx + 1}</span>
                  <span className="text-base font-black font-mono">
                    {phase === 'feedback' ? note : '?'}
                  </span>
                  {phase === 'feedback' && isTargetOddball && (
                    <span className="text-[10px] px-1 bg-emerald-500 text-white rounded font-bold">Lạ</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Piano Keyboard (Standard Mode Only) */}
      {!isContourMode && !isOddballMode && (
        <div className="flex flex-col items-center my-2">
          <PianoKeyboard
            octaveRange={octaveRange}
            activeNotes={activeNotes}
            selectedNotes={userSequence}
            wrongNotes={phase === 'feedback' && lastFeedback && !lastFeedback.isCorrect 
              ? recordedUserSequence.filter((n, idx) => n !== lastFeedback.expected[idx]) 
              : []
            }
            disabled={isPlayingAudio || (phase === 'feedback' && isLearnMode)}
            onKeyClick={handleKeyClick}
            showLabels={showVisualHints || effectiveLevel <= 4}
            enableMidiHighlight={true}
            autoPlayAudio={false}
          />
          <p className="text-[11px] text-slate-400 mt-2">
            💡 Bạn có thể click chuột vào phím đàn hoặc gõ trực tiếp trên đàn piano MIDI USB/Bluetooth.
          </p>
        </div>
      )}

      {/* Deliberate Learning & Audio Calibration Card */}
      {phase === 'feedback' && isLearnMode && lastFeedback && (
        <div className="w-full max-w-2xl mx-auto my-3 p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-amber-500/40 dark:border-amber-500/30 shadow-xl backdrop-blur-md animate-fadeIn">
          {/* Header result */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {lastFeedback.isCorrect ? (
                <>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Chính xác hoàn hảo!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tai bạn đã bắt chuẩn chính xác cao độ và chuỗi giai điệu.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">
                      Chưa chính xác — Hãy đối chiếu âm thanh
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nghe lại mẫu đúng và chuỗi bạn đã gõ để nhận diện sai lệch cao độ.</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleProceedNextRound}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>{round >= maxRounds ? 'Xem Kết Quả' : 'Câu Kế Tiếp'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sequences A/B Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
            {/* Target Sequence / Pattern */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {isContourMode ? 'Đường nét giai điệu chuẩn:' : isOddballMode ? 'Chuỗi nốt phát ra:' : `Chuỗi mẫu chuẩn ${isReverseRecall ? '(Đảo ngược)' : ''}:`}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {lastFeedback.expected.map((n, i) => (
                    <span 
                      key={i} 
                      className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border shadow-xs ${
                        isOddballMode && oddballQuestion && i === oddballQuestion.oddballIndex
                          ? 'bg-rose-500 text-white ring-2 ring-rose-400'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                {isOddballMode && oddballQuestion && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    💡 {oddballQuestion.explanationVi}
                  </p>
                )}
                {isContourMode && contourQuestion && (
                  <div className="mt-2.5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      💡 Mã Parsons: <strong className="text-amber-500">{contourQuestion.targetContour.parsonsPattern.join(' → ')}</strong> ({contourQuestion.targetContour.shapeDescriptionVi})
                    </p>
                    <MelodicContourGraph notes={lastFeedback.expected} className="mt-2" />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isPlayingAudio || playingComparison !== null}
                onClick={() => playSequenceNotes(lastFeedback.expected, 'target')}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Volume2 className={`w-3.5 h-3.5 ${playingComparison === 'target' ? 'animate-spin' : ''}`} />
                <span>{playingComparison === 'target' ? 'Đang phát...' : '🎧 Nghe lại chuỗi mẫu chuẩn'}</span>
              </button>
            </div>

            {/* User Input or Selection */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              lastFeedback.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div>
                <span className={`text-xs font-bold ${lastFeedback.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {isContourMode ? 'Lựa chọn của bạn:' : isOddballMode ? 'Vị trí bạn đã bấm:' : 'Chuỗi bạn đã bấm:'}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {isContourMode ? (
                    <div>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 inline-block">
                        {selectedContourType ? `${contourQuestion?.options.find(o => o.type === selectedContourType)?.symbol} ${contourQuestion?.options.find(o => o.type === selectedContourType)?.nameVi}` : 'Chưa chọn'}
                      </span>
                      {selectedContourType && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                          Mô tả: {contourQuestion?.options.find(o => o.type === selectedContourType)?.shapeDescriptionVi}
                        </p>
                      )}
                    </div>
                  ) : isOddballMode ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                      {selectedOddballIdx !== null ? `Nốt ${selectedOddballIdx + 1} (${oddballQuestion?.notes[selectedOddballIdx]})` : 'Chưa chọn'}
                    </span>
                  ) : (
                    recordedUserSequence.map((n, i) => {
                      const isNoteMatch = n === lastFeedback.expected[i];
                      return (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border shadow-xs ${
                            isNoteMatch
                              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/30 line-through'
                          }`}
                        >
                          {n}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {isContourMode && selectedContourType && !lastFeedback.isCorrect && (
                <button
                  type="button"
                  disabled={isPlayingAudio || playingComparison !== null}
                  onClick={() => playSequenceNotes(getContourSampleNotes(selectedContourType), 'user')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${playingComparison === 'user' ? 'animate-spin' : ''}`} />
                  <span>{playingComparison === 'user' ? 'Đang phát...' : '🔊 Nghe thử mẫu hình bạn đã chọn'}</span>
                </button>
              )}

              {!isContourMode && !isOddballMode && (
                <button
                  type="button"
                  disabled={isPlayingAudio || playingComparison !== null || recordedUserSequence.length === 0}
                  onClick={() => playSequenceNotes(recordedUserSequence, 'user')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${playingComparison === 'user' ? 'animate-spin' : ''}`} />
                  <span>{playingComparison === 'user' ? 'Đang phát...' : '🔊 Nghe lại chuỗi bạn đã bấm'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Theory Link & Hint */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400 text-xs italic">
              {isContourMode
                ? '💡 Parsons Code: U=Up, D=Down, R=Repeat. Bộ não xử lý hình dáng giai điệu trước khi phân tích từng cao độ tuyệt đối.'
                : isOctaveLeap
                ? '💡 Bát độ tương đương (Octave Equivalence): C3, C4, C5 cùng một sắc âm (Chroma) nhưng khác độ cao vật lý (Height).'
                : isOddballMode
                ? '💡 Mọi giai điệu phương Tây đều dựa trên hệ âm chuẩn (tonal context). Nốt lạ kích hoạt phản ứng thính giác MMN (Mismatch Negativity).'
                : isReverseRecall
                ? '💡 Đảo ngược chuỗi âm thanh yêu cầu vùng não thùy trán (DLPFC) lưu trữ và thao tác đảo ngược trong trí nhớ làm việc.'
                : '💡 Hãy chú ý cao độ tương đối giữa các nốt (nốt sau cao hơn hay trầm hơn nốt trước).'}
            </p>
            <button
              type="button"
              onClick={() => navigateToTheory('notes')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mở bài học: 1. Nốt Nhạc & Cao Độ</span>
            </button>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {isFinished && (
        <GameResultModal
          score={calculateGameScore({
            level: effectiveLevel,
            accuracyRate: Math.round((correctRounds / maxRounds) * 100),
            timeLimitSec: 60,
            timeSpentSec: elapsedSec
          })}
          accuracyRate={Math.round((correctRounds / maxRounds) * 100)}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            setIsFinished(false);
            setRound(1);
            setCorrectRounds(0);
            setScore(0);
            startTimeRef.current = Date.now();
            playedRoundRef.current = 0;
            startNewRound();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
