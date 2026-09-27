import React, { useMemo } from 'react';
import { IVocalPitchReading, IVocalPitchMatchEvaluation } from '../../services/vocalPitchService';
import { Mic, ArrowLeft, ArrowRight, CheckCircle2, Zap, Volume2 } from 'lucide-react';

interface CentsTunerGaugeProps {
  reading: IVocalPitchReading | null;
  evaluation: IVocalPitchMatchEvaluation | null;
  targetNote: string;
  targetSolfege: string;
  targetFreqHz?: number;
  toleranceCents: number;
  onReplayPrompt?: () => void;
  className?: string;
}

export const CentsTunerGauge: React.FC<CentsTunerGaugeProps> = ({
  reading,
  evaluation,
  targetNote,
  targetSolfege,
  targetFreqHz,
  toleranceCents,
  onReplayPrompt,
  className = '',
}) => {
  const isSinging = reading?.isSinging && (reading?.freqHz ?? 0) > 0;
  const centsDiff = evaluation ? evaluation.centsDiff : 0;
  const clampedCents = Math.max(-50, Math.min(50, centsDiff));
  const needlePercent = ((clampedCents + 50) / 100) * 100; // 0% (-50c) to 100% (+50c)

  const isInTune = evaluation?.inTolerance && isSinging;
  const isFlat = centsDiff < -toleranceCents && isSinging;
  const isSharp = centsDiff > toleranceCents && isSinging;

  // Gauge state colors
  const statusColor = useMemo(() => {
    if (!isSinging) return 'text-slate-500 border-slate-700 bg-slate-900/60';
    if (isInTune) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40 shadow-emerald-500/20';
    if (Math.abs(centsDiff) <= toleranceCents * 1.5) return 'text-amber-400 border-amber-500/50 bg-amber-950/40 shadow-amber-500/20';
    return 'text-rose-400 border-rose-500/50 bg-rose-950/40 shadow-rose-500/20';
  }, [isSinging, isInTune, centsDiff, toleranceCents]);

  const needleColor = useMemo(() => {
    if (!isSinging) return 'bg-slate-600 shadow-none';
    if (isInTune) return 'bg-emerald-400 shadow-[0_0_12px_#34d399]';
    if (Math.abs(centsDiff) <= toleranceCents * 1.5) return 'bg-amber-400 shadow-[0_0_12px_#fbbf24]';
    return 'bg-rose-400 shadow-[0_0_12px_#f43f5e]';
  }, [isSinging, isInTune, centsDiff, toleranceCents]);

  // Safe tolerance zone width in percentage (centered at 50%)
  const tolerancePercentWidth = (toleranceCents / 50) * 50; // if 25c -> 25% on each side = 50% width
  const toleranceLeft = 50 - tolerancePercentWidth;
  const toleranceWidth = tolerancePercentWidth * 2;

  // VU meter percentage (from -60 dBFS to 0 dBFS)
  const volumeDb = reading?.volumeDb ?? -100;
  const vuPercent = Math.max(0, Math.min(100, ((volumeDb + 50) / 45) * 100));

  return (
    <div className={`flex flex-col items-center justify-between p-4 rounded-3xl backdrop-blur-xl border border-slate-800/80 bg-slate-950/80 shadow-2xl transition-all duration-300 ${className}`}>
      {/* Top Header: Target vs Singing Note */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-2 mb-3">
        {/* Target Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/80">Mục tiêu</span>
            <span className="text-sm font-black tracking-tight text-white">
              {targetNote} <span className="text-xs font-medium text-indigo-300 font-sans">({targetSolfege})</span>
              {targetFreqHz && (
                <span className="text-[10px] font-mono font-normal text-indigo-400 ml-1.5 opacity-90">
                  {targetFreqHz.toFixed(1)}Hz
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Replay Prompt Button & Dynamic Singing Status */}
        <div className="flex items-center gap-2">
          {onReplayPrompt && (
            <button
              onClick={onReplayPrompt}
              title="Phím tắt: Space"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/60 text-indigo-300 hover:text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nghe lại nốt</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-indigo-900/80 text-[10px] text-indigo-300 font-mono">
                Space
              </kbd>
            </button>
          )}

          {evaluation?.octaveOffset !== 0 && evaluation && isSinging && (
            <span className="px-2 py-1 rounded-xl text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-600/50 text-amber-300">
              {evaluation.octaveOffset > 0 ? `+${evaluation.octaveOffset} Octave` : `${evaluation.octaveOffset} Octave`}
            </span>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono tracking-wider transition-all duration-200 ${statusColor}`}>
            {isInTune ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>IN TUNE (±{toleranceCents}c)</span>
              </>
            ) : isFlat ? (
              <>
                <ArrowRight className="w-4 h-4 text-rose-400 rotate-180 animate-pulse" />
                <span>HÁT CAO LÊN (FLAT)</span>
              </>
            ) : isSharp ? (
              <>
                <ArrowRight className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>HÁT TRẦM XUỐNG (SHARP)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-500 animate-pulse" />
                <span>CHỜ GIỌNG HÁT...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Pitch & Cents readout */}
      <div className="flex items-baseline gap-3 my-2 text-center">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {isSinging ? reading?.noteName : '--'}
          </span>
          <span className="text-xs font-bold text-slate-400">
            {isSinging ? reading?.solfegeName : 'Im lặng'}
          </span>
        </div>

        <div className="flex flex-col items-start pl-3 border-l border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400">
            {isSinging ? `${reading?.freqHz.toFixed(1)} Hz` : '0.0 Hz'}
          </span>
          <span className={`text-base font-mono font-black ${isInTune ? 'text-emerald-400' : isSinging ? 'text-rose-400' : 'text-slate-600'}`}>
            {isSinging ? `${centsDiff > 0 ? '+' : ''}${centsDiff} cents` : '0 cents'}
          </span>
        </div>
      </div>

      {/* Vernier / Slider Gauge Bar */}
      <div className="w-full relative px-2 my-3">
        {/* Scale labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1 px-1 select-none">
          <span className="flex items-center gap-0.5"><ArrowLeft className="w-2.5 h-2.5" /> -50c</span>
          <span>-25c</span>
          <span className="text-emerald-400 font-bold">0c</span>
          <span>+25c</span>
          <span className="flex items-center gap-0.5">+50c <ArrowRight className="w-2.5 h-2.5" /></span>
        </div>

        {/* Gauge Track */}
        <div className="w-full h-5 rounded-full bg-slate-900 border border-slate-800 relative overflow-hidden shadow-inner flex items-center">
          {/* Grid tick marks */}
          <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-30">
            {[...Array(11)].map((_, i) => (
              <div key={i} className={`w-[1px] h-full ${i === 5 ? 'bg-white opacity-80' : 'bg-slate-500'}`} />
            ))}
          </div>

          {/* Tolerance Safe Zone (Translucent Emerald Box) */}
          <div
            className="absolute h-full bg-emerald-500/20 border-x border-emerald-400/40 backdrop-blur-sm pointer-events-none transition-all duration-300"
            style={{
              left: `${Math.max(0, toleranceLeft)}%`,
              width: `${Math.min(100, toleranceWidth)}%`,
            }}
          />

          {/* Center Zero Anchor Indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-emerald-400/70 z-10" />

          {/* Real-time Moving Needle */}
          <div
            className={`absolute top-0 bottom-0 w-2.5 -translate-x-1/2 rounded-full transition-all duration-75 ease-out z-20 ${needleColor}`}
            style={{
              left: `${needlePercent}%`,
              opacity: isSinging ? 1 : 0.25,
            }}
          />
        </div>
      </div>

      {/* Bottom VU Meter Bar (Microphone Level) */}
      <div className="w-full flex items-center gap-2 px-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
        <Mic className={`w-3.5 h-3.5 ${isSinging ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
        <span className="text-[10px] opacity-75">Âm lượng Mic:</span>
        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              vuPercent > 80 ? 'bg-rose-500' : vuPercent > 40 ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
            style={{ width: `${vuPercent}%` }}
          />
        </div>
        <span className="w-10 text-right opacity-60">{volumeDb > -90 ? `${volumeDb} dB` : '-inf'}</span>
      </div>
    </div>
  );
};
