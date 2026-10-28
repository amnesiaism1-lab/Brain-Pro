import React, { useMemo } from 'react';
import { NoteRefParamField, NOTE_NAMES, SOLFEGE_NAMES, NoteName } from '@brain-exercises/shared';

interface NotePickerFieldProps {
  field: NoteRefParamField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
}

export const NotePickerField: React.FC<NotePickerFieldProps> = ({ field, value, onChange }) => {
  const selectedList = useMemo<string[]>(() => {
    if (field.multi) {
      return Array.isArray(value) ? value : [value as string];
    }
    return typeof value === 'string' && value ? [value] : ['C'];
  }, [field.multi, value]);

  const handleSelectNote = (note: NoteName) => {
    if (!field.multi) {
      onChange(note);
      return;
    }

    if (selectedList.includes(note)) {
      if (selectedList.length > 1) {
        onChange(selectedList.filter(n => n !== note));
      }
    } else {
      onChange([...selectedList, note]);
    }
  };

  const selectNaturalNotes = () => {
    if (!field.multi) return;
    onChange(['C', 'D', 'E', 'F', 'G', 'A']);
  };

  const selectAll12Notes = () => {
    if (!field.multi) return;
    onChange([...NOTE_NAMES]);
  };

  return (
    <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-bold text-slate-200 block">
            {field.labelVi}
          </label>
          {field.descriptionVi && (
            <p className="text-[11px] text-slate-400 mt-0.5">{field.descriptionVi}</p>
          )}
        </div>

        {field.multi && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={selectNaturalNotes}
              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              6 Giọng Thuận (C-D-E-F-G-A)
            </button>
            <button
              type="button"
              onClick={selectAll12Notes}
              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Cả 12 Giọng
            </button>
          </div>
        )}
      </div>

      {/* 12-Tone Note Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 pt-1">
        {NOTE_NAMES.map((note, idx) => {
          const solfege = SOLFEGE_NAMES[idx];
          const isSelected = selectedList.includes(note);
          const isAccidental = note.includes('#');

          return (
            <button
              key={note}
              type="button"
              onClick={() => handleSelectNote(note)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500/70 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                  : isAccidental
                  ? 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-900'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm font-mono font-black">{note}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">{solfege}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
