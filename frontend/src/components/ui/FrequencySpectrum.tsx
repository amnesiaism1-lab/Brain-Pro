import React, { useEffect, useRef } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';

interface IFrequencySpectrumProps {
  className?: string;
  isActive?: boolean;
  height?: number;
}

export const FrequencySpectrum: React.FC<IFrequencySpectrumProps> = ({
  className = '',
  isActive = true,
  height = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = auditoryEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Draw bars
      const barCount = 32;
      const barWidth = (width / barCount) * 0.75;
      const gap = (width / barCount) * 0.25;

      for (let i = 0; i < barCount; i++) {
        // Map to lower-to-mid frequencies for better musical visibility
        const dataIdx = Math.floor((i / barCount) * (bufferLength / 2));
        const val = dataArray[dataIdx] || 0;
        const barHeight = Math.max(3, (val / 255) * (h - 8));
        const x = i * (barWidth + gap);
        const y = h - barHeight;

        // Gradient from cyan to purple
        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, '#22d3ee');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-950/70 border border-white/10 p-2 shadow-inner ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
