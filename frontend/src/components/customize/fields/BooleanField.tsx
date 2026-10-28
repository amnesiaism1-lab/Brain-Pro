import React from 'react';
import { BooleanParamField } from '@brain-exercises/shared';

interface BooleanFieldProps {
  field: BooleanParamField;
  value: boolean;
  onChange: (val: boolean) => void;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({ field, value, onChange }) => {
  const currentVal = typeof value === 'boolean' ? value : field.default;

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      <div className="pr-4">
        <label className="text-xs font-bold text-slate-200 block">
          {field.labelVi}
        </label>
        {field.descriptionVi && (
          <p className="text-[11px] text-slate-400 mt-0.5">{field.descriptionVi}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={currentVal}
        onClick={() => onChange(!currentVal)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          currentVal ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            currentVal ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
