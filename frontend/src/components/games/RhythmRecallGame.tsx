import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateRhythmPattern, IRhythmStep } from '../../services/musicTheoryService';
import { RhythmGrid } from '../ui/RhythmGrid';
import { Activity, Play, RotateCcw, Drum, Volume2 } from 'lucide-react';

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
  const [phase, setPhase] = useState<'listen' | 'ready-to-tap' | 'tapping' | 'feedback'>('listen');
  const [currentPlayStep, setCurrentPlayStep] = useState<number>(-1);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [roundAccuracy, setRoundAccuracy] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const recallStartTimeRef = useRef<number>(0);

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
  const playPattern = useCallback(async (dataToPlay = patternData) => {
    if (!dataToPlay || isPlayingAudio) return;
    setIsPlayingAudio(true);
    setHasStartedAudio(true);
    await auditoryEngine.resumeAudioContext();

    for (let i = 0; i < dataToPlay.steps.length; i++) {
      const step = dataToPlay.steps[i];
      setCurrentPlayStep(i);

      if (step.isHit) {
        auditoryEngine.playDrum(step.timbre || 'snare', step.isAccent ? 1.0 : 0.65);
      }

      await new Promise(r => setTimeout(r, dataToPlay.stepIntervalMs));
    }

    setCurrentPlayStep(-1);
    setIsPlayingAudio(false);
    // Transition to waiting for first user tap to start Beat 1!
    setPhase('ready-to-tap');
  }, [patternData, isPlayingAudio]);

  // Auto-play when round starts IF audio was already unlocked
  useEffect(() => {
    if (phase === 'listen' && patternData && hasStartedAudio && !isPlayingAudio) {
      const t = setTimeout(() => {
        playPattern(patternData);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [phase, patternData, hasStartedAudio, isPlayingAudio, playPattern]);

  // Handle user tap (Anchored on first tap for Beat 1!)
  const handleUserTap = useCallback(() => {
    if (!patternData) return;

    if (phase === 'ready-to-tap') {
      // FIRST TAP: Anchor Beat 1 right here at t=0!
      recallStartTimeRef.current = Date.now();
      setUserTaps([0]);
      setCurrentPlayStep(0);
      setPhase('tapping');
      auditoryEngine.playDrum('kick', 0.9);
      return;
    }

    if (phase === 'tapping') {
      // Subsequent taps during active recall
      auditoryEngine.playDrum('kick', 0.85);

      const elapsedFromRecall = Date.now() - recallStartTimeRef.current;
      const closestStep = Math.round(elapsedFromRecall / patternData.stepIntervalMs);

      if (closestStep >= 0 && closestStep < patternData.steps.length) {
        setUserTaps(prev => (prev.includes(closestStep) ? prev : [...prev, closestStep]));
      }
    }
  }, [phase, patternData]);

  // Progress visual step marker during 'tapping' phase
  useEffect(() => {
    if (phase !== 'tapping' || !patternData) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - recallStartTimeRef.current;
      const currentStep = Math.floor(elapsed / patternData.stepIntervalMs);

      if (currentStep < patternData.steps.length) {
        setCurrentPlayStep(currentStep);
      } else {
        // Sequencer finished!
        clearInterval(interval);
        setCurrentPlayStep(-1);

        // Calculate score
        const targetHits = patternData.steps.map((s, idx) => (s.isHit ? idx : -1)).filter(idx => idx !== -1);
        let matches = 0;
        targetHits.forEach(targetIdx => {
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
      }
    }, 40);

    return () => clearInterval(interval);
  }, [phase, patternData, userTaps, round, maxRounds, effectiveLevel, emitTrialEvent, startNewRound]);

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
  }, [handleUserTap]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Nhớ Nhịp Điệu (Rhythm Recall)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Lắng nghe tiết tấu nhịp rồi gõ lại bằng phím Space hoặc nút TAP (nhấn lần đầu để bắt đầu đếm nhịp 1)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Hiệp: <span className="font-black text-rose-600 dark:text-rose-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            BPM: <span className="font-black text-cyan-600 dark:text-cyan-400">{bpm}</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Status */}
      <div className="my-5 flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
          {!hasStartedAudio ? (
            <button
              type="button"
              onClick={() => playPattern()}
              className="px-7 py-3 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-400 shadow-rose-600/30 hover:scale-105 cursor-pointer active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Bắt đầu nghe tiết tấu (Nhấn để phát)</span>
            </button>
          ) : (
            <div className={`px-5 py-2 rounded-full text-xs sm:text-sm font-black border shadow-sm ${
              phase === 'listen'
                ? 'bg-amber-500/20 border-amber-400 text-amber-800 dark:text-amber-300 animate-pulse'
                : phase === 'ready-to-tap'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/50 animate-bounce'
                : phase === 'tapping'
                ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/50'
                : 'bg-indigo-500/20 border-indigo-400 text-indigo-800 dark:text-indigo-300'
            }`}>
              {phase === 'listen'
                ? 'Đang phát tiết tấu mẫu...'
                : phase === 'ready-to-tap'
                ? '🎯 Sẵn sàng! Nhấn Space hoặc nút TAP để BẮT ĐẦU NHỊP 1!'
                : phase === 'tapping'
                ? 'Đang tính nhịp: Hãy gõ tiếp các phách còn lại!'
                : `Độ chính xác: ${roundAccuracy}%`}
            </div>
          )}

          {(phase === 'ready-to-tap' || phase === 'tapping') && (
            <button
              onClick={() => {
                setPhase('listen');
                playPattern();
              }}
              disabled={isPlayingAudio}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Nghe lại
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
            isUserTurn={phase === 'ready-to-tap' || phase === 'tapping'}
            className="w-full max-w-3xl"
          />
        )}
      </div>

      {/* Big Tap Button */}
      <div className="flex flex-col items-center pb-4">
        <button
          type="button"
          onClick={handleUserTap}
          disabled={phase !== 'ready-to-tap' && phase !== 'tapping'}
          className={`w-44 h-44 rounded-full font-black text-xl flex flex-col items-center justify-center gap-2 transition-all duration-75 shadow-2xl active:scale-95 ${
            phase === 'ready-to-tap'
              ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-emerald-500/50 ring-8 ring-emerald-400/40 cursor-pointer animate-pulse'
              : phase === 'tapping'
              ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-rose-500/50 ring-8 ring-rose-500/30 cursor-pointer'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          <Drum className="w-10 h-10" />
          <span>{phase === 'ready-to-tap' ? 'BẮT ĐẦU NHỊP 1' : 'GÕ NHỊP'}</span>
          <span className="text-xs font-mono font-bold tracking-wider opacity-90">HOẶC [SPACE]</span>
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
