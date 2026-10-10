import React, { useEffect, useRef } from 'react';
import { RunwayRenderState } from '../types';
import { NOTE_NAMES, midiToNoteInfo } from '@brain-exercises/shared';

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
  const manualOffsetRef = useRef(0);
  const manualSpanRef = useRef<number | null>(null);
  const userInteractedUntilRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isMounted = true;
    let smoothMinMidi = 48; // C3
    let smoothMaxMidi = 72; // C5

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      userInteractedUntilRef.current = Date.now() + 4500;
      if (e.ctrlKey || e.metaKey) {
        // Zoom vertical span in/out
        const delta = e.deltaY > 0 ? 1 : -1;
        const currentSpan = manualSpanRef.current ?? (smoothMaxMidi - smoothMinMidi);
        manualSpanRef.current = Math.max(10, Math.min(36, currentSpan + delta));
      } else {
        // Pan vertical up/down
        const delta = e.deltaY > 0 ? -1 : 1;
        manualOffsetRef.current += delta;
      }
    };

    const handleDblClick = () => {
      // Double click resets to Auto-Follow
      manualOffsetRef.current = 0;
      manualSpanRef.current = null;
      userInteractedUntilRef.current = 0;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDblClick);

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
        latencyOffsetMs: rawLatencyOffsetMs,
        pitchTrack,
        noteBars,
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
        scaleNotes,
        transposeSemitones = 0,
      } = state;

      // Zero-latency acoustic alignment:
      const latencyOffsetMs = rawLatencyOffsetMs ?? 45;
      const effectiveTimeMs = Math.max(0, currentTimeMs - latencyOffsetMs);

      const pastWindowMs = 1500;
      const futureWindowMs = 3500;
      const totalWindowMs = pastWindowMs + futureWindowMs;
      const playheadX = (pastWindowMs / totalWindowMs) * width;
      const windowStartMs = effectiveTimeMs - pastWindowMs;
      const windowEndMs = effectiveTimeMs + futureWindowMs;

      // 1. Dynamic Pitch Window (Auto-Follow like FL Studio NewTone)
      const now = Date.now();
      const isManualControl = now < userInteractedUntilRef.current || isWindowLocked;

      // Scan notes in current viewport to dynamically keep notes centered and never lost
      let localMin = Infinity;
      let localMax = -Infinity;
      let notesInWindow = 0;

      if (noteBars && noteBars.length > 0) {
        for (let i = 0; i < noteBars.length; i++) {
          const bar = noteBars[i];
          if (bar.endTimeMs >= windowStartMs && bar.startTimeMs <= windowEndMs) {
            const m = bar.midi + transposeSemitones;
            if (m < localMin) localMin = m;
            if (m > localMax) localMax = m;
            notesInWindow++;
          }
        }
      }

      if (userReading?.isSinging && userReading.freqHz > 0) {
        const um = 12 * Math.log2(userReading.freqHz / 440) + 69;
        if (um < localMin) localMin = um;
        if (um > localMax) localMax = um;
        notesInWindow++;
      }

      let targetMin: number;
      let targetMax: number;

      if (!isManualControl) {
        if (notesInWindow > 0) {
          const center = (localMin + localMax) / 2;
          const desiredSpan = Math.max(14, (localMax - localMin) + 6);
          targetMin = Math.max(36, Math.floor(center - desiredSpan / 2));
          targetMax = Math.min(96, targetMin + desiredSpan);
        } else {
          // Fallback to song's vocal range with padding
          const songMin = (lowestMidi || 48) + transposeSemitones;
          const songMax = (highestMidi || 72) + transposeSemitones;
          const center = (songMin + songMax) / 2;
          const desiredSpan = Math.max(16, (songMax - songMin) + 4);
          targetMin = Math.max(36, Math.floor(center - desiredSpan / 2));
          targetMax = Math.min(96, targetMin + desiredSpan);
        }

        smoothMinMidi += (targetMin - smoothMinMidi) * 0.08;
        smoothMaxMidi += (targetMax - smoothMaxMidi) * 0.08;
      }

      // Apply manual offset and span if user interacted with mouse wheel
      const effectiveSpan = manualSpanRef.current ?? (smoothMaxMidi - smoothMinMidi);
      const effectiveMin = smoothMinMidi + manualOffsetRef.current;
      const minMidi = Math.floor(effectiveMin);
      const maxMidi = Math.ceil(effectiveMin + effectiveSpan);
      const midiSpan = Math.max(12, maxMidi - minMidi);

      const midiToY = (m: number) => height - ((m - minMidi) / midiSpan) * height;

      // Detect off-screen notes within visible runway
      let highestOffscreenMidi = -Infinity;
      let lowestOffscreenMidi = Infinity;

      if (noteBars && noteBars.length > 0) {
        for (let i = 0; i < noteBars.length; i++) {
          const bar = noteBars[i];
          if (bar.endTimeMs >= windowStartMs && bar.startTimeMs <= windowEndMs) {
            const m = bar.midi + transposeSemitones;
            if (m > maxMidi && m > highestOffscreenMidi) highestOffscreenMidi = m;
            if (m < minMidi && m < lowestOffscreenMidi) lowestOffscreenMidi = m;
          }
        }
      }

      // 2. Background & Piano Roll Semitone Stripes
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      const scaleSet = new Set(scaleNotes || []);
      const pianoKeyWidth = 32;

      for (let m = minMidi; m <= maxMidi; m++) {
        const yTop = midiToY(m + 0.5);
        const yBottom = midiToY(m - 0.5);
        const stripH = Math.max(1, yBottom - yTop);
        const semi = ((m % 12) + 12) % 12;
        const noteName = NOTE_NAMES[semi];
        const isBlackKey = ACCIDENTAL_SEMITONES.has(semi);
        const isC = semi === 0;
        const isInScale = scaleSet.size > 0 ? scaleSet.has(noteName) : !isBlackKey;

        // Runway stripe fill: subtle highlight for in-scale notes, darkened for out-of-scale
        if (isInScale) {
          ctx.fillStyle = isC ? 'rgba(56, 189, 248, 0.10)' : 'rgba(56, 189, 248, 0.04)';
        } else {
          ctx.fillStyle = isBlackKey ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.30)';
        }
        ctx.fillRect(pianoKeyWidth, yTop, width - pianoKeyWidth, stripH);

        // Left piano roll key column (FL Studio NewTone style)
        ctx.fillStyle = isBlackKey ? '#090d16' : '#1e293b';
        ctx.fillRect(0, yTop, pianoKeyWidth, stripH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.strokeRect(0, yTop, pianoKeyWidth, stripH);

        // Grid line
        const lineY = midiToY(m);
        ctx.strokeStyle = isC
          ? 'rgba(56, 189, 248, 0.45)'
          : isInScale
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = isC ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(pianoKeyWidth, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();

        // Note label on left piano key (C prominent, scale notes crisp)
        const oct = Math.floor(m / 12) - 1;
        const noteStr = `${noteName}${oct}`;
        ctx.fillStyle = isC ? '#38bdf8' : isInScale ? '#f1f5f9' : 'rgba(100, 116, 139, 0.5)';
        ctx.font = isC ? 'bold 10px monospace' : isInScale ? 'bold 8.5px monospace' : '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(noteStr, 3, lineY + 3);
      }

      // 3. Tolerance Band around Active Target Note
      if (currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
        const refMidi = currentRefPoint.midi + transposeSemitones;
        const tolSemitones = (toleranceCents || 35) / 100;
        const tolY1 = midiToY(refMidi + tolSemitones);
        const tolY2 = midiToY(refMidi - tolSemitones);
        ctx.fillStyle = isInTuneNow ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.1)';
        ctx.fillRect(playheadX - 60, tolY1, 120, tolY2 - tolY1);
      }

      // 4. A-B Loop Overlay
      if (isLoopingActive && loopStartMs !== null && loopEndMs !== null) {
        const lx1 = Math.max(0, playheadX + ((loopStartMs - effectiveTimeMs) / totalWindowMs) * width);
        const lx2 = Math.min(width, playheadX + ((loopEndMs - effectiveTimeMs) / totalWindowMs) * width);
        if (lx2 > lx1) {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
          ctx.fillRect(lx1, 0, lx2 - lx1, height);
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(lx1, 0, lx2 - lx1, height);
          ctx.setLineDash([]);
        }
      }

      // 5. Reference Vocal Track: FL Studio NewTone-Style Note Blocks & Pitch Ribbon
      // A. Render Note Blocks (Solid rectangular semitone blocks on piano roll)
      if (noteBars && noteBars.length > 0) {
        for (let i = 0; i < noteBars.length; i++) {
          const bar = noteBars[i];
          if (bar.endTimeMs < windowStartMs || bar.startTimeMs > windowEndMs) continue;

          const barMidi = bar.midi + transposeSemitones;
          const x1 = playheadX + ((bar.startTimeMs - effectiveTimeMs) / totalWindowMs) * width;
          const x2 = playheadX + ((bar.endTimeMs - effectiveTimeMs) / totalWindowMs) * width;
          const barW = Math.max(14, x2 - x1);
          const barY = midiToY(barMidi);
          const barH = Math.min(26, Math.max(16, (height / midiSpan) * 0.88));
          const topY = barY - barH / 2;

          const isActive = effectiveTimeMs >= bar.startTimeMs && effectiveTimeMs <= bar.endTimeMs;
          const semi = ((barMidi % 12) + 12) % 12;
          const barNoteName = NOTE_NAMES[semi];
          const isNoteInScale = scaleSet.size > 0 ? scaleSet.has(barNoteName) : true;

          ctx.save();
          if (isActive && isInTuneNow) {
            // Hit effect: glowing neon emerald
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#10b981';
            ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.5;
          } else if (isActive) {
            // Active current note block: vibrant NewTone amber-gold illumination
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#f59e0b';
            ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2.2;
          } else {
            // Inactive NewTone note block: warm translucent amber glass
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(249, 115, 22, 0.35)';
            ctx.fillStyle = isNoteInScale ? 'rgba(234, 88, 12, 0.22)' : 'rgba(180, 83, 9, 0.16)';
            ctx.strokeStyle = isNoteInScale ? 'rgba(251, 146, 60, 0.75)' : 'rgba(251, 146, 60, 0.45)';
            ctx.lineWidth = 1.4;
          }

          if (!isNoteInScale) {
            ctx.setLineDash([4, 2]); // Dashed border for chromatic / out-of-scale notes
          }

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x1, topY, barW, barH, 4);
          } else {
            ctx.rect(x1, topY, barW, barH);
          }
          ctx.fill();
          ctx.stroke();

          // Top highlight accent stripe (NewTone 3D glass look)
          ctx.setLineDash([]);
          ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.45)' : 'rgba(253, 186, 116, 0.4)';
          ctx.fillRect(x1 + 2, topY + 1.5, Math.max(2, barW - 4), 2.5);

          // Note text badge on the block
          if (barW >= 22) {
            const oct = Math.floor(barMidi / 12) - 1;
            const displayNoteName = `${barNoteName}${oct}`;
            ctx.fillStyle = isActive ? '#ffffff' : 'rgba(254, 243, 199, 0.9)';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(displayNoteName, x1 + 5, barY + 3.5);
          }
          ctx.restore();
        }
      }

      // B. Render Micro-Pitch Contour Ribbon (Amber / Gold continuous curve through note blocks)
      if (pitchTrack && pitchTrack.length > 0) {
        ctx.save();
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.strokeStyle = '#fbbf24';

        let drawing = false;
        ctx.beginPath();
        for (let i = 0; i < pitchTrack.length; i++) {
          const pt = pitchTrack[i];
          if (pt.timeMs < windowStartMs || pt.timeMs > windowEndMs) continue;
          const x = playheadX + ((pt.timeMs - effectiveTimeMs) / totalWindowMs) * width;
          if (pt.isVocal && pt.midi > 0) {
            const y = midiToY(pt.midi + transposeSemitones);
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
          const x = playheadX + ((pt.timeMs - effectiveTimeMs) / totalWindowMs) * width;
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
        ctx.shadowColor = isInTuneNow ? '#10b981' : '#f59e0b';
        ctx.fillStyle = isInTuneNow ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.4)';
        ctx.strokeStyle = isInTuneNow ? '#34d399' : '#fde68a';
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 9B. Off-Screen Note Indicators (Prevent notes disappearing when moving outside vertical frame)
      if (highestOffscreenMidi > -Infinity) {
        const offNote = midiToNoteInfo(highestOffscreenMidi);
        const diff = Math.round(highestOffscreenMidi - maxMidi);
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(width - 240, 26, 175, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 240, 26, 175, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`▲ Nốt cao: ${offNote.noteName} (+${diff}st)`, width - 152, 39);
        ctx.restore();
      }

      if (lowestOffscreenMidi < Infinity) {
        const offNote = midiToNoteInfo(lowestOffscreenMidi);
        const diff = Math.round(minMidi - lowestOffscreenMidi);
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(width - 240, height - 24, 175, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 240, height - 24, 175, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`▼ Nốt trầm: ${offNote.noteName} (-${diff}st)`, width - 152, height - 11);
        ctx.restore();
      }

      // 10. FL Studio NewTone Visual Legend (Top Right)
      ctx.save();
      ctx.font = '10px monospace';
      const legendY = 16;
      // A. Reference Note Block Icon
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.fillRect(width - 230, legendY - 8, 14, 10);
      ctx.strokeRect(width - 230, legendY - 8, 14, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('Nốt NewTone', width - 212, legendY);

      // B. User Singing Icon
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(width - 132, legendY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('Giọng bạn', width - 124, legendY);

      // C. Zero Latency Indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('⚡ 0ms', width - 58, legendY);
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [renderStateRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[260px] sm:h-[300px] block ${className}`}
    />
  );
};
