import React, { useEffect, useRef } from 'react';
import { RunwayRenderState } from '../types';
import { NOTE_NAMES, midiToNoteInfo } from '@brain-exercises/shared';
import { auditoryEngine } from '../../../services/auditoryEngine';

interface PitchRunwayCanvasProps {
  renderStateRef: React.MutableRefObject<RunwayRenderState>;
  className?: string;
  onSeek?: (timeMs: number) => void;
}

const ACCIDENTAL_SEMITONES = new Set([1, 3, 6, 8, 10]);

const playAuditionNote = (midi: number) => {
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  try {
    auditoryEngine.startNote(freq, 0.85, { timbrePreset: 'acoustic-piano' });
    setTimeout(() => {
      auditoryEngine.stopNote(freq, 0.2);
    }, 380);
  } catch (err) {
    console.warn('Audition note playback failed:', err);
  }
};

export const PitchRunwayCanvas: React.FC<PitchRunwayCanvasProps> = ({
  renderStateRef,
  className = '',
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onSeekRef = useRef(onSeek);
  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  const manualOffsetRef = useRef(0);
  const manualSpanRef = useRef<number | null>(null);
  const userInteractedUntilRef = useRef(0);
  const hoverXRef = useRef<number | null>(null);
  const smoothMinMidiRef = useRef(48); // C3
  const smoothMaxMidiRef = useRef(72); // C5

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isMounted = true;

    let isMouseDown = false;
    let isDraggingCanvas = false;
    let mouseDownPos = { x: 0, y: 0 };
    let lastDragPos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      isMouseDown = true;
      isDraggingCanvas = false;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      lastDragPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      if (isDraggingCanvas) {
        isDraggingCanvas = false;
        return;
      }
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (dist >= 8) return; // Ignore drag/swipe

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const width = canvas.clientWidth || 860;
      const height = canvas.clientHeight || 280;
      const pianoKeyWidth = width > 1200 ? 46 : 36;

      const state = renderStateRef.current;
      const latencyOffsetMs = state.latencyOffsetMs ?? 45;
      const effectiveTimeMs = Math.max(0, state.currentTimeMs - latencyOffsetMs);
      const pastWindowMs = 1500;
      const futureWindowMs = 3500;
      const totalWindowMs = pastWindowMs + futureWindowMs;
      const playheadX = (pastWindowMs / totalWindowMs) * width;

      const effectiveSpan = manualSpanRef.current ?? (smoothMaxMidiRef.current - smoothMinMidiRef.current);
      const effectiveMin = smoothMinMidiRef.current + manualOffsetRef.current;
      const midiSpan = Math.max(12, effectiveSpan);

      // 0. Clicked on Reset / Auto-Fit Button (when viewport is panned or zoomed away from center)
      const isCustomPanned =
        manualOffsetRef.current !== 0 ||
        manualSpanRef.current !== null ||
        Date.now() < userInteractedUntilRef.current ||
        Boolean(state.isWindowLocked);
      if (isCustomPanned) {
        const btnX = pianoKeyWidth + 10;
        const btnY = 10;
        const btnW = 126;
        const btnH = 22;
        if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
          manualOffsetRef.current = 0;
          manualSpanRef.current = null;
          userInteractedUntilRef.current = 0;
          return;
        }
      }

      // 1. Clicked on Piano Key column on left: Audition clicked note
      if (clickX < pianoKeyWidth) {
        const clickedMidi = Math.round(effectiveMin + (1 - clickY / height) * midiSpan);
        playAuditionNote(clickedMidi);
        return;
      }

      // 2. Clicked on Runway Canvas:
      const clickedTimeMs = effectiveTimeMs + ((clickX - playheadX) / width) * totalWindowMs;
      const clampedMs = Math.max(0, Math.min(state.durationMs || 999999, Math.round(clickedTimeMs)));
      const clickedMidi = effectiveMin + (1 - clickY / height) * midiSpan;

      // Check if user clicked on or near a note block
      let hitBar = null;
      if (state.noteBars && state.noteBars.length > 0) {
        for (let i = 0; i < state.noteBars.length; i++) {
          const bar = state.noteBars[i];
          const m = bar.midi + (state.transposeSemitones || 0);
          const tMargin = Math.max(100, (bar.endTimeMs - bar.startTimeMs) * 0.15);
          if (
            clickedTimeMs >= bar.startTimeMs - tMargin &&
            clickedTimeMs <= bar.endTimeMs + tMargin &&
            Math.abs(m - clickedMidi) <= 0.85
          ) {
            hitBar = bar;
            break;
          }
        }
      }

      if (hitBar) {
        // Audition the note tone and seek to note start
        const m = hitBar.midi + (state.transposeSemitones || 0);
        playAuditionNote(m);
        onSeekRef.current?.(hitBar.startTimeMs);
      } else {
        // Seek to the exact clicked timestamp
        onSeekRef.current?.(clampedMs);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const width = canvas.clientWidth || 860;
      const height = canvas.clientHeight || 280;
      const pianoKeyWidth = width > 1200 ? 46 : 36;

      if (isMouseDown) {
        const totalDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
        if (totalDist >= 8) {
          isDraggingCanvas = true;
          userInteractedUntilRef.current = Date.now() + 4500;
          const dy = e.clientY - lastDragPos.y; // Dragging down moves viewport lower
          lastDragPos = { x: e.clientX, y: e.clientY };

          const state = renderStateRef.current;
          const maxTopMidi = state?.octaveConvention === 'fl_studio' ? 84 : 96;
          const minBottomMidi = 36;
          const span = manualSpanRef.current ?? (smoothMaxMidiRef.current - smoothMinMidiRef.current);
          const curSpan = Math.max(12, Math.min(28, span));

          // Inverted: dragging mouse downwards pulls lower notes into view
          const deltaMidi = -(dy / height) * curSpan;
          const proposedOffset = manualOffsetRef.current + deltaMidi;
          const maxOffset = maxTopMidi - curSpan - smoothMinMidiRef.current;
          const minOffset = minBottomMidi - smoothMinMidiRef.current;
          manualOffsetRef.current = Math.max(minOffset, Math.min(maxOffset, proposedOffset));
          hoverXRef.current = null;
          return;
        }
      }

      if (mx >= pianoKeyWidth) {
        hoverXRef.current = mx;
      } else {
        hoverXRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      isMouseDown = false;
      isDraggingCanvas = false;
      hoverXRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      userInteractedUntilRef.current = Date.now() + 4500;
      const state = renderStateRef.current;
      // Top ceiling: C7 (end of octave 6). In FL Studio: MIDI 84 (C7); in International: MIDI 96 (C7).
      const maxTopMidi = state?.octaveConvention === 'fl_studio' ? 84 : 96;
      const minBottomMidi = 36; // C2

      if (e.ctrlKey || e.metaKey) {
        // Zoom vertical span in/out
        const delta = e.deltaY > 0 ? 1 : -1;
        const currentSpan = manualSpanRef.current ?? (smoothMaxMidiRef.current - smoothMinMidiRef.current);
        const newSpan = Math.max(12, Math.min(28, currentSpan + delta));
        manualSpanRef.current = newSpan;
        // Keep within bounds
        const curMin = smoothMinMidiRef.current + manualOffsetRef.current;
        if (curMin + newSpan > maxTopMidi) {
          manualOffsetRef.current = maxTopMidi - newSpan - smoothMinMidiRef.current;
        }
        if (curMin < minBottomMidi) {
          manualOffsetRef.current = minBottomMidi - smoothMinMidiRef.current;
        }
      } else {
        // Pan vertical up/down with strict clamp (cannot scroll above C7 / end of octave 6)
        const delta = e.deltaY > 0 ? -1 : 1;
        const proposedOffset = manualOffsetRef.current + delta;
        const span = manualSpanRef.current ?? (smoothMaxMidiRef.current - smoothMinMidiRef.current);
        const curSpan = Math.max(12, Math.min(28, span));
        const maxOffset = maxTopMidi - curSpan - smoothMinMidiRef.current;
        const minOffset = minBottomMidi - smoothMinMidiRef.current;
        manualOffsetRef.current = Math.max(minOffset, Math.min(maxOffset, proposedOffset));
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
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

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

      // Top ceiling: C7 (end of octave 6).
      // In FL Studio: MIDI 84 (rendered as C7); in International: MIDI 96 (rendered as C7).
      const maxTopMidi = state.octaveConvention === 'fl_studio' ? 84 : 96;
      const minBottomMidi = 36; // C2

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
            const m = Math.min(maxTopMidi, Math.max(minBottomMidi, bar.midi + transposeSemitones));
            if (m < localMin) localMin = m;
            if (m > localMax) localMax = m;
            notesInWindow++;
          }
        }
      }

      let targetMin: number;
      let targetMax: number;

      if (!isManualControl) {
        if (notesInWindow > 0) {
          const activeRefMidi =
            currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0
              ? Math.min(maxTopMidi, Math.max(minBottomMidi, currentRefPoint.midi + transposeSemitones))
              : null;
          const melodyCenter = (localMin + localMax) / 2;
          // Keep melodyCenter dominant (80%) so momentary noise spikes never jerk the viewport
          const center = activeRefMidi !== null ? activeRefMidi * 0.2 + melodyCenter * 0.8 : melodyCenter;
          const rawSpan = localMax - localMin + 6;
          const desiredSpan = Math.min(22, Math.max(14, rawSpan));

          let proposedMin = Math.floor(center - desiredSpan / 2);
          let proposedMax = proposedMin + desiredSpan;
          if (proposedMax > maxTopMidi) {
            proposedMax = maxTopMidi;
            proposedMin = Math.max(minBottomMidi, maxTopMidi - desiredSpan);
          }
          if (proposedMin < minBottomMidi) {
            proposedMin = minBottomMidi;
            proposedMax = Math.min(maxTopMidi, minBottomMidi + desiredSpan);
          }
          targetMin = proposedMin;
          targetMax = proposedMax;
        } else {
          // Fallback to song's vocal range with padding (clamped to maxTopMidi C7)
          const songMin = Math.max(minBottomMidi, (lowestMidi || 48) + transposeSemitones);
          const songMax = Math.min(maxTopMidi, (highestMidi || 72) + transposeSemitones);
          const center = (songMin + songMax) / 2;
          const desiredSpan = Math.min(22, Math.max(14, songMax - songMin + 4));

          let proposedMin = Math.floor(center - desiredSpan / 2);
          let proposedMax = proposedMin + desiredSpan;
          if (proposedMax > maxTopMidi) {
            proposedMax = maxTopMidi;
            proposedMin = Math.max(minBottomMidi, maxTopMidi - desiredSpan);
          }
          if (proposedMin < minBottomMidi) {
            proposedMin = minBottomMidi;
            proposedMax = Math.min(maxTopMidi, minBottomMidi + desiredSpan);
          }
          targetMin = proposedMin;
          targetMax = proposedMax;
        }

        // Deadzone filter: only adapt if difference > 0.08 semitones to avoid micro-jitter
        if (Math.abs(targetMin - smoothMinMidiRef.current) > 0.08) {
          smoothMinMidiRef.current += (targetMin - smoothMinMidiRef.current) * 0.05;
        }
        if (Math.abs(targetMax - smoothMaxMidiRef.current) > 0.08) {
          smoothMaxMidiRef.current += (targetMax - smoothMaxMidiRef.current) * 0.05;
        }
      }

      // Hard clamp on smooth references
      smoothMaxMidiRef.current = Math.min(maxTopMidi, Math.max(minBottomMidi + 12, smoothMaxMidiRef.current));
      smoothMinMidiRef.current = Math.max(minBottomMidi, Math.min(maxTopMidi - 12, smoothMinMidiRef.current));

      // Smooth floating-point coordinate mapping (strictly bounded inside [minBottomMidi, maxTopMidi])
      const rawEffectiveSpan = manualSpanRef.current ?? (smoothMaxMidiRef.current - smoothMinMidiRef.current);
      const midiSpan = Math.min(maxTopMidi - minBottomMidi, Math.max(12, rawEffectiveSpan));

      let effectiveMin = smoothMinMidiRef.current + manualOffsetRef.current;
      if (effectiveMin + midiSpan > maxTopMidi) {
        effectiveMin = maxTopMidi - midiSpan;
        manualOffsetRef.current = effectiveMin - smoothMinMidiRef.current;
      }
      if (effectiveMin < minBottomMidi) {
        effectiveMin = minBottomMidi;
        manualOffsetRef.current = effectiveMin - smoothMinMidiRef.current;
      }

      const midiToY = (m: number) => height - ((m - effectiveMin) / midiSpan) * height;

      // Detect off-screen notes within visible runway
      let highestOffscreenMidi = -Infinity;
      let lowestOffscreenMidi = Infinity;

      if (noteBars && noteBars.length > 0) {
        for (let i = 0; i < noteBars.length; i++) {
          const bar = noteBars[i];
          if (bar.endTimeMs >= windowStartMs && bar.startTimeMs <= windowEndMs) {
            const m = bar.midi + transposeSemitones;
            if (m > effectiveMin + midiSpan && m > highestOffscreenMidi) highestOffscreenMidi = m;
            if (m < effectiveMin && m < lowestOffscreenMidi) lowestOffscreenMidi = m;
          }
        }
      }

      // 2. Background & Piano Roll Semitone Stripes
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      const scaleSet = new Set(scaleNotes || []);
      const pianoKeyWidth = width > 1200 ? 46 : 36;
      const octOffset = state.octaveConvention === 'international' ? 0 : 1;

      // Only iterate and draw notes strictly from minBottomMidi up to maxTopMidi (C7 / hết quãng 6)
      const startMidi = Math.max(minBottomMidi, Math.floor(effectiveMin));
      const endMidi = Math.min(maxTopMidi, Math.ceil(effectiveMin + midiSpan));

      for (let m = startMidi; m <= endMidi; m++) {
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
        // Displays octave according to active convention (FL Studio C5/G5 vs International C4/G4)
        const oct = Math.floor(m / 12) - 1 + octOffset;
        const noteStr = `${noteName}${oct}`;
        ctx.fillStyle = isC ? '#38bdf8' : isInScale ? '#f1f5f9' : 'rgba(100, 116, 139, 0.5)';
        ctx.font = isC ? 'bold 10.5px monospace' : isInScale ? 'bold 9px monospace' : '8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(noteStr, 4, lineY + 3.5);
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
      // A. Render Note Blocks (Solid rectangular semitone blocks on piano roll with internal audio waveform)
      if (noteBars && noteBars.length > 0) {
        for (let i = 0; i < noteBars.length; i++) {
          const bar = noteBars[i];
          if (bar.endTimeMs < windowStartMs || bar.startTimeMs > windowEndMs) continue;

          const barMidi = bar.midi + transposeSemitones;
          const x1 = playheadX + ((bar.startTimeMs - effectiveTimeMs) / totalWindowMs) * width;
          const x2 = playheadX + ((bar.endTimeMs - effectiveTimeMs) / totalWindowMs) * width;
          const barW = Math.max(14, x2 - x1);
          const barY = midiToY(barMidi);
          const barH = Math.min(30, Math.max(18, (height / midiSpan) * 0.90));
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

          // Render FL Studio NewTone Audio Waveform Amplitude Silhouette inside note block
          if (bar.rmsEnvelope && bar.rmsEnvelope.length > 1) {
            ctx.save();
            ctx.beginPath();
            const maxAmpH = barH * 0.40;
            const env = bar.rmsEnvelope;
            // Top silhouette
            for (let k = 0; k < env.length; k++) {
              const frac = k / (env.length - 1);
              const wx = x1 + frac * barW;
              const amp = Math.max(0.08, env[k]);
              const wy = barY - amp * maxAmpH;
              if (k === 0) ctx.moveTo(wx, wy);
              else ctx.lineTo(wx, wy);
            }
            // Bottom silhouette (symmetrical)
            for (let k = env.length - 1; k >= 0; k--) {
              const frac = k / (env.length - 1);
              const wx = x1 + frac * barW;
              const amp = Math.max(0.08, env[k]);
              const wy = barY + amp * maxAmpH;
              ctx.lineTo(wx, wy);
            }
            ctx.closePath();
            ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 240, 220, 0.26)';
            ctx.fill();
            ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 240, 220, 0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }

          // Top highlight accent stripe (NewTone 3D glass look)
          ctx.setLineDash([]);
          ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.45)' : 'rgba(253, 186, 116, 0.4)';
          ctx.fillRect(x1 + 2, topY + 1.5, Math.max(2, barW - 4), 2.5);

          // If this bar is a melisma/glide continuation of the same word (`~`), draw a Legato Slur Bridge from previous bar
          const rawSyl = bar.lyricSyllable ? bar.lyricSyllable.trim() : '';
          if (i > 0 && rawSyl.startsWith('~')) {
            const prevBar = noteBars[i - 1];
            if (prevBar.startTimeMs <= bar.startTimeMs && bar.startTimeMs - prevBar.endTimeMs <= 160) {
              const prevMidi = prevBar.midi + transposeSemitones;
              const prevX2 =
                playheadX + ((prevBar.endTimeMs - effectiveTimeMs) / totalWindowMs) * width;
              const prevY = midiToY(prevMidi);
              const midX = (prevX2 + x1) / 2;

              ctx.save();
              ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(192, 132, 252, 0.85)';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(prevX2 - 2, prevY);
              ctx.bezierCurveTo(midX, prevY, midX, barY, x1 + 2, barY);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Note text & synced lyric syllable badge on the block
          if (barW >= 22) {
            const oct = Math.floor(barMidi / 12) - 1 + octOffset;
            const displayNoteName = `${barNoteName}${oct}`;
            const labelText =
              rawSyl && barW >= 46
                ? `${rawSyl} · ${displayNoteName}`
                : rawSyl && barW >= 26
                ? rawSyl
                : displayNoteName;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x1 + 2, topY, Math.max(0, barW - 4), barH);
            ctx.clip();
            ctx.fillStyle = isActive ? '#ffffff' : 'rgba(254, 243, 199, 0.95)';
            ctx.font = isActive ? 'bold 10.5px sans-serif' : 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(labelText, x1 + 5, barY + 3.5);
            ctx.restore();
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
        const refMidi = currentRefPoint.midi + transposeSemitones;
        const targetY = midiToY(refMidi);
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

        // Consistent octave naming across piano roll, note bars and target hit-box
        const semi = ((Math.round(refMidi) % 12) + 12) % 12;
        const noteName = NOTE_NAMES[semi];
        const oct = Math.floor(Math.round(refMidi) / 12) - 1 + octOffset;
        const displayTargetName = `${noteName}${oct}`;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(displayTargetName, playheadX, targetY + 4);
        ctx.restore();
      }

      // 8. Live Microphone Orb, Ghost Orb & Out-of-Bounds Indicators
      if (userReading && userReading.isSinging && userReading.freqHz > 0) {
        const exactUserMidi = 12 * Math.log2(userReading.freqHz / 440) + 69;
        let displayMidi = exactUserMidi;
        let octShift = 0;

        if (smartOctaveFold && currentRefPoint && currentRefPoint.isVocal && currentRefPoint.midi > 0) {
          const refMidi = currentRefPoint.midi + transposeSemitones;
          octShift = Math.round((exactUserMidi - refMidi) / 12);
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

          // User live sung note pill tag next to orb
          const userSemi = ((Math.round(displayMidi) % 12) + 12) % 12;
          const userOct = Math.floor(Math.round(displayMidi) / 12) - 1 + octOffset;
          const userNoteName = `${NOTE_NAMES[userSemi]}${userOct}`;
          const centsLabel = currentCentsDiff > 0 ? `+${currentCentsDiff}c` : `${currentCentsDiff}c`;

          ctx.shadowBlur = 4;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = orbColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(playheadX + 14, userY - 10, 68, 20, 5);
          } else {
            ctx.rect(playheadX + 14, userY - 10, 68, 20);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = orbColor;
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${userNoteName} ${centsLabel}`, playheadX + 18, userY + 4);
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
        const offSemi = ((highestOffscreenMidi % 12) + 12) % 12;
        const offOct = Math.floor(highestOffscreenMidi / 12) - 1 + octOffset;
        const offName = `${NOTE_NAMES[offSemi]}${offOct}`;
        const diff = Math.round(highestOffscreenMidi - (effectiveMin + midiSpan));
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(width - 240, 26, 175, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 240, 26, 175, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`▲ Nốt cao: ${offName} (+${diff}st)`, width - 152, 39);
        ctx.restore();
      }

      if (lowestOffscreenMidi < Infinity) {
        const offSemi = ((lowestOffscreenMidi % 12) + 12) % 12;
        const offOct = Math.floor(lowestOffscreenMidi / 12) - 1 + octOffset;
        const offName = `${NOTE_NAMES[offSemi]}${offOct}`;
        const diff = Math.round(effectiveMin - lowestOffscreenMidi);
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(width - 240, height - 24, 175, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(width - 240, height - 24, 175, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`▼ Nốt trầm: ${offName} (-${diff}st)`, width - 152, height - 11);
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

      // D. Auto-fit / Snap-to-center button (when user manually panned or zoomed away)
      const isCustomPanned =
        manualOffsetRef.current !== 0 ||
        manualSpanRef.current !== null ||
        Date.now() < userInteractedUntilRef.current ||
        Boolean(state.isWindowLocked);
      if (isCustomPanned) {
        ctx.save();
        const btnX = pianoKeyWidth + 10;
        const btnY = 10;
        const btnW = 126;
        const btnH = 22;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(btnX, btnY, btnW, btnH, 6);
        } else {
          ctx.rect(btnX, btnY, btnW, btnH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('⟲ Căn giữa nốt hát', btnX + btnW / 2, btnY + btnH / 2);
        ctx.restore();
      }

      // 11. Click to Seek Hover Time Guide Line
      if (hoverXRef.current !== null && onSeek) {
        const hx = hoverXRef.current;
        const latencyOffsetMs = rawLatencyOffsetMs ?? 45;
        const effectiveTimeMs = Math.max(0, currentTimeMs - latencyOffsetMs);
        const pastWindowMs = 1500;
        const futureWindowMs = 3500;
        const totalWindowMs = pastWindowMs + futureWindowMs;
        const playheadX = (pastWindowMs / totalWindowMs) * width;
        const hoverTimeMs = Math.max(
          0,
          Math.min(
            state.durationMs || 999999,
            Math.round(effectiveTimeMs + ((hx - playheadX) / totalWindowMs) * totalWindowMs)
          )
        );

        const sec = Math.floor(hoverTimeMs / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const timeLabel = `${m}:${s < 10 ? '0' : ''}${s}`;

        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover Time Pill at top
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(hx - 24, 6, 48, 16, 4);
        } else {
          ctx.rect(hx - 24, 6, 48, 16);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabel, hx, 18);
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [renderStateRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[520px] block cursor-crosshair ${className}`}
    />
  );
};
