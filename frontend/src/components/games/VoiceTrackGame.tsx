import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateVoiceTrackingChallenge, IVoiceTrackQuestion, IVoiceStreamData } from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { 
  GitFork, 
  Volume2, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  GraduationCap, 
  Headphones, 
  Sparkles,
  ArrowRight,
  Layers,
  Activity
} from 'lucide-react';

export const VoiceTrackGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, navigateToTheory } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('voice-track') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level configuration
  const voicesCount: 2 | 3 = (effectiveLevel >= 7 || isInfinity) ? 3 : 2;
  const maxRounds = 5;

  // Game state
  const [round, setRound] = useState(1);
  const [challenge, setChallenge] = useState<IVoiceTrackQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [isPlayingSolo, setIsPlayingSolo] = useState(false);
  const [activeVoiceLane, setActiveVoiceLane] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLearnMode, setIsLearnMode] = useState<boolean>(true);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(-1);
  const currentChallengeRef = useRef<IVoiceTrackQuestion | null>(null);

  // Generate question
  const generateNextRound = useCallback(() => {
    let targetRole: 'soprano' | 'alto' | 'bass' | undefined;
    if (effectiveLevel === 1) targetRole = 'soprano';
    else if (effectiveLevel === 2) targetRole = 'bass';
    else if (effectiveLevel === 7) targetRole = 'soprano';
    else if (effectiveLevel === 8) targetRole = 'alto';

    const q = generateVoiceTrackingChallenge(voicesCount, targetRole, 'direction');
    currentChallengeRef.current = q;
    setChallenge(q);
    setSelectedOptionId(null);
    setIsAnswered(false);
  }, [effectiveLevel, voicesCount]);

  useEffect(() => {
    resetSession();
    playedRoundRef.current = -1;
    generateNextRound();
  }, [effectiveLevel, resetSession, generateNextRound]);

  // Global Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play Solo Target Cue
  const playSoloTarget = async () => {
    if (!challenge || isPlayingFull || isPlayingSolo) return;
    setIsPlayingSolo(true);
    setHasStartedAudio(true);
    setActiveVoiceLane(challenge.targetVoice);
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playPolyphonicStreams(challenge.voices, challenge.targetVoice);
    } catch (err) {
      console.warn('Solo target playback error:', err);
    } finally {
      setIsPlayingSolo(false);
      setActiveVoiceLane(null);
    }
  };

  // Play Full Polyphonic Mixture
  const playFullStreams = async (ch = currentChallengeRef.current || challenge) => {
    if (!ch || isPlayingFull || isPlayingSolo) return;
    setIsPlayingFull(true);
    setHasStartedAudio(true);
    setActiveVoiceLane('ALL');
    playedRoundRef.current = round;
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playPolyphonicStreams(ch.voices);
    } catch (err) {
      console.warn('Polyphonic streams playback error:', err);
    } finally {
      setIsPlayingFull(false);
      setActiveVoiceLane(null);
      trialStartTimeRef.current = Date.now();
    }
  };

  // Auto-play when round starts if audio was already active
  useEffect(() => {
    if (challenge && hasStartedAudio && playedRoundRef.current !== round && !isPlayingFull && !isPlayingSolo) {
      const timer = setTimeout(() => {
        playFullStreams(challenge);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [round, challenge, hasStartedAudio]);

  // Handle option select
  const handleSelectOption = (optionId: string) => {
    if (isAnswered || !challenge || isPlayingFull || isPlayingSolo) return;

    setSelectedOptionId(optionId);
    setIsAnswered(true);

    const isCorrect = optionId === challenge.correctAnswerId;
    const responseMs = Math.max(100, Date.now() - trialStartTimeRef.current);

    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + Math.max(100, 250 - Math.floor(responseMs / 40)));
    }

    emitTrialEvent({
      exerciseSlug: 'voice-track',
      level: effectiveLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: {
        target: challenge.targetVoice,
        taskType: challenge.taskType,
        correctAnswer: challenge.correctAnswerId,
        userSelection: optionId
      },
      stateBefore: `round-${round}-listening`,
      stateAfter: isCorrect ? 'correct' : 'incorrect',
      responseMs,
      correct: isCorrect,
      extra: {
        music: {
          entity: 'voice',
          attribute: 'layer',
          relationId: 'TARGET_DISTRACTOR'
        }
      }
    });

    setTimeout(() => {
      if (round < maxRounds) {
        setRound(r => r + 1);
        generateNextRound();
      } else {
        setIsFinished(true);
      }
    }, 1800);
  };

  const currentLevelConfig = useMemo(() => {
    return {
      timeLimitSec: 50,
      targetItemCount: maxRounds
    };
  }, [maxRounds]);

  const handleRestart = () => {
    setRound(1);
    setScore(0);
    setCorrectCount(0);
    setElapsedSec(0);
    setIsFinished(false);
    startTimeRef.current = Date.now();
    playedRoundRef.current = -1;
    generateNextRound();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Theo Dõi Bè Đa Thanh
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {isInfinity ? `∞ Tier ${infinityTier}` : `Cấp ${effectiveLevel}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Phân rã dòng thính giác (Bregman Streaming) · Quan hệ Tín Hiệu / Nhiễu (TARGET_DISTRACTOR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Guide Button */}
            <button
              onClick={() => setIsLearnMode(!isLearnMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Hướng dẫn & Mẹo nghe"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Theory link */}
            <button
              onClick={() => navigateToTheory && navigateToTheory('polyphony' as any)}
              className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-violet-200 dark:border-violet-800"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Lý Thuyết Bè</span>
            </button>

            {/* Progress Badge */}
            <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300">
              Vòng {round} / {maxRounds}
            </div>
          </div>
        </div>

        {/* Learning Card */}
        {isLearnMode && (
          <div className="mt-4 p-4 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-xs text-violet-900 dark:text-violet-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-violet-700 dark:text-violet-300">
              <Headphones className="w-4 h-4" />
              <span>Bí quyết phân rã thính giác (Auditory Streaming):</span>
            </div>
            <p className="leading-relaxed">
              Khi nhiều giai điệu cùng vang lên, não bạn dùng 3 yếu tố để tách bè: 
              <strong> Cao độ (âm vực cao/trầm)</strong>, <strong>Không gian (tai trái/phải)</strong> và <strong>Âm sắc</strong>. 
              Hãy tập trung sự chú ý vào đúng bè mục tiêu được chỉ định và bỏ qua các bè đệm.
            </p>
          </div>
        )}
      </div>

      {/* Main Game Board */}
      <div className="bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Target Cue Banner */}
        {challenge && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent border border-violet-300 dark:border-violet-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black shadow-sm">
                🎯
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Mục Tiêu Cần Theo Dõi (Target Stream)
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {challenge.targetVoiceNameVi}
                </h3>
              </div>
            </div>

            {/* Solo Preview Button */}
            <button
              onClick={playSoloTarget}
              disabled={isPlayingFull || isPlayingSolo}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
                isPlayingSolo
                  ? 'bg-violet-600 text-white animate-pulse'
                  : 'bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-slate-750'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingSolo ? 'Đang nghe riêng...' : 'Nghe Thử Riêng Bè Đích'}</span>
            </button>
          </div>
        )}

        {/* Visual Multi-Voice Stream Lanes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            <span>Các Dòng Âm Thanh Độc Lập ({challenge?.voices.length || 2} bè)</span>
            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
              {isPlayingFull ? '🔊 Đang hòa tấu đa bè...' : 'Sẵn sàng phát'}
            </span>
          </div>

          <div className="space-y-2.5">
            {challenge?.voices.map(voice => {
              const isTarget = voice.name === challenge.targetVoice;
              const isVoicePlaying = isPlayingFull || (isPlayingSolo && activeVoiceLane === voice.name);

              return (
                <div
                  key={voice.name}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isTarget
                      ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 shadow-sm ring-2 ring-violet-500/20'
                      : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: voice.colorHex }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {voice.displayNameVi}
                        </span>
                        {isTarget && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-600 text-white">
                            BÈ ĐÍCH
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {voice.notes.map(n => n.note).join(' → ')}
                      </span>
                    </div>
                  </div>

                  {/* Animated Wave Bars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map(barIdx => (
                      <div
                        key={barIdx}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isVoicePlaying
                            ? 'bg-violet-500 animate-pulse'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{
                          height: isVoicePlaying ? `${8 + (barIdx * 4) % 18}px` : '6px',
                          animationDelay: `${barIdx * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Polyphony Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => playFullStreams()}
            disabled={isPlayingFull || isPlayingSolo}
            className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
              isPlayingFull
                ? 'bg-violet-600 text-white shadow-violet-500/30 scale-102 ring-4 ring-violet-400/30'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20'
            }`}
          >
            <Play className={`w-4 h-4 ${isPlayingFull ? 'animate-spin' : ''}`} />
            <span>{isPlayingFull ? 'Đang Phát Đa Bè...' : 'Nghe Tất Cả Các Bè (Play Polyphony)'}</span>
          </button>
        </div>

        {/* Question Prompt */}
        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            {challenge?.questionTextVi || 'Lắng nghe bè mục tiêu và chọn đáp án'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bấm chọn hướng di chuyển của bè đích bạn vừa nghe được:
          </p>
        </div>

        {/* Answer Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {challenge?.options.map(option => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = isAnswered && option.id === challenge.correctAnswerId;
            const isWrong = isAnswered && isSelected && option.id !== challenge.correctAnswerId;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isAnswered || isPlayingFull || isPlayingSolo}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[90px] active:scale-98 ${
                  isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/30'
                    : isWrong
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 shadow-md'
                    : isSelected
                    ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-500 text-violet-900 dark:text-violet-100'
                    : 'bg-white dark:bg-slate-800/60 border-[#D5CBB9] dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl font-black">{option.icon}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isWrong && <XCircle className="w-5 h-5 text-rose-500" />}
                </div>
                <span className="text-xs font-bold mt-2">{option.labelVi}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Alert */}
        {isAnswered && challenge && (
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
            selectedOptionId === challenge.correctAnswerId
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <span className="font-bold">
              {selectedOptionId === challenge.correctAnswerId ? '🎉 Chính xác! ' : 'Chưa đúng! '}
            </span>
            {challenge.explanationVi}
          </div>
        )}
      </div>

      {/* Real-time Oscilloscope / Frequency Spectrum Visualizer */}
      <FrequencySpectrum />

      {/* Result Modal */}
      {isFinished && (
        <GameResultModal
          score={calculateGameScore({
            level: effectiveLevel,
            accuracyRate: Math.round((correctCount / maxRounds) * 100),
            timeLimitSec: currentLevelConfig.timeLimitSec,
            timeSpentSec: elapsedSec
          })}
          accuracyRate={Math.round((correctCount / maxRounds) * 100)}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={handleRestart}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
