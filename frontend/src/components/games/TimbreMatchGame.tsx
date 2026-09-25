import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine, IPlayNoteOptions } from '../../services/auditoryEngine';
import { 
  generateOvertoneQuestion, 
  IHarmonicOvertoneInfo, 
  generateArticulationQuestion, 
  IArticulationInfo 
} from '../../services/musicTheoryService';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Radio, Volume2, Play, CheckCircle2, XCircle, RotateCcw, GraduationCap, Zap, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface ITimbreOption {
  id: string;
  nameVi: string;
  descriptionVi: string;
  waveform: OscillatorType;
  filterCutoff?: number;
  filterType?: BiquadFilterType;
  detuneCents?: number;
  iconSvg?: string;
}

const WAVEFORM_OPTIONS: ITimbreOption[] = [
  {
    id: 'sine',
    nameVi: 'Sóng Hình Sin (Sine)',
    descriptionVi: 'Mịn màng, êm dịu, đơn âm thuần khiết không có bồi âm',
    waveform: 'sine'
  },
  {
    id: 'triangle',
    nameVi: 'Sóng Tam Giác (Triangle)',
    descriptionVi: 'Ấm áp, mộc mạc như tiếng sáo, bồi âm lẻ suy giảm nhanh',
    waveform: 'triangle'
  },
  {
    id: 'square',
    nameVi: 'Sóng Vuông (Square)',
    descriptionVi: 'Âm sắc điện tử 8-bit chíp chíp rực rỡ, bồi âm bậc lẻ',
    waveform: 'square'
  },
  {
    id: 'sawtooth',
    nameVi: 'Sóng Răng Cưa (Sawtooth)',
    descriptionVi: 'Sắc sảo, gắt gỏng như đàn dây/kèn đồng, dồi dào trọn vẹn bồi âm',
    waveform: 'sawtooth'
  }
];

const FILTER_OPTIONS: ITimbreOption[] = [
  {
    id: 'lowpass-muffled',
    nameVi: 'Lọc Trầm Sâu (Lowpass 600Hz)',
    descriptionVi: 'Cắt toàn bộ âm cao, âm thanh trầm đục như nghe qua tường',
    waveform: 'sawtooth',
    filterCutoff: 600,
    filterType: 'lowpass'
  },
  {
    id: 'lowpass-warm',
    nameVi: 'Lọc Trung Ấm (Lowpass 1800Hz)',
    descriptionVi: 'Âm ấm áp, vừa vặn, giữ lại một phần hoạ âm trung',
    waveform: 'sawtooth',
    filterCutoff: 1800,
    filterType: 'lowpass'
  },
  {
    id: 'bright-raw',
    nameVi: 'Sáng Nguyên Bản (Không lọc)',
    descriptionVi: 'Đầy đủ toàn bộ dải tần số sắc nhọn không bị triệt tiêu',
    waveform: 'sawtooth',
    filterCutoff: 16000,
    filterType: 'lowpass'
  }
];

