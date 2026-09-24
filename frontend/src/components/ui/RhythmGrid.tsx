import React from 'react';
import { IRhythmStep } from '../../services/musicTheoryService';

interface IRhythmGridProps {
  steps: IRhythmStep[];
  currentPlayStep: number;     // Currently playing step index (-1 if idle)
  userTaps?: number[];         // Step indices where user tapped
  showTargetBeats?: boolean;   // Whether target hits are visible
  isPlaying?: boolean;
  isUserTurn?: boolean;
  className?: string;
}

export const RhythmGrid: React.FC<IRhythmGridProps> = ({
  steps,
  currentPlayStep,
  userTaps = [],
  showTargetBeats = true,
  isPlaying = false,
  isUserTurn = false,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
        <span>Tiết tấu {steps.length} phách</span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Phách phát
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Bạn gõ
          </span>
        </span>
      </div>

      {/* Grid of steps */}
      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
        {steps.map((step, idx) => {
          const isCurrent = currentPlayStep === idx;
          const isUserTapped = userTaps.includes(idx);
          const isDownbeat = idx % 4 === 0;

          return (
            <div
              key={`step-${idx}`}
              className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-100 min-h-[72px] ${
                isCurrent
                  ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/30 scale-105 z-10'
                  : isDownbeat
                  ? 'border-slate-700 bg-slate-800/80'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Step number */}
              <span className={`text-[10px] font-mono font-bold ${
                isDownbeat ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {idx + 1}
              </span>

              {/* Target Beat Indicator */}
              <div className="my-1 flex items-center justify-center h-6">
                {showTargetBeats && step.isHit ? (
                  <div className={`rounded-full transition-transform ${
                    step.isAccent ? 'w-5 h-5 bg-gradient-to-tr from-amber-500 to-yellow-300 ring-2 ring-amber-400/50' : 'w-4 h-4 bg-cyan-400'
                  } ${isCurrent ? 'animate-ping' : ''}`} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
              </div>

              {/* User Tap Indicator */}
              <div className="h-2 flex items-center justify-center">
                {isUserTapped && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
