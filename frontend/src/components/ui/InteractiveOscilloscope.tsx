import React, { useRef, useEffect } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';

interface IInteractiveOscilloscopeProps {
  height?: number;
  className?: string;
  lineColor?: string;
  isActive?: boolean;
}

export const InteractiveOscilloscope: React.FC<IInteractiveOscilloscopeProps> = ({
  height = 90,
  className = '',
  lineColor = '#22d3ee', // Cyan default
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser = auditoryEngine.getAnalyser();
    const bufferLength = analyser ? analyser.fftSize : 256;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();

      if (!analyser) {
        analyser = auditoryEngine.getAnalyser();
      }

      if (analyser && isActive) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Flat center line
        dataArray.fill(128);
      }

      // Draw Waveform
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = lineColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = lineColor;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
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
      ctx.shadowBlur = 0; // reset
    };

    draw();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [lineColor, isActive]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 shadow-inner flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
