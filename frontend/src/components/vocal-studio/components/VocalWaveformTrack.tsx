import React, { useRef } from 'react';
import { Mic, MoveHorizontal } from 'lucide-react';
import { IYouTubeTake } from '../../../services/youtubeTakeStorageService';
import { formatTimeMs } from '../utils/vocalHelpers';

interface VocalWaveformTrackProps {
  take: IYouTubeTake;
  beatCurrentTimeSec: number;
  beatDurationSec: number;
  nudgeOffsetMs: number;
  onSeekToBeatSec?: (sec: number) => void;
  className?: string;
}

export const VocalWaveformTrack: React.FC<VocalWaveformTrackProps> = ({
  take,
  beatCurrentTimeSec,
  beatDurationSec,
  nudgeOffsetMs,
  onSeekToBeatSec,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const duration = Math.max(10, beatDurationSec || 240);
  const effectiveStartSec = Math.max(0, take.startPointSec - (nudgeOffsetMs / 1000));
  const effectiveEndSec = effectiveStartSec + take.durationSec;

  const startPct = Math.max(0, Math.min(100, (effectiveStartSec / duration) * 100));
  const widthPct = Math.max(2, Math.min(100 - startPct, (take.durationSec / duration) * 100));
  const playheadPct = Math.max(0, Math.min(100, (beatCurrentTimeSec / duration) * 100));

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onSeekToBeatSec) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekToBeatSec(ratio * duration);
  };

  const peaks = take.waveformData && take.waveformData.length > 0
    ? take.waveformData
    : new Array(80).fill(0.3);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-bold text-slate-200">
            Take #{take.takeNumber}
          </span>
          {take.isBestTake && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              ★ Tốt nhất
            </span>
          )}
          <span className="text-slate-400 font-mono text-[10px]">
            ({formatTimeMs(Math.round(take.durationSec * 1000))})
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-400">
            Bắt đầu: <strong className="text-slate-300">{formatTimeMs(Math.round(effectiveStartSec * 1000))}</strong>
          </span>
          {nudgeOffsetMs !== 0 && (
            <span className={`px-1 rounded ${nudgeOffsetMs > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
              <MoveHorizontal className="w-2.5 h-2.5 inline mr-0.5" />
              {nudgeOffsetMs > 0 ? `+${nudgeOffsetMs}ms` : `${nudgeOffsetMs}ms`}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Timeline Track */}
      <div
        ref={containerRef}
        onClick={handleTrackClick}
        className="relative w-full h-14 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden cursor-pointer select-none group"
      >
        {/* Subtle grid divisions */}
        <div className="absolute inset-0 flex divide-x divide-slate-900/60 pointer-events-none">
          <div className="flex-1" />
          <div className="flex-1" />
          <div className="flex-1" />
          <div className="flex-1" />
        </div>

        {/* Vocal Waveform Clip (placed at its relative start position) */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-sky-950/40 border border-sky-500/30 flex items-center px-1 overflow-hidden transition-all duration-75 shadow-sm"
          style={{
            left: `${startPct}%`,
            width: `${widthPct}%`,
          }}
        >
          {/* Waveform bars */}
          <div className="w-full h-full flex items-center justify-between gap-[1px]">
            {peaks.map((peak, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-sky-400 to-indigo-300 rounded-full transition-all"
                style={{
                  height: `${Math.max(10, peak * 90)}%`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        </div>

        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none shadow-md z-10"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-full -ml-[4px] -mt-[2px] shadow-sm" />
        </div>
      </div>
    </div>
  );
};
