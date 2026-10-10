import React, { useEffect, useRef } from 'react';
import { RunwayRenderState } from '../types';
import { NOTE_NAMES } from '@brain-exercises/shared';

interface PitchRunwayCanvasProps {
  renderStateRef: React.MutableRefObject<RunwayRenderState>;
  className?: string;
}

const ACCIDENTAL_SEMITONES = new Set([1, 3, 6, 8, 10]);

export const PitchRunwayCanvas: React.FC<PitchRunwayCanvasProps> = ({
  renderStateRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isMounted = true;
    let smoothMinMidi = 48; // C3
    let smoothMaxMidi = 72; // C5

    const resizeCanvas = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.clientWidth || 860;
      const height = canvas.clientHeight || 280;
      const dw = Math.floor(width * dpr);
      const dh = Math.floor(height * dpr);
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }
      return { width, height, dpr };
    };

    const render = () => {
      if (!isMounted) return;

      const { width, height, dpr } = resizeCanvas();
      ctx.save();
      ctx.scale(dpr, dpr);

      const state = renderStateRef.current;
      const {
        currentTimeMs,
        pitchTrack,
        userPitchTrail,
        currentRefPoint,
        userReading,
        isInTuneNow,
        currentCentsDiff,
        isLoopingActive,
        loopStartMs,
        loopEndMs,
        smartOctaveFold,
        lowestMidi,
        highestMidi,
        toleranceCents,
        isWindowLocked,
      } = state;

      const pastWindowMs = 1500;
      const futureWindowMs = 3500;
      const totalWindowMs = pastWindowMs + futureWindowMs;
      const playheadX = (pastWindowMs / totalWindowMs) * width;
      const windowStartMs = currentTimeMs - pastWindowMs;
      const windowEndMs = currentTimeMs + futureWindowMs;

      // 1. Dynamic Pitch Window (14–18 semitones, smooth tracking)
      const targetMin = Math.max(36, (lowestMidi || 48) - 2);
      const targetMax = Math.min(84, (highestMidi || 72) + 2);
      if (!isWindowLocked) {
        smoothMinMidi += (targetMin - smoothMinMidi) * 0.05;
        smoothMaxMidi += (targetMax - smoothMaxMidi) * 0.05;
      }
      const minMidi = Math.floor(smoothMinMidi);
      const maxMidi = Math.ceil(smoothMaxMidi);
      const midiSpan = Math.max(14, maxMidi - minMidi);

      const midiToY = (m: number) => height - ((m - minMidi) / midiSpan) * height;

      // 2. Background & Piano Roll Semitone Stripes
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      for (let m = minMidi; m <= maxMidi; m++) {
        const yTop = midiToY(m + 0.5);
        const yBottom = midiToY(m - 0.5);
        const stripH = Math.max(1, yBottom - yTop);
        const semi = ((m % 12) + 12) % 12;
        const isBlackKey = ACCIDENTAL_SEMITONES.has(semi);
        const isC = semi === 0;

        // Stripe fill
        ctx.fillStyle = isBlackKey ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, yTop, width, stripH);

        // Grid line
        const lineY = midiToY(m);
        ctx.strokeStyle = isC ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = isC ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();

        // Note label (natural notes prominent, bold C)
        if (!isBlackKey) {
          const oct = Math.floor(m / 12) - 1;
          const noteStr = `${NOTE_NAMES[semi]}${oct}`;
          ctx.fillStyle = isC ? '#38bdf8' : 'rgba(148, 163, 184, 0.6)';
          ctx.font = isC ? 'bold 11px monospace' : '10px monospace';
          ctx.fillText(noteStr, 8, lineY - 3);
        }
      }

      // 3. Tolerance Band around Active Target Note
      if (currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
        const tolSemitones = (toleranceCents || 35) / 100;
        const tolY1 = midiToY(currentRefPoint.midi + tolSemitones);
        const tolY2 = midiToY(currentRefPoint.midi - tolSemitones);
        ctx.fillStyle = isInTuneNow ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.1)';
        ctx.fillRect(playheadX - 60, tolY1, 120, tolY2 - tolY1);
      }

      // 4. A-B Loop Overlay
      if (isLoopingActive && loopStartMs !== null && loopEndMs !== null) {
        const lx1 = Math.max(0, playheadX + ((loopStartMs - currentTimeMs) / totalWindowMs) * width);
        const lx2 = Math.min(width, playheadX + ((loopEndMs - currentTimeMs) / totalWindowMs) * width);
        if (lx2 > lx1) {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
          ctx.fillRect(lx1, 0, lx2 - lx1, height);
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(lx1, 0, lx2 - lx1, height);
          ctx.setLineDash([]);
        }
      }

      // 5. Reference Vocal Track (Note Bars + Bend Ribbon)
      if (pitchTrack && pitchTrack.length > 0) {
        ctx.save();
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#6366f1';
        ctx.strokeStyle = '#818cf8';

        let drawing = false;
        ctx.beginPath();
        for (let i = 0; i < pitchTrack.length; i++) {
          const pt = pitchTrack[i];
          if (pt.timeMs < windowStartMs || pt.timeMs > windowEndMs) continue;
          const x = playheadX + ((pt.timeMs - currentTimeMs) / totalWindowMs) * width;
          if (pt.isVocal && pt.midi > 0) {
            const y = midiToY(pt.midi);
            if (!drawing) {
              ctx.moveTo(x, y);
              drawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else if (drawing) {
            ctx.stroke();
            ctx.beginPath();
            drawing = false;
          }
        }
        if (drawing) ctx.stroke();
        ctx.restore();
      }

      // 6. User Sung Pitch Trail with Distinct Shapes (▲ Sharp, ▼ Flat, ● In-Tune)
      if (userPitchTrail && userPitchTrail.length > 0) {
        for (let i = 1; i < userPitchTrail.length; i++) {
          const pt = userPitchTrail[i];
          if (pt.timeMs < windowStartMs || pt.timeMs > windowEndMs) continue;
          const x = playheadX + ((pt.timeMs - currentTimeMs) / totalWindowMs) * width;
          const y = midiToY(pt.midi);

          const color = pt.inTune ? '#10b981' : pt.centsDiff < 0 ? '#f59e0b' : '#ef4444';
          ctx.fillStyle = color;

          if (pt.inTune) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (pt.centsDiff > 0) {
            // Sharp: ▲ Triangle pointing up
            ctx.beginPath();
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x - 3.5, y + 3);
            ctx.lineTo(x + 3.5, y + 3);
            ctx.closePath();
            ctx.fill();
          } else {
            // Flat: ▼ Triangle pointing down
            ctx.beginPath();
            ctx.moveTo(x, y + 4);
            ctx.lineTo(x - 3.5, y - 3);
            ctx.lineTo(x + 3.5, y - 3);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // 7. Target Hit-Box under Playhead
      if (currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
        const targetY = midiToY(currentRefPoint.midi);
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = isInTuneNow ? '#10b981' : '#6366f1';
        ctx.fillStyle = isInTuneNow ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.35)';
        ctx.strokeStyle = isInTuneNow ? '#34d399' : '#818cf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(playheadX - 44, targetY - 13, 88, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(currentRefPoint.noteName, playheadX, targetY + 4);
        ctx.restore();
      }

      // 8. Live Microphone Orb, Ghost Orb & Out-of-Bounds Indicators
      if (userReading && userReading.isSinging && userReading.freqHz > 0) {
        const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;
        let displayMidi = exactUserMidi;
        let octShift = 0;

        if (smartOctaveFold && currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
          octShift = Math.round((exactUserMidi - currentRefPoint.midi) / 12);
          displayMidi = exactUserMidi - octShift * 12;
        }

        const userY = midiToY(displayMidi);

        // Ghost Orb (real pitch location when folded)
        if (octShift !== 0) {
          const rawY = midiToY(exactUserMidi);
          ctx.save();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.arc(playheadX, rawY, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
          ctx.font = '9px monospace';
          ctx.fillText('Thực tế', playheadX + 10, rawY + 3);
          ctx.restore();
        }

        // Out-of-bounds indicators
        if (userY < 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(playheadX, 6);
          ctx.lineTo(playheadX - 6, 16);
          ctx.lineTo(playheadX + 6, 16);
          ctx.fill();
        } else if (userY > height) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(playheadX, height - 6);
          ctx.lineTo(playheadX - 6, height - 16);
          ctx.lineTo(playheadX + 6, height - 16);
          ctx.fill();
        } else {
          // Primary Pulse Orb
          ctx.save();
          const orbColor = isInTuneNow ? '#10b981' : currentCentsDiff < 0 ? '#f59e0b' : '#ef4444';
          ctx.shadowBlur = 18;
          ctx.shadowColor = orbColor;
          ctx.fillStyle = orbColor;
          ctx.beginPath();
          ctx.arc(playheadX, userY, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(playheadX, userY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 9. Playhead Guide Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [renderStateRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[260px] sm:h-[300px] block ${className}`}
    />
  );
};
