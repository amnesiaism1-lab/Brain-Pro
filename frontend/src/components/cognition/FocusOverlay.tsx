import React, { useState } from 'react';
import { Eye, EyeOff, Target } from 'lucide-react';

interface FocusOverlayProps {
  /** Type of fixation aid: 'dot' | 'crosshair' | 'guide-line' */
  mode?: 'dot' | 'crosshair' | 'guide-line';
  /** Color class or hex code for the fixation marker */
  color?: string;
  /** Size in pixels (e.g., 8, 12, 16) */
  size?: number;
  /** Optional position percent: { x: number; y: number } (defaults to 50%, 50% center) */
  position?: { x: number; y: number };
  /** Optional pulse animation */
  pulse?: boolean;
  /** Allow user to toggle visibility on/off via a floating micro-toggle */
  allowToggle?: boolean;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  mode = 'dot',
  color = '#10B981', // Emerald green
  size = 12,
  position = { x: 50, y: 50 },
  pulse = true,
  allowToggle = false
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    if (!allowToggle) return null;
    return (
      <button
        onClick={() => setVisible(true)}
        title="Bật điểm cố định mắt (Green Dot)"
        className="absolute bottom-3 right-3 z-30 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white/70 hover:text-white backdrop-blur-sm transition-all text-xs flex items-center gap-1.5"
      >
        <EyeOff className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <>
      {/* Fixation Marker Layer */}
      <div 
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
        aria-hidden="true"
      >
        {mode === 'dot' && (
          <div
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg ${
              pulse ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}88, 0 0 24px ${color}44`
            }}
          />
        )}

        {mode === 'crosshair' && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${size * 2}px`,
              height: `${size * 2}px`
            }}
          >
            {/* Horizontal line */}
            <div 
              className="absolute w-full h-[1.5px]"
              style={{ backgroundColor: color, opacity: 0.7 }}
            />
            {/* Vertical line */}
            <div 
              className="absolute h-full w-[1.5px]"
              style={{ backgroundColor: color, opacity: 0.7 }}
            />
            {/* Central circle */}
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        )}

        {mode === 'guide-line' && (
          <div 
            className="absolute left-0 right-0 h-[2px] transition-all duration-150 pointer-events-none"
            style={{
              top: `${position.y}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}66`
            }}
          />
        )}
      </div>

      {/* Optional micro-toggle button */}
      {allowToggle && (
        <button
          onClick={() => setVisible(false)}
          title="Tắt điểm cố định mắt"
          className="absolute bottom-3 right-3 z-30 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white/70 hover:text-white backdrop-blur-sm transition-all text-xs flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      )}
    </>
  );
};
