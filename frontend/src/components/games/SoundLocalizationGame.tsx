import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { SpatialRadar, ISpatialTarget } from '../ui/SpatialRadar';
import { Navigation, Volume2, Headphones, RotateCcw, Play, Sparkles } from 'lucide-react';

export const SoundLocalizationGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('sound-localization') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level configuration
  const targetAngles = useMemo(() => {
    if (effectiveLevel <= 2) return [90, 270]; // Left vs Right only
    if (effectiveLevel <= 3) return [0, 90, 180, 270]; // 4 cardinal directions
    return [0, 45, 90, 135, 180, 225, 270, 315]; // 8 directions
  }, [effectiveLevel]);

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
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(-1);

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
          label: distances.length > 1 ? `${label} (${dist === 'near' ? 'Gần' : dist === 'far' ? 'Xa' : 'Vừa'})` : label
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
    playedRoundRef.current = -1;
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
  const playSpatialSound = useCallback(async (target = currentTarget) => {
    if (!target) return;
    setIsPlaying(true);
    setHasStartedAudio(true);
    try {
      await auditoryEngine.resumeAudioContext();

      const distanceMeters = target.distanceTier === 'near' ? 1.5 : target.distanceTier === 'far' ? 8.0 : 3.5;
      const note = round % 2 === 0 ? 'G4' : 'E4';

      // Play with 3D HRTF panner
      auditoryEngine.play3DSpatialTone(note, target.azimuthDeg, 0, distanceMeters, 0.7);

      await new Promise(resolve => setTimeout(resolve, 750));
      trialStartTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error playing spatial tone:', err);
    } finally {
      setIsPlaying(false);
    }
  }, [currentTarget, round]);

  // Auto-play when target arrives IF audio was already started
  useEffect(() => {
    if (currentTarget && hasStartedAudio && !isAnswered && playedRoundRef.current !== round) {
      playedRoundRef.current = round;
      const t = setTimeout(() => {
        playSpatialSound(currentTarget);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [currentTarget, hasStartedAudio, isAnswered, round, playSpatialSound]);

  // Interactive audition on point hover/click (like hrtfmixer)
  const handlePreviewAngle = useCallback(async (azimuthDeg: number, distanceTier: 'near' | 'mid' | 'far') => {
    await auditoryEngine.resumeAudioContext();
    const dist = distanceTier === 'near' ? 1.5 : distanceTier === 'far' ? 8.0 : 3.5;
    auditoryEngine.play3DSpatialTone('C5', azimuthDeg, 0, dist, 0.45);
  }, []);

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
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Định Vị Âm Thanh 3D (Spatial Audio)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Khuyến nghị đeo tai nghe Stereo để cảm nhận âm thanh binaural 3D rõ nét nhất
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Câu: <span className="font-black text-cyan-600 dark:text-cyan-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-amber-600 dark:text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Notice / Replay button */}
      <div className="my-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => playSpatialSound()}
          disabled={isPlaying}
          className={`px-7 py-3 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md active:scale-95 ${
            isPlaying
              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-2 border-cyan-500 animate-pulse'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-2 border-cyan-400 shadow-cyan-500/30 hover:scale-105 cursor-pointer'
          }`}
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-5 h-5 animate-spin" />
              <span>Đang phát âm thanh 3D...</span>
            </>
          ) : hasStartedAudio ? (
            <>
              <RotateCcw className="w-5 h-5" />
              <span>Nghe lại âm thanh</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Bắt đầu nghe âm thanh 3D (Nhấn để phát)</span>
            </>
          )}
        </button>
      </div>

      {/* Radar Visualizer */}
      <div className="flex items-center justify-center my-2">
        <SpatialRadar
          availableTargets={availableTargets}
          selectedTargetId={selectedTargetId}
          targetPingAngle={targetPingAngle}
          disabled={isAnswered || isPlaying}
          onSelectTarget={handleSelectTarget}
          onPreviewAngle={handlePreviewAngle}
        />
      </div>

      {/* Guidance info */}
      <div className="text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 pb-2">
        Nhấp chọn vị trí trên màn hình radar nơi bạn nghe thấy âm thanh phát ra (hoặc rê chuột để nghe thử hiệu ứng 3D)
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
