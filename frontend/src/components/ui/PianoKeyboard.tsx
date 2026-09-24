import React, { useMemo } from 'react';
import { PIANO_KEYS_88 } from '../../services/musicTheoryService';
import { useMidiInput } from '../../hooks/useMidiInput';

interface IPianoKeyboardProps {
  activeNotes?: string[];          // Notes currently glowing/sounding
  selectedNotes?: string[];        // Notes selected by user
  disabled?: boolean;
  showLabels?: boolean;
  octaveRange?: [number, number];  // e.g. [4, 4] for 1 octave, [4, 5] for 2 octaves
  onKeyClick?: (note: string) => void;
  className?: string;
  enableMidiHighlight?: boolean;   // Auto-highlight keys pressed on physical MIDI keyboard
}

export const PianoKeyboard: React.FC<IPianoKeyboardProps> = ({
  activeNotes = [],
  selectedNotes = [],
  disabled = false,
  showLabels = true,
  octaveRange = [4, 4],
  onKeyClick,
  className = '',
  enableMidiHighlight = true
}) => {
  const { activeMidiNotes } = useMidiInput({
    autoPlayAudio: false // Prevent double sound if already played elsewhere
  });

  const mergedActiveNotes = useMemo(() => {
    if (!enableMidiHighlight || activeMidiNotes.length === 0) {
      return activeNotes;
    }
    const set = new Set([...activeNotes, ...activeMidiNotes]);
    return Array.from(set);
  }, [activeNotes, activeMidiNotes, enableMidiHighlight]);

  const [minOct, maxOct] = octaveRange;

  const filteredKeys = useMemo(() => {
    return PIANO_KEYS_88.filter(k => {
      const oct = parseInt(k.note.slice(-1), 10);
      return oct >= minOct && oct <= maxOct;
    });
  }, [minOct, maxOct]);

  // Separate white and black keys for proper positioning
  const whiteKeys = useMemo(() => filteredKeys.filter(k => !k.isBlack), [filteredKeys]);

  return (
    <div className={`relative flex justify-center items-end select-none p-3 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-full ${className}`}>
      <div className="relative flex items-end">
        {/* White Keys */}
        {whiteKeys.map((key) => {
          const isActive = mergedActiveNotes.includes(key.note);
          const isSelected = selectedNotes.includes(key.note);

          return (
            <button
              key={key.note}
              type="button"
              disabled={disabled}
              onClick={() => onKeyClick?.(key.note)}
              className={`relative w-10 sm:w-12 h-36 sm:h-44 rounded-b-lg border-r border-b border-l border-slate-300 transition-all duration-75 flex flex-col justify-end items-center pb-2.5 shadow-md active:scale-[0.98] ${
                isActive
                  ? 'bg-amber-400 border-amber-500 shadow-lg shadow-amber-400/50 scale-[0.99] z-10'
                  : isSelected
                  ? 'bg-emerald-400 border-emerald-500 shadow-md shadow-emerald-400/40'
                  : 'bg-gradient-to-b from-slate-100 to-white hover:from-slate-200 hover:to-slate-100'
              } ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              {showLabels && (
                <span className={`text-[11px] font-bold tracking-tight select-none ${
                  isActive || isSelected ? 'text-slate-950 font-black' : 'text-slate-600'
                }`}>
                  {key.note}
                </span>
              )}
            </button>
          );
        })}

        {/* Black Keys layer positioned absolutely above white keys */}
        <div className="absolute top-0 left-0 right-0 h-24 sm:h-28 flex pointer-events-none">
          {whiteKeys.map((wKey, index) => {
            // Check if there is an accidental after this white key
            const noteLetter = wKey.note.charAt(0);
            const oct = wKey.note.slice(-1);
            // Black keys exist after C, D, F, G, A
            const hasBlack = ['C', 'D', 'F', 'G', 'A'].includes(noteLetter);
            const blackNoteName = `${noteLetter}#${oct}`;
            const isBlackActive = mergedActiveNotes.includes(blackNoteName);
            const isBlackSelected = selectedNotes.includes(blackNoteName);

            if (!hasBlack) {
              return <div key={`spacer-${index}`} className="w-10 sm:w-12 pointer-events-none" />;
            }

            return (
              <div key={`wrapper-${wKey.note}`} className="w-10 sm:w-12 relative flex justify-end">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onKeyClick?.(blackNoteName)}
                  style={{ transform: 'translateX(50%)' }}
                  className={`pointer-events-auto absolute top-0 right-0 w-6 sm:w-7 h-24 sm:h-28 rounded-b-md z-20 transition-all duration-75 flex flex-col justify-end items-center pb-2 shadow-lg border-b-2 active:scale-[0.96] ${
                    isBlackActive
                      ? 'bg-amber-400 border-amber-500 shadow-amber-400/60'
                      : isBlackSelected
                      ? 'bg-emerald-400 border-emerald-500 shadow-emerald-400/50'
                      : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border-slate-700 hover:from-slate-800 hover:to-slate-700'
                  } ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                >
                  {showLabels && (
                    <span className={`text-[9px] font-bold select-none ${
                      isBlackActive || isBlackSelected ? 'text-slate-950 font-black' : 'text-slate-300'
                    }`}>
                      {blackNoteName.replace(/\d/, '')}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
