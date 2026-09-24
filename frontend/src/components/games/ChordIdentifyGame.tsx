import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateChordQuestion, IChordTypeInfo } from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Layers, Volume2, RotateCcw, CheckCircle2, XCircle, Play } from 'lucide-react';

export const ChordIdentifyGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('chord-identify') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Determine allowed types based on level (memoized)
  const allowedChordTypes = useMemo(() => {
    if (effectiveLevel <= 2) return ['Major', 'Minor'];
    if (effectiveLevel <= 3) return ['Major', 'Minor', 'Diminished'];
    if (effectiveLevel <= 5) return ['Major', 'Minor', 'Diminished', 'Augmented'];
    if (effectiveLevel <= 7) return ['Major', 'Minor', 'Maj7', 'm7', 'dom7'];
    if (effectiveLevel <= 9) return ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'sus2', 'sus4'];
    return ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'm7b5', 'dim7', '9th'];
  }, [effectiveLevel]);

  const playbackMode: 'block' | 'arpeggio' = useMemo(() => {
    return effectiveLevel === 2 || effectiveLevel === 13 ? 'arpeggio' : 'block';
  }, [effectiveLevel]);

  const optionsCount = effectiveLevel >= 6 || isInfinity ? 4 : 3;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [question, setQuestion] = useState<ReturnType<typeof generateChordQuestion> | null>(null);
  const [selectedOption, setSelectedOption] = useState<IChordTypeInfo | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());

  const generateNextQuestion = useCallback(() => {
    const q = generateChordQuestion(allowedChordTypes, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'], optionsCount);
    setQuestion(q);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [allowedChordTypes, optionsCount]);

  useEffect(() => {
    resetSession();
    generateNextQuestion();
  }, [effectiveLevel, resetSession, generateNextQuestion]);

  // Global Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play chord
  const playCurrentChord = useCallback(async (qToPlay = question) => {
    if (!qToPlay || isPlaying) return;
    setIsPlaying(true);
    setHasStartedAudio(true);
    await auditoryEngine.resumeAudioContext();

    await auditoryEngine.playChord(
      qToPlay.notes,
      playbackMode,
      1.2,
      playbackMode === 'arpeggio' ? 80 : 0
    );

    setIsPlaying(false);
    trialStartTimeRef.current = Date.now();
  }, [question, isPlaying, playbackMode]);

  // Auto-play when question appears if audio was already started by user
  useEffect(() => {
    if (question && hasStartedAudio && !isAnswered && !isPlaying) {
      const t = setTimeout(() => {
        playCurrentChord(question);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [question, hasStartedAudio, isAnswered, isPlaying, playCurrentChord]);

  const handleSelectOption = (opt: IChordTypeInfo) => {
    if (isAnswered || !question || isPlaying) return;

    setSelectedOption(opt);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.type === question.chordType;
    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 220);
    }

    emitTrialEvent({
      exerciseSlug: 'chord-identify',
      level: effectiveLevel,
      relationId: 'IDENTITY_MATCH',
      entities: {
        target: question.notes.join(','),
        response: opt.type
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    // Advance
    setTimeout(() => {
      if (round >= maxRounds) {
        setIsFinished(true);
      } else {
        setRound(prev => prev + 1);
        generateNextQuestion();
      }
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Nhận Diện Hợp Âm (Chord Identify)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Lắng nghe màu sắc hòa âm và chọn đúng loại hợp âm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Câu: <span className="font-black text-purple-600 dark:text-purple-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-amber-600 dark:text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Playback Button */}
      <div className="my-6 flex flex-col items-center">
        <FrequencySpectrum height={85} className="w-full max-w-md mb-4 bg-slate-900 dark:bg-slate-950" isActive={isPlaying} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => playCurrentChord()}
            disabled={isPlaying}
            className={`px-7 py-3 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-2 border-purple-500 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 text-white border-2 border-purple-400 shadow-purple-600/30 hover:scale-105 cursor-pointer'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-5 h-5 animate-spin" />
                <span>Đang vang hợp âm...</span>
              </>
            ) : hasStartedAudio ? (
              <>
                <RotateCcw className="w-5 h-5" />
                <span>Nghe lại hợp âm</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu nghe hợp âm (Nhấn để phát)</span>
              </>
            )}
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Kiểu phát: {playbackMode === 'arpeggio' ? 'Rải ngón (Arpeggio)' : 'Đồng thanh (Block Chord)'}
          </span>
        </div>

        {/* Reveal notes after answered */}
        {isAnswered && (
          <div className="mt-4 flex flex-wrap items-center gap-2 animate-fadeIn justify-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Các nốt trong hợp âm:</span>
            {question?.notes.map(n => (
              <span key={n} className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400 text-xs font-mono font-black text-purple-800 dark:text-purple-300 shadow-sm">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
        {question?.options.map((opt) => {
          const isSelected = selectedOption?.type === opt.type;
          const isCorrect = opt.type === question.chordType;

          let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
          if (isAnswered) {
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
              disabled={isAnswered || isPlaying}
              onClick={() => handleSelectOption(opt)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  {opt.type}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>{opt.feelDescription}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Modal */}
      {isFinished && (
        <GameResultModal
          score={calculateGameScore({
            level: effectiveLevel,
            accuracyRate: Math.round((correctCount / maxRounds) * 100),
            timeLimitSec: 60,
            timeSpentSec: elapsedSec
          })}
          accuracyRate={Math.round((correctCount / maxRounds) * 100)}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            setIsFinished(false);
            setRound(1);
            setCorrectCount(0);
            setScore(0);
            startTimeRef.current = Date.now();
            generateNextQuestion();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
