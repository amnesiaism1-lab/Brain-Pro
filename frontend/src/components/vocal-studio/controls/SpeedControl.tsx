import React from 'react';
import { Gauge } from 'lucide-react';

interface SpeedControlProps {
  speed: number;
  onChange: (val: number) => void;
  presets?: number[];
  compact?: boolean;
}

export const SPEED_PRESETS = [0.75, 0.85, 1.0, 1.15];

export const SpeedControl: React.FC<SpeedControlProps> = ({
  speed,
  onChange,
  presets = SPEED_PRESETS,
  compact = false,
}) => {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : ''}`}>
      {!compact && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Gauge className="w-3.5 h-3.5 text-sky-400" />
          <span>Tốc độ:</span>
        </div>
      )}

      {/* Preset pills */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
        {presets.map((spd) => {
          const isActive = Math.abs(speed - spd) < 0.02;
          return (
            <button
              key={spd}
              type="button"
              onClick={() => onChange(spd)}
              className={`px-2 py-1 rounded-lg font-mono font-bold transition ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {spd}x
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="hidden md:flex items-center gap-2">
          <input
            type="range"
            min={0.5}
            max={1.25}
            step={0.05}
            value={speed}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            title="Tùy chỉnh tốc độ mượt mà từ 0.5x đến 1.25x (giữ nguyên cao độ)"
          />
          <span className="text-[11px] font-mono text-slate-400 w-9">
            {speed.toFixed(2)}x
          </span>
        </div>
      )}
    </div>
  );
};
