import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, INFINITY_ROMAN_NUMERALS } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { auditoryEngine, IPlayNoteOptions } from '../../services/auditoryEngine';
import { FrequencySpectrum } from '../ui/FrequencySpectrum';
import { Radio, Volume2, Play, CheckCircle2, XCircle, Activity } from 'lucide-react';

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
  const optionsPool = isFilterMode ? FILTER_OPTIONS : WAVEFORM_OPTIONS;

  // Game state
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [targetOption, setTargetOption] = useState<ITimbreOption | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ITimbreOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());

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
  const playTargetSound = useCallback(() => {
    if (!targetOption || isPlaying) return;
    setIsPlaying(true);
    auditoryEngine.initContext();

    const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
    const opts: IPlayNoteOptions = {
      waveform: targetOption.waveform,
      filterCutoff: targetOption.filterCutoff,
      filterType: targetOption.filterType,
      volume: 0.4
    };

    auditoryEngine.playNote(note, 0.9, opts);

    setTimeout(() => {
      setIsPlaying(false);
      trialStartTimeRef.current = Date.now();
    }, 950);
  }, [targetOption, isPlaying, effectiveLevel, round]);

  // Preview an option's sound for player to learn
  const previewOptionSound = (opt: ITimbreOption, e: React.MouseEvent) => {
    e.stopPropagation();
    auditoryEngine.initContext();
    const note = effectiveLevel >= 4 ? (round % 2 === 0 ? 'G3' : 'E4') : 'A3';
    auditoryEngine.playNote(note, 0.5, {
      waveform: opt.waveform,
      filterCutoff: opt.filterCutoff,
      filterType: opt.filterType,
      volume: 0.35
    });
  };

  // Auto-play when question changes
  useEffect(() => {
    if (targetOption && !isAnswered && !isPlaying) {
      const t = setTimeout(() => {
        playTargetSound();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [targetOption, isAnswered, isPlaying, playTargetSound]);

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
    <div className="relative min-h-[560px] flex flex-col justify-between p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Phân Biệt Âm Sắc (Timbre Match)</h2>
              {isInfinity && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950">
                  {INFINITY_ROMAN_NUMERALS[infinityTier - 1]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Lắng nghe màu sắc phổ âm và chọn đúng dạng sóng dao động hoặc bộ lọc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Câu: <span className="font-bold text-emerald-400">{round}/{maxRounds}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
            Thời gian: <span className="font-bold text-amber-400">{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Visualizer & Play Button */}
      <div className="my-6 flex flex-col items-center">
        <FrequencySpectrum height={90} className="w-full max-w-md mb-4" isActive={isPlaying} />

        <div className="flex items-center gap-3">
          <button
            onClick={playTargetSound}
            disabled={isPlaying}
            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 border transition-all ${
              isPlaying
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/40 hover:scale-105'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Đang phát âm sắc...' : 'Phát lại âm thanh'}
          </button>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto w-full my-4">
        {currentOptions.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = opt.id === targetOption?.id;

          let btnStyle = 'bg-slate-900/80 border-slate-700 hover:border-emerald-400 hover:bg-slate-800/80 text-white';
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
            <div
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] ${btnStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-black tracking-tight">{opt.nameVi}</span>
                <button
                  type="button"
                  title="Nghe thử âm mẫu này"
                  onClick={(e) => previewOptionSound(opt, e)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">{opt.descriptionVi}</p>
              <div className="mt-2 flex items-center justify-end">
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
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
