import React from 'react';
import { NumberParamField } from '@brain-exercises/shared';

interface NumberFieldProps {
  field: NumberParamField;
  value: number;
  onChange: (val: number) => void;
}

export const NumberField: React.FC<NumberFieldProps> = ({ field, value, onChange }) => {
  const step = field.step || 1;
  const currentVal = typeof value === 'number' && !Number.isNaN(value) ? value : field.default;

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-200 block">
            {field.labelVi}
          </label>
          {field.descriptionVi && (
            <p className="text-[11px] text-slate-400 mt-0.5">{field.descriptionVi}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700/60">
          <span className="text-sm font-mono font-bold text-emerald-400">
            {currentVal}
          </span>
          {field.unit && (
            <span className="text-[10px] text-slate-400 font-medium">
              {field.unit}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] font-mono text-slate-500">{field.min}</span>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={step}
          value={currentVal}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
        <span className="text-[10px] font-mono text-slate-500">{field.max}</span>
      </div>
    </div>
  );
};
