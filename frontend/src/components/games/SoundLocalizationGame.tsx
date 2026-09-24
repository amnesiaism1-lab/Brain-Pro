import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { SpatialRadar } from '../ui/SpatialRadar';
import { Navigation, Volume2, Headphones, RotateCcw, AlertTriangle } from 'lucide-react';

interface ISpatialTarget {
  id: string;
  azimuthDeg: number;
  distanceTier: 'near' | 'mid' | 'far';
  label?: string;
}

export const SoundLocalizationGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('sound-localization') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level configuration
  const targetAngles = effectiveLevel <= 2
    ? [90, 270] // Left vs Right only
    : effectiveLevel <= 3
    ? [0, 90, 180, 270] // 4 cardinal directions
    : [0, 45, 90, 135, 180, 225, 270, 315]; // 8 directions

  const hasDistanceTiers = effectiveLevel >= 6;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [availableTargets, setAvailableTargets] = useState<ISpatialTarget[]>([]);
  const [currentTarget, setCurrentTarget] = useState<ISpatialTarget | null>(null);
  const [selectedTargetId, setSelectedOptionId] = useState<string | null>(null);
  const [targetPingAngle, setTargetPingAngle] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());

  // Build target points
  const generateNewRound = useCallback(() => {
    const targets: ISpatialTarget[] = [];
    const distances: Array<'near' | 'mid' | 'far'> = hasDistanceTiers ? ['near', 'mid', 'far'] : ['mid'];

    targetAngles.forEach((angle) => {
      distances.forEach((dist) => {
        let label = `${angle}°`;
        if (angle === 0) label = 'Trước';
        if (angle === 90) label = 'Phải';
        if (angle === 180) label = 'Sau';
        if (angle === 270) label = 'Trái';

        targets.push({
          id: `target-${angle}-${dist}`,
          azimuthDeg: angle,
          distanceTier: dist,
          label: distances.length > 1 ? `${label} (${dist})` : label
        });
      });
    });

    const chosen = targets[Math.floor(Math.random() * targets.length)];
    setAvailableTargets(targets);
    setCurrentTarget(chosen);
    setSelectedOptionId(null);
    setTargetPingAngle(null);
    setIsAnswered(false);
  }, [targetAngles, hasDistanceTiers]);

  useEffect(() => {
    resetSession();
    generateNewRound();
  }, [effectiveLevel, resetSession, generateNewRound]);

  // Global Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play spatial audio
  const playSpatialSound = useCallback(() => {
    if (!currentTarget || isPlaying) return;
    setIsPlaying(true);
    auditoryEngine.initContext();

    const distanceMeters = currentTarget.distanceTier === 'near' ? 1.5 : currentTarget.distanceTier === 'far' ? 8.0 : 3.5;
    const note = round % 2 === 0 ? 'G4' : 'E4';

    // Play with 3D HRTF panner
    auditoryEngine.play3DSpatialTone(note, currentTarget.azimuthDeg, 0, distanceMeters, 0.7);

    setTimeout(() => {
      setIsPlaying(false);
      trialStartTimeRef.current = Date.now();
    }, 750);
  }, [currentTarget, isPlaying, round]);

  // Auto-play when target arrives
  useEffect(() => {
    if (currentTarget && !isAnswered && !isPlaying) {
      const t = setTimeout(() => {
        playSpatialSound();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [currentTarget, isAnswered, isPlaying, playSpatialSound]);

  const handleSelectTarget = (target: ISpatialTarget) => {
    if (isAnswered || !currentTarget || isPlaying) return;

    setSelectedOptionId(target.id);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = target.id === currentTarget.id;
    auditoryEngine.playFeedback(isCorrect);

    // Show correct ping wave position on radar
    setTargetPingAngle(currentTarget.azimuthDeg);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 250);
    }

    emitTrialEvent({
      exerciseSlug: 'sound-localization',
      level: effectiveLevel,
      relationId: 'TARGET_POSITION',
      entities: {
        target: `${currentTarget.azimuthDeg}-${currentTarget.distanceTier}`,
        response: `${target.azimuthDeg}-${target.distanceTier}`
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    setTimeout(() => {
      if (round >= maxRounds) {
        setIsFinished(true);
      } else {
        setRound(prev => prev + 1);
        generateNewRound();
      }
    }, 1600);
  };

  return (
    <div className="relative min-h-[580px] flex flex-col justify-between p-4 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Định Vị Âm Thanh 3D (Spatial Audio)</h2>
              {isInfinity && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              Khuyến nghị đeo tai nghe để cảm nhận chính xác không gian 3D
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

      {/* Notice / Replay button */}
      <div className="my-2 flex items-center justify-center gap-3">
        <button
          onClick={playSpatialSound}
          disabled={isPlaying}
          className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition-all ${
            isPlaying
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30 hover:scale-105'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          {isPlaying ? 'Đang phát âm thanh...' : 'Phát lại âm thanh'}
        </button>
      </div>

      {/* Radar Visualizer */}
      <div className="flex items-center justify-center my-3">
        <SpatialRadar
          availableTargets={availableTargets}
          selectedTargetId={selectedTargetId}
          targetPingAngle={targetPingAngle}
          disabled={isAnswered || isPlaying}
          onSelectTarget={handleSelectTarget}
        />
      </div>

      {/* Guidance info */}
      <div className="text-center text-xs text-slate-400 pb-2">
        Nhấp chọn vị trí trên màn hình radar nơi bạn nghe thấy âm thanh phát ra
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
            generateNewRound();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
