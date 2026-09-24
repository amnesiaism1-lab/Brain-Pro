import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateChordQuestion, IChordTypeInfo } from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Layers, Volume2, RotateCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export const ChordIdentifyGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('chord-identify') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Determine allowed types based on level
  const allowedChordTypes = effectiveLevel <= 2
    ? ['Major', 'Minor']
    : effectiveLevel <= 3
    ? ['Major', 'Minor', 'Diminished']
    : effectiveLevel <= 5
    ? ['Major', 'Minor', 'Diminished', 'Augmented']
    : effectiveLevel <= 7
    ? ['Major', 'Minor', 'Maj7', 'm7', 'dom7']
    : effectiveLevel <= 9
    ? ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'sus2', 'sus4']
    : ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'm7b5', 'dim7', '9th'];

  const playbackMode: 'block' | 'arpeggio' = effectiveLevel === 2 || effectiveLevel === 13 ? 'arpeggio' : 'block';
  const optionsCount = effectiveLevel >= 6 || isInfinity ? 4 : 3;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [question, setQuestion] = useState<ReturnType<typeof generateChordQuestion> | null>(null);
  const [selectedOption, setSelectedOption] = useState<IChordTypeInfo | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
  const playCurrentChord = useCallback(async () => {
    if (!question || isPlaying) return;
    setIsPlaying(true);
    auditoryEngine.initContext();

    await auditoryEngine.playChord(
      question.notes,
      playbackMode,
      1.2,
      playbackMode === 'arpeggio' ? 80 : 0
    );

    setIsPlaying(false);
    trialStartTimeRef.current = Date.now();
  }, [question, isPlaying, playbackMode]);

  // Auto-play when question appears
  useEffect(() => {
    if (question && !isAnswered && !isPlaying) {
      const t = setTimeout(() => {
        playCurrentChord();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [question, isAnswered, isPlaying, playCurrentChord]);

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
    <div className="relative min-h-[560px] flex flex-col justify-between p-4 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Nhận Diện Hợp Âm (Chord Identify)</h2>
              {isInfinity && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-400 to-indigo-500 text-slate-950">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Lắng nghe màu sắc hòa âm và chọn đúng loại hợp âm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Câu: <span className="font-bold text-purple-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Thời gian: <span className="font-bold text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Playback Button */}
      <div className="my-6 flex flex-col items-center">
        <FrequencySpectrum height={85} className="w-full max-w-md mb-4" isActive={isPlaying} />

        <div className="flex items-center gap-3">
          <button
            onClick={playCurrentChord}
            disabled={isPlaying}
            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 border transition-all ${
              isPlaying
                ? 'bg-purple-500/30 border-purple-400 text-purple-300 animate-pulse'
                : 'bg-purple-500 hover:bg-purple-400 text-slate-950 border-purple-300 shadow-lg shadow-purple-500/40 hover:scale-105'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Đang vang hợp âm...' : 'Phát lại hợp âm'}
          </button>

          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            Kiểu phát: {playbackMode === 'arpeggio' ? 'Rải ngón (Arpeggio)' : 'Đồng thanh (Block Chord)'}
          </span>
        </div>

        {/* Reveal notes after answered */}
        {isAnswered && (
          <div className="mt-4 flex items-center gap-2 animate-fadeIn">
            <span className="text-xs text-slate-400">Các nốt trong hợp âm:</span>
            {question?.notes.map(n => (
              <span key={n} className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400 text-xs font-mono font-bold text-purple-300">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-4">
        {question?.options.map((opt) => {
          const isSelected = selectedOption?.type === opt.type;
          const isCorrect = opt.type === question.chordType;

          let btnStyle = 'bg-slate-900/80 border-slate-700 hover:border-purple-400 hover:bg-slate-800/80 text-white';
          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500/30 border-rose-400 text-rose-200';
            } else {
              btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60';
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
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-purple-300">
                  {opt.type}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>{opt.feelDescription}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
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