export const TimbreMatchGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, navigateToTheory } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('timbre-match') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Decide mode: waveform, filter, overtone, or articulation
  const isOvertoneMode = effectiveLevel === 9;
  const isArticulationMode = effectiveLevel === 8 || effectiveLevel === 10;
  const isFilterMode = (effectiveLevel >= 5 && effectiveLevel <= 7);
  const optionsPool = useMemo(() => (isFilterMode ? FILTER_OPTIONS : WAVEFORM_OPTIONS), [isFilterMode]);

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [targetOption, setTargetOption] = useState<ITimbreOption | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ITimbreOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Overtone question state (M0-1)
  const [overtoneQuestion, setOvertoneQuestion] = useState<ReturnType<typeof generateOvertoneQuestion> | null>(null);
  const [selectedHarmonicNum, setSelectedHarmonicNum] = useState<number | null>(null);
  const currentOvertoneRef = useRef<ReturnType<typeof generateOvertoneQuestion> | null>(null);

  // Articulation question state (M0-3)
  const [articulationQuestion, setArticulationQuestion] = useState<ReturnType<typeof generateArticulationQuestion> | null>(null);
  const [selectedArtType, setSelectedArtType] = useState<string | null>(null);
  const currentArtRef = useRef<ReturnType<typeof generateArticulationQuestion> | null>(null);

  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLearnMode, setIsLearnMode] = useState<boolean>(true);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(-1);

  const generateNextRound = useCallback(() => {
    if (isOvertoneMode) {
      const q = generateOvertoneQuestion('C3', [2, 3, 4, 5], 10);
      currentOvertoneRef.current = q;
      setOvertoneQuestion(q);
      setSelectedHarmonicNum(null);
      setIsAnswered(false);
    } else if (isArticulationMode) {
      const q = generateArticulationQuestion(['legato', 'staccato', 'tenuto', 'accent'], ['C4', 'E4', 'G4', 'C5']);
      currentArtRef.current = q;
      setArticulationQuestion(q);
      setSelectedArtType(null);
      setIsAnswered(false);
    } else {
      const pool = [...optionsPool];
      const target = pool[Math.floor(Math.random() * pool.length)];
      setTargetOption(target);
      setCurrentOptions(pool);
      setSelectedOptionId(null);
      setIsAnswered(false);
    }
  }, [optionsPool, isOvertoneMode, isArticulationMode]);

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

  // Play target sound
  const playTargetSound = useCallback(async (target = targetOption) => {
    setIsPlaying(true);
    setHasStartedAudio(true);
    try {
      await auditoryEngine.resumeAudioContext();

      if (isOvertoneMode) {
        const q = currentOvertoneRef.current || overtoneQuestion;
        if (q) {
          await auditoryEngine.playOvertoneStimulus(q.baseNote, q.boostHarmonicIndex, q.boostDb, 1.8);
        }
      } else if (isArticulationMode) {
        const q = currentArtRef.current || articulationQuestion;
        if (q) {
          await auditoryEngine.playArticulatedSequence(q.notes, q.targetType, 380);
        }
      } else if (target) {
        const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
        const opts: IPlayNoteOptions = {
          waveform: target.waveform,
          filterCutoff: target.filterCutoff,
          filterType: target.filterType,
          volume: 0.45
        };

        auditoryEngine.playNote(note, 0.9, opts);
        await new Promise(resolve => setTimeout(resolve, 950));
      }
      trialStartTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error playing timbre:', err);
    } finally {
      setIsPlaying(false);
    }
  }, [targetOption, overtoneQuestion, articulationQuestion, effectiveLevel, round, isOvertoneMode, isArticulationMode]);

  // Auto-play when question changes IF user already unlocked audio
  useEffect(() => {
    if (hasStartedAudio && !isAnswered && playedRoundRef.current !== round) {
      playedRoundRef.current = round;
      const t = setTimeout(() => {
        playTargetSound(targetOption);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [targetOption, overtoneQuestion, articulationQuestion, hasStartedAudio, isAnswered, round, playTargetSound]);

  // Option preview play button
  const previewOptionSound = async (opt: ITimbreOption, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPlayingPreviewId(opt.id);
      await auditoryEngine.resumeAudioContext();
      const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
      auditoryEngine.playNote(note, 0.65, {
        waveform: opt.waveform,
        filterCutoff: opt.filterCutoff,
        filterType: opt.filterType,
        volume: 0.4
      });
      await new Promise(r => setTimeout(r, 700));
    } catch (err) {
      console.warn('Timbre preview error:', err);
    } finally {
      setPlayingPreviewId(null);
    }
  };

  const handleProceedNextRound = useCallback(() => {
    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(prev => prev + 1);
      generateNextRound();
    }
  }, [round, maxRounds, generateNextRound]);

  const handleSelectOption = (opt: ITimbreOption) => {
    if (isAnswered || !targetOption || isPlaying) return;

    setSelectedOptionId(opt.id);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.id === targetOption.id;
    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 200);
    }

    emitTrialEvent({
      exerciseSlug: 'timbre-match',
      level: effectiveLevel,
      relationId: 'SIMILARITY_DIFF',
      entities: {
        target: targetOption.id,
        response: opt.id
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  const handleSelectOvertone = (opt: IHarmonicOvertoneInfo) => {
    if (isAnswered || !overtoneQuestion || isPlaying) return;

    setSelectedHarmonicNum(opt.harmonicNumber);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.harmonicNumber === overtoneQuestion.boostHarmonicIndex;
    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 250);
    }

    emitTrialEvent({
      exerciseSlug: 'timbre-match',
      level: effectiveLevel,
      relationId: 'PART_WHOLE',
      entities: {
        targetHarmonic: overtoneQuestion.boostHarmonicIndex,
        selectedHarmonic: opt.harmonicNumber,
        baseNote: overtoneQuestion.baseNote
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  const handleSelectArticulation = (opt: IArticulationInfo) => {
    if (isAnswered || !articulationQuestion || isPlaying) return;

    setSelectedArtType(opt.type);
    setIsAnswered(true);
    const reactionMs = Date.now() - trialStartTimeRef.current;

    const isCorrect = opt.type === articulationQuestion.targetType;
    auditoryEngine.playFeedback(isCorrect);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 250);
    }

    emitTrialEvent({
      exerciseSlug: 'timbre-match',
      level: effectiveLevel,
      relationId: 'TEMPORAL_PREDICT',
      entities: {
        targetArticulation: articulationQuestion.targetType,
        selectedArticulation: opt.type
      },
      stateBefore: 'idle',
      stateAfter: 'answered',
      responseMs: reactionMs,
      correct: isCorrect
    });

    if (!isLearnMode) {
      setTimeout(() => {
        handleProceedNextRound();
      }, 1500);
    }
  };

  const previewOvertoneSound = async (harmonicIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPlayingPreviewId(`harm-${harmonicIndex}`);
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playOvertoneStimulus('C3', harmonicIndex, 10, 1.2);
    } catch (err) {
      console.warn('Overtone preview error:', err);
    } finally {
      setPlayingPreviewId(null);
    }
  };

  const previewArticulationSound = async (type: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPlayingPreviewId(`art-${type}`);
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playArticulatedSequence(['C4', 'E4', 'G4', 'C5'], type, 320);
    } catch (err) {
      console.warn('Articulation preview error:', err);
    } finally {
      setPlayingPreviewId(null);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isOvertoneMode ? 'Phân Biệt Họa Âm (Overtones - Cấp 9)' : isArticulationMode ? 'Khớp Kỹ Thuật Diễn Tấu (Articulation)' : 'Phân Biệt Âm Sắc (Timbre Match)'}
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {isOvertoneMode
                ? 'Lắng nghe năng lượng họa âm (bồi âm Fourier) được khuếch đại bên trong nốt trầm C3'
                : isArticulationMode
                ? 'Lắng nghe trường độ ngắt/nối và độ nẩy năng lượng (Legato, Staccato, Tenuto, Accent)'
                : 'Lắng nghe màu sắc phổ âm và chọn đúng dạng sóng dao động hoặc bộ lọc tần số'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setIsLearnMode(!isLearnMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isLearnMode
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Bật/Tắt chế độ học sâu với gợi ý âm sắc và đối chiếu phổ âm"
          >
            {isLearnMode ? (
              <>
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>Chế độ: Học sâu</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-400" />
                <span>Chế độ: Thử thách</span>
              </>
            )}
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Câu: <span className="font-black text-emerald-600 dark:text-emerald-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold shadow-sm">
            Thời gian: <span className="font-black text-amber-600 dark:text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Play Button */}
      <div className="my-6 flex flex-col items-center">
        <FrequencySpectrum height={90} className="w-full max-w-md mb-4 bg-slate-900 dark:bg-slate-950" isActive={isPlaying} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => playTargetSound()}
            disabled={isPlaying}
            className={`px-7 py-3 rounded-full font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-2 border-emerald-500 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400 shadow-emerald-600/30 hover:scale-105 cursor-pointer'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-5 h-5 animate-spin" />
                <span>Đang phát âm thanh...</span>
              </>
            ) : hasStartedAudio ? (
              <>
                <RotateCcw className="w-5 h-5" />
                <span>Nghe lại âm thanh</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu nghe (Nhấn để phát)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Options Grid: Overtone Mode */}
      {isOvertoneMode && overtoneQuestion && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {overtoneQuestion.options.map((opt) => {
            const isSelected = selectedHarmonicNum === opt.harmonicNumber;
            const isCorrect = opt.harmonicNumber === overtoneQuestion.boostHarmonicIndex;

            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
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
              <div
                key={opt.harmonicNumber}
                onClick={() => handleSelectOvertone(opt)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                    <span className="ml-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {opt.intervalFromRoot}
                    </span>
                  </div>
                  <button
                    type="button"
                    title={`Nghe thử ${opt.nameVi}`}
                    onClick={(e) => previewOvertoneSound(opt.harmonicNumber, e)}
                    className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      playingPreviewId === `harm-${opt.harmonicNumber}`
                        ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse scale-105 shadow-md'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:scale-110 active:scale-95'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingPreviewId === `harm-${opt.harmonicNumber}` ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">{opt.ratioDescription}</div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{opt.musicalRoleVi}</p>
                <div className="mt-2 flex items-center justify-end">
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Options Grid: Articulation Mode */}
      {isArticulationMode && articulationQuestion && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {articulationQuestion.options.map((opt) => {
            const isSelected = selectedArtType === opt.type;
            const isCorrect = opt.type === articulationQuestion.targetType;

            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
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
              <div
                key={opt.type}
                onClick={() => handleSelectArticulation(opt)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-serif font-black">{opt.symbol}</span>
                    <div>
                      <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                      <span className="ml-2 text-xs italic text-slate-500">({opt.nameEn})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    title={`Nghe mẫu ${opt.nameVi}`}
                    onClick={(e) => previewArticulationSound(opt.type, e)}
                    className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      playingPreviewId === `art-${opt.type}`
                        ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse scale-105 shadow-md'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:scale-110 active:scale-95'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingPreviewId === `art-${opt.type}` ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">{opt.feelDescription}</p>
                <div className="mt-2 flex items-center justify-end">
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Options Grid: Standard Waveform / Filter Mode */}
      {!isOvertoneMode && !isArticulationMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-3">
          {currentOptions.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === targetOption?.id;

            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white shadow-sm';
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
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] ${btnStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={`Nghe thử mẫu ${opt.nameVi}`}
                      onClick={(e) => previewOptionSound(opt, e)}
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        playingPreviewId === opt.id
                          ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse scale-105 shadow-md'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:scale-110 active:scale-95'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${playingPreviewId === opt.id ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">{opt.descriptionVi}</p>
                <div className="mt-2 flex items-center justify-end">
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deliberate Learning & Audio Calibration Card */}
      {isAnswered && isLearnMode && (
        <div className="w-full max-w-2xl mx-auto my-3 p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xl backdrop-blur-md animate-fadeIn">
          {/* Header result */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {isOvertoneMode && overtoneQuestion ? (
                selectedHarmonicNum === overtoneQuestion.boostHarmonicIndex ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        Chính xác! Bạn đã phát hiện đúng Họa âm {overtoneQuestion.boostHarmonicIndex}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Năng lượng phổ ở tần số {overtoneQuestion.boostHarmonicIndex}f đã được khuếch đại +10dB so với nền Fourier cơ bản.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">
                        Chưa chính xác — Họa âm đúng là bậc {overtoneQuestion.boostHarmonicIndex}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hãy nhấn vào trạm đối chiếu bên dưới để so sánh phổ âm của lựa chọn và đáp án đúng.
                      </p>
                    </div>
                  </>
                )
              ) : isArticulationMode && articulationQuestion ? (
                selectedArtType === articulationQuestion.targetType ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        Chính xác! Đây là kỹ thuật {articulationQuestion.options.find(o => o.type === articulationQuestion.targetType)?.nameVi}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Khả năng phân tách trường độ động và bao âm ADSR chuẩn xác.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">
                        Chưa chính xác — Kỹ thuật đúng là {articulationQuestion.options.find(o => o.type === articulationQuestion.targetType)?.nameVi}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hãy đối chiếu sự khác biệt giữa các độ ngắt/nối bên dưới.
                      </p>
                    </div>
                  </>
                )
              ) : targetOption && (
                selectedOptionId === targetOption.id ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        Chính xác! Bạn đã nhận diện đúng {targetOption.nameVi}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tai bạn đã bắt chuẩn phổ hoạ âm và độ sắc của âm sắc.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">
                        Chưa chính xác — Hãy đối chiếu âm sắc
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bạn đã chọn <span className="font-bold text-rose-600 dark:text-rose-400">{currentOptions.find(o => o.id === selectedOptionId)?.nameVi}</span>, đáp án đúng là <span className="font-bold text-emerald-600 dark:text-emerald-400">{targetOption.nameVi}</span>.
                      </p>
                    </div>
                  </>
                )
              )}
            </div>

            <button
              type="button"
              onClick={handleProceedNextRound}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>{round >= maxRounds ? 'Xem Kết Quả' : 'Câu Kế Tiếp'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3-way Audio Calibration Station */}
          <div className="my-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              🎧 Trạm đối chiếu âm học (A/B Audio Comparison):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => playTargetSound()}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Nghe Lại Câu Hỏi</span>
              </button>

              {isOvertoneMode && overtoneQuestion ? (
                <>
                  {selectedHarmonicNum && selectedHarmonicNum !== overtoneQuestion.boostHarmonicIndex && (
                    <button
                      type="button"
                      disabled={isPlaying}
                      onClick={(e) => previewOvertoneSound(selectedHarmonicNum, e)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Họa âm bạn chọn (Bậc {selectedHarmonicNum})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPlaying}
                    onClick={(e) => previewOvertoneSound(overtoneQuestion.boostHarmonicIndex, e)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Họa âm đúng (Bậc {overtoneQuestion.boostHarmonicIndex})</span>
                  </button>
                </>
              ) : isArticulationMode && articulationQuestion ? (
                <>
                  {selectedArtType && selectedArtType !== articulationQuestion.targetType && (
                    <button
                      type="button"
                      disabled={isPlaying}
                      onClick={(e) => previewArticulationSound(selectedArtType, e)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cách phát âm bạn chọn</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPlaying}
                    onClick={(e) => previewArticulationSound(articulationQuestion.targetType, e)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Mẫu phát âm đúng ({articulationQuestion.targetType})</span>
                  </button>
                </>
              ) : targetOption && (
                <>
                  {selectedOptionId && selectedOptionId !== targetOption.id && (
                    <button
                      type="button"
                      disabled={isPlaying}
                      onClick={(e) => {
                        const picked = currentOptions.find(o => o.id === selectedOptionId);
                        if (picked) previewOptionSound(picked, e);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Nghe Lựa Chọn Của Bạn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPlaying}
                    onClick={() => playTargetSound(targetOption)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe Mẫu Chuẩn ({targetOption.nameVi.split(' ')[0]})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Educational Note & Theory Link */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400 text-xs italic max-w-md">
              {isOvertoneMode 
                ? '💡 Dãy bồi âm (Harmonic Series): F0=căn bản, 2f=quãng 8, 3f=quãng 5, 4f=quãng 8 kép, 5f=quãng 3 trưởng. Tỷ lệ năng lượng bồi âm định hình âm sắc của mọi nhạc cụ tự nhiên.'
                : isArticulationMode
                ? '💡 Khớp âm: Legato nối liền, Staccato ngắn 35% dứt khoát, Tenuto giữ trọn 95%, Accent có lực nhấn bộc phát ban đầu. Chúng thay đổi hoàn toàn cảm xúc câu nhạc dù cùng nốt cao độ.'
                : '💡 Đặc tính: Sóng Sin êm dịu thuần khiết (không có bồi âm). Sóng Tam giác ấm áp (bồi âm lẻ tắt nhanh). Sóng Vuông sắc cạnh 8-bit. Sóng Răng cưa sáng và bén nhất (trọn vẹn mọi hoạ âm).'}
            </p>
            <button
              type="button"
              onClick={() => navigateToTheory('timbre')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mở bài học: 6. Âm Sắc (Timbre & Bồi Âm)</span>
            </button>
          </div>
        </div>
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
            generateNextRound();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
