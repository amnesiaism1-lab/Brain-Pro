import React from 'react';
import { EnumParamField } from '@brain-exercises/shared';

interface EnumFieldProps {
  field: EnumParamField;
  value: string;
  onChange: (val: string) => void;
}

export const EnumField: React.FC<EnumFieldProps> = ({ field, value, onChange }) => {
  const currentVal = value || field.default;

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      <div>
        <label className="text-xs font-bold text-slate-200 block">
          {field.labelVi}
        </label>
        {field.descriptionVi && (
          <p className="text-[11px] text-slate-400 mt-0.5">{field.descriptionVi}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {field.options.map((opt) => {
          const isSelected = currentVal === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold leading-tight">{opt.labelVi}</span>
              </div>
              {opt.descriptionVi && (
                <span className="text-[10px] text-slate-400 mt-1 pl-4 leading-snug">
                  {opt.descriptionVi}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
