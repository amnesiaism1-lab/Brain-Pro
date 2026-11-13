import React, { useRef, useEffect } from 'react';
import { NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';

interface OfficeMiniRunwayProps {
  targetNote: string;
  targetFreqHz: number;
  userFreqHz: number;
  centsDiff: number;
  inTolerance: boolean;
  toleranceCents: number;
  clarity: number;
  isSinging: boolean;
  className?: string;
}

export const OfficeMiniRunway: React.FC<OfficeMiniRunwayProps> = ({
  targetNote,
  targetFreqHz,
  userFreqHz,
  centsDiff,
  inTolerance,
  toleranceCents = 35,
  clarity,
  isSinging,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const smoothCentsRef = useRef<number>(0);

  // Smooth interpolation for centsDiff to avoid jitter
  useEffect(() => {
    const targetCents = isSinging ? Math.max(-60, Math.min(60, centsDiff)) : 0;
    smoothCentsRef.current += (targetCents - smoothCentsRef.current) * 0.35;
  }, [centsDiff, isSinging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const render = () => {
      if (!active) return;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw Center In-Tune Target Band (±toleranceCents)
      const bandWidth = (toleranceCents / 60) * (width / 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald 500 alpha
      ctx.fillRect(centerX - bandWidth, 0, bandWidth * 2, height);

      // Centerline
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Tick markers at -50, -25, +25, +50 cents
      const ticks = [-50, -25, 25, 50];
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';

      ticks.forEach((tick) => {
        const x = centerX + (tick / 60) * (width / 2);
        ctx.beginPath();
        ctx.moveTo(x, centerY - 6);
        ctx.lineTo(x, centerY + 6);
        ctx.stroke();
        ctx.fillText(`${tick > 0 ? '+' : ''}${tick}¢`, x, height - 3);
      });

      // Target note text in center
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${targetNote} (Mục tiêu)`, centerX, 11);

      // User Pitch Indicator
      if (isSinging && clarity >= 0.5) {
        const clampedCents = Math.max(-60, Math.min(60, smoothCentsRef.current));
        const userX = centerX + (clampedCents / 60) * (width / 2);

        // Indicator color
        const dotColor = inTolerance ? '#34D399' : '#F59E0B'; // Emerald vs Amber

        // Glowing outer circle
        ctx.fillStyle = inTolerance ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)';
        ctx.beginPath();
        ctx.arc(userX, centerY, 9, 0, Math.PI * 2);
        ctx.fill();

        // Solid inner dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(userX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Deviation label below dot
        ctx.fillStyle = dotColor;
        ctx.font = 'bold 10px monospace';
        const sign = centsDiff > 0 ? '+' : '';
        ctx.fillText(`${sign}${Math.round(centsDiff)}¢`, userX, centerY - 12);
      } else {
        // Idle status
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ngân nga nhẹ hoặc bấm phím...', centerX, centerY + 3);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetNote, toleranceCents, isSinging, clarity, inTolerance, centsDiff]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-800 shadow-inner ${className}`}>
      <canvas
        ref={canvasRef}
        width={340}
        height={68}
        className="w-full h-[68px] block"
      />
    </div>
  );
};
