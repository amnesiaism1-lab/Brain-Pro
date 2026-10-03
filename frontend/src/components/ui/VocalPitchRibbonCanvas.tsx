import React, { useRef, useEffect } from 'react';
import { IVocalPitchReading, IVocalPitchMatchEvaluation } from '../../services/vocalPitchService';

interface TargetNoteSlot {
  note: string;
  startMs: number;
  durationMs: number;
}

interface VocalPitchRibbonCanvasProps {
  reading: IVocalPitchReading | null;
  evaluation: IVocalPitchMatchEvaluation | null;
  currentTargetNote: string;
  targetSlots?: TargetNoteSlot[];
  toleranceCents: number;
  holdProgressPct: number; // 0..100
  className?: string;
}

interface PitchPoint {
  timeMs: number;
  freqHz: number;
  midi: number;
  inTune: boolean;
  isSinging: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const VocalPitchRibbonCanvas: React.FC<VocalPitchRibbonCanvasProps> = ({
  reading,
  evaluation,
  currentTargetNote,
  toleranceCents,
  holdProgressPct,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<PitchPoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Semitone map helper for MIDI note number
  const getNoteMidi = (noteStr: string): number => {
    if (!noteStr) return 60; // C4
    const semitones: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    const match = noteStr.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return 60;
    const pitchClass = match[1];
    const octave = parseInt(match[2], 10);
    return (octave + 1) * 12 + (semitones[pitchClass] ?? 0);
  };

  const targetMidi = getNoteMidi(currentTargetNote);
  const visualSmoothMidiRef = useRef<number>(0);

  // Append new incoming pitch reading (with visual EMA smoothing layer)
  useEffect(() => {
    if (!reading) return;
    const now = performance.now();
    const isSinging = reading.isSinging && reading.freqHz > 0;
    const inTune = (evaluation?.inTolerance ?? false) && isSinging;

    let displayMidi = 0;
    if (isSinging) {
      const rawExactMidi = 12 * Math.log2(reading.freqHz / 440) + 69;
      
      // Visual-layer EMA smooth: bridges any residual micro-jitter that slips past the service filter.
      // alpha=0.55 gives smooth trailing without noticeable display lag (~15ms effective latency).
      if (visualSmoothMidiRef.current > 0) {
        const drift = Math.abs(rawExactMidi - visualSmoothMidiRef.current);
        if (drift > 1.5) {
          // Singer changed note - snap visually (> 1.5 semitones = definitely a new pitch target)
          visualSmoothMidiRef.current = rawExactMidi;
        } else {
          // Sustaining - smooth the visual trail
          visualSmoothMidiRef.current = 0.55 * rawExactMidi + 0.45 * visualSmoothMidiRef.current;
        }
      } else {
        visualSmoothMidiRef.current = rawExactMidi;
      }
      displayMidi = visualSmoothMidiRef.current;
    } else {
      visualSmoothMidiRef.current = 0;
    }

    pointsRef.current.push({
      timeMs: now,
      freqHz: reading.freqHz,
      midi: displayMidi,
      inTune,
      isSinging,
    });

    // Spawn sparks if in tune
    if (inTune && canvasRef.current) {
      const canvas = canvasRef.current;
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: canvas.width * 0.72,
          y: canvas.height * 0.5 + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 3 - 2,
          vy: (Math.random() - 0.5) * 4,
          radius: Math.random() * 2.5 + 1.5,
          alpha: 1,
          color: Math.random() > 0.5 ? '#34d399' : '#06b6d4',
        });
      }
    }

    // Keep only last 5 seconds of trail
    const fiveSecAgo = now - 5000;
    while (pointsRef.current.length > 0 && pointsRef.current[0].timeMs < fiveSecAgo) {
      pointsRef.current.shift();
    }
  }, [reading, evaluation]);

  const centerMidiRef = useRef<number>(targetMidi);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      const now = performance.now();

      // Clear with dark cyber gradient
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Display window: vertical range around target note (+/- 9 semitones)
      // Smoothly track octave offset if singing in another octave
      let desiredCenter = targetMidi;
      if (evaluation && evaluation.octaveOffset !== 0 && reading?.isSinging) {
        desiredCenter = targetMidi + evaluation.octaveOffset * 12;
      } else if (reading?.isSinging && reading.midiNumber > 0) {
        const userOctDiff = Math.round((reading.midiNumber - targetMidi) / 12);
        desiredCenter = targetMidi + userOctDiff * 12;
      }

      centerMidiRef.current += (desiredCenter - centerMidiRef.current) * 0.1;
      const centerMidi = centerMidiRef.current;

      const midiMin = centerMidi - 9;
      const midiMax = centerMidi + 9;
      const midiRange = midiMax - midiMin;

      const midiToY = (midiVal: number) => {
        const norm = (midiVal - midiMin) / midiRange;
        return height - norm * height; // Invert Y (high pitch = top)
      };

      // 1. Draw horizontal musical semitone grid lines
      const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      for (let m = Math.floor(midiMin); m <= Math.ceil(midiMax); m++) {
        const y = midiToY(m);
        const pitchClass = ((m % 12) + 12) % 12;
        const oct = Math.floor(m / 12) - 1;
        const isNatural = ![1, 3, 6, 8, 10].includes(pitchClass);
        const isTarget = m === centerMidi;

        ctx.beginPath();
        ctx.strokeStyle = isTarget ? 'rgba(52, 211, 153, 0.35)' : isNatural ? 'rgba(51, 65, 85, 0.4)' : 'rgba(30, 41, 59, 0.25)';
        ctx.lineWidth = isTarget ? 2 : 1;
        ctx.setLineDash(isTarget ? [4, 4] : []);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label on left margin
        ctx.font = isTarget ? 'bold 11px monospace' : '10px monospace';
        ctx.fillStyle = isTarget ? '#34d399' : 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(`${NOTE_LABELS[pitchClass]}${oct}`, 10, y - 3);
      }

      // 2. Draw Target Runway (Flight Corridor)
      const targetY = midiToY(centerMidi);
      const halfTolSemitone = toleranceCents / 100;
      const topY = midiToY(centerMidi + halfTolSemitone);
      const botY = midiToY(centerMidi - halfTolSemitone);
      const corridorHeight = Math.abs(botY - topY);

      // Target Corridor Background Glow
      const corridorGrad = ctx.createLinearGradient(0, topY, 0, botY);
      corridorGrad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
      corridorGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.25)');
      corridorGrad.addColorStop(1, 'rgba(16, 185, 129, 0.08)');

      ctx.fillStyle = corridorGrad;
      ctx.fillRect(50, topY, width - 60, corridorHeight);

      // Corridor border rails
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, topY, width - 60, corridorHeight);

      // Center laser guide for exact pitch
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 6]);
      ctx.moveTo(50, targetY);
      ctx.lineTo(width - 10, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Hold Progress fill inside the target runway
      if (holdProgressPct > 0) {
        const progressWidth = (width - 60) * (holdProgressPct / 100);
        const energyGrad = ctx.createLinearGradient(50, 0, 50 + progressWidth, 0);
        energyGrad.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        energyGrad.addColorStop(1, 'rgba(52, 211, 153, 0.7)');

        ctx.fillStyle = energyGrad;
        ctx.fillRect(50, topY, progressWidth, corridorHeight);

        // Progress head glowing vertical line
        ctx.beginPath();
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12;
        ctx.moveTo(50 + progressWidth, topY - 4);
        ctx.lineTo(50 + progressWidth, botY + 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 4. Render User Singing Pitch Trail (Ribbon Curve)
      const points = pointsRef.current;
      const timeWindowMs = 3500; // 3.5 seconds across the canvas
      const xAnchor = width * 0.72; // Current singing head position at 72% width

      if (points.length >= 2) {
        ctx.beginPath();
        let segmentStarted = false;

        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          if (!pt.isSinging || pt.midi <= 0) {
            segmentStarted = false;
            continue;
          }

          // If there is a pause or drop between samples (>150ms), break the line cleanly
          if (i > 0 && (pt.timeMs - points[i - 1].timeMs > 150)) {
            segmentStarted = false;
          }

          // Compute X based on time difference from current head
          const dt = now - pt.timeMs;
          const x = xAnchor - (dt / timeWindowMs) * (width * 0.65);
          const y = midiToY(pt.midi);

          if (x < 50) continue; // Off screen left

          if (!segmentStarted) {
            ctx.moveTo(x, y);
            segmentStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        const isCurrentlyInTune = evaluation?.inTolerance ?? false;
        ctx.strokeStyle = isCurrentlyInTune ? '#34d399' : '#f43f5e';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = isCurrentlyInTune ? '#10b981' : '#e11d48';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5. Draw Head Indicator (Current Singing Ball & Out-of-bounds Guidance)
      if (reading?.isSinging && reading.freqHz > 0) {
        const userExactMidi = visualSmoothMidiRef.current > 0
          ? visualSmoothMidiRef.current
          : (12 * Math.log2(reading.freqHz / 440) + 69);
        const rawY = midiToY(userExactMidi);
        const inTune = evaluation?.inTolerance ?? false;

        // Is voice off-screen?
        const isTooHigh = userExactMidi > midiMax;
        const isTooLow = userExactMidi < midiMin;
        const clampedY = Math.max(26, Math.min(height - 26, rawY));

        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(xAnchor, clampedY, inTune ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = inTune ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.25)';
        ctx.fill();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(xAnchor, clampedY, 6, 0, Math.PI * 2);
        ctx.fillStyle = inTune ? '#34d399' : '#f43f5e';
        ctx.shadowColor = inTune ? '#34d399' : '#f43f5e';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Note badge right above or below the head indicator
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = inTune ? '#6ee7b7' : '#fda4af';
        ctx.textAlign = 'center';
        const badgeY = clampedY < 45 ? clampedY + 20 : clampedY - 12;
        ctx.fillText(`${reading.noteName} (${reading.solfegeName})`, xAnchor, badgeY);
        ctx.textAlign = 'left';

        // Out-of-bounds directional arrows and instructions
        if (isTooHigh) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`▲ Giọng bạn (${reading.noteName}) đang cao hơn mục tiêu - Hãy hạ giọng xuống ▼`, width / 2, 22);
          ctx.textAlign = 'left';
        } else if (isTooLow) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`▼ Giọng bạn (${reading.noteName}) đang trầm hơn mục tiêu - Hãy nâng cao độ lên ▲`, width / 2, height - 12);
          ctx.textAlign = 'left';
        }
      }

      // 6. Update and render particle sparks
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetMidi, evaluation, toleranceCents, holdProgressPct, reading]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl ${className}`}>
      <canvas
        ref={canvasRef}
        width={720}
        height={260}
        className="w-full h-[220px] md:h-[260px] block"
      />
      {/* Real-time hold progress readout badge */}
      <div className="absolute bottom-2.5 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-emerald-400 font-bold backdrop-blur-md">
        <span>GIỮ CAO ĐỘ:</span>
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-100"
            style={{ width: `${holdProgressPct}%` }}
          />
        </div>
        <span>{Math.round(holdProgressPct)}%</span>
      </div>
    </div>
  );
};
