import React from 'react';
import { Headphones } from 'lucide-react';

interface ISpatialTarget {
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
  className?: string;
}

export const SpatialRadar: React.FC<ISpatialRadarProps> = ({
  availableTargets,
  selectedTargetId = null,
  targetPingAngle = null,
  disabled = false,
  onSelectTarget,
  className = ''
}) => {
  return (
    <div className={`relative flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl ${className}`}>
      {/* Outer Radar Disc */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center shadow-inner overflow-hidden">
        {/* Concentric distance circles */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-dashed border-cyan-500/20 pointer-events-none" />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-cyan-500/20 pointer-events-none" />
        <div className="absolute w-[35%] h-[35%] rounded-full border border-cyan-500/20 pointer-events-none" />

        {/* Crosshair Axes */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20 pointer-events-none" />

        {/* Cardinal Direction Labels */}
        <span className="absolute top-2 text-[10px] font-bold text-cyan-400 select-none">TRƯỚC (0°)</span>
        <span className="absolute bottom-2 text-[10px] font-bold text-cyan-400 select-none">SAU (180°)</span>
        <span className="absolute left-2 text-[10px] font-bold text-cyan-400 select-none">TRÁI (270°)</span>
        <span className="absolute right-2 text-[10px] font-bold text-cyan-400 select-none">PHẢI (90°)</span>

        {/* Center Listener Head Icon */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Headphones className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>

        {/* Visual Audio Ping Wave when audio plays */}
        {targetPingAngle !== null && (
          <div
            style={{
              transform: `rotate(${targetPingAngle - 90}deg) translate(80px)`
            }}
            className="absolute z-20 pointer-events-none"
          >
            <div className="w-12 h-12 rounded-full bg-amber-400/40 animate-ping" />
          </div>
        )}

        {/* Clickable Target Points */}
        {availableTargets.map((target) => {
          const isSelected = selectedTargetId === target.id;

          // Convert angle to rad (0° is top, 90° right, 180° bottom, 270° left)
          const angleRad = ((target.azimuthDeg - 90) * Math.PI) / 180;
          let radius = 100; // mid
          if (target.distanceTier === 'near') radius = 60;
          if (target.distanceTier === 'far') radius = 120;

          const x = radius * Math.cos(angleRad);
          const y = radius * Math.sin(angleRad);

          return (
            <button
              key={target.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTarget?.(target)}
              style={{
                transform: `translate(${x}px, ${y}px)`
              }}
              className={`absolute z-30 w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 scale-125 ring-4 ring-amber-400/50 shadow-lg shadow-amber-400/80 z-40'
                  : 'bg-slate-800 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500 hover:text-white hover:scale-110 shadow-md'
              } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            >
              {target.label || `${target.azimuthDeg}°`}
            </button>
          );
        })}
      </div>
    </div>
  );
};
