import React from 'react';
import { Headphones, Volume2 } from 'lucide-react';

export interface ISpatialTarget {
  id: string;
  azimuthDeg: number;
  distanceTier: 'near' | 'mid' | 'far';
  label?: string;
}

interface ISpatialRadarProps {
  availableTargets: ISpatialTarget[];
  selectedTargetId?: string | null;
  targetPingAngle?: number | null; // Trigger visual radar ping wave at this angle
  disabled?: boolean;
  onSelectTarget?: (target: ISpatialTarget) => void;
  onPreviewAngle?: (azimuthDeg: number, distanceTier: 'near' | 'mid' | 'far') => void;
  className?: string;
}

export const SpatialRadar: React.FC<ISpatialRadarProps> = ({
  availableTargets,
  selectedTargetId = null,
  targetPingAngle = null,
  disabled = false,
  onSelectTarget,
  onPreviewAngle,
  className = ''
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center p-5 sm:p-7 bg-slate-950/90 backdrop-blur-md rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 ${className}`}>
      {/* Outer Frame with Cardinal Badges Positioned Clear of Radar Targets */}
      <div className="relative pt-6 pb-6 px-10 sm:px-14 flex items-center justify-center select-none">
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-cyan-400 uppercase whitespace-nowrap">
          0° TRƯỚC
        </span>
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-cyan-400 uppercase whitespace-nowrap">
          180° SAU
        </span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-cyan-400 uppercase whitespace-nowrap">
          270° TÂY
        </span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-cyan-400 uppercase whitespace-nowrap">
          90° ĐÔNG
        </span>

        {/* Outer Radar Disc */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-cyan-500/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#040914] flex items-center justify-center shadow-inner select-none">
          {/* Clipped background sweep & grid layer */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none flex items-center justify-center">
            {/* Rotating radar scanner sweep effect */}
            <div className="absolute inset-0 animate-[spin_6s_linear_infinite] origin-center opacity-30">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 via-cyan-500/10 to-transparent rounded-tl-full" />
            </div>

            {/* Concentric distance circles matching near (21%), mid (31%), far (41%) rings */}
            <div className="absolute w-[82%] h-[82%] rounded-full border border-dashed border-cyan-500/25" />
            <div className="absolute w-[62%] h-[62%] rounded-full border border-dashed border-cyan-500/25" />
            <div className="absolute w-[42%] h-[42%] rounded-full border border-dashed border-cyan-500/25" />

            {/* Crosshair Axes */}
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />
            {/* Diagonal axes */}
            <div className="absolute w-full h-[1px] bg-cyan-500/10 rotate-45" />
            <div className="absolute w-full h-[1px] bg-cyan-500/10 -rotate-45" />
          </div>

          {/* Center Listener Head Icon */}
          <div className="relative z-10 w-12 h-12 rounded-full bg-slate-900 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/40 p-1.5">
            <Headphones className="w-5 h-5 text-cyan-400" />
            <span className="text-[7px] font-black text-cyan-300 uppercase tracking-tighter">BẠN</span>
          </div>

          {/* Visual Audio Ping Wave when answer revealed */}
          {targetPingAngle !== null && (() => {
            const pingRad = ((targetPingAngle - 90) * Math.PI) / 180;
            const pingLeftPct = 50 + 31 * Math.cos(pingRad);
            const pingTopPct = 50 + 31 * Math.sin(pingRad);
            return (
              <div
                style={{
                  left: `${pingLeftPct}%`,
                  top: `${pingTopPct}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-14 h-14 rounded-full bg-amber-400/50 animate-ping border-2 border-amber-300" />
              </div>
            );
          })()}

          {/* Clickable Target Points using responsive % radii */}
          {availableTargets.map((target) => {
            const isSelected = selectedTargetId === target.id;
            const angleRad = ((target.azimuthDeg - 90) * Math.PI) / 180;
            const radiusPct = target.distanceTier === 'near' ? 21 : target.distanceTier === 'far' ? 41 : 31;

            const leftPct = 50 + radiusPct * Math.cos(angleRad);
            const topPct = 50 + radiusPct * Math.sin(angleRad);
            const isCompactMulti = availableTargets.length > 8;

            return (
              <div
                key={target.id}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute z-30"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectTarget?.(target)}
                  onMouseEnter={() => !disabled && onPreviewAngle?.(target.azimuthDeg, target.distanceTier)}
                  className={`${isCompactMulti ? 'w-9 h-9 text-[8px]' : 'w-10 h-10 sm:w-11 sm:h-11 text-[9px] sm:text-[10px]'} rounded-full flex flex-col items-center justify-center font-black leading-tight text-center transition-all duration-150 shadow-md px-0.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 scale-125 ring-4 ring-amber-400/60 shadow-lg shadow-amber-400/80 z-40'
                      : 'bg-slate-900/95 text-cyan-300 border-2 border-cyan-400/60 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-300 hover:scale-110'
                  } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
                >
                  <span className="whitespace-pre-line">{target.label || `${target.azimuthDeg}°`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400">
        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        <span>Rê chuột vào các điểm để nghe thử vị trí không gian 3D</span>
      </div>
    </div>
  );
};
