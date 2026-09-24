import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateRhythmPattern, IRhythmStep } from '../../services/musicTheoryService';
import { RhythmGrid } from '../ui/RhythmGrid';
import { Activity, Play, RotateCcw, Drum } from 'lucide-react';

export const RhythmRecallGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('rhythm-recall') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level configuration
  const stepCount = isInfinity
    ? (effectiveLevel === 14 ? 14 : 16)
    : effectiveLevel <= 3 ? 6 : effectiveLevel <= 6 ? 8 : effectiveLevel <= 8 ? 12 : 16;

  const bpm = isInfinity ? 130 : 85 + (effectiveLevel * 4);
  const isSwing = effectiveLevel === 9 || effectiveLevel === 13;
  const isMultiDrum = effectiveLevel >= 7 || effectiveLevel === 20;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 4;
  const [patternData, setPatternData] = useState<ReturnType<typeof generateRhythmPattern> | null>(null);
  const [phase, setPhase] = useState<'listen' | 'recall' | 'feedback'>('listen');
  const [currentPlayStep, setCurrentPlayStep] = useState<number>(-1);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [roundAccuracy, setRoundAccuracy] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const recallStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Generate new pattern
  const startNewRound = useCallback(() => {
    const data = generateRhythmPattern(stepCount, bpm, 0.5, {
      syncopated: effectiveLevel >= 5,
      accents: effectiveLevel >= 7,
      swing: isSwing,
      multiDrum: isMultiDrum
    });
    setPatternData(data);
    setUserTaps([]);
    setCurrentPlayStep(-1);
    setRoundAccuracy(null);
    setPhase('listen');
  }, [stepCount, bpm, effectiveLevel, isSwing, isMultiDrum]);

  useEffect(() => {
    resetSession();
    startNewRound();
  }, [effectiveLevel, resetSession, startNewRound]);

  // Global Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play audio pattern
  const playPattern = useCallback(async () => {
    if (!patternData || isPlayingAudio) return;
    setIsPlayingAudio(true);
    auditoryEngine.initContext();

    for (let i = 0; i < patternData.steps.length; i++) {
      const step = patternData.steps[i];
      setCurrentPlayStep(i);

      if (step.isHit) {
        auditoryEngine.playDrum(step.timbre || 'snare', step.isAccent ? 1.0 : 0.65);
      }

      await new Promise(r => setTimeout(r, patternData.stepIntervalMs));
    }

    setCurrentPlayStep(-1);
    setIsPlayingAudio(false);
    setPhase('recall');
    recallStartTimeRef.current = Date.now();
  }, [patternData, isPlayingAudio]);

  // Auto-play when round starts
  useEffect(() => {
    if (phase === 'listen' && patternData && !isPlayingAudio) {
      const t = setTimeout(() => {
        playPattern();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [phase, patternData, isPlayingAudio, playPattern]);

  // Handle user tap
  const handleUserTap = () => {
    if (phase !== 'recall' || !patternData) return;

    // Audio feedback on user tap
    auditoryEngine.playDrum('kick', 0.85);

    const elapsedFromRecall = Date.now() - recallStartTimeRef.current;
    // Map elapsed time to closest step
    const closestStep = Math.round(elapsedFromRecall / patternData.stepIntervalMs);

    if (closestStep >= 0 && closestStep < patternData.steps.length) {
      if (!userTaps.includes(closestStep)) {
        setUserTaps(prev => [...prev, closestStep]);
      }
    }
  };

  // Keyboard Space listener for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleUserTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Finish recall phase when time expires
  useEffect(() => {
    if (phase === 'recall' && patternData) {
      const timeout = setTimeout(() => {
        // Calculate score for this round
        const targetHits = patternData.steps.map((s, idx) => s.isHit ? idx : -1).filter(idx => idx !== -1);
        let matches = 0;
        targetHits.forEach(targetIdx => {
          // Allow ±1 step margin of error
          const hasMatch = userTaps.some(uIdx => Math.abs(uIdx - targetIdx) <= 1);
          if (hasMatch) matches++;
        });

        const acc = targetHits.length > 0 ? Math.round((matches / targetHits.length) * 100) : 100;
        setRoundAccuracy(acc);
        setPhase('feedback');

        const isRoundPassed = acc >= 60;
        auditoryEngine.playFeedback(isRoundPassed);

        if (isRoundPassed) {
          setCorrectRounds(prev => prev + 1);
          setScore(prev => prev + Math.round(acc * 2.5));
        }

        emitTrialEvent({
          exerciseSlug: 'rhythm-recall',
          level: effectiveLevel,
          relationId: 'TEMPORAL_PREDICT',
          entities: {
            target: targetHits.join(','),
            response: userTaps.join(',')
          },
          stateBefore: 'listen',
          stateAfter: 'recalled',
          responseMs: patternData.totalDurationMs,
          correct: isRoundPassed
        });

        setTimeout(() => {
          if (round >= maxRounds) {
            setIsFinished(true);
          } else {
            setRound(prev => prev + 1);
            startNewRound();
          }
        }, 1800);
      }, patternData.totalDurationMs + 500);

      return () => clearTimeout(timeout);
    }
  }, [phase, patternData, userTaps, round, maxRounds, emitTrialEvent, startNewRound]);

  return (
    <div className="relative min-h-[580px] flex flex-col justify-between p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Nhớ Nhịp Điệu (Rhythm Recall)</h2>
              {isInfinity && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-rose-400 to-pink-500 text-slate-950">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Lắng nghe tiết tấu nhịp rồi gõ lại bằng phím Space hoặc nút TAP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Hiệp: <span className="font-bold text-rose-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            BPM: <span className="font-bold text-cyan-400">{bpm}</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Status */}
      <div className="my-4 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
            phase === 'listen'
              ? 'bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse'
              : phase === 'recall'
              ? 'bg-rose-400/20 border-rose-400 text-rose-300 ring-2 ring-rose-400/40'
              : 'bg-emerald-400/20 border-emerald-400 text-emerald-300'
          }`}>
            {phase === 'listen' ? 'Đang phát tiết tấu mẫu...' : phase === 'recall' ? 'GÕ THEO NHỊP NGAY BÂY GIỜ!' : `Độ chính xác: ${roundAccuracy}%`}
          </div>

          {phase === 'recall' && (
            <button
              onClick={() => {
                setPhase('listen');
                playPattern();
              }}
              disabled={isPlayingAudio}
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Nghe lại
            </button>
          )}
        </div>

        {/* Step Sequencer Grid */}
        {patternData && (
          <RhythmGrid
            steps={patternData.steps}
            currentPlayStep={currentPlayStep}
            userTaps={userTaps}
            showTargetBeats={phase === 'listen' || phase === 'feedback'}
            isPlaying={isPlayingAudio}
            isUserTurn={phase === 'recall'}
            className="w-full max-w-3xl"
          />
        )}
      </div>

      {/* Big Tap Button */}
      <div className="flex flex-col items-center pb-4">
        <button
          type="button"
          onClick={handleUserTap}
          disabled={phase !== 'recall'}
          className={`w-40 h-40 rounded-full font-black text-xl flex flex-col items-center justify-center gap-2 transition-all duration-75 shadow-2xl active:scale-95 ${
            phase === 'recall'
              ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-rose-500/50 ring-8 ring-rose-500/30 cursor-pointer animate-pulse'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          <Drum className="w-8 h-8" />
          <span>GÕ NHỊP</span>
          <span className="text-[10px] font-mono tracking-wider text-rose-200">HOẶC [SPACE]</span>
        </button>
      </div>

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
            startNewRound();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
