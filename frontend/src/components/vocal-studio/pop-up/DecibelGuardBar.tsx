import React, { useMemo } from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, Settings2 } from 'lucide-react';

interface DecibelGuardBarProps {
  currentDb: number;
  maxDbThreshold: number;
  onThresholdChange?: (newThreshold: number) => void;
  isMuted?: boolean;
  className?: string;
}

/**
 * DecibelGuardBar
 * Real-time sound level monitor specifically designed for office environments.
 * Prevents accidental loud singing/speaking by alerting the user before disturbing coworkers.
 */
export const DecibelGuardBar: React.FC<DecibelGuardBarProps> = ({
  currentDb,
  maxDbThreshold = 45,
  onThresholdChange,
  isMuted = false,
  className = '',
}) => {
  // Normalize dB value for display (typically -60 dBFS to 0 dBFS or 20 dBSPL to 70 dBSPL)
  // Here we normalize assuming a scaled range of 20 dB (whisper) to 65 dB (loud conversational)
  const displayDb = useMemo(() => {
    if (isMuted || !Number.isFinite(currentDb)) return 20;
    // Map typical vocal pitch mic dB values into friendly positive 20..70 dB scale
    if (currentDb < 0) {
      // Input is dBFS (e.g. -45 dBFS)
      return Math.max(20, Math.min(70, Math.round(currentDb + 75)));
    }
    return Math.max(20, Math.min(70, Math.round(currentDb)));
  }, [currentDb, isMuted]);

  const percentage = Math.max(0, Math.min(100, ((displayDb - 20) / 50) * 100));
  const isOverThreshold = displayDb > maxDbThreshold;
  const isNearThreshold = displayDb > maxDbThreshold - 5;

  const barColor = useMemo(() => {
    if (isOverThreshold) return 'bg-amber-500 shadow-amber-500/50';
    if (isNearThreshold) return 'bg-yellow-400 shadow-yellow-400/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  }, [isOverThreshold, isNearThreshold]);

  const textColor = useMemo(() => {
    if (isOverThreshold) return 'text-amber-400 font-bold';
    if (isNearThreshold) return 'text-yellow-300 font-semibold';
    return 'text-emerald-400';
  }, [isOverThreshold, isNearThreshold]);

  return (
    <div className={`flex flex-col gap-1 w-full text-xs select-none ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="font-mono text-[11px] text-slate-400">Độ ồn:</span>
          <span className={`font-mono text-[11px] transition-colors ${textColor}`}>
            {displayDb} dB
          </span>
          <span className="text-[10px] text-slate-500">
            (Ngưỡng: {maxDbThreshold} dB)
          </span>
        </div>

        {isOverThreshold ? (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.5 rounded animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            <span>Hạ giọng</span>
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Êm ái</span>
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60">
        {/* Safe Threshold Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 z-10"
          style={{ left: `${Math.max(0, Math.min(100, ((maxDbThreshold - 20) / 50) * 100))}%` }}
          title={`Ngưỡng cảnh báo: ${maxDbThreshold} dB`}
        />

        {/* Dynamic Level Bar */}
        <div
          className={`h-full transition-all duration-75 rounded-full ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
