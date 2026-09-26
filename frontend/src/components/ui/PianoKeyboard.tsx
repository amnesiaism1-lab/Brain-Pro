import React, { useMemo } from 'react';
import { Note } from 'tonal';
import { PIANO_KEYS_88 } from '../../services/musicTheoryService';
import { useMidiInput } from '../../hooks/useMidiInput';
import { auditoryEngine } from '../../services/auditoryEngine';

export interface IPianoKeyboardProps {
  activeNotes?: string[];          // Notes currently glowing/sounding
  selectedNotes?: string[];        // Notes selected by user (or correct target notes)
  wrongNotes?: string[];           // Notes selected wrongly (rendered in rose/red for immediate visual contrast)
  disabled?: boolean;
  showLabels?: boolean;
  octaveRange?: [number, number];  // e.g. [4, 4] for 1 octave, [4, 5] for 2 octaves
  onKeyClick?: (note: string) => void;
  className?: string;
  enableMidiHighlight?: boolean;   // Auto-highlight keys pressed on physical MIDI keyboard
  autoPlayAudio?: boolean;         // Auto play audio on MIDI or click (default true)
  showVelocityMeter?: boolean;     // Show real-time MIDI velocity touch readout (default true)
}

const BLACK_KEY_FLATS: Record<string, string> = {
  'C': 'Db',
  'D': 'Eb',
  'F': 'Gb',
  'G': 'Ab',
  'A': 'Bb'
};

