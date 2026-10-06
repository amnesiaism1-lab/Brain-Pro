import React from 'react';
import { IReferencePitchPoint } from '../../../services/vocalFileAnalysisService';
import { IVocalPitchReading } from '../../../services/vocalPitchService';
import { PitchFeedbackDetail, NOTE_NAMES, SOLFEGE_NAMES } from '../utils/vocalHelpers';
import { Music, Mic, Activity } from 'lucide-react';

interface LivePitchMonitorBarProps {
  currentRefPoint: IReferencePitchPoint | null;
  userReading: IVocalPitchReading | null;
  currentCentsDiff: number;
  toleranceCents: number;
  pitchFeedback: PitchFeedbackDetail;
  smartOctaveFold: boolean;
}

export const LivePitchMonitorBar: React.FC<LivePitchMonitorBarProps> = ({
  currentRefPoint,
  userReading,
  currentCentsDiff,
  toleranceCents,
  pitchFeedback,
  smartOctaveFold,
}) => {
  const isSinging = !!userReading?.isSinging && userReading.freqHz > 0;

  // Extract pitch class index (0..11) for chromatic strip
  const refPitchClass = currentRefPoint?.isVocal && currentRefPoint.midi > 0
    ? Math.round(currentRefPoint.midi) % 12
    : null;

  let userPitchClass: number | null = null;
  if (isSinging && userReading) {
    const rawMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;
    userPitchClass = Math.round(rawMidi) % 12;
  }

  // Calculate gauge needle percentage (-50 cents to +50 cents mapped to 0..100%)
  const clampedCents = Math.max(-50, Math.min(50, currentCentsDiff));
  const needlePercent = ((clampedCents + 50) / 100) * 100;

  return (
    <div className="p-3.5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        
        {/* Box 1: Reference Song Target Note */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Nốt Bài Hát Mẫu</div>
            {currentRefPoint?.isVocal ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base font-black font-mono text-indigo-300">
                  {currentRefPoint.noteName}
                </span>
                <span className="text-xs text-indigo-400 font-semibold truncate">
                  ({currentRefPoint.solfegeName})
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  {Math.round(currentRefPoint.freqHz)} Hz
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic mt-0.5">Đoạn nghỉ / Nhạc đệm</div>
            )}
          </div>
        </div>

        {/* Box 2: Cents Deviation Needle & Feedback */}
        <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-400 uppercase">Độ Khớp Cao Độ</span>
            <span className={`font-bold ${pitchFeedback.badgeClass}`}>
              {pitchFeedback.text}
            </span>
          </div>

          {/* Tuner Gauge Bar */}
          <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden my-0.5">
            {/* Center Tolerance Zone */}
            <div 
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
              style={{
                left: `${50 - (toleranceCents / 100) * 50}%`,
                width: `${(toleranceCents / 100) * 100}%`,
              }}
            />
            {/* Center Zero Mark */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 -translate-x-1/2" />

            {/* Dynamic Needle */}
            {isSinging && (
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full shadow-md transition-all duration-75 -translate-x-1/2 ${
                  Math.abs(currentCentsDiff) <= toleranceCents
                    ? 'bg-emerald-400 shadow-emerald-400/50'
                    : currentCentsDiff < 0
                    ? 'bg-amber-400 shadow-amber-400/50'
                    : 'bg-rose-400 shadow-rose-400/50'
                }`}
                style={{ left: `${needlePercent}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5">
            <span>-50 cents (Non)</span>
            <span>{isSinging ? `${currentCentsDiff > 0 ? `+${currentCentsDiff}` : currentCentsDiff} cents` : '–'}</span>
            <span>+50 cents (Gắt)</span>
          </div>
        </div>

        {/* Box 3: Live User Sung Note */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
            isSinging
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Mic className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Giọng Bạn Đang Hát</div>
            {isSinging && userReading ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base font-black font-mono text-emerald-300">
                  {userReading.noteName}
                </span>
                <span className="text-xs text-emerald-400 font-semibold truncate">
                  ({userReading.solfegeName})
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  {Math.round(userReading.freqHz * 10) / 10} Hz
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic mt-0.5">Đang lắng nghe mic...</div>
            )}
          </div>
        </div>

      </div>

      {/* Mini 12-Tone Chromatic Pitch Comparison Strip */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1 overflow-x-auto text-[10px] font-mono">
        <span className="text-slate-500 uppercase text-[9px] mr-1 shrink-0 hidden sm:inline">Âm giai:</span>
        {NOTE_NAMES.map((note, idx) => {
          const isTarget = refPitchClass === idx;
          const isUser = userPitchClass === idx;

          let badgeStyle = 'bg-slate-900/70 text-slate-500 border-slate-800/80';
          if (isTarget && isUser) {
            badgeStyle = 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/30 scale-105';
          } else if (isTarget) {
            badgeStyle = 'bg-indigo-500 text-white font-black border-indigo-400 shadow-sm';
          } else if (isUser) {
            badgeStyle = 'bg-emerald-600/80 text-white font-bold border-emerald-500';
          }

          return (
            <div
              key={note}
              className={`flex-1 min-w-[28px] py-1 text-center rounded-lg border transition-all ${badgeStyle}`}
              title={`${note} (${SOLFEGE_NAMES[idx]})`}
            >
              <div>{note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
