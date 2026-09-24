import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateIntervalQuestion, IIntervalInfo } from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Sliders, Volume2, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export const IntervalIdentifyGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('interval-identify') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Determine allowed pool
  const intervalPool = effectiveLevel <= 2
    ? ['1P', '3M', '5P', '8P']
    : effectiveLevel <= 4
    ? ['2M', '3m', '3M', '4P', '5P', '6M', '8P']
    : effectiveLevel <= 6
    ? ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M', '8P']
    : ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M', '8P'];

  const playbackMode: 'ascending' | 'descending' | 'harmonic' | 'mixed' =
    effectiveLevel >= 7 || effectiveLevel === 22 ? 'harmonic' : effectiveLevel >= 4 ? 'mixed' : 'ascending';

  const optionsCount = effectiveLevel >= 8 || isInfinity ? 5 : 4;
  const isHyperSpeed = effectiveLevel === 13;
  const isInversionMirror = effectiveLevel === 15;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [question, setQuestion] = useState<ReturnType<typeof generateIntervalQuestion> | null>(null);
  const [selectedOption, setSelectedOption] = useState<IIntervalInfo | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());

  const generateNextQuestion = useCallback(() => {
    const q = generateIntervalQuestion(intervalPool, playbackMode, optionsCount);
    setQuestion(q);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [intervalPool, playbackMode, optionsCount]);

  useEffect(() => {
    resetSession();
    generateNextQuestion();
  }, [effectiveLevel, resetSession, generateNextQuestion]);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play the interval
  const playCurrentInterval = useCallback(async () => {
    if (!question || isPlaying) return;
    setIsPlaying(true);
    auditoryEngine.initContext();

    const duration = isHyperSpeed ? 0.22 : 0.6;
    const gap = isHyperSpeed ? 160 : 420;

    await auditoryEngine.playInterval(
      question.rootNote,
      question.targetNote,
      question.playbackDirection,
      duration,
      gap
    );

    setIsPlaying(false);
    trialStartTimeRef.current = Date.now();
  }, [question, isPlaying, isHyperSpeed]);

  // Auto-play when question changes
  useEffect(() => {
    if (question && !isAnswered && !isPlaying) {
      const t = setTimeout(() => {
        playCurrentInterval();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [question, isAnswered, isPlaying, playCurrentInterval]);

  const handleSelectOption = (opt: IIntervalInfo) => {
    if (isAnswered || !question || isPlaying) return;

    setSelectedOption(opt);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const targetCode = isInversionMirror ? question.intervalInfo.inversionCode : question.intervalCode;
    const isCorrect = opt.code === targetCode;

    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 200);
    }

    emitTrialEvent({
      exerciseSlug: 'interval-identify',
      level: effectiveLevel,
      relationId: 'SIMILARITY_DIFF',
      entities: {
        target: `${question.rootNote}-${question.targetNote}`,
        response: opt.code
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
    }, 1400);
  };

  return (
    <div className="relative min-h-[560px] flex flex-col justify-between p-4 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Nhận Diện Quãng (Interval Identify)</h2>
              {isInfinity && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isInversionMirror
                ? '⚠️ Chế độ gương đảo: Chọn QUÃNG ĐẢO NGƯỢC (Inversion) của quãng bạn nghe'
                : 'Lắng nghe 2 nốt nhạc và chọn đúng tên quãng'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Câu: <span className="font-bold text-cyan-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Thời gian: <span className="font-bold text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Audio Playback Zone */}
      <div className="my-6 flex flex-col items-center">
        <FrequencySpectrum height={80} className="w-full max-w-sm mb-4" isActive={isPlaying} />

        <div className="flex items-center gap-3">
          <button
            onClick={playCurrentInterval}
            disabled={isPlaying}
            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 border transition-all ${
              isPlaying
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/40 hover:scale-105'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Đang phát quãng...' : 'Phát lại âm thanh'}
          </button>

          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            Chế độ: {question?.playbackDirection === 'harmonic' ? 'Hòa âm đồng thời' : question?.playbackDirection === 'descending' ? 'Đi xuống' : 'Đi lên'}
          </span>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto w-full my-4">
        {question?.options.map((opt) => {
          const isSelected = selectedOption?.code === opt.code;
          const targetCode = isInversionMirror ? question.intervalInfo.inversionCode : question.intervalCode;
          const isCorrect = opt.code === targetCode;

          let btnStyle = 'bg-slate-900/80 border-slate-700 hover:border-cyan-400 hover:bg-slate-800/80 text-white';
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
              key={opt.code}
              disabled={isAnswered || isPlaying}
              onClick={() => handleSelectOption(opt)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300">
                  {opt.code}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>{opt.semitones} nửa cung (semitones)</span>
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
