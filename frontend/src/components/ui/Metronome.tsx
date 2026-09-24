import React, { useState, useEffect, useRef } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Play, Square, Plus, Minus, Volume2 } from 'lucide-react';

interface IMetronomeProps {
  initialBpm?: number;
  className?: string;
}

export const Metronome: React.FC<IMetronomeProps> = ({
  initialBpm = 100,
  className = ''
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const beatsPerMeasure = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;

  const playClick = (beatIndex: number) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    if (beatIndex === 0) {
      // Downbeat accent (high pitched clave/woodblock)
      auditoryEngine.playNote('C6', 0.05, { volume: 0.45, waveform: 'triangle' });
    } else {
      // Normal click
      auditoryEngine.playNote('G5', 0.04, { volume: 0.3, waveform: 'sine' });
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
      return;
    }

    const intervalMs = Math.round(60000 / bpm);
    let beat = 0;

    // Play first beat immediately
    playClick(beat);
    setCurrentBeat(beat);

    timerRef.current = setInterval(() => {
      beat = (beat + 1) % beatsPerMeasure;
      setCurrentBeat(beat);
      playClick(beat);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, beatsPerMeasure]);

  const handleTap = () => {
    const now = Date.now();
    const taps = tapTimesRef.current.filter(t => now - t < 3000);
    taps.push(now);
    tapTimesRef.current = taps;

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  return (
    <div className={`p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 text-white shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black tracking-wider uppercase text-slate-300">Máy Đếm Nhịp (Metronome)</span>
        </div>
        
        {/* Time Signature selector */}
        <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          {(['4/4', '3/4', '6/8'] as const).map(sig => (
            <button
              key={sig}
              onClick={() => {
                setTimeSignature(sig);
                setCurrentBeat(0);
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                timeSignature === sig ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sig}
            </button>
          ))}
        </div>
      </div>

      {/* Beat Lights */}
      <div className="flex items-center justify-center gap-2 my-4">
        {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
          const isActive = isPlaying && currentBeat === idx;
          const isAccent = idx === 0;

          return (
            <div
              key={idx}
              className={`h-3.5 rounded-full transition-all duration-75 ${
                isAccent ? 'w-8' : 'w-5'
              } ${
                isActive
                  ? isAccent
                    ? 'bg-amber-400 shadow-lg shadow-amber-400/80 scale-110'
                    : 'bg-cyan-400 shadow-md shadow-cyan-400/70 scale-105'
                  : isAccent
                  ? 'bg-amber-900/50 border border-amber-600/40'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* BPM Display & Slider */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setBpm(b => Math.max(40, b - 5))}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-3xl font-black text-cyan-400 tracking-tight">{bpm}</span>
          <span className="text-xs text-slate-400 ml-1.5 font-bold">BPM</span>
        </div>

        <button
          onClick={() => setBpm(b => Math.min(220, b + 5))}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <input
        type="range"
        min={40}
        max={220}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-4"
      />

      {/* Actions: Play/Stop & Tap Tempo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Dừng nhịp</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Chạy nhịp</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleTap}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 border border-slate-700 select-none"
        >
          Tap Tempo
        </button>
      </div>
    </div>
  );
};
