import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine, IPlayNoteOptions } from '../../services/auditoryEngine';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Radio, Volume2, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

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
  const { currentLevel, getExerciseLevel, setActiveGameSlug } = useAppStore();
  const { resetSession, emitTrialEvent, getRawMetricsJson } = useRelationSession();

  const effectiveLevel = getExerciseLevel('timbre-match') || currentLevel || 1;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Decide mode: waveform recognition or filter recognition
  const isFilterMode = (effectiveLevel >= 5 && effectiveLevel <= 7);
  const optionsPool = useMemo(() => (isFilterMode ? FILTER_OPTIONS : WAVEFORM_OPTIONS), [isFilterMode]);

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [targetOption, setTargetOption] = useState<ITimbreOption | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ITimbreOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(() => auditoryEngine.isAudioActive());
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const playedRoundRef = useRef<number>(-1);

  const generateNextRound = useCallback(() => {
    const pool = [...optionsPool];
    const target = pool[Math.floor(Math.random() * pool.length)];
    setTargetOption(target);
    setCurrentOptions(pool);
    setSelectedOptionId(null);
    setIsAnswered(false);
  }, [optionsPool]);

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
    if (!target) return;
    setIsPlaying(true);
    setHasStartedAudio(true);
    try {
      await auditoryEngine.resumeAudioContext();

      const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
      const opts: IPlayNoteOptions = {
        waveform: target.waveform,
        filterCutoff: target.filterCutoff,
        filterType: target.filterType,
        volume: 0.45
      };

      auditoryEngine.playNote(note, 0.9, opts);
      await new Promise(resolve => setTimeout(resolve, 950));
      trialStartTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error playing timbre:', err);
    } finally {
      setIsPlaying(false);
    }
  }, [targetOption, effectiveLevel, round]);

  // Auto-play when question changes IF user already unlocked audio
  useEffect(() => {
    if (targetOption && hasStartedAudio && !isAnswered && playedRoundRef.current !== round) {
      playedRoundRef.current = round;
      const t = setTimeout(() => {
        playTargetSound(targetOption);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [targetOption, hasStartedAudio, isAnswered, round, playTargetSound]);

  // Option preview play button
  const previewOptionSound = async (opt: ITimbreOption, e: React.MouseEvent) => {
    e.stopPropagation();
    await auditoryEngine.resumeAudioContext();
    const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
    auditoryEngine.playNote(note, 0.5, {
      waveform: opt.waveform,
      filterCutoff: opt.filterCutoff,
      filterType: opt.filterType,
      volume: 0.35
    });
  };

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

    setTimeout(() => {
      if (round >= maxRounds) {
        setIsFinished(true);
      } else {
        setRound(prev => prev + 1);
        generateNextRound();
      }
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 p-5 sm:p-7 bg-[#FAF6F0] dark:bg-slate-900 border border-[#DCD3C3] dark:border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between min-h-[580px] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Phân Biệt Âm Sắc (Timbre Match)
              </h2>
              {isInfinity && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Lắng nghe màu sắc phổ âm và chọn đúng dạng sóng dao động hoặc bộ lọc tần số
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
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
                <span>Đang phát âm sắc...</span>
              </>
            ) : hasStartedAudio ? (
              <>
                <RotateCcw className="w-5 h-5" />
                <span>Nghe lại âm thanh</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu nghe âm sắc (Nhấn để phát)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Options Grid */}
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
                <button
                  type="button"
                  title="Nghe thử âm sắc mẫu này"
                  onClick={(e) => previewOptionSound(opt, e)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-emerald-600 dark:text-emerald-400 transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
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
