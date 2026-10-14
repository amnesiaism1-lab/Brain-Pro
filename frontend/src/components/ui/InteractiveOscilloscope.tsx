import React, { useRef, useEffect, useState } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Activity, BarChart2 } from 'lucide-react';

export type VisualizerMode = 'waveform' | 'spectrum';

interface IInteractiveOscilloscopeProps {
  height?: number;
  className?: string;
  lineColor?: string;
  isActive?: boolean;
  defaultMode?: VisualizerMode;
  showModeToggle?: boolean;
}

export const InteractiveOscilloscope: React.FC<IInteractiveOscilloscopeProps> = ({
  height = 110,
  className = '',
  lineColor = '#22d3ee', // Cyan default
  isActive = true,
  defaultMode = 'waveform',
  showModeToggle = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [mode, setMode] = useState<VisualizerMode>(defaultMode);
  const [isAudioLive, setIsAudioLive] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser = auditoryEngine.getAnalyser();
    const bufferLength = analyser ? analyser.fftSize : 256;
    const timeDomainArray = new Uint8Array(bufferLength);
    const freqDomainArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 128);

    let ghostPhase = 0;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // 1. Draw Lab Oscilloscope Reticle Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      // Horizontal reference lines (Center, +6dB, -6dB)
      ctx.beginPath();
      ctx.moveTo(0, h * 0.25);
      ctx.lineTo(width, h * 0.25);
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(width, h * 0.5);
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(width, h * 0.75);
      ctx.stroke();

      // Vertical time/frequency division ticks
      ctx.beginPath();
      for (let x = width / 8; x < width; x += width / 8) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();

      // Center crosshair markers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 10, h / 2);
      ctx.lineTo(width / 2 + 10, h / 2);
      ctx.moveTo(width / 2, h / 2 - 10);
      ctx.lineTo(width / 2, h / 2 + 10);
      ctx.stroke();

      if (!analyser) {
        analyser = auditoryEngine.getAnalyser();
      }

      let hasRealSignal = false;

      if (analyser && isActive) {
        if (mode === 'waveform') {
          analyser.getByteTimeDomainData(timeDomainArray);
          // Check if data deviates from silence (128)
          for (let i = 0; i < bufferLength; i += 8) {
            if (Math.abs(timeDomainArray[i] - 128) > 3) {
              hasRealSignal = true;
              break;
            }
          }
        } else {
          analyser.getByteFrequencyData(freqDomainArray);
          for (let i = 0; i < freqDomainArray.length; i += 4) {
            if (freqDomainArray[i] > 10) {
              hasRealSignal = true;
              break;
            }
          }
        }
      }

      setIsAudioLive(hasRealSignal);

      if (mode === 'waveform') {
        // Draw Waveform or Ghost Wave
        ctx.lineWidth = 2.5;

        if (hasRealSignal) {
          // LIVE SIGNAL
          ctx.strokeStyle = lineColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = lineColor;
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = timeDomainArray[i] / 128.0;
            const y = (v * h) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.lineTo(width, h / 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // GHOST PREVIEW WAVE (Idle state: gentle breathing sine wave)
          ghostPhase += 0.045;
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();

          const points = 120;
          const sliceWidth = width / points;
          let x = 0;

          for (let i = 0; i <= points; i++) {
            const normX = i / points;
            const amp = Math.sin(ghostPhase * 0.8) * 8 + 14;
            const y = h / 2 + Math.sin(normX * Math.PI * 6 + ghostPhase) * amp;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
          ctx.setLineDash([]); // reset dash
        }
      } else {
        // FFT SPECTRUM MODE (Harmonics bars)
        const bins = Math.min(freqDomainArray.length, 64);
        const barWidth = (width / bins) - 2;

        for (let i = 0; i < bins; i++) {
          let barHeight = (freqDomainArray[i] / 255) * (h - 10);
          if (!hasRealSignal) {
            // Subtle breathing harmonic peaks preview
            const harmonicPulse = Math.sin(ghostPhase + i * 0.4) * 0.5 + 0.5;
            barHeight = (1 / (i * 0.3 + 1)) * 18 * harmonicPulse;
          }

          const x = i * (barWidth + 2);
          const y = h - barHeight - 4;

          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, lineColor);
          grad.addColorStop(1, 'rgba(59, 130, 246, 0.2)');

          ctx.fillStyle = hasRealSignal ? grad : 'rgba(34, 211, 238, 0.2)';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    };

    draw();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [lineColor, isActive, mode]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner ${className}`}>
      {/* Top Status Bar & Mode Switcher */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none z-10 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isAudioLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400/80 animate-pulse'
              }`}
            />
            <span className={isAudioLive ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
              {isAudioLive ? 'TÍN HIỆU LIVE' : 'CHỜ TÍN HIỆU (GHOST WAVE)'}
            </span>
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-white/5">
            44.1kHz • 256 FFT
          </span>
        </div>

        {showModeToggle && (
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('waveform')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                mode === 'waveform' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Sóng (Wave)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('spectrum')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                mode === 'spectrum' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Phổ Tần (FFT)</span>
            </button>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
