import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  generateChordQuestion, 
  IChordTypeInfo, 
  transposeNote,
  generateCadenceQuestion,
  ICadenceInfo,
  generateImpliedHarmonyQuestion
} from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import { useMidiInput } from '../../hooks/useMidiInput';
import { EarTrainingLearningCard } from '../ui/EarTrainingLearningCard';
import { Music, Volume2, RotateCcw, CheckCircle2, XCircle, Play, GraduationCap, Zap, Anchor, GitCommit } from 'lucide-react';

export const ChordIdentifyGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, enableTonicAnchor, setEnableTonicAnchor } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('chord-identify') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Allowed chord types based on level
  const allowedChordTypes = useMemo(() => {
    if (effectiveLevel <= 2) return ['Major', 'Minor'];
    if (effectiveLevel <= 4) return ['Major', 'Minor', 'Diminished', 'Augmented'];
    if (effectiveLevel <= 7) return ['Major', 'Minor', 'Maj7', 'm7', 'dom7'];
    if (effectiveLevel <= 10) return ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'm7b5', 'dim7'];
    return ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'sus2', 'sus4', '9th'];
  }, [effectiveLevel]);

  const playbackMode: 'block' | 'arpeggio' = useMemo(() => {
    if (effectiveLevel === 5 || effectiveLevel === 6 || effectiveLevel === 14 || effectiveLevel === 18) {
      return 'arpeggio';
    }
    return 'block';
  }, [effectiveLevel]);

  const optionsCount = effectiveLevel >= 6 || isInfinity ? 5 : 4;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [question, setQuestion] = useState<ReturnType<typeof generateChordQuestion> | null>(null);
  const [selectedOption, setSelectedOption] = useState<IChordTypeInfo | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());
  const [hasPlayedCurrentRound, setHasPlayedCurrentRound] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [playingPreviewType, setPlayingPreviewType] = useState<string | null>(null);
  const [isLearnMode, setIsLearnMode] = useState<boolean>(true);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const currentQuestionRef = useRef<ReturnType<typeof generateChordQuestion> | null>(null);

  // MIDI input
  const isCadenceMode = effectiveLevel === 11;
  const isImpliedMode = effectiveLevel === 6;

  const [cadenceQuestion, setCadenceQuestion] = useState<ReturnType<typeof generateCadenceQuestion> | null>(null);
  const [selectedCadenceOption, setSelectedCadenceOption] = useState<ICadenceInfo | null>(null);
  const currentCadenceRef = useRef<ReturnType<typeof generateCadenceQuestion> | null>(null);

  // MIDI input
  useMidiInput({
    autoPlayAudio: true
  });

  // Generate question
  const generateNextQuestion = useCallback(() => {
    if (isCadenceMode) {
      const cq = generateCadenceQuestion();
      currentCadenceRef.current = cq;
      setCadenceQuestion(cq);
      setSelectedCadenceOption(null);
      setIsAnswered(false);
      setHasPlayedCurrentRound(false);
    } else if (isImpliedMode) {
      const q = generateImpliedHarmonyQuestion();
      const formattedQ = {
        rootNote: 'C4',
        chordType: q.chordType,
        chordName: q.chordType,
        notes: q.notes,
        typeInfo: q.typeInfo,
        options: q.options
      };
      currentQuestionRef.current = formattedQ;
      setQuestion(formattedQ);
      setSelectedOption(null);
      setIsAnswered(false);
      setHasPlayedCurrentRound(false);
    } else {
      const q = generateChordQuestion(allowedChordTypes, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'], optionsCount);
      currentQuestionRef.current = q;
      setQuestion(q);
      setSelectedOption(null);
      setIsAnswered(false);
      setHasPlayedCurrentRound(false);
    }
  }, [allowedChordTypes, optionsCount, isCadenceMode, isImpliedMode]);

  // Init on level change
  useEffect(() => {
    resetSession();
    playedRoundRef.current = 0;
    generateNextQuestion();
  }, [effectiveLevel, resetSession, generateNextQuestion]);

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

  // Play chord or cadence safely
  const playCurrentChord = useCallback(async (qToPlay = currentQuestionRef.current || question) => {
    if (isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setHasStartedAudio(true);
      const isFirstPlayOfRound = playedRoundRef.current !== round;
      playedRoundRef.current = round;
      setHasPlayedCurrentRound(true);

      await auditoryEngine.resumeAudioContext();

      if (isCadenceMode) {
        const cq = currentCadenceRef.current || cadenceQuestion;
        if (cq) {
          await auditoryEngine.playCadence(cq.chords);
        }
      } else if (isImpliedMode) {
        if (qToPlay) {
          await auditoryEngine.playNoteSequence(qToPlay.notes, 200, 0.45);
        }
      } else if (qToPlay) {
        // Pre-roll Tonic Anchor if enabled on first play of round
        if (enableTonicAnchor && isFirstPlayOfRound) {
          await auditoryEngine.playTonicAnchor(qToPlay.rootNote, 'single', 0.6);
          await new Promise(r => setTimeout(r, 260));
        }

        await auditoryEngine.playChord(
          qToPlay.notes,
          playbackMode,
          1.2,
          playbackMode === 'arpeggio' ? 80 : 0
        );
      }
    } catch (err) {
      console.warn('Chord playback error:', err);
    } finally {
      isPlayingRef.current = false;
      setIsPlaying(false);
      trialStartTimeRef.current = Date.now();
    }
  }, [question, cadenceQuestion, playbackMode, round, enableTonicAnchor, isCadenceMode, isImpliedMode]);

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

  // Preview an option chord starting on question's rootNote
  const handlePreviewOption = async (e: React.MouseEvent, opt: IChordTypeInfo) => {
    e.stopPropagation();
    if (isPlayingRef.current || !question) return;
    try {
      setPlayingPreviewType(opt.type);
      await auditoryEngine.resumeAudioContext();
      const previewNotes = opt.formula.map(interval => transposeNote(question.rootNote, interval));
      await auditoryEngine.playChord(
        previewNotes,
        playbackMode,
        1.1,
        playbackMode === 'arpeggio' ? 80 : 0
      );
    } catch (err) {
      console.warn('Chord option preview error:', err);
    } finally {
      setPlayingPreviewType(null);
    }
  };

  // Play what user selected for comparison
  const playUserChoiceChord = useCallback(async () => {
    if (!question || !selectedOption) return;
    try {
      await auditoryEngine.resumeAudioContext();
      const userNotes = selectedOption.formula.map(interval => transposeNote(question.rootNote, interval));
      await auditoryEngine.playChord(
        userNotes,
        playbackMode,
        1.2,
        playbackMode === 'arpeggio' ? 80 : 0
      );
    } catch (e) {
      console.warn('User choice chord error:', e);
    }
  }, [question, selectedOption, playbackMode]);

  const handleProceedNextRound = useCallback(() => {
    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(prev => prev + 1);
      generateNextQuestion();
    }
  }, [round, maxRounds, generateNextQuestion]);

  // Auto-play once per round
  useEffect(() => {
    if (!hasStartedAudio || isAnswered) return;
    if (playedRoundRef.current === round) return;

    const t = setTimeout(() => {
      if (playedRoundRef.current !== round) {
        playCurrentChord(question);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [round, hasStartedAudio, isAnswered, question, playCurrentChord]);

  const handleManualStart = async () => {
    await auditoryEngine.resumeAudioContext();
    setHasStartedAudio(true);
    playCurrentChord(question);
  };

  const handleSelectOption = (opt: IChordTypeInfo) => {
    if (isAnswered || !question || isPlayingRef.current) return;

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
      relationId: isImpliedMode ? 'PART_WHOLE' : 'IDENTITY_MATCH',
      relationWeight: 1.0,
      entities: {
        target: question.notes.join(','),
        response: opt.type
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect,
      extra: isImpliedMode ? {
        music: {
          entity: 'implied_harmony',
          attribute: 'arpeggio',
          relationId: 'PART_WHOLE'
        }
      } : undefined
    });

    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  const handleSelectCadence = (opt: ICadenceInfo) => {
    if (isAnswered || !cadenceQuestion || isPlayingRef.current) return;

    setSelectedCadenceOption(opt);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.type === cadenceQuestion.targetCadence.type;
    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 250);
    }

    emitTrialEvent({
      exerciseSlug: 'chord-identify',
      level: effectiveLevel,
      relationId: 'TEMPORAL_PREDICT',
      relationWeight: 1.0,
      entities: {
        target: cadenceQuestion.targetCadence.type,
        response: opt.type
      },
      stateBefore: 'cadence-listening',
      stateAfter: isCorrect ? 'correct' : 'incorrect',
      responseMs: reactionMs,
      correct: isCorrect,
      extra: {
        music: {
          entity: 'cadence',
          attribute: 'progression',
          relationId: 'TEMPORAL_PREDICT'
        }
      }
    });

    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Nhận Diện Hợp Âm (Chord Identify)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1] || 'INF'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Lắng nghe hòa âm và chọn đúng loại hợp âm (Trưởng, Thứ, 7...)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
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
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Bật/Tắt Neo Âm Chủ (Tonic Anchor) - phát âm chuẩn nốt gốc trước mỗi câu"
          >
            <Anchor className={`w-3.5 h-3.5 ${enableTonicAnchor ? 'text-purple-500' : ''}`} />
            <span className="hidden sm:inline">Neo Âm Chủ</span>
          </button>

          <MidiStatusIndicator compact={true} />
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Câu: <span className="font-black text-purple-600 dark:text-purple-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-amber-600 dark:text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Audio Control */}
      <div className="my-5 flex flex-col items-center">
        <FrequencySpectrum height={85} className="w-full max-w-md mb-4 bg-slate-900 dark:bg-slate-950" isActive={isPlaying} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!hasStartedAudio ? (
            <button
              type="button"
              onClick={handleManualStart}
              className="px-8 py-3.5 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-xl bg-purple-600 hover:bg-purple-500 text-white border-2 border-purple-400 shadow-purple-600/40 hover:scale-105 cursor-pointer active:scale-95 animate-pulse"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU NGHE HỢP ÂM (BẤM ĐỂ PHÁT)</span>
            </button>
          ) : (
            <>
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
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    <span>Nghe lại hợp âm</span>
                  </>
                )}
              </button>

              {question && (
                <button
                  type="button"
                  onClick={handlePlayAnchor}
                  disabled={isPlaying}
                  className="px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer active:scale-95"
                  title="Nghe lại âm chủ (Root note) của hợp âm"
                >
                  <Anchor className="w-4 h-4 text-purple-500" />
                  <span>Âm chủ: <strong>{question.rootNote}</strong></span>
                </button>
              )}
            </>
          )}

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

      {/* Guide text if not started */}
      {!hasStartedAudio && (
        <div className="p-3.5 my-2 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center text-xs text-purple-800 dark:text-purple-300 font-bold animate-pulse">
          🎧 Hãy bấm nút "BẮT ĐẦU NGHE HỢP ÂM" ở trên để nghe hòa âm và chọn đáp án!
        </div>
      )}

      {/* Options Grid (Cadence mode or Standard Chord mode) */}
      {isCadenceMode && cadenceQuestion ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {cadenceQuestion.options.map((opt) => {
            const isSelected = selectedCadenceOption?.type === opt.type;
            const isCorrect = isAnswered && opt.type === cadenceQuestion.targetCadence.type;
            const isButtonDisabled = isAnswered || isPlaying || !hasStartedAudio || !hasPlayedCurrentRound;

            let btnStyle = 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
            if (!hasStartedAudio || !hasPlayedCurrentRound) {
              btnStyle = 'bg-slate-100/70 dark:bg-slate-800/40 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed';
            } else if (isAnswered) {
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
                disabled={isButtonDisabled}
                onClick={() => handleSelectCadence(opt)}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    {opt.romanFormula}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {question?.options.map((opt) => {
            const isSelected = selectedOption?.type === opt.type;
            const isCorrect = opt.type === question.chordType;
            const isButtonDisabled = isAnswered || isPlaying || !hasStartedAudio || !hasPlayedCurrentRound;

            let btnStyle = 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
            if (!hasStartedAudio || !hasPlayedCurrentRound) {
              btnStyle = 'bg-slate-100/70 dark:bg-slate-800/40 border-2 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed';
            } else if (isAnswered) {
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
                disabled={isButtonDisabled}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                  <div className="flex items-center gap-1.5">
                    {isLearnMode && (
                      <button
                        type="button"
                        title={`Nghe thử mẫu hợp âm ${opt.nameVi}`}
                        disabled={isPlaying || !hasStartedAudio}
                        onClick={(e) => handlePreviewOption(e, opt)}
                        className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          playingPreviewType === opt.type
                            ? 'bg-purple-500 text-white border-purple-400 animate-pulse scale-105 shadow-md'
                            : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:scale-110 active:scale-95'
                        }`}
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingPreviewType === opt.type ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                      {opt.type}
                    </span>
                  </div>
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
      )}

      {/* Deliberate Practice & Ear Training Deep Feedback */}
      {question && isLearnMode && (
        <EarTrainingLearningCard
          theoryModuleId="chords"
          theoryTitle="3. Hợp Âm (Chords)"
          isAnswered={isAnswered}
          isCorrect={selectedOption?.type === question.chordType}
          rootNote={question.rootNote}
          targetNotes={question.notes}
          userNotes={selectedOption && question ? selectedOption.formula.map(interval => transposeNote(question.rootNote, interval)) : []}
          correctName={question.typeInfo.nameVi}
          correctCode={question.typeInfo.type}
          correctDescription={`Công thức: [${question.typeInfo.formula.join(', ')}] • ${question.typeInfo.feelDescription}`}
          mnemonicSong={question.typeInfo.mnemonicVi}
          pedagogicalTip={question.typeInfo.tipVi}
          userChoiceName={selectedOption?.nameVi}
          userChoiceCode={selectedOption?.type}
          onPlayQuestion={() => playCurrentChord(question)}
          onPlayUserChoice={playUserChoiceChord}
          onPlayCorrectSample={() => playCurrentChord(question)}
          onNextRound={handleProceedNextRound}
          isLastRound={round >= maxRounds}
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
