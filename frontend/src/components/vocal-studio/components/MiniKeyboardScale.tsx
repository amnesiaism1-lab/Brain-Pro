import React from 'react';
import { auditoryEngine } from '../../../services/auditoryEngine';
import { NOTE_NAMES, SOLFEGE_NAMES } from '@brain-exercises/shared';
import { Volume2 } from 'lucide-react';

interface MiniKeyboardScaleProps {
  scaleNotes?: string[];
  activeTargetNote?: string | null;
  activeUserNote?: string | null;
  currentOctave?: number;
}

export const MiniKeyboardScale: React.FC<MiniKeyboardScaleProps> = ({
  scaleNotes = [],
  activeTargetNote,
  activeUserNote,
  currentOctave = 4,
}) => {
  const handlePlayKey = (noteWithOctave: string) => {
    try {
      auditoryEngine.playNote(noteWithOctave, 0.5, {
        waveform: 'triangle',
        volume: 0.45,
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold">
          <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Bàn phím nốt âm giai (Bấm vào phím để nghe mẫu):</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Quãng 8: {currentOctave}</span>
      </div>

      <div className="flex items-center justify-center gap-1 overflow-x-auto py-1">
        {NOTE_NAMES.map((name, idx) => {
          const isAccidental = name.includes('#');
          const fullNote = `${name}${currentOctave}`;
          const isTarget = activeTargetNote?.replace(/[0-9]/g, '') === name;
          const isUser = activeUserNote?.replace(/[0-9]/g, '') === name;
          const isInScale = scaleNotes.length === 0 || scaleNotes.includes(name);

          return (
            <button
              key={name}
              type="button"
              onClick={() => handlePlayKey(fullNote)}
              title={`Nghe nốt ${fullNote} (${SOLFEGE_NAMES[idx]})`}
              className={`relative flex flex-col items-center justify-between transition-all select-none ${
                isAccidental
                  ? 'h-14 w-6 sm:w-7 -mx-1 z-10 rounded-b-md bg-slate-900 border border-slate-700 hover:bg-slate-800'
                  : 'h-18 w-7 sm:w-8 rounded-b-lg bg-slate-800/90 border border-slate-700/80 hover:bg-slate-700'
              } ${
                isTarget
                  ? '!bg-sky-500 !text-slate-950 !border-sky-300 ring-2 ring-sky-400 shadow-md shadow-sky-500/30'
                  : isUser
                  ? '!bg-emerald-500 !text-slate-950 !border-emerald-300 ring-2 ring-emerald-400 shadow-md'
                  : isInScale
                  ? 'text-slate-200'
                  : 'text-slate-500 opacity-60'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold mt-1 ${isAccidental ? 'text-[9px]' : ''}`}>
                {name}
              </span>
              <span className="text-[8px] font-mono opacity-70 mb-1">
                {SOLFEGE_NAMES[idx]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
