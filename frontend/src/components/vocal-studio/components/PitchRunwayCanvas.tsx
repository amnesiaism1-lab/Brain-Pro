import React, { useEffect, useRef } from 'react';
import { RunwayRenderState } from '../types';
import { NOTE_NAMES } from '../utils/vocalHelpers';

interface PitchRunwayCanvasProps {
  renderStateRef: React.MutableRefObject<RunwayRenderState>;
  className?: string;
}

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

    // High DPI scaling handling
    const resizeCanvasToDisplaySize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.clientWidth || 860;
      const height = canvas.clientHeight || 280;

      const displayWidth = Math.floor(width * dpr);
      const displayHeight = Math.floor(height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      return { width, height, dpr };
    };

    const render = () => {
      if (!isMounted) return;

      const { width, height, dpr } = resizeCanvasToDisplaySize();
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
      } = state;

      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(0.5, '#050914');
      bgGrad.addColorStop(1, '#02050c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Runway time window configuration:
      // Past window: 1.5s, Future window: 3.5s -> total 5.0s visible
      const pastWindowMs = 1500;
      const futureWindowMs = 3500;
      const totalWindowMs = pastWindowMs + futureWindowMs;
      const playheadX = (pastWindowMs / totalWindowMs) * width;

      // Vertical MIDI bounds
      const minMidi = Math.max(36, lowestMidi - 3);
      const maxMidi = Math.min(84, highestMidi + 3);
      const midiSpan = Math.max(14, maxMidi - minMidi);

      const midiToY = (m: number) => {
        const norm = (m - minMidi) / midiSpan;
        return height - norm * height;
      };

      // 2. Horizontal Semitone Grid Lines
      for (let m = minMidi; m <= maxMidi; m++) {
        const y = midiToY(m);
        const isC = m % 12 === 0;

        ctx.strokeStyle = isC ? 'rgba(56, 189, 248, 0.32)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = isC ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Note Label on Left
        const noteIndex = ((m % 12) + 12) % 12;
        const oct = Math.floor(m / 12) - 1;
        const noteStr = `${NOTE_NAMES[noteIndex]}${oct}`;

        ctx.fillStyle = isC ? '#38bdf8' : 'rgba(148, 163, 184, 0.5)';
        ctx.font = isC ? 'bold 11px monospace' : '10px monospace';
        ctx.fillText(noteStr, 8, y - 3);
      }

      // 3. A-B Loop Active Zone Overlay
      if (isLoopingActive && loopStartMs !== null && loopEndMs !== null) {
        const loopX1 = playheadX + ((loopStartMs - currentTimeMs) / totalWindowMs) * width;
        const loopX2 = playheadX + ((loopEndMs - currentTimeMs) / totalWindowMs) * width;
        const drawX1 = Math.max(0, loopX1);
        const drawW = Math.max(0, loopX2 - drawX1);

        if (drawW > 0) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
          ctx.fillRect(drawX1, 0, drawW, height);

          ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(drawX1, 0, drawW, height);
          ctx.setLineDash([]);
        }
      }

      const windowStartMs = currentTimeMs - pastWindowMs;
      const windowEndMs = currentTimeMs + futureWindowMs;

      // 4. Reference Vocal Pitch Ribbon (Indigo Neon Glow)
      if (pitchTrack && pitchTrack.length > 0) {
        ctx.save();
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#6366f1';
        ctx.strokeStyle = '#818cf8';

        let drawingSubpath = false;
        ctx.beginPath();

        for (let i = 0; i < pitchTrack.length; i++) {
          const pt = pitchTrack[i];
          if (pt.timeMs < windowStartMs || pt.timeMs > windowEndMs) continue;

          const x = playheadX + ((pt.timeMs - currentTimeMs) / totalWindowMs) * width;

          if (pt.isVocal && pt.midi > 0) {
            const y = midiToY(pt.midi);
            if (!drawingSubpath) {
              ctx.moveTo(x, y);
              drawingSubpath = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            if (drawingSubpath) {
              ctx.stroke();
              ctx.beginPath();
              drawingSubpath = false;
            }
          }
        }
        if (drawingSubpath) ctx.stroke();
        ctx.restore();
      }

      // 4.5. User Sung Pitch Trail (Đường Cao Độ Giọng Bạn Hát)
      // Visualizes exactly how you sang compared to the reference track!
      if (userPitchTrail && userPitchTrail.length > 0) {
        ctx.save();
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < userPitchTrail.length; i++) {
          const ptPrev = userPitchTrail[i - 1];
          const ptCurr = userPitchTrail[i];

          // Skip points outside time window
          if (ptCurr.timeMs < windowStartMs || ptPrev.timeMs > windowEndMs) continue;
          // Skip if break between vocal points > 300ms
          if (ptCurr.timeMs - ptPrev.timeMs > 300) continue;

          const x1 = playheadX + ((ptPrev.timeMs - currentTimeMs) / totalWindowMs) * width;
          const y1 = midiToY(ptPrev.midi);
          const x2 = playheadX + ((ptCurr.timeMs - currentTimeMs) / totalWindowMs) * width;
          const y2 = midiToY(ptCurr.midi);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);

          const trailColor = ptCurr.inTune
            ? '#34d399'
            : ptCurr.centsDiff < 0
            ? '#fbbf24'
            : '#f87171';

          ctx.shadowBlur = 10;
          ctx.shadowColor = trailColor;
          ctx.strokeStyle = trailColor;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Target Note Hit-Box under playhead
      if (currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
        const targetY = midiToY(currentRefPoint.midi);
        const boxW = 88;
        const boxH = 26;

        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = isInTuneNow ? '#34d399' : '#818cf8';
        ctx.fillStyle = isInTuneNow ? 'rgba(52, 211, 153, 0.4)' : 'rgba(129, 140, 248, 0.3)';
        ctx.strokeStyle = isInTuneNow ? '#34d399' : '#a5b4fc';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(playheadX - boxW / 2, targetY - boxH / 2, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentRefPoint.noteName, playheadX, targetY + 4);
        ctx.restore();
      }

      // 6. User Live Microphone Pitch Indicator (Orb with Pulse)
      if (userReading && userReading.isSinging && userReading.freqHz > 0) {
        const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;

        let displayMidi = exactUserMidi;
        if (smartOctaveFold && currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
          const octShift = Math.round((exactUserMidi - currentRefPoint.midi) / 12);
          displayMidi = exactUserMidi - octShift * 12;
        }

        const userY = midiToY(displayMidi);

        ctx.save();
        ctx.shadowBlur = 20;
        const orbColor = isInTuneNow
          ? '#10b981'
          : currentCentsDiff < 0
          ? '#f59e0b'
          : '#ef4444';

        ctx.shadowColor = orbColor;
        ctx.fillStyle = isInTuneNow
          ? '#34d399'
          : currentCentsDiff < 0
          ? '#fbbf24'
          : '#f87171';

        // Outer pulse circle
        ctx.beginPath();
        ctx.arc(playheadX, userY, 11, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(playheadX, userY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Playhead Vertical Guide Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 8. Visual Ribbon Legend (Top Right)
      ctx.save();
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      // Reference Legend
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(width - 190, 12, 10, 4);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.fillText('Nốt mẫu', width - 174, 17);

      // User Singing Legend
      ctx.fillStyle = '#34d399';
      ctx.fillRect(width - 110, 12, 10, 4);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.fillText('Giọng bạn hát', width - 94, 17);
      ctx.restore();

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
