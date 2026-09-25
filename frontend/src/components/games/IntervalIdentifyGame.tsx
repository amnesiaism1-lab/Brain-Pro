import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { generateIntervalQuestion, IIntervalInfo, transposeNote } from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { useMidiInput } from '../../hooks/useMidiInput';
import { EarTrainingLearningCard } from '../ui/EarTrainingLearningCard';
import { Sliders, Volume2, RotateCcw, CheckCircle2, XCircle, Play, Headphones, GraduationCap, Zap, Anchor, Radio, Sparkles } from 'lucide-react';

export const IntervalIdentifyGame: React.FC = () => {
  const { 
    currentLevel, 
    getExerciseLevel, 
    setActiveGameSlug,
    enableTonicAnchor,
    setEnableTonicAnchor,
    enableAmbientDrone,
    setEnableAmbientDrone,
    earConfusionMatrix,
    recordEarConfusion
  } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('interval-identify') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Neuroscience-based structured progression:
  // Level 1-2: Large contrast intervals (Unison, Major 3rd, Perfect 5th, Octave)
  // Level 3-4: Major Diatonic scale steps (2M, 3M, 4P, 5P, 6M, 8P)
  // Level 5-6: Diatonic + Minor intervals (2m, 3m, 6m, 7m, 7M)
  // Level 7+: Full Chromatic + Tritone (4A) and Harmonic simultaneous mode
  const intervalPool = useMemo(() => {
    if (effectiveLevel <= 2) return ['1P', '3M', '5P', '8P'];
    if (effectiveLevel <= 4) return ['2M', '3M', '4P', '5P', '6M', '8P'];
    if (effectiveLevel <= 6) return ['2m', '2M', '3m', '3M', '4P', '5P', '6m', '6M', '7m', '7M', '8P'];
    return ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M', '8P'];
  }, [effectiveLevel]);

  const playbackMode: 'ascending' | 'descending' | 'harmonic' | 'mixed' = useMemo(() => {
    if (effectiveLevel >= 7 || effectiveLevel === 22) return 'harmonic';
    if (effectiveLevel >= 4) return 'mixed';
    return 'ascending';
  }, [effectiveLevel]);

  const optionsCount = effectiveLevel >= 8 || isInfinity ? 5 : 4;
  const isHyperSpeed = effectiveLevel === 13;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [question, setQuestion] = useState<ReturnType<typeof generateIntervalQuestion> | null>(null);
  const [selectedOption, setSelectedOption] = useState<IIntervalInfo | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());
  const [hasPlayedCurrentRound, setHasPlayedCurrentRound] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [playingPreviewCode, setPlayingPreviewCode] = useState<string | null>(null);
  const [isLearnMode, setIsLearnMode] = useState<boolean>(true);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const currentQuestionRef = useRef<ReturnType<typeof generateIntervalQuestion> | null>(null);

  // Hook up MIDI
  useMidiInput({
    autoPlayAudio: true
  });

  // Generate question for current round
  const generateNextQuestion = useCallback(() => {
    const q = generateIntervalQuestion(intervalPool, playbackMode, optionsCount);
    currentQuestionRef.current = q;
    setQuestion(q);
    setSelectedOption(null);
    setIsAnswered(false);
    setHasPlayedCurrentRound(false);
    setPlayingPreviewCode(null);
  }, [intervalPool, playbackMode, optionsCount]);

  // Ambient Drone management effect
  useEffect(() => {
    if (hasStartedAudio && enableAmbientDrone && question?.rootNote) {
      auditoryEngine.startDrone(question.rootNote, 0.07);
    } else {
      auditoryEngine.stopDrone();
    }
    return () => {
      auditoryEngine.stopDrone();
    };
  }, [hasStartedAudio, enableAmbientDrone, question?.rootNote]);

  // Init on level change
  useEffect(() => {
    resetSession();
    playedRoundRef.current = 0;
    generateNextQuestion();
  }, [effectiveLevel, resetSession, generateNextQuestion]);

  // Check if audio is already active on mount
  useEffect(() => {
    if (auditoryEngine.isAudioActive()) {
      setHasStartedAudio(true);
    }
  }, []);

  // Global Timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Play current interval safely
  const playCurrentInterval = useCallback(async (qToPlay = currentQuestionRef.current || question) => {
    if (!qToPlay || isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setHasStartedAudio(true);
      const isFirstPlayOfRound = playedRoundRef.current !== round;
      playedRoundRef.current = round;
      setHasPlayedCurrentRound(true);

      await auditoryEngine.resumeAudioContext();

      // Pre-roll Tonic Anchor if enabled on first play of round
      if (enableTonicAnchor && isFirstPlayOfRound) {
        await auditoryEngine.playTonicAnchor(qToPlay.rootNote, 'single', 0.6);
        await new Promise(r => setTimeout(r, 260));
      }

      const duration = isHyperSpeed ? 0.28 : 0.6;
      const gap = isHyperSpeed ? 180 : 420;

      await auditoryEngine.playInterval(
        qToPlay.rootNote,
        qToPlay.targetNote,
        qToPlay.playbackDirection,
        duration,
        gap
      );
    } catch (err) {
      console.warn('Interval playback error:', err);
    } finally {
      isPlayingRef.current = false;
      setIsPlaying(false);
      trialStartTimeRef.current = Date.now();
    }
  }, [question, isHyperSpeed, round, enableTonicAnchor]);

  // Manually re-hear tonic anchor root
  const handlePlayAnchor = async () => {
    if (isPlayingRef.current || !question) return;
    try {
      setIsPlaying(true);
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playTonicAnchor(question.rootNote, 'chord', 0.85);
    } catch (err) {
      console.warn('Play anchor error:', err);
    } finally {
      setIsPlaying(false);
    }
  };

  // Preview an option's interval starting on question's rootNote
  const handlePreviewOption = async (e: React.MouseEvent, opt: IIntervalInfo) => {
    e.stopPropagation();
    if (isPlayingRef.current || !question) return;
    try {
      setPlayingPreviewCode(opt.code);
      await auditoryEngine.resumeAudioContext();
      const previewTarget = question.playbackDirection === 'descending'
        ? transposeNote(question.rootNote, '-' + opt.code)
        : transposeNote(question.rootNote, opt.code);
      const duration = isHyperSpeed ? 0.28 : 0.55;
      const gap = isHyperSpeed ? 180 : 380;
      await auditoryEngine.playInterval(
        question.rootNote,
        previewTarget,
        question.playbackDirection,
        duration,
        gap
      );
    } catch (err) {
      console.warn('Option preview error:', err);
    } finally {
      setPlayingPreviewCode(null);
    }
  };

  // Play what user selected for A/B comparison
  const playUserChoiceAudio = useCallback(async () => {
    if (!question || !selectedOption) return;
    try {
      await auditoryEngine.resumeAudioContext();
      const userTarget = question.playbackDirection === 'descending'
        ? transposeNote(question.rootNote, '-' + selectedOption.code)
        : transposeNote(question.rootNote, selectedOption.code);
      await auditoryEngine.playInterval(
        question.rootNote,
        userTarget,
        question.playbackDirection,
        0.6,
        400
      );
    } catch (e) {
      console.warn('User choice playback error:', e);
    }
  }, [question, selectedOption]);

  const handleProceedNextRound = useCallback(() => {
    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(prev => prev + 1);
      generateNextQuestion();
    }
  }, [round, maxRounds, generateNextQuestion]);

  // Auto-play interval once per round when audio is started and round changes
  useEffect(() => {
    if (!hasStartedAudio || isAnswered) return;
    if (playedRoundRef.current === round) return;

    const timer = setTimeout(() => {
      if (playedRoundRef.current !== round) {
        playCurrentInterval(question);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [round, hasStartedAudio, isAnswered, question, playCurrentInterval]);

  const handleManualStart = async () => {
    await auditoryEngine.resumeAudioContext();
    setHasStartedAudio(true);
    playCurrentInterval(question);
  };

  const handleSelectOption = (opt: IIntervalInfo) => {
    if (isAnswered || !question || isPlayingRef.current) return;

    setSelectedOption(opt);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.code === question.intervalCode;

    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 200);
    } else {
      // Record confusion pair for targeted pedagogical drilling
      const confusionPairKey = [question.intervalCode, opt.code].sort().join(':');
      recordEarConfusion(confusionPairKey);
    }

    emitTrialEvent({
      exerciseSlug: 'interval-identify',
      level: effectiveLevel,
      relationId: 'SIMILARITY_DIFF',
      entities: {
        target: `${question.rootNote}-${question.targetNote}`,
        response: opt.code,
        targetCode: question.intervalCode,
        userChoiceCode: opt.code,
        targetSemitones: question.intervalInfo.semitones,
        userChoiceSemitones: opt.semitones,
        semitoneDelta: Math.abs(question.intervalInfo.semitones - opt.semitones),
        confusionPair: !isCorrect ? [question.intervalCode, opt.code].sort().join(':') : undefined
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    // In Challenge mode, auto advance after 1.5s; In Learn mode, EarTrainingLearningCard controls the deliberate study!
    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  // Find most frequent confusion pair to display pedagogical alert
  const frequentConfusionPair = useMemo(() => {
    const entries = Object.entries(earConfusionMatrix);
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] >= 2) {
      const pair = sorted[0][0].split(':');
      return { pair, count: sorted[0][1] };
    }
    return null;
  }, [earConfusionMatrix]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Nhận Diện Quãng (Interval Identify)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1] || 'INF'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Lắng nghe 2 nốt nhạc và chọn đúng tên quãng
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
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="Bật/Tắt chế độ phát triển thính giác (nghe thử đáp án & phân tích chi tiết)"
          >
            {isLearnMode ? <GraduationCap className="w-4 h-4 text-amber-500" /> : <Zap className="w-4 h-4" />}
            <span className="hidden sm:inline">{isLearnMode ? 'Chế độ Luyện Tai' : 'Thử Thách Nhanh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setEnableTonicAnchor(!enableTonicAnchor)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              enableTonicAnchor
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
            title="Bật/Tắt Neo Âm Chủ (Tonic Anchor) - phát âm chuẩn trước mỗi câu giúp định vị cao độ tương đối"
          >
            <Anchor className={`w-3.5 h-3.5 ${enableTonicAnchor ? 'text-indigo-500' : ''}`} />
            <span className="hidden sm:inline">Neo Âm Chủ</span>
          </button>

          <button
            type="button"
            onClick={() => setEnableAmbientDrone(!enableAmbientDrone)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              enableAmbientDrone
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
            title="Bật/Tắt Âm Nền Drone (Ambient Drone) - duy trì âm chủ nền liên tục giúp nhận diện quãng theo Functional Ear Training"
          >
            <Radio className={`w-3.5 h-3.5 ${enableAmbientDrone ? 'text-teal-500 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Nền Drone</span>
          </button>

          <MidiStatusIndicator compact={true} />
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Câu: <span className="font-black text-cyan-600 dark:text-cyan-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-amber-600 dark:text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Big Play Audio Action */}
      <div className="my-5 flex flex-col items-center">
        <FrequencySpectrum height={85} className="w-full max-w-md mb-4 bg-slate-900 dark:bg-slate-950" isActive={isPlaying} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!hasStartedAudio ? (
            <button
              type="button"
              onClick={handleManualStart}
              className="px-8 py-3.5 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-2 border-cyan-300 shadow-cyan-500/40 hover:scale-105 cursor-pointer active:scale-95 animate-pulse"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU NGHE QUÃNG (BẤM ĐỂ PHÁT)</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => playCurrentInterval()}
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
                    <span>Đang phát quãng...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    <span>Nghe lại quãng</span>
                  </>
                )}
              </button>

              {question && (
                <button
                  type="button"
                  onClick={handlePlayAnchor}
                  disabled={isPlaying}
                  className="px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer active:scale-95"
                  title="Nghe lại âm chủ (Root note / Tonic) của câu hỏi hiện tại"
                >
                  <Anchor className="w-4 h-4 text-indigo-500" />
                  <span>Âm chủ: <strong>{question.rootNote}</strong></span>
                </button>
              )}
            </>
          )}

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Chế độ: {question?.playbackDirection === 'harmonic' ? 'Hòa âm đồng thời' : question?.playbackDirection === 'descending' ? 'Đi xuống' : 'Đi lên'}
          </span>
        </div>
      </div>

      {/* Guide text if not started */}
      {!hasStartedAudio && (
        <div className="p-3.5 my-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center text-xs text-cyan-800 dark:text-cyan-300 font-bold animate-pulse">
          🎧 Hãy bấm nút "BẮT ĐẦU NGHE QUÃNG" ở trên để nghe 2 nốt nhạc và chọn câu trả lời!
        </div>
      )}

      {/* Frequent Confusion Alert Banner */}
      {frequentConfusionPair && (
        <div className="max-w-2xl mx-auto w-full my-2 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Phát hiện nhầm lẫn thính giác:</strong> Bạn đang hay nhầm giữa <strong>{frequentConfusionPair.pair[0]}</strong> và <strong>{frequentConfusionPair.pair[1]}</strong> ({frequentConfusionPair.count} lần). Hãy chú ý độ rộng nửa cung!
            </span>
          </div>
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
        {question?.options.map((opt) => {
          const isSelected = selectedOption?.code === opt.code;
          const isCorrect = opt.code === question.intervalCode;

          const isButtonDisabled = isAnswered || isPlaying || !hasStartedAudio || !hasPlayedCurrentRound;

          let btnStyle = 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-900 dark:text-white shadow-sm hover:shadow-md';
          if (!hasStartedAudio || !hasPlayedCurrentRound) {
            btnStyle = 'bg-slate-100/70 dark:bg-slate-800/40 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed';
          } else if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/40';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-200';
            } else {
              btnStyle = 'bg-slate-100 dark:bg-slate-800/40 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={opt.code}
              disabled={isButtonDisabled}
              onClick={() => handleSelectOption(opt)}
              className={`p-4 rounded-2xl text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                <div className="flex items-center gap-1.5">
                  {isLearnMode && (
                    <button
                      type="button"
                      title={`Nghe thử mẫu ${opt.nameVi}`}
                      disabled={isPlaying || !hasStartedAudio}
                      onClick={(e) => handlePreviewOption(e, opt)}
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        playingPreviewCode === opt.code
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse scale-105 shadow-md'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 hover:scale-110 active:scale-95'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${playingPreviewCode === opt.code ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-cyan-700 dark:text-cyan-300">
                    {opt.code}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>{opt.semitones} nửa cung &bull; {opt.ratioDescription}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Deliberate Practice & Ear Training Deep Feedback */}
      {question && isLearnMode && (
        <EarTrainingLearningCard
          theoryModuleId="intervals"
          theoryTitle="2. Quãng Âm (Intervals)"
          isAnswered={isAnswered}
          isCorrect={selectedOption?.code === question.intervalCode}
          rootNote={question.rootNote}
          targetNotes={[question.targetNote]}
          userNotes={selectedOption && question ? [
            question.playbackDirection === 'descending'
              ? transposeNote(question.rootNote, '-' + selectedOption.code)
              : transposeNote(question.rootNote, selectedOption.code)
          ] : []}
          correctName={question.intervalInfo.nameVi}
          correctCode={question.intervalInfo.code}
          correctDescription={`${question.intervalInfo.semitones} nửa cung • ${question.intervalInfo.ratioDescription}`}
          correctSemitones={question.intervalInfo.semitones}
          userChoiceSemitones={selectedOption?.semitones}
          mnemonicSong={question.intervalInfo.mnemonicSongVi}
          pedagogicalTip={question.intervalInfo.tipVi}
          userChoiceName={selectedOption?.nameVi}
          userChoiceCode={selectedOption?.code}
          onPlayQuestion={() => playCurrentInterval(question)}
          onPlayUserChoice={playUserChoiceAudio}
          onPlayCorrectSample={() => playCurrentInterval(question)}
          onNextRound={handleProceedNextRound}
          isLastRound={round >= maxRounds}
          preAnswerHints={question.options.map(opt => ({
            code: opt.code,
            name: opt.nameVi,
            description: `${opt.semitones} nửa cung • ${opt.ratioDescription}`,
            mnemonic: opt.mnemonicSongVi,
            onPreviewAudio: () => {
              const previewTarget = question.playbackDirection === 'descending'
                ? transposeNote(question.rootNote, '-' + opt.code)
                : transposeNote(question.rootNote, opt.code);
              auditoryEngine.playInterval(question.rootNote, previewTarget, question.playbackDirection);
            }
          }))}
        />
      )}

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
            playedRoundRef.current = 0;
            generateNextQuestion();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