export const PianoKeyboard: React.FC<IPianoKeyboardProps> = ({
  activeNotes = [],
  selectedNotes = [],
  wrongNotes = [],
  disabled = false,
  showLabels = true,
  octaveRange = [4, 4],
  onKeyClick,
  className = '',
  enableMidiHighlight = true,
  autoPlayAudio = true,
  showVelocityMeter = true
}) => {
  const { activeMidiNotes, lastMidiNote, lastVelocity, isConnected } = useMidiInput({
    autoPlayAudio: autoPlayAudio && !disabled
  });

  const handleKeyAction = (note: string) => {
    if (disabled) return;
    if (onKeyClick) {
      onKeyClick(note);
    } else if (autoPlayAudio) {
      auditoryEngine.resumeAudioContext().catch(() => {});
      auditoryEngine.playNote(note, 0.5, { volume: 0.5 });
    }
  };

  const isNoteInList = (keyNote: string, noteList: string[]): boolean => {
    if (!noteList || noteList.length === 0) return false;
    if (noteList.includes(keyNote)) return true;
    const keyMidi = Note.midi(keyNote);
    if (keyMidi !== null) {
      return noteList.some(n => Note.midi(n) === keyMidi);
    }
    return false;
  };

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
    <div className={`relative flex flex-col items-center select-none p-3.5 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-full ${className}`}>
      <div className="relative flex items-end">
        {/* White Keys */}
        {whiteKeys.map((key) => {
          const isActive = isNoteInList(key.note, mergedActiveNotes);
          const isSelected = isNoteInList(key.note, selectedNotes);
          const isWrong = isNoteInList(key.note, wrongNotes);

          // Find exact label in selectedNotes if enharmonically matched
          const keyMidi = Note.midi(key.note);
          const matchedSelected = selectedNotes.find(n => Note.midi(n) === keyMidi);
          const displayLabel = matchedSelected ? matchedSelected.replace(/\d/, '') : key.note;

          return (
            <button
              key={key.note}
              type="button"
              disabled={disabled}
              onClick={() => handleKeyAction(matchedSelected || key.note)}
              className={`relative w-10 sm:w-12 h-36 sm:h-44 rounded-b-lg border-r border-b border-l border-slate-300 transition-all duration-75 flex flex-col justify-end items-center pb-2.5 shadow-md active:scale-[0.98] ${
                isActive
                  ? 'bg-amber-400 border-amber-500 shadow-lg shadow-amber-400/50 scale-[0.99] z-10'
                  : isWrong
                  ? 'bg-rose-500 border-rose-600 shadow-md shadow-rose-500/50 text-white z-10'
                  : isSelected
                  ? 'bg-emerald-400 border-emerald-500 shadow-md shadow-emerald-400/40 text-slate-950 font-black'
                  : 'bg-gradient-to-b from-slate-100 to-white hover:from-slate-200 hover:to-slate-100'
              } ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              {showLabels && (
                <span className={`text-[11px] font-bold tracking-tight select-none ${
                  isWrong ? 'text-white font-black' : (isActive || isSelected ? 'text-slate-950 font-black' : 'text-slate-600')
                }`}>
                  {displayLabel}
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
            const flatNoteName = `${BLACK_KEY_FLATS[noteLetter]}${oct}`;
            
            const isBlackActive = isNoteInList(blackNoteName, mergedActiveNotes);
            const isBlackSelected = isNoteInList(blackNoteName, selectedNotes);
            const isBlackWrong = isNoteInList(blackNoteName, wrongNotes);

            if (!hasBlack) {
              return <div key={`spacer-${index}`} className="w-10 sm:w-12 pointer-events-none" />;
            }

            // Determine optimal label: if user's scale or active note uses flat, display flat!
            const keyMidi = Note.midi(blackNoteName);
            const matchedSelected = selectedNotes.find(n => Note.midi(n) === keyMidi);
            const matchedActive = mergedActiveNotes.find(n => Note.midi(n) === keyMidi);
            const relevantNote = matchedActive || matchedSelected;
            
            let labelText = `${noteLetter}#`;
            if (relevantNote && relevantNote.includes('b')) {
              labelText = BLACK_KEY_FLATS[noteLetter];
            } else if (relevantNote && relevantNote.includes('#')) {
              labelText = `${noteLetter}#`;
            } else {
              // Default shows both sharp & flat e.g. "A#/Bb"
              labelText = `${noteLetter}#/${BLACK_KEY_FLATS[noteLetter]}`;
            }

            return (
              <div key={`wrapper-${wKey.note}`} className="w-10 sm:w-12 relative flex justify-end">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleKeyAction(relevantNote || blackNoteName)}
                  style={{ transform: 'translateX(50%)' }}
                  className={`pointer-events-auto absolute top-0 right-0 w-6 sm:w-7 h-24 sm:h-28 rounded-b-md z-20 transition-all duration-75 flex flex-col justify-end items-center pb-2 shadow-lg border-b-2 active:scale-[0.96] ${
                    isBlackActive
                      ? 'bg-amber-400 border-amber-500 shadow-amber-400/60'
                      : isBlackWrong
                      ? 'bg-rose-600 border-rose-700 shadow-rose-600/60 text-white'
                      : isBlackSelected
                      ? 'bg-emerald-400 border-emerald-500 shadow-emerald-400/50 text-slate-950 font-black'
                      : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border-slate-700 hover:from-slate-800 hover:to-slate-700'
                  } ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                >
                  {showLabels && (
                    <span className={`text-[8px] sm:text-[9px] font-bold leading-tight select-none text-center px-0.5 ${
                      isBlackWrong ? 'text-white font-black' : (isBlackActive || isBlackSelected ? 'text-slate-950 font-black' : 'text-slate-300')
                    }`}>
                      {labelText}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time MIDI Velocity & Touch Dynamics Readout */}
      {showVelocityMeter && isConnected && lastMidiNote && lastVelocity !== null && (
        <div className="mt-3.5 pt-2.5 border-t border-white/10 w-full flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Nốt: <span className="text-white font-black">{lastMidiNote}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Lực gõ (Velocity): <strong className="text-amber-300 font-bold">{Math.round(lastVelocity * 127)}/127</strong> ({Math.round(lastVelocity * 100)}%)
          </span>
          <span className="text-slate-600">•</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
            lastVelocity > 0.8
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : lastVelocity > 0.45
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}>
            {lastVelocity > 0.8 ? 'Forte (Mạnh)' : lastVelocity > 0.45 ? 'Mezzo (Vừa)' : 'Piano (Nhẹ)'}
          </span>
        </div>
      )}
    </div>
  );
};
