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
    <div className={`relative flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 ${className}`}>
      {/* Outer Radar Disc */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full border-2 border-cyan-500/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#040914] flex items-center justify-center shadow-inner overflow-hidden select-none">
        
        {/* Rotating radar scanner sweep effect */}
        <div className="absolute inset-0 pointer-events-none animate-[spin_6s_linear_infinite] origin-center opacity-30">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 via-cyan-500/10 to-transparent rounded-tl-full" />
        </div>

        {/* Concentric distance circles */}
        <div className="absolute w-[86%] h-[86%] rounded-full border border-dashed border-cyan-500/25 pointer-events-none" />
        <div className="absolute w-[62%] h-[62%] rounded-full border border-dashed border-cyan-500/25 pointer-events-none" />
        <div className="absolute w-[38%] h-[38%] rounded-full border border-dashed border-cyan-500/25 pointer-events-none" />

        {/* Crosshair Axes */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20 pointer-events-none" />
        {/* Diagonal axes */}
        <div className="absolute w-full h-[1px] bg-cyan-500/10 rotate-45 pointer-events-none" />
        <div className="absolute w-full h-[1px] bg-cyan-500/10 -rotate-45 pointer-events-none" />

        {/* Cardinal Direction Edge Badges (Outside target buttons reach) */}
        <span className="absolute top-1.5 text-[9px] font-black tracking-widest text-cyan-400/70 uppercase">0° BẮC</span>
        <span className="absolute bottom-1.5 text-[9px] font-black tracking-widest text-cyan-400/70 uppercase">180° NAM</span>
        <span className="absolute left-1.5 text-[9px] font-black tracking-widest text-cyan-400/70 uppercase">270° TÂY</span>
        <span className="absolute right-1.5 text-[9px] font-black tracking-widest text-cyan-400/70 uppercase">90° ĐÔNG</span>

        {/* Center Listener Head Icon */}
        <div className="relative z-10 w-13 h-13 rounded-full bg-slate-900 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/40 p-2">
          <Headphones className="w-6 h-6 text-cyan-400" />
          <span className="text-[7px] font-black text-cyan-300 uppercase tracking-tighter">BẠN</span>
        </div>

        {/* Visual Audio Ping Wave when audio plays */}
        {targetPingAngle !== null && (
          <div
            style={{
              transform: `rotate(${targetPingAngle - 90}deg) translate(80px)`
            }}
            className="absolute z-20 pointer-events-none"
          >
            <div className="w-14 h-14 rounded-full bg-amber-400/50 animate-ping border-2 border-amber-300" />
          </div>
        )}

        {/* Clickable Target Points */}
        {availableTargets.map((target) => {
          const isSelected = selectedTargetId === target.id;

          // Convert angle to rad (0° is top, 90° right, 180° bottom, 270° left)
          const angleRad = ((target.azimuthDeg - 90) * Math.PI) / 180;
          let radius = 98; // mid
          if (target.distanceTier === 'near') radius = 58;
          if (target.distanceTier === 'far') radius = 132;

          const x = radius * Math.cos(angleRad);
          const y = radius * Math.sin(angleRad);

          return (
            <div
              key={target.id}
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
              }}
              className="absolute z-30"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectTarget?.(target)}
                onMouseEnter={() => !disabled && onPreviewAngle?.(target.azimuthDeg, target.distanceTier)}
                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-[10px] font-black transition-all duration-150 shadow-md ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 scale-125 ring-4 ring-amber-400/60 shadow-lg shadow-amber-400/80 z-40'
                    : 'bg-slate-900/90 text-cyan-300 border-2 border-cyan-400/60 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-300 hover:scale-115'
                } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
              >
                <span>{target.label || `${target.azimuthDeg}°`}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400">
        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        <span>Rê chuột vào các điểm để nghe thử vị trí không gian 3D</span>
      </div>
    </div>
  );
};
